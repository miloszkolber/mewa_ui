import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const base = process.env.CORE_UI_BASE_URL || "http://127.0.0.1:8083/ui";
const browserURL = process.env.CORE_UI_BROWSER_URL || "http://127.0.0.1:9223";
const screenshotDir = process.env.CORE_UI_SCREENSHOT_DIR;
const manifest = JSON.parse(fs.readFileSync(new URL("../catalog/components.json", import.meta.url), "utf8"));
const viewports = [
    { name: "desktop", width: 1280, height: 900 },
    { name: "mobile", width: 390, height: 844, isMobile: true },
];
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

function assertCanonicalAssets(assets, pageName, { runtime = true } = {}) {
    assert.deepEqual(assets.stylesheets, ["/ui/src/base.css", "/ui/src/components.css"], `${pageName}: stylesheet order must be canonical`);
    if (runtime) assert(assets.scripts.includes("/ui/src/components.js"), `${pageName}: missing canonical runtime`);
    assets.iconReferences.forEach((reference) => assert(reference.startsWith("/ui/src/lucide.svg#"), `${pageName}: icon must use canonical sprite (${reference})`));
}

async function assertVisualState(name) {
    const result = await page.evaluate(() => {
        const rect = (node) => { const box = node.getBoundingClientRect(); return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height }; };
        const roots = [...document.querySelectorAll("[data-ui-component],[data-ui-calendar],[data-ui-carousel],[data-ui-resizable],[data-ui-sidebar],[data-ui-questionnaire],[data-ui-message-scroller],[data-ui-table]")];
        const candidates = roots.length ? roots : [...document.body.children];
        const useful = candidates.map(rect).filter((box) => box.width > 1 && box.height > 1);
        const boundsPassed = useful.every((box) => box.left >= -1 && box.right <= innerWidth + 1 && box.bottom > 0 && box.top < innerHeight);
        const visible = [...document.body.querySelectorAll("*")].filter((node) => { const box = node.getBoundingClientRect(); return !node.hidden && box.width > 0 && box.height > 0; }).length;
        const walker = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT);
        let hasStart = false;
        while (walker.nextNode()) if (walker.currentNode.data.trim() === "core-ui-snippet:start") hasStart = true;
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
    await page.waitForFunction(() => document.querySelector("#component-count")?.textContent.includes("64"));
    const result = await page.evaluate(() => ({ count: document.querySelector("#component-list")?.children.length, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
    if (result.count !== manifest.length || result.overflow > 1) failures.push(`catalog ${viewport.name}: ${JSON.stringify(result)}`);
}

for (const layout of ["vertical-rail", "horizontal-tabs"]) {
    for (const viewport of viewports) {
        await load(`${base}/layouts/${layout}.html`, viewport);
        assertCanonicalAssets(await canonicalAssets(), `${layout} ${viewport.name}`);
        const result = await page.evaluate((name) => {
            const main = document.querySelector(".ui-shell-main")?.getBoundingClientRect();
            const navigation = document.querySelector(name === "vertical-rail" ? ".ui-rail" : ".ui-topbar")?.getBoundingClientRect();
            return { main, navigation, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
        }, layout);
        if (!result.main || !result.navigation || result.overflow > 1) failures.push(`${layout} ${viewport.name}: ${JSON.stringify(result)}`);
        if (layout === "vertical-rail" && viewport.width > 640 && result.navigation.right > result.main.left + 1) failures.push(`${layout} ${viewport.name}: rail does not precede main`);
        if (layout === "vertical-rail" && viewport.width <= 640 && result.navigation.top < result.main.bottom - 1) failures.push(`${layout} ${viewport.name}: mobile rail does not follow main`);
        if (layout === "horizontal-tabs" && result.navigation.bottom > result.main.top + 1) failures.push(`${layout} ${viewport.name}: top navigation does not precede main`);
    }
}

for (const component of manifest) {
    for (const viewport of viewports) {
        await load(`${base}/snippets/${component.slug}.html`, viewport, component.slug);
        assertCanonicalAssets(await canonicalAssets(), `${component.slug} ${viewport.name}`);
        await assertVisualState(`${component.slug} ${viewport.name}`);
    }
}

async function component(slug, viewport = viewports[0]) { await load(`${base}/snippets/${slug}.html`, viewport); }
async function clickAndAssert(slug, trigger, panel) {
    await component(slug); await page.click(trigger); assert.equal(await page.$eval(panel, (node) => node.hidden), false, `${slug} opens`); await page.keyboard.press("Escape"); assert.equal(await page.$eval(panel, (node) => node.hidden), true, `${slug} closes`);
}

await component("accordion");
await page.click("#accordion-returns-trigger");
assert.equal(await page.$eval("#accordion-returns-panel", (node) => node.hidden), false);
await screenshot("state-accordion-open");
await component("collapsible"); await page.click("#collapsible-members-trigger"); assert.equal(await page.$eval("#collapsible-members-panel", (node) => node.hidden), false);
await clickAndAssert("dropdown-menu", "#dropdown-account-trigger", "#dropdown-account-menu");
await component("dropdown-menu"); await page.click("#dropdown-account-trigger"); await screenshot("state-dropdown-menu-open");
await component("context-menu"); await page.click("#context-menu-trigger", { button: "right" });
const contextPosition = await page.$eval("#context-menu-actions", (node) => ({ hidden: node.hidden, left: Number.parseFloat(node.style.left), top: Number.parseFloat(node.style.top) }));
assert.equal(contextPosition.hidden, false); assert(contextPosition.left >= 0 && contextPosition.top >= 0, "context menu has pointer position");
await screenshot("state-context-menu-open");
await component("menubar"); await page.focus("#menubar-file-trigger"); await page.keyboard.press("ArrowDown"); assert.equal(await page.$eval("#menubar-file-menu", (node) => node.hidden), false); await page.keyboard.press("Escape"); await page.keyboard.press("ArrowRight"); assert.equal(await page.$eval("#menubar-edit-trigger", (node) => node.tabIndex), 0); assert.equal(await page.$eval("#menubar-file-trigger", (node) => node.tabIndex), -1);
await component("menubar"); await page.focus("#menubar-file-trigger"); await page.keyboard.press("ArrowDown"); await screenshot("state-menubar-open");
await component("navigation-menu"); await page.click("#navigation-menu-products-trigger"); assert.equal(await page.$eval("#navigation-menu-products-panel", (node) => node.hidden), false); await screenshot("state-navigation-menu-open"); await component("navigation-menu", viewports[1]); await page.click("#navigation-menu-products-trigger"); await screenshot("state-navigation-menu-open", viewports[1]);
await component("select"); await page.click("#select-timezone"); assert(await page.$eval('#select-timezone-list', (node) => Math.abs(node.getBoundingClientRect().width - node.parentElement.getBoundingClientRect().width) <= 2), "select listbox matches its control width"); await screenshot("state-select-open"); await page.keyboard.press("End"); await page.keyboard.press("Enter"); assert.equal(await page.$eval('input[name="timezone"]', (node) => node.value), "europe-london"); await component("select", viewports[1]); await page.click("#select-timezone"); await screenshot("state-select-open", viewports[1]);
await component("combobox"); await page.focus("#combobox-framework"); await page.keyboard.down("Control"); await page.keyboard.press("A"); await page.keyboard.up("Control"); await page.keyboard.type("Sve"); assert.equal(await page.$eval("#combobox-framework-svelte", (node) => node.dataset.uiActive), "true"); assert(await page.$eval("#combobox-framework-list", (node) => Math.abs(node.getBoundingClientRect().width - node.parentElement.getBoundingClientRect().width) <= 2), "combobox list matches its control width"); await screenshot("state-combobox-open"); await page.mouse.click(4, 4); assert.equal(await page.$eval("#combobox-framework-list", (node) => node.hidden), true); assert.equal(await page.$eval("#combobox-framework", (node) => node.getAttribute("aria-expanded")), "false"); await page.focus("#combobox-framework"); await page.keyboard.press("Enter"); assert.equal(await page.$eval("#combobox-framework", (node) => node.value), "Svelte"); await component("combobox", viewports[1]); await page.focus("#combobox-framework"); await screenshot("state-combobox-open", viewports[1]);
await component("command"); await page.focus("#command-search"); await screenshot("state-command-open"); assert.equal(await page.$eval("#command-list", (node) => node.hidden), false); await component("command", viewports[1]); await page.focus("#command-search"); await screenshot("state-command-open", viewports[1]);
await component("dialog"); await page.click('[data-ui-part="trigger"]'); await screenshot("state-dialog-open"); await page.keyboard.press("Escape");
await component("alert-dialog"); await page.click('[data-ui-part="trigger"]'); await screenshot("state-alert-dialog-open"); await page.keyboard.press("Escape");
await component("drawer"); await page.click('[data-ui-part="trigger"]'); await screenshot("state-drawer-open"); await page.keyboard.press("Escape");
await component("sheet"); await page.click('[data-ui-part="trigger"]'); await screenshot("state-sheet-open"); await page.keyboard.press("Escape");
for (const slug of ["tooltip", "hover-card"]) { await component(slug); await page.hover('[data-ui-part="trigger"]'); assert.equal(await page.$eval('[data-ui-part="content"]', (node) => node.hidden), false, `${slug} opens on hover`); await page.click('[data-ui-part="trigger"]'); assert.equal(await page.$eval('[data-ui-part="content"]', (node) => node.hidden), false, `${slug} stays open while its trigger is focused or hovered`); }
await component("hover-card"); await page.hover('[data-ui-part="trigger"]'); await screenshot("state-hover-card-open");
await component("tooltip"); await page.hover('[data-ui-part="trigger"]'); await screenshot("state-tooltip-open");
await component("popover"); await page.click('[data-ui-part="trigger"]'); await screenshot("state-popover-open");
await component("tabs"); await page.focus("#tabs-account-tab"); await page.keyboard.press("ArrowRight"); assert.equal(await page.$eval("#tabs-security-tab", (node) => node.getAttribute("aria-selected")), "true");
await component("toggle"); await page.click('[data-ui-toggle]:not(:disabled)'); assert.equal(await page.$eval('[data-ui-toggle]:not(:disabled)', (node) => node.getAttribute("aria-pressed")), "true");
await component("toggle-group"); await page.click('[data-ui-toggle][aria-pressed="false"]'); assert.equal(await page.$eval('[data-ui-toggle][aria-label="Italic text"]', (node) => node.getAttribute("aria-pressed")), "true");
await component("checkbox"); await page.click('input[name="terms"]'); assert.equal(await page.$eval('input[name="terms"]', (node) => node.checked), true);
await component("radio-group"); await page.click('input[name="visibility"][value="team"]'); assert.equal(await page.$eval('input[name="visibility"][value="team"]', (node) => node.checked), true);
await component("switch"); await page.click("#switch-updates"); assert.equal(await page.$eval("#switch-updates", (node) => node.checked), false);
await component("calendar"); await page.click('[data-ui-calendar-next]'); assert.match(await page.$eval("#calendar-title", (node) => node.textContent), /July 2026/);
await component("date-picker"); await page.click('[data-ui-part="trigger"]'); const datePickerState = await page.$eval('#date-picker-calendar', (node) => { const box = node.getBoundingClientRect(); return { hidden: node.hidden, positioned: node.dataset.uiPositioned, left: box.left, top: box.top, right: box.right, bottom: box.bottom, viewportWidth: innerWidth, viewportHeight: innerHeight, border: getComputedStyle(node).borderTopWidth, background: getComputedStyle(node).backgroundColor, focusedDay: document.activeElement?.matches("[data-ui-calendar-day]") }; }); assert.equal(datePickerState.hidden, false); assert.equal(datePickerState.positioned, "true"); assert(datePickerState.left >= 0 && datePickerState.top >= 0 && datePickerState.right <= datePickerState.viewportWidth && datePickerState.bottom <= datePickerState.viewportHeight, "date picker remains within the viewport"); assert.notEqual(datePickerState.border, "0px"); assert.notEqual(datePickerState.background, "rgba(0, 0, 0, 0)"); assert.equal(datePickerState.focusedDay, true); await screenshot("state-date-picker-open"); await page.click('[data-ui-calendar-day][data-date="2026-06-11"]'); assert.equal(await page.$eval('[data-ui-date-value]', (node) => node.value), "2026-06-11"); assert.equal(await page.$eval('#date-picker-calendar', (node) => node.hidden), true); await component("date-picker", viewports[1]); await page.click('[data-ui-part="trigger"]'); await screenshot("state-date-picker-open", viewports[1]);
await component("carousel"); await page.focus("[data-ui-carousel]"); await page.keyboard.press("ArrowRight"); assert.equal(await page.$eval('[data-ui-carousel-slide]:nth-of-type(2)', (node) => node.getAttribute("aria-hidden")), "false");
await component("sidebar"); await page.click('[data-ui-part="trigger"]'); assert.equal(await page.$eval("#sidebar-navigation", (node) => node.hidden), true);
await component("toast"); assert.equal(await page.$eval('[data-ui-part="toast"]', (node) => node.hidden), true); await page.click('[data-ui-part="trigger"]'); assert.equal(await page.$eval('[data-ui-part="toast"]', (node) => node.hidden), false); await screenshot("state-toast-open"); await page.click('[data-ui-close]'); assert.equal(await page.$eval('[data-ui-part="toast"]', (node) => node.hidden), true); await page.click('[data-ui-part="trigger"]'); assert.equal(await page.$eval('[data-ui-part="toast"]', (node) => node.hidden), false);
await component("questionnaire"); await page.click('input[name="goal"]'); await page.click('[data-ui-question-next]'); assert.equal(await page.$$eval("[data-ui-question]", (nodes) => nodes[1].hidden), false);
await component("resizable"); await page.focus('[data-ui-part="handle"]'); const resizeBefore = await page.$eval('[data-ui-part="handle"]', (node) => node.getAttribute("aria-valuenow")); await page.keyboard.press("ArrowRight"); const resizeState = await page.$eval('[data-ui-part="handle"]', (node) => { const group = node.closest('[data-ui-part="group"]').getBoundingClientRect(), panel = node.previousElementSibling.getBoundingClientRect(), value = Number(node.getAttribute("aria-valuenow")); return { value, minimum: Number(node.getAttribute("aria-valuemin")), maximum: Number(node.getAttribute("aria-valuemax")), ratio: Math.round(panel.width / group.width * 100) }; }); assert.notEqual(String(resizeState.value), resizeBefore); assert(resizeState.value >= resizeState.minimum && resizeState.value <= resizeState.maximum); assert(Math.abs(resizeState.value - resizeState.ratio) <= 1, "resizable value matches the pane width");
await component("message-scroller"); await page.$eval('[data-ui-part="list"]', (node) => { for (let index = 0; index < 30; index++) { const message = document.createElement("p"); message.textContent = `Message ${index}`; node.append(message); } node.scrollTop = 0; node.dispatchEvent(new Event("scroll")); }); await page.waitForFunction(() => !document.querySelector('[data-ui-part="jump"]').hidden); await page.click('[data-ui-part="jump"]'); assert.equal(await page.$eval('[data-ui-part="jump"]', (node) => node.hidden), true);
await component("data-table"); await page.type("#data-table-filter", "absent"); assert.equal(await page.$eval('[data-ui-part="empty"]', (node) => node.hidden), false); await page.$eval("#data-table-filter", (node) => { node.value = ""; node.dispatchEvent(new Event("input", { bubbles: true })); }); await page.click('[data-ui-table-sort-trigger]'); assert.equal(await page.$eval("th", (node) => node.getAttribute("aria-sort")), "descending");

await page.close();
await browser.disconnect();
if (failures.length) throw new Error(failures.join("\n"));
console.log(`browser smoke passed for catalog, ${manifest.length} snippets at desktop and mobile, and component interactions`);
