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
const canonicalComponentCss = path.join(srcDir, "components.css");
const canonicalRuntime = path.join(srcDir, "components.js");
const canonicalSprite = path.join(srcDir, "lucide.svg");
const canonicalStylesheets = ["/ui/src/base.css", "/ui/src/components.css"];
// Declared inventory: the original shadcn-aligned set plus selected, broadly useful
// primitives from daisyUI, Basecoat, Coss, and 0build. Every item must ship as a
// real snippet with the same canonical assets and contract checks.
const expectedNames = [
    "Accordion", "Alert", "Aspect Ratio", "Attachment", "Autocomplete", "Avatar", "Badge", "Breadcrumb", "Button", "Button Group", "Calendar", "Card", "Carousel", "Chart", "Checkbox", "Checkbox Group", "Collapsible", "Combobox", "Command", "Data Table", "Date Picker", "Dialog", "Diff", "Drawer", "Dropdown Menu", "Empty", "Field", "Fieldset", "File Input", "Hover Card", "Input", "Input Group", "Input OTP", "Item", "Kbd", "Label", "Lightbox", "Marker", "Message", "Message Scroller", "Meter", "Native Select", "Navigation Menu", "Number Field", "Pagination", "Popover", "Progress", "Questionnaire", "Radio Group", "Rating", "Resizable", "Scroll Area", "Select", "Separator", "Sheet", "Sidebar", "Skeleton", "Slider", "Sortable List", "Spinner", "Split Button", "Stat", "Steps", "Switch", "Table", "Tabs", "Textarea", "Time Field", "Timeline", "Toast", "Toggle", "Toggle Group", "Toolbar", "Tooltip", "Typography"
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
        assert(/\.ui-(?:dialog|app-header|catalog-overlay|autocomplete)|\[data-ui-(?:popover-content|menu-content|hovercard-content|navigation-menu-content|dialog|alert-dialog|sheet|drawer|toast)\]|\[data-ui-component="(?:autocomplete|popover|dropdown-menu|navigation-menu|tooltip|hover-card|split-button|sheet|drawer|toast)"\]/.test(match[1]), `${filename}: backdrop blur only belongs on an approved overlapping-surface selector`);
    }
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
    [canonicalBaseCss, canonicalComponentCss, canonicalRuntime, canonicalSprite].forEach((file) => assert(fs.existsSync(file), `missing ${path.relative(root, file)}`));
    assert(!fs.existsSync(path.join(catalogDir, "catalog.css")), "catalog.css must not be a third loaded stylesheet");
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

test("catalog markup uses only canonical source assets", () => {
    const html = read(path.join(catalogDir, "index.html"));
    checkMarkupContract(html, "catalog/index.html");
    const iframe = html.match(/<iframe\b[^>]*\bsandbox="([^"]+)"[^>]*>/i);
    assert(iframe, "catalog preview requires a sandbox");
    const permissions = new Set(iframe[1].split(/\s+/));
    assert(permissions.has("allow-scripts") && permissions.has("allow-forms") && permissions.has("allow-same-origin"), "catalog preview needs scripts, forms, and its trusted local origin for the Lucide sprite");
    assert(!permissions.has("allow-top-navigation") && !permissions.has("allow-popups"), "catalog preview must not gain navigation or popup permissions");
    assert.deepEqual(cssHrefsLoadedBy(html, "catalog/index.html"), canonicalStylesheets, "catalog must load only base.css followed by components.css");
    assert.match(html, /<script\b[^>]*\bsrc="\/ui\/catalog\/catalog\.js"[^>]*>/i);
    assert.match(html, /id="component-search"/);
    assert.match(html, /<nav class="ui-catalog-layout-links"[^>]*aria-label="Layout previews"/);
    assert.match(html, /href="\/ui\/layouts\/vertical-rail\.html"/);
    assert.match(html, /href="\/ui\/layouts\/horizontal-tabs\.html"/);
});

test("catalog layout keeps its two canonical layout regions", () => {
    const html = read(path.join(catalogDir, "index.html"));
    assert.match(html, /<div class="ui-catalog-layout">[\s\S]*<aside class="ui-catalog-sidebar"[\s\S]*<section class="ui-catalog-detail"/);
    ["ui-catalog", "ui-catalog-skip", "ui-catalog-header", "ui-catalog-header-meta", "ui-catalog-layout-links", "ui-catalog-count", "ui-catalog-main", "ui-catalog-overview", "ui-catalog-layout", "ui-catalog-sidebar", "ui-catalog-nav", "ui-catalog-list", "ui-catalog-empty", "ui-catalog-detail", "ui-catalog-detail-header", "ui-catalog-preview-wrap", "ui-catalog-preview", "ui-catalog-source-header", "ui-catalog-source"].forEach((className) => {
        assert(classDefinitions(read(canonicalComponentCss)).has(className), `src/components.css must define catalog layout class ${className}`);
    });
});

