import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = "127.0.0.1";
const registry = JSON.parse(fs.readFileSync(path.join(root, "registry.json"), "utf8"));
const components = registry.components;
const configuredBaseUrl = process.env.MEWA_UI_BASE_URL;
const defaultBaseUrl = "http://127.0.0.1:8083";
const configuredPort = Number.parseInt(process.env.MEWA_UI_PORT || "0", 10);
const screenshotDir = process.env.MEWA_UI_SCREENSHOT_DIR;
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 }
];

assert(Array.isArray(components) && components.length > 0, "registry.json must contain components");
for (const component of components) {
  assert.equal(typeof component.slug, "string", "registry component slugs are required");
  assert.equal(typeof component.docs, "string", `${component.slug}: registry doc path is required`);
  assert.equal(typeof component.files?.css, "string", `${component.slug}: registry stylesheet path is required`);
  assert(component.docs.startsWith("docs/") && component.docs.endsWith(".html"), `${component.slug}: docs must point to docs/*.html`);
  assert(fs.existsSync(path.join(root, component.docs)), `${component.slug}: missing ${component.docs}`);
  assert(fs.existsSync(path.join(root, component.files.css)), `${component.slug}: missing ${component.files.css}`);
}

const baseUrl = (configuredBaseUrl || defaultBaseUrl).replace(/\/+$/, "");
let activeBaseUrl = baseUrl;
const shouldStartServer = !configuredBaseUrl;
const requestedPort = Number.isInteger(configuredPort) && configuredPort >= 0 ? configuredPort : 0;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".webp": "image/webp"
};

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
    let channels;
    let alpha = 1;
    if (body.includes(",")) {
      assert(!body.includes("/"), `mixed comma RGB syntax is unsupported: ${value}`);
      const parts = body.split(",").map((part) => part.trim());
      assert(parts.length === 3 || parts.length === 4, `comma RGB needs three channels and optional alpha: ${value}`);
      channels = parts.slice(0, 3).map(rgbComponent);
      if (parts.length === 4) alpha = alphaComponent(parts[3]);
    } else {
      const sections = body.split("/").map((part) => part.trim());
      assert(sections.length <= 2, `modern RGB contains too many alpha separators: ${value}`);
      channels = sections[0].split(/\s+/).filter(Boolean).map(rgbComponent);
      if (sections.length === 2) alpha = alphaComponent(sections[1]);
    }
    assert(channels.length === 3 && channels.every(Number.isFinite) && Number.isFinite(alpha), `unsupported RGB color: ${value}`);
    return {
      red: clamp(channels[0]),
      green: clamp(channels[1]),
      blue: clamp(channels[2]),
      alpha: clamp(alpha)
    };
  }

  const srgb = text.match(/^color\(srgb\s+(.+)\)$/);
  if (srgb) {
    const sections = srgb[1].split("/").map((part) => part.trim());
    assert(sections.length <= 2, `sRGB contains too many alpha separators: ${value}`);
    const channels = sections[0].split(/\s+/).filter(Boolean).map(srgbComponent);
    const alpha = sections.length === 2 ? alphaComponent(sections[1]) : 1;
    assert(channels.length === 3 && channels.every(Number.isFinite) && Number.isFinite(alpha), `unsupported sRGB color: ${value}`);
    return {
      red: clamp(channels[0]),
      green: clamp(channels[1]),
      blue: clamp(channels[2]),
      alpha: clamp(alpha)
    };
  }

  const oklch = text.match(/^oklch\(\s*([-+\d.]+)(%)?\s+([-+\d.]+)\s+([-+\d.]+)(?:deg)?(?:\s*\/\s*([-+\d.]+%?))?\s*\)$/);
  if (oklch) {
    const lightness = Number(oklch[1]) / (oklch[2] ? 100 : 1);
    const chroma = Number(oklch[3]);
    const radians = Number(oklch[4]) * Math.PI / 180;
    const alpha = oklch[5] ? alphaComponent(oklch[5]) : 1;
    assert([lightness, chroma, radians, alpha].every(Number.isFinite), `unsupported OKLCH color: ${value}`);

    const a = chroma * Math.cos(radians);
    const b = chroma * Math.sin(radians);
    const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return {
      red: clamp(linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
      green: clamp(linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
      blue: clamp(linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
      alpha: clamp(alpha)
    };
  }

  throw new Error(`unsupported computed color: ${value}`);
}

const composite = (foreground, background) => ({
  red: foreground.red * foreground.alpha + background.red * (1 - foreground.alpha),
  green: foreground.green * foreground.alpha + background.green * (1 - foreground.alpha),
  blue: foreground.blue * foreground.alpha + background.blue * (1 - foreground.alpha),
  alpha: 1
});
const linearChannel = (value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
const luminance = (color) => 0.2126 * linearChannel(color.red) + 0.7152 * linearChannel(color.green) + 0.0722 * linearChannel(color.blue);
const contrastRatio = (foreground, background) => (
  (Math.max(luminance(foreground), luminance(background)) + 0.05)
  / (Math.min(luminance(foreground), luminance(background)) + 0.05)
);
const near = (actual, expected) => Math.abs(actual - expected) <= 0.0001;

const colorFixtures = [
  ["rgb(255, 0, 128)", { red: 1, green: 0, blue: 128 / 255, alpha: 1 }],
  ["rgb(100% 0% 50%)", { red: 1, green: 0, blue: 0.5, alpha: 1 }],
  ["rgb(255 0 0 / 25%)", { red: 1, green: 0, blue: 0, alpha: 0.25 }],
  ["rgba(255, 255, 255, 0.5)", { red: 1, green: 1, blue: 1, alpha: 0.5 }],
  ["color(srgb 0.25 0.5 1 / 75%)", { red: 0.25, green: 0.5, blue: 1, alpha: 0.75 }],
  ["oklch(100% 0 0 / 50%)", { red: 1, green: 1, blue: 1, alpha: 0.5 }],
  ["oklch(1 0 0 / 0.5)", { red: 1, green: 1, blue: 1, alpha: 0.5 }],
  ["transparent", { red: 0, green: 0, blue: 0, alpha: 0 }]
];

for (const [source, expected] of colorFixtures) {
  const actual = parseCssColor(source);
  for (const channel of Object.keys(expected)) {
    assert(near(actual[channel], expected[channel]), `${source}: ${channel} parsed as ${actual[channel]}, expected ${expected[channel]}`);
  }
}

const halfWhiteOnBlack = composite(parseCssColor("rgba(255, 255, 255, 0.5)"), parseCssColor("rgb(0 0 0)"));
assert([halfWhiteOnBlack.red, halfWhiteOnBlack.green, halfWhiteOnBlack.blue].every((channel) => near(channel, 0.5)), "alpha must participate in compositing");
assert(contrastRatio(parseCssColor("rgb(255 255 255)"), parseCssColor("rgb(0 0 0)")) > 20, "contrast fixtures must preserve black/white luminance");

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function routeUrl(route) {
  const base = new URL(`${activeBaseUrl}/`);
  return new URL(route.replace(/^\/+/, ""), base).toString();
}

function assetPath(relativePath) {
  return new URL(relativePath, new URL(`${activeBaseUrl}/`)).pathname;
}

function safeTarget(requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl || "/", "http://mewa.local").pathname);
  } catch {
    return null;
  }
  if (pathname === "/") pathname = "/docs/typography.html";
  const target = path.resolve(root, `.${pathname}`);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) return null;
  const relative = path.relative(root, target);
  const allowedRoots = ["src", "components", "docs", "layouts", "registry.json"];
  if (!allowedRoots.some((name) => relative === name || relative.startsWith(`${name}${path.sep}`))) return null;
  return target;
}

