"use strict";

// External verification: node tests/catalog-contract.test.js
//
// This suite checks the source tree that consumers use today.  It deliberately
// treats registry.json as the machine-readable catalog and README.md as the
// human-readable inventory.  The documentation pages and application shells
// are checked as served source, not as generated examples.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "src");
const componentsDir = path.join(root, "components");
const docsDir = path.join(root, "docs");
const layoutsDir = path.join(root, "layouts");
const registryPath = path.join(root, "registry.json");

const read = (file) => fs.readFileSync(file, "utf8");
const exists = (file) => fs.existsSync(file);
const listFiles = (directory, predicate = () => true) => (
  fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && predicate(entry.name))
    .map((entry) => entry.name)
    .sort()
);
const listDirectories = (directory) => (
  fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
);
const registry = JSON.parse(read(registryPath));
const components = registry.components;

let failures = 0;

function test(name, callback) {
  try {
    callback();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}\n  ${error.message}`);
  }
}

function relativeFile(file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function stripExamples(html) {
  // Code samples contain intentionally repeated ids, placeholder icon names,
  // and example attributes. They are not part of the rendered document tree.
  return html.replace(/<(pre|code|script|style)\b[\s\S]*?<\/\1>/gi, "");
}

function attributes(tag) {
  const found = {};
  const expression = /\s([\w:-]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g;
  let match;
  while ((match = expression.exec(tag))) {
    found[match[1].toLowerCase()] = (match[2] || "").replace(/^['"]|['"]$/g, "");
  }
  return found;
}

function tags(html, name) {
  const result = [];
  let start = -1;
  let quote = "";
  for (let index = 0; index < html.length; index += 1) {
    const character = html[index];
    if (start < 0) {
      if (character === "<") start = index;
      continue;
    }
    if (quote) {
      if (character === quote) quote = "";
      continue;
    }
    if (character === "\"" || character === "'") {
      quote = character;
      continue;
    }
    if (character !== ">") continue;
    const tag = html.slice(start, index + 1);
    if (new RegExp(`^<${name}\\b`, "i").test(tag)) result.push(tag);
    start = -1;
  }
  return result;
}

function localReferences(html, filename) {
  const references = [];
  for (const tag of html.matchAll(/<(?:link|script|img|source|iframe|object|audio|video)\b[^>]*>/gi)) {
    const attrs = attributes(tag[0]);
    for (const attribute of ["href", "src", "poster", "data"]) {
      if (!attrs[attribute]) continue;
      const reference = attrs[attribute];
      if (reference.startsWith("#") || reference.startsWith("data:") || reference.startsWith("mailto:")) continue;
      if (/^(?:https?:)?\/\//i.test(reference)) continue;
      const target = path.resolve(path.dirname(filename), decodeURIComponent(reference.split(/[?#]/, 1)[0]));
      assert(target === root || target.startsWith(`${root}${path.sep}`), `${relativeFile(filename)}: asset escapes repository root (${reference})`);
      assert(exists(target), `${relativeFile(filename)}: missing local asset ${reference}`);
      references.push({ attribute, reference, target });
    }
  }
  return references;
}

function stylesheetReferences(html) {
  return Array.from(html.matchAll(/<link\b[^>]*\brel\s*=\s*(["'])stylesheet\1[^>]*>/gi), (match) => {
    const attrs = attributes(match[0]);
    return attrs.href;
  }).filter(Boolean);
}

function scriptReferences(html) {
  return Array.from(html.matchAll(/<script\b[^>]*\bsrc\s*=\s*(["'])([^"']+)\1[^>]*>/gi), (match) => match[2]);
}

function checkIdsAndRelationships(html, filename) {
  const source = stripExamples(html);
  const ids = new Set();
  for (const tag of source.matchAll(/<[^>]+>/g)) {
    const attrs = attributes(tag[0]);
    if (!attrs.id) continue;
    assert(!ids.has(attrs.id), `${filename}: duplicate rendered id ${attrs.id}`);
    ids.add(attrs.id);
  }

  const relationshipAttributes = ["aria-labelledby", "aria-describedby", "aria-controls", "aria-owns", "for"];
  for (const tag of source.matchAll(/<[^>]+>/g)) {
    const attrs = attributes(tag[0]);
    for (const attribute of relationshipAttributes) {
      if (!attrs[attribute]) continue;
      for (const target of attrs[attribute].split(/\s+/).filter(Boolean)) {
        assert(ids.has(target), `${filename}: ${attribute} targets missing rendered id ${target}`);
      }
    }
  }
}

function checkRenderedMarkup(html, filename) {
  const source = stripExamples(html);
  assert.match(source, /<html\b[^>]*\blang\s*=\s*["'][^"']+["']/i, `${filename}: document language is required`);
  assert(tags(source, "main").length > 0, `${filename}: a main landmark is required`);
  checkIdsAndRelationships(source, filename);

  for (const tag of tags(source, "img")) {
    assert(Object.prototype.hasOwnProperty.call(attributes(tag), "alt"), `${filename}: every rendered image needs alt text`);
  }
  for (const tag of tags(source, "dialog")) {
    const attrs = attributes(tag);
    assert(attrs["aria-label"] || attrs["aria-labelledby"], `${filename}: every dialog needs an accessible name`);
  }
}

function checkDocsSkipTarget(html, filename) {
  assert.match(html, /<body\b[^>]*>\s*<a class="skip-link docs-skip-link" href="#main-content">Skip to content<\/a>\s*<site-header\b/i, `${filename}: skip link must be the first body content`);
  const mains = tags(stripExamples(html), "main");
  assert(mains.length > 0, `${filename}: a rendered main is required`);
  const main = mains.map(attributes).find((candidate) => candidate.id === "main-content");
  assert(main, `${filename}: rendered main must target the skip link`);
  assert.equal(main.tabindex, "-1", `${filename}: rendered main must be focusable for skip navigation`);
}

function checkButtonTypes(html, filename) {
  for (const tag of tags(stripExamples(html), "button")) {
    const type = attributes(tag).type;
    assert(["button", "submit", "reset"].includes(type), `${filename}: every rendered button needs an explicit type`);
  }
}

function checkSkillButtonTypes(skill, filename) {
  for (const block of skill.matchAll(/```(?:html|markup)\s*\n([\s\S]*?)```/gi)) {
    checkButtonTypes(block[1], `${filename} fenced HTML`);
  }
}

function checkCopyableMarkupButtonTypes(html, filename) {
  for (const block of html.matchAll(/<pre\b[^>]*>\s*<code\b[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi)) {
    const decoded = block[1]
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&amp;/gi, "&");
    checkButtonTypes(decoded, `${filename} decoded copyable markup`);
  }
}

function checkCssContract(css, filename, { allowRawColors = false } = {}) {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, "");
  assert(!/\b(?:box-shadow|text-shadow)\s*:/i.test(source), `${filename}: visual shadows are forbidden`);
  // The spinner is the one sanctioned animated primitive in the library.
  // A loading indicator without motion is meaningless, so its rotation
  // keyframes are the sole exception to the motionless contract.
  const spinner = filename.endsWith("spinner.css");
  if (!spinner) {
    assert(!/\b(?:animation|transition)(?:-[\w]+)?\s*:/i.test(source), `${filename}: motion declarations are forbidden`);
    assert(!/\bscroll-behavior\s*:/i.test(source), `${filename}: smooth scrolling belongs to consuming applications`);
    assert(!/@(?:keyframes|starting-style)|view-transition/i.test(source), `${filename}: generated motion is forbidden`);
  }
  if (!allowRawColors) {
    assert(!/(?:#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\s*\(|(?<![\w-])(?:white|black|red|green|blue|gray|grey)(?![\w-]))/i.test(source), `${filename}: component colors must use semantic tokens`);
    assert(!/var\(\s*--color-[\w-]+\s*\)/i.test(source), `${filename}: component colors must not consume palette primitives directly`);
    assert(!/\b(?:rgba?|hsla?|oklch|hsl|rgb|color)\s*\(/i.test(source), `${filename}: raw color functions must use semantic tokens or color-mix()`);
  }
}

function referencedIconNames(html) {
  const source = html.replace(/<(pre|code|script|style)\b[\s\S]*?<\/\1>/gi, "");
  return Array.from(source.matchAll(/\bdata-lucide\s*=\s*["']([^"']+)["']/gi), (match) => match[1]);
}

const componentSlugs = components.map((component) => component.slug).sort();
const componentDirectories = listDirectories(componentsDir);
const documentationPages = listFiles(docsDir, (name) => name.endsWith(".html")).map((name) => name.slice(0, -5));
const sourceHtmlFiles = [
  ...documentationPages.map((slug) => path.join(docsDir, `${slug}.html`)),
  path.join(layoutsDir, "vertical-navbar.html"),
  path.join(layoutsDir, "horizontal-navbar.html")
];

test("the current machine catalog and source roots exist", () => {
  assert(exists(registryPath), "missing registry.json");
  assert(exists(path.join(srcDir, "base.css")), "missing src/base.css");
  assert(exists(path.join(srcDir, "tokens.css")), "missing src/tokens.css");
  assert(exists(path.join(srcDir, "icons")), "missing src/icons/");
  assert(exists(componentsDir), "missing components/");
  assert(exists(docsDir), "missing docs/");
  assert(exists(layoutsDir), "missing layouts/");
  assert(!exists(path.join(docsDir, "index.html")), "docs/ has no landing page contract");
  assert.deepEqual(listFiles(layoutsDir, (name) => name.endsWith(".html")), ["horizontal-navbar.html", "vertical-navbar.html"]);
});

test("registry.json is the complete machine-readable catalog", () => {
  assert.equal(registry.schemaVersion, 1);
  assert.equal(registry.name, "mewa_ui");
  assert.equal(registry.library, "mewa_ui");
  assert.equal(components.length, 59, "registry must contain all 59 components");
  assert.deepEqual(componentSlugs, componentDirectories, "registry slugs must match component folders exactly");
  assert.deepEqual(registry.canonicalAssets, {
    foundations: ["src/base.css", "src/tokens.css"],
    fonts: ["src/geist.woff2", "src/geistmono.woff2"],
    icons: "src/icons/",
    components: "components/",
    documentation: "docs/",
    layouts: ["layouts/layouts.css", "layouts/layouts.js"]
  });

  const names = new Set();
  const slugs = new Set();
  for (const component of components) {
    assert.equal(typeof component.name, "string");
    assert(!names.has(component.name), `duplicate component name ${component.name}`);
    names.add(component.name);
    assert.match(component.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert(!slugs.has(component.slug), `duplicate component slug ${component.slug}`);
    slugs.add(component.slug);
    assert.equal(typeof component.category, "string");
    assert.equal(typeof component.nativeBasis, "string");
    assert(component.nativeBasis.length >= 20, `${component.slug}: native basis is too terse`);
    assert.equal(typeof component.description, "string");
    assert(component.description.length >= 24, `${component.slug}: description is too terse`);
    assert.equal(typeof component.requiresJs, "boolean");
    assert.equal(typeof component.enhancementJs, "boolean");
    assert(["none", "required", "optional"].includes(component.jsMode), `${component.slug}: invalid jsMode`);
    assert.equal(component.jsMode, component.requiresJs ? "required" : component.enhancementJs ? "optional" : "none", `${component.slug}: jsMode must describe the enhancement contract`);
    assert.equal(typeof component.files, "object");
    assert.equal(typeof component.docs, "string");
    for (const file of [component.files.skill, component.files.css, component.files.js, component.docs].filter(Boolean)) {
      assert(!path.isAbsolute(file), `${component.slug}: catalog paths must be relative`);
      assert(exists(path.join(root, file)), `${component.slug}: missing catalog file ${file}`);
    }
    assert.equal(component.files.skill, `components/${component.slug}/${component.slug}.md`);
    assert.equal(component.files.css, `components/${component.slug}/${component.slug}.css`);
    assert.equal(component.docs, `docs/${component.slug}.html`);
    const hasModule = Boolean(component.files.js);
    assert.equal(hasModule, component.requiresJs || component.enhancementJs, `${component.slug}: module declaration must match enhancement flags`);
    if (hasModule) assert.equal(component.files.js, `components/${component.slug}/${component.slug}.js`);
  }
});

test("component folders, docs pages, and README inventory have exact parity", () => {
  assert.equal(documentationPages.length, componentSlugs.length, "docs must contain exactly one page for each registry slug");
  assert.deepEqual(new Set(documentationPages), new Set(componentSlugs), "docs must contain exactly one page for each registry slug");
  const readme = read(path.join(root, "README.md"));
  assert.match(readme, /59 self-contained component folders/i);
  assert.match(readme, /59 static component pages/i);
  assert.match(readme, /## Component inventory/);

  const rows = Array.from(readme.matchAll(/^\| ([^|]+) \|.*?\[`components\/([^/]+)\/[^`]+`\]\(components\/\2\/[^)]+\).*?\[`docs\/([^`]+)\.html`\]\(docs\/\3\.html\) \|$/gm), (match) => ({
    name: match[1],
    slug: match[2],
    docs: match[3]
  }));
  assert.equal(rows.length, 59, "README must contain one inventory row for every component");
  assert.deepEqual(rows.map((row) => row.slug).sort(), componentSlugs);
  for (const component of components) {
    const row = rows.find((candidate) => candidate.slug === component.slug);
    assert(row, `${component.slug}: README inventory row is missing`);
    assert.equal(row.name, component.name, `${component.slug}: README name differs from registry.json`);
    assert.equal(row.docs, component.slug, `${component.slug}: README docs path differs from registry.json`);
  }

  for (const component of components) {
    const directory = path.join(componentsDir, component.slug);
    const names = listFiles(directory);
    const expected = [`${component.slug}.css`, `${component.slug}.md`];
    if (component.files.js) expected.push(`${component.slug}.js`);
    // A native component may carry an unregistered, opt-in enhancement module.
    // The registry still remains authoritative for what consumers must load.
    const unexpected = names.filter((name) => !expected.includes(name) && !name.endsWith(".js"));
    assert.deepEqual(unexpected, [], `${component.slug}: folder contains an undeclared non-module file`);
    assert(names.filter((name) => name.endsWith(".js")).every((name) => name === `${component.slug}.js`), `${component.slug}: enhancement modules must be named after their component`);
    const skill = read(path.join(directory, `${component.slug}.md`));
    assert.match(skill, /^## Native basis\s/m, `${component.slug}: skill must document its native basis`);
    const apiSection = skill.match(/^## Native Web APIs\s*\n([\s\S]*?)(?=^## |$)/im);
    assert(apiSection && apiSection[1].trim(), `${component.slug}: skill must document native APIs or explicitly state none`);
  }
});

test("foundations load in order and retain static, semantic contracts", () => {
  const base = read(path.join(srcDir, "base.css"));
  const tokens = read(path.join(srcDir, "tokens.css"));
  assert.match(base, /@font-face[\s\S]*font-family:\s*["']geist["']/i);
  assert.match(base, /@font-face[\s\S]*font-family:\s*["']geist-mono["']/i);
  assert.match(base, /--font-sans:\s*geist,\s*sans-serif/);
  assert.match(base, /--border-radius:\s*0/);
  assert.match(base, /--radius-full:/);
  assert.match(base, /:focus-visible\s*\{/);
  assert.match(base, /@media\s*\(forced-colors:\s*active\)/);
  ["--background", "--surface-primary", "--text-primary", "--border-primary", "--border-ring", "--chart-1", "--chart-5"].forEach((token) => assert.match(tokens, new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:`), `tokens.css must define ${token}`));
  assert.match(tokens, /\.dark\s*\{/);
  assert(!/--(?:space|size|radius|layer)-/.test(tokens), "semantic roles must stay separate from base geometry tokens");
  [base, tokens].forEach((css, index) => checkCssContract(css, index === 0 ? "src/base.css" : "src/tokens.css", { allowRawColors: true }));
  ["src/geist.woff2", "src/geistmono.woff2"].forEach((font) => assert(exists(path.join(root, font)), `missing ${font}`));
});

