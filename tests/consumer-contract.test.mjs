import { launchOptions } from './browser-support.mjs';
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { checkReactiveAttachments } from './svelte-browser-support.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const current = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).devDependencies
  .svelte;
for (const version of new Set(['5.29.0', current])) {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'mewa-consumer-'));
  try {
    fs.mkdirSync(path.join(scratch, 'vendor'));
    for (const name of ['mewa-ui', 'mewa-svelte']) {
      const archive = path.join(scratch, `${name}.tar.gz`);
      const packed = Bun.spawnSync(['tar', '-czf', archive, '-C', path.join(root, 'dist'), name]);
      assert.equal(packed.exitCode, 0, packed.stderr.toString());
      const extracted = Bun.spawnSync(['tar', '-xzf', archive, '-C', path.join(scratch, 'vendor')]);
      assert.equal(extracted.exitCode, 0, extracted.stderr.toString());
    }
    fs.cpSync(path.join(root, 'tests/fixtures/svelte-bun'), path.join(scratch, 'app'), {
      recursive: true
    });
    for (const name of ['App.svelte', 'index.html']) {
      const filename = path.join(scratch, 'app', name);
      fs.writeFileSync(
        filename,
        fs.readFileSync(filename, 'utf8').replaceAll('../../../dist/', '../vendor/')
      );
    }
    fs.writeFileSync(
      path.join(scratch, 'package.json'),
      JSON.stringify({ private: true, type: 'module', dependencies: { svelte: version } })
    );
    const install = Bun.spawn([process.execPath, 'install', '--ignore-scripts'], {
      cwd: scratch,
      stdout: 'pipe',
      stderr: 'pipe'
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(install.stdout).text(),
      new Response(install.stderr).text(),
      install.exited
    ]);
    assert.equal(code, 0, stdout + stderr);
    const { sveltePlugin } = await import(
      pathToFileURL(path.join(scratch, 'vendor/mewa-svelte/bun-plugin.js')).href
    );
    const warnings = [];
    const result = await Bun.build({
      entrypoints: [path.join(scratch, 'app/index.html')],
      outdir: path.join(scratch, 'public'),
      target: 'browser',
      plugins: [sveltePlugin({ onwarn: (warning) => warnings.push(warning) })]
    });
    assert.equal(result.success, true, result.logs.map(String).join('\n'));
    assert.deepEqual(warnings, [], `Svelte ${version} compiler warnings`);
    const { behavior } = await import(
      pathToFileURL(path.join(scratch, 'vendor/mewa-ui/components/toggle.js')).href
    );
    assert.equal(behavior.name, 'toggle');
    const output = path.join(scratch, 'public');
    const server = Bun.serve({
      hostname: '127.0.0.1',
      port: 0,
      fetch(request) {
        const pathname = new URL(request.url).pathname;
        const filename = path.resolve(output, '.' + (pathname === '/' ? '/index.html' : pathname));
        if (!filename.startsWith(output + path.sep) || !fs.existsSync(filename))
          return new Response('', { status: 404 });
        return new Response(Bun.file(filename));
      }
    });
    const browser = await puppeteer.launch(launchOptions());
    try {
      const page = await browser.newPage();
      await page.goto(`http://127.0.0.1:${server.port}/`);
      await page.waitForSelector('[data-mewa-toggle-init]');
      await checkReactiveAttachments(page);
      await page.click('[data-counter]');
      assert.equal(
        await page.$eval('[data-counter]', (element) => element.textContent.trim()),
        'Count: 1'
      );
      await page.click('[data-mount-toggle]');
      await page.waitForFunction(() => !document.querySelector('[data-mewa-toggle]'));
      await page.click('[data-mount-toggle]');
      await page.waitForSelector('[data-mewa-toggle-init]');
      await page.click('[data-mewa-toggle]');
      assert.equal(
        await page.$eval('[data-mewa-toggle]', (element) => element.getAttribute('aria-pressed')),
        'true'
      );
    } finally {
      await browser.close();
      server.stop(true);
    }
    console.log(`PASS isolated archive build and browser consumer with Svelte ${version}`);
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}
