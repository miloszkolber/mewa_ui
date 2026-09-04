"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const componentsDir = path.join(root, "library", "components");
const docsDir = path.join(root, "docs");
const registry = JSON.parse(fs.readFileSync(path.join(root, "registry.json"), "utf8"));

const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const directories = (directory) => fs.readdirSync(directory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const files = (directory, suffix = "") => fs.readdirSync(directory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
  .map((entry) => entry.name)
  .sort();

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

function stripCssComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

function stripMarkdownFences(source) {
  return source.replace(/```[\s\S]*?```/g, "");
}

test("registry v3 defines the canonical source roots", () => {
  assert.equal(registry.schemaVersion, 3);
  assert.equal(registry.name, "mewa_ui");
  assert.deepEqual(registry.canonicalAssets, {
    foundations: ["library/src/base.css", "library/src/tokens.css"],
    fonts: ["library/src/geist.woff2", "library/src/geistmono.woff2"],
    licenses: {
      geist: "library/src/licenses/GEIST-OFL.txt",
      lucide: "library/src/licenses/LUCIDE-LICENSE.txt"
    },
    icons: "library/src/icons/",
    components: "library/components/",
    runtime: "library/runtime/",
    documentation: "docs/",
    system: "library/system/"
  });
  assert(!exists("layouts"), "complete layout templates must not ship in this repository");
});

test("registry selection metadata covers every component", () => {
  assert.equal(registry.components.length, 80);
  const slugs = registry.components.map((component) => component.slug).sort();
  assert.deepEqual(slugs, directories(componentsDir));

  for (const component of registry.components) {
    assert.match(component.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    for (const field of ["name", "category", "purpose", "useWhen", "avoidWhen", "fallback", "stability", "nativeBasis", "jsMode", "docs"]) {
      assert.equal(typeof component[field], "string", `${component.slug}: missing ${field}`);
      assert(component[field].trim().length > 0, `${component.slug}: empty ${field}`);
    }
    assert(["none", "optional", "required"].includes(component.jsMode), `${component.slug}: invalid jsMode`);
    assert.equal(component.requiresJs, component.jsMode === "required", `${component.slug}: requiresJs drift`);
    assert.equal(component.enhancementJs, component.jsMode === "optional", `${component.slug}: enhancementJs drift`);
    for (const field of ["styleDependencies", "behaviorDependencies", "assets"]) {
      assert(Array.isArray(component[field]), `${component.slug}: ${field} must be an array`);
      assert.equal(new Set(component[field]).size, component[field].length, `${component.slug}: duplicate ${field}`);
      component[field].forEach((entry) => assert.equal(typeof entry, "string", `${component.slug}: non-string ${field} entry`));
    }
    if (component.jsMode === "none") assert.deepEqual(component.behaviorDependencies, [], `${component.slug}: behavior dependencies require an auto entry`);
    assert.equal(component.files.skill, `library/components/${component.slug}/${component.slug}.md`);
    assert.equal(component.files.css, `library/components/${component.slug}/${component.slug}.css`);
    assert.equal(component.docs, `docs/${component.slug}.html`);
    if (component.jsMode === "none") assert.equal(component.files.js, undefined, `${component.slug}: unexpected module`);
    else assert.equal(component.files.js, `library/components/${component.slug}/${component.slug}.js`);
    for (const file of [component.files.skill, component.files.css, component.files.js, component.docs].filter(Boolean)) {
      assert(exists(file), `${component.slug}: missing ${file}`);
    }
  }
});

test("component dependency metadata references the catalog without cycles", () => {
  const bySlug = new Map(registry.components.map((component) => [component.slug, component]));

  for (const field of ["styleDependencies", "behaviorDependencies"]) {
    const visit = (component, active = new Set(), complete = new Set()) => {
      if (active.has(component.slug)) throw new Error(`${field}: cycle includes ${Array.from(active).join(" -> ")} -> ${component.slug}`);
      if (complete.has(component.slug)) return;
      active.add(component.slug);
      for (const slug of component[field]) {
        assert.notEqual(slug, component.slug, `${component.slug}: ${field} cannot reference itself`);
        assert(bySlug.has(slug), `${component.slug}: unknown ${field} entry ${slug}`);
        if (field === "behaviorDependencies") {
          assert.notEqual(bySlug.get(slug).jsMode, "none", `${component.slug}: ${slug} has no behavior module`);
        }
        visit(bySlug.get(slug), active, complete);
      }
      active.delete(component.slug);
      complete.add(component.slug);
    };

    const complete = new Set();
    registry.components.forEach((component) => visit(component, new Set(), complete));
  }
});

test("component folders contain only the contract, stylesheet, and optional module", () => {
  for (const component of registry.components) {
    const names = files(path.join(componentsDir, component.slug));
    const expected = [`${component.slug}.css`, `${component.slug}.md`];
    if (component.files.js) expected.push(`${component.slug}.js`);
    assert.deepEqual(names, expected.sort(), `${component.slug}: component folder contains an extra or missing file`);
  }
});

test("docs have exact parity with the registry", () => {
  const docs = files(docsDir, ".html").map((name) => name.slice(0, -5)).sort();
  const slugs = registry.components.map((component) => component.slug).sort();
  assert.deepEqual(docs, slugs);
});

test("every documentation page loads the generated component stylesheet once", () => {
  for (const component of registry.components) {
    const source = read(component.docs);
    assert(source.includes('href="css/components.generated.css"'), `${component.docs}: missing generated component styles`);
    assert.equal((source.match(/href="css\/components\.generated\.css"/g) || []).length, 1, `${component.docs}: duplicate generated component styles`);
    assert(!/href="\.\.\/library\/components\//.test(source), `${component.docs}: raw component stylesheet remains`);
  }
});

test("human documentation stays free of internal and unrelated-library language", () => {
  const discouragedPhrases = [
    "Kernel-aligned",
    "component skill",
    "design-system demo",
    "canonical popover pattern"
  ];

  for (const component of registry.components) {
    const source = read(component.docs);
    for (const phrase of discouragedPhrases) {
      assert(!source.includes(phrase), `${component.docs}: contains internal-facing phrase ${phrase}`);
    }
  }
});

test("every component skill states purpose, implementation, accessibility, runtime, and selection guidance", () => {
  for (const component of registry.components) {
    const source = read(component.files.skill);
    const prose = stripMarkdownFences(source);

    assert.match(source, /^#\s+\S/m, `${component.slug}: missing title`);
    assert.match(source, /^## Purpose\s*$/im, `${component.slug}: missing Purpose`);
    assert.match(source, /^## Native basis\s*$/im, `${component.slug}: missing Native basis`);
    assert.match(source, /^## Native Web APIs\s*$/im, `${component.slug}: missing Native Web APIs`);
    assert(
      /^## (?:Structure|Markup|Usage|Examples|Variants|Default|Multi-open structure|One field|Container)\b/im.test(source) || /```html\b/i.test(source),
      `${component.slug}: missing structure or HTML example`
    );
    assert(
      /^## (?:Accessibility|ARIA)\b/im.test(source) || /\baccessib(?:le|ility)\b/i.test(prose),
      `${component.slug}: missing accessibility guidance`
    );
    assert.match(source, /^## Runtime\s*$/im, `${component.slug}: missing Runtime`);
    assert(!/style\s*=\s*["']/i.test(source), `${component.slug}: canonical Markdown examples must not use inline style attributes`);
    assert(/\bUse\b/.test(prose), `${component.slug}: missing explicit use guidance`);
    assert(/\bDo not\b/.test(prose), `${component.slug}: missing explicit misuse guidance`);

    if (component.jsMode !== "none") {
      assert(
        /^## (?:Behavior|Keyboard|Events|Progressive enhancement|No-JavaScript)\b/im.test(source),
        `${component.slug}: enhanced skill must explain interactive behavior or fallback`
      );
    }
  }
});

test("semantic tokens have machine-readable purposes", () => {
  const tokensCss = read("library/src/tokens.css");
  const cssNames = new Set(Array.from(tokensCss.matchAll(/^\s*(--(?:background|surface|overlay|text|border|chart)-?[\w-]*)\s*:/gm), (match) => match[1]));
  const metadata = registry.designTokens?.semantic || [];
  const metadataNames = new Set(metadata.map((token) => token.name));

  assert(metadata.length > 0, "registry designTokens.semantic is required");
  assert.deepEqual(metadataNames, cssNames, "semantic token metadata must match library/src/tokens.css");
  metadata.forEach((token) => {
    assert.equal(typeof token.purpose, "string");
    assert(token.purpose.length >= 12, `${token.name}: purpose is too terse`);
    assert.equal(token.stability, "stable");
  });
});

test("component CSS stays square, tokenized, shadow-free, and motion-controlled", () => {
  for (const component of registry.components) {
    const filename = component.files.css;
    const source = stripCssComments(read(filename));
    assert.match(source, /@layer\s+components/, `${filename}: missing components layer`);
    assert(!/\b(?:box-shadow|text-shadow)\s*:/i.test(source), `${filename}: shadows are forbidden`);
    if (component.slug !== "spinner") {
      assert(!/\banimation(?:-[\w]+)?\s*:/i.test(source), `${filename}: continuous animation is forbidden`);
      assert(!/@keyframes|view-transition|\bscroll-behavior\s*:/i.test(source), `${filename}: continuous or scroll motion is forbidden`);
      assert(!/\btransition\s*:\s*all\b/i.test(source), `${filename}: transition: all is forbidden`);
      assert(!/\btransition-delay\s*:/i.test(source), `${filename}: delayed state feedback is forbidden`);
      for (const match of source.matchAll(/transition-duration\s*:\s*([^;{}]+)/gi)) {
        assert(/^(?:var\(--motion-duration-(?:fast|spatial)\)|0ms)$/i.test(match[1].trim()), `${filename}: unsupported transition duration ${match[1].trim()}`);
      }
      for (const match of source.matchAll(/transition-timing-function\s*:\s*([^;{}]+)/gi)) {
        assert.equal(match[1].trim(), "var(--motion-easing-standard)", `${filename}: unsupported transition easing`);
      }
    }
    assert(!/var\(\s*--color-[\w-]+\s*\)/i.test(source), `${filename}: palette primitives are forbidden`);
    for (const match of source.matchAll(/border-radius\s*:\s*([^;{}]+)/gi)) {
      assert(/^(?:0|50%|inherit|var\(--border-radius-6400\)|var\(--border-radius-000\))$/i.test(match[1].trim()), `${filename}: unsupported radius ${match[1].trim()}`);
    }
  }
});

test("App Shell provides the shared dense row composition", () => {
  const source = stripCssComments(read("library/components/app-shell/app-shell.css"));
  for (const hook of ["app-dense-list", "app-dense-row", "app-dense-leading", "app-dense-copy", "app-dense-heading", "app-dense-actions"]) {
    assert.match(source, new RegExp(`\\.${hook}\\b`), `missing .${hook}`);
  }
  assert.match(source, /\.app-dense-row\s*\{[\s\S]*border-block-end:\s*var\(--border-width-025\) dashed var\(--border-muted\)/);
  assert.match(source, /\.app-section\s*>\s*:is\([^)]*\.app-dense-list/);
  assert.match(source, /@media\s*\(max-width:\s*37\.5rem\)[\s\S]*\.app-dense-actions[\s\S]*grid-column:\s*2/);
});

test("the base contract provides state and spatial motion with a reduced-motion override", () => {
  const source = stripCssComments(read("library/src/base.css"));
  assert.match(source, /--motion-duration-fast:\s*100ms/);
  assert.match(source, /--motion-duration-spatial:\s*160ms/);
  assert.match(source, /--motion-easing-standard:\s*cubic-bezier\(0\.2, 0, 0, 1\)/);
  assert.match(source, /transition-property:\s*color, background-color, border-color, opacity/);
  assert.match(source, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(source, /transition-duration:\s*0ms/);
});

test("component CSS does not contain consumer-specific selectors", () => {
  const consumerTerms = [
    "bookmark",
    "mewa-bookmarks",
    "rss",
    "hf-ui",
    "media-ui",
    "memes-ui",
    "magpie",
    "moonlight",
    "homelab",
    "dufs",
    "uncanny"
  ];
  for (const component of registry.components) {
    const source = stripCssComments(read(component.files.css)).toLowerCase();
    for (const term of consumerTerms) {
      assert(!source.includes(term), `${component.files.css}: consumer-specific term ${term}`);
    }
  }
});

test("shared CSS rejects raw pixel breakpoints and retired width presets", () => {
  const stylesheets = [
    "library/src/base.css",
    "library/src/tokens.css",
    ...registry.components.map((component) => component.files.css)
  ];
  for (const filename of stylesheets) {
    const source = stripCssComments(read(filename));
    assert(!/@media[^{]*\(\s*(?:min|max)-width\s*:\s*\d+(?:\.\d+)?px\s*\)/i.test(source), `${filename}: use rem breakpoints`);
    assert(!/@media[^{]*\(\s*width\s*[<>]=?\s*\d+(?:\.\d+)?px\s*\)/i.test(source), `${filename}: use rem breakpoints`);
    assert(!/\b78rem\b/.test(source), `${filename}: 78rem is not an approved global canvas`);
    assert(!/\b767px\b|\b768px\b/.test(source), `${filename}: pixel shell breakpoints are not approved`);
  }
});

test("App Shell resets the wrapped mobile navigation margin", () => {
  const source = stripCssComments(read("library/components/app-shell/app-shell.css"));
  assert.match(
    source,
    /\.app-nav\s*\{\s*flex-basis:\s*100%;[\s\S]*?flex-wrap:\s*nowrap;[\s\S]*?margin-block:\s*0;/,
    "mobile App Shell navigation must not overlap adjacent wrapped header content"
  );
});

test("high-risk native-first runtime contracts do not regress", () => {
  const dialog = read("library/components/dialog/dialog.js");
  assert(!/dialog\.focus\(\)/.test(dialog), "Dialog must let native showModal and autofocus choose initial focus");
  assert(!/setAttribute\(['\"]tabindex['\"]/.test(dialog), "Dialog must not add tabindex to native dialog");

  for (const slug of ["popover", "tooltip"]) {
    const source = read(`library/components/${slug}/${slug}.js`);
    assert.match(source, /delete trigger\.dataset\.init/, `${slug}: missing-target initialization must retry`);
  }

  const tabs = read("library/components/tabs/tabs.md");
  assert.match(tabs, /automatic activation/i, "Tabs must document automatic activation");
  assert(!/manual activation mode/i.test(tabs), "Tabs must not document an unsupported manual activation mode");

  for (const slug of ["resizable", "sortable"]) {
    const script = read(`library/components/${slug}/${slug}.js`);
    const css = read(`library/components/${slug}/${slug}.css`);
    const skill = read(`library/components/${slug}/${slug}.md`);
    assert.match(script, /data-(?:resizable|sortable)-(?:decrease|increase)/, `${slug}: missing non-drag pointer controls`);
    assert.match(css, new RegExp(`\\.${slug === "resizable" ? "resizable" : "sortable"}-step[\\s\\S]*(?:inline-size|width):\\s*var\\(--size-800\\)`), `${slug}: pointer controls must use a 32px target`);
    assert(/Do not (?:rely on dragging|make dragging)/.test(skill), `${slug}: skill must prohibit drag-only interaction`);
  }

  const carouselCss = read("library/components/carousel/carousel.css");
  assert.match(carouselCss, /\.carousel-dot[\s\S]*width:\s*var\(--size-600\)/, "Carousel direct-slide controls must use a 24px target");
});

test("agent-facing source does not reference the retired layouts directory", () => {
  const filesToCheck = [
    "library/DESIGN.md",
    "README.md",
    "AGENTS.md",
    "llms.txt",
    "PROMPT.md",
    "library/system/foundations.md",
    "library/system/components.md",
    "library/system/patterns.md",
    "library/system/layouts.md",
    "library/system/accessibility.md",
    "registry.json"
  ];
  for (const filename of filesToCheck) {
    assert(!/\blayouts\//.test(read(filename)), `${filename}: references retired layouts/`);
  }
});

if (failures) process.exitCode = 1;
