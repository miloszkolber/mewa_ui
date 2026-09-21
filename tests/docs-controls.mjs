import assert from 'node:assert/strict';
import catalog from '../docs/specimens.json' with { type: 'json' };
import { compileModel } from '../scripts/docs-model.mjs';
import { encodeValue } from '../docs/component-model.mjs';

export async function inspectPlaygroundControls(page, go) {
  const active = '.component-playground:not([hidden])';
  const select = (name, value) => page.select(`${active} [name="${name}"]`, value);
  const set = (name, value) =>
    page.$eval(
      `${active} [name="${name}"]`,
      (el, value) => {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      },
      value
    );
  for (const c of catalog) {
    const model = await compileModel(c);
    await go(c.slug);
    assert.equal(await page.$$eval(`${active} [name="example"]`, (els) => els.length), 0);
    assert.deepEqual(
      await page.$$eval(`${active} .playground-controls select`, (els) =>
        els
          .filter(
            (el) =>
              el.options.length < 2 || [...el.options].some((o) => o.textContent === 'As authored')
          )
          .map((el) => el.name)
      ),
      [],
      c.slug
    );
    for (const scope of model.scopes)
      for (const prop of scope.props) {
        const name = scope.id === 'root' ? `prop:${prop.attr}` : `prop:${scope.id}:${prop.attr}`;
        for (const value of prop.values) {
          await select(name, encodeValue(value));
          if (c.slug === 'toast') continue;
          const actual = await page.$eval(
            `${active} .playground-demo`,
            (el, selector, attr) => el.querySelector(selector)?.getAttribute(attr),
            scope.target,
            prop.attr
          );
          assert.equal(actual, value, `${c.slug}/${scope.id}/${prop.attr}/${value}`);
        }
        await select(name, encodeValue(prop.default));
      }
    for (const scope of model.scopes.filter((s) => s.states.length > 1)) {
      const name = scope.id === 'root' ? 'state' : `state:${scope.id}`;
      for (const state of scope.states) {
        await select(name, state);
        if (c.slug === 'toast') continue;
        const attr = /focus/i.test(state)
          ? 'data-demo-focus'
          : /disabled/i.test(state)
            ? 'disabled'
            : state === 'Hover'
              ? 'data-demo-hover'
              : null;
        if (attr) {
          const actual = await page.$eval(
            `${active} .playground-demo`,
            (el, selector, attr) => {
              const target = el.querySelector(selector);
              return (
                !!target &&
                (target.hasAttribute(attr) ||
                  (attr === 'disabled' && target.getAttribute('aria-disabled') === 'true'))
              );
            },
            scope.focus || scope.target,
            attr
          );
          assert(actual, `${c.slug}/${scope.id}/${state}: state reaches its owner`);
        }
      }
      await select(name, scope.states[0]);
    }
  }
  await go('avatar');
  assert.equal(await page.$$eval(`${active} [name="state"]`, (els) => els.length), 0);
  await select('slot', 'initials');
  assert.equal(
    await page.$eval(`${active} .avatar-fallback`, (el) => getComputedStyle(el).display),
    'flex'
  );
  await go('button-group');
  assert.equal(await page.$$eval(`${active} [name="state"]`, (els) => els.length), 0);
  await select('instance:part-button', '1');
  await select('state:part-button', 'Focus');
  assert.deepEqual(
    await page.$$eval(`${active} .btn-group .btn`, (els) =>
      els.map((el) => el.hasAttribute('data-demo-focus'))
    ),
    [false, true, false]
  );
  await go('button');
  await select('prop:data-icon-only', '');
  for (const [size, expected] of [
    ['', 36],
    ['sm', 32]
  ]) {
    await select('prop:data-size', size);
    assert.deepEqual(
      await page.$eval(`${active} .playground-demo .btn`, (el) => [
        el.offsetWidth,
        el.offsetHeight
      ]),
      [expected, expected]
    );
  }
  await page.$eval(`${active} form.playground-controls`, (el) => el.reset());
  await go('resizable');
  await select('prop:data-orientation', 'horizontal');
  assert.equal(
    await page.$eval(`${active} .resizable-group`, (el) => getComputedStyle(el).flexDirection),
    'column'
  );
  await page.click(`${active} .resizable-handle`);
  const split = await page.$eval(`${active} .resizable-handle`, (el) =>
    Number(el.getAttribute('aria-valuenow'))
  );
  await page.keyboard.press('ArrowDown');
  assert(
    (await page.$eval(`${active} .resizable-handle`, (el) =>
      Number(el.getAttribute('aria-valuenow'))
    )) > split
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
  await set('value:0', '25');
  assert.equal(await page.$eval(`${active} progress`, (el) => el.value), 25);
  await go('composer');
  await page.$eval(`${active} .composer-input`, (el) => (el.value = 'Keep this draft'));
  await select('width', '320px');
  assert.equal(await page.$eval(`${active} .composer-input`, (el) => el.value), 'Keep this draft');
  await go('image');
  await select('prop:data-ratio', '16/9');
  assert(
    Math.abs(
      (await page.$eval(`${active} .image > img`, (el) => el.offsetWidth / el.offsetHeight)) -
        16 / 9
    ) < 0.02
  );
  console.log(
    'PASS every modeled property and state, nested ownership, square button sizes, compound values and resize behavior'
  );
}
