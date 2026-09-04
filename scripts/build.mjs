import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(root, "dist");
const coreRoot = path.join(outputRoot, "mewa-ui");
const iconsRoot = path.join(outputRoot, "mewa-icons");
const registry = JSON.parse(fs.readFileSync(path.join(root, "registry.json"), "utf8"));
const workspacePackage = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const componentBySlug = new Map(registry.components.map((component) => [component.slug, component]));
const autoSection = /\/\* mewa:auto:start \*\/[\s\S]*?\/\* mewa:auto:end \*\//g;

if (path.basename(outputRoot) !== "dist" || path.dirname(outputRoot) !== root) {
  throw new Error(`Refusing to replace unsafe output path: ${outputRoot}`);
}

function mkdir(filename) {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
}

function resolveInside(base, relativePath, label) {
  if (typeof relativePath !== "string" || relativePath.length === 0) {
    throw new Error(`${label} must be a non-empty relative path`);
  }
  const filename = path.resolve(base, relativePath);
  const relative = path.relative(base, filename);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} escapes ${base}: ${relativePath}`);
  }
  return filename;
}

function write(base, relativePath, content) {
  const filename = resolveInside(base, relativePath, "output path");
  mkdir(filename);
  fs.writeFileSync(filename, content.endsWith("\n") ? content : `${content}\n`);
}

function copy(base, relativePath, sourcePath) {
  const filename = resolveInside(base, relativePath, "output path");
  const source = resolveInside(root, sourcePath, "source path");
  mkdir(filename);
  fs.copyFileSync(source, filename);
}

function componentDependencies(component, field) {
  const dependencies = component[field] || [];
  if (!Array.isArray(dependencies)) throw new Error(`${component.slug}: ${field} must be an array`);
  dependencies.forEach((slug) => {
    if (!componentBySlug.has(slug)) throw new Error(`${component.slug}: unknown ${field} entry ${slug}`);
    if (slug === component.slug) throw new Error(`${component.slug}: ${field} cannot reference itself`);
  });
  return dependencies;
}

function dependencyClosure(component, field, visiting = new Set(), result = []) {
  if (visiting.has(component.slug)) {
    throw new Error(`${field} cycle includes ${Array.from(visiting).join(" -> ")} -> ${component.slug}`);
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
    ".": { types: "./index.d.ts", import: "./index.js", default: "./index.js" },
    "./runtime/core.js": { types: "./runtime/core.d.ts", import: "./runtime/core.js" },
    "./runtime/enhancer.js": { types: "./runtime/enhancer.d.ts", import: "./runtime/enhancer.js" },
    "./auto.js": { types: "./auto.d.ts", import: "./auto.js" },
    "./css/base.css": "./css/base.css",
    "./css/tokens.css": "./css/tokens.css",
    "./css/all.css": "./css/all.css",
    "./fonts/geist-sans.css": "./fonts/geist-sans.css",
    "./fonts/geist-mono.css": "./fonts/geist-mono.css",
    "./fonts/geist.woff2": "./fonts/geist.woff2",
    "./fonts/geistmono.woff2": "./fonts/geistmono.woff2",
    "./licenses/GEIST-OFL.txt": "./licenses/GEIST-OFL.txt",
    "./licenses/LUCIDE-LICENSE.txt": "./licenses/LUCIDE-LICENSE.txt",
    "./LICENSE": "./LICENSE",
    "./manifest.json": "./manifest.json",
    "./checksums.json": "./checksums.json"
  };

  for (const component of registry.components) {
    exports[`./css/${component.slug}.css`] = `./css/${component.slug}.css`;
    if (component.jsMode !== "none") {
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
  if (faces.length !== 2) throw new Error(`Expected two font faces in library/src/base.css, found ${faces.length}`);
  return {
    base: source.replace(/\s*@font-face\s*\{[\s\S]*?\}\s*/g, "\n").trimStart(),
    sans: faces[0].replace('url("geist.woff2")', 'url("./geist.woff2")'),
    mono: faces[1].replace('url("geistmono.woff2")', 'url("./geistmono.woff2")')
  };
}

function controllerSource(component) {
  const filename = resolveInside(root, component.files.js, `${component.slug} controller path`);
  const source = fs.readFileSync(filename, "utf8");
  const sections = source.match(autoSection) || [];
  if (sections.length !== 2) {
    throw new Error(`${component.files.js}: expected two mewa:auto sections, found ${sections.length}`);
  }
  const output = source
    .replace(autoSection, "")
    .replaceAll("../../runtime/core.js", "../runtime/core.js")
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
  const slugs = [...dependencyClosure(component, "behaviorDependencies"), component.slug]
    .filter((slug) => componentBySlug.get(slug).jsMode !== "none");
  const imports = slugs
    .map((slug, index) => `import { behavior as behavior${index} } from "../controllers/${slug}.js";`)
    .join("\n");
  const references = slugs.map((_, index) => `behavior${index}`).join(", ");

  return `${imports}

