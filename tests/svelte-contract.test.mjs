import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = path.resolve(import.meta.dirname, '..');
const adapterRoot = path.join(root, 'dist', 'mewa-svelte');
const smokeSourceRoot = path.join(root, 'tests', 'fixtures', 'svelte-bun');
const smokeOutputRoot = path.join(root, 'dist', 'svelte-smoke');
const workspacePackage = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

let failures = 0;

async function test(name, callback) {
  try {
    await callback();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}\n  ${error.message}`);
  }
}

await test('the Svelte attachment follows Mewa setup and cleanup', async () => {
  const { attachBehavior, mewa } = await import(
    `${pathToFileURL(path.join(adapterRoot, 'index.js')).href}?contract=attachment`
  );
  assert.equal(attachBehavior, mewa);

  const calls = [];
  const element = { id: 'attached-region' };
  const options = { density: 'compact' };
  const behavior = {
    name: 'sample',
    enhance(rootNode, receivedOptions) {
      calls.push(['enhance', rootNode, receivedOptions]);
      return { initialized: true };
    },
    destroy(rootNode, state) {
      calls.push(['destroy', rootNode, state]);
    }
  };

  const cleanup = mewa(behavior, options)(element);
  cleanup();
  cleanup();

  assert.deepEqual(calls, [
    ['enhance', element, options],
    ['destroy', element, { initialized: true }]
  ]);
  assert.throws(() => mewa({}), /requires a Mewa behavior/);
});

await test('the adapter package is private, optional, and version-aligned', () => {
  const packaged = JSON.parse(fs.readFileSync(path.join(adapterRoot, 'package.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(adapterRoot, 'manifest.json'), 'utf8'));

  assert.equal(packaged.name, 'mewa-svelte');
  assert.equal(packaged.version, workspacePackage.version);
  assert.equal(packaged.private, true);
  assert.equal(packaged.type, 'module');
  assert.equal(packaged.dependencies, undefined);
  assert.deepEqual(packaged.peerDependencies, { svelte: '>=5.29.0 <6' });
  assert.equal(packaged.exports['.'].import, './index.js');
  assert.equal(packaged.exports['./bun-plugin.js'].import, './bun-plugin.js');
  assert.equal(manifest.version, workspacePackage.version);
  assert.equal(manifest.framework, 'svelte');
  assert.equal(manifest.frameworkRange, '>=5.29.0 <6');
  assert.equal(manifest.builder, 'bun');
  assert.equal(manifest.corePackage, 'mewa-ui');
});

await test('Bun compiles the Svelte fixture without Vite', async () => {
  const { sveltePlugin } = await import(
    `${pathToFileURL(path.join(adapterRoot, 'bun-plugin.js')).href}?contract=plugin`
  );
  fs.rmSync(smokeOutputRoot, { recursive: true, force: true });

  const result = await Bun.build({
    entrypoints: [path.join(smokeSourceRoot, 'index.html')],
    outdir: smokeOutputRoot,
    minify: true,
    plugins: [sveltePlugin()],
    target: 'browser'
  });

  assert.equal(result.success, true, result.logs.map(String).join('\n'));
  assert(
    fs.existsSync(path.join(smokeOutputRoot, 'index.html')),
    'Bun did not emit the HTML entry'
  );
  assert(
    fs.readdirSync(smokeOutputRoot).some((name) => name.endsWith('.js')),
    'Bun did not emit JavaScript'
  );

  const smokeFiles = fs.readdirSync(smokeOutputRoot);
  const compressedJavaScript = smokeFiles
    .filter((name) => name.endsWith('.js'))
    .reduce(
      (total, name) =>
        total + gzipSync(fs.readFileSync(path.join(smokeOutputRoot, name))).byteLength,
      0
    );
  const compressedCss = smokeFiles
    .filter((name) => name.endsWith('.css'))
    .reduce(
      (total, name) =>
        total + gzipSync(fs.readFileSync(path.join(smokeOutputRoot, name))).byteLength,
      0
    );
  assert(
    // Includes keyed/reordered controls, reactive attachment options and native bindings.
    compressedJavaScript <= 24 * 1024,
    `Svelte fixture JavaScript is ${compressedJavaScript} compressed bytes`
  );
  assert(compressedCss <= 5 * 1024, `Svelte fixture CSS is ${compressedCss} compressed bytes`);

  const workspaceDependencies = {
    ...workspacePackage.dependencies,
    ...workspacePackage.devDependencies,
    ...workspacePackage.peerDependencies
  };
  const adapterPackage = JSON.parse(
    fs.readFileSync(path.join(adapterRoot, 'package.json'), 'utf8')
  );
  const adapterDependencies = {
    ...adapterPackage.dependencies,
    ...adapterPackage.devDependencies,
    ...adapterPackage.peerDependencies
  };
  assert.equal(workspaceDependencies.vite, undefined);
  assert.equal(workspaceDependencies['@sveltejs/kit'], undefined);
  assert.equal(adapterDependencies.vite, undefined);
  assert.equal(adapterDependencies['@sveltejs/kit'], undefined);

  const pluginSource = fs.readFileSync(path.join(adapterRoot, 'bun-plugin.js'), 'utf8');
  assert(
    !/from\s+["'](?:vite|@sveltejs\/kit)["']/.test(pluginSource),
    'the adapter imports Vite or SvelteKit'
  );
});

await test('Bun forwards located Svelte warnings and fails invalid source', async () => {
  const { sveltePlugin } = await import(
    pathToFileURL(path.join(adapterRoot, 'bun-plugin.js')).href
  );
  const scratch = fs.mkdtempSync(path.join(root, 'dist', 'svelte-diagnostics-'));
  try {
    const component = path.join(scratch, 'Probe.svelte');
    const source =
      '<script>let count = $state(0);</script>\n<button onclick={() => count++}>{count}</button>\n<img src="test.png">';
    fs.writeFileSync(component, source);
    const warnings = [];
    const result = await Bun.build({
      entrypoints: [component],
      target: 'browser',
      sourcemap: 'external',
      plugins: [sveltePlugin({ dev: true, onwarn: (warning) => warnings.push(warning) })]
    });
    assert.equal(result.success, true, result.logs.map(String).join('\n'));
    assert(
      warnings.some(
        (warning) => warning.code === 'a11y_missing_attribute' && warning.start?.line === 3
      )
    );
    fs.writeFileSync(component, '<script>let = ;</script>');
    await assert.rejects(
      () => Bun.build({ entrypoints: [component], plugins: [sveltePlugin()] }),
      /Bundle failed/
    );
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
});

if (failures) process.exitCode = 1;
