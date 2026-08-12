"use strict";

const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const catalogDir = path.join(root, "catalog");
const snippetsDir = path.join(root, "snippets");
const manifestPath = path.join(catalogDir, "components.json");
const expectedNames = [
    "Accordion", "Alert", "Alert Dialog", "Aspect Ratio", "Attachment", "Avatar", "Badge", "Breadcrumb", "Bubble", "Button", "Button Group", "Calendar", "Card", "Carousel", "Chart", "Checkbox", "Collapsible", "Combobox", "Command", "Context Menu", "Data Table", "Date Picker", "Dialog", "Direction", "Drawer", "Dropdown Menu", "Empty", "Field", "Hover Card", "Input", "Input Group", "Input OTP", "Item", "Kbd", "Label", "Marker", "Menubar", "Message", "Message Scroller", "Native Select", "Navigation Menu", "Pagination", "Popover", "Progress", "Questionnaire", "Radio Group", "Resizable", "Scroll Area", "Select", "Separator", "Sheet", "Sidebar", "Skeleton", "Slider", "Spinner", "Switch", "Table", "Tabs", "Textarea", "Toast", "Toggle", "Toggle Group", "Tooltip", "Typography"
].sort();
const permittedStates = new Set(["ok", "warning", "error", "running", "progress", "open", "closed", "active", "inactive", "checked", "unchecked", "on", "off"]);
const legacyClasses = new Set(["is-busy", "is-empty", "is-idle", "lightbox", "lightbox-content", "lightbox-main", "lightbox-info", "lightbox-media", "info-header", "info-title", "info-sub", "info-grid", "info-label", "info-value", "badge-row", "lb-close", "lb-prev", "lb-next"]);
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
    idsAndTargets(html, filename);
}

