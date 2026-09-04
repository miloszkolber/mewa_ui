import { executablePath } from './browser-support.mjs';
// Real-browser regressions for lifecycle, composition and native forms.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const root = process.env.MEWA_UI_ROOT || path.resolve(import.meta.dirname, '..');
const require = createRequire(path.join(root, 'package.json'));
const { default: puppeteer } = await import(require.resolve('puppeteer-core'));
const server = Bun.serve({
  hostname: '127.0.0.1',
  port: 0,
  fetch(req) {
    const p = new URL(req.url).pathname;
    if (/favicon\.(?:svg|ico)$/.test(p)) return new Response(null, { status: 204 });
    if (p === '/blank')
      return new Response('<!doctype html><html lang="en"><body></body></html>', {
        headers: { 'content-type': 'text/html' }
      });
    if (p.startsWith('/fixture/'))
      return new Response(
        fs
          .readFileSync(path.join(root, 'docs', p.split('/').pop() + '.html'), 'utf8')
          .replace(/<script\b[\s\S]*?<\/script>/gi, '')
          .replace(/(?:href|src)="(?:\.\.\/)?(?:css|js|library|assets)\/[^"]*"/g, ''),
        { headers: { 'content-type': 'text/html' } }
      );
    const file = path.resolve(root, '.' + p);
    if (!file.startsWith(root + '/')) return new Response('', { status: 403 });
    if (!fs.existsSync(file)) return new Response('', { status: 404 });
    return new Response(Bun.file(file));
  }
});
const browser = await puppeteer.launch({
  executablePath: executablePath(),
  headless: true,
  args: ['--no-sandbox']
});
const page = await browser.newPage();
const results = { browser: await browser.version(), cases: [] };
async function test(name, fn, fixture = 'blank') {
  await page.goto(`http://127.0.0.1:${server.port}/${fixture}`);
  try {
    results.cases.push({ name, result: await page.evaluate(fn) });
  } catch (e) {
    results.cases.push({ name, error: e.message });
  }
}
try {
  await test(
    'all-auto command palette filtering',
    async () => {
      await import('/dist/mewa-ui/auto.js');
      const d = document.querySelector('dialog.command-palette');
      const input = d.querySelector('.command-palette-input');
      input.value = 'zzzz-nonexistent-command';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return {
        initialized: d.hasAttribute('data-init'),
        visibleCommands: [...d.querySelectorAll('.command-palette-item')].filter((x) => !x.hidden)
          .length,
        controls: input.getAttribute('aria-controls')
      };
    },
    'fixture/command-palette'
  );
  await test(
    'command palette alone filtering',
    async () => {
      await import('/dist/mewa-ui/auto/command-palette.js');
      const d = document.querySelector('dialog.command-palette');
      const input = d.querySelector('.command-palette-input');
      input.value = 'zzzz-nonexistent-command';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return {
        visibleCommands: [...d.querySelectorAll('.command-palette-item')].filter((x) => !x.hidden)
          .length
      };
    },
    'fixture/command-palette'
  );
  await test('toggle plus tooltip shared initialization marker', async () => {
    document.body.innerHTML =
      '<button type="button" class="toggle" aria-pressed="false" data-tooltip-trigger="tip" data-delay="0">Pin</button><div id="tip" class="tooltip" popover="hint" role="tooltip">Pin help</div>';
    await import('/dist/mewa-ui/auto/toggle.js');
    await import('/dist/mewa-ui/auto/tooltip.js');
    const b = document.querySelector('button');
    b.focus();
    await new Promise((r) => setTimeout(r, 50));
    b.click();
    return {
      pressed: b.getAttribute('aria-pressed'),
      describedBy: b.getAttribute('aria-describedby'),
      tooltipOpen: document.querySelector('#tip').matches(':popover-open')
    };
  });
  await test('controller destroy leaves toggle listener active', async () => {
    document.body.innerHTML =
      '<button type="button" class="toggle" aria-pressed="false">Pin</button>';
    const { behavior } = await import('/dist/mewa-ui/components/toggle.js');
    const { createController } = await import('/dist/mewa-ui/index.js');
    const b = document.querySelector('button');
    const c = createController(behavior, b);
    c.destroy();
    b.click();
    return { pressedAfterDestroy: b.getAttribute('aria-pressed') };
  });
  await test('new tab under mounted tablist remains unwired after update', async () => {
    document.body.innerHTML =
      '<div role="tablist"><button type="button" role="tab" class="tab-trigger" aria-selected="true" aria-controls="one">One</button></div><div id="one">One</div><div id="two" hidden>Two</div>';
    const { behavior } = await import('/dist/mewa-ui/components/tabs.js');
    const { createController } = await import('/dist/mewa-ui/index.js');
    const list = document.querySelector('[role=tablist]');
    const c = createController(behavior, list);
    list.insertAdjacentHTML(
      'beforeend',
      '<button type="button" role="tab" class="tab-trigger" aria-selected="false" aria-controls="two">Two</button>'
    );
    c.update();
    list.lastElementChild.click();
    return {
      selected: list.lastElementChild.getAttribute('aria-selected'),
      panelHidden: document.querySelector('#two').hidden
    };
  });
  await test('tag input native required and form reset', async () => {
    document.body.innerHTML =
      '<form><div data-tag-input><div data-tag-input-field><input class="tag-input-fallback" type="text" id="tags" name="tags" value="initial" required></div><p data-tag-input-status></p></div></form>';
    const { enhance } = await import('/dist/mewa-ui/components/tag-input.js');
    enhance(document);
    const form = document.querySelector('form');
    const draft = document.querySelector('.tag-input-control');
    draft.value = 'next';
    draft.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    );
    form.reset();
    await new Promise((r) => setTimeout(r, 20));
    const afterReset = new FormData(form).get('tags');
    while (document.querySelector('.tag-input-remove'))
      document.querySelector('.tag-input-remove').click();
    return {
      afterReset,
      emptyFormValid: form.checkValidity(),
      submitted: new FormData(form).get('tags'),
      draftRequired: draft.required
    };
  });
  await test(
    'file upload preview revoked on intra-document move',
    async () => {
      const upload = document.querySelector('[data-file-upload]');
      const input = upload.querySelector('input[type=file]');
      upload.setAttribute('data-preview', '');
      input.removeAttribute('accept');
      upload.removeAttribute('data-max-size');
      const urls = [];
      const revoke = URL.revokeObjectURL;
      URL.revokeObjectURL = (u) => {
        urls.push(u);
        revoke(u);
      };
      await import('/dist/mewa-ui/auto/file-upload.js');
      const transfer = new DataTransfer();
      transfer.items.add(new File(['abc'], 'sample.png', { type: 'image/png' }));
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 10));
      const before = urls.length;
      const originalPreview = upload.querySelector('img')?.src;
      const region = document.createElement('section');
      document.body.append(region);
      region.append(upload);
      await new Promise((r) => setTimeout(r, 20));
      return {
        revokesAfterMove: urls.length - before,
        samePreview: originalPreview === upload.querySelector('img')?.src,
        initialized: upload.hasAttribute('data-init')
      };
    },
    'fixture/file-upload'
  );
  await test('observer initializes nodes already removed in the same batch', async () => {
    const { createEnhancer } = await import('/dist/mewa-ui/index.js');
    const log = [];
    const region = document.createElement('div');
    document.body.append(region);
    const e = createEnhancer([
      {
        name: 'probe',
        enhance: (n) => log.push(['enhance', n.isConnected]),
        destroy: (n) => log.push(['destroy', n.isConnected])
      }
    ]);
    e.observe(region);
    const child = document.createElement('div');
    region.append(child);
    child.remove();
    await new Promise((r) => setTimeout(r, 10));
    e.disconnect();
    return log;
  });
  await test(
    'file upload native reset leaves rendered files',
    async () => {
      const upload = document.querySelector('[data-file-upload]');
      const form = document.createElement('form');
      upload.before(form);
      form.append(upload);
      const input = upload.querySelector('input[type=file]');
      input.removeAttribute('accept');
      upload.removeAttribute('data-max-size');
      const { enhance } = await import('/dist/mewa-ui/components/file-upload.js');
      enhance(form);
      const t = new DataTransfer();
      t.items.add(new File(['test'], 'test.txt', { type: 'text/plain' }));
      input.files = t.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      form.reset();
      await new Promise((r) => setTimeout(r, 20));
      return {
        nativeFiles: input.files.length,
        renderedFiles: upload.querySelectorAll('.file-upload-item').length,
        status: upload.querySelector('[data-file-upload-status]').textContent
      };
    },
    'fixture/file-upload'
  );
  await test('sidebar trigger retains replaced target', async () => {
    document.body.innerHTML =
      '<button type="button" class="sidebar-trigger" data-sidebar-trigger="sidebar">Menu</button><aside class="app-sidebar" id="sidebar" data-state="expanded"></aside>';
    await import('/dist/mewa-ui/auto/sidebar.js');
    const old = document.querySelector('aside');
    const next = old.cloneNode(true);
    old.replaceWith(next);
    await new Promise((r) => setTimeout(r, 20));
    document.querySelector('button').click();
    return { detachedState: old.dataset.state, currentState: next.dataset.state };
  });
  await test('cloned enhanced markup receives its own handlers', async () => {
    document.body.innerHTML =
      '<button class="toggle" type="button" aria-pressed="false">Pin</button>';
    const { behavior } = await import('/dist/mewa-ui/components/toggle.js');
    const { createController } = await import('/dist/mewa-ui/index.js');
    const original = document.querySelector('button');
    const first = createController(behavior, original);
    const clone = original.cloneNode(true);
    document.body.append(clone);
    const second = createController(behavior, clone);
    clone.click();
    if (clone.getAttribute('aria-pressed') !== 'true') throw new Error('clone was not initialized');
    first.destroy();
    clone.click();
    if (clone.getAttribute('aria-pressed') !== 'false')
      throw new Error('unrelated owner destroyed clone');
    second.destroy();
    return true;
  });
  const registry = JSON.parse(fs.readFileSync(path.join(root, 'registry.json'), 'utf8'));
  const lifecycleResults = [];
  for (const component of registry.components.filter((component) => component.jsMode !== 'none')) {
    await page.goto(`http://127.0.0.1:${server.port}/fixture/${component.slug}`);
    const remaining = await page.evaluate(async (slug) => {
      const { behavior } = await import(`/dist/mewa-ui/components/${slug}.js`);
      const { createController } = await import('/dist/mewa-ui/index.js');
      const listeners = [];
      const originalAdd = EventTarget.prototype.addEventListener;
      const originalRemove = EventTarget.prototype.removeEventListener;
      const capture = (options) =>
        typeof options === 'boolean' ? options : Boolean(options?.capture);
      EventTarget.prototype.addEventListener = function (type, callback, options) {
        if (
          !listeners.some(
            (entry) =>
              entry.target === this &&
              entry.type === type &&
              entry.callback === callback &&
              entry.capture === capture(options)
          )
        ) {
          listeners.push({ target: this, type, callback, capture: capture(options) });
        }
        return originalAdd.call(this, type, callback, options);
      };
      EventTarget.prototype.removeEventListener = function (type, callback, options) {
        const index = listeners.findIndex(
          (entry) =>
            entry.target === this &&
            entry.type === type &&
            entry.callback === callback &&
            entry.capture === capture(options)
        );
        if (index >= 0) listeners.splice(index, 1);
        return originalRemove.call(this, type, callback, options);
      };
      try {
        for (let cycle = 0; cycle < 2; cycle++) {
          const controller = createController(behavior, document);
          controller.destroy();
          controller.destroy();
        }
        return listeners.map((entry) => entry.type);
      } finally {
        EventTarget.prototype.addEventListener = originalAdd;
        EventTarget.prototype.removeEventListener = originalRemove;
      }
    }, component.slug);
    lifecycleResults.push({ component: component.slug, remaining });
  }
  assert.deepEqual(
    lifecycleResults.filter((result) => result.remaining.length),
    [],
    'all component listeners must be released after two mount/destroy cycles'
  );
  console.log('PASS listener teardown and reinitialization for all 41 behaviors');
  await page.goto(`http://127.0.0.1:${server.port}/docs/toggle.html`);
  await page.waitForSelector('.nav-link[href="tabs.html"]');
  // Delay one route even after cancellation to exercise the sequence guard too.
  await page.evaluate(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, options) => {
      if (input === 'tabs.html') {
        const response = await originalFetch(input);
        await new Promise((resolve) => setTimeout(resolve, 150));
        return response;
      }
      return originalFetch(input, options);
    };
    document.querySelector('.nav-link[href="tabs.html"]').click();
    document.querySelector('.nav-link[href="checkbox.html"]').click();
  });
  const assertRoute = async (slug) => {
    await page.waitForFunction(
      (expected) =>
        location.pathname.endsWith('/' + expected + '.html') &&
        document.querySelector('.nav-link[aria-current="page"]')?.getAttribute('href') ===
          expected + '.html',
      {},
      slug
    );
    const state = await page.evaluate(() => ({
      title: document.title,
      heading: document.querySelector('main h1')?.textContent.trim(),
      focused: document.activeElement === document.querySelector('main h1'),
      current: [...document.querySelectorAll('.nav-link[aria-current="page"]')].map((link) =>
        link.getAttribute('href')
      )
    }));
    assert(state.title.includes(state.heading));
    assert.equal(state.focused, true);
    assert(state.current.every((href) => href === slug + '.html'));
  };
  await assertRoute('checkbox');
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 200)));
  await assertRoute('checkbox');
  await page.evaluate(() => {
    document.querySelector('.nav-link[href="tabs.html"]').click();
    document.querySelector('.nav-link[href="checkbox.html"]').click();
  });
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 200)));
  await assertRoute('checkbox');
  await page.evaluate(() => history.back());
  await assertRoute('toggle');
  await page.evaluate(() => history.forward());
  await assertRoute('checkbox');
  console.log('PASS route races, cancellation, history, title, focus and current links');
  await page.goto(`http://127.0.0.1:${server.port}/docs/select.html`);
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'forced-colors', value: 'active' }]
  });
  assert.equal(
    await page.$eval('select.select', (select) => getComputedStyle(select).appearance),
    'auto'
  );
  await cdp.send('Emulation.setEmulatedMedia', { features: [] });
  await cdp.detach();
  await page.setJavaScriptEnabled(false);
  await page.goto(`http://127.0.0.1:${server.port}/docs/index.html`);
  assert.equal(await page.$$eval('main a', (links) => links.length), 80);
  await page.goto(`http://127.0.0.1:${server.port}/docs/toggle.html`);
  assert.equal(await page.$eval('site-nav a', (link) => link.getAttribute('href')), 'index.html');
  await page.setJavaScriptEnabled(true);
  const scratch = fs.mkdtempSync(path.join(root, 'dist/runes-test-'));
  try {
    const filename = path.join(scratch, 'state.svelte.js');
    fs.writeFileSync(filename, 'export const state = $state({ count: 0 });\n');
    const { sveltePlugin } = await import(path.join(root, 'dist/mewa-svelte/bun-plugin.js'));
    const build = await Bun.build({
      entrypoints: [filename],
      plugins: [sveltePlugin()],
      target: 'browser',
      write: false
    });
    results.runesProbe = { success: build.success, output: await build.outputs[0].text() };
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
  console.log(JSON.stringify(results.cases, null, 2));
  const cases = results.cases;
  for (const item of cases) assert.equal(item.error, undefined, item.name);
  assert.equal(cases[0].result.visibleCommands, 0);
  assert.equal(cases[1].result.visibleCommands, 0);
  assert.equal(cases[2].result.describedBy, 'tip');
  assert.equal(cases[2].result.tooltipOpen, true);
  assert.equal(cases[3].result.pressedAfterDestroy, 'false');
  assert.deepEqual(cases[4].result, { selected: 'true', panelHidden: false });
  assert.equal(cases[5].result.afterReset, 'initial');
  assert.equal(cases[5].result.emptyFormValid, false);
  assert.equal(cases[6].result.revokesAfterMove, 0);
  assert.equal(
    cases[7].result.some(([operation]) => operation === 'enhance'),
    false
  );
  assert.equal(cases[8].result.renderedFiles, 0);
  assert.equal(cases[9].result.currentState, 'collapsed');
  assert.equal(cases[9].result.detachedState, 'expanded');
  assert.equal(results.runesProbe.success, true);
  assert.doesNotMatch(results.runesProbe.output, /(?:const|var|let) state = \$state\(/);
  console.log('PASS browser lifecycle and native form regressions');
} finally {
  await browser.close();
  server.stop(true);
}
