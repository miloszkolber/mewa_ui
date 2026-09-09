import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distributionRoot = path.join(root, 'dist');
fs.mkdirSync(distributionRoot, { recursive: true });
const outputRoot = fs.mkdtempSync(path.join(distributionRoot, '.build-'));
process.on('exit', () => fs.rmSync(outputRoot, { recursive: true, force: true }));
const coreRoot = path.join(outputRoot, 'mewa-ui');
const iconsRoot = path.join(outputRoot, 'mewa-icons');
const svelteRoot = path.join(outputRoot, 'mewa-svelte');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'registry.json'), 'utf8'));
const workspacePackage = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
let source = { revision: null, dirty: null, url: null };
try {
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  }).trim();
  const dirty = Boolean(
    execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
  );
  source = {
    revision,
    dirty,
    url: dirty ? null : `https://github.com/miloszkolber/mewa_ui/blob/${revision}/`
  };
} catch {
  // Source archives without Git metadata still build; do not invent an immutable revision.
}
const componentBySlug = new Map(
  registry.components.map((component) => [component.slug, component])
);
const autoSection = /\/\* mewa:auto:start \*\/[\s\S]*?\/\* mewa:auto:end \*\//g;

if (path.dirname(outputRoot) !== distributionRoot || path.dirname(distributionRoot) !== root) {
  throw new Error(`Refusing to replace unsafe output path: ${outputRoot}`);
}

function mkdir(filename) {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
}

