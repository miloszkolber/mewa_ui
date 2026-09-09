import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = path.resolve(import.meta.dirname, '..');
const coreRoot = path.join(root, 'dist', 'mewa-ui');
const iconsRoot = path.join(root, 'dist', 'mewa-icons');
const svelteRoot = path.join(root, 'dist', 'mewa-svelte');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'registry.json'), 'utf8'));
const workspacePackage = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const enhanced = registry.components.filter((component) => component.jsMode !== 'none');

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

function readJson(base, filename) {
  return JSON.parse(fs.readFileSync(path.join(base, filename), 'utf8'));
}

function walkFiles(base, relative = '') {
  return fs
    .readdirSync(path.join(base, relative), { withFileTypes: true })
    .flatMap((entry) => {
      const child = path.join(relative, entry.name);
      return entry.isDirectory() ? walkFiles(base, child) : [child];
    })
    .sort();
}

function verifyChecksums(base) {
  const checksums = readJson(base, 'checksums.json');
  const files = walkFiles(base).filter((filename) => filename !== 'checksums.json');
  assert.equal(checksums.algorithm, 'sha256');
  assert.deepEqual(Object.keys(checksums.files).sort(), files);
  files.forEach((filename) => {
    const digest = crypto
      .createHash('sha256')
      .update(fs.readFileSync(path.join(base, filename)))
      .digest('hex');
    assert.equal(checksums.files[filename], digest, `${filename}: checksum drift`);
  });
}

function assertLocalPath(base, owner, relativePath) {
  assert.equal(typeof relativePath, 'string', `${owner}: path must be a string`);
  assert(
    relativePath.startsWith('./') || !relativePath.startsWith('.'),
    `${owner}: malformed path ${relativePath}`
  );
  const filename = path.resolve(base, relativePath);
  const relative = path.relative(base, filename);
  assert(
    relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `${owner}: path escapes package`
  );
  assert(fs.existsSync(filename), `${owner}: missing ${relativePath}`);
  return filename;
}

function dependencyClosure(component, field, result = []) {
  for (const slug of component[field]) {
    const dependency = registry.components.find((entry) => entry.slug === slug);
    assert(dependency, `${component.slug}: unknown ${field} entry ${slug}`);
    dependencyClosure(dependency, field, result);
    if (!result.includes(slug)) result.push(slug);
  }
  return result;
}

await test('the core package is private, versioned, dependency-free, and export-mapped', () => {
  const packaged = readJson(coreRoot, 'package.json');
  assert.equal(
    workspacePackage.private,
    true,
    'the source workspace must remain blocked from npm publication'
  );
  assert.match(
    workspacePackage.version,
    /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/,
    'release version must be tag-safe semver'
  );
  assert.equal(packaged.name, 'mewa-ui');
  assert.equal(packaged.version, workspacePackage.version);
  assert.equal(
    packaged.private,
    true,
    'GitHub-only releases must stay blocked from npm publication'
  );
  assert.equal(packaged.type, 'module');
  assert.equal(packaged.dependencies, undefined);
  assert.equal(packaged.peerDependencies, undefined);
  assert(packaged.exports['./css/base.css']);
  assert(packaged.exports['./fonts/google-sans-code.css']);
  assert(packaged.exports['./manifest.json']);

  Object.entries(packaged.exports).forEach(([exportName, target]) => {
    const targets = typeof target === 'string' ? [target] : Object.values(target);
    targets.forEach((relativePath) =>
      assertLocalPath(coreRoot, `export ${exportName}`, relativePath)
    );
    if (typeof target === 'object' && target.import?.endsWith('.js')) {
      assert(
        target.types?.endsWith('.d.ts'),
        `${exportName}: JavaScript export is missing declarations`
      );
    }
  });
});