test("component and layout CSS use token roles without shadows or motion", () => {
  const cssFiles = [
    path.join(srcDir, "base.css"),
    path.join(srcDir, "tokens.css"),
    ...componentDirectories.map((slug) => path.join(componentsDir, slug, `${slug}.css`)),
    path.join(layoutsDir, "layouts.css")
  ];
  cssFiles.forEach((file) => checkCssContract(read(file), relativeFile(file), { allowRawColors: file.endsWith("base.css") || file.endsWith("tokens.css") }));
  for (const slug of componentDirectories) {
    const css = read(path.join(componentsDir, slug, `${slug}.css`));
    assert.match(css, /@layer\s+components/, `${slug}: styles must belong to the components layer`);
  }
  const radiusDeclarations = cssFiles.flatMap((file) => {
    const css = read(file);
    return Array.from(css.matchAll(/border-radius\s*:\s*([^;{}]+)/gi), (match) => ({ file, value: match[1].trim() }));
  });
  radiusDeclarations.forEach(({ file, value }) => assert(/^(?:0|var\(--radius-full\)|var\(--border-radius\)|inherit|50%)$/i.test(value), `${relativeFile(file)}: general radius scale is not allowed (${value})`));
});

test("docs and layouts resolve current relative assets and foundations", () => {
  for (const file of sourceHtmlFiles) {
    const html = read(file);
    localReferences(html, file);
    const stylesheets = stylesheetReferences(html);
    assert.equal(stylesheets[0], "../src/base.css", `${relativeFile(file)}: base.css must load first`);
    assert.equal(stylesheets[1], "../src/tokens.css", `${relativeFile(file)}: tokens.css must follow base.css`);
    assert(!stylesheets.some((href) => /(?:^|\/)(?:legacy|catalog|snippets)(?:\/|$)|mewa\.css|components\.js|lucide\.svg/i.test(href)), `${relativeFile(file)}: current pages must use current source paths`);
    stylesheets.forEach((href) => assert(!/^(?:https?:)?\/\//i.test(href), `${relativeFile(file)}: stylesheets must be local`));
    scriptReferences(html).forEach((src) => assert(!/^(?:https?:)?\/\//i.test(src), `${relativeFile(file)}: scripts must be local`));
    checkRenderedMarkup(html, relativeFile(file));
    if (file.startsWith(docsDir)) checkDocsSkipTarget(html, relativeFile(file));
  }
});

test("rendered docs, layouts, and skill HTML examples use explicit button types", () => {
  for (const file of sourceHtmlFiles) checkButtonTypes(read(file), relativeFile(file));
  for (const file of documentationPages.map((slug) => path.join(docsDir, `${slug}.html`))) {
    checkCopyableMarkupButtonTypes(read(file), relativeFile(file));
  }
  for (const slug of componentDirectories) {
    const skillFile = path.join(componentsDir, slug, `${slug}.md`);
    checkSkillButtonTypes(read(skillFile), relativeFile(skillFile));
  }
  assert.throws(
    () => checkCopyableMarkupButtonTypes("<pre><code class=\"language-markup\">&lt;button&gt;Bad&lt;/button&gt;</code></pre>", "fixture"),
    /explicit type/,
    "an encoded untyped button must be rejected"
  );
});

test("local Lucide SVG files back every rendered icon reference", () => {
  const icons = listFiles(path.join(srcDir, "icons"), (name) => name.endsWith(".svg"));
  assert(icons.length > 100, "src/icons must contain the local icon set");
  icons.forEach((name) => {
    const svg = read(path.join(srcDir, "icons", name));
    assert.match(svg, /^\s*<svg\b/i, `src/icons/${name} must be an SVG document`);
    assert(!/\b(?:href|xlink:href)\s*=\s*["'](?:https?:)?\/\//i.test(svg), `src/icons/${name} must not load remote assets`);
  });
  for (const file of sourceHtmlFiles) {
    for (const name of referencedIconNames(read(file))) {
      assert.match(name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${relativeFile(file)}: invalid local icon name ${name}`);
      assert(exists(path.join(srcDir, "icons", `${name}.svg`)), `${relativeFile(file)}: missing src/icons/${name}.svg`);
    }
  }
  const iconScripts = [read(path.join(docsDir, "js", "site.js")), read(path.join(layoutsDir, "layouts.js"))].join("\n");
  assert.match(iconScripts, /src\/icons/);
  assert(!/(?:unpkg|jsdelivr|cdnjs|lucide\.dev\/.*\.js)/i.test(iconScripts), "icon loaders must not use a CDN");
});

test("rendered HTML preserves accessible names, native controls, and route semantics", () => {
  const expectations = {
    accordion: [/<details\b/i, /<summary\b/i],
    "app-shell": [/<header\b/i, /<nav\b/i, /data-theme-toggle/i],
    "date-range-picker": [/<fieldset\b/i, /<input\b[^>]*type=["']date["']/i],
    "data-table": [/<table\b/i, /data-table-filter/i, /role=["']status["']/i],
    dialog: [/<dialog\b/i, /showModal\(\)/i],
    popover: [/\bpopover\b/i, /popovertarget/i],
    progress: [/<progress\b/i],
    select: [/<select\b/i],
    sidebar: [/<aside\b/i, /<nav\b/i, /<dialog\b/i],
    table: [/<table\b/i, /<caption\b/i]
  };
  for (const [slug, patterns] of Object.entries(expectations)) {
    const docs = read(path.join(docsDir, `${slug}.html`));
    const skill = read(path.join(componentsDir, slug, `${slug}.md`));
    patterns.forEach((pattern) => {
      assert.match(docs + skill, pattern, `${slug}: native/progressive contract is missing ${pattern}`);
    });
  }

  const vertical = read(path.join(layoutsDir, "vertical-navbar.html"));
  const horizontal = read(path.join(layoutsDir, "horizontal-navbar.html"));
  [vertical, horizontal].forEach((html, index) => {
    for (const button of tags(stripExamples(html), "button")) {
      assert(["button", "submit", "reset"].includes(attributes(button).type), `layout ${index === 0 ? "vertical" : "horizontal"}: every button needs an explicit type`);
    }
  });
  assert.match(vertical, /class=["'][^"']*sidebar-layout/);
  assert.match(vertical, /<aside\b[^>]*class=["'][^"']*app-sidebar/);
  assert.match(vertical, /<nav\b[^>]*class=["'][^"']*sidebar-nav/);
  assert.match(vertical, /data-state=["']expanded["']/);
  assert.match(vertical, /data-sidebar-trigger=/);
  assert.match(vertical, /<dialog\b[^>]*class=["'][^"']*sidebar-mobile/);
  assert.match(horizontal, /<header\b/);
  assert.match(horizontal, /<nav\b[^>]*class=["'][^"']*layout-top-nav/);
  assert(!/<(?:nav|div)\b[^>]*class=["'][^"']*layout-top-nav[^"']*["'][^>]*[\s\S]*role=["']tablist["']/i.test(horizontal), "route navigation must not be a tablist");
  assert(!/role=["'](?:tab|tablist|tabpanel)["']/i.test(horizontal), "top navigation must use native links, not tab roles");
});

test("current source does not import retired trees or hooks", () => {
  const currentFiles = [
    path.join(srcDir, "base.css"),
    path.join(srcDir, "tokens.css"),
    ...componentDirectories.flatMap((slug) => listFiles(path.join(componentsDir, slug)).map((name) => path.join(componentsDir, slug, name))),
    ...sourceHtmlFiles,
    path.join(docsDir, "js", "layout.js"),
    path.join(docsDir, "js", "site.js"),
    path.join(layoutsDir, "layouts.css"),
    path.join(layoutsDir, "layouts.js"),
    registryPath
  ];
  const retired = /(?:^|[/'"])(?:legacy|catalog|snippets)(?:[/'"]|$)|src\/(?:mewa\.css|components\.js|lucide\.svg)|data-ui-/i;
  const matches = currentFiles.flatMap((file) => {
    const source = read(file);
    return retired.test(source) ? [relativeFile(file)] : [];
  });
  assert.deepEqual(matches, [], `retired source references remain: ${matches.join(", ")}`);
});

test("native fallback and SPA enhancement contracts stay explicit", () => {
  const router = read(path.join(docsDir, "js", "layout.js"));
  assert.match(router, /loadPageModules/);
  assert.match(router, /import\(url\)/);
  assert(!/class=['"]input nav-filter-input/.test(router), "the docs filter must use the current Text Field hook");
  assert.match(router, /id="theme-toggle"[^>]*type="button"/, "generated theme toggle must declare button type");
  assert.match(router, /class="sidebar-toggle"[^>]*type="button"/, "generated navigation toggle must declare button type");
  assert(!/docs-skip-link|Skip to content/.test(router), "static pages must own the skip link markup");

  const textField = read(path.join(componentsDir, "text-field", "text-field.md"));
  [
    /id="username-description"/, /aria-describedby="username-description"/,
    /id="bad-email-error"/, /aria-errormessage="bad-email-error"/,
    /for="icon-search"/, /id="icon-search"/,
    /for="button-search"/, /id="button-search"/
  ].forEach((pattern) => assert.match(textField, pattern, `text-field skill is missing ${pattern}`));
  const textFieldDoc = read(path.join(docsDir, "text-field.html"));
  [
    /id="text-field-standalone-email-help"/, /aria-describedby="text-field-standalone-email-help"/,
    /id="password"/, /for="password"/, /id="text-field-form-email-help"/, /aria-describedby="text-field-form-email-help"/
  ].forEach((pattern) => assert.match(textFieldDoc, pattern, `text-field docs are missing ${pattern}`));
  const fieldDoc = read(path.join(docsDir, "field.html"));
  assert(!/<div[^>]+class=["']field["'][^>]+role=["']group["']/i.test(fieldDoc), "single fields must not expose unnamed group roles");
  assert(!/<fieldset[\s\S]*role=["']group["']/i.test(fieldDoc), "fieldset examples must not add a redundant nested group");
  const skeleton = read(path.join(componentsDir, "skeleton", "skeleton.md"));
  assert.match(skeleton, /^## Native Web APIs\s+[\s\S]*?<div>/m, "skeleton must document its static native basis");
  assert.match(skeleton, /aria-hidden="true"/i, "skeleton examples must keep decorative placeholders hidden");
  const iconEntry = components.find((component) => component.slug === "icon");
  assert(iconEntry && !iconEntry.requiresJs && !iconEntry.enhancementJs && iconEntry.nativeBasis.includes("Inline `<svg>`"), "icon registry metadata must describe the inline SVG no-JavaScript basis");
  const readme = read(path.join(root, "README.md"));
  assert.match(readme, /Inline the matching SVG for the no-JavaScript path/i, "README must lead with the inline SVG icon path");
  const iconDoc = read(path.join(docsDir, "icon.html"));
  assert.match(iconDoc, /<svg[^>]+aria-hidden="true"/, "Icon docs must provide an inline SVG copy example");
  assert(!/legacy|existing input/i.test(textFieldDoc), "Text Field docs must not retain migration-era terminology");
  const datePicker = read(path.join(componentsDir, "date-picker", "date-picker.md"));
  assert(!/\.calendar|calendar:select/i.test(datePicker), "Date Picker docs must use the Kernel-aligned component naming");

  const dataTable = read(path.join(docsDir, "data-table.html"));
  assert.match(dataTable, /<form class="data-table-filter-group"/);
  assert.match(dataTable, /data-table-clear type="reset"/);
  assert.match(dataTable, /<a class="data-table-sort"[^>]+href=/);

  const resizable = read(path.join(docsDir, "resizable.html"));
  assert.match(resizable, /<div class="resizable-handle" role="separator"/);
  assert(!/<button[^>]+class="resizable-handle"/.test(resizable), "the no-JavaScript divider must not expose a dead button");
});

test("package scripts remain dependency-free for production", () => {
  const packageJson = JSON.parse(read(path.join(root, "package.json")));
  assert.equal(packageJson.private, true);
  assert.deepEqual(packageJson.dependencies || {}, {});
  assert.equal(packageJson.scripts?.test, "node tests/catalog-contract.test.js && node tests/runtime-contract.test.js");
  assert.equal(packageJson.scripts?.["test:browser"], "node tests/browser-smoke.mjs");
  assert.equal(packageJson.devDependencies?.["puppeteer-core"], "25.3.0");
});

if (failures) process.exitCode = 1;
