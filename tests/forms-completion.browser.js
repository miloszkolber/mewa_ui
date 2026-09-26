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
  // Move the roving tab stop the way the module does, so the test does not
  // depend on a particular rendered month.
  const setTabStopByKeyboard = (picker, active) => {
    for (const cell of picker.querySelectorAll('.date-picker-day'))
      cell.tabIndex = cell === active ? 0 : -1;
  };
  const test = async (name, html, module, check) => {
    const fixture = document.createElement('div');
    fixture.innerHTML = html;
    document.body.append(fixture);
    try {
      module.enhance(fixture);
      module.enhance(fixture);
      await check(fixture);
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
      await Promise.resolve();
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
  await test(
    'date picker restores the authored month grid and heading on teardown',
    `<div class="date-picker">
      <div class="date-picker-heading">Authored heading</div>
      <table class="date-picker-grid"><tbody><tr><td>authored cell</td></tr></tbody></table>
    </div>`,
    datePicker,
    async (fixture) => {
      const picker = fixture.querySelector('.date-picker');
      const heading = picker.querySelector('.date-picker-heading');
      const grid = picker.querySelector('.date-picker-grid');
      equal(grid.querySelectorAll('[role="gridcell"]').length > 0, true, 'grid renders day cells');
      equal(grid.hasAttribute('role'), true, 'grid receives the grid role');
      equal(heading.hasAttribute('aria-live'), true, 'heading becomes a polite live region');
      equal(
        heading.textContent.includes('Authored heading'),
        false,
        'the rendered month replaces the authored heading while enhanced'
      );
      equal(grid.querySelectorAll('tbody').length, 1, 'module supplies the month body');

      datePicker.destroy(fixture);

      equal(grid.hasAttribute('role'), false, 'destroy removes the generated grid role');
      equal(grid.hasAttribute('aria-label'), false, 'destroy removes the generated grid label');
      equal(heading.hasAttribute('aria-live'), false, 'destroy removes the generated live region');
      equal(heading.textContent, 'Authored heading', 'destroy restores the authored heading');
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
    }
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

      // A focusable grid cell is not natively activatable, so the module
      // handles both activation keys itself.
      const next = cells().find(
        (cell) => !cell.dataset.outside && cell.dataset.date > selected.dataset.date
      );
      setTabStopByKeyboard(picker, next);
      next.focus();
      next.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      );
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

      const after = cells().find(
        (cell) => !cell.dataset.outside && cell.dataset.date > next.dataset.date
      );
      setTabStopByKeyboard(picker, after);
      after.focus();
      after.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
      );
      await new Promise(requestAnimationFrame);
      equal(
        picker.querySelector(`.date-picker-day[aria-selected="true"]`).dataset.date,
        after.dataset.date,
        'Space selects the focused cell'
      );
      equal(
        cells().filter((cell) => cell.tabIndex === 0).length,
        1,
        'the roving tab stop follows the selected cell'
      );

      datePicker.destroy(fixture);
      equal(
        fixture.querySelectorAll('.date-picker-day').length,
        0,
        'teardown removes the generated grid'
      );
    }
  );
  return results;
}
