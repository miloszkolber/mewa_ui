import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { executablePath } from './browser-support.mjs';
const root = path.resolve(import.meta.dirname, '..');
const distribution = path.join(root, 'dist');
const build = await Bun.build({
  entrypoints: [path.join(root, 'tests/runtime-contract.browser.js')],
  outdir: distribution,
  target: 'browser',
  external: ['/mewa-ui/*']
});
assert.equal(build.success, true, build.logs.map(String).join('\n'));
const server = Bun.serve({
  hostname: '127.0.0.1',
  port: 0,
  fetch(request) {
    const pathname = new URL(request.url).pathname;
    if (pathname === '/')
      return new Response('<!doctype html><html lang="en"><body></body></html>', {
        headers: { 'content-type': 'text/html' }
      });
    const filename = path.resolve(distribution, '.' + pathname);
    if (!filename.startsWith(distribution + path.sep) || !fs.existsSync(filename))
      return new Response('', { status: 404 });
    return new Response(Bun.file(filename));
  }
});
const browser = await puppeteer.launch({
  executablePath: executablePath(),
  headless: true,
  args: ['--no-sandbox']
});
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.port}/`);
  await page.evaluate(async () => {
    await import('/runtime-contract.browser.js');
  });
  const results = await page.evaluate(() => window.runtimeResults);
  for (const result of results)
    console.log(
      `${result.error ? 'FAIL' : 'PASS'} ${result.name}${result.error ? '\n' + result.error : ''}`
    );
  assert.equal(
    results.filter((result) => result.error).length,
    0,
    'native runtime contracts failed'
  );
} finally {
  await browser.close();
  server.stop(true);
}
