import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const base = process.env.MEWA_UI_BASE_URL || "http://127.0.0.1:8083/ui";
const browserURL = process.env.MEWA_UI_BROWSER_URL || "http://127.0.0.1:9223";
const screenshotDir = process.env.MEWA_UI_SCREENSHOT_DIR;
const manifest = JSON.parse(fs.readFileSync(new URL("../catalog/components.json", import.meta.url), "utf8"));
const viewports = [
    { name: "desktop", width: 1280, height: 900 },
    { name: "mobile", width: 390, height: 844, isMobile: true },
];
const narrowViewport = { name: "narrow", width: 320, height: 720, isMobile: true };

const clamp = (value) => Math.max(0, Math.min(1, value));
const alphaComponent = (value) => value.endsWith("%") ? Number(value.slice(0, -1)) / 100 : Number(value);
const rgbComponent = (value) => value.endsWith("%") ? Number(value.slice(0, -1)) / 100 : Number(value) / 255;
const srgbComponent = (value) => value.endsWith("%") ? Number(value.slice(0, -1)) / 100 : Number(value);
const linearToSrgb = (value) => value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;

function parseCssColor(value) {
    const text = value.trim().toLowerCase();
    if (text === "transparent") return { red: 0, green: 0, blue: 0, alpha: 0 };
    const rgb = text.match(/^rgba?\((.*)\)$/);
    if (rgb) {
        const body = rgb[1].trim();
        let channels, alpha = 1;
        if (body.includes(",")) {
            assert(!body.includes("/"), `mixed legacy RGB syntax is unsupported: ${value}`);
            const parts = body.split(",").map((part) => part.trim());
            assert(parts.length === 3 || parts.length === 4, `legacy RGB needs three channels and optional alpha: ${value}`);
            channels = parts.slice(0, 3).map(rgbComponent);
            if (parts.length === 4) alpha = alphaComponent(parts[3]);
        } else {
            const sections = body.split("/").map((part) => part.trim());
            assert(sections.length <= 2, `modern RGB contains too many alpha separators: ${value}`);
            channels = sections[0].split(/\s+/).filter(Boolean).map(rgbComponent);
            if (sections.length === 2) alpha = alphaComponent(sections[1]);
        }
        assert(channels.length === 3 && channels.every(Number.isFinite) && Number.isFinite(alpha), `unsupported RGB color: ${value}`);
        return { red: clamp(channels[0]), green: clamp(channels[1]), blue: clamp(channels[2]), alpha: clamp(alpha) };
    }
    const srgb = text.match(/^color\(srgb\s+(.+)\)$/);
    if (srgb) {
        const sections = srgb[1].split("/").map((part) => part.trim());
        assert(sections.length <= 2, `sRGB contains too many alpha separators: ${value}`);
        const channels = sections[0].split(/\s+/).filter(Boolean).map(srgbComponent);
        const alpha = sections.length === 2 ? alphaComponent(sections[1]) : 1;
        assert(channels.length === 3 && channels.every(Number.isFinite) && Number.isFinite(alpha), `unsupported sRGB color: ${value}`);
        return { red: clamp(channels[0]), green: clamp(channels[1]), blue: clamp(channels[2]), alpha: clamp(alpha) };
    }
    const oklch = text.match(/^oklch\(\s*([-+\d.]+)(%)?\s+([-+\d.]+)\s+([-+\d.]+)(?:deg)?(?:\s*\/\s*([-+\d.]+%?))?\s*\)$/);
    if (oklch) {
        const lightness = Number(oklch[1]) / (oklch[2] ? 100 : 1), chroma = Number(oklch[3]), radians = Number(oklch[4]) * Math.PI / 180, alpha = oklch[5] ? alphaComponent(oklch[5]) : 1;
        assert([lightness, chroma, radians, alpha].every(Number.isFinite), `unsupported OKLCH color: ${value}`);
        const a = chroma * Math.cos(radians), b = chroma * Math.sin(radians);
        const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
        return { red: clamp(linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)), green: clamp(linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)), blue: clamp(linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)), alpha: clamp(alpha) };
    }
    throw new Error(`unsupported computed color: ${value}`);
}