export const behaviors = Object.freeze([${references}]);
const statesByRoot = new WeakMap();

export function enhance(root, options) {
  const scope = root || (typeof document === "undefined" ? null : document);
  if (!scope) return [];
  const previous = statesByRoot.get(scope) || [];
  const states = behaviors.map((entry, index) => entry.enhance(scope, options) ?? previous[index]);
  statesByRoot.set(scope, states);
  return states;
}

export function destroy(root, states) {
  const scope = root || (typeof document === "undefined" ? null : document);
  if (!scope) return;
  const currentStates = states || statesByRoot.get(scope) || [];
  for (let index = behaviors.length - 1; index >= 0; index -= 1) {
    behaviors[index].destroy?.(scope, currentStates[index]);
  }
  statesByRoot.delete(scope);
}

export const behavior = { name: ${JSON.stringify(component.slug)}, enhance, destroy };`;
}

function walkFiles(base, relative = "") {
  const directory = resolveInside(base, relative || ".", "walk path");
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(relative, entry.name);
    return entry.isDirectory() ? walkFiles(base, child) : [child];
  }).sort();
}

function writeChecksums(base) {
  const checksums = {};
  for (const relativePath of walkFiles(base)) {
    if (relativePath === "checksums.json") continue;
    const content = fs.readFileSync(path.join(base, relativePath));
    checksums[relativePath] = crypto.createHash("sha256").update(content).digest("hex");
  }
  write(base, "checksums.json", JSON.stringify({ algorithm: "sha256", files: checksums }, null, 2));
}

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(coreRoot, { recursive: true });
fs.mkdirSync(iconsRoot, { recursive: true });

const baseSource = fs.readFileSync(resolveInside(root, "library/src/base.css", "base stylesheet path"), "utf8");
const tokenSource = fs.readFileSync(resolveInside(root, "library/src/tokens.css", "token stylesheet path"), "utf8");
const fonts = stripFontFaces(baseSource);
write(coreRoot, "css/base.css", fonts.base);
write(coreRoot, "css/tokens.css", tokenSource);
write(coreRoot, "fonts/geist-sans.css", `${fonts.sans}\n`);
write(coreRoot, "fonts/geist-mono.css", `${fonts.mono}\n`);
copy(coreRoot, "fonts/geist.woff2", "library/src/geist.woff2");
copy(coreRoot, "fonts/geistmono.woff2", "library/src/geistmono.woff2");
copy(coreRoot, "licenses/GEIST-OFL.txt", registry.canonicalAssets.licenses.geist);
copy(coreRoot, "licenses/LUCIDE-LICENSE.txt", registry.canonicalAssets.licenses.lucide);

const allCss = [
  "/* mewa_ui generated complete stylesheet. Fonts remain opt-in. */",
  fonts.base.trim(),
  tokenSource.trim()
];

for (const component of registry.components) {
  const source = fs.readFileSync(
    resolveInside(root, component.files.css, `${component.slug} stylesheet path`),
    "utf8"
  ).trim();
  write(coreRoot, `css/components/${component.slug}.css`, source);
  allCss.push(source);

  const dependencies = dependencyClosure(component, "styleDependencies");
  const imports = [...dependencies, component.slug]
    .map((slug) => `@import "./components/${slug}.css";`)
    .join("\n");
  write(coreRoot, `css/${component.slug}.css`, `/* mewa_ui generated ${component.slug} stylesheet entry. */\n${imports}`);
}
write(coreRoot, "css/all.css", allCss.join("\n\n"));

copy(coreRoot, "runtime/core.js", "library/runtime/core.js");
copy(coreRoot, "runtime/enhancer.js", "library/runtime/enhancer.js");
write(coreRoot, "runtime/core.d.ts", `
export interface MewaBehavior<State = unknown> {
  readonly name: string;
  enhance(root: ParentNode, options?: unknown): State | void;
  destroy?(root: ParentNode, state?: State): void;
}

