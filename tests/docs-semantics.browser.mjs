import assert from 'node:assert/strict';

const active = '.component-playground:not([hidden])';
const demo = `${active} .playground-demo`;
const inspector = `${active} .playground-controls`;
const control = (name) => `${inspector} [name="${name}"]`;

// Let native default actions, controller observers and inspector readback finish.
// Do not hide a broken state behind a fixed wall-clock delay.
const settle = (page) =>
  page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  );

async function switchTo(page, name, checked) {
  const selector = control(name);
  assert.equal(await page.$$eval(selector, (els) => els.length), 1, `${name}: one public control`);
  if ((await page.$eval(selector, (el) => el.checked)) !== checked) await page.click(selector);
  await settle(page);
  assert.equal(
    await page.$eval(selector, (el) => el.checked),
    checked,
    `${name}: inspector readback`
  );
}

async function replaceText(page, selector, text) {
  await page.click(selector);
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(text);
  await settle(page);
}

async function sameNode(handle, selector, message) {
  try {
    assert.equal(
      await handle.evaluate(
        (el, selector) => el.isConnected && el === document.querySelector(selector),
        selector
      ),
      true,
      message
    );
  } finally {
    await handle.dispose();
  }
}

const values = (page, selector) => page.$$eval(selector, (els) => els.map((el) => el.value));
const pressed = (page) =>
  page.$$eval(`${demo} .toggle`, (els) => els.map((el) => el.getAttribute('aria-pressed')));

// The native segmented date editor has no text selection API. Enter its three
// segments with real keys instead of assigning value or dispatching input.
async function enterDate(page, selector) {
  await page.focus(selector);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type('2026');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.type('10');
  await page.keyboard.type('5');
  await page.keyboard.press('Tab');
  await settle(page);
  assert.equal(
    await page.$eval(selector, (el) => el.value),
    '2026-10-05',
    'native date entry reached a complete date'
  );
}

async function groupDisabled(page, slug, part, child) {
  const selector = `${demo} ${child}`;
  const authored = await page.$$eval(selector, (els) =>
    els.map((el) => el.hasAttribute('disabled'))
  );
  assert.deepEqual(authored, [false, false, false], `${slug}: canonical children start enabled`);
  assert.equal(
    await page.$$eval(
      `${inspector} [name^="prop:part-${part}:"][name$=":disabled"]`,
      (els) => els.length
    ),
    0,
    `${slug}: root owns disabled without duplicate child controls`
  );
  if (part === 'toggle') await switchTo(page, 'prop:part-toggle:1:pressed', true);
  const selection = await pressed(page);
  await switchTo(page, 'prop:disabled', true);
  assert.deepEqual(
    await page.$$eval(selector, (els) => els.map((el) => el.matches(':disabled'))),
    [true, true, true],
    `${slug}: root disables native children`
  );

  // Observe actual click delivery without giving plain Button Group buttons an
  // invented selection model. This listener does not change component state.
  const clicks = await page.evaluateHandle((selector) => {
    const result = { count: 0 };
    document
      .querySelectorAll(selector)
      .forEach((el) => el.addEventListener('click', () => result.count++));
    return result;
  }, selector);
  for (const button of await page.$$(selector)) {
    await button.click();
    await button.dispose();
  }
  await settle(page);
  assert.equal(
    await clicks.evaluate((result) => result.count),
    0,
    `${slug}: disabled buttons suppress native clicks`
  );
  await clicks.dispose();
  assert.deepEqual(await pressed(page), selection, `${slug}: disabled clicks preserve selection`);
  await switchTo(page, 'prop:disabled', false);
  assert.deepEqual(
    await page.$$eval(selector, (els) => els.map((el) => el.matches(':disabled'))),
    authored,
    `${slug}: releasing root restores individual authored state`
  );
  if (part === 'toggle') {
    await page.click(`${selector}:last-child`);
    await settle(page);
    assert.deepEqual(
      await pressed(page),
      ['false', 'false', 'true'],
      'enabled toggle selection works again'
    );
    assert.equal(await page.$eval(control('prop:part-toggle:2:pressed'), (el) => el.checked), true);
  } else {
    const enabledClicks = await page.evaluateHandle((selector) => {
      const result = { count: 0 };
      document.querySelector(selector).addEventListener('click', () => result.count++);
      return result;
    }, `${selector}:last-child`);
    await page.click(`${selector}:last-child`);
    assert.equal(
      await enabledClicks.evaluate((result) => result.count),
      1,
      'enabled Button Group delivers native clicks again'
    );
    await enabledClicks.dispose();
  }
}

