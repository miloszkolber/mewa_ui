import { launchOptions, browserName } from './browser-support.mjs';
import { inspectDocumentationSurfaces } from './docs-browser-support.mjs';
import { inspectVisualCorrections } from './visual-corrections.browser.mjs';
import { inspectSkipLinkPaint } from './skip-link-paint.browser.mjs';
import assert from 'node:assert/strict';
import { checkReactiveAttachments } from './svelte-browser-support.mjs';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { compileModel, operate } from '../scripts/docs-model.mjs';
import { propertyOperations } from '../docs/model-operations.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'registry.json'), 'utf8'));
const host = '127.0.0.1';
const requestedPort = Number.parseInt(process.env.MEWA_UI_PORT || '0', 10);
const configuredBaseUrl = process.env.MEWA_UI_BASE_URL?.replace(/\/+$/, '');
const screenshotDir = process.env.MEWA_UI_SCREENSHOT_DIR;
const figmaScreenshotPath = process.env.MEWA_UI_FIGMA_SCREENSHOT;

const coreViewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 }
];

const matrixViewports = [
  { name: '320', width: 320, height: 800 },
  { name: '600', width: 600, height: 900 },
  { name: '768', width: 768, height: 900 },
  { name: '960', width: 960, height: 900 },
  { name: '1440', width: 1440, height: 900 }
];

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

function safeTarget(requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl || '/', 'http://mewa.local').pathname);
  } catch {
    return null;
  }

  if (pathname === '/') pathname = '/docs/preview.html';
  const target = path.resolve(root, `.${pathname}`);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) return null;

  const relative = path.relative(root, target);
  const allowed = ['library', 'docs', 'dist', 'tests/fixtures', 'registry.json'];
  if (!allowed.some((name) => relative === name || relative.startsWith(`${name}${path.sep}`)))
    return null;
  return target;
}

function startServer() {
  const server = http.createServer((request, response) => {
    if (!['GET', 'HEAD'].includes(request.method || '')) {
      response.writeHead(405);
      response.end();
      return;
    }

    if ((request.url || '').split('?', 1)[0] === '/favicon.ico') {
      response.writeHead(204);
      response.end();
      return;
    }

    const target = safeTarget(request.url);
    if (!target || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'cache-control': 'no-store',
      'content-type': mimeTypes[path.extname(target)] || 'application/octet-stream'
    });

    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    response.end(fs.readFileSync(target));
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(Number.isFinite(requestedPort) ? requestedPort : 0, host, () => {
      server.removeListener('error', reject);
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://${host}:${address.port}`
      });
    });
  });
}

async function inspect(page, baseUrl, slug, viewport, theme = 'light') {
  await page.setViewport({ width: viewport.width, height: viewport.height });
  if (browserName === 'chrome')
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);

  const errors = [];
  const onConsole = (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  };
  const onPageError = (error) => errors.push(`page: ${error.message}`);

  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  const url = `${baseUrl}/docs/preview.html`;
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  assert(response?.ok(), `${slug} ${viewport.name}: HTTP ${response?.status()}`);

  await page.waitForFunction(() => document.readyState === 'complete');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    (dark) => document.documentElement.classList.toggle('dark', dark),
    theme === 'dark'
  );

  // Theme switches transition colors. Measure the settled palette, not an intermediate frame.
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => {}))
    );
  });

  const result = await page.evaluate(() => {
    const html = document.documentElement;
    const main = document.querySelector('main');
    const buttons = Array.from(document.querySelectorAll('button'));
    return {
      lang: html.lang,
      main: Boolean(main),
      overflow: html.scrollWidth - html.clientWidth,
      untypedButtons: buttons.filter(
        (button) => !['button', 'submit', 'reset'].includes(button.getAttribute('type'))
      ).length
    };
  });

  assert(result.lang, `${slug} ${viewport.name}: document language is missing`);
  assert(result.main, `${slug} ${viewport.name}: main landmark is missing`);
  assert(
    result.overflow <= 2,
    `${slug} ${viewport.name}: page overflows horizontally by ${result.overflow}px`
  );
  assert.equal(
    result.untypedButtons,
    0,
    `${slug} ${viewport.name}: rendered button without explicit type`
  );
  assert.deepEqual(errors, [], `${slug} ${viewport.name}: ${errors.join(' | ')}`);

  await page.keyboard.press('Tab');
  const active = await page.evaluate(() => document.activeElement?.tagName || '');
  assert(
    active && active !== 'BODY',
    `${slug} ${viewport.name}: first Tab does not reach an interactive target`
  );

  if (screenshotDir && slug === 'preview') {
    fs.mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({
      path: path.join(screenshotDir, `${slug}-${viewport.name}-${theme}.png`),
      fullPage: true
    });
  }

  page.off('console', onConsole);
  page.off('pageerror', onPageError);
}