function resolveInside(base, relativePath, label) {
  if (typeof relativePath !== 'string' || relativePath.length === 0) {
    throw new Error(`${label} must be a non-empty relative path`);
  }
  const filename = path.resolve(base, relativePath);
  const relative = path.relative(base, filename);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} escapes ${base}: ${relativePath}`);
  }
  return filename;
}

function write(base, relativePath, content) {
  const filename = resolveInside(base, relativePath, 'output path');
  mkdir(filename);
  fs.writeFileSync(filename, content.endsWith('\n') ? content : `${content}\n`);
}

function copy(base, relativePath, sourcePath) {
  const filename = resolveInside(base, relativePath, 'output path');
  const source = resolveInside(root, sourcePath, 'source path');
  mkdir(filename);
  fs.copyFileSync(source, filename);
}

function componentDependencies(component, field) {
  const dependencies = component[field] || [];
  if (!Array.isArray(dependencies)) throw new Error(`${component.slug}: ${field} must be an array`);
  dependencies.forEach((slug) => {
    if (!componentBySlug.has(slug))
      throw new Error(`${component.slug}: unknown ${field} entry ${slug}`);
    if (slug === component.slug)
      throw new Error(`${component.slug}: ${field} cannot reference itself`);
  });
  return dependencies;
}

function dependencyClosure(component, field, visiting = new Set(), result = []) {
  if (visiting.has(component.slug)) {
    throw new Error(
      `${field} cycle includes ${Array.from(visiting).join(' -> ')} -> ${component.slug}`
    );
  }
  visiting.add(component.slug);
  for (const slug of componentDependencies(component, field)) {
    const dependency = componentBySlug.get(slug);
    dependencyClosure(dependency, field, visiting, result);
    if (!result.includes(slug)) result.push(slug);
  }
  visiting.delete(component.slug);
  return result;
}

function packageExports() {
  const exports = {
    '.': { types: './index.d.ts', import: './index.js', default: './index.js' },
    './runtime/core.js': { types: './runtime/core.d.ts', import: './runtime/core.js' },
    './runtime/enhancer.js': { types: './runtime/enhancer.d.ts', import: './runtime/enhancer.js' },
    './auto.js': { types: './auto.d.ts', import: './auto.js' },
    './css/base.css': './css/base.css',
    './css/tokens.css': './css/tokens.css',
    './css/all.css': './css/all.css',
    './fonts/google-sans-code.css': './fonts/google-sans-code.css',
    './fonts/google-sans-code.woff2': './fonts/google-sans-code.woff2',
    './licenses/GOOGLE-SANS-CODE-OFL.txt': './licenses/GOOGLE-SANS-CODE-OFL.txt',
    './licenses/REMIX-ICON-LICENSE.txt': './licenses/REMIX-ICON-LICENSE.txt',
    './LICENSE': './LICENSE',
    './manifest.json': './manifest.json',
    './checksums.json': './checksums.json'
  };

  for (const component of registry.components) {
    exports[`./css/${component.slug}.css`] = `./css/${component.slug}.css`;
    if (component.jsMode !== 'none') {
      exports[`./controllers/${component.slug}.js`] = {
        types: `./controllers/${component.slug}.d.ts`,
        import: `./controllers/${component.slug}.js`
      };
      exports[`./components/${component.slug}.js`] = {
        types: `./components/${component.slug}.d.ts`,
        import: `./components/${component.slug}.js`
      };
      exports[`./auto/${component.slug}.js`] = {
        types: `./auto/${component.slug}.d.ts`,
        import: `./auto/${component.slug}.js`
      };
    }
  }
  return exports;
}

function stripFontFaces(source) {
  const faces = Array.from(source.matchAll(/@font-face\s*\{[\s\S]*?\}/g), (match) => match[0]);
  if (faces.length !== 1)
    throw new Error(`Expected one font face in library/src/base.css, found ${faces.length}`);
  return {
    base: source.replace(/\s*@font-face\s*\{[\s\S]*?\}\s*/g, '\n').trimStart(),
    mono: faces[0].replace('url("google-sans-code.woff2")', 'url("./google-sans-code.woff2")')
  };
}

function controllerSource(component) {
  const filename = resolveInside(root, component.files.js, `${component.slug} controller path`);
  const source = fs.readFileSync(filename, 'utf8');
  const sections = source.match(autoSection) || [];
  if (sections.length !== 2) {
    throw new Error(
      `${component.files.js}: expected two mewa:auto sections, found ${sections.length}`
    );
  }
  const output = source
    .replace(autoSection, '')
    .replaceAll('../../runtime/core.js', '../runtime/core.js')
    .trim();
  if (!/export\s+(?:\{[^}]*\benhance\b[^}]*\}|(?:const|function)\s+enhance\b)/s.test(output)) {
    throw new Error(`${component.files.js}: missing enhance export`);
  }
  if (!/export\s+const\s+behavior\b/.test(output)) {
    throw new Error(`${component.files.js}: missing behavior export`);
  }
  return output;
}

function componentControllerSource(component) {
  const slugs = [...dependencyClosure(component, 'behaviorDependencies'), component.slug].filter(
    (slug) => componentBySlug.get(slug).jsMode !== 'none'
  );
  const imports = slugs
    .map(
      (slug, index) => `import { behavior as behavior${index} } from "../controllers/${slug}.js";`
    )
    .join('\n');
  const references = slugs.map((_, index) => `behavior${index}`).join(', ');

  return `${imports}
import { acquireBehavior } from "../runtime/core.js";

export const behaviors = Object.freeze([${references}]);
const leasesByRoot = new WeakMap();

export function enhance(root, options) {
  const scope = root || (typeof document === "undefined" ? null : document);
  if (!scope) return [];
  let leases = leasesByRoot.get(scope);
  if (leases) {
    for (const lease of leases) lease.update(options);
  } else {
    leases = [];
    try {
      for (const entry of behaviors) leases.push(acquireBehavior(entry, scope, options));
    } catch (error) {
      const errors = [error];
      for (const lease of leases.reverse()) {
        try { lease.destroy(); } catch (cleanupError) { errors.push(cleanupError); }
      }
      if (errors.length > 1) throw new AggregateError(errors, 'Component setup failed');
      throw error;
    }
    leasesByRoot.set(scope, leases);
  }
  return leases.map((lease) => lease.state);
}

export function destroy(root) {
  const scope = root || (typeof document === "undefined" ? null : document);
  if (!scope) return;
  const leases = leasesByRoot.get(scope) || [];
  leasesByRoot.delete(scope);
  const errors = [];
  for (const lease of leases.reverse()) {
    try { lease.destroy(); } catch (error) { errors.push(error); }
  }
  if (errors.length) throw new AggregateError(errors, 'Component cleanup failed');
}

