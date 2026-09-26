import assert from 'node:assert/strict';
import catalog from '../docs/specimens.json' with { type: 'json' };
import { compileModel } from '../scripts/docs-model.mjs';
import { encodeValue, initialValue } from '../docs/component-model.mjs';
import { propertyOperations } from '../docs/model-operations.mjs';

export async function inspectPlaygroundControls(page, go) {
  const active = '.component-playground:not([hidden])';
  const settle = () =>
    page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
  const set = async (name, value) => {
    await page.$eval(
      `${active} [name="${name}"]`,
      (el, value) => {
        if (el.type === 'checkbox') el.checked = el.dataset.on === value;
        else el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      },
      encodeValue(value)
    );
    await settle();
  };
  const reset = async () => {
    await page.$eval(`${active} form`, (el) => el.reset());
    await settle();
  };
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
          for (const value of prop.values) {
            // A non-collapsible accordion cannot close its last open item.
            // Keep a sibling open when checking the independent off value;
            // the constrained last-open case is asserted explicitly below.
            if (scope.type === 'accordion-item' && prop.name === 'open' && value === null)
              await set(propName(scope, (i + 1) % scope.count, 'open'), '');
            await set(name, value);
            if (c.slug === 'toast' || !prop.attr) continue;
            // Native checked state is deliberately not written to the authored
            // attribute: doing so would change the form's reset baseline.
            const nativeChecked = propertyOperations({ ...scope, index: i }, prop, value).some(
              (op) => op.attr === 'checked'
            );
            const expected = value;
            const actual = await page.$eval(
              `${active} .playground-demo`,
              (el, selector, attr, index, nativeChecked) => {
                const target = el.querySelectorAll(selector)[index];
                if (!target) throw new Error(`Missing property target: ${selector}[${index}]`);
                if (nativeChecked) return target.checked ? '' : null;
                if (target.hasAttribute(attr)) return target.getAttribute(attr);
                if (attr === 'disabled' && target.getAttribute('aria-disabled') === 'true')
                  return '';
                return null;
              },
              scope.target,
              prop.attr,
              i,
              nativeChecked
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
  await set('prop:showIconStart', '');
  await set('prop:showLabel', null);
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
  assert.equal(
    await page.$$eval(
      `${active} [name^="prop:part-toggle:"][name$=":checked"]`,
      (els) => els.length
    ),
    0
  );
  await set('prop:part-toggle:1:pressed', 'true');
  assert.deepEqual(
    await page.$$eval(`${active} .toggle-group .toggle`, (els) =>
      els.map((el) => el.getAttribute('aria-pressed'))
    ),
    ['false', 'true', 'false']
  );
  await set('prop:data-type', 'multiple');
  await set('prop:part-toggle:0:pressed', 'true');
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
  await reset();
  assert.equal(
    await page.$$eval(
      `${active} [name^="prop:part-button:"][name$=":disabled"]`,
      (els) => els.length
    ),
    0,
    'Button Group owns disabled without duplicate nested controls'
  );
  await set('prop:disabled', '');
  assert.equal(await page.$eval(`${active} [name="prop:disabled"]`, (el) => el.checked), true);
  assert.deepEqual(
    await page.$eval(`${active} .btn-group`, (el) => [
      el.getAttribute('data-disabled'),
      el.getAttribute('disabled'),
      el.getAttribute('aria-disabled')
    ]),
    ['', null, null],
    'the root uses a data marker, not an inert native or ARIA constraint'
  );
  assert.deepEqual(
    await page.$$eval(`${active} .btn-group .btn`, (els) => els.map((el) => el.disabled)),
    [true, true, true]
  );
  await set('prop:disabled', null);
  assert.deepEqual(
    await page.$$eval(`${active} .btn-group .btn`, (els) => els.map((el) => el.disabled)),
    [false, false, false]
  );

  await go('date-picker');
  await page.click(`${active} [data-action="next-month"]`);
  await page.waitForFunction(
    () =>
      document.querySelector(
        '.component-playground:not([hidden]) .date-picker-day[tabindex="0"]'
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
  await set('prop:invalid', '');
  assert.equal(
    await page.$eval(`${active} .tag-input`, (el) => el.getAttribute('data-invalid')),
    ''
  );
  assert.equal(
    await page.$eval(`${active} .tag-input-control`, (el) => el.getAttribute('aria-invalid')),
    'true'
  );
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
  assert.equal(
    await page.$$eval(
      `${active} [name="prop:disabled"], ${active} [name="prop:invalid"]`,
      (els) => els.length
    ),
    0,
    'Date Picker exposes no unsupported disabled or invalid properties'
  );
  const originalMonth = await page.$eval(`${active} .date-picker-heading`, (el) => el.textContent);
  await page.click(`${active} [data-action="next-month"]`);
  await page.waitForFunction(
    (active, original) =>
      document.querySelector(`${active} .date-picker-heading`)?.textContent !== original,
    {},
    active,
    originalMonth
  );
  await page.click(`${active} .date-picker-day:not([data-outside])[data-day="15"]`);
  const selected = `${active} .date-picker-day[aria-selected='true']`;
  await page.waitForSelector(selected);
  const date = await page.$eval(selected, (el) => el.dataset.date);
  assert.match(date, /^\d{4}-\d{2}-15$/, 'the calendar selected the requested date');
  const month = await page.$eval(`${active} .date-picker-heading`, (el) => el.textContent);
  const days = await page.$$eval(`${active} .date-picker-day`, (els) => els.length);
  await set('width', '480px');
  assert.equal(await page.$eval(`${active} .playground-demo`, (el) => el.style.width), '480px');
  assert.equal(await page.$eval(selected, (el) => el.dataset.date), date);
  assert.equal(await page.$eval(`${active} .date-picker-heading`, (el) => el.textContent), month);
  assert.equal(await page.$$eval(`${active} .date-picker-day`, (els) => els.length), days);

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

  // Single-selection disclosure keeps at most one item open.
  await go('accordion');
  await reset();
  await set('prop:data-type', 'single');
  await set('prop:part-accordion-item:1:open', '');
  assert.deepEqual(
    await page.$$eval(`${active} .accordion-item`, (els) => els.map((el) => el.open)),
    [false, true, false]
  );
  assert.deepEqual(
    await page.$$eval(`${active} [name$=":open"]`, (els) => els.map((el) => el.checked)),
    [false, true, false]
  );
  await set('prop:part-accordion-item:1:open', null);
  assert.deepEqual(
    await page.$$eval(`${active} .accordion-item`, (els) => els.map((el) => el.open)),
    [false, true, false],
    'non-collapsible single selection retains its last open item'
  );
  assert.equal(
    await page.$eval(`${active} [name="prop:part-accordion-item:1:open"]`, (el) => el.checked),
    true,
    'the disclosure inspector reads back the rejected close'
  );
  await reset();

  // Reset restores the initial demo markup exactly.
  await go('toggle-group');
  await reset();
  const initialDemo = await page.$eval(`${active} .playground-demo`, (el) => el.innerHTML);
  await set('prop:data-variant', 'outline');
  await set('prop:disabled', '');
  await reset();
  assert.equal(await page.$eval(`${active} .playground-demo`, (el) => el.innerHTML), initialDemo);

  console.log(
    'PASS modeled properties, native interaction sync, exclusive selection, disclosure and reset'
  );
}