async function inspectPackage(page, baseUrl) {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));

  const response = await page.goto(`${baseUrl}/tests/fixtures/package-smoke.html`, {
    waitUntil: 'networkidle0'
  });
  assert(response?.ok(), `package smoke: HTTP ${response?.status()}`);
  await page.click('[data-dialog-trigger="package-dialog"]');
  assert.equal(
    await page.$eval('#package-dialog', (dialog) => dialog.open),
    true,
    'packaged auto enhancer did not open the dialog'
  );
  await page.setViewport({ width: 320, height: 844 });
  await page.$eval('#package-dialog .dialog-footer', (footer) => {
    footer.replaceChildren(
      ...['Cancel', 'Reset', 'Save changes'].map((label) => {
        const button = document.createElement('button');
        button.className = 'btn';
        button.type = 'button';
        button.textContent = label;
        return button;
      })
    );
  });
  await page.waitForFunction(() =>
    document
      .querySelector('#package-dialog')
      .getAnimations()
      .every((animation) => animation.playState === 'finished')
  );
  const clippedActions = await page.$eval('#package-dialog', (dialog) => {
    const bounds = dialog.getBoundingClientRect();
    return [...dialog.querySelectorAll('.dialog-footer button')]
      .filter((button) => {
        const rect = button.getBoundingClientRect();
        return rect.left < bounds.left || rect.right > bounds.right;
      })
      .map((button) => button.textContent);
  });
  assert.deepEqual(clippedActions, [], 'Dialog footer actions must fit at 320px');
  await page.keyboard.press('Escape');
  assert.equal(
    await page.$eval('#package-dialog', (dialog) => dialog.open),
    false,
    'packaged dialog did not close with Escape'
  );

  await page.waitForFunction(
    () =>
      document.documentElement.dataset.controllerSmoke &&
      document.documentElement.dataset.observerSmoke
  );
  assert.equal(
    await page.evaluate(() => document.documentElement.dataset.controllerSmoke),
    'passed',
    'packaged dependency-aware controller did not enhance its region'
  );
  assert.equal(
    await page.evaluate(() => document.documentElement.dataset.observerSmoke),
    'passed',
    'shared observer did not enhance inserted package markup'
  );
  assert.deepEqual(errors, [], `package smoke: ${errors.join(' | ')}`);
}