export const behavior = { name: ${JSON.stringify(component.slug)}, enhance, destroy };`;
}

function walkFiles(base, relative = '') {
  const directory = resolveInside(base, relative || '.', 'walk path');
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const child = path.join(relative, entry.name);
      return entry.isDirectory() ? walkFiles(base, child) : [child];
    })
    .sort();
}

function writeChecksums(base) {
  const checksums = {};
  for (const relativePath of walkFiles(base)) {
    if (relativePath === 'checksums.json') continue;
    const content = fs.readFileSync(path.join(base, relativePath));
    checksums[relativePath] = crypto.createHash('sha256').update(content).digest('hex');
  }
  write(base, 'checksums.json', JSON.stringify({ algorithm: 'sha256', files: checksums }, null, 2));
}

fs.mkdirSync(coreRoot, { recursive: true });
fs.mkdirSync(iconsRoot, { recursive: true });
fs.mkdirSync(svelteRoot, { recursive: true });

const baseSource = fs.readFileSync(
  resolveInside(root, 'library/src/base.css', 'base stylesheet path'),
  'utf8'
);
const tokenSource = fs.readFileSync(
  resolveInside(root, 'library/src/tokens.css', 'token stylesheet path'),
  'utf8'
);
const fonts = stripFontFaces(baseSource);
write(coreRoot, 'css/base.css', fonts.base);
write(coreRoot, 'css/tokens.css', tokenSource);
write(coreRoot, 'fonts/google-sans-code.css', `${fonts.mono}\n`);
copy(coreRoot, 'fonts/google-sans-code.woff2', 'library/src/google-sans-code.woff2');
copy(
  coreRoot,
  'licenses/GOOGLE-SANS-CODE-OFL.txt',
  registry.canonicalAssets.licenses.googleSansCode
);
copy(coreRoot, 'licenses/REMIX-ICON-LICENSE.txt', registry.canonicalAssets.licenses.remixIcon);

const allCss = [
  '/* mewa_ui generated complete stylesheet. Fonts remain opt-in. */',
  fonts.base.trim(),
  tokenSource.trim()
];

for (const component of registry.components) {
  const source = fs
    .readFileSync(
      resolveInside(root, component.files.css, `${component.slug} stylesheet path`),
      'utf8'
    )
    .trim();
  write(coreRoot, `css/components/${component.slug}.css`, source);
  allCss.push(source);

  const dependencies = dependencyClosure(component, 'styleDependencies');
  const imports = [...dependencies, component.slug]
    .map((slug) => `@import "./components/${slug}.css";`)
    .join('\n');
  write(
    coreRoot,
    `css/${component.slug}.css`,
    `/* mewa_ui generated ${component.slug} stylesheet entry. */\n${imports}`
  );
}
write(coreRoot, 'css/all.css', allCss.join('\n\n'));

copy(coreRoot, 'runtime/core.js', 'library/runtime/core.js');
copy(coreRoot, 'runtime/enhancer.js', 'library/runtime/enhancer.js');
copy(coreRoot, 'runtime/core.d.ts', 'library/runtime/core.d.ts');
copy(coreRoot, 'runtime/behavior.d.ts', 'library/runtime/behavior.d.ts');
copy(coreRoot, 'runtime/events.d.ts', 'library/runtime/events.d.ts');
write(
  coreRoot,
  'runtime/enhancer.d.ts',
  `
import type { MewaBehavior } from "./core.js";

export interface MewaEnhancer {
  register(behavior: MewaBehavior): () => void;
  enhance(root?: ParentNode): void;
  destroy(root: ParentNode): void;
  observe(root?: Node): () => void;
  disconnect(): void;
  readonly behaviors: MewaBehavior[];
}

export declare function createEnhancer(initialBehaviors?: MewaBehavior[]): MewaEnhancer;
export declare function registerBehavior(behavior: MewaBehavior): () => void;
export declare function enhance(root?: ParentNode): void;
export declare function observe(root?: Node): () => void;
export declare function disconnect(): void;
`.trim()
);
write(
  coreRoot,
  'index.js',
  `
