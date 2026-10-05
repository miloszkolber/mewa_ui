import assert from 'node:assert/strict';

const keys = ['mewa-ui-theme', 'mewa-docs-theme', 'mewa-theme'];
const header = '[data-docs-theme-toggle]';
const sample = '.component-playground:not([hidden]) .playground-demo [data-theme-toggle]';
const opposite = (theme) => (theme === 'dark' ? 'light' : 'dark');
const preferred = (page) =>
  page.evaluate(() => (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

// Wait for fonts, native actions, observers and finite color transitions, not a timer.
async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const frames = () =>
      new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await frames();
    await Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => {}))
    );
    await frames();
  });
}

const storage = (page) =>
  page.evaluate(
    (keys) => Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)])),
    keys
  );

async function seed(page, values = {}) {
  await page.evaluate(
    ({ keys, values }) => {
      for (const key of keys) {
        if (values[key] == null) localStorage.removeItem(key);
        else localStorage.setItem(key, values[key]);
      }
    },
    { keys, values }
  );
}

async function readState(page) {
  await settle(page);
  return page.evaluate(() => {
    const root = document.documentElement;
    const button = document.querySelector('[data-docs-theme-toggle]');
    const rect = button?.getBoundingClientRect();
    let common;
    try {
      common = localStorage.getItem('mewa-ui-theme');
    } catch {
      common = 'controlled-read-failure';
    }
    return {
      url: location.href,
      dark: root.classList.contains('dark'),
      theme: root.dataset.theme,
      colorScheme: root.style.colorScheme,
      computedColorScheme: getComputedStyle(root).colorScheme,
      background: getComputedStyle(document.body).backgroundColor,
      preferred: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      common,
      button: {
        pressed: button?.getAttribute('aria-pressed'),
        label: button?.getAttribute('aria-label'),
        theme: button?.dataset.theme,
        visible: Boolean(rect?.width && rect?.height)
      }
    };
  });
}

function assertTheme(state, expected, name) {
  assert.equal(state.dark, expected === 'dark', `${name}: root theme`);
  assert.equal(state.theme, expected, `${name}: root data-theme`);
  assert.equal(state.colorScheme, expected, `${name}: inline color-scheme`);
  assert.equal(state.computedColorScheme, expected, `${name}: rendered color-scheme`);
  assert.equal(state.button.pressed, String(expected === 'dark'), `${name}: pressed state`);
  assert.equal(state.button.label, 'Dark theme', `${name}: stable toggle name`);
  assert.equal(state.button.theme, expected, `${name}: button data-theme`);
  assert.equal(state.button.visible, true, `${name}: theme picker is rendered`);
  // The independent canvas contract is light/dark, not a copy of the token resolver.
  const channels = state.background.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  assert(channels && (!channels[4] || Number(channels[4]) === 1), `${name}: opaque canvas`);
  const brightness = channels.slice(1, 4).reduce((sum, value) => sum + Number(value), 0) / 3;
  assert(
    expected === 'dark' ? brightness < 64 : brightness > 192,
    `${name}: ${expected} rendered canvas, got ${state.background}`
  );
}

// Observe ownership without synthesizing the activation or modifying theme state.
async function activate(page, selector, input = 'pointer') {
  const observation = await page.evaluateHandle((selector) => {
    const root = document.documentElement;
    const target = document.querySelector(selector);
    const result = { oldStates: [], clicks: [] };
    const observer = new MutationObserver((records) => {
      for (const record of records)
        result.oldStates.push((record.oldValue || '').split(/\s+/).includes('dark'));
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
      attributeOldValue: true
    });
    const clicked = (event) => result.clicks.push(event.isTrusted);
    target.addEventListener('click', clicked);
    return { result, observer, target, clicked, root };
  }, selector);
  try {
    if (input === 'keyboard') {
      await page.focus(selector);
      await page.keyboard.press(' ');
    } else await page.click(selector);
    await settle(page);
    const result = await observation.evaluate(({ result, root }) => {
      const states = [...result.oldStates, root.classList.contains('dark')];
      return {
        clicks: result.clicks,
        changes: states.slice(1).filter((state, index) => state !== states[index]).length
      };
    });
    assert.deepEqual(result.clicks, [true], `${selector}: one trusted ${input} activation`);
    assert.equal(result.changes, 1, `${selector}: one theme change, not duplicate controllers`);
  } finally {
    await observation.evaluate(({ observer, target, clicked }) => {
      observer.disconnect();
      target.removeEventListener('click', clicked);
    });
    await observation.dispose();
  }
}