await test('the Svelte adapter is private, versioned, optional, and export-mapped', () => {
  const packaged = readJson(svelteRoot, 'package.json');
  assert.equal(packaged.name, 'mewa-svelte');
  assert.equal(packaged.version, workspacePackage.version);
  assert.equal(
    packaged.private,
    true,
    'GitHub-only adapters must stay blocked from registry publication'
  );
  assert.equal(packaged.type, 'module');
  assert.equal(packaged.dependencies, undefined);
  assert.deepEqual(packaged.peerDependencies, { svelte: '>=5.29.0 <6' });
  assert.equal(packaged.sideEffects, false);

  Object.entries(packaged.exports).forEach(([exportName, target]) => {
    const targets = typeof target === 'string' ? [target] : Object.values(target);
    targets.forEach((relativePath) =>
      assertLocalPath(svelteRoot, `Svelte export ${exportName}`, relativePath)
    );
    if (typeof target === 'object' && target.import?.endsWith('.js')) {
      assert(
        target.types?.endsWith('.d.ts'),
        `${exportName}: JavaScript export is missing declarations`
      );
    }
  });
});

await test('the package manifest exposes every component and its dependencies', () => {
  const manifest = readJson(coreRoot, 'manifest.json');
  assert.equal(manifest.version, workspacePackage.version);
  assert.equal(manifest.components.length, registry.components.length);

  registry.components.forEach((component) => {
    const packaged = manifest.components.find((entry) => entry.slug === component.slug);
    assert(packaged, `${component.slug}: missing manifest entry`);
    assert.deepEqual(packaged.styleDependencies, component.styleDependencies);
    assert.deepEqual(packaged.behaviorDependencies, component.behaviorDependencies);
    assert.deepEqual(packaged.assets, component.assets);
    assert(
      fs.existsSync(path.join(coreRoot, packaged.css)),
      `${component.slug}: missing CSS entry`
    );
    assert(
      fs.existsSync(path.join(coreRoot, `css/components/${component.slug}.css`)),
      `${component.slug}: missing source CSS copy`
    );
    assert.equal(Boolean(packaged.controller), component.jsMode !== 'none');
    assert.equal(Boolean(packaged.component), component.jsMode !== 'none');
    assert.equal(Boolean(packaged.auto), component.jsMode !== 'none');
    [packaged.css, packaged.controller, packaged.component, packaged.auto]
      .filter(Boolean)
      .forEach((relativePath) =>
        assertLocalPath(coreRoot, `${component.slug} manifest`, relativePath)
      );
  });

  Object.values(manifest.foundations)
    .flat()
    .forEach((relativePath) => {
      assertLocalPath(coreRoot, 'foundation manifest', relativePath);
    });
  Object.values(manifest.licenses).forEach((relativePath) => {
    assertLocalPath(coreRoot, 'license manifest', relativePath);
  });
});

await test('controller modules are side-effect-free and safe to import without a DOM', async () => {
  for (const component of enhanced) {
    const filename = path.join(coreRoot, `controllers/${component.slug}.js`);
    const source = fs.readFileSync(filename, 'utf8');
    assert(
      !source.includes('mewa:auto:'),
      `${component.slug}: auto marker escaped into controller`
    );
    assert(
      !source.includes('registerBehavior'),
      `${component.slug}: controller has an automatic side effect`
    );
    const module = await import(`${pathToFileURL(filename).href}?contract=${component.slug}`);
    assert.equal(typeof module.enhance, 'function', `${component.slug}: missing enhance export`);
    assert.equal(module.behavior?.name, component.slug, `${component.slug}: behavior name drift`);
    const types = fs.readFileSync(
      path.join(coreRoot, `controllers/${component.slug}.d.ts`),
      'utf8'
    );
    assert.equal(
      /declare function destroy\b/.test(types),
      typeof module.destroy === 'function',
      `${component.slug}: destroy type drift`
    );
  }
});

