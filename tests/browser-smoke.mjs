import assert from "node:assert/strict";
import fs from "node:fs";
import puppeteer from "puppeteer-core";

const base = process.env.CORE_UI_BASE_URL || "http://127.0.0.1:18081/ui";
const browserURL = process.env.CORE_UI_BROWSER_URL || "http://127.0.0.1:9223";
const manifest = JSON.parse(fs.readFileSync(new URL("../catalog/components.json", import.meta.url), "utf8"));
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

async function load(url, viewport = { width: 1280, height: 900 }) {
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts?.ready);
}

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844, isMobile: true }]) {
    await load(`${base}/catalog/`, viewport);
    await page.waitForFunction(() => document.querySelector("#component-count")?.textContent.includes("64"));
    const result = await page.evaluate(() => ({
        count: document.querySelector("#component-list")?.children.length,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    if (result.count !== manifest.length || result.overflow > 1) failures.push(`catalog ${viewport.width}: ${JSON.stringify(result)}`);
}

for (const component of manifest) {
    await load(`${base}/snippets/${component.slug}.html`, { width: 1024, height: 768 });
    const result = await page.evaluate(() => {
        const walker = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT);
        let hasStart = false;
        while (walker.nextNode()) if (walker.currentNode.data.trim() === "core-ui-snippet:start") hasStart = true;
        const visible = [...document.body.querySelectorAll("*")].filter((node) => {
            const box = node.getBoundingClientRect();
            return box.width > 0 && box.height > 0;
        }).length;
        const badFocus = [...document.querySelectorAll("button,a[href],input,select,textarea,[tabindex='0']")].filter((node) => {
            if (node.matches(":disabled,[aria-disabled='true']") || !node.getClientRects().length) return false;
            node.focus();
            const style = getComputedStyle(node);
            const groupStyle = node.closest(".ui-input-group") && getComputedStyle(node.closest(".ui-input-group"));
            const proxyStyle = node.nextElementSibling && getComputedStyle(node.nextElementSibling);
            return style.outlineStyle === "none" && style.boxShadow === "none" && (!groupStyle || groupStyle.outlineStyle === "none") && (!proxyStyle || proxyStyle.outlineStyle === "none");
        }).length;
        return { hasStart, visible, badFocus, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    if (!result.hasStart || result.visible < 2 || result.badFocus || result.overflow > 1) failures.push(`${component.slug}: ${JSON.stringify(result)}`);
}

async function component(slug) {
    await load(`${base}/snippets/${slug}.html`);
}

await component("dialog");
await page.click('[data-ui-part="trigger"]');
assert.equal(await page.$eval('[role="dialog"]', (node) => node.hidden), false);
await page.keyboard.press("Escape");
assert.equal(await page.$eval('[role="dialog"]', (node) => node.hidden), true);

await component("tabs");
await page.focus("#tabs-account-tab");
await page.keyboard.press("ArrowRight");
assert.equal(await page.$eval("#tabs-security-tab", (node) => node.getAttribute("aria-selected")), "true");
await page.keyboard.press("ArrowRight");
assert.equal(await page.$eval("#tabs-account-tab", (node) => node.getAttribute("aria-selected")), "true");
assert.equal(await page.$eval("#tabs-billing-tab", (node) => node.getAttribute("aria-selected")), "false");

await component("combobox");
await page.focus("#combobox-framework");
await page.keyboard.down("Control");
await page.keyboard.press("A");
await page.keyboard.up("Control");
await page.keyboard.type("Sve");
assert.equal(await page.$eval("#combobox-framework-svelte", (node) => node.dataset.uiActive), "true");
assert.equal(await page.$eval("#combobox-framework-svelte", (node) => node.getAttribute("aria-selected")), "false");
await page.keyboard.press("Enter");
assert.equal(await page.$eval("#combobox-framework", (node) => node.value), "Svelte");

await component("select");
await page.click('[data-ui-part="trigger"]');
await page.keyboard.press("End");
await page.keyboard.press("Enter");
assert.equal(await page.$eval('input[name="timezone"]', (node) => node.value), "europe-london");

await component("date-picker");
await page.click('[data-ui-part="trigger"]');
await page.click('[data-ui-calendar-day][data-date="2026-06-11"]');
assert.equal(await page.$eval('[data-ui-date-value]', (node) => node.value), "2026-06-11");

await component("data-table");
await page.type("#data-table-filter", "absent");
assert.equal(await page.$eval('[data-ui-part="empty"]', (node) => node.hidden), false);

await page.close();
await browser.disconnect();
if (failures.length) throw new Error(failures.join("\n"));
console.log(`browser smoke passed for catalog, ${manifest.length} snippets, and representative interactions`);