async function assertMatrixInert(page) {
  assert.deepEqual(
    await page.evaluate(() => ({
      toolbar: document.querySelectorAll('.matrix-toolbar [data-docs-theme-toggle]').length,
      hasSpecimens: document.querySelectorAll('.matrix-specimens').length > 0,
      inert: [...document.querySelectorAll('.matrix-specimens')].every((el) => el.inert),
      enhanced: document.querySelectorAll(
        '.matrix-specimens :is([data-init],[data-mewa-app-shell-init],[data-mewa-toggle-init])'
      ).length,
      toast: typeof window.toast
    })),
    {
      toolbar: 1,
      hasSpecimens: true,
      inert: true,
      enhanced: 0,
      toast: 'undefined'
    },
    'the matrix theme controller leaves specimens inert and unenhanced'
  );
}

async function assertSample(page, theme) {
  assert.deepEqual(
    await page.$eval(sample, (button) => ({
      theme: button.dataset.theme,
      label: button.getAttribute('aria-label'),
      pressed: button.getAttribute('aria-pressed')
    })),
    { theme, label: `Switch to ${opposite(theme)} theme`, pressed: null },
    'ordinary App Shell command keeps its action name, not invented pressed semantics'
  );
}

/**
 * Reuse the caller's browser. capture(name, page, state) is an optional async artifact hook.
 * Only theme storage keys change; restore them in finally. Preference emulation uses an
 * owned sibling page, so the supplied page's media settings are never overwritten.
 */
