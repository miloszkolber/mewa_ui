"use strict";

// External verification: node tests/catalog-contract.test.js
// Bun may run this file too, but native Node.js checks the shipped scripts when available.

const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const catalogDir = path.join(root, "catalog");
const snippetsDir = path.join(root, "snippets");
const layoutsDir = path.join(root, "layouts");
const srcDir = path.join(root, "src");
const manifestPath = path.join(catalogDir, "components.json");
const canonicalBaseCss = path.join(srcDir, "base.css");
const canonicalComponentCss = path.join(srcDir, "mewa.css");
const canonicalDemoCss = path.join(srcDir, "demo.css");
const canonicalRuntime = path.join(srcDir, "components.js");
const canonicalSprite = path.join(srcDir, "lucide.svg");
const canonicalLlmGuide = path.join(root, "llms.txt");
const canonicalProductionStylesheets = ["/ui/src/base.css", "/ui/src/mewa.css"];
const canonicalDemoStylesheets = [...canonicalProductionStylesheets, "/ui/src/demo.css"];
// Declared inventory: the original shadcn-aligned set plus selected, broadly useful
// primitives from daisyUI, Basecoat, Coss, and 0build. Every item must ship as a
// real snippet with the same canonical assets and contract checks.
const expectedNames = [
    "Accordion", "Alert", "Aspect Ratio", "Attachment", "Autocomplete", "Avatar", "Badge", "Breadcrumb", "Button", "Button Group", "Calendar", "Card", "Carousel", "Chart", "Checkbox", "Checkbox Group", "Collapsible", "Combobox", "Command", "Data Table", "Date Picker", "Dialog", "Diff", "Drawer", "Dropdown Menu", "Empty", "Field", "Fieldset", "File Input", "Input", "Input Group", "Item", "Kbd", "Label", "Lightbox", "Marker", "Message", "Message Scroller", "Native Select", "Navbar Horizontal", "Navbar Vertical", "Number Field", "Pagination", "Popover", "Progress", "Questionnaire", "Radio Group", "Resizable", "Scroll Area", "Scroll Fade", "Select", "Separator", "Sheet", "Shimmer", "Skeleton", "Slider", "Sortable List", "Spinner", "Split Button", "Stat", "Switch", "Table", "Tabs", "Textarea", "Time Field", "Timeline", "Toast", "Toggle", "Tooltip", "Typography"
].sort();
const permittedStates = new Set(["ok", "warning", "error", "running", "progress"]);
const legacyClasses = new Set(["is-busy", "is-empty", "is-idle"]);
// These are semantic marker classes deliberately styled by their containing component
// or native element, rather than a standalone class rule.
const explicitClassAllowlist = new Set(["ui-alert-icon", "ui-aspect-ratio-icon", "ui-attachment-icon", "ui-avatar-fallback", "ui-breadcrumb", "ui-button-danger", "ui-button-icon", "ui-button-primary", "ui-button-secondary", "ui-button-tertiary", "ui-empty-icon", "ui-item-action", "ui-item-icon", "ui-item-title", "ui-kbd-row", "ui-message-icon", "ui-scroll-area-list", "ui-scroll-area-title", "ui-skeleton-avatar", "ui-skeleton-text", "ui-skeleton-title", "ui-spin", "ui-switch-title"]);
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

function read(file) {
    return fs.readFileSync(file, "utf8");
}

function existingFiles(directory, suffix) {
    return fs.existsSync(directory) ? fs.readdirSync(directory).filter((file) => file.endsWith(suffix)).sort() : [];
}

function repositorySourceFiles(directory) {
    const extensions = new Set([".c", ".cc", ".conf", ".cpp", ".css", ".go", ".h", ".html", ".ini", ".java", ".js", ".json", ".jsx", ".mjs", ".md", ".py", ".rs", ".scss", ".service", ".sh", ".svelte", ".svg", ".toml", ".ts", ".tmpl", ".tpl", ".tsx", ".vue", ".yaml", ".yml"]);
    const names = new Set(["Dockerfile", "Makefile", "Procfile"]);
    const files = [];
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            if (![".git", "node_modules"].includes(entry.name)) files.push(...repositorySourceFiles(file));
            continue;
        }
        if (!entry.isFile() || file === path.join(root, "core-ui.css") || file === __filename) continue;
        if (extensions.has(path.extname(entry.name).toLowerCase()) || names.has(entry.name)) files.push(file);
    }
    return files;
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

function idsAndTargets(html, filename) {
    const ids = new Set();
    const targetAttributes = ["aria-labelledby", "aria-describedby", "aria-controls", "aria-owns"];
    for (const match of html.matchAll(/<[^>]+>/g)) {
        const attrs = attributes(match[0]);
        if (attrs.id) {
            assert(!ids.has(attrs.id), `${filename}: duplicate id ${attrs.id}`);
            ids.add(attrs.id);
        }
    }
    for (const match of html.matchAll(/<[^>]+>/g)) {
        const attrs = attributes(match[0]);
        targetAttributes.forEach((attribute) => {
            if (attrs[attribute]) {
                attrs[attribute].split(/\s+/).filter(Boolean).forEach((target) => {
                    assert(ids.has(target), `${filename}: ${attribute} targets missing id ${target}`);
                });
            }
        });
    }
}