async function inspectSveltePackage(page, baseUrl) {
  const errors = [];
  const onConsole = (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  };
  const onPageError = (error) => errors.push(`page: ${error.message}`);

  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  const response = await page.goto(`${baseUrl}/dist/svelte-smoke/index.html`, {
    waitUntil: 'networkidle0'
  });
  assert(response?.ok(), `Svelte package smoke: HTTP ${response?.status()}`);
  await page.waitForSelector('[data-svelte-smoke]');
  await page.waitForFunction(() =>
    document.querySelector('[data-mewa-toggle]')?.hasAttribute('data-mewa-toggle-init')
  );
  await checkReactiveAttachments(page);
  await page.evaluate(() => {
    window.detachedToggle = document.querySelector('[data-mewa-toggle]');
  });
  await page.click('[data-mount-toggle]');
  await page.waitForFunction(() => !document.querySelector('[data-mewa-toggle]'));
  assert.equal(
    await page.evaluate(() => {
      window.detachedToggle.click();
      return window.detachedToggle.getAttribute('aria-pressed');
    }),
    'false',
    'unmounted Svelte elements retain no active toggle handler'
  );
  await page.click('[data-mount-toggle]');
  await page.waitForFunction(() =>
    document.querySelector('[data-mewa-toggle]')?.hasAttribute('data-mewa-toggle-init')
  );

  await page.click('[data-counter]');
  assert.equal(
    await page.$eval('[data-counter]', (button) => button.textContent.trim()),
    'Count: 1',
    'the compiled Svelte state did not update'
  );

  await page.click('[data-mewa-toggle]');
  assert.equal(
    await page.$eval('[data-mewa-toggle]', (button) => button.getAttribute('aria-pressed')),
    'true',
    'the Svelte attachment did not initialize Mewa behavior'
  );

  assert.deepEqual(errors, [], `Svelte package smoke: ${errors.join(' | ')}`);
  page.off('console', onConsole);
  page.off('pageerror', onPageError);
}

async function inspectDocumentedEventReadback(page, baseUrl) {
  const active = '.component-playground:not([hidden])';
  await page.goto(`${baseUrl}/docs/preview.html#preview-date-picker`, { waitUntil: 'load' });
  await page.waitForSelector(`${active} .date-picker-day`);
  // Deliberately omit click/native change: those generic listeners would mask
  // a stale custom-event name at the documentation readback boundary.
  await page.$eval(`${active} .date-picker`, (root) => {
    root.querySelector('.date-picker-heading').textContent = 'Calendar event readback';
    root.dispatchEvent(
      new CustomEvent('date-picker:select', { bubbles: true, detail: { date: new Date() } })
    );
  });
  await page.waitForFunction(() =>
    document
      .querySelector('.component-playground:not([hidden]) .playground-code')
      .textContent.includes('Calendar event readback')
  );
  await page.goto(`${baseUrl}/docs/preview.html#preview-date-range-picker`, {
    waitUntil: 'load'
  });
  await page.waitForSelector(`${active} .date-range-input`);
  await page.$eval(`${active} .date-range-picker`, (root) => {
    root.querySelector('.date-range-input').value = '2026-09-20';
    root.dispatchEvent(new CustomEvent('date-range:change', { bubbles: true }));
  });
  await page.waitForFunction(
    () =>
      document.querySelector('.component-playground:not([hidden]) [name="value:0"]').value ===
      '2026-09-20'
  );
  assert(
    await page.$eval(`${active} .playground-code`, (el) =>
      el.textContent.includes('value="2026-09-20"')
    ),
    'Documented range event updates both the inspector and exported current value'
  );
  console.log('PASS documented calendar custom-event readback without generic event fallbacks');
}