export interface MewaController {
  readonly element: ParentNode;
  update(options?: unknown): void;
  destroy(): void;
}

export declare function queryAll(root: ParentNode | null | undefined, selector: string): Element[];
export declare function createController(behavior: MewaBehavior, root: ParentNode, options?: unknown): MewaController;
`.trim());
write(coreRoot, "runtime/enhancer.d.ts", `
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
`.trim());
write(coreRoot, "index.js", `
export { createController, queryAll } from "./runtime/core.js";
export { createEnhancer } from "./runtime/enhancer.js";
`.trim());
write(coreRoot, "index.d.ts", `
export type { MewaBehavior, MewaController } from "./runtime/core.js";
export { createController, queryAll } from "./runtime/core.js";
export type { MewaEnhancer } from "./runtime/enhancer.js";
export { createEnhancer } from "./runtime/enhancer.js";
`.trim());

const autoImports = [];
for (const component of registry.components.filter((entry) => entry.jsMode !== "none")) {
  const controller = controllerSource(component);
  const destroyType = /export\s+function\s+destroy\b/.test(controller)
    ? "\nexport declare function destroy(root?: ParentNode): void;"
    : "";
  write(coreRoot, `controllers/${component.slug}.js`, controller);
  write(coreRoot, `controllers/${component.slug}.d.ts`, `
import type { MewaBehavior } from "../runtime/core.js";

export declare function enhance(root?: ParentNode): unknown;${destroyType}
export declare const behavior: MewaBehavior;
`.trim());
  write(coreRoot, `components/${component.slug}.js`, componentControllerSource(component));
  write(coreRoot, `components/${component.slug}.d.ts`, `
import type { MewaBehavior } from "../runtime/core.js";

export declare const behaviors: readonly MewaBehavior[];
export declare function enhance(root?: ParentNode, options?: unknown): unknown[];
export declare function destroy(root?: ParentNode, states?: unknown[]): void;
export declare const behavior: MewaBehavior;
`.trim());
  const behaviorImports = dependencyClosure(component, "behaviorDependencies")
    .filter((slug) => componentBySlug.get(slug).jsMode !== "none")
    .map((slug) => `import "./${slug}.js";`)
    .join("\n");
  write(coreRoot, `auto/${component.slug}.js`, `
${behaviorImports}
import { behavior } from "../controllers/${component.slug}.js";
import { registerBehavior } from "../runtime/enhancer.js";

registerBehavior(behavior);
`.trim());
  write(coreRoot, `auto/${component.slug}.d.ts`, "export {};");
  autoImports.push(`import "./auto/${component.slug}.js";`);
}
write(coreRoot, "auto.js", autoImports.join("\n"));
write(coreRoot, "auto.d.ts", "export {};");

const manifest = {
  schemaVersion: 1,
  name: "mewa-ui",
  version: workspacePackage.version,
  foundations: {
    base: "css/base.css",
    tokens: "css/tokens.css",
    fonts: ["fonts/geist-sans.css", "fonts/geist-mono.css"]
  },
  licenses: {
    mewaUi: "LICENSE",
    geist: "licenses/GEIST-OFL.txt",
    lucide: "licenses/LUCIDE-LICENSE.txt"
  },
  components: registry.components.map((component) => ({
    name: component.name,
    slug: component.slug,
    category: component.category,
    purpose: component.purpose,
    stability: component.stability,
    jsMode: component.jsMode,
    styleDependencies: componentDependencies(component, "styleDependencies"),
    behaviorDependencies: componentDependencies(component, "behaviorDependencies"),
    assets: component.assets || [],
    css: `css/${component.slug}.css`,
    controller: component.jsMode === "none" ? null : `controllers/${component.slug}.js`,
    component: component.jsMode === "none" ? null : `components/${component.slug}.js`,
    auto: component.jsMode === "none" ? null : `auto/${component.slug}.js`
  }))
};
write(coreRoot, "manifest.json", JSON.stringify(manifest, null, 2));
write(coreRoot, "package.json", JSON.stringify({
  name: "mewa-ui",
  version: workspacePackage.version,
  private: true,
  description: workspacePackage.description,
  license: "MIT",
  type: "module",
  files: ["**/*"],
  exports: packageExports(),
  sideEffects: ["./auto.js", "./auto/*.js", "./css/**/*.css", "./fonts/*.css"],
  repository: workspacePackage.repository,
  homepage: workspacePackage.homepage,
  bugs: workspacePackage.bugs
}, null, 2));
write(coreRoot, "README.md", `
# mewa-ui ${workspacePackage.version}