function checkMarkupContract(html, filename) {
    assert(!/\sstyle\s*=/i.test(html), `${filename}: inline styles are forbidden`);
    assert(!/\son[a-z]+\s*=/i.test(html), `${filename}: inline event handlers are forbidden`);
    assert(!/https?:\/\/(?:[^"'\s>]*)(?:lucide|fontawesome|material-icons|unpkg|jsdelivr)/i.test(html), `${filename}: external icon provider is forbidden`);
    assert(!/(?:#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\b(?:white|black|red|green|blue|gray|grey|transparent)\b)/i.test(html), `${filename}: raw color token is forbidden`);
    for (const match of html.matchAll(/\bclass\s*=\s*("[^"]*"|'[^']*')/gi)) {
        match[1].slice(1, -1).split(/\s+/).filter(Boolean).forEach((className) => {
            assert(className.startsWith("ui-") || legacyClasses.has(className), `${filename}: public class ${className} must start ui-`);
        });
    }
    for (const match of html.matchAll(/\bdata-state\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
        const value = match[2] || match[3];
        assert(permittedStates.has(value), `${filename}: unsupported data-state ${value}`);
    }
    for (const match of html.matchAll(/<button\b[^>]*>/gi)) {
        const type = attributes(match[0]).type;
        assert(["button", "submit", "reset"].includes(type), `${filename}: every button needs an explicit valid type`);
    }
    idsAndTargets(html, filename);
}

function checkCssContract(css, filename, { allowRawColors = false } = {}) {
    if (!allowRawColors) assert(!/(?:#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\b(?:white|black|red|green|blue|gray|grey)(?=[^a-z-]|$))/i.test(css), `${filename}: raw color is forbidden`);
    for (const match of css.matchAll(/([^{}]+)\{[^{}]*\bbackdrop-filter\s*:\s*blur\(/gi)) {
        assert(/\.ui-(?:dialog|app-header|catalog-overlay|autocomplete|navbar--vertical)|\[data-ui-(?:popover-content|menu-content|dialog|alert-dialog|sheet|drawer|toast)\]|\[data-ui-component="(?:autocomplete|popover|dropdown-menu|tooltip|split-button|sheet|drawer|toast)"\]/.test(match[1]), `${filename}: backdrop blur only belongs on an approved overlapping-surface selector`);
    }
}

function parseOklchPalette(css, prefix) {
    const values = new Map();
    const expression = new RegExp(`--ui-${prefix}-(\\d{3}):\\s*oklch\\(\\s*([\\d.]+)%\\s+([\\d.]+)\\s+([\\d.]+)(?:\\s*\\/\\s*([\\d.]+))?\\s*\\);`, "g");
    for (const match of css.matchAll(expression)) {
        values.set(match[1], {
            lightness: Number(match[2]) / 100,
            chroma: Number(match[3]),
            hue: Number(match[4]),
            alpha: match[5] === undefined ? 1 : Number(match[5])
        });
    }
    return values;
}

function oklchToLinearSrgb({ lightness, chroma, hue }) {
    const radians = hue * Math.PI / 180;
    const a = chroma * Math.cos(radians);
    const b = chroma * Math.sin(radians);
    const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b;
    const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b;
    const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b;
    const l = lPrime ** 3;
    const m = mPrime ** 3;
    const s = sPrime ** 3;
    return [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
    ];
}

function linearToSrgb(channel) {
    return channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
}

function oklchToSrgb(color) {
    return oklchToLinearSrgb(color).map((channel) => Math.max(0, Math.min(1, linearToSrgb(channel))));
}

function apcaLuminance(color) {
    const [red, green, blue] = oklchToSrgb(color);
    return 0.2126729 * red ** 2.4 + 0.7151522 * green ** 2.4 + 0.0721750 * blue ** 2.4;
}

function apcaSoftClamp(luminance) {
    return luminance < 0.022 ? luminance + (0.022 - luminance) ** 1.414 : luminance;
}

function apcaContrast(foreground, background) {
    const text = apcaSoftClamp(apcaLuminance(foreground));
    const surface = apcaSoftClamp(apcaLuminance(background));
    if (Math.abs(surface - text) < 0.0005) return 0;
    if (surface > text) {
        const contrast = (surface ** 0.56 - text ** 0.57) * 1.14;
        return (contrast < 0.1 ? 0 : contrast - 0.027) * 100;
    }
    const contrast = (surface ** 0.65 - text ** 0.62) * 1.14;
    return (contrast > -0.1 ? 0 : contrast + 0.027) * 100;
}

function unTokenizedDimensions(css) {
    const declarations = [];
    for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const selector = rule[1].trim(), body = rule[2];
        for (const match of body.matchAll(/(?:^|;)\s*([\w-]+)\s*:\s*([^;{}]+)(?=;|$)/g)) {
            const property = match[1], value = match[2].trim();
        // Zero, percentages, and the one-pixel visually-hidden clipping rectangle do
        // not encode a design scale. Everything else must consume an existing token.
        if (property.startsWith("--") || /^0(?:[a-z%]+)?$/i.test(value) || /^(?:0|\d+(?:\.\d+)?)%$/.test(value) || /^rect\(0, 0, 0, 0\)$/i.test(value)) continue;
            if (/\.ui-sr-only\b/.test(selector) && /^(?:-?1px|0)$/.test(value)) continue;
            if (/\b\d+(?:\.\d+)?(?:px|rem|em|ch|vw|vh|vmin|vmax|svh|lvh|dvh|s|ms)\b/i.test(value) && !/\bvar\(/.test(value)) declarations.push(`${property}: ${value}`);
        }
    }
    return declarations;
}

function cssHrefsLoadedBy(html, filename) {
    return Array.from(html.matchAll(/<link\b[^>]*\brel=(?:"stylesheet"|'stylesheet')[^>]*\bhref=(?:"([^"]+)"|'([^']+)')/gi), (match) => match[1] || match[2]).map((href) => {
        assert(href.startsWith("/ui/"), `${filename}: stylesheet ${href} is not served from /ui/`);
        assert(fs.existsSync(path.join(root, href.slice("/ui/".length))), `${filename}: missing loaded stylesheet ${href}`);
        return href;
    });
}

function visualShadowDeclarations(css, filename) {
    const failures = [];
    for (const match of css.matchAll(/([^{}]+)\{([^{}]*\b(?:box-shadow|text-shadow)\s*:[^{}]*)\}/gi)) {
        if (/\b(?:box-shadow|text-shadow)\s*:\s*(?:none|initial|unset)\b/i.test(match[2])) continue;
        failures.push(`${filename}: ${match[1].trim().replace(/\s+/g, " ")}`);
    }
    return failures;
}

function uiClasses(html) {
    const classes = new Set();
    for (const match of html.matchAll(/\bclass\s*=\s*("[^"]*"|'[^']*')/gi)) {
        match[1].slice(1, -1).split(/\s+/).filter((name) => name.startsWith("ui-")).forEach((name) => classes.add(name));
    }
    return classes;
}

function classDefinitions(css) {
    return new Set(Array.from(css.matchAll(/\.((?:ui-[a-z0-9-]+))(?![a-z0-9-])/gi), (match) => match[1]));
}

function hasHook(html, hook) {
    return html.includes(hook);
}

test("catalog, manifest, and canonical source assets exist", () => {
    ["index.html", "catalog.js", "components.json"].forEach((file) => assert(fs.existsSync(path.join(catalogDir, file)), `missing catalog/${file}`));
    [canonicalBaseCss, canonicalComponentCss, canonicalDemoCss, canonicalRuntime, canonicalSprite, canonicalLlmGuide].forEach((file) => assert(fs.existsSync(file), `missing ${path.relative(root, file)}`));
    assert(!fs.existsSync(path.join(catalogDir, "catalog.css")), "catalog-specific presentation belongs in src/demo.css");
    assert(fs.existsSync(path.join(root, "core-ui.css")), "legacy root core-ui.css remains present until its removal is orchestrated");
    ["core-ui-components.css", "core-ui.js", "lucide.svg"].forEach((file) => assert(!fs.existsSync(path.join(root, file)), `legacy root ${file} must be removed`));
});

test("deployment files stay outside the standalone library", () => {
    assert(!fs.existsSync(path.join(root, "docker-compose.yaml")), "Compose deployment belongs to the parent repository");
    assert(!fs.existsSync(path.join(root, "nginx.conf")), "Nginx deployment belongs to the parent repository");
});

test("repository consumers do not reference removed root UI assets", () => {
    const dockerRoot = path.dirname(root);
    const forbidden = ["/ui/core-ui-components.css", "/ui/core-ui.js", "/ui/lucide.svg"];
    const matches = [];
    repositorySourceFiles(dockerRoot).forEach((file) => {
        const source = read(file);
        forbidden.forEach((reference) => {
            if (source.includes(reference)) matches.push(`${path.relative(dockerRoot, file)}: ${reference}`);
        });
    });
    assert.deepEqual(matches, [], `removed root UI assets remain referenced:\n${matches.join("\n")}`);
});

test("manifest is the complete declared component set", () => {
    const manifest = JSON.parse(read(manifestPath));
    assert.equal(manifest.length, expectedNames.length, "manifest count must match the declared component set");
    assert.deepEqual(manifest.map((component) => component.name).sort(), expectedNames);
    const slugs = new Set();
    manifest.forEach((component) => {
        assert.match(component.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        assert(!slugs.has(component.slug), `duplicate slug ${component.slug}`);
        slugs.add(component.slug);
        assert.equal(typeof component.group, "string");
        assert.equal(typeof component.description, "string", `${component.slug}: description must be a string`);
        assert(component.description.length >= 24, `${component.slug}: description is too terse for the LLM reference`);
        assert(["static", "interactive"].includes(component.behavior), `${component.slug}: invalid behavior`);
        assert.equal(typeof component.static, "boolean", `${component.slug}: static must be boolean`);
    });
});

test("LLM guide points to canonical machine-readable sources", () => {
    const guide = read(canonicalLlmGuide);
    ["/ui/catalog/components.json", "/ui/snippets/SLUG.html", "/ui/src/base.css", "/ui/src/mewa.css", "/ui/src/components.js", "/ui/src/lucide.svg#SYMBOL_ID"].forEach((reference) => {
        assert(guide.includes(reference), `llms.txt must document ${reference}`);
    });
    assert(guide.includes("<!-- mewa-ui-snippet:start -->") && guide.includes("<!-- mewa-ui-snippet:end -->"), "llms.txt must identify the reusable fragment markers");
    assert.match(guide, /preserve native elements, labels, ids, `aria-\*` relationships/i, "llms.txt must preserve accessibility relationships");
    assert(!/components\.css|vertical-rail|horizontal-tabs/i.test(guide), "llms.txt must not advertise retired assets");
});

test("catalog markup uses only canonical source assets", () => {
    const html = read(path.join(catalogDir, "index.html"));
    checkMarkupContract(html, "catalog/index.html");
    const iframe = html.match(/<iframe\b[^>]*\bsandbox="([^"]+)"[^>]*>/i);
    assert(iframe, "catalog preview requires a sandbox");
    const permissions = new Set(iframe[1].split(/\s+/));
    assert(permissions.has("allow-scripts") && permissions.has("allow-forms") && permissions.has("allow-same-origin"), "catalog preview needs scripts, forms, and its trusted local origin for the Lucide sprite");
    assert(!permissions.has("allow-top-navigation") && !permissions.has("allow-popups"), "catalog preview must not gain navigation or popup permissions");
    assert.deepEqual(cssHrefsLoadedBy(html, "catalog/index.html"), canonicalDemoStylesheets, "catalog must load base.css, mewa.css, then demo.css");
    assert.match(html, /<script\b[^>]*\bsrc="\/ui\/catalog\/catalog\.js"[^>]*>/i);
    assert.match(html, /id="component-search"/);
    assert.match(html, /<nav class="ui-catalog-layout-links"[^>]*aria-label="Catalog resources"/);
    assert.match(html, /href="#colors"[^>]*data-catalog-view="colors"/);
    assert.match(html, /href="\/ui\/layouts\/vertical-navbar\.html"/);
    assert.match(html, /href="\/ui\/layouts\/horizontal-navbar\.html"/);
    assert.match(html, /id="palette-view"[^>]*hidden/);
    assert.match(html, /id="palette-scales"/);
    assert.match(html, /APCA values use the current 0\.0\.98G-4g algorithm as design guidance, not as a compliance claim/);
    assert(!/component-source|copy-source|copy-status|<pre\b/i.test(html), "catalog must expose previews without embedded HTML source controls");
});

test("catalog layout keeps its two canonical layout regions", () => {
    const html = read(path.join(catalogDir, "index.html"));
    assert.match(html, /<div class="ui-catalog-layout">[\s\S]*<aside class="ui-catalog-sidebar"[\s\S]*<section class="ui-catalog-detail"/);
    ["ui-catalog", "ui-catalog-skip", "ui-catalog-header", "ui-catalog-header-meta", "ui-catalog-layout-links", "ui-catalog-count", "ui-catalog-main", "ui-catalog-layout", "ui-catalog-sidebar", "ui-catalog-nav", "ui-catalog-list", "ui-catalog-empty", "ui-catalog-detail", "ui-catalog-detail-header", "ui-catalog-preview-wrap", "ui-catalog-preview", "ui-catalog-preview-modal", "ui-catalog-modal-open", "ui-catalog-palette-view", "ui-catalog-palette-intro", "ui-catalog-palette-roles", "ui-catalog-palette-disclaimer", "ui-catalog-palette-scales", "ui-catalog-palette", "ui-catalog-palette-header", "ui-catalog-palette-grid", "ui-catalog-palette-step", "ui-catalog-palette-swatch", "ui-catalog-palette-meta", "ui-catalog-palette-role", "ui-catalog-palette-metric"].forEach((className) => {
        assert(classDefinitions(read(canonicalDemoCss)).has(className), `src/demo.css must define catalog layout class ${className}`);
    });
    const script = read(path.join(catalogDir, "catalog.js"));
    assert.match(script, /data-mewa-ui-modal-open/, "catalog must mirror modal state out of its sandboxed preview");
    assert.match(script, /MutationObserver/, "catalog must recover modal state when a preview event is missed");
    assert.match(script, /function apcaContrast\(/, "catalog palettes must calculate APCA Lc locally");
    assert.match(script, /vs 050/, "catalog palette contrast must use step 050 as its anchor");
    assert(!script.includes("ΔL"), "catalog palettes must focus on absolute lightness instead of relative ΔL");
    assert.match(script, /addEventListener\("hashchange", selectRequestedView\)/, "catalog hash navigation must update the active component or palette view");
    ["gray", "red", "amber", "green", "alpha-white", "alpha-black"].forEach((prefix) => assert(script.includes(`prefix: "${prefix}"`), `catalog must render the ${prefix} palette`));
});

test("layout examples use the two canonical shell variants", () => {
    const vertical = read(path.join(layoutsDir, "vertical-navbar.html"));
    const horizontal = read(path.join(layoutsDir, "horizontal-navbar.html"));
    [[vertical, "vertical-navbar.html"], [horizontal, "horizontal-navbar.html"]].forEach(([html, filename]) => {
        checkMarkupContract(html, filename);
        assert.deepEqual(cssHrefsLoadedBy(html, filename), canonicalProductionStylesheets, `${filename} must load production stylesheets without demo.css`);
        assert.match(html, /<script\b[^>]*\bsrc="\/ui\/src\/components\.js"[^>]*>/i, `${filename} must load the canonical runtime`);
        assert(!html.includes("ui-framed-"), `${filename} must not use legacy framed classes`);
    });
    assert.match(vertical, /<body class="ui-shell ui-shell--vertical">[\s\S]*<div class="ui-frame">[\s\S]*<nav class="ui-navbar ui-navbar--vertical"[^>]*>[\s\S]*<main class="ui-shell-main"/);
    assert.match(horizontal, /<body class="ui-shell ui-shell--horizontal">[\s\S]*<div class="ui-frame">[\s\S]*<nav class="ui-navbar ui-navbar--horizontal"[^>]*>[\s\S]*<main class="ui-shell-main"/);
    const cssClasses = classDefinitions(read(canonicalComponentCss));
    ["ui-shell", "ui-shell--vertical", "ui-shell--horizontal", "ui-frame", "ui-navbar", "ui-navbar--vertical", "ui-navbar--horizontal", "ui-shell-main"].forEach((className) => {
        assert(cssClasses.has(className), `src/mewa.css must define layout class ${className}`);
    });
});

test("layout examples use symbols from the canonical sprite", () => {
    const symbols = new Set(Array.from(read(canonicalSprite).matchAll(/<symbol\b[^>]*\bid="([^"]+)"/gi), (match) => match[1]));
    existingFiles(layoutsDir, ".html").forEach((filename) => {
        const html = read(path.join(layoutsDir, filename));
        for (const use of html.matchAll(/<use\b[^>]*(?:href|xlink:href)="([^"#]+)#([\w-]+)"/gi)) {
            assert.equal(use[1], "/ui/src/lucide.svg", `${filename}: icons must use the canonical sprite`);
            assert(symbols.has(use[2]), `${filename}: missing sprite symbol ${use[2]}`);
        }
    });
});

test("canonical stylesheet responsibilities are enforced", () => {
    const catalog = path.join(catalogDir, "index.html");
    assert.deepEqual(cssHrefsLoadedBy(read(catalog), path.relative(root, catalog)), canonicalDemoStylesheets, "catalog must load the production pair plus demo.css");
    existingFiles(snippetsDir, ".html").map((file) => path.join(snippetsDir, file)).forEach((file) => {
        const html = read(file);
        assert.deepEqual(cssHrefsLoadedBy(html, path.relative(root, file)), canonicalDemoStylesheets, `${path.relative(root, file)} must load the production pair plus demo.css`);
        assert.match(html, /<script\b[^>]*\bsrc="\/ui\/src\/components\.js"[^>]*>/i, `${path.relative(root, file)} must load canonical runtime`);
        assert(!html.includes("/ui/core-ui.css"), `${path.relative(root, file)} must ignore legacy /ui/core-ui.css`);
        assert(!html.includes("/ui/core-ui-components.css") && !html.includes("/ui/core-ui.js") && !html.includes("/ui/lucide.svg"), `${path.relative(root, file)} must not load legacy root component assets`);
    });
    const cssAssets = fs.readdirSync(srcDir).filter((file) => file.endsWith(".css")).sort();
    assert.deepEqual(cssAssets, ["base.css", "demo.css", "mewa.css"], "src has base, production, and demo CSS assets only");
    const baseCss = read(canonicalBaseCss);
    const componentCss = read(canonicalComponentCss);
    const demoCss = read(canonicalDemoCss);
    assert(!/\.ui-[a-z0-9-]+/i.test(baseCss), "base.css defines tokens and resets, not .ui component classes");
    assert(!/\.ui-(?:demo|catalog)(?:\b|-)/i.test(componentCss), "mewa.css must not contain demo or catalog presentation");
    assert(/\.ui-demo\b/.test(demoCss) && /\.ui-catalog\b/.test(demoCss), "demo.css owns snippet and catalog presentation");
    checkCssContract(baseCss, "src/base.css", { allowRawColors: true });
    checkCssContract(componentCss, "src/mewa.css");
    checkCssContract(demoCss, "src/demo.css");
    const requiredFoundation = [
        "--ui-font: geist, sans-serif", "--ui-font-size-xsmall: 0.75rem", "--ui-font-size-small: 0.875rem", "--ui-font-size-base: 1rem",
        "--ui-heading-base: 1rem", "--ui-heading-large: 1.5rem", "--ui-heading-xlarge: 2rem",
        "--ui-line-height-tight: 1.25", "--ui-line-height-regular: 1.61", "--ui-font-weight-regular: 400", "--ui-font-weight-medium: 550", "--ui-tracking: 0",
        "--ui-border-width: 1px", "--ui-focus-ring-width: 2px", "--ui-control-height: 2.5rem", "--ui-control-height-sm: 2rem", "--ui-icon-button-size: 2.5rem",
        "--ui-icon-size-small: 1rem", "--ui-icon-size-medium: 1.25rem", "--ui-icon-size-large: 1.5rem", "--ui-icon-stroke-width: 1.5", "--ui-checkbox-size: 1.25rem",
        "--ui-border-dashed: var(--ui-border-width) dashed var(--ui-border)"
    ];
    requiredFoundation.forEach((declaration) => assert(baseCss.includes(declaration), `src/base.css: missing requested foundation ${declaration}`));
    const palettePrefixes = ["gray", "alpha-white", "alpha-black", "red", "amber", "green"];
    const paletteSteps = ["050", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
    palettePrefixes.forEach((prefix) => paletteSteps.forEach((step) => {
        assert.match(baseCss, new RegExp(`--ui-${prefix}-${step}:\\s*oklch\\([^;]+\\);`), `src/base.css: --ui-${prefix}-${step} must use OKLCH`);
    }));
    assert(!/--ui-(?:gray|alpha-white|alpha-black|red|amber|green)-000\b/.test(baseCss), "obsolete 000 palette steps must not return");
    assert.match(baseCss, /--ui-gray-050:\s*oklch\(17\.7000% 0 0\)/, "gray 050 must start the shared lightness curve at L 17.7");
    assert.match(baseCss, /--ui-gray-100:\s*oklch\(20\.6000% 0 0\)/, "gray 100 must preserve a close surface step");
    assert.match(baseCss, /--ui-gray-950:\s*oklch\(91\.9351% 0 0\)/, "gray 950 must end the shared lightness curve at L 91.9351");

    const opaquePrefixes = ["gray", "red", "amber", "green"];
    const opaquePalettes = Object.fromEntries(opaquePrefixes.map((prefix) => [prefix, parseOklchPalette(baseCss, prefix)]));
    opaquePrefixes.forEach((prefix) => {
        const palette = opaquePalettes[prefix];
        assert.deepEqual([...palette.keys()], paletteSteps, `${prefix}: palette steps must be exactly 050 through 950`);
        const values = paletteSteps.map((step) => palette.get(step));
        values.forEach((color, index) => {
            if (index > 0) {
                assert(color.lightness > values[index - 1].lightness, `${prefix}: OKLCH lightness must increase at ${paletteSteps[index]}`);
                assert(apcaLuminance(color) > apcaLuminance(values[index - 1]), `${prefix}: rendered APCA luminance must increase at ${paletteSteps[index]}`);
            }
            oklchToLinearSrgb(color).forEach((channel) => assert(channel >= -0.0001 && channel <= 1.0001, `${prefix}-${paletteSteps[index]} must stay inside sRGB`));
        });
        const anchor = palette.get("050");
        const contrastSteps = paletteSteps.slice(5);
        const contrasts = contrastSteps.map((step) => apcaContrast(palette.get(step), anchor));
        contrasts.forEach((contrast, index) => {
            assert(contrast < 0, `${prefix}-${contrastSteps[index]}: light-on-dark APCA polarity must remain negative against ${prefix}-050`);
            if (index > 0) assert(Math.abs(contrast) > Math.abs(contrasts[index - 1]), `${prefix}: APCA magnitude must increase through ${contrastSteps[index]}`);
        });
    });

    const gray = opaquePalettes.gray;
    const grayTargets = { "500": 15, "600": 30, "700": 45, "800": 60, "900": 75 };
    Object.entries(grayTargets).forEach(([step, target]) => {
        const actual = Math.abs(apcaContrast(gray.get(step), gray.get("050")));
        assert(Math.abs(actual - target) <= 0.1, `gray-${step} must define the shared Lc ${target} baseline against gray-050`);
    });
    const grayEndpoint = Math.abs(apcaContrast(gray.get("950"), gray.get("050")));
    assert(Math.abs(grayEndpoint - 90) <= 0.1, "gray-950 must reach Lc 90 against gray-050");

    const sharedChromaEnvelope = { "050": 0.045, "100": 0.052, "200": 0.06, "300": 0.07, "400": 0.082, "500": 0.12, "600": 0.155, "700": 0.16, "800": 0.145, "900": 0.105, "950": 0.04 };
    const statusProfiles = {
        red: { hue: 17, chroma: { "050": 0.045, "100": 0.052, "200": 0.06, "300": 0.07, "400": 0.082, "500": 0.12, "600": 0.155, "700": 0.16, "800": 0.135, "900": 0.082, "950": 0.04 } },
        amber: { hue: 75, chroma: { "050": 0.035, "100": 0.041, "200": 0.048, "300": 0.056, "400": 0.066, "500": 0.089, "600": 0.114, "700": 0.135, "800": 0.145, "900": 0.105, "950": 0.04 } },
        green: { hue: 145, chroma: { "050": 0.045, "100": 0.052, "200": 0.06, "300": 0.07, "400": 0.082, "500": 0.12, "600": 0.155, "700": 0.16, "800": 0.145, "900": 0.105, "950": 0.04 } }
    };
    Object.entries(statusProfiles).forEach(([prefix, profile]) => {
        const palette = opaquePalettes[prefix];
        paletteSteps.forEach((step) => {
            assert.equal(palette.get(step).lightness, gray.get(step).lightness, `${prefix}-${step} must share gray-${step}'s absolute OKLCH lightness`);
            assert.equal(palette.get(step).chroma, profile.chroma[step], `${prefix}-${step} must follow its harmonized chroma profile`);
            assert(palette.get(step).chroma <= sharedChromaEnvelope[step], `${prefix}-${step} must not exceed the shared chroma envelope`);
            assert.equal(palette.get(step).hue, profile.hue, `${prefix}-${step} must keep the fixed ${profile.hue} hue`);
        });
    });
    paletteSteps.forEach((step) => {
        assert(Object.keys(statusProfiles).some((prefix) => opaquePalettes[prefix].get(step).chroma === sharedChromaEnvelope[step]), `${step}: at least one status family must realize the shared chroma target`);
    });

    const alphaWhite = parseOklchPalette(baseCss, "alpha-white");
    const alphaBlack = parseOklchPalette(baseCss, "alpha-black");
    assert.deepEqual([...alphaWhite.keys()], paletteSteps, "alpha white must use the complete 11-step scale");
    assert.deepEqual([...alphaBlack.keys()], paletteSteps, "alpha black must use the complete 11-step scale");
    paletteSteps.forEach((step, index) => {
        assert.equal(alphaWhite.get(step).alpha, alphaBlack.get(step).alpha, `alpha scales must align by role at ${step}`);
        if (index > 0) {
            assert(alphaWhite.get(step).alpha > alphaWhite.get(paletteSteps[index - 1]).alpha, `alpha white must strengthen at ${step}`);
            assert(alphaBlack.get(step).alpha > alphaBlack.get(paletteSteps[index - 1]).alpha, `alpha black must strengthen at ${step}`);
        }
    });
    [
        ["background", "gray-050"], ["surface", "gray-100"], ["surface-raised", "gray-100"], ["interactive", "gray-200"], ["interactive-strong", "gray-300"],
        ["border-subtle", "gray-400"], ["border", "gray-500"], ["border-strong", "gray-600"], ["disabled-foreground", "gray-700"],
        ["subtle-foreground", "gray-800"], ["muted-foreground", "gray-900"], ["foreground", "gray-950"]
    ].forEach(([role, token]) => assert.match(baseCss, new RegExp(`--ui-${role}:\\s*var\\(--ui-${token}\\)`), `${role} must use its role-scale token`));
    assert.match(baseCss, /--ui-state-pressed-lightness:\s*-0\.005/, "pressed and light-control hover states need the requested half-point OKLCH modifier");
    assert.match(baseCss, /--ui-interactive-hover:\s*var\(--ui-interactive\)/, "hover backgrounds must map directly to step 200");
    assert.match(baseCss, /--ui-interactive-active:\s*var\(--ui-interactive-strong\)/, "active backgrounds must map directly to step 300");
    assert.match(baseCss, /--ui-primary-hover:\s*oklch\(from var\(--ui-primary\) calc\(l \+ var\(--ui-state-pressed-lightness\)\) c h\)/, "light control hovers must use the half-point relative OKLCH modifier");
    assert(!/--ui-(?:gray|alpha-white|alpha-black|red|amber|green)-\d{3}\b/.test(componentCss), "component CSS must consume semantic color roles instead of palette steps");
    assert(!/(?:#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|color-mix\(in\s+srgb)/i.test(baseCss + componentCss + demoCss), "canonical styles must use OKLCH color syntax and interpolation");
    assert(!/--ui-(?:space|radius|layer)-/i.test(baseCss), "base.css must not restore semantic spacing, radius, or layer scales");
    assert(!/--ui-font-weight-(?:semibold|bold)/i.test(baseCss), "base.css supports only regular and medium weights");
    assert(!/--ui-line-height-(?:normal|relaxed)|--ui-tracking-(?:tight|wide)/i.test(baseCss + componentCss), "removed typography scales must not return");
    assert(!/letter-spacing\s*:/i.test(baseCss + componentCss + demoCss), "canonical styles must not add text spacing");
    assert.match(baseCss, /strong\s*,\s*b\s*\{[^}]*font-weight:\s*var\(--ui-font-weight-medium\)/i, "base.css must keep semantic emphasis at the medium weight");
    assert.deepEqual(visualShadowDeclarations(componentCss, "src/mewa.css"), [], "src/mewa.css: visual shadows are forbidden");
    assert.deepEqual(visualShadowDeclarations(demoCss, "src/demo.css"), [], "src/demo.css: visual shadows are forbidden");
});

test("component CSS keeps popup parts, SVGs, and form states explicitly covered", () => {
    const css = read(canonicalComponentCss);
    assert.match(css, /(?:^|[}\n])\s*svg\s*\{[^}]*\b(?:width|height|display)\s*:/, "component CSS needs a generic SVG baseline rule");
    ["popover", "dropdown-menu", "tooltip", "split-button"].forEach((component) => {
        assert.match(css, new RegExp(`\\[data-ui-component="${component}"\\][^{]*(?:\\[data-ui-part="(?:panel|content|menu)"\\]|\\[data-ui-${component.replace(/-/g, "")}-content\\])`), `${component}: popup positioning must target the actual panel/content part`);
    });
    [":hover", ":focus", ":disabled", "[aria-invalid=\"true\"]"].forEach((state) => {
        assert(css.includes(`.ui-field${state}`) || css.includes(`.ui-select${state}`) || css.includes(`.ui-textarea${state}`), `form controls need an explicit ${state} state selector`);
    });
});

test("visual-audit fixes retain explicit semantic and responsive contracts", () => {
    const css = read(canonicalComponentCss);
    const accordion = read(path.join(snippetsDir, "accordion.html"));
    const chart = read(path.join(snippetsDir, "chart.html"));
    const resizable = read(path.join(snippetsDir, "resizable.html"));
    assert.equal((accordion.match(/class="ui-accordion-icon" aria-hidden="true"/g) || []).length, 3, "accordion state marks must stay out of accessible names");
    assert(!/\[data-ui-part="trigger"\]::after/.test(css), "accordion state marks must not return to the trigger pseudo-element");
    assert(chart.includes("ui-chart-canvas") && chart.includes("ui-chart-labels"), "chart must keep its responsive canvas and HTML axis labels");
    assert(!/\[data-ui-chart\] \[data-ui-part="plot"\][^}]*overflow-x:\s*auto/.test(css), "chart must scale instead of clipping behind an internal scroller");
    assert(resizable.includes("ui-resizable-file-name"), "resizable file names need a dedicated truncation target");
    assert.match(css, /\[data-ui-resizable\] \[data-ui-part="group"\]\s*\{[^}]*overflow:\s*hidden/, "resizable panes must remain inside the component boundary");
    assert(!/\[data-ui-resizable\] \[data-ui-part="pane"\][^}]*min-inline-size:\s*100%/.test(css), "compact resizable panes must not force a second viewport");
    [["ok", "success"], ["warning", "warning"], ["error", "danger"]].forEach(([state, tone]) => {
        assert.match(css, new RegExp(`\\.ui-alert\\[data-state="${state}"\\][^{]*, \\.ui-message\\[data-state="${state}"\\] \\{[^}]*border-color: var\\(--ui-${tone}\\); background: var\\(--ui-surface\\);`), `${state} alerts must reserve status color for their border on a neutral surface`);
        assert.match(css, new RegExp(`\\.ui-alert\\[data-state="${state}"\\] \\.ui-alert-icon[^}]*\\{ color: var\\(--ui-${tone}\\);`), `${state} alert borders and emphasized content must use the same status color`);
    });
});

test("manifest and snippet files have exact parity", () => {
    const manifest = JSON.parse(read(manifestPath));
    const expected = manifest.map((component) => `${component.slug}.html`).sort();
    assert(fs.existsSync(snippetsDir), "snippets directory is absent");
    assert.deepEqual(existingFiles(snippetsDir, ".html"), expected, "snippet filenames must exactly match manifest slugs");
});

test("each snippet has a valid marked fragment, markup, icons, and references", () => {
    const manifest = JSON.parse(read(manifestPath));
    const sprite = read(canonicalSprite);
    const symbols = new Set(Array.from(sprite.matchAll(/<symbol\b[^>]*\bid="([^"]+)"/gi), (match) => match[1]));
    const iconFailures = [];
    manifest.forEach((component) => {
        const filename = `${component.slug}.html`;
        const html = read(path.join(snippetsDir, filename));
        const startMarker = "<!-- mewa-ui-snippet:start -->";
        const endMarker = "<!-- mewa-ui-snippet:end -->";
        const start = html.indexOf(startMarker);
        const end = html.indexOf(endMarker);
        assert(start !== -1 && end > start, `${filename}: missing or invalid catalog-source markers`);
        assert(html.slice(start + startMarker.length, end).trim(), `${filename}: marked source fragment is empty`);
        checkMarkupContract(html, filename);
        const iconReferences = Array.from(html.matchAll(/<use\b[^>]*(?:href|xlink:href)="([^"#]+)#([\w-]+)"/gi));
        iconReferences.forEach((use) => {
            assert.equal(use[1], "/ui/src/lucide.svg", `${filename}: icons must use the canonical /ui/src/lucide.svg sprite`);
            if (!symbols.has(use[2])) iconFailures.push(`${filename}: missing sprite symbol ${use[2]}`);
        });
    });
    assert.deepEqual(iconFailures, [], `local Lucide sprite failures:\n${iconFailures.join("\n")}`);
});

test("every ui-* snippet class has CSS coverage or a documented compatibility allowance", () => {
    const css = `${read(canonicalComponentCss)}\n${read(canonicalDemoCss)}`;
    const definitions = classDefinitions(css);
    const missing = [];
    existingFiles(snippetsDir, ".html").forEach((filename) => {
        uiClasses(read(path.join(snippetsDir, filename))).forEach((className) => {
            if (!definitions.has(className) && !explicitClassAllowlist.has(className)) missing.push(`${filename}: ${className}`);
        });
    });
    assert.deepEqual(missing, [], `snippet ui-* classes require an exact CSS definition, an applicable generic selector, or an explicit compatibility allowance:\n${missing.join("\n")}`);
});

test("interactive component families expose their expected hooks", () => {
    const needs = {
        accordion: /aria-expanded|data-accordion/i, alert: /role="(?:alert)?dialog"[\s\S]*aria-modal="true"|data-ui-alert-dialog/i, autocomplete: /aria-autocomplete="list"[\s\S]*role="listbox"/i, carousel: /aria-label|data-carousel/i,
        checkbox: /type="checkbox"|role="checkbox"/i, "checkbox-group": /data-ui-part="all"[\s\S]*data-ui-part="item"/i, collapsible: /aria-expanded|data-collapsible/i, combobox: /role="combobox"|data-combobox/i,
        command: /role="(?:dialog|listbox|menu)"|data-command/i, dialog: /role="dialog"[\s\S]*aria-modal="true"|data-dialog/i,
        drawer: /role="dialog"|data-drawer/i, "dropdown-menu": /role="menu"|data-dropdown/i,
        lightbox: /data-ui-slide="0"[\s\S]*role="dialog"/i, "navbar-vertical": /data-ui-navbar-vertical[\s\S]*aria-controls="navbar-vertical-panel"/i,
        popover: /aria-expanded|data-popover/i, "radio-group": /role="radiogroup"|type="radio"|data-radio-group/i, resizable: /role="separator"|data-resizable/i,
        select: /<select\b|role="combobox"|data-select/i, sheet: /role="dialog"|data-sheet/i, slider: /role="slider"|type="range"|data-slider/i,
        switch: /role="switch"|type="checkbox"|data-switch/i, tabs: /role="tablist"[\s\S]*role="tab"|data-tabs/i, toast: /role="(?:status|alert)"|aria-live=|data-toast/i,
        toggle: /aria-pressed|data-toggle/i, tooltip: /role="tooltip"|aria-describedby|data-tooltip/i,
        diff: /type="range"[\s\S]*aria-label=|data-ui-component="diff"/i, "file-input": /type="file"[\s\S]*aria-describedby=/i,
        "number-field": /type="number"[\s\S]*(?:data-ui-part="increment"|aria-label="Increase)/i,
        "sortable-list": /draggable="true"[\s\S]*data-ui-part="handle"/i, "split-button": /aria-haspopup="menu"[\s\S]*role="menu"/i,
        "time-field": /data-ui-part="hour"[\s\S]*data-ui-part="minute"[\s\S]*data-ui-part="period"/i
    };
    Object.entries(needs).forEach(([slug, expression]) => {
        const file = path.join(snippetsDir, `${slug}.html`);
        assert(expression.test(read(file)), `${slug}.html lacks its expected ARIA or behavior hook`);
    });
});

test("runtime-supported generic hook schemas are present in their snippets", () => {
    const runtime = read(canonicalRuntime);
    const schemas = {
        questionnaire: ["data-ui-questionnaire", "data-ui-question", "data-ui-question-next"],
        "message-scroller": ["data-ui-message-scroller", "data-ui-jump"],
        "navbar-vertical": ["data-ui-navbar-vertical", "data-ui-part"],
        toggle: ["data-ui-toggle"],
        calendar: ["data-ui-calendar", "data-ui-calendar-day"],
        "data-table": ["data-ui-table"],
        diff: ["data-ui-component", "data-ui-part"],
        "file-input": ["data-ui-component", "data-ui-part"],
        "number-field": ["data-ui-component", "data-ui-part"],
        autocomplete: ["data-ui-component", "data-ui-part"],
        "checkbox-group": ["data-ui-component", "data-ui-part"],
        lightbox: ["data-ui-component", "data-ui-slide"],
        "sortable-list": ["data-ui-component", "data-ui-part"],
        "split-button": ["data-ui-component", "data-ui-part"],
        "time-field": ["data-ui-component", "data-ui-part"]
    };
    const failures = [];
    Object.entries(schemas).forEach(([slug, hooks]) => {
        const html = read(path.join(snippetsDir, `${slug}.html`));
        hooks.forEach((hook) => {
            if (!hasHook(runtime, hook)) failures.push(`${slug}: runtime does not support ${hook}`);
            if (!hasHook(html, hook)) failures.push(`${slug}.html: missing runtime-supported hook ${hook}`);
        });
    });
    ["autocomplete", "checkbox-group", "diff", "file-input", "lightbox", "navbar-vertical", "number-field", "sortable-list", "time-field"].forEach((component) => {
        assert(runtime.includes(`component === "${component}"`), `runtime does not initialize ${component}`);
    });
    assert.deepEqual(failures, [], `interactive snippets must use runtime-supported hooks, not incompatible data-ui-part aliases:\n${failures.join("\n")}`);
});

test("canonical runtime syntax is valid", () => {
    [path.join(catalogDir, "catalog.js"), canonicalRuntime].forEach((file) => {
        assert(fs.existsSync(file), `missing ${path.basename(file)}`);
        if (!process.versions.bun && process.release.name === "node") {
            childProcess.execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
        } else {
            try {
                new Function(read(file));
            } catch (error) {
                error.message = `${path.basename(file)} parse failure: ${error.message}`;
                throw error;
            }
            console.warn(`PARSE ${path.basename(file)} with the active ${process.release.name} runtime: native Node.js --check is unavailable.`);
        }
    });
});

if (failures) {
    process.exitCode = 1;
}