function checkCssContract(css, filename) {
    assert(!/\b(?:box-shadow|text-shadow)\s*:/i.test(css), `${filename}: shadows are forbidden`);
    assert(!/(?:#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\b(?:white|black|red|green|blue|gray|grey)\b)/i.test(css), `${filename}: raw color is forbidden`);
    for (const match of css.matchAll(/([^{}]+)\{[^{}]*\bbackdrop-filter\s*:\s*blur\(/gi)) {
        assert(/\.ui-(?:dialog|app-header|catalog-overlay)|\[data-ui-(?:popover-content|menu-content|hovercard-content|navigation-menu-content|dialog|alert-dialog|sheet|drawer)\]/.test(match[1]), `${filename}: backdrop blur only belongs on an approved overlay selector`);
    }
}

test("gallery assets and manifest exist", () => {
    ["index.html", "catalog.css", "catalog.js", "components.json"].forEach((file) => assert(fs.existsSync(path.join(catalogDir, file)), `missing catalog/${file}`));
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
        assert(["static", "interactive"].includes(component.behavior), `${component.slug}: invalid behavior`);
        assert.equal(typeof component.static, "boolean", `${component.slug}: static must be boolean`);
    });
});

test("gallery markup and styles meet the catalog contract", () => {
    const html = read(path.join(catalogDir, "index.html"));
    const css = read(path.join(catalogDir, "catalog.css"));
    checkMarkupContract(html, "catalog/index.html");
    checkCssContract(css, "catalog/catalog.css");
    assert.match(html, /<iframe[^>]+sandbox="allow-scripts allow-forms"/i);
    assert.match(html, /href="\/ui\/core-ui\.css"/);
    assert.match(html, /href="\/ui\/core-ui-components\.css"/);
    assert.match(html, /id="component-search"/);
});

test("manifest and snippet files have exact parity", () => {
    const manifest = JSON.parse(read(manifestPath));
    const expected = manifest.map((component) => `${component.slug}.html`).sort();
    assert(fs.existsSync(snippetsDir), "snippets directory is absent");
    assert.deepEqual(existingFiles(snippetsDir, ".html"), expected, "snippet filenames must exactly match manifest slugs");
});

test("each snippet has a valid marked fragment, markup, icons, and references", () => {
    const manifest = JSON.parse(read(manifestPath));
    const sprite = read(path.join(root, "lucide.svg"));
    const symbols = new Set(Array.from(sprite.matchAll(/<symbol\b[^>]*\bid="([^"]+)"/gi), (match) => match[1]));
    manifest.forEach((component) => {
        const filename = `${component.slug}.html`;
        const html = read(path.join(snippetsDir, filename));
        const startMarker = "<!-- core-ui-snippet:start -->";
        const endMarker = "<!-- core-ui-snippet:end -->";
        const start = html.indexOf(startMarker);
        const end = html.indexOf(endMarker);
        assert(start !== -1 && end > start, `${filename}: missing or invalid catalog-source markers`);
        assert(html.slice(start + startMarker.length, end).trim(), `${filename}: marked source fragment is empty`);
        checkMarkupContract(html, filename);
        for (const use of html.matchAll(/<use\b[^>]*(?:href|xlink:href)="\/ui\/lucide\.svg#([\w-]+)"/gi)) {
            assert(symbols.has(use[1]), `${filename}: missing sprite symbol ${use[1]}`);
        }
    });
});

test("interactive component families expose their expected hooks", () => {
    const needs = {
        accordion: /aria-expanded|data-accordion/i, "alert-dialog": /role="(?:alert)?dialog"[\s\S]*aria-modal="true"|data-dialog/i, carousel: /aria-label|data-carousel/i,
        checkbox: /type="checkbox"|role="checkbox"/i, collapsible: /aria-expanded|data-collapsible/i, combobox: /role="combobox"|data-combobox/i,
        command: /role="(?:dialog|listbox|menu)"|data-command/i, "context-menu": /role="menu"|data-context-menu/i, dialog: /role="dialog"[\s\S]*aria-modal="true"|data-dialog/i,
        drawer: /role="dialog"|data-drawer/i, "dropdown-menu": /role="menu"|data-dropdown/i, "hover-card": /aria-describedby|data-hover-card/i,
        "input-otp": /autocomplete="one-time-code"|data-otp/i, menubar: /role="menubar"|data-menubar/i, "navigation-menu": /role="navigation"|data-navigation-menu/i,
        popover: /aria-expanded|data-popover/i, "radio-group": /role="radiogroup"|type="radio"|data-radio-group/i, resizable: /role="separator"|data-resizable/i,
        select: /<select\b|role="combobox"|data-select/i, sheet: /role="dialog"|data-sheet/i, slider: /role="slider"|type="range"|data-slider/i,
        switch: /role="switch"|type="checkbox"|data-switch/i, tabs: /role="tablist"[\s\S]*role="tab"|data-tabs/i, toast: /role="(?:status|alert)"|aria-live=|data-toast/i,
        toggle: /aria-pressed|data-toggle/i, tooltip: /role="tooltip"|aria-describedby|data-tooltip/i
    };
    Object.entries(needs).forEach(([slug, expression]) => {
        const file = path.join(snippetsDir, `${slug}.html`);
        assert(expression.test(read(file)), `${slug}.html lacks its expected ARIA or behavior hook`);
    });
});

test("component stylesheet and runtime syntax are valid", () => {
    const componentCss = path.join(root, "core-ui-components.css");
    assert(fs.existsSync(componentCss), "missing core-ui-components.css");
    checkCssContract(read(componentCss), "core-ui-components.css");
    [path.join(catalogDir, "catalog.js"), path.join(root, "core-ui.js")].forEach((file) => {
        assert(fs.existsSync(file), `missing ${path.basename(file)}`);
        if (!process.versions.bun && process.release.name === "node") {
            childProcess.execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
        } else {
            new Function(read(file));
            console.warn(`SKIP node --check ${path.basename(file)}: a native Node.js binary is unavailable, parsed with the active ${process.release.name} runtime instead.`);
        }
    });
});

if (failures) {
    process.exitCode = 1;
}
