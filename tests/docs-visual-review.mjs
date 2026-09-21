// Rendered acceptance and bounded contact sheets, not golden-image tests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { launchOptions } from './browser-support.mjs';
import registry from '../registry.json' with { type: 'json' };

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'screenshots/review');
fs.mkdirSync(out, { recursive: true });
const server = Bun.serve({
  hostname: '127.0.0.1',
  port: 0,
  fetch(req) {
    const file = path.resolve(root, `.${new URL(req.url).pathname}`);
    if (!file.startsWith(`${root}/`)) return new Response(null, { status: 403 });
    return new Response(Bun.file(file));
  }
});
const browser = await puppeteer.launch(launchOptions());
const page = await browser.newPage();
const cdp = await page.createCDPSession();
const failures = [],
  sheets = [],
  captures = [],
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const base = `http://127.0.0.1:${server.port}`;
const scenarios = [
  { name: 'light-desktop', width: 1440 },
  { name: 'dark-desktop', width: 1440, dark: true },
  { name: 'light-320', width: 320 },
  { name: 'dark-320', width: 320, dark: true },
  { name: 'increased-contrast', width: 1280, media: [{ name: 'prefers-contrast', value: 'more' }] },
  { name: 'forced-colors', width: 1280, media: [{ name: 'forced-colors', value: 'active' }] },
  { name: 'zoom-200', width: 1280, zoom: 2 }
];
try {
  for (const scenario of scenarios) {
    await page.setViewport({ width: scenario.width, height: 1000 });
    await cdp.send('Emulation.setEmulatedMedia', { features: scenario.media || [] });
    await page.goto(`${base}/docs/preview.html#preview-button`);
    await page.waitForSelector('body.enhanced');
    await page.evaluate(({ dark, zoom }) => {
      document.documentElement.classList.toggle('dark', !!dark);
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
      document.documentElement.style.zoom = String(zoom || 1);
    }, scenario);
    await page.evaluate(() => document.fonts.ready);
    for (const component of registry.components) {
      await page.evaluate((slug) => {
        location.hash = `preview-${slug}`;
      }, component.slug);
      await page.waitForFunction(
        (slug) =>
          document.querySelector(`.component-playground[data-component="${slug}"]`)?.hidden ===
          false,
        {},
        component.slug
      );
      const info = await page.evaluate(() => {
        const section = document.querySelector('.component-playground:not([hidden])');
        const canvas = section.querySelector('.playground-demo,.presentation-surface');
        return {
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          empty: !canvas?.children.length
        };
      });
      if (info.overflow || info.empty)
        failures.push({ scenario: scenario.name, slug: component.slug, ...info });
    }
    console.log(`PASS rendered preview sweep: ${scenario.name}, 80 components`);
  }
  // Measure real computed control boundaries and focus indicators in both themes.
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  });
  for (const dark of [false, true]) {
    await page.goto(`${base}/docs/preview.html#preview-text-field`);
    await page.waitForSelector('body.enhanced');
    const ratios = await page.evaluate((dark) => {
      document.documentElement.classList.toggle('dark', dark);
      const el = document.querySelector('.component-playground:not([hidden]) .text-field-input');
      const luminance = (rgb) =>
        rgb
          .map((c) => c / 255)
          .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
          .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
      const rgb = (color) =>
        color
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number);
      const contrast = (a, b) => {
        const x = luminance(a),
          y = luminance(b);
        return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
      };
      const probe = document.createElement('span');
      document.body.append(probe);
      const background = rgb(getComputedStyle(el).backgroundColor);
      const results = {};
      for (const token of [
        '--border-secondary',
        '--border-interactive-default',
        '--border-focus-area',
        '--border-invalid-area'
      ]) {
        probe.style.color = `var(${token})`;
        results[token] = contrast(rgb(getComputedStyle(probe).color), background);
      }
      probe.remove();
      return results;
    }, dark);
    for (const [token, ratio] of Object.entries(ratios))
      assert(ratio >= 3, `${dark ? 'dark' : 'light'} ${token}: ${ratio}`);
    console.log(`PASS ${dark ? 'dark' : 'light'} control/focus contrast`, ratios);
  }
  for (const dark of [false, true]) {
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(`${base}/docs/figma.html`);
    await page.evaluate((dark) => {
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    }, dark);
    await page.evaluate(() => document.fonts.ready);
    for (const component of registry.components) {
      const el = await page.$(`[data-component="${component.slug}"] .specimen`);
      await el.scrollIntoView();
      const rect = await el.boundingBox();
      assert(rect?.width > 0 && rect?.height > 0, `${component.slug}: visible matrix specimen`);
      const scroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
      const clip = {
        x: rect.x + scroll.x,
        y: rect.y + scroll.y,
        width: Math.ceil(rect.width),
        height: Math.ceil(Math.min(rect.height, 360))
      };
      const image = await page.screenshot({
        clip,
        encoding: 'base64',
        captureBeyondViewport: true
      });
      captures.push({ ...component, dark, image });
    }
    for (const [category, items] of Map.groupBy(
      captures.filter((c) => c.dark === dark),
      (c) => c.category
    )) {
      const sheet = await browser.newPage();
      await sheet.setViewport({ width: 1280, height: 1000 });
      await sheet.setContent(
        `<html><head><style>body{margin:20px;font:14px monospace;background:${dark ? '#151515' : '#fff'};color:${dark ? '#fff' : '#111'}}main{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0;min-width:0;border:1px solid #888}figcaption{padding:8px}img{display:block;max-width:100%;max-height:360px;margin:auto}</style></head><body><h1>${category} · ${dark ? 'dark' : 'light'}</h1><p>Actual rendered default specimens; images above 360px are cropped. Variant/state coverage is checked separately.</p><main>${items.map((c) => `<figure><figcaption>${c.name}</figcaption><img src="data:image/png;base64,${c.image}"></figure>`).join('')}</main></body></html>`
      );
      const filename = `${category.toLowerCase().replaceAll(' ', '-')}-${dark ? 'dark' : 'light'}.png`;
      await sheet.screenshot({ path: path.join(out, filename), fullPage: true });
      sheets.push(filename);
      await sheet.close();
    }
  }
  assert.deepEqual(failures, [], 'preview reflow/content failures');
  assert.deepEqual(errors, [], 'documentation page errors');
  fs.writeFileSync(
    path.join(out, 'coverage.json'),
    JSON.stringify(
      {
        browser: await browser.version(),
        scenarios,
        components: registry.components.map((c) => c.slug),
        contactSheets: sheets,
        errors,
        failures,
        zoomMethod: 'CSS zoom: 2 (layout reflow), not browser UI zoom'
      },
      null,
      2
    )
  );
  console.log(
    `PASS 560 preview conditions and 160 matrix captures; ${sheets.length} contact sheets in screenshots/review`
  );
} finally {
  await browser.close();
  server.stop(true);
}