await test('component controllers compose declared behavior dependencies without side effects', async () => {
  for (const component of enhanced) {
    const filename = path.join(coreRoot, `components/${component.slug}.js`);
    const source = fs.readFileSync(filename, 'utf8');
    assert(
      !source.includes('registerBehavior'),
      `${component.slug}: component controller has an automatic side effect`
    );
    const module = await import(
      `${pathToFileURL(filename).href}?contract=component-${component.slug}`
    );
    const expected = [
      ...dependencyClosure(component, 'behaviorDependencies'),
      component.slug
    ].filter((slug) => registry.components.find((entry) => entry.slug === slug).jsMode !== 'none');
    assert.deepEqual(
      module.behaviors.map((entry) => entry.name),
      expected,
      `${component.slug}: behavior closure drift`
    );
    assert.equal(module.behavior.name, component.slug);
    assert.equal(typeof module.enhance, 'function');
    assert.equal(typeof module.destroy, 'function');
    assert.deepEqual(
      module.enhance(),
      [],
      `${component.slug}: component entry is not safe without a DOM`
    );
    module.destroy();
  }
});

await test('automatic enhancers are safe during server rendering', async () => {
  await import(`${pathToFileURL(path.join(coreRoot, 'auto.js')).href}?contract=all`);
});

await test('the shared enhancer observes one root once for every registered behavior', async () => {
  const runtime = await import(
    `${pathToFileURL(path.join(coreRoot, 'runtime/enhancer.js')).href}?contract=lifecycle`
  );
  const previousObserver = globalThis.MutationObserver;
  const calls = [];
  let callback;
  let observers = 0;

  globalThis.MutationObserver = class {
    constructor(next) {
      callback = next;
      observers += 1;
    }
    observe(root, options) {
      calls.push(['observe', root, options]);
    }
    disconnect() {
      calls.push(['disconnect']);
    }
  };

  try {
    const first = {
      name: 'first',
      enhance: (root) => calls.push(['first', root]),
      destroy: (root) => calls.push(['first:destroy', root])
    };
    const second = { name: 'second', enhance: (root) => calls.push(['second', root]) };
    const enhancer = runtime.createEnhancer([first, second]);
    const observedRoot = { id: 'document', contains: (node) => node === inserted };
    const inserted = { nodeType: 1 };
    const removed = { nodeType: 1 };

    enhancer.observe(observedRoot);
    enhancer.observe(observedRoot);
    assert.equal(observers, 1);
    callback([{ addedNodes: [inserted], removedNodes: [removed] }]);
    assert(calls.some(([name, root]) => name === 'first' && root === inserted));
    assert(calls.some(([name, root]) => name === 'second' && root === inserted));
    assert(calls.some(([name, root]) => name === 'first:destroy' && root === removed));
    enhancer.disconnect();
  } finally {
    if (previousObserver === undefined) delete globalThis.MutationObserver;
    else globalThis.MutationObserver = previousObserver;
  }
});

await test('an obsolete observer disposer cannot disconnect the current root', async () => {
  const runtime = await import(
    `${pathToFileURL(path.join(coreRoot, 'runtime/enhancer.js')).href}?contract=observer-token`
  );
  const previousObserver = globalThis.MutationObserver;
  const disconnected = [];

  globalThis.MutationObserver = class {
    constructor() {
      this.id = disconnected.length;
    }
    observe() {}
    disconnect() {
      disconnected.push(this);
    }
  };

  try {
    const enhancer = runtime.createEnhancer();
    const disposeFirst = enhancer.observe({ id: 'first-root' });
    const disposeSecond = enhancer.observe({ id: 'second-root' });
    assert.equal(disconnected.length, 1, 'switching roots must disconnect the first observer');
    disposeFirst();
    assert.equal(disconnected.length, 1, 'a stale disposer disconnected the current observer');
    disposeSecond();
    assert.equal(disconnected.length, 2, 'the current disposer did not disconnect its observer');
  } finally {
    if (previousObserver === undefined) delete globalThis.MutationObserver;
    else globalThis.MutationObserver = previousObserver;
  }
});

