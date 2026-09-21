import assert from 'node:assert/strict';
import catalog from '../docs/specimens.json' with { type: 'json' };
import { inspectPlaygroundControls } from './docs-controls.mjs';

export async function inspectDocumentationSurfaces(page, baseUrl, screenshotPath) {
  const errors = [];
  const onError = (e) => errors.push(e.message);
  page.on('pageerror', onError);
  const go = async (slug) => {
    await page.evaluate((slug) => {
      location.hash = `preview-${slug}`;
    }, slug);
    await page.waitForFunction(
      (slug) =>
        document.querySelector(`.component-playground[data-component="${slug}"]`)?.hidden === false,
      {},
      slug
    );
  };
  const active = '.component-playground:not([hidden])';
  await page.goto(`${baseUrl}/docs/preview.html#preview-button`);
  await page.waitForSelector('body.enhanced');
  assert.equal(await page.$$eval('a[href*="figma.html"]', (els) => els.length), 0);
  for (const width of [1440, 320]) {
    await page.setViewport({ width, height: 1000 });
    for (const c of catalog) {
      await go(c.slug);
      for (const i of ['canonical']) {
        const result = await page.evaluate(() => {
          const section = document.querySelector('.component-playground:not([hidden])');
          const demo =
            section.querySelector('.playground-demo') ||
            section.querySelector('.presentation-surface');
          const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
          return {
            overflow: document.documentElement.scrollWidth - innerWidth,
            children: demo.children.length,
            duplicates: ids.length - new Set(ids).size,
            visible: document.querySelectorAll('.component-playground:not([hidden])').length,
            brokenReferences: [
              ...demo.querySelectorAll('[for],[aria-controls],[data-sidebar-trigger]')
            ].flatMap((el) =>
              ['for', 'aria-controls', 'data-sidebar-trigger'].flatMap((attr) =>
                (el.getAttribute(attr) || '')
                  .split(' ')
                  .filter((id) => id && !document.getElementById(id))
              )
            )
          };
        });
        assert(result.children > 0, `${c.slug}/${i}: empty playground`);
        assert(result.overflow <= 1, `${c.slug}/${i}/${width}: page overflow ${result.overflow}`);
        assert.equal(result.duplicates, 0, `${c.slug}/${i}: duplicate IDs`);
        assert.equal(result.visible, 1);
        assert.deepEqual(result.brokenReferences, [], `${c.slug}/${i}: unresolved control target`);
      }
    }
  }
  await page.setViewport({ width: 1440, height: 1000 });
  await inspectPlaygroundControls(page, go);
  await go('button');
  assert.equal(
    await page.$eval(`${active} .playground-demo .btn`, (el) => el.getBoundingClientRect().height),
    36
  );
  assert.equal(await page.$eval('body', (el) => getComputedStyle(el).fontSize), '14px');
  await page.select(`${active} [name="prop:data-variant"]`, 'destructive');
  assert.equal(
    await page.$eval(`${active} .playground-demo .btn`, (el) => el.dataset.variant),
    'destructive'
  );
  await page.$eval(`${active} [name="content"]`, (el) => {
    el.value = 'Save <draft>';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  assert.equal(
    await page.$eval(`${active} .playground-demo .btn`, (el) => el.textContent),
    'Save <draft>'
  );
  assert.match(
    await page.$eval(`${active} .playground-code`, (el) => el.textContent),
    /Save &lt;draft&gt;/
  );
  await page.$eval(`${active} [name="prop:disabled"]`, (el) => {
    el.checked = true;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  assert.equal(await page.$eval(`${active} .playground-demo .btn`, (el) => el.disabled), true);
  await go('radio-group');
  await page.click(`${active} .playground-demo input[type="radio"]:not(:checked)`);
  assert.match(await page.$eval(`${active} .playground-code`, (el) => el.textContent), /checked/);
  await go('tabs');
  await page.click(`${active} .tab-trigger:last-child`);
  assert.equal(await page.$$eval(`${active} .tab-content:not([hidden])`, (els) => els.length), 1);
  await go('dialog');
  assert.equal(await page.$$eval(`${active} dialog[open]`, (els) => els.length), 0);
  await page.click(`${active} [data-dialog-trigger]`);
  await page.waitForSelector(`${active} dialog[open]`);
  await page.keyboard.press('Escape');
  await page.waitForFunction(
    () => !document.querySelector('.component-playground:not([hidden]) dialog[open]')
  );
  assert.equal(
    await page.evaluate(() => document.activeElement.hasAttribute('data-dialog-trigger')),
    true
  );
  await go('popover');
  await page.click(`${active} [popovertarget]`);
  assert.equal(await page.$$eval(`${active} :popover-open`, (els) => els.length), 1);
  await page.keyboard.press('Escape');
  await go('toast');
  assert.equal(await page.$$eval('#toast-container .toast', (els) => els.length), 0);
  await page.click(`${active} .playground-demo button`);
  await page.waitForSelector('#toast-container .toast');
  assert.equal(
    await page.$eval('#toast-container', (el) => getComputedStyle(el).position),
    'fixed'
  );
  assert.equal(await page.$eval('#toast-container', (el) => el.matches(':popover-open')), true);
  assert.equal(
    await page.$eval('#toast-container .toast-close svg', (el) => el.getBoundingClientRect().width),
    16
  );
  for (const position of [
    'bottom-right',
    'bottom-left',
    'bottom-center',
    'top-right',
    'top-left',
    'top-center'
  ]) {
    await page.evaluate((position) => {
      window.toast.dismiss();
      document.querySelector('#toast-container').dataset.position = position;
      window.toast.show({ title: 'First notification', duration: Infinity });
      window.toast.show({ title: 'Newest notification', duration: Infinity });
    }, position);
    const rects = await page.$$eval('#toast-container .toast', (els) =>
      els.map((el) => el.getBoundingClientRect().toJSON())
    );
    const latest = rects[1];
    const layoutViewportCenter = await page.evaluate(
      () => document.documentElement.clientWidth / 2
    );
    assert(
      rects.every((r) => r.left >= 0 && r.top >= 0 && r.right <= 1440 && r.bottom <= 1000),
      `${position}: toasts remain in viewport`
    );
    if (position.startsWith('bottom'))
      assert(latest.top >= rects[0].bottom, `${position}: newest toast at bottom, no overlap`);
    else assert(latest.bottom <= rects[0].top, `${position}: newest toast at top, no overlap`);
    if (position.endsWith('right')) assert(latest.right > 1400);
    if (position.endsWith('left')) assert(latest.left < 40);
    if (position.endsWith('center'))
      assert(
        Math.abs((latest.left + latest.right) / 2 - layoutViewportCenter) < 1,
        `${position}: newest toast centered in the layout viewport`
      );
  }
  await page.click('#toast-container .toast:last-child .toast-close');
  assert.equal(await page.$$eval('#toast-container .toast', (els) => els.length), 1);
  await page.evaluate(() => window.toast.dismiss());
  assert.equal(await page.$eval('#toast-container', (el) => el.matches(':popover-open')), false);
  await page.goto(`${baseUrl}/docs/figma.html#preview-button`);
  assert.equal(
    await page.$$eval(
      '.docs-sidebar,.docs-nav,.docs-modes,a[href*="preview.html"]',
      (els) => els.length
    ),
    0
  );
  assert.equal(
    await page.$$eval('.matrix-toolbar [data-docs-theme-toggle]', (els) => els.length),
    1
  );
  assert.equal(await page.$$eval('.component-matrix', (els) => els.length), catalog.length);
  assert.equal(await page.$$eval('.matrix-specimens[inert]', (els) => els.length), catalog.length);
  assert.equal(await page.evaluate(() => typeof window.toast), 'undefined');
  await page.setViewport({ width: 2560, height: 1000 });
  const matrixLayout = await page.evaluate(() => {
    const columnCount = (selector) =>
      Math.max(
        0,
        ...[...document.querySelectorAll(selector)].map((grid) => {
          const rows = new Map();
          for (const child of grid.children) {
            const rect = child.getBoundingClientRect();
            if (!rect.width) continue;
            const key = Math.round(rect.top * 100) / 100;
            rows.set(key, (rows.get(key) || 0) + 1);
          }
          return Math.max(0, ...rows.values());
        })
      );
    return {
      maxOuterColumns: columnCount('.matrix-specimens'),
      maxInnerColumns: columnCount('.matrix-cells'),
      importableCells: [...document.querySelectorAll('.matrix-cell')].every(
        (cell) =>
          cell.children.length === 2 &&
          cell.children[0].matches('.matrix-state-label') &&
          cell.children[1].matches('.specimen')
      )
    };
  });
  assert(
    matrixLayout.maxOuterColumns <= 4,
    `matrix outer grid exceeds four columns: ${JSON.stringify(matrixLayout)}`
  );
  assert(
    matrixLayout.maxInnerColumns <= 4,
    `matrix state grid exceeds four columns: ${JSON.stringify(matrixLayout)}`
  );
  assert.equal(matrixLayout.importableCells, true, 'matrix cells stay isolated for import');
  assert(
    await page.$$eval(
      '[data-component="input-otp"] [data-part="root"] .input-otp-cells',
      (els) => els.length > 0 && els.every((el) => el.scrollWidth <= el.clientWidth + 1)
    ),
    'full OTP anatomy must not be clipped in the desktop matrix'
  );
  assert(
    await page.$$eval(
      '[data-component="select"] [data-state-name="invalid: on"] .select',
      (els) => els.length > 0
    ),
    'static select exposes its invalid specimen'
  );
  assert(
    await page.$$eval(
      '[data-component="checkbox"] [data-state-name="checked: off · indeterminate: on · invalid: off"] .checkbox',
      (els) => els.length > 0
    ),
    'static checkbox exposes its indeterminate specimen'
  );
  assert.deepEqual(
    await page.$eval('[data-component="skeleton"] .skeleton-round', (el) => [
      el.offsetWidth,
      el.offsetHeight
    ]),
    [40, 40],
    'round skeleton keeps square bounds'
  );
  assert.equal(
    await page.$$eval('[data-component="toast"] [data-part="root"] .toast', (els) => els.length),
    10,
    'toast crosses every visual variant with both content variants'
  );
  assert.equal(
    await page.$$eval(
      '[data-component="toast"] [data-part="root"] .toast:has(.toast-actions)',
      (els) => new Set(els.map((el) => el.getAttribute('data-variant'))).size
    ),
    5
  );
  assert.equal(
    (await page.$$eval(
      '[data-component="date-picker"] .date-picker-day button',
      (els) => els.length
    )) > 0,
    true
  );
  const before = await page.$eval('body', (el) => getComputedStyle(el).backgroundColor);
  await page.click('[data-docs-theme-toggle]');
  const after = await page.$eval('body', (el) => getComputedStyle(el).backgroundColor);
  assert.notEqual(before, after, 'theme picker changes the single canvas');
  for (const width of [2560, 1440, 320, 720]) {
    await page.setViewport({ width, height: 1000 });
    assert(
      (await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1,
      `matrix ${width}: page overflow`
    );
  }
  if (screenshotPath) {
    await page.setViewport({ width: 1440, height: 1000 });
    await page.screenshot({ path: screenshotPath });
  }
  assert.deepEqual(errors, []);
  page.off('pageerror', onError);
  console.log(
    `PASS all ${catalog.length} component playgrounds at desktop/320px; live controls, modal focus, popover, toast, theme and static export`
  );
}