function startServer() {
  const server = http.createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
      response.end("Method not allowed");
      return;
    }
    if ((request.url || "").split("?", 1)[0] === "/favicon.ico") {
      response.writeHead(204, { "cache-control": "no-store" });
      response.end();
      return;
    }

    const target = safeTarget(request.url);
    if (!target) {
      response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
      response.end("Bad path");
      return;
    }

    fs.stat(target, (statError, stats) => {
      if (statError || !stats.isFile()) {
        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }

      const headers = {
        "cache-control": "public, max-age=60",
        "content-type": mimeTypes[path.extname(target).toLowerCase()] || "application/octet-stream"
      };
      if (request.method === "HEAD") {
        response.writeHead(200, headers);
        response.end();
        return;
      }

      fs.readFile(target, (readError, content) => {
        if (readError) {
          response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
          response.end("Unable to read file");
          return;
        }
        response.writeHead(200, headers);
        response.end(content);
      });
    });
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(requestedPort, host, () => {
      server.removeListener("error", reject);
      const address = server.address();
      resolve({ server, baseUrl: `http://${host}:${address.port}` });
    });
  });
}

function closeServer(server) {
  return server ? new Promise((resolve) => server.close(() => resolve())) : Promise.resolve();
}

async function startLocalServer() {
  try {
    return await startServer();
  } catch (error) {
    if (error?.code === "EADDRINUSE") return null;
    throw error;
  }
}