await test('a reusable enhancer never claims the global document', async () => {
  const runtime = await import(
    `${pathToFileURL(path.join(coreRoot, 'runtime/enhancer.js')).href}?contract=scoped`
  );
  const previousDocument = globalThis.document;
  const previousObserver = globalThis.MutationObserver;
  let enhanced = 0;
  let observed = 0;
  globalThis.document = { id: 'global-document' };
  globalThis.MutationObserver = class {
    constructor() {
      observed += 1;
    }
    observe() {}
    disconnect() {}
  };

  try {
    const enhancer = runtime.createEnhancer([
      {
        name: 'scoped',
        enhance: () => {
          enhanced += 1;
        }
      }
    ]);
    assert.equal(enhanced, 0, 'registration must not enhance the global document');
    assert.equal(observed, 0, 'registration must not observe the global document');
    enhancer.enhance({ id: 'application-root' });
    assert.equal(enhanced, 1);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousObserver === undefined) delete globalThis.MutationObserver;
    else globalThis.MutationObserver = previousObserver;
  }
});

await test('createController delegates updates and optional behavior cleanup', async () => {
  const runtime = await import(
    `${pathToFileURL(path.join(coreRoot, 'runtime/core.js')).href}?contract=controller`
  );
  const rootNode = { id: 'region' };
  const calls = [];
  const behavior = {
    name: 'sample',
    enhance: (root, options) => {
      calls.push(['enhance', root, options]);
      return options;
    },
    destroy: (root, state) => calls.push(['destroy', root, state])
  };
  const controller = runtime.createController(behavior, rootNode, { value: 1 });
  controller.update({ value: 2 });
  controller.destroy();
  controller.destroy();
  assert.deepEqual(calls, [
    ['enhance', rootNode, { value: 1 }],
    ['enhance', rootNode, { value: 2 }],
    ['destroy', rootNode, { value: 2 }]
  ]);
});

await test('fonts and icons stay optional', () => {
  const base = fs.readFileSync(path.join(coreRoot, 'css/base.css'), 'utf8');
  assert(!/@font-face\b/.test(base), 'base.css must not request bundled fonts');
  assert.match(
    fs.readFileSync(path.join(coreRoot, 'fonts/google-sans-code.css'), 'utf8'),
    /@font-face\b/
  );
  assert.match(
    fs.readFileSync(path.join(coreRoot, 'fonts/google-sans-code.css'), 'utf8'),
    /font-family:\s*"google-sans-code"/
  );
  assert(
    fs.statSync(path.join(coreRoot, 'fonts/google-sans-code.woff2')).isFile(),
    'Google Sans Code font asset must be packaged'
  );

  const sourceIcons = fs
    .readdirSync(path.join(root, registry.canonicalAssets.icons))
    .filter((name) => name.endsWith('.svg'))
    .sort();
  const packagedIcons = fs
    .readdirSync(path.join(iconsRoot, 'icons'))
    .filter((name) => name.endsWith('.svg'))
    .sort();
  const manifest = readJson(iconsRoot, 'manifest.json');
  assert.deepEqual(packagedIcons, sourceIcons);
  assert.equal(manifest.icons.length, sourceIcons.length);
  const iconsPackage = readJson(iconsRoot, 'package.json');
  assert.equal(iconsPackage.name, 'mewa-icons');
  assert.equal(manifest.name, iconsPackage.name);
  assert.equal(iconsPackage.private, true);
  assert.equal(iconsPackage.license, 'SEE LICENSE IN licenses/REMIX-ICON-LICENSE.txt');
  Object.values(manifest.licenses).forEach((relativePath) => {
    assertLocalPath(iconsRoot, 'icon license manifest', relativePath);
  });
  assert.match(
    fs.readFileSync(path.join(coreRoot, 'licenses/GOOGLE-SANS-CODE-OFL.txt'), 'utf8'),
    /SIL OPEN FONT LICENSE Version 1\.1/
  );
  assert.match(
    fs.readFileSync(path.join(coreRoot, 'licenses/REMIX-ICON-LICENSE.txt'), 'utf8'),
    /Remix Icon License v1\.0/
  );
  const iconExport = iconsPackage.exports['./*.svg'];
  assert.equal(iconExport, './icons/*.svg');
  packagedIcons.forEach((filename) => {
    assertLocalPath(
      iconsRoot,
      `icon export ${filename}`,
      iconExport.replace('*', filename.replace(/\.svg$/, ''))
    );
  });
  for (const exportName of [
    './licenses/REMIX-ICON-LICENSE.txt',
    './LICENSE',
    './manifest.json',
    './checksums.json'
  ]) {
    assertLocalPath(iconsRoot, `icon export ${exportName}`, iconsPackage.exports[exportName]);
  }
});