const composite = (foreground, background) => ({ red: foreground.red * foreground.alpha + background.red * (1 - foreground.alpha), green: foreground.green * foreground.alpha + background.green * (1 - foreground.alpha), blue: foreground.blue * foreground.alpha + background.blue * (1 - foreground.alpha), alpha: 1 });
const linearChannel = (value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
const luminance = (color) => 0.2126 * linearChannel(color.red) + 0.7152 * linearChannel(color.green) + 0.0722 * linearChannel(color.blue);
const contrastRatio = (foreground, background) => (Math.max(luminance(foreground), luminance(background)) + 0.05) / (Math.min(luminance(foreground), luminance(background)) + 0.05);
const near = (actual, expected) => Math.abs(actual - expected) <= 0.0001;

const colorFixtures = [
    ["rgb(255, 0, 128)", { red: 1, green: 0, blue: 128 / 255, alpha: 1 }],
    ["rgb(100% 0% 50%)", { red: 1, green: 0, blue: 0.5, alpha: 1 }],
    ["rgb(255 0 0 / 25%)", { red: 1, green: 0, blue: 0, alpha: 0.25 }],
    ["rgba(255, 255, 255, 0.5)", { red: 1, green: 1, blue: 1, alpha: 0.5 }],
    ["color(srgb 0.25 0.5 1 / 75%)", { red: 0.25, green: 0.5, blue: 1, alpha: 0.75 }],
    ["oklch(100% 0 0 / 50%)", { red: 1, green: 1, blue: 1, alpha: 0.5 }],
    ["oklch(1 0 0 / 0.5)", { red: 1, green: 1, blue: 1, alpha: 0.5 }],
    ["transparent", { red: 0, green: 0, blue: 0, alpha: 0 }],
];
colorFixtures.forEach(([source, expected]) => {
    const actual = parseCssColor(source);
    Object.keys(expected).forEach((channel) => assert(near(actual[channel], expected[channel]), `${source}: ${channel} parsed as ${actual[channel]}, expected ${expected[channel]}`));
});
const halfWhiteOnBlack = composite(parseCssColor("rgba(255, 255, 255, 0.5)"), parseCssColor("rgb(0 0 0)"));
assert([halfWhiteOnBlack.red, halfWhiteOnBlack.green, halfWhiteOnBlack.blue].every((channel) => near(channel, 0.5)), "legacy rgba alpha must participate in compositing");
assert(contrastRatio(parseCssColor("rgb(255 255 255)"), parseCssColor("rgb(0 0 0)")) > 20, "contrast fixtures must preserve black/white luminance");
if (screenshotDir) fs.mkdirSync(screenshotDir, { recursive: true });

const browser = await puppeteer.connect({ browserURL });
const page = await browser.newPage();
const failures = [];

page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("favicon.ico")) failures.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
page.on("requestfailed", (request) => {
    if (request.failure()?.errorText !== "net::ERR_ABORTED" && !request.url().endsWith("/favicon.ico")) failures.push(`request: ${request.url()} ${request.failure()?.errorText || "failed"}`);
});
page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) failures.push(`response: ${response.status()} ${response.url()}`);
});

async function load(url, viewport = viewports[0], screenshotName) {
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts?.ready);
    if (screenshotDir && screenshotName) await page.screenshot({ path: path.join(screenshotDir, `${screenshotName}-${viewport.name}.png`), fullPage: true });
}

async function screenshot(name, viewport = viewports[0]) {
    if (!screenshotDir) return;
    await page.setViewport(viewport);
    await page.screenshot({ path: path.join(screenshotDir, `${name}-${viewport.name}.png`), fullPage: true });
}

async function canonicalAssets() {
    return page.evaluate(() => ({
        stylesheets: [...document.querySelectorAll('link[rel="stylesheet"]')].map((node) => new URL(node.href).pathname),
        scripts: [...document.scripts].map((node) => new URL(node.src).pathname),
        iconReferences: [...document.querySelectorAll('use[href], use[xlink\\:href]')].map((node) => node.getAttribute("href") || node.getAttribute("xlink:href")),
    }));
}

function assertCanonicalAssets(assets, pageName, { runtime = true, demo = true } = {}) {
    const stylesheets = demo ? ["/ui/src/base.css", "/ui/src/mewa.css", "/ui/src/demo.css"] : ["/ui/src/base.css", "/ui/src/mewa.css"];
    assert.deepEqual(assets.stylesheets, stylesheets, `${pageName}: stylesheet order must be canonical`);
    if (runtime) assert(assets.scripts.includes("/ui/src/components.js"), `${pageName}: missing canonical runtime`);
    assets.iconReferences.forEach((reference) => assert(reference.startsWith("/ui/src/lucide.svg#"), `${pageName}: icon must use canonical sprite (${reference})`));
}