function chromiumPath() {
  const configured = process.env.MEWA_UI_CHROMIUM_PATH;
  if (configured && fs.existsSync(configured)) return configured;
  for (const candidate of ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

async function openBrowser() {
  const browserURL = process.env.MEWA_UI_BROWSER_URL || "http://127.0.0.1:9223";
  try {
    return { browser: await puppeteer.connect({ browserURL }), owned: false };
  } catch (connectError) {
    if (process.env.MEWA_UI_BROWSER_URL) {
      throw new Error(`Unable to connect to Puppeteer at ${browserURL}: ${connectError.message}`, { cause: connectError });
    }
    const executablePath = chromiumPath();
    assert(executablePath, `Chromium is unavailable. Set MEWA_UI_CHROMIUM_PATH or MEWA_UI_BROWSER_URL. (${connectError.message})`);
    const browser = await puppeteer.launch({
      args: ["--disable-dev-shm-usage", "--no-sandbox", "--disable-setuid-sandbox"],
      executablePath,
      headless: true
    });
    return { browser, owned: true };
  }
}

function snapshotAssets(page) {
  return page.evaluate(() => ({
    stylesheets: [...document.querySelectorAll('link[rel="stylesheet"]')].map((node) => ({
      path: new URL(node.href, location.href).pathname,
      origin: new URL(node.href, location.href).origin
    })),
    scripts: [...document.scripts]
      .map((node) => node.src ? new URL(node.src, location.href) : null)
      .filter(Boolean)
      .map((url) => ({ path: url.pathname, origin: url.origin }))
  }));
}

function assertCurrentAssets(assets, pageName, { requireAllComponentCss = true } = {}) {
  const expectedFoundation = [assetPath("src/base.css"), assetPath("src/tokens.css")];
  assert.equal(assets.stylesheets[0]?.path, expectedFoundation[0], `${pageName}: base.css must load first`);
  assert.equal(assets.stylesheets[1]?.path, expectedFoundation[1], `${pageName}: tokens.css must follow base.css`);
  assert(assets.stylesheets.length >= expectedFoundation.length, `${pageName}: foundation styles are incomplete`);
  assert(assets.stylesheets.every(({ origin }) => origin === new URL(activeBaseUrl).origin), `${pageName}: stylesheets must be served by the current origin`);
  assert(assets.scripts.every(({ origin }) => origin === new URL(activeBaseUrl).origin), `${pageName}: scripts must be served by the current origin`);

  if (requireAllComponentCss) {
    for (const component of components) {
      const expected = assetPath(component.files.css);
      assert(assets.stylesheets.some(({ path: stylesheet }) => stylesheet === expected), `${pageName}: missing ${component.files.css}`);
    }
  }
}

async function assertLayoutAndFocus(page, pageName) {
  const result = await page.evaluate(() => {
    const visible = (node) => {
      if (node.hidden || node.closest("[hidden], [inert]")) return false;
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && node.getClientRects().length > 0;
    };
    const focusable = [...document.querySelectorAll("a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex='-1'])")]
      .filter((node) => visible(node) && !node.matches(":disabled, [aria-disabled='true']"));
    return {
      body: Boolean(document.body),
      main: Boolean(document.querySelector("main")),
      overflow: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0) - document.documentElement.clientWidth,
      visibleContent: [...document.querySelectorAll("main h1, main h2, main h3, main p, main button, main a, main input, main select, main textarea, main fieldset, main table")]
        .filter(visible).length,
      focusable: focusable.length
    };
  });

  assert(result.body && result.main && result.visibleContent > 0, `${pageName}: visible document content is missing`);
  assert(result.focusable > 0, `${pageName}: no visible focusable content is present`);
  assert(result.overflow <= 1, `${pageName}: horizontal overflow is ${result.overflow}px`);

  await page.evaluate(() => {
    document.activeElement?.blur();
    window.scrollTo({ top: 0, behavior: "auto" });
  });
  let focusVisible = false;
  for (let index = 0; index < Math.min(40, result.focusable + 5) && !focusVisible; index += 1) {
    await page.keyboard.press("Tab");
    focusVisible = await page.evaluate(() => {
      const active = document.activeElement;
      return Boolean(active && active !== document.body && active.matches(":focus-visible") && active.getClientRects().length > 0);
    });
  }
  assert(focusVisible, `${pageName}: keyboard focus is not visibly exposed`);
  await page.evaluate(() => document.activeElement?.blur());
}

const failures = [];
let activePageName = "browser setup";
let page;

function recordFailure(message) {
  failures.push(`${activePageName}: ${message}`);
}

async function observePage(targetPage) {
  targetPage.on("request", (request) => {
    let requestUrl;
    try {
      requestUrl = new URL(request.url());
    } catch {
      request.continue().catch(() => {});
      return;
    }
    if (requestUrl.origin === "https://esm.sh" && requestUrl.pathname === "/shiki@3.0.0") {
      request.respond({
        status: 200,
        contentType: "application/javascript; charset=utf-8",
        headers: {
          "access-control-allow-origin": "*",
          "cache-control": "public, max-age=60"
        },
        body: "export async function codeToHtml() { return '<pre><code></code></pre>'; }"
      }).catch(() => {});
      return;
    }
    if (request.resourceType() === "image" && requestUrl.origin !== new URL(activeBaseUrl).origin) {
      request.respond({
        status: 204,
        headers: { "cache-control": "public, max-age=60" },
        body: ""
      }).catch(() => {});
      return;
    }
    request.continue().catch(() => {});
  });
  targetPage.on("console", (message) => {
    if (message.type() === "error") recordFailure(`console error: ${message.text()}`);
  });
  targetPage.on("pageerror", (error) => recordFailure(`page error: ${error.message}`));
  targetPage.on("requestfailed", (request) => {
    if (request.failure()?.errorText !== "net::ERR_ABORTED") {
      recordFailure(`request failed: ${request.url()} ${request.failure()?.errorText || "failed"}`);
    }
  });
  targetPage.on("response", (response) => {
    if (response.status() >= 400) recordFailure(`HTTP ${response.status()}: ${response.url()}`);
  });
  await targetPage.setRequestInterception(true);
}

async function loadPage(base, route, viewport, screenshotName, options = {}) {
  activePageName = `${route} ${viewport.name}`;
  await page.setViewport(viewport);
  const failureStart = failures.length;
  let response;
  try {
    response = await page.goto(routeUrl(route), { waitUntil: "networkidle2" });
  } catch (error) {
    recordFailure(`navigation failed: ${error.message}`);
    return;
  }
  assert(response && response.status() < 400, `${route}: server returned ${response?.status()}`);
  await page.evaluate(() => document.fonts?.ready);
  await wait(100);

  if (screenshotDir && screenshotName) {
    await page.screenshot({
      fullPage: true,
      path: path.join(screenshotDir, `${screenshotName}-${viewport.name}.png`)
    });
  }

  assertCurrentAssets(await snapshotAssets(page), `${route} ${viewport.name}`, options);
  await assertLayoutAndFocus(page, `${route} ${viewport.name}`);
  if (failures.length > failureStart) throw new Error(failures.slice(failureStart).join("\n"));
}

async function hasSelector(selector) {
  return Boolean(await page.$(selector));
}

async function runTargetedInteractions(base) {
  const desktop = viewports[0];

  await loadPage(base, "/docs/typography.html", desktop);
  if (await hasSelector('a.nav-link[href="button.html"]')) {
    await page.click('a.nav-link[href="button.html"]');
    await page.waitForFunction(() => document.querySelector("main h1")?.textContent.trim() === "Button", { timeout: 5000 });
    assert.equal(await page.title(), "Button — mewa_ui");
    assertCurrentAssets(await snapshotAssets(page), "docs router button");
  }

  await loadPage(base, "/docs/dialog.html", desktop, "interaction-dialog");
  if (await hasSelector('[data-dialog-trigger="demo-dialog"]') && await hasSelector("#demo-dialog")) {
    await page.click('[data-dialog-trigger="demo-dialog"]');
    await page.waitForFunction(() => document.querySelector("#demo-dialog")?.open === true, { timeout: 5000 });
    assert.equal(await page.$eval("#demo-dialog", (dialog) => dialog.matches(":modal")), true, "dialog must use the native modal top layer");
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.querySelector("#demo-dialog")?.open === false, { timeout: 5000 });
    assert.equal(await page.$eval('[data-dialog-trigger="demo-dialog"]', (trigger) => document.activeElement === trigger), true, "dialog restores focus to its trigger");
  }

  await loadPage(base, "/docs/accordion.html", desktop, "interaction-accordion");
  const singleAccordion = ".accordion[data-type=single]";
  if (await hasSelector(singleAccordion)) {
    const summaryCount = await page.$$eval(`${singleAccordion} summary`, (summaries) => summaries.length);
    if (summaryCount >= 2) {
      await page.click(`${singleAccordion} details:nth-of-type(2) > summary`);
      await page.waitForFunction((selector) => document.querySelectorAll(`${selector} details[open]`).length === 1, { timeout: 5000 }, singleAccordion);
    }
  }

  await loadPage(base, "/docs/date-range-picker.html", desktop, "interaction-date-range");
  if (await hasSelector("[data-range-start]") && await hasSelector("[data-range-end]") && await hasSelector("[data-range-error]")) {
    await page.$eval("[data-range-start]", (input) => {
      input.value = "2026-08-21";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.$eval("[data-range-end]", (input) => {
      input.value = "2026-08-10";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.waitForFunction(() => document.querySelector(".date-range-picker[data-range-order-invalid]"), { timeout: 5000 });
    assert.equal(await page.$eval("[data-range-error]", (node) => node.hidden), false, "invalid date ranges announce their error");
  }

  await loadPage(base, "/docs/data-table.html", desktop, "interaction-data-table");
  if (await hasSelector("#projects-filter") && await hasSelector("[data-table-clear]")) {
    await page.type("#projects-filter", "Atlas");
    await page.waitForFunction(() => document.querySelector("[data-table-status]")?.textContent.includes("1 project"), { timeout: 5000 });
    assert.equal(await page.$$eval("#projects-table tbody tr", (rows) => rows.filter((row) => !row.hidden).length), 1);
    await page.click("[data-table-clear]");
    assert.equal(await page.$eval("#projects-filter", (input) => input.value), "");
  }

  await loadPage(base, "/docs/message-scroller.html", desktop, "interaction-message-scroller");
  if (await hasSelector("#discussion-input") && await hasSelector(".message-scroller-composer button[type=submit]")) {
    await page.type("#discussion-input", "Ready for review.");
    await page.click(".message-scroller-composer button[type=submit]");
    assert.equal(await page.$eval(".message-scroller-messages li:last-child .message-scroller-message-body", (node) => node.textContent), "Ready for review.");
  }

  await loadPage(base, "/docs/sidebar.html", desktop, "interaction-sidebar");
  const sidebar = ".preview .app-sidebar";
  if (await hasSelector(`${sidebar} .sidebar-trigger`)) {
    await page.click(`${sidebar} .sidebar-trigger`);
    await page.waitForFunction((selector) => document.querySelector(selector)?.dataset.state === "collapsed", { timeout: 5000 }, sidebar);
    assert.equal(await page.$eval(`${sidebar} .sidebar-trigger`, (button) => button.getAttribute("aria-expanded")), "false");
  }
}

async function runQuestionnaireChecks(base) {
  const questionnaire = components.find((component) => component.slug === "questionnaire");
  if (!questionnaire) return;

  await loadPage(base, `/${questionnaire.docs}`, viewports[0], "interaction-questionnaire");
  if (await hasSelector("[data-questionnaire-next]") && await hasSelector('input[name="goal"]')) {
    await page.click('input[name="goal"]');
    await page.click("[data-questionnaire-next]");
    await page.waitForFunction(() => document.querySelectorAll("[data-questionnaire-step]")[1]?.hidden === false, { timeout: 5000 });
  }

  const source = fs.readFileSync(path.join(root, questionnaire.docs), "utf8");
  const supportsNoJavaScript = source.includes("data-questionnaire-step") && /type=["']submit["']/.test(source);
  if (!supportsNoJavaScript) return;

  const javascriptPage = page;
  const noJsPage = await browser.newPage();
  page = noJsPage;
  try {
    noJsPage.setDefaultNavigationTimeout(30000);
    await observePage(noJsPage);
    await noJsPage.setJavaScriptEnabled(false);
    await loadPage(base, `/${questionnaire.docs}`, viewports[0], "no-js-questionnaire");
    const fallback = await noJsPage.evaluate(() => ({
      steps: [...document.querySelectorAll("[data-questionnaire-step]")].every((node) => !node.hidden),
      submit: Boolean(document.querySelector('button[type="submit"], input[type="submit"]'))
    }));
    assert.equal(fallback.steps, true, "questionnaire exposes every field without JavaScript");
    assert.equal(fallback.submit, true, "questionnaire keeps a native submit path without JavaScript");
  } finally {
    await noJsPage.close().catch(() => {});
    page = javascriptPage;
  }
}

const serverInfo = shouldStartServer ? await startLocalServer() : null;
activeBaseUrl = serverInfo?.baseUrl || baseUrl;
if (screenshotDir) fs.mkdirSync(screenshotDir, { recursive: true });

let browser;
let ownedBrowser = false;

try {
  ({ browser, owned: ownedBrowser } = await openBrowser());
  page = await browser.newPage();
  page.setDefaultNavigationTimeout(30000);
  await observePage(page);

  const base = serverInfo?.baseUrl || baseUrl;
  for (const component of components) {
    const route = `/${component.docs}`;
    for (const viewport of viewports) await loadPage(base, route, viewport);
  }

  await runTargetedInteractions(base);
  await runQuestionnaireChecks(base);

  if (failures.length) throw new Error(failures.join("\n"));
  console.log(`browser smoke passed for ${components.length} registry docs pages and both layouts at desktop and mobile`);
} finally {
  if (page) await page.close().catch(() => {});
  if (browser) {
    if (ownedBrowser) await browser.close().catch(() => {});
    else browser.disconnect();
  }
  await closeServer(serverInfo?.server);
}