async function popoverState(page, open) {
  await page.waitForFunction(
    (demo, inspector, open) => {
      const content = document.querySelector(`${demo} .combobox-content`);
      return (
        content?.matches(':popover-open') === open &&
        document.querySelector(`${demo} .combobox-trigger`)?.getAttribute('aria-expanded') ===
          String(open) &&
        document.querySelector(`${demo} .combobox-search-input`)?.getAttribute('aria-expanded') ===
          String(open) &&
        document.querySelector(`${inspector} [name="prop:open"]`)?.checked === open
      );
    },
    { timeout: 5000 },
    demo,
    inspector,
    open
  );
  if (open)
    await page.waitForSelector(`${demo} .combobox-search-input`, { visible: true, timeout: 5000 });
}

async function chooseFramework(page) {
  await page.click(`${demo} .combobox-trigger`);
  await page.waitForSelector(`${demo} .combobox-content:popover-open`);
  await page.waitForSelector(`${demo} .combobox-search-input`, { visible: true, timeout: 5000 });
  await page.type(`${demo} .combobox-search-input`, 'Svelte');
  await page.waitForSelector(`${demo} [role="option"][data-value="sveltekit"]`, {
    visible: true,
    timeout: 5000
  });
  await page.click(`${demo} [role="option"][data-value="sveltekit"]`);
  await page.waitForFunction(
    (demo) => !document.querySelector(`${demo} .combobox-content`)?.matches(':popover-open'),
    {},
    demo
  );
}

