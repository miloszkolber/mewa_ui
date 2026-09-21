import assert from 'node:assert/strict';
import catalog from '../docs/specimens.json' with { type: 'json' };
import { compileModel } from '../scripts/docs-model.mjs';
import { encodeValue, initialValue } from '../docs/component-model.mjs';

export async function inspectPlaygroundControls(page, go) {
  const active = '.component-playground:not([hidden])';
  const set = (name, value) =>
    page.$eval(
      `${active} [name="${name}"]`,
      (el, value) => {
        if (el.type === 'checkbox') el.checked = el.dataset.on === value;
        else el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      },
      encodeValue(value)
    );
  const reset = () => page.$eval(`${active} form`, (el) => el.reset());
  const propName = (s, i, name) => (s.id === 'root' ? `prop:${name}` : `prop:${s.id}:${i}:${name}`);
  for (const c of catalog) {
    const model = await compileModel(c);
    await go(c.slug);
    if (model.presentation) {
      assert.equal(await page.$$eval(`${active} .playground-controls`, (els) => els.length), 0);
      continue;
    }
    await reset();
    assert.equal(await page.$$eval(`${active} [name^="instance:"]`, (els) => els.length), 0);
    for (const scope of model.scopes) {
      const indices = scope.id === 'root' ? [0] : Array.from({ length: scope.count }, (_, i) => i);
      for (const i of indices) {
        for (const prop of scope.props) {
          const name = propName(scope, i, prop.name);
          assert.equal(
            await page.$eval(`${active} [name="${name}"]`, (el) => el.getAttribute('role')),
            prop.kind === 'boolean' ? 'switch' : null
          );
          // The carousel controller owns prev/next availability at the edges.
          // Some controllers re-derive availability and validity from their owner.
          const controllerOwned =
            ['color', 'color-hex'].includes(scope.type) ||
            (scope.type === 'carousel-control' && prop.name === 'disabled');
          for (const value of prop.values) {
            await set(name, value);
            if (c.slug === 'toast' || !prop.attr || controllerOwned) continue;
            const expected = value;
            const actual = await page.$eval(
              `${active} .playground-demo`,
              (el, selector, attr, index) => {
                const target = el.querySelectorAll(selector)[index];
                if (!target) return null;
                if (target.hasAttribute(attr)) return target.getAttribute(attr);
                if (attr === 'disabled' && target.getAttribute('aria-disabled') === 'true')
                  return '';
                return null;
              },
              scope.target,
              prop.attr,
              i
            );
            assert.equal(actual, expected, `${c.slug}/${scope.id}/${i}/${prop.name}/${value}`);
          }
          await set(name, initialValue(scope, prop, i));
        }
      }
    }
    await reset();
  }

  await go('button');
  await set('prop:showLabel', null);
  await set('prop:showIconStart', '');
  assert.deepEqual(
    await page.$eval(`${active} .playground-demo .btn`, (el) => [el.offsetWidth, el.offsetHeight]),
    [36, 36]
  );
  assert.equal(
    await page.$eval(`${active} .playground-demo .btn`, (el) => el.getAttribute('aria-label')),
    'Button'
  );
  await reset();
  await go('avatar');
  await set('slot', 'icon');
  assert.deepEqual(
    await page.$eval(`${active} .avatar`, (el) => [el.offsetWidth, el.offsetHeight]),
    [36, 36]
  );
  assert.equal(
    await page.$eval(`${active} .avatar-fallback`, (el) => el.getAttribute('aria-hidden')),
    null
  );
  await go('layout');
  await set('slot', 'center');
  assert(await page.$eval(`${active} [data-property="data-gap"]`, (el) => el.hidden));
  await go('badge');
  await set('prop:data-state', 'positive');
  assert(await page.$eval(`${active} [data-property="data-variant"]`, (el) => el.hidden));
  assert.equal(await page.$eval(`${active} .badge`, (el) => el.getAttribute('data-variant')), null);

  await go('nav');
  await set('exclusive:part-nav-link', '0');
  await set('prop:part-nav-link:1:disabled', '');
  assert.equal(
    await page.$eval(`${active} .nav-item-link`, (el) => el.getAttribute('aria-current')),
    'page'
  );
  assert.equal(
    await page.$$eval(`${active} .nav-item-link[aria-disabled="true"]`, (els) => els.length),
    1
  );

  await go('toggle-group');
  await reset();
  await set('prop:part-toggle:1:checked', 'true');
  assert.deepEqual(
    await page.$$eval(`${active} .toggle-group .toggle`, (els) =>
      els.map((el) => el.getAttribute('aria-pressed'))
    ),
    ['false', 'true', 'false']
  );
  await set('prop:data-type', 'multiple');
  await set('prop:part-toggle:0:checked', 'true');
  assert.equal(
    await page.$$eval(`${active} .toggle-group [aria-pressed="true"]`, (els) => els.length),
    2
  );
  await set('prop:data-type', 'single');
  assert.equal(
    await page.$$eval(`${active} .toggle-group [aria-pressed="true"]`, (els) => els.length),
    1
  );

  await go('button-group');
  await set('prop:part-button:0:disabled', '');
  assert.deepEqual(
    await page.$$eval(`${active} .btn-group .btn`, (els) => els.map((el) => el.disabled)),
    [true, false, false]
  );

  await go('date-picker');
  await page.click(`${active} [data-action="next-month"]`);
  await page.waitForFunction(
    () =>
      document.querySelector(
        '.component-playground:not([hidden]) .date-picker-day button[tabindex="0"]'
      ) !== null
  );

  await go('time-field');
  await set('value:0', '11');
  await set('value:1', '45');
  await set('value:2', 'PM');
  assert.equal(await page.$eval(`${active} [data-time-part="value"]`, (el) => el.value), '23:45');
  await go('input-otp');
  await set('value:0', '7');
  await set('value:1', '2');
  assert.deepEqual(
    await page.$$eval(`${active} .input-otp input:not([type="hidden"])`, (els) =>
      els.slice(0, 2).map((el) => el.value)
    ),
    ['7', '2']
  );
  await go('progress');
  await set('prop:value', '50');
  assert.equal(await page.$eval(`${active} progress`, (el) => el.value), 50);
  await set('prop:value', null);
  assert(await page.$eval(`${active} progress`, (el) => !el.hasAttribute('value')));
  await go('composer');
  await page.type(`${active} .composer-input`, 'Keep this draft');
  await set('prop:data-submit-on', 'enter');
  assert.equal(await page.$eval(`${active} .composer-input`, (el) => el.value), 'Keep this draft');
  await go('image');
  await set('prop:data-ratio', '16/9');
  assert(
    Math.abs(
      (await page.$eval(`${active} .image > img`, (el) => el.offsetWidth / el.offsetHeight)) -
        16 / 9
    ) < 0.02
  );

  await go('tag-input');
  await reset();
  const committed = await page.$eval(`${active} .tag-input-fallback`, (el) => el.value);
  await page.type(`${active} .tag-input-control`, 'Draft');
  await set('prop:invalid', 'true');
  assert.equal(await page.$eval(`${active} .tag-input-fallback`, (el) => el.value), committed);
  assert.equal(await page.$eval(`${active} .tag-input-control`, (el) => el.value), 'Draft');
  await page.click(`${active} .tag-input-remove`);
  const afterRemoval = await page.$eval(`${active} .tag-input-fallback`, (el) => el.value);
  assert.notEqual(afterRemoval, committed);
  await set('prop:invalid', null);
  assert.equal(await page.$eval(`${active} .tag-input-fallback`, (el) => el.value), afterRemoval);
  assert.equal(await page.$eval(`${active} .tag-input-control`, (el) => el.value), 'Draft');

  await go('checkbox');
  await set('prop:indeterminate', '');
  const minus = await page.$eval(
    `${active} .checkbox`,
    (el) => getComputedStyle(el, '::after').maskImage
  );
  await page.click(`${active} .checkbox`);
  await page.waitForFunction(() => {
    const el = document.querySelector('.component-playground:not([hidden]) .checkbox');
    return el.checked && !el.indeterminate && !el.hasAttribute('data-demo-mixed');
  });
  assert.notEqual(
    await page.$eval(`${active} .checkbox`, (el) => getComputedStyle(el, '::after').maskImage),
    minus
  );
  await page.click(`${active} .checkbox`);
  await page.waitForFunction(
    () =>
      getComputedStyle(
        document.querySelector('.component-playground:not([hidden]) .checkbox'),
        '::after'
      ).opacity === '0'
  );

  await go('radio-group');
  await reset();
  await set('prop:part-radio:1:checked', '');
  assert.deepEqual(await page.$$eval(`${active} .radio`, (els) => els.map((el) => el.checked)), [
    false,
    true,
    false
  ]);
  await set('prop:part-radio:0:checked', '');
  assert.deepEqual(await page.$$eval(`${active} .radio`, (els) => els.map((el) => el.checked)), [
    true,
    false,
    false
  ]);
  await set('prop:part-radio:2:checked', '');
  await set('prop:part-radio:0:checked', '');
  assert.deepEqual(await page.$$eval(`${active} .radio`, (els) => els.map((el) => el.checked)), [
    true,
    false,
    false
  ]);

  await go('tabs');
  await reset();
  assert.equal(
    await page.$$eval(
      `${active} [name="exclusive:part-tab"] option[value="-1"]`,
      (els) => els.length
    ),
    0
  );
  await set('prop:part-tab:1:disabled', '');
  await set('exclusive:part-tab', '1');
  assert.equal(await page.$eval(`${active} [name="exclusive:part-tab"]`, (el) => el.value), '0');
  assert(
    await page.$eval(
      `${active} .tab-trigger[aria-selected="true"]`,
      (el) => !document.getElementById(el.getAttribute('aria-controls')).hidden
    )
  );
  await set('prop:part-tab:1:disabled', null);
  await set('exclusive:part-tab', '1');
  await set('prop:part-tab:0:disabled', '');
  await set('prop:part-tab:1:disabled', '');
  assert.equal(await page.$eval(`${active} [name="exclusive:part-tab"]`, (el) => el.value), '1');
  assert(
    await page.$eval(
      `${active} .tab-trigger[aria-selected="true"]`,
      (el) => !document.getElementById(el.getAttribute('aria-controls')).hidden
    )
  );
  await set('prop:part-tab:0:disabled', null);
  assert.equal(await page.$eval(`${active} [name="exclusive:part-tab"]`, (el) => el.value), '0');
  assert(
    await page.$eval(
      `${active} .tab-trigger[aria-selected="true"]`,
      (el) => !document.getElementById(el.getAttribute('aria-controls')).hidden
    )
  );

  await go('date-picker');
  await reset();
  await page.click(`${active} [data-action="next-month"]`);
  const month = await page.$eval(`${active} .date-picker-heading`, (el) => el.textContent);
  const days = await page.$$eval(`${active} .date-picker-day button`, (els) => els.length);
  await set('prop:disabled', '');
  assert.equal(await page.$eval(`${active} .date-picker-heading`, (el) => el.textContent), month);
  assert.equal(await page.$$eval(`${active} .date-picker-day button`, (els) => els.length), days);
  await set('prop:disabled', null);

  await go('tool-call');
  await set('slot', 'status-only');
  assert.equal(
    await page.$$eval(
      `${active} .playground-demo details, ${active} .playground-demo summary`,
      (els) => els.length
    ),
    0
  );
  assert(
    await page.$eval(`${active} [name="prop:open"]`, (el) => el.closest('.control-cell').hidden)
  );
  console.log(
    'PASS modeled properties, semantic switches, exclusive selection, calendar and retained drafts'
  );
}