export { createController, queryAll } from "./runtime/core.js";
export { createEnhancer } from "./runtime/enhancer.js";
`.trim()
);
write(
  coreRoot,
  'index.d.ts',
  `
export type { MewaBehavior, MewaController } from "./runtime/core.js";
export type { MewaEventMap, ToastApi, ToastOptions } from "./runtime/events.js";
export { createController, queryAll } from "./runtime/core.js";
export type { MewaEnhancer } from "./runtime/enhancer.js";
export { createEnhancer } from "./runtime/enhancer.js";
`.trim()
);

const autoImports = [];
for (const component of registry.components.filter((entry) => entry.jsMode !== 'none')) {
  const controller = controllerSource(component);
  const destroyType = /export\s+function\s+destroy\b/.test(controller)
    ? '\nexport declare function destroy(root?: ParentNode): void;'
    : '';
  write(coreRoot, `controllers/${component.slug}.js`, controller);
  write(
    coreRoot,
    `controllers/${component.slug}.d.ts`,
    `
import type { MewaBehavior } from "../runtime/core.js";

export declare function enhance(root?: ParentNode): ${component.slug === 'toast' ? 'import("../runtime/events.js").ToastApi | undefined' : 'unknown'};${destroyType}
export declare const behavior: MewaBehavior;
`.trim()
  );
  write(coreRoot, `components/${component.slug}.js`, componentControllerSource(component));
  write(
    coreRoot,
    `components/${component.slug}.d.ts`,
    `
import type { MewaBehavior } from "../runtime/core.js";

export declare const behaviors: readonly MewaBehavior[];
export declare function enhance(root?: ParentNode, options?: unknown): unknown[];
export declare function destroy(root?: ParentNode, states?: unknown[]): void;
export declare const behavior: MewaBehavior;
`.trim()
  );
  const behaviorImports = dependencyClosure(component, 'behaviorDependencies')
    .filter((slug) => componentBySlug.get(slug).jsMode !== 'none')
    .map((slug) => `import "./${slug}.js";`)
    .join('\n');
  write(
    coreRoot,
    `auto/${component.slug}.js`,
    `
${behaviorImports}
import { behavior } from "../controllers/${component.slug}.js";
import { registerBehavior } from "../runtime/enhancer.js";

registerBehavior(behavior);
`.trim()
  );
  write(coreRoot, `auto/${component.slug}.d.ts`, 'export {};');
  autoImports.push(`import "./auto/${component.slug}.js";`);
}
write(coreRoot, 'auto.js', autoImports.join('\n'));
write(coreRoot, 'auto.d.ts', 'export {};');

const manifest = {
  schemaVersion: 1,
  name: 'mewa-ui',
  version: workspacePackage.version,
  source,
  foundations: {
    base: 'css/base.css',
    tokens: 'css/tokens.css',
    fonts: ['fonts/google-sans-code.css']
  },
  licenses: {
    mewaUi: 'LICENSE',
    googleSansCode: 'licenses/GOOGLE-SANS-CODE-OFL.txt',
    remixIcon: 'licenses/REMIX-ICON-LICENSE.txt'
  },
  components: registry.components.map((component) => ({
    name: component.name,
    slug: component.slug,
    category: component.category,
    purpose: component.purpose,
    stability: component.stability,
    jsMode: component.jsMode,
    contract: source.url
      ? `${source.url}library/components/${component.slug}/${component.slug}.md`
      : null,
    styleDependencies: componentDependencies(component, 'styleDependencies'),
    behaviorDependencies: componentDependencies(component, 'behaviorDependencies'),
    assets: component.assets || [],
    css: `css/${component.slug}.css`,
    controller: component.jsMode === 'none' ? null : `controllers/${component.slug}.js`,
    component: component.jsMode === 'none' ? null : `components/${component.slug}.js`,
    auto: component.jsMode === 'none' ? null : `auto/${component.slug}.js`
  }))
};
write(coreRoot, 'manifest.json', JSON.stringify(manifest, null, 2));
write(
  coreRoot,
  'package.json',
  JSON.stringify(
    {
      name: 'mewa-ui',
      version: workspacePackage.version,
      private: true,
      description: workspacePackage.description,
      license: 'MIT',
      type: 'module',
      files: ['**/*'],
      exports: packageExports(),
      sideEffects: ['./auto.js', './auto/*.js', './css/**/*.css', './fonts/*.css'],
      repository: workspacePackage.repository,
      homepage: workspacePackage.homepage,
      bugs: workspacePackage.bugs
    },
    null,
    2
  )
);
write(
  coreRoot,
  'README.md',
  `