export async function inspectDocsTheme(page, baseUrl, options = {}) {
  const base = baseUrl.replace(/\/+$/, '');
  const originalViewport = page.viewport();
  const originalUrl = page.url();
  const errors = [];
  const results = [];
  const scripts = new Set();
  const onError = (error) => errors.push(`page: ${error.message}`);
  const onConsole = (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  };
  const listen = (target) => {
    target.on('pageerror', onError);
    target.on('console', onConsole);
  };
  const unlisten = (target) => {
    target.off('pageerror', onError);
    target.off('console', onConsole);
  };
  const inspect = async (target, name, expected, common) => {
    const state = await readState(target);
    results.push({ name, ...state });
    await options.capture?.(name, target, state);
    assertTheme(state, expected, name);
    if (common !== undefined) assert.equal(state.common, common, `${name}: common storage key`);
    return state;
  };
  const go = async (target, view, slug = 'button') => {
    // goto of an unchanged URL (or only a changed hash) does not run bootstrap.
    await target.goto('about:blank');
    const response = await target.goto(`${base}/docs/${view}.html#preview-${slug}`, {
      waitUntil: 'load'
    });
    assert(response?.ok(), `${view}: documentation response succeeds`);
    await target.waitForSelector(header, { visible: true });
    if (view === 'preview') await target.waitForSelector('body.enhanced');
    await settle(target);
  };
  let saved;
  let mediaPage;
  listen(page);
  try {
    // Plain resource establishes the origin without booting a docs controller.
    await page.goto(`${base}/docs/icons.js`, { waitUntil: 'load' });
    saved = await storage(page);
    await page.setViewport({ width: 1440, height: 1000 });
    await seed(page);
    await go(page, 'preview');
    const system = await preferred(page);
    const manual = opposite(system);
    await page.click(header);
    let state = await readState(page);
    assert.equal(state.dark, manual === 'dark', 'preview theme picker changes the canvas');
    await options.capture?.('preview-manual-before-reload', page, state);
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('body.enhanced');
    state = await readState(page);
    results.push({ name: 'preview-manual-reload', ...state });
    await options.capture?.('preview-manual-reload', page, state);
    // Keep this FIRST: old docs must fail for lost manual state, not a new label/key hook.
    assert.equal(
      state.dark,
      manual === 'dark',
      `manual ${manual} theme survives preview reload with ${system} system preference`
    );
    assertTheme(state, manual, 'preview manual reload');
    assert.equal(state.common, manual, 'manual picker stores the shared mewa-ui-theme choice');

    await go(page, 'figma');
    await inspect(page, 'preview to matrix', manual, manual);
    await assertMatrixInert(page);
    await activate(page, header, 'keyboard');
    await inspect(page, 'matrix keyboard choice', system, system);
    await page.reload({ waitUntil: 'load' });
    await inspect(page, 'matrix manual reload', system, system);
    await go(page, 'preview', 'app-shell');
    await page.waitForSelector(sample, { visible: true });
    await inspect(page, 'matrix to preview', system, system);
    await assertSample(page, system);
    await activate(page, sample);
    await inspect(page, 'live App Shell synchronizes header', manual, manual);
    await assertSample(page, manual);
    await activate(page, header, 'keyboard');
    await inspect(page, 'header synchronizes live App Shell', system, system);
    await assertSample(page, system);
    await go(page, 'figma');
    await inspect(page, 'preview to matrix inverse', system, system);
    await activate(page, header);
    await inspect(page, 'matrix pointer choice', manual, manual);
    await assertMatrixInert(page);
    await go(page, 'preview');
    await inspect(page, 'matrix to preview inverse', manual, manual);

    // Expected precedence is the product contract, independent of bootstrap internals.
    const cases = [
      [
        'valid common wins conflict',
        { 'mewa-ui-theme': 'dark', 'mewa-docs-theme': 'light', 'mewa-theme': 'light' },
        'dark',
        'dark'
      ],
      ['old docs choice migrates', { 'mewa-docs-theme': 'dark' }, 'dark', 'dark'],
      ['old library choice remains supported', { 'mewa-theme': 'dark' }, 'dark', null],
      [
        'invalid common permits docs migration',
        { 'mewa-ui-theme': 'invalid', 'mewa-docs-theme': 'light', 'mewa-theme': 'dark' },
        'light',
        'light'
      ],
      [
        'invalid common and docs permit library fallback',
        { 'mewa-ui-theme': 'invalid', 'mewa-docs-theme': 'invalid', 'mewa-theme': 'dark' },
        'dark',
        'invalid'
      ],
      [
        'all invalid use system without persisting it',
        { 'mewa-ui-theme': 'invalid', 'mewa-docs-theme': 'invalid', 'mewa-theme': 'invalid' },
        system,
        'invalid'
      ],
      ['empty storage uses system without persisting it', {}, system, null]
    ];
    for (const [name, values, expected, common] of cases) {
      for (const view of ['preview', 'figma']) {
        await seed(page, values);
        await go(page, view);
        await inspect(page, `${view}: ${name}`, expected, common);
      }
    }

    // These are deliberate Storage API failure fixtures, not platform restriction claims.
    const failures = [
      ['blocked reads use system', 'read', { 'mewa-ui-theme': manual }, system],
      [
        'blocked writes preserve existing common choice',
        'write',
        { 'mewa-ui-theme': manual, 'mewa-docs-theme': system },
        manual
      ],
      [
        'failed docs migration permits library fallback',
        'write',
        { 'mewa-docs-theme': system, 'mewa-theme': manual },
        manual
      ],
      [
        'failed docs migration without fallback uses system',
        'write',
        { 'mewa-docs-theme': manual },
        system
      ]
    ];
    for (const [name, failure, values, expected] of failures) {
      for (const view of ['preview', 'figma']) {
        await seed(page, values);
        const script = await page.evaluateOnNewDocument((failure) => {
          const method = failure === 'read' ? 'getItem' : 'setItem';
          Storage.prototype[method] = function () {
            throw new DOMException('Controlled theme regression fixture', 'SecurityError');
          };
        }, failure);
        scripts.add(script.identifier);
        try {
          await go(page, view);
          await inspect(page, `${view}: ${name}`, expected);
          await activate(page, header);
          await inspect(
            page,
            `${view}: blocked ${failure} still changes in-page state`,
            opposite(expected)
          );
          if (failure === 'write') {
            assert.equal((await storage(page))['mewa-ui-theme'], values['mewa-ui-theme'] ?? null);
          }
        } finally {
          await page.removeScriptToEvaluateOnNewDocument(script.identifier);
          scripts.delete(script.identifier);
          // Removing an init script does not unpatch this document's Storage prototype.
          await page.goto(`${base}/docs/icons.js`, { waitUntil: 'load' });
        }
      }
    }

    // Chrome can supply both media preferences. Firefox's CDP media method is not
    // supported: use its observed native preference and report it, never fake matchMedia.
    const firefox = (await page.browser().version()).toLowerCase().includes('firefox');
    mediaPage = await page.browserContext().newPage();
    listen(mediaPage);
    await mediaPage.setViewport({ width: 1440, height: 1000 });
    await mediaPage.goto(`${base}/docs/icons.js`, { waitUntil: 'load' });
    const preferences = firefox ? [await preferred(mediaPage)] : ['light', 'dark'];
    for (const preference of preferences) {
      if (!firefox)
        await mediaPage.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: preference }]);
      assert.equal(
        await preferred(mediaPage),
        preference,
        'browser supplies the stated preference'
      );
      for (const view of ['preview', 'figma']) {
        await seed(mediaPage);
        await go(mediaPage, view);
        await inspect(
          mediaPage,
          `${view}: ${preference} ${firefox ? 'native' : 'media'} preference`,
          preference,
          null
        );
        await activate(mediaPage, header, view === 'preview' ? 'pointer' : 'keyboard');
        await inspect(
          mediaPage,
          `${view}: manual inverse of ${preference} preference`,
          opposite(preference),
          opposite(preference)
        );
        await mediaPage.reload({ waitUntil: 'load' });
        if (view === 'preview') await mediaPage.waitForSelector('body.enhanced');
        await inspect(
          mediaPage,
          `${view}: manual inverse reload with ${preference} preference`,
          opposite(preference),
          opposite(preference)
        );
      }
    }
    if (!firefox) {
      await seed(mediaPage);
      await mediaPage.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
      await go(mediaPage, 'preview', 'app-shell');
      await mediaPage.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
      await mediaPage.waitForFunction(() => document.documentElement.classList.contains('dark'));
      await inspect(mediaPage, 'live system preference remains unpersisted', 'dark', null);
      await assertSample(mediaPage, 'dark');
      await activate(mediaPage, header);
      await mediaPage.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
      await settle(mediaPage);
      await mediaPage.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
      await inspect(mediaPage, 'manual choice stops following system changes', 'light', 'light');
      await assertSample(mediaPage, 'light');
    }
    unlisten(mediaPage);
    await mediaPage.close();
    mediaPage = null;
    await page.bringToFront();

    // Independent controllers also share ownership when consumers initialize them
    // in either order. An isolated same-origin document avoids the preview bundle.
    await page.goto(`${base}/docs/icons.js`, { waitUntil: 'load' });
    for (const order of [
      ['app-shell', 'toggle'],
      ['toggle', 'app-shell']
    ]) {
      await seed(page, { 'mewa-ui-theme': 'light' });
      const iframe = await page.evaluateHandle((base) => {
        const frame = document.createElement('iframe');
        frame.width = '1000';
        frame.height = '300';
        frame.title = 'Theme controller ownership fixture';
        frame.srcdoc = `<link rel="stylesheet" href="${base}/library/src/base.css"><link rel="stylesheet" href="${base}/library/src/tokens.css"><button id="pressed" class="toggle" type="button" data-theme-toggle aria-pressed="false" aria-label="Use dark mode">Dark mode</button><button id="command" class="btn" type="button" data-theme-toggle aria-label="Toggle theme">Theme command</button><button id="ordinary" class="toggle" type="button" aria-pressed="false">Unrelated toggle</button>`;
        // Keep the fixture on-screen; hidden/off-screen frames can suspend rAF.
        document.body.replaceChildren(frame);
        return frame;
      }, base);
      let frame;
      try {
        frame = await iframe.asElement().contentFrame();
        await frame.waitForSelector('#ordinary');
        await frame.evaluate(
          async ({ base, order }) => {
            const controllers = await Promise.all(
              order.map((slug) => import(`${base}/dist/mewa-ui/controllers/${slug}.js`))
            );
            window.themeRegressionControllers = controllers;
            for (const controller of controllers) {
              controller.enhance(document);
              controller.enhance(document);
            }
          },
          { base, order }
        );
        const assertControllers = async (theme) => {
          assert.deepEqual(
            await frame.evaluate(() => ({
              dark: document.documentElement.classList.contains('dark'),
              theme: document.documentElement.dataset.theme,
              colorScheme: document.documentElement.style.colorScheme,
              pressed: document.querySelector('#pressed').getAttribute('aria-pressed'),
              pressedTheme: document.querySelector('#pressed').dataset.theme,
              label: document.querySelector('#pressed').getAttribute('aria-label'),
              command: document.querySelector('#command').getAttribute('aria-label'),
              commandTheme: document.querySelector('#command').dataset.theme,
              common: localStorage.getItem('mewa-ui-theme'),
              ordinary: document.querySelector('#ordinary').getAttribute('aria-pressed')
            })),
            {
              dark: theme === 'dark',
              theme,
              colorScheme: theme,
              pressed: String(theme === 'dark'),
              pressedTheme: theme,
              label: 'Use dark mode',
              command: `Switch to ${opposite(theme)} theme`,
              commandTheme: theme,
              common: theme,
              ordinary: 'false'
            },
            `${order.join(' then ')}: one owner preserves authored toggle and command semantics`
          );
        };
        await assertControllers('light');
        // Frame uses the same trusted keyboard device as the caller's page.
        const frameInput = {
          evaluate: frame.evaluate.bind(frame),
          evaluateHandle: frame.evaluateHandle.bind(frame),
          focus: frame.focus.bind(frame),
          click: frame.click.bind(frame),
          keyboard: page.keyboard
        };
        await activate(frameInput, '#pressed', 'keyboard');
        await assertControllers('dark');
        await activate(frameInput, '#command');
        await assertControllers('light');
        await frame.click('#ordinary');
        await settle(frame);
        assert.equal(
          await frame.$eval('#ordinary', (button) => button.getAttribute('aria-pressed')),
          'true',
          'standalone Toggle still works'
        );
        assert.equal(
          await frame.evaluate(() => document.documentElement.classList.contains('dark')),
          false,
          'unrelated Toggle does not change theme'
        );
        results.push({
          name: `controllers: ${order.join(' then ')}`,
          common: (await storage(page))['mewa-ui-theme']
        });
      } finally {
        if (frame)
          await frame.evaluate(() => {
            for (const controller of window.themeRegressionControllers || [])
              controller.destroy(document);
          });
        await iframe.evaluate((element) => element.remove());
        await iframe.dispose();
      }
    }
    assert.deepEqual(errors, [], 'theme checks produce no page or console errors');
    console.log(
      `PASS docs theme reload, cross-view persistence, precedence, controlled storage failures and controller ownership (${firefox ? `Firefox native ${preferences[0]}` : 'light/dark media preferences'})`
    );
    return results;
  } finally {
    try {
      for (const identifier of scripts) await page.removeScriptToEvaluateOnNewDocument(identifier);
      if (mediaPage) {
        unlisten(mediaPage);
        await mediaPage.close();
      }
      if (saved) {
        await page.goto(`${base}/docs/icons.js`, { waitUntil: 'load' });
        await seed(page, saved);
      }
      await page.setViewport(originalViewport);
      await page.goto(originalUrl, { waitUntil: 'load' });
      // A docs bootstrap can migrate the restored legacy value during navigation.
      if (saved && new URL(originalUrl).origin === new URL(base).origin) await seed(page, saved);
    } finally {
      unlisten(page);
    }
  }
}