await test('all generated CSS references resolve inside the core package', () => {
  for (const relativePath of walkFiles(path.join(coreRoot, 'css')).filter((filename) =>
    filename.endsWith('.css')
  )) {
    const filename = path.join(coreRoot, 'css', relativePath);
    const source = fs.readFileSync(filename, 'utf8');
    for (const match of source.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]\)?/g)) {
      assertLocalPath(path.dirname(filename), `${relativePath} import`, match[1]);
    }
    for (const match of source.matchAll(/url\(['"]?([^)'"]+)['"]?\)/g)) {
      const reference = match[1];
      if (/^(?:data:|https?:|\/\/|#)/.test(reference)) continue;
      assertLocalPath(path.dirname(filename), `${relativePath} URL`, reference);
    }
  }

  for (const relativePath of walkFiles(path.join(coreRoot, 'fonts')).filter((filename) =>
    filename.endsWith('.css')
  )) {
    const filename = path.join(coreRoot, 'fonts', relativePath);
    const source = fs.readFileSync(filename, 'utf8');
    for (const match of source.matchAll(/url\(['"]?([^)'"]+)['"]?\)/g)) {
      assertLocalPath(path.dirname(filename), `${relativePath} font URL`, match[1]);
    }
  }
});

await test('each component stylesheet entry contains exactly its declared dependency closure', () => {
  for (const component of registry.components) {
    const source = fs.readFileSync(path.join(coreRoot, `css/${component.slug}.css`), 'utf8');
    const imports = Array.from(
      source.matchAll(/@import\s+"\.\/components\/([^"/]+)\.css";/g),
      (match) => match[1]
    );
    const expected = [...dependencyClosure(component, 'styleDependencies'), component.slug];
    assert.deepEqual(imports, expected, `${component.slug}: generated style closure drift`);
  }
});