test("layout examples use the two canonical shell variants", () => {
    const rail = read(path.join(layoutsDir, "vertical-rail.html"));
    const top = read(path.join(layoutsDir, "horizontal-tabs.html"));
    [[rail, "vertical-rail.html"], [top, "horizontal-tabs.html"]].forEach(([html, filename]) => {
        checkMarkupContract(html, filename);
        assert.deepEqual(cssHrefsLoadedBy(html, filename), canonicalStylesheets, `${filename} must load canonical stylesheets in order`);
        assert.match(html, /<script\b[^>]*\bsrc="\/ui\/src\/components\.js"[^>]*>/i, `${filename} must load the canonical runtime`);
        assert(!html.includes("ui-framed-"), `${filename} must not use legacy framed classes`);
    });
    assert.match(rail, /<body class="ui-shell ui-shell--rail">[\s\S]*<div class="ui-frame">[\s\S]*<nav class="ui-rail"[^>]*>[\s\S]*<main class="ui-shell-main"/);
    assert.match(top, /<body class="ui-shell ui-shell--top">[\s\S]*<div class="ui-frame">[\s\S]*<header class="ui-topbar">[\s\S]*<nav class="ui-topnav"[^>]*>[\s\S]*<main class="ui-shell-main"/);
    const cssClasses = classDefinitions(read(canonicalComponentCss));
    ["ui-shell", "ui-shell--rail", "ui-shell--top", "ui-frame", "ui-rail", "ui-topbar", "ui-topbar-brand", "ui-topnav", "ui-shell-main"].forEach((className) => {
        assert(cssClasses.has(className), `src/components.css must define layout class ${className}`);
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
    assert.deepEqual(cssHrefsLoadedBy(read(catalog), path.relative(root, catalog)), canonicalStylesheets, "catalog must load canonical stylesheets only");
    existingFiles(snippetsDir, ".html").map((file) => path.join(snippetsDir, file)).forEach((file) => {
        const html = read(file);
        assert.deepEqual(cssHrefsLoadedBy(html, path.relative(root, file)), canonicalStylesheets, `${path.relative(root, file)} must load exactly the canonical stylesheets in order`);
        assert.match(html, /<script\b[^>]*\bsrc="\/ui\/src\/components\.js"[^>]*>/i, `${path.relative(root, file)} must load canonical runtime`);
        assert(!html.includes("/ui/core-ui.css"), `${path.relative(root, file)} must ignore legacy /ui/core-ui.css`);
        assert(!html.includes("/ui/core-ui-components.css") && !html.includes("/ui/core-ui.js") && !html.includes("/ui/lucide.svg"), `${path.relative(root, file)} must not load legacy root component assets`);
    });
    const cssAssets = fs.readdirSync(srcDir).filter((file) => file.endsWith(".css")).sort();
    assert.deepEqual(cssAssets, ["base.css", "components.css"], "src has exactly two canonical CSS assets");
    const baseCss = read(canonicalBaseCss);
    const componentCss = read(canonicalComponentCss);
    assert(!/\.ui-[a-z0-9-]+/i.test(baseCss), "base.css defines tokens and resets, not .ui component classes");
    checkCssContract(baseCss, "src/base.css", { allowRawColors: true });
    checkCssContract(componentCss, "src/components.css");
    const requiredFoundation = [
        "--ui-font-size-xs: 0.75rem", "--ui-font-size-sm: 0.875rem", "--ui-font-size-base: 1rem",
        "--ui-heading-sm: 1rem", "--ui-heading-md: 1.25rem", "--ui-heading-lg: 1.5rem", "--ui-heading-xl: 2rem",
        "--ui-line-height-tight: 1.2", "--ui-line-height-normal: 1.4", "--ui-line-height-relaxed: 1.6",
        "--ui-font-weight-regular: 400", "--ui-font-weight-medium: 500"
    ];
    requiredFoundation.forEach((declaration) => assert(baseCss.includes(declaration), `src/base.css: missing requested foundation ${declaration}`));
    assert(!/--ui-(?:space|radius|layer)-/i.test(baseCss), "base.css must not restore semantic spacing, radius, or layer scales");
    assert(!/--ui-font-weight-(?:semibold|bold)/i.test(baseCss), "base.css supports only regular and medium weights");
    assert.match(baseCss, /strong\s*,\s*b\s*\{[^}]*font-weight:\s*var\(--ui-font-weight-medium\)/i, "base.css must keep semantic emphasis within the 500-weight ceiling");
    assert.deepEqual(visualShadowDeclarations(componentCss, "src/components.css"), [], "src/components.css: visual shadows are forbidden");
});

test("component CSS keeps popup parts, SVGs, and form states explicitly covered", () => {
    const css = read(canonicalComponentCss);
    assert.match(css, /(?:^|[}\n])\s*svg\s*\{[^}]*\b(?:width|height|display)\s*:/, "component CSS needs a generic SVG baseline rule");
    ["popover", "dropdown-menu", "navigation-menu", "tooltip", "hover-card", "split-button"].forEach((component) => {
        assert.match(css, new RegExp(`\\[data-ui-component="${component}"\\][^{]*(?:\\[data-ui-part="(?:panel|content|menu)"\\]|\\[data-ui-${component.replace(/-/g, "")}-content\\])`), `${component}: popup positioning must target the actual panel/content part`);
    });
    [":hover", ":focus", ":disabled", "[aria-invalid=\"true\"]"].forEach((state) => {
        assert(css.includes(`.ui-field${state}`) || css.includes(`.ui-select${state}`) || css.includes(`.ui-textarea${state}`), `form controls need an explicit ${state} state selector`);
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
    const css = read(canonicalComponentCss);
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
        drawer: /role="dialog"|data-drawer/i, "dropdown-menu": /role="menu"|data-dropdown/i, "hover-card": /aria-describedby|data-hover-card/i,
        "input-otp": /autocomplete="one-time-code"|data-otp/i, lightbox: /data-ui-slide="0"[\s\S]*role="dialog"/i, "navigation-menu": /role="navigation"|data-navigation-menu|data-ui-part="(?:trigger|content)"/i,
        popover: /aria-expanded|data-popover/i, "radio-group": /role="radiogroup"|type="radio"|data-radio-group/i, resizable: /role="separator"|data-resizable/i,
        select: /<select\b|role="combobox"|data-select/i, sheet: /role="dialog"|data-sheet/i, slider: /role="slider"|type="range"|data-slider/i,
        switch: /role="switch"|type="checkbox"|data-switch/i, tabs: /role="tablist"[\s\S]*role="tab"|data-tabs/i, toast: /role="(?:status|alert)"|aria-live=|data-toast/i,
        toggle: /aria-pressed|data-toggle/i, tooltip: /role="tooltip"|aria-describedby|data-tooltip/i,
        diff: /type="range"[\s\S]*aria-label=|data-ui-component="diff"/i, "file-input": /type="file"[\s\S]*aria-describedby=/i,
        "number-field": /type="number"[\s\S]*(?:data-ui-part="increment"|aria-label="Increase)/i,
        rating: /type="radio"[\s\S]*deployment-rating/i, "sortable-list": /draggable="true"[\s\S]*data-ui-part="handle"/i, "split-button": /aria-haspopup="menu"[\s\S]*role="menu"/i,
        "time-field": /data-ui-part="hour"[\s\S]*data-ui-part="minute"[\s\S]*data-ui-part="period"/i, toolbar: /role="toolbar"[\s\S]*aria-orientation=/i
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
        sidebar: ["data-ui-sidebar"],
        toggle: ["data-ui-toggle"],
        "toggle-group": ["data-ui-toggle-group", "data-ui-toggle"],
        calendar: ["data-ui-calendar", "data-ui-calendar-day"],
        "data-table": ["data-ui-table"],
        diff: ["data-ui-component", "data-ui-part"],
        "file-input": ["data-ui-component", "data-ui-part"],
        "number-field": ["data-ui-component", "data-ui-part"],
        toolbar: ["data-ui-component", "data-ui-toggle-group"]
        ,autocomplete: ["data-ui-component", "data-ui-part"],
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
    ["autocomplete", "checkbox-group", "diff", "file-input", "lightbox", "number-field", "sortable-list", "time-field", "toolbar"].forEach((component) => {
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
