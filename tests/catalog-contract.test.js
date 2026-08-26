"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const componentsDir = path.join(root, "components");
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

test("registry v2 defines the canonical source roots", () => {
  assert.equal(registry.schemaVersion, 2);
  assert.equal(registry.name, "mewa_ui");
  assert.deepEqual(registry.canonicalAssets, {
    foundations: ["src/base.css", "src/tokens.css"],
    fonts: ["src/geist.woff2", "src/geistmono.woff2"],
    icons: "src/icons/",
    components: "components/",
    documentation: "docs/",
    system: "system/"
  });
  assert(!exists("layouts"), "complete layout templates must not ship in this repository");
});

test("registry selection metadata covers every component", () => {
  assert.equal(registry.components.length, 59);
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
    assert.equal(component.files.skill, `components/${component.slug}/${component.slug}.md`);
    assert.equal(component.files.css, `components/${component.slug}/${component.slug}.css`);
    assert.equal(component.docs, `docs/${component.slug}.html`);
    if (component.jsMode === "none") assert.equal(component.files.js, undefined, `${component.slug}: unexpected module`);
    else assert.equal(component.files.js, `components/${component.slug}/${component.slug}.js`);
    for (const file of [component.files.skill, component.files.css, component.files.js, component.docs].filter(Boolean)) {
      assert(exists(file), `${component.slug}: missing ${file}`);
    }
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
  const tokensCss = read("src/tokens.css");
  const cssNames = new Set(Array.from(tokensCss.matchAll(/^\s*(--(?:background|surface|overlay|text|border|chart)-?[\w-]*)\s*:/gm), (match) => match[1]));
  const metadata = registry.designTokens?.semantic || [];
  const metadataNames = new Set(metadata.map((token) => token.name));

  assert(metadata.length > 0, "registry designTokens.semantic is required");
  assert.deepEqual(metadataNames, cssNames, "semantic token metadata must match src/tokens.css");
  metadata.forEach((token) => {
    assert.equal(typeof token.purpose, "string");
    assert(token.purpose.length >= 12, `${token.name}: purpose is too terse`);
    assert.equal(token.stability, "stable");
  });
});

