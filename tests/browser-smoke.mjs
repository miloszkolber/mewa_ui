import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(fs.readFileSync(path.join(root, "registry.json"), "utf8"));
const host = "127.0.0.1";
const requestedPort = Number.parseInt(process.env.MEWA_UI_PORT || "0", 10);
const configuredBaseUrl = process.env.MEWA_UI_BASE_URL?.replace(/\/+$/, "");
const screenshotDir = process.env.MEWA_UI_SCREENSHOT_DIR;

const coreViewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 }
];

const matrixViewports = [
  { name: "320", width: 320, height: 800 },
  { name: "600", width: 600, height: 900 },
  { name: "768", width: 768, height: 900 },
  { name: "960", width: 960, height: 900 },
  { name: "1440", width: 1440, height: 900 }
];

const representativeSlugs = [
  "app-shell",
  "sidebar",
  "form",
  "file-upload",
  "input-otp",
  "data-table",
  "combobox",
  "dialog",
  "context-menu",
  "message-scroller",
  "tabs",
  "resizable"
];

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2"
};

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
  const allowed = ["library", "docs", "dist", "tests/fixtures", "registry.json"];
  if (!allowed.some((name) => relative === name || relative.startsWith(`${name}${path.sep}`))) return null;
  return target;
}

function startServer() {
  const server = http.createServer((request, response) => {
    if (!["GET", "HEAD"].includes(request.method || "")) {
      response.writeHead(405);
      response.end();
      return;
    }

    if ((request.url || "").split("?", 1)[0] === "/favicon.ico") {
      response.writeHead(204);
      response.end();
      return;
    }

    const target = safeTarget(request.url);
    if (!target || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": mimeTypes[path.extname(target)] || "application/octet-stream"
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    response.end(fs.readFileSync(target));
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(Number.isFinite(requestedPort) ? requestedPort : 0, host, () => {
      server.removeListener("error", reject);
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://${host}:${address.port}`
      });
    });
  });
}

function executablePath() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate));
}

async function inspect(page, baseUrl, slug, viewport, theme = "light") {
  await page.setViewport({ width: viewport.width, height: viewport.height });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);

  const errors = [];
  const onConsole = (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  };
  const onPageError = (error) => errors.push(`page: ${error.message}`);

  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  const url = `${baseUrl}/docs/${slug}.html`;
  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  assert(response?.ok(), `${slug} ${viewport.name}: HTTP ${response?.status()}`);

  await new Promise((resolve) => setTimeout(resolve, 40));

  const result = await page.evaluate(() => {
    const html = document.documentElement;
    const main = document.querySelector("main");
    const buttons = Array.from(document.querySelectorAll("button"));
    return {
      lang: html.lang,
      main: Boolean(main),
      overflow: html.scrollWidth - html.clientWidth,
      untypedButtons: buttons.filter((button) => !["button", "submit", "reset"].includes(button.type)).length
    };
  });

  assert(result.lang, `${slug} ${viewport.name}: document language is missing`);
  assert(result.main, `${slug} ${viewport.name}: main landmark is missing`);
  assert(result.overflow <= 2, `${slug} ${viewport.name}: page overflows horizontally by ${result.overflow}px`);
  assert.equal(result.untypedButtons, 0, `${slug} ${viewport.name}: rendered button without explicit type`);
  assert.deepEqual(errors, [], `${slug} ${viewport.name}: ${errors.join(" | ")}`);

  await page.keyboard.press("Tab");
  const active = await page.evaluate(() => document.activeElement?.tagName || "");
  assert(active && active !== "BODY", `${slug} ${viewport.name}: first Tab does not reach an interactive target`);

  if (screenshotDir && representativeSlugs.includes(slug)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({
      path: path.join(screenshotDir, `${slug}-${viewport.name}-${theme}.png`),
      fullPage: true
    });
  }

  page.off("console", onConsole);
  page.off("pageerror", onPageError);
}

async function inspectPackage(page, baseUrl) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));

  const response = await page.goto(`${baseUrl}/tests/fixtures/package-smoke.html`, { waitUntil: "networkidle0" });
  assert(response?.ok(), `package smoke: HTTP ${response?.status()}`);
  await page.click('[data-dialog-trigger="package-dialog"]');
  assert.equal(await page.$eval("#package-dialog", (dialog) => dialog.open), true, "packaged auto enhancer did not open the dialog");
  await page.keyboard.press("Escape");
  assert.equal(await page.$eval("#package-dialog", (dialog) => dialog.open), false, "packaged dialog did not close with Escape");

  await page.waitForFunction(() => document.documentElement.dataset.controllerSmoke && document.documentElement.dataset.observerSmoke);
  assert.equal(
    await page.evaluate(() => document.documentElement.dataset.controllerSmoke),
    "passed",
    "packaged dependency-aware controller did not enhance its region"
  );
  assert.equal(
    await page.evaluate(() => document.documentElement.dataset.observerSmoke),
    "passed",
    "shared observer did not enhance inserted package markup"
  );
  assert.deepEqual(errors, [], `package smoke: ${errors.join(" | ")}`);
}

async function inspectSveltePackage(page, baseUrl) {
  const errors = [];
  const onConsole = (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  };
  const onPageError = (error) => errors.push(`page: ${error.message}`);

  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  const response = await page.goto(`${baseUrl}/dist/svelte-smoke/index.html`, { waitUntil: "networkidle0" });
  assert(response?.ok(), `Svelte package smoke: HTTP ${response?.status()}`);
  await page.waitForSelector("[data-svelte-smoke]");

  await page.click("[data-counter]");
  assert.equal(
    await page.$eval("[data-counter]", (button) => button.textContent.trim()),
    "Count: 1",
    "the compiled Svelte state did not update"
  );

  await page.click("[data-mewa-toggle]");
  assert.equal(
    await page.$eval("[data-mewa-toggle]", (button) => button.getAttribute("aria-pressed")),
    "true",
    "the Svelte attachment did not initialize Mewa behavior"
  );

  assert.deepEqual(errors, [], `Svelte package smoke: ${errors.join(" | ")}`);
  page.off("console", onConsole);
  page.off("pageerror", onPageError);
}

let server;
let baseUrl = configuredBaseUrl;

try {
  if (!baseUrl) {
    const started = await startServer();
    server = started.server;
    baseUrl = started.baseUrl;
  }

  const chrome = executablePath();
  assert(chrome, "Chromium or Chrome is required. Set PUPPETEER_EXECUTABLE_PATH when it is not on a standard path.");

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"]
  });

  try {
    const page = await browser.newPage();

    for (const component of registry.components) {
      for (const viewport of coreViewports) {
        await inspect(page, baseUrl, component.slug, viewport);
      }
    }

    for (const slug of representativeSlugs) {
      for (const viewport of matrixViewports) {
        await inspect(page, baseUrl, slug, viewport);
      }
    }

    for (const slug of representativeSlugs) {
      await inspect(page, baseUrl, slug, coreViewports[1], "dark");
    }

    await inspectPackage(page, baseUrl);
    await inspectSveltePackage(page, baseUrl);

    console.log(`PASS browser smoke for ${registry.components.length} component pages`);
    console.log(`PASS responsive matrix for ${representativeSlugs.length} representative pages`);
    console.log("PASS generated GitHub package auto, observer, and controller entries in a browser");
    console.log("PASS Svelte 5 attachment and Bun-compiled fixture in a browser");
  } finally {
    await browser.close();
  }
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
}
