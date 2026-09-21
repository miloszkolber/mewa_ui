import assert from 'node:assert/strict';

// Call after the distribution build. The server must expose /blank and /dist/.
export async function inspectRuntimeCompletion(page, baseUrl) {
  const errors = [];
  const onError = (error) => errors.push(error.message);
  page.on('pageerror', onError);
  const fresh = () => page.goto(`${baseUrl}/blank`);
  const active = () => page.evaluate(() => document.activeElement.id);
  const checks = [];
  try {
    for (const order of ['group-first', 'toolbar-first']) {
      await fresh();
      await page.evaluate(async (order) => {
        document.body.innerHTML = `<button id="before">Before</button>
          <div class="toolbar" role="toolbar" aria-label="Formatting">
            <div class="toggle-group" role="group" aria-label="Style" data-type="multiple">
              <button id="bold" class="toggle" aria-pressed="false">Bold</button>
              <button id="italic" class="toggle" aria-pressed="false" tabindex="-1">Italic</button>
            </div><button disabled>Unavailable</button><button id="clear">Clear</button>
          </div><button id="after">After</button>`;
        const { behavior: group } = await import('/dist/mewa-ui/controllers/toggle-group.js');
        const { behavior: toolbar } = await import('/dist/mewa-ui/controllers/toolbar.js');
        window.completionBehaviors = order === 'group-first' ? [group, toolbar] : [toolbar, group];
        window.completionBehaviors.forEach((behavior) => behavior.enhance(document));
        document.querySelector('#before').focus();
      }, order);
      await page.keyboard.press('Tab');
      assert.equal(await active(), 'bold');
      await page.keyboard.press('ArrowRight');
      assert.equal(await active(), 'italic', `${order}: one arrow moves once`);
      await page.keyboard.press(' ');
      assert.equal(
        await page.$eval('#italic', (item) => item.getAttribute('aria-pressed')),
        'true'
      );
      await page.keyboard.press('ArrowRight');
      assert.equal(await active(), 'clear', `${order}: arrows leave nested groups`);
      await page.keyboard.press('Home');
      assert.equal(await active(), 'bold');
      await page.keyboard.press('End');
      assert.equal(await active(), 'clear');
      await page.keyboard.press('Tab');
      assert.equal(await active(), 'after', 'Tab leaves the composite');
      await page.evaluate(() => {
        document.querySelector('.toolbar').setAttribute('aria-orientation', 'vertical');
        document.querySelector('#bold').focus();
      });
      await page.keyboard.press('ArrowDown');
      assert.equal(await active(), 'italic', 'toolbar orientation owns nested arrows');
      assert.equal(await page.$$eval('.toolbar [tabindex="0"]', (items) => items.length), 1);
      const restored = await page.evaluate(() => {
        const inserted = document.createElement('button');
        inserted.id = 'inserted';
        inserted.className = 'toggle';
        inserted.textContent = 'Inserted';
        document.querySelector('.toggle-group').append(inserted);
        window.completionBehaviors.forEach((behavior) => behavior.enhance(inserted));
        const insertedTabindex = inserted.getAttribute('tabindex');
        document.querySelector('#clear').setAttribute('tabindex', '-2');
        [...window.completionBehaviors].reverse().forEach((behavior) => behavior.destroy(document));
        return {
          insertedTabindex,
          restored: ['bold', 'italic', 'clear', 'inserted'].map((id) =>
            document.getElementById(id).getAttribute('tabindex')
          ),
          pressed: document.querySelector('#italic').getAttribute('aria-pressed')
        };
      });
      assert.deepEqual(restored, {
        insertedTabindex: '-1',
        restored: [null, '-1', '-2', null],
        pressed: 'true'
      });
      checks.push(`toolbar composition and cleanup (${order})`);
    }

    await fresh();
    const packagedToolbar = await page.evaluate(async () => {
      document.body.innerHTML = `<div class="toolbar" role="toolbar" aria-label="Formatting">
        <div class="toggle-group" role="group" aria-label="Style" data-type="multiple">
          <button class="toggle" aria-pressed="false">Bold</button>
        </div></div>`;
      const { behavior } = await import('/dist/mewa-ui/components/toolbar.js');
      behavior.enhance(document);
      document.querySelector('button').click();
      const pressed = document.querySelector('button').getAttribute('aria-pressed');
      behavior.destroy(document);
      return pressed;
    });
    assert.equal(packagedToolbar, 'true', 'packaged toolbar includes grouped selection behavior');
    checks.push('packaged toolbar loads its documented Toggle Group dependency');

    await fresh();
    const groupResult = await page.evaluate(async () => {
      document.body.innerHTML = `<div class="toggle-group" role="group" aria-label="View">
        <button class="toggle" aria-pressed="true">One</button>
        <button class="toggle" aria-pressed="false" aria-disabled="true">Unavailable</button>
        <button class="toggle" aria-pressed="false" tabindex="-1">Two</button>
      </div>`;
      const { behavior } = await import('/dist/mewa-ui/controllers/toggle-group.js');
      behavior.enhance(document);
      const buttons = [...document.querySelectorAll('button')];
      buttons[0].focus();
      buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      const skipped = document.activeElement === buttons[2];
      buttons[1].click();
      const disabledPressed = buttons[1].getAttribute('aria-pressed');
      behavior.destroy(document);
      behavior.destroy(document);
      return { skipped, disabledPressed, restored: buttons.map((b) => b.getAttribute('tabindex')) };
    });
    assert.deepEqual(groupResult, {
      skipped: true,
      disabledPressed: 'false',
      restored: [null, null, '-1']
    });
    checks.push('standalone toggle group disabled movement and idempotent cleanup');

    await fresh();
    await page.evaluate(async () => {
      document.body.innerHTML = `<button id="open" data-command-palette-trigger="commands">Commands</button>
        <button id="other">Other</button>
        <dialog class="command-palette" id="commands" aria-label="Commands">
          <input class="command-palette-input" aria-label="Find command">
          <div class="command-palette-list"><div class="command-palette-group">
            <p class="command-palette-group-heading">Actions</p>
            <button class="command-palette-item" id="alpha">Alpha</button>
            <button class="command-palette-item" disabled>Unavailable</button>
            <button class="command-palette-item" id="beta">Beta</button>
          </div></div><p class="command-palette-empty" role="status" hidden>No commands</p>
        </dialog>`;
      const { behavior } = await import('/dist/mewa-ui/controllers/command-palette.js');
      window.completionPalette = behavior;
      window.completionActivations = 0;
      document
        .querySelector('#beta')
        .addEventListener('click', () => window.completionActivations++);
      behavior.enhance(document);
    });
    await page.$eval('dialog', (dialog) => {
      dialog.addEventListener('beforetoggle', (event) => event.preventDefault(), { once: true });
    });
    await page.click('#open');
    assert.equal(await page.$eval('dialog', (dialog) => dialog.open), false);
    assert.equal(
      await page.$eval('input', (input) => input.getAttribute('aria-expanded')),
      'false',
      'canceled native opening does not expose an expanded combobox'
    );
    await page.click('#open');
    const semantics = await page.evaluate(() => {
      const input = document.querySelector('input');
      const list = document.getElementById(input.getAttribute('aria-controls'));
      const group = list.querySelector('.command-palette-group');
      return {
        role: input.getAttribute('role'),
        expanded: input.getAttribute('aria-expanded'),
        autocomplete: input.getAttribute('aria-autocomplete'),
        list: list.getAttribute('role'),
        group: group.getAttribute('role'),
        heading: document.getElementById(group.getAttribute('aria-labelledby')).textContent,
        option: document.querySelector('#alpha').getAttribute('role'),
        active: input.getAttribute('aria-activedescendant'),
        focused: document.activeElement === input,
        stops: [...list.querySelectorAll('button')].map((button) => button.tabIndex)
      };
    });
    assert.deepEqual(semantics, {
      role: 'combobox',
      expanded: 'true',
      autocomplete: 'list',
      list: 'listbox',
      group: 'group',
      heading: 'Actions',
      option: 'option',
      active: 'alpha',
      focused: true,
      stops: [-1, -1, -1]
    });
    await page.keyboard.press('ArrowDown');
    assert.equal(
      await page.$eval('input', (input) => input.getAttribute('aria-activedescendant')),
      'beta'
    );
    await page.keyboard.type('zzzz');
    assert.equal(
      await page.$eval('input', (input) => input.getAttribute('aria-activedescendant')),
      null
    );
    assert.equal(await page.$eval('.command-palette-empty', (empty) => empty.hidden), false);
    await page.$eval('input', (input) => {
      input.value = 'Beta';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true })
      );
    });
    assert.equal(await page.evaluate(() => window.completionActivations), 0);
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      () => !document.querySelector('dialog').open && document.activeElement.id === 'open'
    );
    assert.equal(await page.evaluate(() => window.completionActivations), 1);
    await page.focus('#other');
    await page.keyboard.down('Control');
    await page.keyboard.press('k');
    await page.keyboard.up('Control');
    await page.keyboard.press('Escape');
    await page.waitForFunction(
      () => !document.querySelector('dialog').open && document.activeElement.id === 'other'
    );
    assert.equal(
      await page.$eval('input', (input) => input.getAttribute('aria-expanded')),
      'false'
    );
    const paletteCleanup = await page.evaluate(() => {
      document.querySelector('input').setAttribute('aria-autocomplete', 'both');
      window.completionPalette.destroy(document);
      return {
        role: document.querySelector('input').getAttribute('role'),
        autocomplete: document.querySelector('input').getAttribute('aria-autocomplete'),
        listId: document.querySelector('.command-palette-list').id,
        option: document.querySelector('#alpha').getAttribute('role'),
        tabindex: document.querySelector('#alpha').getAttribute('tabindex'),
        selected: document.querySelector('#alpha').getAttribute('aria-selected')
      };
    });
    assert.deepEqual(paletteCleanup, {
      role: null,
      autocomplete: 'both',
      listId: '',
      option: null,
      tabindex: null,
      selected: null
    });
    checks.push(
      'palette semantics, filtering, composition, native close, focus restoration and cleanup'
    );

    await fresh();
    await page.evaluate(async () => {
      document.body.innerHTML = `<button id="open" data-sheet-trigger="settings">Settings</button>
        <dialog class="sheet" id="settings" aria-label="Settings"><button>First</button>
          <input id="preferred" aria-label="Name" autofocus><button data-sheet-close>Close</button>
        </dialog>`;
      const { behavior } = await import('/dist/mewa-ui/controllers/sheet.js');
      behavior.enhance(document);
    });
    await page.click('#open');
    assert.equal(await active(), 'preferred', 'native autofocus is not replaced by surface focus');
    assert.equal(await page.$eval('dialog', (dialog) => dialog.getAttribute('tabindex')), null);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.activeElement.id === 'open');
    await page.evaluate(() => {
      const input = document.querySelector('input');
      input.removeAttribute('autofocus');
      const heading = document.createElement('h2');
      heading.id = 'context';
      heading.textContent = 'Read this first';
      heading.tabIndex = -1;
      heading.autofocus = true;
      document.querySelector('dialog').prepend(heading);
    });
    await page.click('#open');
    assert.equal(await active(), 'context', 'authors can choose a static focus target');
    await page.click('[data-sheet-close]');
    await page.waitForFunction(() => document.activeElement.id === 'open');
    checks.push('sheet native control and heading autofocus, Escape and close button');

    await fresh();
    const dropdownResult = await page.evaluate(async () => {
      document.body.innerHTML = `<button id="trigger" data-dropdown-menu-trigger="actions" aria-expanded="false">Actions</button>
        <div id="actions" popover role="menu"><button role="menuitem" tabindex="-1">Action</button></div>`;
      const trigger = document.querySelector('#trigger');
      const menu = document.querySelector('#actions');
      trigger.style.anchorName = '--authored-trigger';
      menu.style.positionAnchor = '--authored-menu';
      const { behavior } = await import('/dist/mewa-ui/controllers/dropdown-menu.js');
      behavior.enhance(document);
      const opened = new Promise((resolve) =>
        menu.addEventListener('toggle', resolve, { once: true })
      );
      trigger.click();
      await opened;
      const expanded = trigger.getAttribute('aria-expanded');
      const replacement = menu.cloneNode(true);
      replacement.style.positionAnchor = '--replacement';
      menu.replaceWith(replacement);
      behavior.enhance(replacement);
      const oldAnchor = menu.style.positionAnchor;
      const replacementAnchor = replacement.style.positionAnchor;
      behavior.destroy(document);
      behavior.destroy(document);
      const restored = [
        trigger.style.anchorName,
        replacement.style.positionAnchor,
        trigger.getAttribute('aria-expanded')
      ];
      behavior.enhance(document);
      trigger.style.anchorName = '--application';
      replacement.style.positionAnchor = '--application-target';
      trigger.setAttribute('aria-expanded', 'true');
      behavior.destroy(document);
      return {
        expanded,
        oldAnchor,
        replacementAnchor,
        restored,
        preserved: [
          trigger.style.anchorName,
          replacement.style.positionAnchor,
          trigger.getAttribute('aria-expanded')
        ]
      };
    });
    assert.deepEqual(dropdownResult, {
      expanded: 'true',
      oldAnchor: '--authored-menu',
      replacementAnchor: '--dropdown-menu-actions',
      restored: ['--authored-trigger', '--replacement', 'false'],
      preserved: ['--application', '--application-target', 'true']
    });
    checks.push(
      'dropdown native open, target replacement, authored cleanup and application ownership'
    );

    await fresh();
    const shortcutResult = await page.evaluate(async () => {
      const { behavior } = await import('/dist/mewa-ui/controllers/sidebar.js');
      behavior.enhance(document);
      const press = (target = document.body, extra = {}) => {
        const event = new KeyboardEvent('keydown', {
          key: 'b',
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
          ...extra
        });
        target.dispatchEvent(event);
        return event.defaultPrevented;
      };
      const absent = press();
      document.body.innerHTML =
        '<aside class="app-sidebar" data-state="expanded"></aside><input><div contenteditable="true"><span>Editor</span></div>';
      behavior.enhance(document);
      const input = press(document.querySelector('input'));
      const editor = press(document.querySelector('span'));
      const composing = press(document.body, { isComposing: true });
      const handled = press();
      const state = document.querySelector('aside').dataset.state;
      behavior.destroy(document);
      const destroyed = press();
      return { absent, input, editor, composing, handled, state, destroyed };
    });
    assert.deepEqual(shortcutResult, {
      absent: false,
      input: false,
      editor: false,
      composing: false,
      handled: true,
      state: 'collapsed',
      destroyed: false
    });
    checks.push('sidebar shortcut only consumes usable non-editing commands');
    assert.deepEqual(errors, [], 'no browser page errors');
    for (const check of checks) console.log(`PASS ${check}`);
    return checks;
  } finally {
    page.off('pageerror', onError);
  }
}