test("foundation tokens match the shared Penpot contract", () => {
  const base = read("src/base.css");
  const tokens = read("src/tokens.css");
  const steps = ["050", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];

  const readOklch = (name) => {
    const match = base.match(new RegExp(`${name}:\\s*oklch\\(([\\d.]+)%\\s+([\\d.]+)(?:\\s+([\\d.]+))?\\)`));
    assert(match, `src/base.css: ${name} must be a solid OKLCH color`);
    return [Number(match[1]) / 100, Number(match[2]), Number(match[3] || 0)];
  };

  const relativeLuminance = ([lightness, chroma, hue]) => {
    const angle = hue * Math.PI / 180;
    const a = chroma * Math.cos(angle);
    const b = chroma * Math.sin(angle);
    const l = Math.pow(lightness + 0.3963377774 * a + 0.2158037573 * b, 3);
    const m = Math.pow(lightness - 0.1055613458 * a - 0.0638541728 * b, 3);
    const s = Math.pow(lightness - 0.0894841775 * a - 1.291485548 * b, 3);
    const linear = [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
    ].map((channel) => Math.max(0, Math.min(1, channel)));
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };

  const contrast = (foreground, background) => {
    const foregroundLuminance = relativeLuminance(foreground);
    const backgroundLuminance = relativeLuminance(background);
    return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
      (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
  };

  for (const name of [
    "--color-neutral-000",
    "--color-neutral-050",
    "--color-neutral-950",
    "--color-alpha-neutral-050",
    "--color-alpha-red-950",
    "--space-100",
    "--size-1000",
    "--border-width-025",
    "--font-weight-550",
    "--breakpoint-compact"
  ]) {
    assert(base.includes(`${name}:`), `src/base.css: missing ${name}`);
  }

  for (const role of [
    "--surface-hover",
    "--surface-selected",
    "--surface-disabled",
    "--overlay-strong",
    "--border-focus",
    "--border-positive",
    "--chart-area-positive"
  ]) {
    assert(tokens.includes(`${role}:`), `src/tokens.css: missing ${role}`);
  }

  assert(!/oklch\(0(?:%|\s)/i.test(base), "src/base.css: pure black is forbidden");
  assert(!base.includes("--color-black:"), "src/base.css: black aliases are forbidden");
  assert(!base.includes("--color-white:"), "src/base.css: white must use neutral 000");
  assert.match(base, /--font-weight-550:\s*550/, "CSS must retain the variable-font 550 weight");

  for (const family of ["red", "amber", "green", "blue"]) {
    const palette = steps.map((step) => readOklch(`--color-${family}-${step}`));
    assert(palette.every((color) => color[2] === palette[0][2]), `${family}: hue must stay constant across the palette`);
  }

  const lightAnchor = readOklch("--color-neutral-050");
  const darkAnchor = readOklch("--color-neutral-950");
  for (const family of ["neutral", "red", "amber", "green", "blue"]) {
    const lightContrast = contrast(readOklch(`--color-${family}-600`), lightAnchor);
    const darkContrast = contrast(readOklch(`--color-${family}-400`), darkAnchor);
    assert(lightContrast >= 4.5, `${family} 600 must pass normal-text contrast on neutral 050`);
    assert(darkContrast >= 4.5, `${family} 400 must pass normal-text contrast on neutral 950`);
    assert(Math.abs(lightContrast - darkContrast) <= 0.1, `${family}: paired contrast must stay symmetrical across neutral 050 and 950`);
  }
});

test("component CSS stays square, tokenized, shadow-free, and motionless", () => {
  for (const component of registry.components) {
    const filename = component.files.css;
    const source = stripCssComments(read(filename));
    assert.match(source, /@layer\s+components/, `${filename}: missing components layer`);
    assert(!/\b(?:box-shadow|text-shadow)\s*:/i.test(source), `${filename}: shadows are forbidden`);
    if (component.slug !== "spinner") {
      assert(!/\b(?:animation|transition)(?:-[\w]+)?\s*:/i.test(source), `${filename}: motion is forbidden`);
      assert(!/@keyframes|view-transition|\bscroll-behavior\s*:/i.test(source), `${filename}: motion is forbidden`);
    }
    assert(!/var\(\s*--color-[\w-]+\s*\)/i.test(source), `${filename}: palette primitives are forbidden`);
    for (const match of source.matchAll(/border-radius\s*:\s*([^;{}]+)/gi)) {
      assert(/^(?:0|50%|inherit|var\(--border-radius-6400\)|var\(--border-radius-000\))$/i.test(match[1].trim()), `${filename}: unsupported radius ${match[1].trim()}`);
    }
  }
});

test("component CSS does not contain consumer-specific selectors", () => {
  const consumerTerms = [
    "bookmark",
    "mewa-bookmarks",
    "rss",
    "hf-ui",
    "media-ui",
    "memes-ui",
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
    "src/base.css",
    "src/tokens.css",
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

test("high-risk native-first runtime contracts do not regress", () => {
  const dialog = read("components/dialog/dialog.js");
  assert(!/dialog\.focus\(\)/.test(dialog), "Dialog must let native showModal and autofocus choose initial focus");
  assert(!/setAttribute\(['\"]tabindex['\"]/.test(dialog), "Dialog must not add tabindex to native dialog");

  for (const slug of ["popover", "tooltip"]) {
    const source = read(`components/${slug}/${slug}.js`);
    assert.match(source, /delete trigger\.dataset\.init/, `${slug}: missing-target initialization must retry`);
  }

  const tabs = read("components/tabs/tabs.md");
  assert.match(tabs, /automatic activation/i, "Tabs must document automatic activation");
  assert(!/manual activation mode/i.test(tabs), "Tabs must not document an unsupported manual activation mode");

  for (const slug of ["resizable", "sortable"]) {
    const script = read(`components/${slug}/${slug}.js`);
    const css = read(`components/${slug}/${slug}.css`);
    const skill = read(`components/${slug}/${slug}.md`);
    assert.match(script, /data-(?:resizable|sortable)-(?:decrease|increase)/, `${slug}: missing non-drag pointer controls`);
    assert.match(css, new RegExp(`\\.${slug === "resizable" ? "resizable" : "sortable"}-step[\\s\\S]*(?:inline-size|width):\\s*var\\(--size-800\\)`), `${slug}: pointer controls must use a 32px target`);
    assert(/Do not (?:rely on dragging|make dragging)/.test(skill), `${slug}: skill must prohibit drag-only interaction`);
  }

  const carouselCss = read("components/carousel/carousel.css");
  assert.match(carouselCss, /\.carousel-dot[\s\S]*width:\s*var\(--size-600\)/, "Carousel direct-slide controls must use a 24px target");
});

test("agent-facing source does not reference the retired layouts directory", () => {
  const filesToCheck = [
    "DESIGN.md",
    "README.md",
    "AGENTS.md",
    "llms.txt",
    "PROMPT.md",
    "system/foundations.md",
    "system/components.md",
    "system/patterns.md",
    "system/layouts.md",
    "system/accessibility.md",
    "registry.json"
  ];
  for (const filename of filesToCheck) {
    assert(!/\blayouts\//.test(read(filename)), `${filename}: references retired layouts/`);
  }
});

if (failures) process.exitCode = 1;
