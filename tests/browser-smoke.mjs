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
const expectedBrokenImageUrl = "https://invalid-url-that-will-fail.example/photo.jpg";
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
  const configuredExecutablePath = process.env.MEWA_UI_CHROMIUM_PATH;
  if (configuredExecutablePath) {
    assert(fs.existsSync(configuredExecutablePath), `Configured Chromium is unavailable: ${configuredExecutablePath}`);
    const browser = await puppeteer.launch({
      args: ["--disable-dev-shm-usage", "--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: configuredExecutablePath,
      headless: true
    });
    return { browser, owned: true };
  }

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
  targetPage.on("console", (message) => {
    if (message.type() !== "error") return;
    const expectedBrokenImage = activePageName.startsWith("/docs/image.html")
      && message.location().url === expectedBrokenImageUrl
      && message.text().startsWith("Failed to load resource:");
    if (!expectedBrokenImage) recordFailure(`console error: ${message.text()}`);
  });
  targetPage.on("pageerror", (error) => recordFailure(`page error: ${error.message}`));
  targetPage.on("requestfailed", (request) => {
    let requestUrl;
    try {
      requestUrl = new URL(request.url());
    } catch {
      requestUrl = null;
    }
    const expectedBrokenImage = activePageName.startsWith("/docs/image.html")
      && request.resourceType() === "image"
      && requestUrl?.href === expectedBrokenImageUrl;
    if (expectedBrokenImage) return;
    if (request.failure()?.errorText !== "net::ERR_ABORTED") {
      recordFailure(`request failed: ${request.url()} ${request.failure()?.errorText || "failed"}`);
    }
  });
  targetPage.on("response", (response) => {
    const responseUrl = new URL(response.url());
    if (
      response.request().resourceType() === "image"
      && ["http:", "https:"].includes(responseUrl.protocol)
      && responseUrl.origin !== new URL(activeBaseUrl).origin
    ) {
      recordFailure(`remote image loaded: ${response.url()}`);
    }
    if (response.status() >= 400) recordFailure(`HTTP ${response.status()}: ${response.url()}`);
  });
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
  await page.focus(".docs-skip-link");
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "main-content", "docs skip link should focus the stable main target");
  assert.equal(await page.$eval("#main-content", (main) => main.getClientRects().length > 0), true, "docs skip target should remain visible");

  await loadPage(base, "/docs/typography.html", viewports[1]);
  const closedMobileNav = await page.$eval("#site-nav-dialog", (dialog) => {
    const visible = (node) => {
      const style = getComputedStyle(node);
      return !node.hidden && style.display !== "none" && style.visibility !== "hidden" && node.getClientRects().length > 0;
    };
    return {
      open: dialog.open,
      modal: dialog.matches(":modal"),
      visibleControls: [...dialog.querySelectorAll("a[href], button, input")].filter(visible).length
    };
  });
  assert.equal(closedMobileNav.open, false, "mobile docs navigation starts closed");
  assert.equal(closedMobileNav.modal, false, "closed mobile docs navigation is not modal");
  assert.equal(closedMobileNav.visibleControls, 0, "closed mobile navigation controls are not tabbable");
  assert.deepEqual(await page.$eval("#sidebar-toggle", (toggle) => ({
    type: toggle.type,
    controls: toggle.getAttribute("aria-controls"),
    expanded: toggle.getAttribute("aria-expanded"),
    popup: toggle.getAttribute("aria-haspopup")
  })), { type: "button", controls: "site-nav-dialog", expanded: "false", popup: "dialog" });

  await page.click("#sidebar-toggle");
  await page.waitForFunction(() => document.querySelector("#site-nav-dialog")?.matches(":modal"), { timeout: 5000 });
  assert.equal(await page.$eval("#sidebar-toggle", (toggle) => toggle.getAttribute("aria-expanded")), "true");
  assert.equal(await page.$eval("#site-nav-dialog", (dialog) => dialog.contains(document.activeElement)), true, "opening mobile navigation should move focus inside the dialog");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector("#site-nav-dialog")?.open === false, { timeout: 5000 });
  assert.equal(await page.$eval("#sidebar-toggle", (toggle) => document.activeElement === toggle), true, "mobile navigation Escape restores trigger focus");

  await page.keyboard.down("Control");
  await page.keyboard.press("k");
  await page.keyboard.up("Control");
  await page.waitForFunction(() => document.querySelector("#site-nav-dialog")?.matches(":modal"), { timeout: 5000 });
  assert.equal(await page.evaluate(() => document.activeElement?.matches("#site-nav-dialog .nav-filter-input")), true, "Cmd/Ctrl+K opens mobile navigation before focusing its filter");
  const navBounds = await page.$eval("#site-nav-dialog", (dialog) => {
    const { top, right, bottom } = dialog.getBoundingClientRect();
    return { top, right, bottom };
  });
  assert(navBounds.right < viewports[1].width, "mobile navigation should leave a backdrop target outside the panel");
  await page.mouse.click(
    navBounds.right + ((viewports[1].width - navBounds.right) / 2),
    navBounds.top + ((navBounds.bottom - navBounds.top) / 2)
  );
  await page.waitForFunction(() => document.querySelector("#site-nav-dialog")?.open === false, { timeout: 5000 });
  assert.equal(await page.$eval("#sidebar-toggle", (toggle) => document.activeElement === toggle), true, "mobile navigation backdrop closes and restores trigger focus");

  await loadPage(base, "/docs/typography.html", desktop);
  for (const destination of ["data-table.html", "date-range-picker.html", "resizable.html"]) {
    await page.click(`a.nav-link[href="${destination}"]`);
    const title = destination.replace(/\.html$/, "").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
    await page.waitForFunction((expected) => document.querySelector("main h1")?.textContent.trim() === expected, { timeout: 5000 }, title);
    assert.equal(await page.evaluate(() => document.activeElement?.tagName), "H1", `docs router ${destination}: focus should move to the new page heading`);
    assertCurrentAssets(await snapshotAssets(page), `docs router ${destination}`);

    if (destination === "data-table.html") {
      await page.type("#projects-filter", "Atlas");
      await page.waitForFunction(() => document.querySelector("[data-table-status]")?.textContent.includes("1 project"), { timeout: 5000 });
      assert.equal(await page.$$eval("#projects-table tbody tr", (rows) => rows.filter((row) => !row.hidden).length), 1);
      assert.equal(await page.$eval("[data-table-range]", (node) => node.textContent), "Showing 1–1 of 1 projects");
    } else if (destination === "date-range-picker.html") {
      await page.$eval("#demo-range-start", (input) => {
        input.value = "2026-08-21";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await page.$eval("#demo-range-end", (input) => {
        input.value = "2026-08-10";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await page.waitForFunction(() => document.querySelector("#demo-range-start")?.closest(".date-range-picker")?.matches("[data-range-order-invalid]"), { timeout: 5000 });
      await page.$eval("#demo-range-end", (input) => {
        input.value = "2026-08-22";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await page.waitForFunction(() => !document.querySelector("#demo-range-start")?.closest(".date-range-picker")?.matches("[data-range-order-invalid]"), { timeout: 5000 });
      assert.equal(await page.$eval("#demo-range-error", (node) => node.hidden), true, "corrected date ranges hide their error");
      assert.equal(await page.$eval("#demo-range-end", (input) => input.getAttribute("aria-errormessage")), null, "inactive date errors are not announced");
    } else {
      await page.focus(".resizable-handle");
      const before = await page.$eval(".resizable-handle", (handle) => handle.getAttribute("aria-valuenow"));
      await page.keyboard.press("ArrowRight");
      assert.notEqual(await page.$eval(".resizable-handle", (handle) => handle.getAttribute("aria-valuenow")), before);
    }
  }

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

  await loadPage(base, "/docs/image.html", desktop);
  await page.$eval("figure[data-preview] img", (img) => {
    img.src = new URL("../src/icons/image.svg", location.href).href;
    img.removeAttribute("data-error");
  });
  await page.click("figure[data-preview]");
  await page.waitForFunction(() => document.querySelector("dialog.image-lightbox")?.open === true, { timeout: 5000 });
  assert.equal(await page.$$eval("dialog.image-lightbox button", (buttons) => buttons.every((button) => button.getAttribute("type") === "button")), true, "generated lightbox controls should be explicit non-submit buttons");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector("dialog.image-lightbox")?.open === false, { timeout: 5000 });
  await page.click('a.nav-link[href="typography.html"]');
  await page.waitForFunction(() => document.querySelector("main h1")?.textContent.trim() === "Typography", { timeout: 5000 });
  await page.click('a.nav-link[href="image.html"]');
  await page.waitForFunction(() => document.querySelector("main h1")?.textContent.trim() === "Image", { timeout: 5000 });
  await page.$eval("figure[data-preview] img", (img) => {
    img.src = new URL("../src/icons/image.svg", location.href).href;
    img.removeAttribute("data-error");
  });
  await page.click("figure[data-preview]");
  await page.waitForFunction(() => document.querySelector("dialog.image-lightbox")?.open === true, { timeout: 5000 });
  assert.equal(await page.$$eval("dialog.image-lightbox button", (buttons) => buttons.every((button) => button.getAttribute("type") === "button")), true, "SPA-created lightbox controls should remain explicit non-submit buttons");
  await page.keyboard.press("Escape");

  await loadPage(base, "/docs/combobox.html", desktop);
  await page.click(".combobox-trigger:not(:disabled)");
  await page.waitForFunction(() => document.activeElement === document.querySelector(".combobox-search-input"), { timeout: 5000 });
  await page.keyboard.press("Escape");

  await loadPage(base, "/docs/dropdown-menu.html", desktop);
  await page.evaluate(() => {
    const outside = document.createElement("button");
    outside.id = "dropdown-outside-focus";
    outside.type = "button";
    outside.textContent = "Outside focus target";
    document.querySelector("main")?.append(outside);
  });
  const outsideControl = "#dropdown-outside-focus";
  const actionTrigger = '[data-dropdown-menu-trigger="demo-dropdown"]';
  const actionMenu = "#demo-dropdown";
  const actionItem = `${actionMenu} [role=menuitem]`;
  const checkTrigger = '[data-dropdown-menu-trigger="demo-dropdown-checks"]';
  const checkMenu = "#demo-dropdown-checks";
  const checkItem = `${checkMenu} [role=menuitemcheckbox]`;

  await page.evaluate(() => {
    const actionTarget = document.querySelectorAll("#demo-dropdown [role=menuitem]")[1];
    const checkTarget = document.querySelector("#demo-dropdown-checks [role=menuitemcheckbox]");
    window.__dropdownActivationCounts = {
      actionClicks: 0,
      actionTriggerClicks: 0,
      checkClicks: 0,
      checkTriggerClicks: 0
    };
    document.querySelector('[data-dropdown-menu-trigger="demo-dropdown"]')?.addEventListener("click", () => {
      window.__dropdownActivationCounts.actionTriggerClicks += 1;
    });
    document.querySelector('[data-dropdown-menu-trigger="demo-dropdown-checks"]')?.addEventListener("click", () => {
      window.__dropdownActivationCounts.checkTriggerClicks += 1;
    });
    actionTarget?.addEventListener("click", () => {
      window.__dropdownActivationCounts.actionClicks += 1;
    });
    checkTarget?.addEventListener("click", () => {
      window.__dropdownActivationCounts.checkClicks += 1;
    });
    const closeFromKeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") event.currentTarget.closest('[role="menu"]')?.hidePopover();
    };
    actionTarget?.addEventListener("keydown", closeFromKeydown);
    checkTarget?.addEventListener("keydown", closeFromKeydown);
  });

  await page.$eval(actionItem, (item) => {
    item.addEventListener("click", () => {
      document.querySelector("#dropdown-outside-focus")?.focus();
    }, { once: true });
  });
  await page.click(actionTrigger);
  await page.waitForFunction(() => document.querySelector("#demo-dropdown")?.matches(":popover-open"), { timeout: 5000 });
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => !document.querySelector("#demo-dropdown")?.matches(":popover-open"), { timeout: 5000 });
  assert.equal(await page.$eval(outsideControl, (control) => document.activeElement === control), true, "keyboard actions that move focus externally must not restore the dropdown trigger");

  for (const key of ["Enter", "Space"]) {
    await page.click(actionTrigger);
    await page.waitForFunction(() => document.querySelector("#demo-dropdown")?.matches(":popover-open"), { timeout: 5000 });
    await page.evaluate(() => document.querySelectorAll("#demo-dropdown [role=menuitem]")[1]?.focus());
    await page.waitForFunction(() => document.activeElement === document.querySelectorAll("#demo-dropdown [role=menuitem]")[1], { timeout: 5000 });
    const before = await page.evaluate(() => ({
      actionClicks: window.__dropdownActivationCounts.actionClicks,
      actionTriggerClicks: window.__dropdownActivationCounts.actionTriggerClicks
    }));
    await page.keyboard.press(key);
    await page.waitForFunction(() => !document.querySelector("#demo-dropdown")?.matches(":popover-open"), { timeout: 5000 });
    const after = await page.evaluate(() => ({
      actionClicks: window.__dropdownActivationCounts.actionClicks,
      actionTriggerClicks: window.__dropdownActivationCounts.actionTriggerClicks
    }));
    assert.equal(after.actionClicks, before.actionClicks + 1, `dropdown action ${key} activates the target exactly once`);
    assert.equal(after.actionTriggerClicks, before.actionTriggerClicks, `dropdown action ${key} does not re-click the trigger`);
    assert.equal(await page.$eval(actionTrigger, (trigger) => document.activeElement === trigger), true, `dropdown action ${key} restores trigger focus`);
  }

  for (const key of ["Enter", "Space"]) {
    await page.click(checkTrigger);
    await page.waitForFunction(() => document.querySelector("#demo-dropdown-checks")?.matches(":popover-open"), { timeout: 5000 });
    const before = await page.evaluate(() => ({
      checked: document.querySelector("#demo-dropdown-checks [role=menuitemcheckbox]")?.getAttribute("aria-checked"),
      checkClicks: window.__dropdownActivationCounts.checkClicks,
      checkTriggerClicks: window.__dropdownActivationCounts.checkTriggerClicks
    }));
    await page.keyboard.press(key);
    await page.waitForFunction(() => !document.querySelector("#demo-dropdown-checks")?.matches(":popover-open"), { timeout: 5000 });
    const after = await page.evaluate(() => ({
      checked: document.querySelector("#demo-dropdown-checks [role=menuitemcheckbox]")?.getAttribute("aria-checked"),
      checkClicks: window.__dropdownActivationCounts.checkClicks,
      checkTriggerClicks: window.__dropdownActivationCounts.checkTriggerClicks
    }));
    assert.notEqual(after.checked, before.checked, `dropdown checkable ${key} toggles the target exactly once`);
    assert.equal(after.checkClicks, before.checkClicks, `dropdown checkable ${key} does not synthesize an extra click`);
    assert.equal(after.checkTriggerClicks, before.checkTriggerClicks, `dropdown checkable ${key} does not re-click the trigger`);
    assert.equal(await page.$eval(checkTrigger, (trigger) => document.activeElement === trigger), true, `dropdown checkable ${key} restores trigger focus`);
  }

  await page.focus(outsideControl);
  const beforeProgrammaticTriggerClicks = await page.evaluate(() => window.__dropdownActivationCounts.checkTriggerClicks);
  await page.$eval(checkTrigger, (trigger) => trigger.click());
  await page.waitForFunction(() => document.querySelector("#demo-dropdown-checks")?.matches(":popover-open"), { timeout: 5000 });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("#demo-dropdown-checks")?.matches(":popover-open"), { timeout: 5000 });
  assert.equal(await page.evaluate(() => window.__dropdownActivationCounts.checkTriggerClicks), beforeProgrammaticTriggerClicks + 1, "programmatic activation clicks the trigger exactly once");
  assert.equal(await page.$eval(checkTrigger, (trigger) => document.activeElement === trigger), true, "programmatic activation from outside followed by Escape restores the trigger");

  await page.click(checkTrigger);
  await page.waitForFunction(() => document.querySelector("#demo-dropdown-checks")?.matches(":popover-open"), { timeout: 5000 });
  const checkedBefore = await page.$eval(checkItem, (item) => item.getAttribute("aria-checked"));
  await page.click(checkItem);
  assert.notEqual(await page.$eval(checkItem, (item) => item.getAttribute("aria-checked")), checkedBefore);
  await page.click(outsideControl);
  await page.waitForFunction(() => !document.querySelector("#demo-dropdown-checks")?.matches(":popover-open"), { timeout: 5000 });
  assert.equal(await page.$eval(outsideControl, (control) => document.activeElement === control), true, "dropdown light-dismiss preserves focus on the outside control");
  await page.click(checkTrigger);
  await page.waitForFunction(() => document.querySelector("#demo-dropdown-checks")?.matches(":popover-open"), { timeout: 5000 });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("#demo-dropdown-checks")?.matches(":popover-open"), { timeout: 5000 });
  assert.equal(await page.$eval('[data-dropdown-menu-trigger="demo-dropdown-checks"]', (trigger) => document.activeElement === trigger), true, "dropdown Escape restores focus to its trigger");

  await loadPage(base, "/docs/toolbar.html", desktop);
  await page.focus(".toolbar .toggle");
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.evaluate(() => document.activeElement === document.querySelectorAll(".toolbar .toggle")[1]), true, "nested toggle groups should move one item per arrow key");

  await loadPage(base, "/docs/command-palette.html", desktop);
  await page.click('[data-command-palette-trigger="demo-cmd"]');
  await page.waitForFunction(() => document.activeElement === document.querySelector(".command-palette-input"), { timeout: 5000 });
  await page.keyboard.press("ArrowDown");
  assert(await page.$eval(".command-palette-input", (input) => Boolean(input.getAttribute("aria-activedescendant"))));
  assert.equal(await page.$eval(".command-palette-item[aria-selected=true]", (item) => item.dataset.highlighted === ""), true);
  await page.keyboard.press("Escape");

  await loadPage(base, "/docs/tree-view.html", desktop);
  assert.equal(await page.$$eval(".preview .tree [role=treeitem]", (items) => items.every((item) => item.matches("li.tree-item"))), true, "treeitem semantics should live on the tree items");
  assert.equal(await page.$$eval(".preview .tree [tabindex='0']", (items) => items.length), 1, "tree view should expose one tab stop");
  await page.focus(".preview .tree-branch-trigger");
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.evaluate(() => document.activeElement?.textContent.includes("components")), true, "tree ArrowRight should enter the first child");
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(() => document.activeElement?.closest("details.tree-branch")?.open === true, { timeout: 5000 });

  await loadPage(base, "/docs/toast.html", desktop);
  await page.evaluate(() => window.toast.show({ title: "Actionable", duration: 100, action: { label: "Undo" } }));
  await page.waitForSelector(".toast", { timeout: 5000 });
  assert.equal(await page.$$eval(".toast button", (buttons) => buttons.every((button) => button.getAttribute("type") === "button")), true, "generated toast controls should be explicit non-submit buttons");
  await page.hover(".toast");
  await wait(180);
  assert(await page.$(".toast"), "hovered toasts should remain visible");
  await page.mouse.move(0, 0);
  await wait(150);
  assert.equal(await page.$(".toast"), null, "toasts should resume dismissal after hover ends");

  await loadPage(base, "/docs/carousel.html", desktop);
  const carouselButtonContract = await page.$eval(".carousel:has(.carousel-dot)", (carousel) => {
    const form = document.createElement("form");
    let submissions = 0;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submissions += 1;
    });
    carousel.before(form);
    form.append(carousel);
    const dot = carousel.querySelector(".carousel-dot");
    dot.click();
    return { attribute: dot.getAttribute("type"), submissions };
  });
  assert.deepEqual(carouselButtonContract, { attribute: "button", submissions: 0 }, "generated carousel dots should not submit an enclosing form");

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
    await page.$eval("#demo-range-form .date-range-picker", (picker) => {
      window.__demoRangeInvalidEvents = 0;
      picker.addEventListener("date-range:invalid", () => { window.__demoRangeInvalidEvents += 1; });
    });
    await page.$eval("#demo-range-start", (input) => {
      input.value = "2026-08-21";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.$eval("#demo-range-end", (input) => {
      input.value = "2026-08-10";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.waitForFunction(() => document.querySelector("#demo-range-start")?.closest(".date-range-picker")?.matches("[data-range-order-invalid]"), { timeout: 5000 });
    assert.equal(await page.$eval("#demo-range-error", (node) => node.hidden), false, "invalid date ranges announce their error");
    assert.equal(await page.evaluate(() => window.__demoRangeInvalidEvents), 1);

    await page.click("#demo-range-form button[type=reset]");
    await page.waitForFunction(() => {
      const start = document.querySelector("#demo-range-start");
      const end = document.querySelector("#demo-range-end");
      return start?.value === "" && end?.value === "" && !document.querySelector("#demo-range-start")?.closest(".date-range-picker")?.matches("[data-range-order-invalid]");
    }, { timeout: 5000 });
    assert.equal(await page.$eval("#demo-range-error", (node) => node.hidden), true, "native reset restores the dormant range state");
    assert.equal(await page.$eval("#demo-range-end", (input) => input.checkValidity()), true, "native reset clears managed custom validity");

    await page.$eval("#demo-range-start", (input) => {
      input.value = "2026-08-21";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.$eval("#demo-range-end", (input) => {
      input.value = "2026-08-10";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.waitForFunction(() => document.querySelector("#demo-range-start")?.closest(".date-range-picker")?.matches("[data-range-order-invalid]"), { timeout: 5000 });
    assert.equal(await page.evaluate(() => window.__demoRangeInvalidEvents), 2, "invalid transitions continue after native reset");
  }

  await loadPage(base, "/docs/data-table.html", desktop, "interaction-data-table");
  if (await hasSelector("#projects-filter") && await hasSelector("[data-table-clear]")) {
    await page.type("#projects-filter", "Atlas");
    await page.waitForFunction(() => document.querySelector("[data-table-status]")?.textContent.includes("1 project"), { timeout: 5000 });
    assert.equal(await page.$$eval("#projects-table tbody tr", (rows) => rows.filter((row) => !row.hidden).length), 1);
    assert.equal(await page.$eval("[data-table-range]", (node) => node.textContent), "Showing 1–1 of 1 projects");
    await page.click("[data-table-clear]");
    assert.equal(await page.$eval("#projects-filter", (input) => input.value), "");
    await page.click("[data-table-page='next']");
    await page.waitForFunction(() => document.querySelector("[data-table-page='2']")?.getAttribute("aria-current") === "page", { timeout: 5000 });
    assert.equal(await page.$eval("[data-table-range]", (node) => node.textContent), "Showing 4–5 of 5 projects");
  }

  await loadPage(base, "/docs/text-field.html", desktop, "interaction-text-field");
  assert.equal(await page.$$eval(".preview .text-field[data-size]", (els) => els.length), 0, "Text Field exposes no size variants");
  assert((await page.$(".preview .text-field-input")) !== null, "Text Field standalone composition renders");

  await loadPage(base, "/docs/date-picker.html", desktop, "interaction-date-picker");
  await page.evaluate(() => {
    window.__datePickerSelections = 0;
    document.querySelector(".date-picker")?.addEventListener("date-picker:select", () => { window.__datePickerSelections += 1; });
  });
  await page.click(".date-picker-day button:not([data-outside])");
  assert.equal(await page.evaluate(() => window.__datePickerSelections), 1, "Date Picker exposes the Kernel-aligned selection event");


  await loadPage(base, "/docs/sidebar.html", desktop, "interaction-sidebar");
  const sidebar = ".preview .app-sidebar";
  if (await hasSelector(`${sidebar} .sidebar-trigger`)) {
    await page.click(`${sidebar} .sidebar-trigger`);
    await page.waitForFunction((selector) => document.querySelector(selector)?.dataset.state === "collapsed", { timeout: 5000 }, sidebar);
    assert.equal(await page.$eval(`${sidebar} .sidebar-trigger`, (button) => button.getAttribute("aria-expanded")), "false");
  }
}


async function runNoJavaScriptChecks(base) {
  try {
    await page.setJavaScriptEnabled(false);

    await loadPage(base, "/docs/data-table.html", viewports[0], "no-js-data-table");
    const dataTableFallback = await page.evaluate(() => ({
      filterForm: document.querySelector(".preview .data-table-filter-group")?.tagName === "FORM",
      clearType: document.querySelector(".preview [data-table-clear]")?.getAttribute("type"),
      sortLinks: [...document.querySelectorAll(".preview .data-table-sort")].every((node) => node.tagName === "A" && node.hasAttribute("href")),
      paginationLinks: document.querySelectorAll(".preview .data-table-pagination-link[href]").length
    }));
    assert.equal(dataTableFallback.filterForm, true, "Data Table keeps a native filter form without JavaScript");
    assert.equal(dataTableFallback.clearType, "reset", "Data Table keeps a native reset action without JavaScript");
    assert.equal(dataTableFallback.sortLinks, true, "Data Table keeps native sort destinations without JavaScript");
    assert(dataTableFallback.paginationLinks > 0, "Data Table keeps native pagination links without JavaScript");

    await loadPage(base, "/docs/date-range-picker.html", viewports[0], "no-js-date-range");
    const dateRangeFallback = await page.evaluate(() => ({
      startDescription: document.querySelector("#demo-range-start")?.getAttribute("aria-describedby"),
      endDescription: document.querySelector("#demo-range-end")?.getAttribute("aria-describedby"),
      defaultErrorHidden: document.querySelector("#demo-range-error")?.hidden,
      serverErrorMessage: document.querySelector("#demo-invalid-end")?.getAttribute("aria-errormessage"),
      serverInvalid: document.querySelector("#demo-invalid-end")?.getAttribute("aria-invalid")
    }));
    assert.equal(dateRangeFallback.startDescription, "demo-range-help", "Date Range keeps shared help as the dormant description");
    assert.equal(dateRangeFallback.endDescription, "demo-range-help", "Date Range does not announce a hidden error on the fallback path");
    assert.equal(dateRangeFallback.defaultErrorHidden, true, "Date Range keeps its dormant error hidden without JavaScript");
    assert.equal(dateRangeFallback.serverErrorMessage, "demo-invalid-error", "Date Range keeps an active server error association");
    assert.equal(dateRangeFallback.serverInvalid, "true", "Date Range keeps server invalid state without JavaScript");

    await loadPage(base, "/docs/resizable.html", viewports[0], "no-js-resizable");
    const resizableFallback = await page.$eval(".preview .resizable-handle", (handle) => ({
      tagName: handle.tagName,
      role: handle.getAttribute("role"),
      tabIndex: handle.getAttribute("tabindex"),
      cursor: getComputedStyle(handle).cursor,
      touchAction: getComputedStyle(handle).touchAction,
      userSelect: getComputedStyle(handle).userSelect
    }));
    assert.equal(resizableFallback.tagName, "DIV", "Resizable keeps a static divider without JavaScript");
    assert.equal(resizableFallback.role, "separator", "Resizable keeps separator semantics without JavaScript");
    assert.equal(resizableFallback.tabIndex, null, "Resizable does not expose a dead focus target without JavaScript");
    assert.equal(resizableFallback.cursor, "auto", "Resizable keeps a neutral cursor without JavaScript");
    assert.equal(resizableFallback.touchAction, "auto", "Resizable keeps native touch behavior without JavaScript");
    assert.equal(resizableFallback.userSelect, "auto", "Resizable keeps native selection behavior without JavaScript");
  } finally {
    await page.setJavaScriptEnabled(true);
  }
}

async function runLayoutChecks(base) {
  const layouts = [
    { route: "/layouts/vertical-navbar.html", name: "vertical", selector: ".app-sidebar" },
    { route: "/layouts/horizontal-navbar.html", name: "horizontal", selector: ".layout-top-nav" }
  ];

  for (const layout of layouts) {
    for (const viewport of viewports) {
      await loadPage(base, layout.route, viewport, `layout-${layout.name}`, { requireAllComponentCss: false });
      assert(await hasSelector(layout.selector), `${layout.name}: canonical shell is missing`);
      if (layout.name === "vertical") {
        assert.equal(await page.$eval(".app-sidebar", (sidebar) => sidebar.dataset.state), "expanded");
        if (viewport.name === "mobile") {
          await page.click(".layout-header-mobile-trigger");
          await page.waitForFunction(() => document.querySelector(".sidebar-mobile")?.open === true, { timeout: 5000 });
          await page.click(".sidebar-mobile-close");
          await page.waitForFunction(() => document.querySelector(".sidebar-mobile")?.open === false, { timeout: 5000 });
        } else {
          await page.click(".app-sidebar .sidebar-trigger");
          await page.waitForFunction(() => document.querySelector(".app-sidebar")?.dataset.state === "collapsed", { timeout: 5000 });
          assert.equal(await page.$eval(".app-sidebar .sidebar-trigger", (button) => button.getAttribute("aria-expanded")), "false");
        }
      } else {
        assert.equal(await page.$$eval(".layout-top-nav a", (links) => links.length >= 4), true, "horizontal shell must expose native route links");
        assert.equal(await page.$eval(".layout-top-nav", (nav) => nav.querySelector('[role="tab"], [role="tablist"]') === null), true, "route navigation must not use tab roles");
        await page.click("[data-layout-theme-toggle]");
        await page.waitForFunction(() => document.documentElement.classList.contains("dark"), { timeout: 5000 });
        await page.click("[data-layout-theme-toggle]");
        await page.waitForFunction(() => !document.documentElement.classList.contains("dark"), { timeout: 5000 });
      }
    }
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
  await runTargetedInteractions(base);
  
  await runNoJavaScriptChecks(base);
  await runLayoutChecks(base);

  for (const component of components) {
    const route = `/${component.docs}`;
    for (const viewport of viewports) await loadPage(base, route, viewport);
  }

  if (failures.length) throw new Error(failures.join("\n"));
  console.log(`browser smoke passed for ${components.length} registry docs pages, both layouts, SPA enhancements, and no-JavaScript fallbacks`);
} finally {
  if (page) await page.close().catch(() => {});
  if (browser) {
    if (ownedBrowser) await browser.close().catch(() => {});
    else browser.disconnect();
  }
  await closeServer(serverInfo?.server);
}