# mewa-ui ${workspacePackage.version}

This is the generated, framework-neutral mewa_ui core package from the GitHub release.

## Plain HTML

Load \`css/base.css\`, \`css/tokens.css\`, and one dependency-aware component entry such as \`css/dialog.css\`.

Load \`auto/dialog.js\` as a module when plain HTML should initialize Dialog automatically.

## Application lifecycle

Import \`behavior\` from \`components/dialog.js\` and pass it to \`createController\` from \`index.js\`. Component entries include the behavior dependencies declared by the manifest. Use \`controllers/dialog.js\` only when an integration manages those dependencies itself.

Controllers have no automatic DOM side effects. Automatic entries share one document observer.

Read \`integration.md\` for a complete vanilla example, lifecycle ownership, and browser capabilities. Document-level adapters remain shared for the document lifetime.

## Optional assets

Fonts remain opt-in under \`fonts/\`. SVG icons ship in the separate \`mewa-icons\` release archive. The Google Sans Code and Remix Icon notices are preserved under \`licenses/\`.

Read \`manifest.json\` for component files and dependencies. Use \`checksums.json\` to verify every packaged file.

Clean Git builds include immutable component contract links in the manifest. A modified checkout or a source archive without Git metadata leaves those links empty; use the matching source checkout for its contracts. Do not substitute documentation from a different revision.

The mewa_ui code is MIT licensed. Bundled Google Sans Code remains under the SIL Open Font License 1.1, and bundled Remix Icon glyphs retain the upstream Remix Icon license. See \`licenses/\` and \`LICENSE\`.
`.trim()
);
copy(coreRoot, 'integration.md', 'library/runtime/README.md');
copy(coreRoot, 'LICENSE', 'LICENSE');

const iconDirectory = resolveInside(root, registry.canonicalAssets.icons, 'icon directory path');
const iconFiles = fs
  .readdirSync(iconDirectory)
  .filter((filename) => filename.endsWith('.svg'))
  .sort();
for (const filename of iconFiles)
  copy(iconsRoot, `icons/${filename}`, path.join(registry.canonicalAssets.icons, filename));
copy(iconsRoot, 'licenses/REMIX-ICON-LICENSE.txt', registry.canonicalAssets.licenses.remixIcon);
write(
  iconsRoot,
  'manifest.json',
  JSON.stringify(
    {
      schemaVersion: 1,
      name: 'mewa-icons',
      version: workspacePackage.version,
      licenses: {
        mewaUi: 'LICENSE',
        remixIcon: 'licenses/REMIX-ICON-LICENSE.txt'
      },
      icons: iconFiles.map((filename) => filename.replace(/\.svg$/, ''))
    },
    null,
    2
  )
);
write(
  iconsRoot,
  'package.json',
  JSON.stringify(
    {
      name: 'mewa-icons',
      version: workspacePackage.version,
      private: true,
      description: 'SVG icon assets for mewa_ui.',
      license: 'SEE LICENSE IN licenses/REMIX-ICON-LICENSE.txt',
      files: ['icons', 'licenses', 'manifest.json', 'checksums.json'],
      exports: {
        './*.svg': './icons/*.svg',
        './licenses/REMIX-ICON-LICENSE.txt': './licenses/REMIX-ICON-LICENSE.txt',
        './LICENSE': './LICENSE',
        './manifest.json': './manifest.json',
        './checksums.json': './checksums.json'
      },
      repository: workspacePackage.repository,
      homepage: workspacePackage.homepage,
      bugs: workspacePackage.bugs
    },
    null,
    2
  )
);
write(
  iconsRoot,
  'README.md',
  `
# mewa-icons ${workspacePackage.version}

This optional GitHub release package contains Remix Icon assets for mewa_ui integrations.

Use \`manifest.json\` to enumerate icon names. Use \`checksums.json\` to verify every packaged file. The upstream Remix Icon license is preserved in \`licenses/REMIX-ICON-LICENSE.txt\`. Names ending in \`-line\` are outlined icons; names ending in \`-fill\` are filled icons.

Load only the icons an application uses. The mewa_ui core package does not request this archive.
`.trim()
);
copy(iconsRoot, 'LICENSE', 'LICENSE');