async function assertVisualState(name) {
    const result = await page.evaluate(() => {
        const rect = (node) => { const box = node.getBoundingClientRect(); return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height }; };
        const roots = [...document.querySelectorAll("[data-ui-component],[data-ui-calendar],[data-ui-carousel],[data-ui-resizable],[data-ui-navbar-vertical],[data-ui-questionnaire],[data-ui-message-scroller],[data-ui-table]")];
        const candidates = roots.length ? roots : [...document.body.children];
        const useful = candidates.map(rect).filter((box) => box.width > 1 && box.height > 1);
        const boundsPassed = useful.every((box) => box.left >= -1 && box.right <= innerWidth + 1 && box.bottom > 0 && box.top < innerHeight);
        const visible = [...document.body.querySelectorAll("*")].filter((node) => { const box = node.getBoundingClientRect(); return !node.hidden && box.width > 0 && box.height > 0; }).length;
        const walker = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT);
        let hasStart = false;
        while (walker.nextNode()) if (walker.currentNode.data.trim() === "mewa-ui-snippet:start") hasStart = true;
        const focusFailures = [];
        for (const node of document.querySelectorAll("button,a[href],input,select,textarea,[tabindex='0']")) {
            if (node.matches(":disabled,[aria-disabled='true']") || !node.getClientRects().length || node.closest("[hidden],[inert]")) continue;
            node.focus();
            const style = getComputedStyle(node);
            const group = node.closest(".ui-input-group");
            const proxy = node.nextElementSibling;
            const styled = [node, group, proxy].filter(Boolean).some((item) => {
                const value = getComputedStyle(item);
                return value.outlineStyle !== "none" || value.boxShadow !== "none";
            });
            if (!styled) focusFailures.push(node.id || node.getAttribute("aria-label") || node.tagName);
        }
        return { hasStart, visible, useful, boundsPassed, focusFailures, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    if (!result.hasStart || result.visible < 2 || !result.useful.length || !result.boundsPassed || result.focusFailures.length || result.overflow > 1) failures.push(`${name}: ${JSON.stringify(result)}`);
}

for (const viewport of viewports) {
    await load(`${base}/catalog/`, viewport, "catalog");
    assertCanonicalAssets(await canonicalAssets(), `catalog ${viewport.name}`, { runtime: false });
    await page.waitForFunction((count) => document.querySelector("#component-count")?.textContent.includes(String(count)), {}, manifest.length);
    await page.waitForFunction(() => document.querySelector("#component-preview")?.contentDocument?.body?.children.length > 0);
    const result = await page.evaluate(() => ({ count: document.querySelector("#component-list")?.children.length, description: document.querySelector("#component-description")?.textContent.trim(), meta: document.querySelector("#component-meta")?.textContent.trim(), previewMain: Boolean(document.querySelector("#component-preview")?.contentDocument?.querySelector("body > main")), hasSource: Boolean(document.querySelector("#component-source,#copy-source,#copy-status")), sidebarLeft: document.querySelector(".ui-catalog-sidebar")?.getBoundingClientRect().left, layoutLinks: [...document.querySelectorAll(".ui-catalog-layout-links a")].map((link) => link.getAttribute("href")), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
    if (result.count !== manifest.length || result.overflow > 1) failures.push(`catalog ${viewport.name}: ${JSON.stringify(result)}`);
    if (!result.description || !result.meta?.includes("components.js required") || result.previewMain || result.hasSource) failures.push(`catalog ${viewport.name}: catalog must expose description, runtime requirement, and marked preview without HTML source controls`);
    if (viewport.width > 768 && Math.abs(result.sidebarLeft) > 1) failures.push(`catalog ${viewport.name}: component navigation is not pinned to the left edge`);
    if (result.layoutLinks.join("|") !== "#colors|/ui/layouts/vertical-navbar.html|/ui/layouts/vertical-navbar-utility-end.html|/ui/layouts/vertical-navbar-utility-start.html|/ui/layouts/vertical-navbar-collapsed.html|/ui/layouts/horizontal-navbar.html|/ui/layouts/operations-workspace.html") failures.push(`catalog ${viewport.name}: catalog resource links are missing or incorrect`);
    await page.click('[data-catalog-view="colors"]');
    await page.waitForFunction(() => !document.querySelector("#palette-view")?.hidden && document.querySelectorAll(".ui-catalog-palette").length === 6);
    const paletteResult = await page.evaluate(() => ({
        sections: document.querySelectorAll(".ui-catalog-palette").length,
        complete: [...document.querySelectorAll(".ui-catalog-palette-grid")].every((grid) => grid.children.length === 11),
        textMetrics: [...document.querySelectorAll(".ui-catalog-palette:not(:nth-last-child(-n+2)) .ui-catalog-palette-step .ui-catalog-palette-metric:last-child")].every((metric) => metric.textContent.includes("vs 050")),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    }));
    if (paletteResult.sections !== 6 || !paletteResult.complete || !paletteResult.textMetrics || paletteResult.overflow > 1) failures.push(`catalog palettes ${viewport.name}: ${JSON.stringify(paletteResult)}`);
    await page.evaluate(() => { window.location.hash = "#accordion"; });
    await page.waitForFunction(() => document.querySelector("#component-title")?.textContent === "Accordion" && !document.querySelector("#component-preview-wrap")?.hidden);
    for (const [name, href] of [["Vertical", "/ui/layouts/vertical-navbar.html"], ["Utility right", "/ui/layouts/vertical-navbar-utility-end.html"], ["Utility left", "/ui/layouts/vertical-navbar-utility-start.html"], ["Collapsed", "/ui/layouts/vertical-navbar-collapsed.html"], ["Horizontal", "/ui/layouts/horizontal-navbar.html"], ["Operations", "/ui/layouts/operations-workspace.html"]]) {
        const response = await page.evaluate(async (path) => ({ path, ok: (await fetch(path)).ok }), href);
        if (!response.ok) failures.push(`catalog ${viewport.name}: ${name} preview is unavailable (${response.path})`);
    }
}

const layoutPreviews = [
    { slug: "vertical-navbar", orientation: "vertical" },
    { slug: "vertical-navbar-utility-end", orientation: "vertical", utility: "end" },
    { slug: "vertical-navbar-utility-start", orientation: "vertical", utility: "start" },
    { slug: "vertical-navbar-collapsed", orientation: "vertical", collapsed: true },
    { slug: "horizontal-navbar", orientation: "horizontal" },
    { slug: "operations-workspace", orientation: "vertical", operations: true },
];
for (const layout of layoutPreviews) {
    for (const viewport of viewports) {
        await load(`${base}/layouts/${layout.slug}.html`, viewport);
        assertCanonicalAssets(await canonicalAssets(), `${layout.slug} ${viewport.name}`, { demo: false });
        const result = await page.evaluate((orientation) => {
            const main = document.querySelector(".ui-shell-main")?.getBoundingClientRect();
            const workspace = document.querySelector(".ui-shell-workspace")?.getBoundingClientRect();
            const navigation = document.querySelector(orientation === "vertical" ? ".ui-navbar--vertical" : ".ui-navbar--horizontal")?.getBoundingClientRect();
            const heading = document.querySelector(".ui-page-heading")?.getBoundingClientRect();
            const content = document.querySelector(".ui-shell-content")?.getBoundingClientRect();
            const utility = document.querySelector(".ui-shell-utility")?.getBoundingClientRect();
            return { main, workspace, navigation, heading, content, utility, collapsed: document.querySelector("[data-ui-navbar-vertical]")?.dataset.uiCollapsed, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
        }, layout.orientation);
        if (!result.main || !result.navigation || !result.heading || !result.content || result.heading.height < 1 || result.content.height < 1 || result.overflow > 1) failures.push(`${layout.slug} ${viewport.name}: ${JSON.stringify(result)}`);
        if (layout.orientation === "vertical" && viewport.width > 768 && (!result.workspace || result.navigation.right > result.workspace.left + 1)) failures.push(`${layout.slug} ${viewport.name}: vertical navigation does not precede workspace`);
        if (layout.orientation === "vertical" && viewport.width <= 768 && (!result.workspace || result.navigation.bottom > result.workspace.top + 1)) failures.push(`${layout.slug} ${viewport.name}: compact vertical navigation does not precede workspace`);
        if (layout.orientation === "horizontal" && result.navigation.bottom > result.main.top + 1) failures.push(`${layout.slug} ${viewport.name}: horizontal navigation does not precede main`);
        if (layout.utility && !result.utility) failures.push(`${layout.slug} ${viewport.name}: utility rail is missing`);
        if (layout.utility === "end" && viewport.width > 1024 && result.content.right > result.utility.left + 1) failures.push(`${layout.slug} ${viewport.name}: right utility rail is not after content`);
        if (layout.utility === "start" && viewport.width > 1024 && result.utility.right > result.content.left + 1) failures.push(`${layout.slug} ${viewport.name}: left utility rail is not before content`);
        if (layout.collapsed && viewport.width > 768 && (Math.abs(result.navigation.width - 64) > 2 || result.collapsed !== "true")) failures.push(`${layout.slug} ${viewport.name}: collapsed navigation geometry or state is incorrect`);
        if (layout.operations) {
            const operations = await page.evaluate(() => ({
                tools: Boolean(document.querySelector(".ui-operations-tools")),
                rows: document.querySelectorAll(".ui-item--operation").length,
                metadata: Boolean(document.querySelector(".ui-description-list")),
                progress: Boolean(document.querySelector(".ui-progress")),
                output: Boolean(document.querySelector(".ui-scroll-area--output")),
                overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
            }));
            if (!operations.tools || operations.rows < 3 || !operations.metadata || !operations.progress || !operations.output || operations.overflow > 1) failures.push(`${layout.slug} ${viewport.name}: ${JSON.stringify(operations)}`);
        }
    }
}

await page.setJavaScriptEnabled(false);
await load(`${base}/snippets/questionnaire.html`, viewports[0]);
const questionnaireFallback = await page.evaluate(() => ({ steps: [...document.querySelectorAll("[data-ui-question]")].every((node) => !node.hidden), submit: !document.querySelector('[data-ui-part="submit"]')?.hidden }));
assert.equal(questionnaireFallback.steps, true, "questionnaire exposes every field without JavaScript");
assert.equal(questionnaireFallback.submit, true, "questionnaire keeps a native submit path without JavaScript");
await page.setJavaScriptEnabled(true);

for (const component of manifest) {
    for (const viewport of viewports) {
        await load(`${base}/snippets/${component.slug}.html`, viewport, component.slug);
        assertCanonicalAssets(await canonicalAssets(), `${component.slug} ${viewport.name}`);
        await assertVisualState(`${component.slug} ${viewport.name}`);
    }
}

async function component(slug, viewport = viewports[0]) { await load(`${base}/snippets/${slug}.html`, viewport); }
async function replaceField(selector, value) { await page.$eval(selector, (node) => { node.value = ""; node.dispatchEvent(new Event("input", { bubbles: true })); }); await page.type(selector, value); }
async function clickAndAssert(slug, trigger, panel) {
    await component(slug); await page.click(trigger); assert.equal(await page.$eval(panel, (node) => node.hidden), false, `${slug} opens`); await page.keyboard.press("Escape"); assert.equal(await page.$eval(panel, (node) => node.hidden), true, `${slug} closes`);
}

await component("button");
const buttonStyles = await page.$$eval(".ui-button-primary, .ui-button-danger", (nodes) => nodes.filter((node) => !node.matches(":disabled,[aria-disabled='true']")).map((node) => { const style = getComputedStyle(node); return { fontWeight: style.fontWeight, foreground: style.color, background: style.backgroundColor }; }));
const pageBackground = parseCssColor(await page.$eval("body", (node) => getComputedStyle(node).backgroundColor));
const buttonContrast = buttonStyles.map((style) => { const background = composite(parseCssColor(style.background), pageBackground), foreground = composite(parseCssColor(style.foreground), background); return { ...style, ratio: contrastRatio(foreground, background) }; });
assert(buttonContrast.length > 0 && buttonContrast.every(({ ratio }) => ratio >= 4.5), `active button variants need 4.5:1 text contrast (${buttonContrast.map(({ ratio }) => ratio).join(", ")})`);
assert(buttonContrast.every(({ fontWeight }) => fontWeight === "550"), `active button variants need the medium 550 weight (${buttonContrast.map(({ fontWeight }) => fontWeight).join(", ")})`);
await component("accordion");
await page.click("#accordion-returns-trigger");
assert.equal(await page.$eval("#accordion-returns-panel", (node) => node.hidden), false);
await screenshot("state-accordion-open");
await component("collapsible"); await page.click("#collapsible-members-trigger"); assert.equal(await page.$eval("#collapsible-members-panel", (node) => node.hidden), false);
await clickAndAssert("dropdown-menu", "#dropdown-account-trigger", "#dropdown-account-menu");
await component("dropdown-menu"); await page.click("#dropdown-account-trigger"); await screenshot("state-dropdown-menu-open");
await component("select"); await page.click("#select-timezone"); assert(await page.$eval('#select-timezone-list', (node) => Math.abs(node.getBoundingClientRect().width - node.parentElement.getBoundingClientRect().width) <= 2), "select listbox matches its control width"); await screenshot("state-select-open"); await page.keyboard.press("End"); await page.keyboard.press("Enter"); assert.equal(await page.$eval('input[name="timezone"]', (node) => node.value), "europe-london"); await component("select", viewports[1]); await page.click("#select-timezone"); await screenshot("state-select-open", viewports[1]);
await component("combobox"); await replaceField("#combobox-framework", "Sve"); assert.equal(await page.$eval("#combobox-framework-svelte", (node) => node.dataset.uiActive), "true"); assert(await page.$eval("#combobox-framework-list", (node) => Math.abs(node.getBoundingClientRect().width - node.parentElement.getBoundingClientRect().width) <= 2), "combobox list matches its control width"); await screenshot("state-combobox-open"); await page.mouse.click(4, 4); assert.equal(await page.$eval("#combobox-framework-list", (node) => node.hidden), true); assert.equal(await page.$eval("#combobox-framework", (node) => node.getAttribute("aria-expanded")), "false"); assert.equal(await page.$eval("#combobox-framework", (node) => node.value), "React"); assert.equal(await page.$eval('input[name="framework"]', (node) => node.value), "React"); assert.equal(await page.$eval("#combobox-framework", (node) => node.getAttribute("aria-activedescendant")), "combobox-framework-react"); assert.equal(await page.$eval("#combobox-framework-react", (node) => node.hidden), false); assert.equal(await page.$eval("#combobox-framework-svelte", (node) => node.hidden), false); await replaceField("#combobox-framework", "Sve"); await page.keyboard.press("Enter"); assert.equal(await page.$eval("#combobox-framework", (node) => node.value), "Svelte"); assert.equal(await page.$eval('input[name="framework"]', (node) => node.value), "Svelte"); await component("combobox", viewports[1]); await page.focus("#combobox-framework"); await screenshot("state-combobox-open", viewports[1]);
await component("command"); await page.focus("#command-search"); await screenshot("state-command-open"); assert.equal(await page.$eval("#command-list", (node) => node.hidden), false); await component("command", viewports[1]); await page.focus("#command-search"); await screenshot("state-command-open", viewports[1]);
await component("dialog"); await page.click('[data-ui-part="trigger"]'); assert.equal(await page.$eval("#dialog-profile", (node) => node.open && node.matches(":modal")), true, "dialog uses the native modal top layer"); await screenshot("state-dialog-open"); await page.$eval("#dialog-profile-name", (node) => { node.value = ""; }); await page.click('[data-ui-dialog-form] button[type="submit"]'); assert.equal(await page.$eval("#dialog-profile", (node) => node.open), true); await page.type("#dialog-profile-name", "Alex Morgan"); const dialogURL = page.url(); await page.click('[data-ui-dialog-form] button[type="submit"]'); assert.equal(await page.$eval("#dialog-profile", (node) => node.open), false); assert.equal(page.url(), dialogURL);
await component("alert"); await page.click('[data-ui-part="trigger"]'); assert.equal(await page.$eval('[data-ui-alert-dialog]', (node) => node.open && node.matches(":modal")), true); await screenshot("state-alert-dialog-open"); await page.keyboard.press("Escape"); assert.equal(await page.$eval('[data-ui-alert-dialog]', (node) => node.open), false); assert.equal(await page.$eval('[data-ui-part="trigger"]', (node) => document.activeElement === node), true);
await component("drawer"); await page.click('[data-ui-part="trigger"]'); assert.equal(await page.$eval('[data-ui-drawer]', (node) => node.open && node.matches(":modal")), true); await screenshot("state-drawer-open"); await page.keyboard.press("Escape"); assert.equal(await page.$eval('[data-ui-drawer]', (node) => node.open), false);
await component("sheet"); await page.click('[data-ui-part="trigger"]'); assert.equal(await page.$eval('[data-ui-sheet]', (node) => node.open && node.matches(":modal")), true); await screenshot("state-sheet-open"); await page.keyboard.press("Escape"); assert.equal(await page.$eval('[data-ui-sheet]', (node) => node.open), false);
await component("tooltip"); await page.hover('[data-ui-part="trigger"]'); assert.equal(await page.$eval('[data-ui-part="content"]', (node) => node.hidden), false, "tooltip opens on hover"); await page.click('[data-ui-part="trigger"]'); assert.equal(await page.$eval('[data-ui-part="content"]', (node) => node.hidden), false, "tooltip stays open while its trigger is focused or hovered");
await component("tooltip"); await page.hover('[data-ui-part="trigger"]'); await screenshot("state-tooltip-open");
await component("popover"); await page.click('[data-ui-part="trigger"]'); await screenshot("state-popover-open");
await component("tabs"); await page.focus("#tabs-account-tab"); await page.keyboard.press("ArrowRight"); assert.equal(await page.$eval("#tabs-security-tab", (node) => node.getAttribute("aria-selected")), "true");
await component("toggle"); await page.click('[data-ui-toggle]:not(:disabled)'); assert.equal(await page.$eval('[data-ui-toggle]:not(:disabled)', (node) => node.getAttribute("aria-pressed")), "true");
await component("button-group"); await page.click('[data-ui-toggle][aria-label="Align center"]'); assert.equal(await page.$eval('[data-ui-toggle][aria-label="Align center"]', (node) => node.getAttribute("aria-pressed")), "true"); assert.equal(await page.$eval('[data-ui-toggle][aria-label="Align left"]', (node) => node.getAttribute("aria-pressed")), "false");
await component("checkbox"); await page.click('input[name="terms"]'); assert.equal(await page.$eval('input[name="terms"]', (node) => node.checked), true);
await component("radio-group"); await page.click('input[name="visibility"][value="team"]'); assert.equal(await page.$eval('input[name="visibility"][value="team"]', (node) => node.checked), true);
await component("switch"); await page.click("#switch-updates"); assert.equal(await page.$eval("#switch-updates", (node) => node.checked), false);
await component("calendar"); await page.click('[data-ui-calendar-next]'); assert.match(await page.$eval("#calendar-title", (node) => node.textContent), /July 2026/);
await component("date-picker"); await page.click('[data-ui-part="trigger"]'); const datePickerState = await page.$eval('#date-picker-calendar', (node) => { const box = node.getBoundingClientRect(); return { hidden: node.hidden, positioned: node.dataset.uiPositioned, left: box.left, top: box.top, right: box.right, bottom: box.bottom, viewportWidth: innerWidth, viewportHeight: innerHeight, border: getComputedStyle(node).borderTopWidth, background: getComputedStyle(node).backgroundColor, focusedDay: document.activeElement?.matches("[data-ui-calendar-day]") }; }); assert.equal(datePickerState.hidden, false); assert.equal(datePickerState.positioned, "true"); assert(datePickerState.left >= 0 && datePickerState.top >= 0 && datePickerState.right <= datePickerState.viewportWidth && datePickerState.bottom <= datePickerState.viewportHeight, "date picker remains within the viewport"); assert.notEqual(datePickerState.border, "0px"); assert.notEqual(datePickerState.background, "rgba(0, 0, 0, 0)"); assert.equal(datePickerState.focusedDay, true); await screenshot("state-date-picker-open"); await page.click('[data-ui-calendar-day][data-date="2026-06-11"]'); assert.equal(await page.$eval('[data-ui-date-value]', (node) => node.value), "2026-06-11"); assert.equal(await page.$eval('#date-picker-calendar', (node) => node.hidden), true); await component("date-picker", viewports[1]); await page.click('[data-ui-part="trigger"]'); await screenshot("state-date-picker-open", viewports[1]);
await component("carousel"); await page.focus("[data-ui-carousel]"); await page.keyboard.press("ArrowRight"); assert.equal(await page.$eval('[data-ui-carousel-slide]:nth-of-type(2)', (node) => node.getAttribute("aria-hidden")), "false");
await component("navbar-vertical", viewports[1]); assert.equal(await page.$eval('[data-ui-part="panel"]', (node) => node.hidden), true); await page.click('[data-ui-part="trigger"]'); assert.equal(await page.$eval('[data-ui-part="panel"]', (node) => node.hidden), false); await screenshot("state-navbar-vertical-open", viewports[1]);
await component("toast"); assert.equal(await page.$eval('[data-ui-part="toast"]', (node) => node.hidden), true); await page.click('[data-ui-part="trigger"]'); assert.equal(await page.$eval('[data-ui-part="toast"]', (node) => node.hidden), false); await screenshot("state-toast-open"); await page.click('[data-ui-close]'); assert.equal(await page.$eval('[data-ui-part="toast"]', (node) => node.hidden), true); await page.click('[data-ui-part="trigger"]'); assert.equal(await page.$eval('[data-ui-part="toast"]', (node) => node.hidden), false);
await component("questionnaire"); await page.click('input[name="goal"]'); await page.click('[data-ui-question-next]'); assert.equal(await page.$$eval("[data-ui-question]", (nodes) => nodes[1].hidden), false);
await component("resizable"); await page.focus('[data-ui-part="handle"]'); const resizeBefore = await page.$eval('[data-ui-part="handle"]', (node) => node.getAttribute("aria-valuenow")); await page.keyboard.press("ArrowRight"); const resizeState = await page.$eval('[data-ui-part="handle"]', (node) => { const groupNode = node.closest('[data-ui-part="group"]'), group = groupNode.getBoundingClientRect(), panel = node.previousElementSibling.getBoundingClientRect(), handle = node.getBoundingClientRect(), value = Number(node.getAttribute("aria-valuenow")); return { value, minimum: Number(node.getAttribute("aria-valuemin")), maximum: Number(node.getAttribute("aria-valuemax")), ratio: Math.round(panel.width / group.width * 100), groupClientHeight: groupNode.clientHeight, handleWidth: handle.width, handleHeight: handle.height, cursor: getComputedStyle(node).cursor }; }); assert.notEqual(String(resizeState.value), resizeBefore); assert(resizeState.value >= resizeState.minimum && resizeState.value <= resizeState.maximum); assert(Math.abs(resizeState.value - resizeState.ratio) <= 1, "resizable value matches the pane width"); assert(resizeState.handleWidth >= 24 && resizeState.handleHeight >= resizeState.groupClientHeight - 1, "resizable exposes a full-height touch target at least 24 CSS pixels wide"); assert.equal(resizeState.cursor, "col-resize", "vertical divider advertises horizontal resizing"); for (const viewport of [viewports[1], narrowViewport]) { await component("resizable", viewport); const responsiveResizeState = await page.$eval('[data-ui-part="handle"]', (node) => { const group = node.closest('[data-ui-part="group"]').getBoundingClientRect(), panel = node.previousElementSibling.getBoundingClientRect(), value = Number(node.getAttribute("aria-valuenow")); return { value, ratio: Math.round(panel.width / group.width * 100) }; }); assert(Math.abs(responsiveResizeState.value - responsiveResizeState.ratio) <= 1, `${viewport.name} resizable value matches rendered geometry`); }
await component("message-scroller"); await page.$eval('[data-ui-part="list"]', (node) => { for (let index = 0; index < 30; index++) { const message = document.createElement("p"); message.textContent = `Message ${index}`; node.append(message); } node.scrollTop = 0; node.dispatchEvent(new Event("scroll")); }); await page.waitForFunction(() => !document.querySelector('[data-ui-part="jump"]').hidden); await page.click('[data-ui-part="jump"]'); assert.equal(await page.$eval('[data-ui-part="jump"]', (node) => node.hidden), true);
await component("message-scroller"); await page.type("#message-scroller-input", "   "); await page.click('[data-ui-part="composer"] button[type="submit"]'); assert.equal(await page.$eval("#message-scroller-input", (node) => node.validationMessage), "Enter a message."); await page.type("#message-scroller-input", "Ready for review."); await page.click('[data-ui-part="composer"] button[type="submit"]'); assert.equal(await page.$eval('[data-ui-part="messages"] li:last-child p', (node) => node.textContent), "Ready for review."); assert.equal(await page.$eval("#message-scroller-input", (node) => node.value), "");
await component("data-table"); await page.type("#data-table-filter", "Atlas"); assert.equal(await page.$eval('[data-ui-part="status"]', (node) => node.textContent), "1 matching project"); assert.equal(await page.$eval('[data-ui-part="range"]', (node) => node.textContent), "Showing 1–1 of 3 projects"); await page.$eval("#data-table-filter", (node) => { node.value = "absent"; node.dispatchEvent(new Event("input", { bubbles: true })); }); assert.equal(await page.$eval('[data-ui-part="empty"]', (node) => node.hidden), false); await page.click('[data-ui-table-clear]'); assert.equal(await page.$eval("#data-table-filter", (node) => node.value), ""); assert.equal(await page.$eval('[data-ui-part="empty"]', (node) => node.hidden), true); await page.click('[data-ui-table-sort-trigger]'); assert.equal(await page.$eval("th", (node) => node.getAttribute("aria-sort")), "descending");
await component("diff"); await page.$eval('[data-ui-part="control"]', (node) => { node.value = "68"; node.dispatchEvent(new Event("input", { bubbles: true })); }); assert.equal(await page.$eval('[data-ui-part="status"]', (node) => node.textContent), "68% after"); assert.equal(await page.$eval('[data-ui-part="control"]', (node) => node.getAttribute("aria-valuetext")), "68 percent after");
await component("number-field"); await page.click('[data-ui-part="increment"]'); assert.equal(await page.$eval('[data-ui-part="input"]', (node) => node.value), "4");
await component("autocomplete"); await replaceField("#autocomplete-city", "Wro"); assert.equal(await page.$eval("#autocomplete-city-wroclaw", (node) => node.dataset.uiActive), "true"); await page.keyboard.press("Enter"); assert.equal(await page.$eval("#autocomplete-city", (node) => node.value), "Wrocław");
await component("checkbox-group"); assert.equal(await page.$eval("#checkbox-group-all", (node) => node.indeterminate && node.getAttribute("aria-checked") === "mixed"), true, "checkbox group exposes its initial mixed state"); await page.click("#checkbox-group-all"); assert.equal(await page.$$eval('[data-ui-part="item"]', (nodes) => nodes.every((node) => node.checked)), true);
await component("lightbox"); await page.click('[data-ui-slide="1"]'); assert.equal(await page.$eval('#lightbox-dialog', (node) => node.open), true); assert.match(await page.$eval('[data-ui-part="status"]', (node) => node.textContent), /Image 2 of 3/); await page.keyboard.press("ArrowRight"); assert.match(await page.$eval('[data-ui-part="status"]', (node) => node.textContent), /Image 3 of 3/); await page.keyboard.press("Escape"); assert.equal(await page.$eval('#lightbox-dialog', (node) => node.open), false);
await component("sortable-list"); await page.focus('[data-ui-part="handle"]'); await page.keyboard.press("Space"); await page.keyboard.press("ArrowDown"); assert.match(await page.$eval('[data-ui-part="status"]', (node) => node.textContent), /position 2 of 3/);
await component("split-button"); await page.click('[data-ui-part="trigger"]'); assert.equal(await page.$eval('[data-ui-part="content"]', (node) => node.hidden), false); assert.equal(await page.$eval('[data-ui-part="content"]', (node) => Math.abs(node.getBoundingClientRect().right - node.closest('.ui-split-button').getBoundingClientRect().right) <= 1), true, "split-button menu aligns to the group end"); await page.keyboard.press("ArrowDown"); await page.keyboard.press("Escape"); assert.equal(await page.$eval('[data-ui-part="content"]', (node) => node.hidden), true);
await component("time-field"); await page.focus('[data-ui-part="minute"]'); await page.keyboard.press("ArrowUp"); assert.equal(await page.$eval('[data-ui-part="value"]', (node) => node.value), "09:31");
await component("progress"); assert.equal(await page.$$eval('progress.ui-progress,meter.ui-progress', (nodes) => nodes.length), 4, "progress example includes task progress and native meter states");
for (const viewport of [viewports[1], narrowViewport]) {
    await component("description-list", viewport);
    const descriptionListGeometry = await page.$eval(".ui-description-list", (list) => {
        const longValue = [...list.querySelectorAll("dd")].find((node) => node.textContent.includes("registry.example"));
        const listBox = list.getBoundingClientRect(), valueBox = longValue.getBoundingClientRect();
        return { overflow: list.scrollWidth - list.clientWidth, contained: valueBox.left >= listBox.left - 1 && valueBox.right <= listBox.right + 1, wrapped: valueBox.height > parseFloat(getComputedStyle(longValue).lineHeight) + 1 };
    });
    assert.equal(descriptionListGeometry.overflow <= 1 && descriptionListGeometry.contained && descriptionListGeometry.wrapped, true, `${viewport.name} Description List wraps long values without overflow`);
    await component("item", viewport);
    const operationGeometry = await page.$$eval(".ui-item--operation", (rows) => rows.map((row) => {
        const action = row.querySelector(".ui-item-actions button,.ui-item-actions a[href]"), status = row.querySelector(".ui-item-status"), box = row.getBoundingClientRect(), actionBox = action?.getBoundingClientRect();
        action?.focus();
        return { overflow: row.scrollWidth - row.clientWidth, nonInteractiveRow: !row.matches("button,a,input,select,textarea,[role=button],[role=link]") && !row.hasAttribute("tabindex"), visibleStatus: Boolean(status?.textContent.trim() && status.getClientRects().length), independentFocusedAction: document.activeElement === action, actionContained: Boolean(actionBox && actionBox.left >= box.left - 1 && actionBox.right <= box.right + 1) };
    }));
    assert(operationGeometry.length >= 3 && operationGeometry.every((row) => row.overflow <= 1 && row.nonInteractiveRow && row.visibleStatus && row.independentFocusedAction && row.actionContained), `${viewport.name} operational Item rows remain noninteractive and contained with visible status and independent actions: ${JSON.stringify(operationGeometry)}`);
    await component("scroll-area", viewport);
    const outputGeometry = await page.$eval(".ui-scroll-area--output", (output) => {
        output.focus();
        const scrollOwners = [output, ...output.querySelectorAll("*")].filter((node) => ["auto", "scroll"].includes(getComputedStyle(node).overflowY)).length;
        return { focused: document.activeElement === output, overflow: output.scrollWidth - output.clientWidth, bounded: output.scrollHeight > output.clientHeight, scrollOwners, live: output.getAttribute("aria-live") };
    });
    assert.equal(outputGeometry.focused && outputGeometry.overflow <= 1 && outputGeometry.bounded && outputGeometry.scrollOwners === 1 && outputGeometry.live === null, true, `${viewport.name} diagnostic output has one focusable bounded scroll owner without a live region`);
}
await component("scroll-fade"); assert.equal(await page.$eval('.ui-scroll-fade-y', (node) => getComputedStyle(node).maskImage !== "none"), true, "vertical scroll fade exposes a mask"); assert.equal(await page.$eval('.ui-scroll-fade-x', (node) => getComputedStyle(node).maskImage !== "none"), true, "horizontal scroll fade exposes a mask");
await component("shimmer"); assert.match(await page.$eval('.ui-shimmer', (node) => getComputedStyle(node).animationName), /ui-shimmer/, "shimmer utility animates"); assert.equal(await page.$eval('.ui-shimmer-none', (node) => getComputedStyle(node).animationName), "none", "shimmer can be disabled");
await component("spinner"); assert.equal(await page.$eval('.ui-spin', (node) => getComputedStyle(node).animationDuration), "1.2s", "spinner uses the slower motion duration");
await component("chart"); assert.equal(await page.$eval('[data-ui-part="plot"]', (plot) => { const box = plot.getBoundingClientRect(); return plot.scrollWidth === plot.clientWidth && [...plot.querySelectorAll(".ui-chart-labels li, .ui-chart-value")].every((node) => { const label = node.getBoundingClientRect(); return label.left >= box.left - 1 && label.right <= box.right + 1; }); }), true, "chart stays responsive and keeps every label inside the plot");
await component("button"); assert.equal(await page.$eval('.ui-button-ghost', (node) => getComputedStyle(node).backgroundColor === "rgba(0, 0, 0, 0)"), true, "ghost button is transparent at rest");
assert.match(await page.$eval("body", (node) => getComputedStyle(node).fontFamily), /geist/i, "Geist is the primary interface family");

await page.close();
await browser.disconnect();
if (failures.length) throw new Error(failures.join("\n"));
console.log(`browser smoke passed for catalog, ${manifest.length} snippets at desktop and mobile, and component interactions`);
