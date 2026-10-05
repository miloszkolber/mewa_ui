import * as time from '../library/components/forms/time-field/time-field.js';
import * as number from '../library/components/forms/number-field/number-field.js';
import * as otp from '../library/components/forms/input-otp/input-otp.js';
import * as upload from '../library/components/forms/file-upload/file-upload.js';
import * as datePicker from '../library/components/forms/date-picker/date-picker.js';

// Serve the repository root, then import and call runFormsCompletion() in a browser.
// Source imports intentionally verify this boundary without regenerating packages.
export async function runFormsCompletion() {
  const results = [];
  const equal = (actual, expected, message) => {
    if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
  };
  const fire = (element, type) => element.dispatchEvent(new Event(type, { bubbles: true }));
  const task = () => new Promise((resolve) => setTimeout(resolve, 0));
  const press = (element, key) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    equal(event.defaultPrevented, true, `${key} is handled by the date grid`);
  };
  const assertGridFocus = (picker, expected, message) => {
    equal(document.activeElement, expected, `${message}: DOM focus`);
    const stops = [...picker.querySelectorAll('.date-picker-day')].filter(
      (cell) => cell.tabIndex === 0
    );
    equal(stops.length, 1, `${message}: one grid tab stop`);
    equal(stops[0], expected, `${message}: focused cell owns the tab stop`);
  };
  const test = async (name, html, module, check, prepare) => {
    const fixture = document.createElement('div');
    fixture.innerHTML = html;
    document.body.append(fixture);
    try {
      const authored = prepare?.(fixture);
      module.enhance(fixture);
      module.enhance(fixture);
      await check(fixture, authored);
      results.push({ name, passed: true });
    } catch (error) {
      results.push({ name, passed: false, error: error.message });
    } finally {
      module.destroy(fixture);
      fixture.remove();
    }
  };
  await test(
    'period emits one committed event and ignores disabled interaction',
    `<form><fieldset class="time-field"><legend>Time</legend>
      <input aria-label="Hour" data-time-part="hour" value="01">
      <input aria-label="Minute" data-time-part="minute" value="30">
      <select aria-label="Period" data-time-part="period"><option>AM</option><option>PM</option></select>
      <input type="hidden" name="time" data-time-part="value" disabled>
    </fieldset></form>`,
    time,
    async (fixture) => {
      const field = fixture.querySelector('fieldset');
      const period = fixture.querySelector('select');
      const value = fixture.querySelector('[type="hidden"]');
      const events = [];
      field.addEventListener('time-field:change', (event) => events.push(event.detail));
      period.value = 'PM';
      fire(period, 'input');
      fire(period, 'change');
      equal(events.length, 1, 'one select interaction');
      equal(events[0].source, 'change', 'committed source');
      equal(value.value, '13:30', 'canonical time');
      field.disabled = true;
      period.value = 'AM';
      fire(period, 'change');
      equal(events.length, 1, 'disabled group does not emit');
      equal(value.value, '13:30', 'disabled group does not synchronize');
      field.disabled = false;
      fixture.querySelector('form').reset();
      await task();
      equal(value.value, '01:30', 'reset synchronizes canonical value');
      equal(events.length, 1, 'reset stays silent');
    }
  );
  await test(
    'number steps emit only actual changes and respect native failure paths',
    `<div class="number-field"><input type="number" aria-label="Quantity" min="0" max="2" value="1">
      <button type="button" data-action="decrement">Decrease</button>
      <button type="button" data-action="increment">Increase</button></div>`,
    number,
    async (fixture) => {
      const input = fixture.querySelector('input');
      const increment = fixture.querySelector('[data-action="increment"]');
      let inputs = 0;
      let changes = 0;
      input.addEventListener('input', () => inputs++);
      input.addEventListener('change', () => changes++);
      increment.click();
      equal(input.value, '2', 'native step');
      equal(inputs, 1, 'one input event after repeated enhancement');
      equal(changes, 1, 'one change event');
      increment.click();
      equal(inputs, 1, 'bound emits no input');
      equal(changes, 1, 'bound emits no change');
      input.step = 'any';
      fixture.querySelector('[data-action="decrement"]').click();
      equal(input.value, '2', 'unsupported native step preserves value');
      equal(changes, 1, 'rejected step is silent');
      input.step = '1';
      input.readOnly = true;
      await Promise.resolve();
      equal(increment.disabled, true, 'readonly disables step action');
      input.readOnly = false;
      input.disabled = true;
      await Promise.resolve();
      equal(increment.disabled, true, 'disabled input disables step action');
      input.disabled = false;
      await Promise.resolve();
      equal(increment.disabled, false, 'reenabling restores step action');
      number.destroy(fixture);
      increment.click();
      equal(changes, 1, 'destroy removes step listeners');
      number.enhance(fixture);
      fixture.querySelector('[data-action="decrement"]').click();
      equal(input.value, '1', 'remount restores stepping');
      equal(changes, 2, 'remount owns one listener');
    }
  );
  await test(
    'number preserves authored disabled buttons',
    `<div class="number-field"><input type="number" aria-label="Quantity" value="1" disabled>
      <button type="button" data-action="decrement" disabled>Decrease</button>
      <button type="button" data-action="increment">Increase</button></div>`,
    number,
    async (fixture) => {
      const input = fixture.querySelector('input');
      input.disabled = false;
      await Promise.resolve();
      equal(fixture.querySelector('[data-action="decrement"]').disabled, true, 'authored disabled');
      equal(fixture.querySelector('[data-action="increment"]').disabled, false, 'managed disabled');
    }
  );
  await test(
    'OTP backspace and paste preserve immutable cells',
    `<fieldset data-input-otp><legend>Code</legend>
      <input class="input-otp-cell" aria-label="Digit 1" value="7" readonly>
      <input class="input-otp-cell" aria-label="Digit 2" value="">
    </fieldset>`,
    otp,
    async (fixture) => {
      const [first, second] = fixture.querySelectorAll('input');
      let changes = 0;
      fixture.addEventListener('input-otp:change', () => changes++);
      const backspace = () =>
        second.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Backspace',
            bubbles: true,
            cancelable: true
          })
        );
      backspace();
      equal(first.value, '7', 'readonly preceding value survives');
      first.readOnly = false;
      first.disabled = true;
      backspace();
      equal(first.value, '7', 'disabled preceding value survives');
      equal(changes, 0, 'blocked backspace is silent');
      first.disabled = false;
      first.readOnly = true;
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', '12');
      first.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true })
      );
      equal(first.value, '7', 'readonly paste preserves value');
      equal(second.value, '', 'readonly paste does not distribute');
      equal(changes, 0, 'blocked paste is silent');
      first.readOnly = false;
      backspace();
      equal(first.value, '', 'enabled preceding cell clears');
      equal(changes, 1, 'successful backspace emits once');
    }
  );
  await test(
    'file upload synchronizes existing Remove buttons with native disabled state',
    `<fieldset><div class="file-upload" data-file-upload>
      <label class="file-upload-dropzone">Files
        <input class="file-upload-input" type="file" name="files">
      </label>
      <ul class="file-upload-list" data-file-upload-list></ul>
      <p data-file-upload-status></p><p data-file-upload-error hidden></p>
    </div></fieldset>`,
    upload,
    async (fixture) => {
      const input = fixture.querySelector('[type="file"]');
      const transfer = new DataTransfer();
      transfer.items.add(new File(['example'], 'file.txt', { type: 'text/plain' }));
      input.files = transfer.files;
      fire(input, 'change');
      const remove = fixture.querySelector('.file-upload-remove');
      equal(Boolean(remove), true, 'selected file has a removal control');
      equal(remove.disabled, false, 'normal selection can be removed');
      input.disabled = true;
      await Promise.resolve();
      equal(remove.disabled, true, 'disabled native input removes keyboard removal target');
      equal(input.files.length, 1, 'disable keeps the selected file');
      input.disabled = false;
      await Promise.resolve();
      equal(remove.disabled, false, 'enabled input restores removal target');
      fixture.querySelector('fieldset').disabled = true;
      await Promise.resolve();
      equal(remove.disabled, true, 'disabled ancestor fieldset suppresses removal');
      fixture.querySelector('fieldset').disabled = false;
      await Promise.resolve();
      equal(remove.disabled, false, 'fieldset re-enable restores removal target');
    }
  );
  for (const interaction of [
    'initial render',
    'keyboard roving',
    'month render',
    'date selection'
  ]) {
    await test(
      `date picker restores same-count authored nodes after ${interaction}`,
      `<div class="date-picker">
        <button class="date-picker-nav" type="button" data-action="next-month" aria-label="Next month">Next</button>
        <div class="date-picker-heading"><span>Authored heading</span></div>
        <table class="date-picker-grid"><thead><tr><th>authored column</th></tr></thead><tbody><tr><td>authored cell</td></tr></tbody></table>
      </div>`,
      datePicker,
      async (fixture, authored) => {
        const picker = fixture.querySelector('.date-picker');
        const heading = picker.querySelector('.date-picker-heading');
        const grid = picker.querySelector('.date-picker-grid');
        equal(authored.gridChildren.length, 2, 'authored grid has two children');
        equal(grid.childNodes.length, 2, 'generated grid also has two children');
        equal(
          grid.querySelectorAll('[role="gridcell"]').length > 0,
          true,
          'grid renders day cells'
        );
        equal(grid.hasAttribute('role'), true, 'grid receives the grid role');
        equal(heading.hasAttribute('aria-live'), true, 'heading becomes a polite live region');
        equal(
          heading.textContent.includes('Authored heading'),
          false,
          'the rendered month replaces the authored heading while enhanced'
        );
        equal(grid.querySelectorAll('tbody').length, 1, 'module supplies the month body');

        if (interaction === 'keyboard roving') {
          const active = grid.querySelector('[tabindex="0"]');
          const cells = [...grid.querySelectorAll('.date-picker-day')];
          const next = cells[cells.indexOf(active) + 1];
          active.focus();
          press(active, 'ArrowRight');
          assertGridFocus(picker, next, 'roving');
        } else if (interaction === 'month render') {
          picker.querySelector('.date-picker-nav').click();
        } else if (interaction === 'date selection') {
          grid.querySelector('[data-day="15"]:not([data-outside])').click();
        }

        datePicker.destroy(fixture);
        datePicker.destroy(fixture);

        equal(grid.hasAttribute('role'), false, 'destroy removes the generated grid role');
        equal(grid.hasAttribute('aria-label'), false, 'destroy removes the generated grid label');
        equal(
          heading.hasAttribute('aria-live'),
          false,
          'destroy removes the generated live region'
        );
        equal(heading.textContent, 'Authored heading', 'destroy restores the authored heading');
        equal(grid.childNodes.length, authored.gridChildren.length, 'authored child count returns');
        for (const [index, child] of authored.gridChildren.entries())
          equal(grid.childNodes[index], child, 'authored grid node identity survives');
        equal(grid.querySelector('td'), authored.cell, 'authored descendant identity survives');
        equal(heading.firstChild, authored.headingChild, 'authored heading node identity survives');
        equal(
          grid.textContent.includes('authored cell'),
          true,
          'destroy restores the authored grid children'
        );

        // Re-enhancing the restored node has to work from the authored baseline.
        datePicker.enhance(fixture);
        equal(
          grid.querySelectorAll('[role="gridcell"]').length > 0,
          true,
          're-render after teardown'
        );
      },
      (fixture) => ({
        headingChild: fixture.querySelector('.date-picker-heading').firstChild,
        gridChildren: [...fixture.querySelector('.date-picker-grid').childNodes],
        cell: fixture.querySelector('td')
      })
    );
  }
  for (const destination of ['application region', 'document fragment']) {
    await test(
      `date picker does not reclaim authored heading or grid nodes reused in ${destination}`,
      `<div class="date-picker"><div class="date-picker-heading"><span data-reused-heading>Reused heading</span><span data-detached-heading>Detached heading</span></div>
        <table class="date-picker-grid"><thead><tr><th>Authored column</th></tr></thead><tbody><tr><td>Reused body</td></tr></tbody></table></div>
        <section data-application><table data-application-grid></table></section>`,
      datePicker,
      async (fixture, authored) => {
        const picker = fixture.querySelector('.date-picker');
        const heading = picker.querySelector('.date-picker-heading');
        const grid = picker.querySelector('.date-picker-grid');
        const fragment = document.createDocumentFragment();
        const headingParent =
          destination === 'document fragment'
            ? fragment
            : fixture.querySelector('[data-application]');
        const bodyParent =
          destination === 'document fragment'
            ? fragment
            : fixture.querySelector('[data-application-grid]');
        headingParent.append(authored.reusedHeading);
        bodyParent.append(authored.body);
        datePicker.destroy(fixture);
        datePicker.destroy(fixture);
        const assertReusedNodes = () => {
          equal(
            authored.reusedHeading.parentNode,
            headingParent,
            'application keeps heading parent'
          );
          equal(authored.body.parentNode, bodyParent, 'application keeps grid body parent');
          equal(headingParent.contains(authored.reusedHeading), true, 'same heading node retained');
          equal(bodyParent.contains(authored.body), true, 'same grid body node retained');
        };
        assertReusedNodes();
        equal(heading.childNodes.length, 1, 'only the detached heading baseline returns');
        equal(heading.firstChild, authored.detachedHeading, 'detached heading identity restored');
        equal(grid.childNodes.length, 1, 'only the detached grid baseline returns');
        equal(grid.firstChild, authored.header, 'detached grid header identity restored');
        equal(grid.querySelector('.date-picker-day'), null, 'owned generated month removed');
        let selections = 0;
        picker.addEventListener('date-picker:select', () => selections++);
        datePicker.enhance(fixture);
        datePicker.enhance(fixture);
        grid.querySelector('[data-day="15"]:not([data-outside])').click();
        equal(selections, 1, 'remount owns one selection listener');
        equal(grid.querySelector('[aria-selected="true"]').dataset.day, '15', 'remount selects');
        datePicker.destroy(fixture);
        assertReusedNodes();
        equal(heading.firstChild, authored.detachedHeading, 'remount restores remaining heading');
        equal(grid.firstChild, authored.header, 'remount restores remaining grid baseline');
      },
      (fixture) => ({
        reusedHeading: fixture.querySelector('[data-reused-heading]'),
        detachedHeading: fixture.querySelector('[data-detached-heading]'),
        header: fixture.querySelector('thead'),
        body: fixture.querySelector('tbody')
      })
    );
  }
  for (const change of [
    'heading text edit',
    'same-text heading child replacement',
    'heading replacement'
  ]) {
    await test(
      `date picker preserves application ${change}`,
      `<div class="date-picker"><div class="date-picker-heading">Authored heading</div>
        <table class="date-picker-grid"></table></div>`,
      datePicker,
      async (fixture) => {
        const picker = fixture.querySelector('.date-picker');
        let heading = picker.querySelector('.date-picker-heading');
        if (change === 'heading text edit') heading.firstChild.data = 'Application heading';
        else if (change === 'same-text heading child replacement')
          heading.replaceChildren(document.createTextNode(heading.textContent));
        else {
          const replacement = document.createElement('div');
          replacement.className = 'date-picker-heading';
          replacement.textContent = 'Application replacement';
          heading.replaceWith(replacement);
          heading = replacement;
        }
        const content = heading.textContent;
        const child = heading.firstChild;
        datePicker.destroy(fixture);
        equal(
          picker.querySelector('.date-picker-heading'),
          heading,
          'application heading survives'
        );
        equal(heading.textContent, content, 'application heading content survives');
        equal(heading.firstChild, child, 'application heading child identity survives');
        equal(picker.querySelector('.date-picker-day'), null, 'unedited grid still cleans up');
      }
    );
  }
  for (const change of [
    'grid children replacement',
    'grid replacement',
    'deep cell edit',
    'same-markup cell replacement'
  ]) {
    await test(
      `date picker preserves application ${change}`,
      `<div class="date-picker"><div class="date-picker-heading">Authored heading</div>
        <table class="date-picker-grid">${change === 'grid children replacement' ? '' : '<tbody><tr><td>authored cell</td></tr></tbody>'}</table></div>`,
      datePicker,
      async (fixture) => {
        const picker = fixture.querySelector('.date-picker');
        let grid = picker.querySelector('.date-picker-grid');
        if (change === 'grid children replacement') {
          const body = document.createElement('tbody');
          body.innerHTML = '<tr><td>Application cell</td></tr>';
          grid.replaceChildren(body);
        } else if (change === 'grid replacement') {
          const replacement = document.createElement('table');
          replacement.className = 'date-picker-grid';
          replacement.innerHTML = '<tbody><tr><td>Application grid</td></tr></tbody>';
          grid.replaceWith(replacement);
          grid = replacement;
        } else {
          const cell = grid.querySelector('.date-picker-day');
          if (change === 'deep cell edit') {
            cell.firstChild.data = 'Application date';
            cell.dataset.application = 'keep';
            // A subsequent module-owned tab-stop update must not claim this edit.
            const active = grid.querySelector('[tabindex="0"]');
            const cells = [...grid.querySelectorAll('.date-picker-day')];
            active.focus();
            press(active, 'ArrowRight');
            assertGridFocus(
              picker,
              cells[cells.indexOf(active) + 1],
              'roving after application edit'
            );
          } else cell.replaceWith(cell.cloneNode(true));
        }
        const children = [...grid.childNodes];
        const cell = grid.querySelector('td');
        const content = grid.innerHTML;
        datePicker.destroy(fixture);
        equal(picker.querySelector('.date-picker-grid'), grid, 'application grid survives');
        equal(grid.innerHTML, content, 'application grid content survives');
        equal(grid.querySelector('td'), cell, 'application descendant identity survives');
        for (const [index, child] of children.entries())
          equal(grid.childNodes[index], child, 'application grid child identity survives');
        equal(
          picker.querySelector('.date-picker-heading').textContent,
          'Authored heading',
          'unedited heading still cleans up'
        );
      }
    );
  }
  await test(
    'date picker owns a newly rendered month after earlier application content edits',
    `<div class="date-picker"><button class="date-picker-nav" type="button" data-action="next-month">Next</button>
      <div class="date-picker-heading">Authored heading</div><table class="date-picker-grid"></table></div>`,
    datePicker,
    async (fixture) => {
      const heading = fixture.querySelector('.date-picker-heading');
      const grid = fixture.querySelector('.date-picker-grid');
      heading.firstChild.data = 'Application heading';
      grid.querySelector('td').firstChild.data = 'Application date';
      fixture.querySelector('.date-picker-nav').click();
      equal(
        heading.textContent.includes('Application'),
        false,
        'month render supplies new heading'
      );
      equal(grid.textContent.includes('Application'), false, 'month render supplies new grid');
      datePicker.destroy(fixture);
      equal(heading.textContent, 'Authored heading', 'new module-owned heading cleans up');
      equal(grid.childNodes.length, 0, 'new module-owned month cleans up');
    }
  );
  await test(
    'date picker does not claim application heading edits when the grid was removed',
    `<div class="date-picker"><button class="date-picker-nav" type="button" data-action="next-month">Next</button>
      <div class="date-picker-heading">Authored heading</div><table class="date-picker-grid"></table></div>`,
    datePicker,
    async (fixture) => {
      const heading = fixture.querySelector('.date-picker-heading');
      heading.firstChild.data = 'Application heading';
      const child = heading.firstChild;
      fixture.querySelector('.date-picker-grid').remove();
      fixture.querySelector('.date-picker-nav').click();
      datePicker.destroy(fixture);
      equal(
        heading.textContent,
        'Application heading',
        'unrenderable month does not own heading edit'
      );
      equal(heading.firstChild, child, 'application heading identity survives failed render');
      equal(fixture.querySelector('.date-picker-grid'), null, 'application grid removal survives');
    }
  );
  await test(
    'date picker restores content without overwriting application root attributes',
    `<div class="date-picker"><div class="date-picker-heading" aria-live="off">Authored heading</div>
      <table class="date-picker-grid" role="table" aria-label="Authored label"><tbody><tr><td>authored cell</td></tr></tbody></table></div>`,
    datePicker,
    async (fixture, authored) => {
      const heading = fixture.querySelector('.date-picker-heading');
      const grid = fixture.querySelector('.date-picker-grid');
      heading.setAttribute('aria-live', 'assertive');
      grid.setAttribute('aria-label', 'Application label');
      grid.dataset.application = 'keep';
      datePicker.destroy(fixture);
      equal(
        heading.getAttribute('aria-live'),
        'assertive',
        'application live-region edit survives'
      );
      equal(grid.getAttribute('aria-label'), 'Application label', 'application label survives');
      equal(grid.getAttribute('role'), 'table', 'unchanged generated role restores authored role');
      equal(grid.dataset.application, 'keep', 'unmanaged root attribute survives');
      equal(grid.firstChild, authored, 'root attributes do not prevent content restoration');
      equal(
        heading.textContent,
        'Authored heading',
        'root attributes do not prevent heading restoration'
      );
    },
    (fixture) => fixture.querySelector('.date-picker-grid').firstChild
  );
  await test(
    'a date picker without a month grid is not marked ready',
    `<div class="date-picker"><div class="date-picker-heading">No grid</div></div>`,
    datePicker,
    async (fixture) => {
      equal(
        fixture.querySelector('.date-picker').hasAttribute('data-mewa-date-picker-init'),
        false,
        'an unrenderable date picker does not report ready'
      );
    }
  );
  await test(
    'the grid cell is the focus target and carries its own selection state',
    `<div class="date-picker">
      <button class="btn date-picker-nav" type="button" data-action="next-month" aria-label="Next month">Next</button>
      <div class="date-picker-heading"></div>
      <table class="date-picker-grid"></table>
    </div>`,
    datePicker,
    async (fixture) => {
      const picker = fixture.querySelector('.date-picker');
      const cells = () => [...picker.querySelectorAll('.date-picker-day')];
      const selections = [];
      picker.addEventListener('date-picker:select', (event) => selections.push(event.detail.date));
      equal(
        picker.querySelectorAll('.date-picker-day button').length,
        0,
        'a grid cell holds no nested control'
      );
      equal(cells().filter((cell) => cell.tabIndex === 0).length, 1, 'one grid tab stop');
      equal(
        cells().every((cell) => cell.getAttribute('role') === 'gridcell'),
        true,
        'every day is a gridcell'
      );
      equal(
        cells().every((cell) => cell.hasAttribute('aria-label')),
        true,
        'every day carries a localized full-date name'
      );

      const day = cells().find((cell) => !cell.dataset.outside && cell.dataset.day === '15');
      day.click();
      await new Promise(requestAnimationFrame);

      const selected = picker.querySelector('.date-picker-day[aria-selected="true"]');
      equal(Boolean(selected), true, 'selection marks exactly one cell');
      equal(
        document.activeElement,
        selected,
        'focus lands on the selected cell, so the state is announced on the focused node'
      );
      equal(selected.dataset.date, day.dataset.date, 'the selected cell is the clicked day');
      assertGridFocus(picker, selected, 'pointer selection');

      // A focusable grid cell is not natively activatable, so the module
      // handles both activation keys itself.
      const next = cells()[cells().indexOf(selected) + 1];
      press(selected, 'ArrowRight');
      assertGridFocus(picker, next, 'ArrowRight before Enter');
      equal(selected.getAttribute('aria-selected'), 'true', 'arrow movement does not select');
      equal(selections.length, 1, 'arrow movement emits no selection');
      press(next, 'Enter');
      await new Promise(requestAnimationFrame);
      equal(
        picker.querySelector(`.date-picker-day[aria-selected="true"]`).dataset.date,
        next.dataset.date,
        'Enter selects the focused cell'
      );
      equal(
        picker.querySelectorAll('.date-picker-day[aria-selected="true"]').length,
        1,
        'still one selection'
      );
      const entered = picker.querySelector('.date-picker-day[aria-selected="true"]');
      assertGridFocus(picker, entered, 'Enter selection');

      const left = cells()[cells().indexOf(entered) - 1];
      press(entered, 'ArrowLeft');
      assertGridFocus(picker, left, 'ArrowLeft');
      const up = cells()[cells().indexOf(left) - 7];
      press(left, 'ArrowUp');
      assertGridFocus(picker, up, 'ArrowUp');
      press(up, 'ArrowDown');
      assertGridFocus(picker, left, 'ArrowDown before Space');
      equal(selections.length, 2, 'arrows remain silent before Space');
      press(left, ' ');
      await new Promise(requestAnimationFrame);
      equal(
        picker.querySelector(`.date-picker-day[aria-selected="true"]`).dataset.date,
        left.dataset.date,
        'Space selects the focused cell'
      );
      equal(
        cells().filter((cell) => cell.tabIndex === 0).length,
        1,
        'the roving tab stop follows the selected cell'
      );
      assertGridFocus(
        picker,
        picker.querySelector('.date-picker-day[aria-selected="true"]'),
        'Space selection'
      );
      equal(selections.length, 3, 'pointer, Enter, and Space each emit once');
      for (const [index, expected] of [day, next, left].entries()) {
        const selectedDate = selections[index];
        const [year, month, date] = expected.dataset.date.split('-').map(Number);
        equal(selectedDate.getFullYear(), year, 'selection event year');
        equal(selectedDate.getMonth() + 1, month, 'selection event month');
        equal(selectedDate.getDate(), date, 'selection event day');
      }

      datePicker.destroy(fixture);
      equal(
        fixture.querySelectorAll('.date-picker-day').length,
        0,
        'teardown removes the generated grid'
      );
    }
  );
  await test(
    'date picker arrows stop at rendered-grid boundaries without changing month or selection',
    `<div class="date-picker"><div class="date-picker-heading"></div>
      <table class="date-picker-grid"></table></div>`,
    datePicker,
    async (fixture) => {
      const picker = fixture.querySelector('.date-picker');
      const grid = picker.querySelector('.date-picker-grid');
      const children = [...grid.childNodes];
      const heading = picker.querySelector('.date-picker-heading').textContent;
      const cells = [...grid.querySelectorAll('.date-picker-day')];
      let selections = 0;
      picker.addEventListener('date-picker:select', () => selections++);
      let index = cells.findIndex((cell) => cell.tabIndex === 0);
      cells[index].focus();
      const move = (key, nextIndex) => {
        press(cells[index], key);
        index = nextIndex;
        assertGridFocus(picker, cells[index], key);
      };
      while (index > 0) move('ArrowLeft', index - 1);
      move('ArrowLeft', 0);
      move('ArrowUp', 0);
      move('ArrowDown', 7);
      move('ArrowUp', 0);
      while (index < cells.length - 1) move('ArrowRight', index + 1);
      move('ArrowRight', cells.length - 1);
      move('ArrowDown', cells.length - 1);
      move('ArrowUp', cells.length - 8);
      move('ArrowDown', cells.length - 1);
      equal(picker.querySelector('.date-picker-heading').textContent, heading, 'arrows keep month');
      for (const [childIndex, child] of children.entries())
        equal(grid.childNodes[childIndex], child, 'arrows do not re-render the grid');
      equal(selections, 0, 'arrows emit no selection event');
      equal(grid.querySelector('[aria-selected="true"]'), null, 'arrows do not select a date');
      datePicker.destroy(fixture);
      equal(grid.childNodes.length, 0, 'boundary roving still permits generated-content cleanup');
    }
  );
  return results;
}