copy(svelteRoot, 'index.js', 'library/adapters/svelte/attachment.js');
write(
  svelteRoot,
  'index.d.ts',
  fs
    .readFileSync(path.join(root, 'library/adapters/svelte/attachment.d.ts'), 'utf8')
    .replaceAll('../../runtime/behavior.js', './behavior.js')
);
copy(svelteRoot, 'behavior.d.ts', 'library/runtime/behavior.d.ts');
copy(svelteRoot, 'bun-plugin.js', 'library/adapters/svelte/bun-plugin.js');
copy(svelteRoot, 'bun-plugin.d.ts', 'library/adapters/svelte/bun-plugin.d.ts');
write(
  svelteRoot,
  'manifest.json',
  JSON.stringify(
    {
      schemaVersion: 1,
      name: 'mewa-svelte',
      version: workspacePackage.version,
      framework: 'svelte',
      frameworkRange: '>=5.29.0 <6',
      builder: 'bun',
      corePackage: 'mewa-ui',
      entries: {
        attachment: 'index.js',
        bunPlugin: 'bun-plugin.js'
      },
      licenses: {
        mewaUi: 'LICENSE'
      }
    },
    null,
    2
  )
);
write(
  svelteRoot,
  'package.json',
  JSON.stringify(
    {
      name: 'mewa-svelte',
      version: workspacePackage.version,
      private: true,
      description: 'Optional Svelte 5 lifecycle attachment and Bun compiler plugin for mewa_ui.',
      license: 'MIT',
      type: 'module',
      files: ['**/*'],
      exports: {
        '.': { types: './index.d.ts', import: './index.js', default: './index.js' },
        './bun-plugin.js': {
          types: './bun-plugin.d.ts',
          import: './bun-plugin.js',
          default: './bun-plugin.js'
        },
        './manifest.json': './manifest.json',
        './checksums.json': './checksums.json',
        './LICENSE': './LICENSE'
      },
      peerDependencies: {
        svelte: '>=5.29.0 <6'
      },
      sideEffects: false,
      repository: workspacePackage.repository,
      homepage: workspacePackage.homepage,
      bugs: workspacePackage.bugs
    },
    null,
    2
  )
);
copy(svelteRoot, 'README.md', 'library/adapters/svelte/README.md');
copy(svelteRoot, 'LICENSE', 'LICENSE');

writeChecksums(coreRoot);
writeChecksums(iconsRoot);
writeChecksums(svelteRoot);

// Build all artifacts before replacing any installed package. Keep smoke output.
const published = [];
try {
  for (const name of ['mewa-ui', 'mewa-icons', 'mewa-svelte']) {
    const destination = path.join(distributionRoot, name);
    const backup = path.join(outputRoot, `${name}.previous`);
    if (fs.existsSync(destination)) fs.renameSync(destination, backup);
    try {
      fs.renameSync(path.join(outputRoot, name), destination);
    } catch (error) {
      if (fs.existsSync(backup)) fs.renameSync(backup, destination);
      throw error;
    }
    published.push({ destination, backup });
  }
} catch (error) {
  for (const { destination, backup } of published.reverse()) {
    fs.rmSync(destination, { recursive: true, force: true });
    if (fs.existsSync(backup)) fs.renameSync(backup, destination);
  }
  throw error;
}

console.log(`Built dist/mewa-ui with ${registry.components.length} component CSS entries.`);
console.log(`Built dist/mewa-icons with ${iconFiles.length} SVG icons.`);
console.log(`Built dist/mewa-svelte for Svelte 5 and Bun.`);