await test('packaged SVG icons contain no executable or remote content', () => {
  for (const filename of fs.readdirSync(path.join(iconsRoot, 'icons'))) {
    const fullPath = path.join(iconsRoot, 'icons', filename);
    const stat = fs.lstatSync(fullPath);
    assert(stat.isFile() && !stat.isSymbolicLink(), `${filename}: icon must be a regular file`);
    assert.equal(stat.mode & 0o111, 0, `${filename}: icon must not be executable`);
    const source = fs.readFileSync(fullPath, 'utf8');
    assert(!/<script\b/i.test(source), `${filename}: script element is forbidden`);
    assert(!/\son[a-z]+\s*=/i.test(source), `${filename}: event handler is forbidden`);
    assert(
      !/(?:href|xlink:href)\s*=\s*['"](?:https?:|\/\/|javascript:|data:text\/html)/i.test(source),
      `${filename}: remote or executable reference is forbidden`
    );
    assert.match(
      source,
      /\bfill="currentColor"/,
      `${filename}: Remix icons must use currentColor fill`
    );
    assert(
      !/\bstroke(?:-width|-linecap|-linejoin)?\s*=/.test(source),
      `${filename}: Remix icons must not carry stroke presentation attributes`
    );
  }
});

await test('generated packages contain no development or documentation trees', () => {
  for (const base of [coreRoot, iconsRoot, svelteRoot]) {
    const topLevel = fs.readdirSync(base);
    for (const name of ['docs', 'tests', 'scripts', 'node_modules', '.github']) {
      assert(!topLevel.includes(name), `${path.basename(base)}: unexpected ${name}`);
    }
  }
});

await test('complete optional bundles stay within compressed size budgets', () => {
  const allCss = gzipSync(fs.readFileSync(path.join(coreRoot, 'css/all.css'))).byteLength;
  const controllers = Buffer.concat(
    enhanced.map((component) =>
      fs.readFileSync(path.join(coreRoot, `controllers/${component.slug}.js`))
    )
  );
  const allControllers = gzipSync(controllers).byteLength;
  const enhancer = gzipSync(fs.readFileSync(path.join(coreRoot, 'runtime/enhancer.js'))).byteLength;
  const svelteAttachment = gzipSync(fs.readFileSync(path.join(svelteRoot, 'index.js'))).byteLength;
  const sveltePlugin = gzipSync(fs.readFileSync(path.join(svelteRoot, 'bun-plugin.js'))).byteLength;
  assert(allCss <= 50 * 1024, `css/all.css is ${allCss} compressed bytes`);
  assert(allControllers <= 50 * 1024, `all controllers are ${allControllers} compressed bytes`);
  const individualControllers = enhanced.reduce(
    (total, component) =>
      total +
      gzipSync(fs.readFileSync(path.join(coreRoot, `controllers/${component.slug}.js`))).byteLength,
    0
  );
  assert(
    individualControllers <= 75 * 1024,
    `separate controller responses are ${individualControllers} compressed bytes`
  );
  assert(enhancer <= 3 * 1024, `shared enhancer is ${enhancer} compressed bytes`);
  assert(svelteAttachment <= 1024, `Svelte attachment is ${svelteAttachment} compressed bytes`);
  assert(sveltePlugin <= 1024, `Svelte Bun plugin is ${sveltePlugin} compressed bytes`);
});

await test('all generated packages have complete SHA-256 manifests', () => {
  verifyChecksums(coreRoot);
  verifyChecksums(iconsRoot);
  verifyChecksums(svelteRoot);
});

await test('controllers share a root until the final owner releases it', async () => {
  const { createController } = await import(
    pathToFileURL(path.join(coreRoot, 'runtime/core.js')).href
  );
  let mounted = 0;
  let released = 0;
  const behavior = {
    name: 'shared',
    enhance() {
      mounted++;
    },
    destroy() {
      released++;
    }
  };
  const element = {};
  const first = createController(behavior, element);
  const second = createController(behavior, element);
  assert.equal(mounted, 1);
  first.destroy();
  assert.equal(released, 0);
  second.destroy();
  second.destroy();
  assert.equal(released, 1);
});

await test('failed setup rolls back resources and permits retry', async () => {
  const { createController } = await import(
    pathToFileURL(path.join(coreRoot, 'runtime/core.js')).href
  );
  let live = 0;
  let fail = true;
  const element = {};
  const behavior = {
    name: 'failing',
    enhance() {
      live++;
      if (fail) throw new Error('setup');
    },
    destroy() {
      live--;
    }
  };
  assert.throws(() => createController(behavior, element), /setup/);
  assert.equal(live, 0);
  fail = false;
  createController(behavior, element).destroy();
  assert.equal(live, 0);
});

await test('enhancer cleanup continues after a behavior fails', async () => {
  const { createEnhancer } = await import(
    pathToFileURL(path.join(coreRoot, 'runtime/enhancer.js')).href
  );
  const calls = [];
  const enhancer = createEnhancer([
    {
      name: 'first',
      enhance() {},
      destroy() {
        calls.push('first');
      }
    },
    {
      name: 'second',
      enhance() {},
      destroy() {
        calls.push('second');
        throw new Error('cleanup');
      }
    }
  ]);
  assert.throws(() => enhancer.destroy({}), AggregateError);
  assert.deepEqual(calls, ['second', 'first']);
});

if (failures) process.exitCode = 1;