async function fileSelection(page, property) {
  const selector = `${demo} input[type="file"]`;
  // Puppeteer's file chooser requires filesystem paths. DataTransfer is the
  // fixture exception: use inline text, and permit that MIME type on the image
  // upload example so the test exercises accepted-file preservation, not rejection.
  await page.$eval(selector, (input) => {
    input.accept = 'text/plain';
    const transfer = new DataTransfer();
    transfer.items.add(
      new File(['A pending upload\n'], 'draft.txt', { type: 'text/plain', lastModified: 1 })
    );
    input.files = transfer.files;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await settle(page);
  const readFile = () =>
    page.$eval(selector, async (input) =>
      Promise.all(
        [...input.files].map(async (file) => ({
          name: file.name,
          type: file.type,
          text: await file.text()
        }))
      )
    );
  const expected = [{ name: 'draft.txt', type: 'text/plain', text: 'A pending upload\n' }];
  assert.deepEqual(await readFile(), expected, 'fixture is an accepted native file selection');
  const node = await page.$(selector);
  await switchTo(page, `prop:${property}`, true);
  assert.equal(
    await page.$eval(
      selector,
      (input, property) =>
        property === 'required' ? input.required : input.getAttribute('aria-invalid') === 'true',
      property
    ),
    true,
    'unrelated inspector property reaches the native input'
  );
  assert.deepEqual(
    await readFile(),
    expected,
    `${property}: native FileList survives unrelated edit`
  );
  await sameNode(node, selector, `${property}: file input identity survives unrelated edit`);
  if (property === 'invalid') {
    await switchTo(page, 'prop:disabled', true);
    assert.equal(await page.$eval(`${demo} .file-upload-remove`, (el) => el.disabled), true);
    assert.deepEqual(await readFile(), expected, 'disabling upload retains selected file');
    await switchTo(page, 'prop:disabled', false);
    assert.equal(await page.$eval(`${demo} .file-upload-remove`, (el) => el.disabled), false);
  }
  await switchTo(page, `prop:${property}`, false);
  assert.deepEqual(
    await readFile(),
    expected,
    'file remains after removing the unrelated property'
  );
}

async function svgExport(page) {
  const result = await page.$eval(active, (section) => {
    const live = [...section.querySelectorAll('.playground-demo svg path')].map((path) =>
      path.getAttribute('d')
    );
    const exported = new DOMParser().parseFromString(
      section.querySelector('.playground-code').textContent,
      'text/html'
    );
    return {
      live,
      exported: [...exported.querySelectorAll('svg path')].map((path) => path.getAttribute('d'))
    };
  });
  assert(
    result.live.length > 0 && result.live.every(Boolean),
    'canonical example contains authored SVG paths'
  );
  assert.deepEqual(
    result.exported,
    result.live,
    'serializer preserves authored SVG geometry even on ri-* SVG elements'
  );
}

/** Public playground regressions, independent of the generated model inventory. */
export async function inspectDocsSemantics(page, baseUrl) {
  const errors = [];
  const failures = [];
  const originalViewport = page.viewport();
  const onError = (error) => errors.push(error.message);
  page.on('pageerror', onError);
  await page.setViewport({ width: 1440, height: 1000 });
  const check = async (slug, name, run) => {
    try {
      // Full navigation gives each check the ORIGINAL authored state, not the
      // current values of another check or a reset implementation under test.
      await page.goto('about:blank');
      const response = await page.goto(
        `${baseUrl.replace(/\/+$/, '')}/docs/preview.html#preview-${slug}`,
        { waitUntil: 'domcontentloaded' }
      );
      assert(response?.ok(), `${slug}: preview response succeeds`);
      await page.waitForSelector(`${active}[data-component="${slug}"] .playground-demo > *`);
      await page.waitForSelector('body.enhanced');
      await settle(page);
      await run();
      console.log(`PASS docs semantics: ${name}`);
    } catch (error) {
      failures.push(new Error(`${name}: ${error.message}`, { cause: error }));
    }
  };
  try {
    await check('toggle', 'pressed property and native toggle readback', async () => {
      assert.equal(await page.$$eval(control('prop:checked'), (els) => els.length), 0);
      await switchTo(page, 'prop:pressed', true);
      assert.deepEqual(await pressed(page), ['true']);
      await page.click(`${demo} .toggle`);
      await settle(page);
      assert.deepEqual(await pressed(page), ['false']);
      assert.equal(await page.$eval(control('prop:pressed'), (el) => el.checked), false);
      await page.focus(`${demo} .toggle`);
      await page.keyboard.press(' ');
      await settle(page);
      assert.deepEqual(await pressed(page), ['true']);
      assert.equal(await page.$eval(control('prop:pressed'), (el) => el.checked), true);
    });
    await check('button-group', 'Button Group disabled propagation and restoration', () =>
      groupDisabled(page, 'Button Group', 'button', '.btn-group .btn')
    );
    await check('toggle-group', 'Toggle Group disabled propagation and selection', () =>
      groupDisabled(page, 'Toggle Group', 'toggle', '.toggle-group .toggle')
    );
    await check('field', 'Field required validates the native input', async () => {
      const input = `${demo} .field input`;
      await replaceText(page, input, '');
      await switchTo(page, 'prop:required', true);
      assert.deepEqual(
        await page.$eval(input, (el) => [
          el.required,
          el.validity.valueMissing,
          el.checkValidity()
        ]),
        [true, true, false]
      );
      await page.type(input, 'reader@example.com');
      assert.equal(await page.$eval(input, (el) => el.checkValidity()), true);
      await switchTo(page, 'prop:required', false);
      await replaceText(page, input, '');
      assert.equal(await page.$eval(input, (el) => el.checkValidity()), true);
    });
    await check('field', 'Field disabled blocks actual input', async () => {
      const input = `${demo} .field input`;
      await page.type(input, 'kept@example.com');
      await switchTo(page, 'prop:disabled', true);
      assert.equal(await page.$eval(input, (el) => el.matches(':disabled')), true);
      await page.click(input);
      await page.keyboard.type('blocked');
      assert.equal(await page.$eval(input, (el) => el.value), 'kept@example.com');
      await switchTo(page, 'prop:disabled', false);
      await replaceText(page, input, 'restored@example.com');
      assert.equal(await page.$eval(input, (el) => el.value), 'restored@example.com');
    });
    await check('tag-input', 'Tag Input readonly blocks draft edits and removal', async () => {
      const draft = `${demo} .tag-input-control`;
      const committed = await values(page, `${demo} .tag-input-fallback`);
      await page.type(draft, 'Pending');
      await switchTo(page, 'prop:readonly', true);
      assert.equal(await page.$eval(draft, (el) => el.readOnly), true);
      await replaceText(page, draft, 'blocked');
      await page.keyboard.press('Enter');
      await page.click(`${demo} .tag-input-remove`);
      await settle(page);
      assert.deepEqual(await values(page, draft), ['Pending']);
      assert.deepEqual(await values(page, `${demo} .tag-input-fallback`), committed);
      await switchTo(page, 'prop:readonly', false);
      await replaceText(page, draft, 'New skill');
      await page.keyboard.press('Enter');
      await settle(page);
      assert.match((await values(page, `${demo} .tag-input-fallback`))[0], /New skill/);
      await page.click(`${demo} .tag-input-remove`);
      await settle(page);
      assert.doesNotMatch((await values(page, `${demo} .tag-input-fallback`))[0], /Accessibility/);
    });
    await check('time-field', 'Time Field readonly blocks stepping and period edits', async () => {
      const hour = `${demo} [data-time-part="hour"]`;
      const period = `${demo} [data-time-part="period"]`;
      const fields = `${demo} input, ${demo} select`;
      await page.focus(hour);
      await page.keyboard.press('ArrowUp');
      await settle(page);
      assert.deepEqual(await values(page, hour), ['10'], 'enabled hour steps before readonly');
      await switchTo(page, 'prop:readonly', true);
      const before = await values(page, fields);
      assert.equal(await page.$eval(hour, (el) => el.readOnly), true);
      await page.focus(hour);
      await page.keyboard.press('ArrowUp');
      assert.deepEqual(await values(page, fields), before, 'readonly rejects the first step');
      await page.keyboard.type('11');
      await page.click(period);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('KeyP');
      await page.keyboard.press('Tab');
      await settle(page);
      assert.deepEqual(
        await values(page, fields),
        before,
        'readonly keeps segments, period and submitted time'
      );
      await switchTo(page, 'prop:readonly', false);
      await page.focus(period);
      await page.keyboard.press('End');
      await page.keyboard.press('Tab');
      await settle(page);
      assert.deepEqual(await values(page, period), ['PM'], 'period becomes editable again');
    });
    await check('date-range-picker', 'Range readonly protects both native inputs', async () => {
      const inputs = `${demo} .date-range-input`;
      for (const part of ['start', 'end']) await enterDate(page, `${demo} [data-range-${part}]`);
      const before = await values(page, inputs);
      await switchTo(page, 'prop:readonly', true);
      assert.deepEqual(await page.$$eval(inputs, (els) => els.map((el) => el.readOnly)), [
        true,
        true
      ]);
      for (const input of await page.$$(inputs)) {
        await input.focus();
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('Backspace');
        await page.keyboard.type('12');
        await input.dispose();
      }
      await settle(page);
      assert.deepEqual(await values(page, inputs), before);
    });
    await check('combobox', 'Inspector open is a native popover with readback', async () => {
      await switchTo(page, 'prop:open', true);
      await popoverState(page, true);
      await page.keyboard.press('Escape');
      await popoverState(page, false);
      await page.click(`${demo} .combobox-trigger`);
      await popoverState(page, true);
      await page.keyboard.press('Escape');
      await popoverState(page, false);
      assert.equal(
        await page.$eval(`${demo} .combobox-trigger`, (el) => el === document.activeElement),
        true
      );
    });
    await check('combobox', 'Combobox selection and nodes survive invalid edit', async () => {
      await chooseFramework(page);
      const selectors = [
        '.combobox',
        '.combobox-trigger',
        '.combobox-search-input',
        '[data-combobox-input]',
        '[data-value="sveltekit"]'
      ].map((selector) => `${demo} ${selector}`);
      const nodes = await Promise.all(selectors.map((selector) => page.$(selector)));
      await switchTo(page, 'prop:invalid', true);
      assert.equal(
        await page.$eval(`${demo} .combobox-trigger`, (el) => el.getAttribute('aria-invalid')),
        'true'
      );
      assert.deepEqual(
        await values(page, `${demo} [data-combobox-input]`),
        ['sveltekit'],
        'submitted hidden value remains selected'
      );
      assert.equal(
        await page.$eval(
          `${demo} [data-combobox-input]`,
          (el) => Boolean(el.name) && el.type === 'hidden' && !el.matches(':disabled')
        ),
        true,
        'selected value remains a successful named form control'
      );
      assert.equal(
        await page.$eval(`${demo} .combobox-value`, (el) => el.textContent.trim()),
        'SvelteKit'
      );
      assert.deepEqual(
        await page.$$eval(`${demo} [role="option"][aria-selected="true"]`, (els) =>
          els.map((el) => el.dataset.value)
        ),
        ['sveltekit']
      );
      for (const [index, node] of nodes.entries())
        await sameNode(node, selectors[index], `combobox preserves ${selectors[index]} identity`);
      await page.click(`${demo} .combobox-trigger`);
      await popoverState(page, true);
      await page.keyboard.press('Escape');
      await popoverState(page, false);
    });
    await check('file-upload', 'File Upload selection survives invalid edit', () =>
      fileSelection(page, 'invalid')
    );
    await check('file-input', 'File Input selection survives required edit', () =>
      fileSelection(page, 'required')
    );
    await check('date-range-picker', 'Native reset restores ORIGINAL authored values', async () => {
      const inputs = `${demo} .date-range-input`;
      const original = await values(page, inputs);
      assert.deepEqual(original, ['', ''], 'canonical dates start empty');
      for (const part of ['start', 'end']) await enterDate(page, `${demo} [data-range-${part}]`);
      const entered = await values(page, inputs);
      await switchTo(page, 'prop:invalid', true);
      assert.deepEqual(
        await values(page, inputs),
        entered,
        'unrelated property does not erase entered dates'
      );
      await page.click(`${demo} button[type="reset"]`);
      await settle(page);
      assert.deepEqual(
        await values(page, inputs),
        original,
        'native reset baseline is not rewritten by property edits'
      );
      assert.deepEqual(
        await values(page, `${inspector} [name^="value:"]`),
        original,
        'native reset reads back into value inspectors'
      );
    });
    await check('tag-input', 'Canceled inspector reset preserves draft and nodes', async () => {
      const draft = `${demo} .tag-input-control`;
      await page.type(draft, 'Pending draft');
      await switchTo(page, 'prop:invalid', true);
      const node = await page.$(draft);
      const root = await page.$(`${demo} .tag-input`);
      const committed = await values(page, `${demo} .tag-input-fallback`);
      // A canceling application listener is required to exercise this failure
      // path; cancellation has no native input API. The reset itself is clicked.
      await page.$eval(inspector, (form) =>
        form.addEventListener('reset', (event) => event.preventDefault(), { once: true })
      );
      await page.click(`${inspector} button[type="reset"]`);
      await settle(page);
      assert.deepEqual(await values(page, draft), ['Pending draft']);
      assert.deepEqual(await values(page, `${demo} .tag-input-fallback`), committed);
      assert.equal(await page.$eval(control('prop:invalid'), (el) => el.checked), true);
      await sameNode(node, draft, 'canceled reset preserves draft input identity');
      await sameNode(root, `${demo} .tag-input`, 'canceled reset preserves component identity');
    });
    await check('button', 'All-off content cannot contradict the label switch', async () => {
      await page.click(control('prop:showLabel'));
      await settle(page);
      const state = await page.$eval(active, (section) => ({
        labelOn: section.querySelector('[name="prop:showLabel"]').checked,
        otherOn: ['showIconStart', 'showIconEnd', 'loading'].some(
          (name) => section.querySelector(`[name="prop:${name}"]`).checked
        ),
        text: section.querySelector('.playground-demo .btn').innerText.trim()
      }));
      assert.equal(state.otherOn, false, 'all-off fixture has no alternate content enabled');
      assert(
        state.labelOn || state.text === '',
        'all-off may be reconciled explicitly, but must not silently render a label while its switch is off'
      );
    });
    await check('button', 'Icon-only Button accessible name follows edited label', async () => {
      await switchTo(page, 'prop:showIconStart', true);
      await switchTo(page, 'prop:showLabel', false);
      await replaceText(page, control('content'), 'Save draft');
      assert.equal(await page.$eval(`${demo} .btn`, (el) => el.innerText.trim()), '');
      const named = await page.$('aria/Save draft[role="button"]');
      assert(named, 'browser accessibility tree exposes the edited label on the icon-only button');
      assert.equal(
        await named.evaluate((el, selector) => Boolean(el.closest(selector)), demo),
        true
      );
      await named.dispose();
    });
    await check('label', 'Text property can be cleared and re-entered', async () => {
      const editor = control('content');
      const label = `${demo} .label`;
      await replaceText(page, editor, '');
      assert.equal(await page.$eval(label, (el) => el.textContent), '');
      await replaceText(page, editor, 'Updated label');
      assert.equal(await page.$eval(label, (el) => el.textContent), 'Updated label');
      assert.match(
        await page.$eval(`${active} .playground-code`, (el) => el.textContent),
        /Updated label/
      );
    });
    await check('date-picker', 'Width edit preserves chosen date and navigated month', async () => {
      assert.equal(
        await page.$$eval(
          `${inspector} [name="prop:disabled"], ${inspector} [name="prop:invalid"]`,
          (els) => els.length
        ),
        0,
        'calendar does not expose unsupported root conditions'
      );
      const heading = `${demo} .date-picker-heading`;
      const original = await page.$eval(heading, (el) => el.textContent);
      await page.click(`${demo} [data-action="next-month"]`);
      await page.waitForFunction(
        (selector, original) => document.querySelector(selector)?.textContent !== original,
        {},
        heading,
        original
      );
      await page.click(`${demo} .date-picker-day:not([data-outside])[data-day="15"]`);
      await settle(page);
      const selected = `${demo} .date-picker-day[aria-selected="true"]`;
      const date = await page.$eval(selected, (el) => el.dataset.date);
      const month = await page.$eval(heading, (el) => el.textContent);
      const node = await page.$(`${demo} .date-picker`);
      await page.select(control('width'), '480px');
      await settle(page);
      assert.equal(await page.$eval(selected, (el) => el.dataset.date), date);
      assert.equal(await page.$eval(heading, (el) => el.textContent), month);
      await sameNode(node, `${demo} .date-picker`, 'width edit retains calendar controller owner');
    });
    for (const slug of ['combobox', 'toggle-group']) {
      await check(slug, `${slug} serializer preserves authored SVG paths`, () => svgExport(page));
    }
    assert.deepEqual(errors, [], 'docs semantic checks produce no page errors');
    if (failures.length)
      throw new AggregateError(failures, failures.map((error) => error.message).join('\n'));
  } finally {
    page.off('pageerror', onError);
    if (originalViewport) await page.setViewport(originalViewport);
  }
}