This is the generated, framework-neutral mewa_ui core package from the GitHub release.

## Plain HTML

Load \`css/base.css\`, \`css/tokens.css\`, and one dependency-aware component entry such as \`css/dialog.css\`.

Load \`auto/dialog.js\` as a module when plain HTML should initialize Dialog automatically.

## Application lifecycle

Import \`behavior\` from \`components/dialog.js\` and pass it to \`createController\` from \`index.js\`. Component entries include the behavior dependencies declared by the manifest. Use \`controllers/dialog.js\` only when an integration manages those dependencies itself.

Controllers have no automatic DOM side effects. Automatic entries share one document observer.

Controller cleanup is behavior-specific. Document-level adapters remain shared for the document lifetime.

## Optional assets

Fonts remain opt-in under \`fonts/\`. SVG icons ship in the separate \`mewa-icons\` release archive. Upstream Geist and Lucide notices are preserved under \`licenses/\`.

Read \`manifest.json\` for component files and dependencies. Use \`checksums.json\` to verify every packaged file.

The mewa_ui code is MIT licensed. Bundled Geist fonts remain under the SIL Open Font License 1.1, and bundled Lucide-derived glyphs retain their upstream ISC and MIT notices. See \`licenses/\` and \`LICENSE\`.
`.trim());
copy(coreRoot, "LICENSE", "LICENSE");

const iconDirectory = resolveInside(root, registry.canonicalAssets.icons, "icon directory path");
const iconFiles = fs.readdirSync(iconDirectory).filter((filename) => filename.endsWith(".svg")).sort();
for (const filename of iconFiles) copy(iconsRoot, `icons/${filename}`, path.join(registry.canonicalAssets.icons, filename));
copy(iconsRoot, "licenses/LUCIDE-LICENSE.txt", registry.canonicalAssets.licenses.lucide);
write(iconsRoot, "manifest.json", JSON.stringify({
  schemaVersion: 1,
  name: "mewa-icons",
  version: workspacePackage.version,
  licenses: {
    mewaUi: "LICENSE",
    lucide: "licenses/LUCIDE-LICENSE.txt"
  },
  icons: iconFiles.map((filename) => filename.replace(/\.svg$/, ""))
}, null, 2));
write(iconsRoot, "package.json", JSON.stringify({
  name: "mewa-icons",
  version: workspacePackage.version,
  private: true,
  description: "SVG icon assets for mewa_ui.",
  license: "SEE LICENSE IN licenses/LUCIDE-LICENSE.txt",
  files: ["icons", "licenses", "manifest.json", "checksums.json"],
  exports: {
    "./*.svg": "./icons/*.svg",
    "./licenses/LUCIDE-LICENSE.txt": "./licenses/LUCIDE-LICENSE.txt",
    "./LICENSE": "./LICENSE",
    "./manifest.json": "./manifest.json",
    "./checksums.json": "./checksums.json"
  },
  repository: workspacePackage.repository,
  homepage: workspacePackage.homepage,
  bugs: workspacePackage.bugs
}, null, 2));
write(iconsRoot, "README.md", `
# mewa-icons ${workspacePackage.version}

This optional GitHub release package contains the complete mewa_ui SVG icon set.

Use \`manifest.json\` to enumerate icon names. Use \`checksums.json\` to verify every packaged file. The upstream Lucide and Feather notices are preserved in \`licenses/LUCIDE-LICENSE.txt\`.

Load only the icons an application uses. The mewa_ui core package does not request this archive.
`.trim());
copy(iconsRoot, "LICENSE", "LICENSE");

writeChecksums(coreRoot);
writeChecksums(iconsRoot);

console.log(`Built ${path.relative(root, coreRoot)} with ${registry.components.length} component CSS entries.`);
console.log(`Built ${path.relative(root, iconsRoot)} with ${iconFiles.length} SVG icons.`);