async function inspectUnavailableRoutes(page, baseUrl) {
  await page.setViewport({ width: 1200, height: 900 });
  for (const [slug, rootClass, linkClass] of [
    ['nav', 'nav', 'nav-item-link'],
    ['navigation-menu', 'nav-menu', 'nav-menu-link'],
    ['sidebar', 'app-sidebar', 'sidebar-link']
  ]) {
    const destination = `#restored-route-${slug}`;
    const html = `<nav class="${rootClass}"><a class="${linkClass}" href="${destination}" tabindex="0">Route</a><span id="${destination.slice(1)}">Destination</span></nav>`;
    const model = await compileModel({
      slug,
      name: slug,
      samples: [{ html }, { html }],
      specimens: [{ html }]
    });
    const scope = model.scopes.find((s) => s.type === 'nav-link');
    const property = scope.props.find((p) => p.name === 'disabled');
    const disabled = await operate(model.html, propertyOperations(scope, property, ''));
    // This native exported snippet has no playground link interceptor. Keeping
    // tabindex also tests an already-focused route's native Enter default.
    await page.goto('about:blank');
    await page.setContent(disabled);
    await page.focus(`.${linkClass}`);
    await page.keyboard.press('Enter');
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
    assert.equal(await page.evaluate(() => location.hash), '', `${slug}: disabled native route`);
    const enabled = await operate(disabled, propertyOperations(scope, property, null));
    await page.setContent(enabled);
    await page.focus(`.${linkClass}`);
    await page.keyboard.press('Enter');
    await page.waitForFunction((hash) => location.hash === hash, {}, destination);

    await page.goto(`${baseUrl}/docs/preview.html#preview-${slug}`, { waitUntil: 'load' });
    const active = '.component-playground:not([hidden])';
    const selector = `${active} .playground-demo .${linkClass}`;
    await page.waitForSelector(selector);
    const route = await page.$(selector);
    try {
      const href = await route.evaluate((el) => {
        el.textContent = 'Edited route';
        el.focus();
        return el.getAttribute('href');
      });
      for (const disabled of [true, false]) {
        await page.$eval(
          `${active} [name="prop:part-nav-link:0:disabled"]`,
          (el, disabled) => {
            el.checked = disabled;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          },
          disabled
        );
        assert.deepEqual(
          await route.evaluate(
            (el, selector) => [
              el.isConnected && el === document.querySelector(selector),
              el === document.activeElement,
              el.textContent,
              el.getAttribute('href')
            ],
            selector
          ),
          [true, true, 'Edited route', disabled ? null : href],
          `${slug}: availability preserves mounted route, focus and edits`
        );
      }
      assert.equal(
        await route.evaluate((el) => el.hasAttribute('data-demo-route-tabindex')),
        false,
        'Temporary native focus ownership is cleared after re-enabling'
      );
      assert(
        await route.evaluate((el) => el.tabIndex >= 0),
        'An enabled native route returns to the normal keyboard path'
      );
    } finally {
      await route.dispose();
    }
  }
  console.log(
    'PASS unavailable route export blocks native Enter; re-enable restores navigation, mounted nodes, focus and edits'
  );
}

let server;
let baseUrl = configuredBaseUrl;

try {
  if (!baseUrl) {
    const started = await startServer();
    server = started.server;
    baseUrl = started.baseUrl;
  }

  const browser = await puppeteer.launch(launchOptions());

  try {
    const page = await browser.newPage();

    for (const viewport of coreViewports) await inspect(page, baseUrl, 'preview', viewport);

    for (const viewport of matrixViewports) await inspect(page, baseUrl, 'preview', viewport);

    await inspect(page, baseUrl, 'preview', coreViewports[1], 'dark');
    await inspect(page, baseUrl, 'preview', coreViewports[0], 'dark');

    await inspectDocumentedEventReadback(page, baseUrl);
    await inspectUnavailableRoutes(page, baseUrl);
    await inspectDocumentationSurfaces(page, baseUrl, figmaScreenshotPath);
    await inspectVisualCorrections(page, baseUrl);
    await inspectSkipLinkPaint(page, baseUrl);

    await inspectPackage(page, baseUrl);
    await inspectSveltePackage(page, baseUrl);

    console.log(`PASS browser smoke for the ${registry.components.length}-component preview`);
    console.log('PASS live playground, viewport Toast behavior, and static Figma matrix');
    console.log(`PASS responsive matrix for the preview`);
    console.log(
      'PASS generated GitHub package auto, observer, and controller entries in a browser'
    );
    console.log('PASS Svelte 5 attachment and Bun-compiled fixture in a browser');
  } finally {
    await browser.close();
  }
} finally {
  if (server) {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
}
