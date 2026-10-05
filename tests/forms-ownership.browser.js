import * as range from '../library/components/forms/date-range-picker/date-range-picker.js';
import * as tags from '../library/components/forms/tag-input/tag-input.js';
import * as combo from '../library/components/forms/combobox/combobox.js';
import * as color from '../library/components/forms/color-picker/color-picker.js';
import * as time from '../library/components/forms/time-field/time-field.js';

// Run against source controllers without rebuilding shared distribution files.
export async function runFormsOwnership() {
  const results = [];
  const equal = (actual, expected, message) => {
    if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
  };
  const fire = (element, type) => element.dispatchEvent(new Event(type, { bubbles: true }));
  // The native default action and owned reset synchronization finish in a task.
  const afterReset = () => new Promise((resolve) => setTimeout(resolve, 0));
  const key = (element, value) =>
    element.dispatchEvent(
      new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true })
    );
  const paste = (element, text) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', text);
    const event = new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true });
    // Gecko discards the supplied DataTransfer on an untrusted ClipboardEvent.
    // Supply the same controlled payload; the real DOM handler and form state run unchanged.
    if (event.clipboardData?.getData('text/plain') !== text)
      Object.defineProperty(event, 'clipboardData', { value: clipboardData });
    element.dispatchEvent(event);
    equal(event.defaultPrevented, true, 'multi-part paste is handled');
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
  const tagMarkup = (maximum = '') => `<form><div data-tag-input ${maximum}>
    <div data-tag-input-field><input class="tag-input-fallback" type="text" id="ownership-tags"
      name="tags" value="Initial" aria-describedby="ownership-help"></div>
    <p id="ownership-help">Tags</p><p data-tag-input-status role="status"></p>
  </div></form>`;
  const comboMarkup = `<form><div class="combobox"><button type="button" class="combobox-trigger"
    aria-label="Choice" aria-expanded="false">Choose</button><span class="combobox-value">Choose</span>
    <input type="hidden" data-combobox-input name="choice" value="">
    <div class="combobox-content" id="ownership-options" popover>
      <input class="combobox-search-input" role="combobox" aria-expanded="false">
      <div role="listbox"><div role="option" id="ownership-a" data-value="a">A</div>
        <div role="option" id="ownership-b" data-value="b">B</div></div>
    </div></div></form>`;
  const colorMarkup = `<form><div class="color-picker"><input class="color-picker-input" type="color"
    name="color" value="#112233"><input class="color-picker-hex" data-color-picker-hex
    type="text" aria-label="Hex value" value="#112233" hidden></div></form>`;
  const timeMarkup = `<form><fieldset class="time-field"><legend>Time</legend>
    <input aria-label="Hour" data-time-part="hour" name="hour" value="09">
    <input aria-label="Minute" data-time-part="minute" name="minute" value="30">
    <select aria-label="Period" data-time-part="period" name="period"><option>AM</option><option>PM</option></select>
    <input data-time-part="value" type="hidden" name="time" value="" disabled>
    <output data-time-part="status">Authored status</output></fieldset></form>`;

  await test(
    'date range adopts current application bounds during input, update and teardown',
    `<form><fieldset class="date-range-picker"><input type="date" data-range-start name="start"
      value="2026-06-01"><input type="date" data-range-end name="end" value="2026-06-10"></fieldset></form>`,
    range,
    async (fixture) => {
      const [start, end] = fixture.querySelectorAll('input');
      start.min = '2026-07-01';
      end.max = '2026-12-31';
      fire(start, 'input');
      equal(start.min, '2026-07-01', 'application minimum survives input');
      equal(start.validity.rangeUnderflow, true, 'native validation remains authoritative');
      equal(end.max, '2026-12-31', 'application maximum survives input');
      start.max = '2026-11-30';
      end.min = '2026-08-01';
      end.value = '2026-10-10';
      range.enhance(fixture);
      equal(start.max, '2026-10-10', 'cross-field maximum derives from new base');
      equal(end.min, '2026-08-01', 'application minimum is not relaxed');
      range.destroy(fixture);
      equal(start.max, '2026-11-30', 'only the derived maximum is removed');
      equal(end.min, '2026-08-01', 'adopted minimum survives destroy');
      equal(
        new FormData(fixture.querySelector('form')).get('start'),
        '2026-06-01',
        'native value survives'
      );
      range.enhance(fixture);
      end.max = '2027-12-31';
      range.destroy(fixture);
      equal(end.max, '2027-12-31', 'unsynchronized application bound survives destroy');
    }
  );
  await test(
    'tag teardown preserves authoritative application values and relationships',
    tagMarkup(),
    tags,
    async (fixture) => {
      const input = fixture.querySelector('.tag-input-fallback');
      input.defaultValue = 'New default';
      input.value = 'Application replacement';
      input.setAttribute('aria-describedby', 'application-help');
      const currentValue = input.value;
      tags.destroy(fixture);
      equal(input.value, currentValue, 'current authoritative value survives destroy');
      equal(
        input.defaultValue,
        currentValue,
        'current native default is not replaced with initialization data'
      );
      equal(
        input.getAttribute('aria-describedby'),
        'application-help',
        'application relationship survives'
      );
      equal(input.type, 'text', 'native editor returns');
      input.value = 'Fallback edit';
      equal(
        new FormData(fixture.querySelector('form')).get('tags'),
        'Fallback edit',
        'fallback submits current editing'
      );
      tags.enhance(fixture);
      equal(
        fixture.querySelector('.tag-input-tag-label').textContent,
        'Fallback edit',
        'remount adopts fallback editing'
      );
    }
  );
  await test(
    'tag reset reads changed native defaults and honors canceled reset',
    tagMarkup(),
    tags,
    async (fixture) => {
      const form = fixture.querySelector('form');
      const input = fixture.querySelector('.tag-input-fallback');
      input.defaultValue = 'Updated default';
      form.reset();
      await afterReset();
      equal(input.value, 'Updated default', 'new native default is submitted');
      equal(
        fixture.querySelector('.tag-input-tag-label').textContent,
        'Updated default',
        'new default renders'
      );
      const draft = fixture.querySelector('.tag-input-control');
      draft.value = 'Second';
      key(draft, 'Enter');
      form.addEventListener('reset', (event) => event.preventDefault(), { once: true });
      form.reset();
      await afterReset();
      equal(input.value, 'Updated default, Second', 'canceled reset preserves selection');
      form.reset();
      await afterReset();
      equal(input.value, 'Updated default', 'module writes do not replace reset default');
      tags.destroy(fixture);
      equal(input.defaultValue, 'Updated default', 'fallback native default returns');
    }
  );
  await test(
    'tag pending and rejected drafts remain recoverable without teardown committing them',
    tagMarkup('data-max-tags="1"'),
    tags,
    async (fixture) => {
      const input = fixture.querySelector('.tag-input-fallback');
      const draft = fixture.querySelector('.tag-input-control');
      draft.value = 'Rejected draft';
      key(draft, 'Enter');
      tags.destroy(fixture);
      equal(
        new FormData(fixture.querySelector('form')).get('tags'),
        'Initial',
        'destroy does not commit rejected text'
      );
      equal(draft.isConnected && !draft.hidden, true, 'pending text has a native recovery editor');
      equal(draft.value, 'Rejected draft', 'rejected draft is retained');
      equal(
        Boolean(draft.getAttribute('aria-label') || draft.labels?.length),
        true,
        'recovery editor is named'
      );
      equal(input.id, 'ownership-tags', 'fallback retains its original label ID');
      draft.value = 'Recovered text';
      tags.enhance(fixture);
      equal(
        fixture.querySelector('.tag-input-control').value,
        'Recovered text',
        'remount retains uncommitted text'
      );
      equal(input.value, 'Initial', 'remount does not silently commit recovery text');
      equal(
        fixture.querySelectorAll('.tag-input-control').length,
        1,
        'one recovery editor is owned'
      );
    }
  );
  await test(
    'tag fully rejected paste retains the existing draft and pasted text',
    tagMarkup('data-max-tags="1"'),
    tags,
    async (fixture) => {
      const draft = fixture.querySelector('.tag-input-control');
      draft.value = 'Existing draft';
      draft.setSelectionRange(draft.value.length, draft.value.length);
      paste(draft, ' Second, Third');
      equal(draft.value, 'Existing draft Second, Third', 'all rejected text remains recoverable');
      equal(
        fixture.querySelector('.tag-input-fallback').value,
        'Initial',
        'rejection does not change submission'
      );
    }
  );
  await test(
    'tag partial paste retains duplicates and over-limit parts in the editor',
    tagMarkup('data-max-tags="2"'),
    tags,
    async (fixture) => {
      const draft = fixture.querySelector('.tag-input-control');
      paste(draft, 'Second, Initial, Third');
      equal(
        fixture.querySelector('.tag-input-fallback').value,
        'Initial, Second',
        'only eligible parts commit'
      );
      equal(draft.value, ' Initial, Third', 'duplicate and over-limit parts remain');
    }
  );
  await test(
    'tag delimiter input retains rejected completed parts and the trailing draft',
    tagMarkup('data-max-tags="2"'),
    tags,
    async (fixture) => {
      const draft = fixture.querySelector('.tag-input-control');
      draft.value = 'Second,Initial,Third';
      fire(draft, 'input');
      equal(
        fixture.querySelector('.tag-input-fallback').value,
        'Initial, Second',
        'accepted completed part commits'
      );
      equal(draft.value, 'Initial,Third', 'rejected completed part stays with the trailing text');
    }
  );
  await test(
    'tag multipart keyboard submission retains rejected batch parts',
    tagMarkup('data-max-tags="2"'),
    tags,
    async (fixture) => {
      const draft = fixture.querySelector('.tag-input-control');
      draft.value = 'Second,Third';
      key(draft, 'Enter');
      equal(
        fixture.querySelector('.tag-input-fallback').value,
        'Initial, Second',
        'keyboard commits eligible parts'
      );
      equal(draft.value, 'Third', 'keyboard retains rejected part');
    }
  );
  await test(
    'tag partial native submit retains rejected text and blocks submission',
    tagMarkup('data-max-tags="2"'),
    tags,
    async (fixture) => {
      const form = fixture.querySelector('form');
      const draft = fixture.querySelector('.tag-input-control');
      draft.value = 'Second,Third';
      let canceled = false;
      form.addEventListener('submit', (event) => {
        canceled = event.defaultPrevented;
        event.preventDefault();
      });
      form.requestSubmit();
      equal(canceled, true, 'rejected remainder cancels native submission');
      equal(new FormData(form).get('tags'), 'Initial, Second', 'only the accepted part submits');
      equal(draft.value, 'Third', 'failed submission preserves correctable text');
    }
  );
  await test(
    'tag update adopts application values without discarding pending text',
    tagMarkup(),
    tags,
    async (fixture) => {
      const input = fixture.querySelector('.tag-input-fallback');
      const draft = fixture.querySelector('.tag-input-control');
      draft.value = 'Pending';
      input.value = 'Application';
      input.setAttribute('aria-describedby', 'application-help');
      tags.enhance(fixture);
      equal(
        fixture.querySelector('.tag-input-tag-label').textContent,
        'Application',
        'current authoritative value renders'
      );
      equal(draft.value, 'Pending', 'update does not commit or discard editing');
      tags.destroy(fixture);
      equal(input.value, 'Application', 'application submission survives teardown');
      equal(
        input.getAttribute('aria-describedby'),
        'application-help',
        'application relationship survives update and teardown'
      );
      equal(draft.isConnected, true, 'ordinary pending draft stays editable');
      tags.enhance(fixture);
      equal(draft.value, 'Pending', 'ordinary pending draft survives remount');
      key(draft, 'Enter');
      equal(input.value, 'Application, Pending', 'only explicit commit accepts pending text');
    }
  );
  await test(
    'tag paste honors the text selection and retains rejected newline parts',
    tagMarkup('data-max-tags="2"'),
    tags,
    async (fixture) => {
      const draft = fixture.querySelector('.tag-input-control');
      draft.value = 'Replace me';
      draft.setSelectionRange(0, draft.value.length);
      paste(draft, 'Second\nThird');
      equal(
        fixture.querySelector('.tag-input-fallback').value,
        'Initial, Second',
        'paste replaces the selection'
      );
      equal(draft.value, 'Third', 'rejected newline part remains recoverable');
      draft.value = 'Initial,';
      fire(draft, 'input');
      equal(draft.value, 'Initial,', 'fully rejected delimiter input remains intact');
    }
  );
  await test(
    'tag stale Remove controls do not replace application values',
    tagMarkup(),
    tags,
    async (fixture) => {
      const input = fixture.querySelector('.tag-input-fallback');
      const remove = fixture.querySelector('.tag-input-remove');
      input.value = 'Application replacement';
      remove.click();
      equal(
        input.value,
        'Application replacement',
        'stale control does not remove a substituted value'
      );
      equal(
        fixture.querySelector('.tag-input-tag-label').textContent,
        'Application replacement',
        'the replacement renders for a new interaction'
      );
    }
  );
  for (const mutation of ['disable', 'remove', 'reorder']) {
    await test(
      `combobox Enter preserves highlighted identity after ${mutation}`,
      comboMarkup,
      combo,
      async (fixture) => {
        const trigger = fixture.querySelector('button');
        const search = fixture.querySelector('[role="combobox"]');
        const a = fixture.querySelector('#ownership-a');
        const b = fixture.querySelector('#ownership-b');
        trigger.click();
        key(search, 'ArrowDown');
        equal(search.getAttribute('aria-activedescendant'), a.id, 'A is highlighted');
        if (mutation === 'disable') a.setAttribute('aria-disabled', 'true');
        if (mutation === 'remove') a.remove();
        // Move A after B without changing its identity.
        if (mutation === 'reorder') b.after(a);
        key(search, 'Enter');
        equal(
          fixture.querySelector('[data-combobox-input]').value,
          mutation === 'reorder' ? 'a' : '',
          'Enter never substitutes B'
        );
        if (mutation !== 'reorder') {
          equal(
            search.getAttribute('aria-activedescendant'),
            '',
            'unavailable active descendant clears'
          );
          key(search, 'ArrowDown');
          equal(
            search.getAttribute('aria-activedescendant'),
            b.id,
            'movement recovers to eligible B'
          );
          key(search, 'Enter');
          equal(
            fixture.querySelector('[data-combobox-input]').value,
            'b',
            'explicitly highlighted B can be selected'
          );
        }
      }
    );
  }
  await test(
    'combobox canceled native opening preserves query, focus and collapsed ARIA',
    comboMarkup,
    combo,
    async (fixture) => {
      const popover = fixture.querySelector('[popover]');
      const trigger = fixture.querySelector('button');
      const search = fixture.querySelector('[role="combobox"]');
      search.value = 'Previous query';
      trigger.focus();
      popover.addEventListener('beforetoggle', (event) => event.preventDefault(), { once: true });
      trigger.click();
      equal(popover.matches(':popover-open'), false, 'native opening is canceled');
      equal(trigger.getAttribute('aria-expanded'), 'false', 'trigger stays collapsed');
      equal(search.getAttribute('aria-expanded'), 'false', 'search stays collapsed');
      equal(search.value, 'Previous query', 'canceled opening does not clear editing');
      equal(document.activeElement, trigger, 'canceled opening does not move focus');
    }
  );
  await test(
    'combobox cleanup removes filtering and owned relationships without replacing application edits',
    comboMarkup,
    combo,
    async (fixture) => {
      const trigger = fixture.querySelector('button');
      const search = fixture.querySelector('[role="combobox"]');
      const popover = fixture.querySelector('[popover]');
      trigger.click();
      search.value = 'A';
      fire(search, 'input');
      search.setAttribute('aria-label', 'Application search');
      trigger.style.anchorName = '--application';
      popover.style.positionAnchor = '--application-target';
      combo.destroy(fixture);
      equal(fixture.querySelector('#ownership-b').hidden, false, 'filtered option returns');
      equal(
        search.getAttribute('aria-label'),
        'Application search',
        'application accessible name survives'
      );
      equal(trigger.style.anchorName, '--application', 'application trigger anchor survives');
      equal(
        popover.style.positionAnchor,
        '--application-target',
        'application target anchor survives'
      );
      equal(popover.matches(':popover-open'), false, 'destroy closes its popup');
      combo.enhance(fixture);
      trigger.click();
      key(search, 'End');
      key(search, 'Enter');
      equal(
        new FormData(fixture.querySelector('form')).get('choice'),
        'b',
        'reenhanced selection submits'
      );
    }
  );
  await test(
    'combobox reset adopts an application replacement default',
    comboMarkup,
    combo,
    async (fixture) => {
      const input = fixture.querySelector('[data-combobox-input]');
      input.defaultValue = 'b';
      fixture.querySelector('form').reset();
      await afterReset();
      equal(input.value, 'b', 'new default survives native reset');
      equal(
        fixture.querySelector('.combobox-value').textContent,
        'B',
        'reset label follows new default'
      );
      fixture.querySelector('button').click();
      key(fixture.querySelector('[role="combobox"]'), 'Home');
      key(fixture.querySelector('[role="combobox"]'), 'Enter');
      fixture.querySelector('form').reset();
      await afterReset();
      equal(input.value, 'b', 'selection does not replace the adopted reset default');
    }
  );
  for (const editing of ['valid-invalid', 'invalid', 'valid']) {
    await test(
      `color picker commits exactly once after ${editing} blur`,
      colorMarkup,
      color,
      async (fixture) => {
        const native = fixture.querySelector('[type="color"]');
        const hex = fixture.querySelector('[data-color-picker-hex]');
        let inputs = 0;
        let changes = 0;
        native.addEventListener('input', () => inputs++);
        native.addEventListener('change', () => changes++);
        hex.focus();
        if (editing !== 'invalid') {
          hex.value = '#abcdef';
          fire(hex, 'input');
        }
        if (editing !== 'valid') {
          hex.value = 'invalid';
          fire(hex, 'input');
        }
        hex.blur();
        equal(
          changes,
          editing === 'invalid' ? 0 : 1,
          'one change for a changed committed native value'
        );
        equal(inputs, editing === 'invalid' ? 0 : 1, 'only valid editing emits input');
        equal(hex.value, native.value, 'blur recovers the canonical color');
      }
    );
  }
  await test(
    'combobox native reset can restore an application default that is unavailable for new selection',
    comboMarkup,
    combo,
    async (fixture) => {
      const input = fixture.querySelector('[data-combobox-input]');
      const option = fixture.querySelector('#ownership-b');
      option.setAttribute('aria-disabled', 'true');
      input.defaultValue = 'b';
      let changes = 0;
      input.addEventListener('change', () => changes++);
      fixture.querySelector('form').reset();
      await afterReset();
      equal(input.value, 'b', 'native default stays authoritative');
      equal(
        fixture.querySelector('.combobox-value').textContent,
        'B',
        'restored state has a matching label'
      );
      equal(option.getAttribute('aria-selected'), 'true', 'restored default is selected');
      equal(changes, 0, 'native reset stays silent');
    }
  );
  await test(
    'color picker teardown hides the hex enhancement and preserves native form editing',
    colorMarkup,
    color,
    async (fixture) => {
      const native = fixture.querySelector('[type="color"]');
      const hex = fixture.querySelector('[data-color-picker-hex]');
      hex.value = '#abcdef';
      fire(hex, 'input');
      color.destroy(fixture);
      equal(hex.hidden, true, 'stale hex view is hidden');
      equal(
        fixture.querySelector('.color-picker').hasAttribute('data-enhanced'),
        false,
        'enhancement presentation is removed'
      );
      equal(native.value, '#abcdef', 'meaningful color survives destroy');
      native.value = '#123456';
      fire(native, 'input');
      equal(
        new FormData(fixture.querySelector('form')).get('color'),
        '#123456',
        'fallback submits the native color'
      );
      color.enhance(fixture);
      equal(hex.value, '#123456', 'remount adopts native editing');
      equal(hex.hidden, false, 'remount restores the second view');
      hex.setAttribute('aria-invalid', 'application');
      hex.disabled = true;
      color.destroy(fixture);
      equal(
        hex.getAttribute('aria-invalid'),
        'application',
        'application validity relationship survives'
      );
      equal(hex.disabled, true, 'application disabled state survives');
    }
  );
  await test(
    'time field teardown removes its submitted mirror and preserves native segment submission',
    timeMarkup,
    time,
    async (fixture) => {
      const form = fixture.querySelector('form');
      const hour = fixture.querySelector('[data-time-part="hour"]');
      const submitted = fixture.querySelector('[data-time-part="value"]');
      hour.value = '11';
      fire(hour, 'input');
      time.destroy(fixture);
      equal(submitted.disabled, true, 'module-only canonical mirror is disabled');
      equal(submitted.value, '', 'module-only canonical value is removed');
      equal(hour.value, '11', 'meaningful segment edit survives');
      equal(
        fixture.querySelector('output').textContent,
        'Authored status',
        'module-only status is restored'
      );
      hour.value = '10';
      equal(new FormData(form).get('time'), null, 'no stale canonical submission after destroy');
      equal(new FormData(form).get('hour'), '10', 'native fallback submits visible hour');
      let submits = 0;
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submits++;
      });
      form.requestSubmit();
      equal(submits, 1, 'native fallback remains submittable');
      time.enhance(fixture);
      equal(submitted.value, '10:30', 'remount derives the current time');
      equal(submitted.disabled, false, 'remount enables the canonical mirror');
    }
  );
  await test(
    'time field cleanup preserves application canonical and output replacements',
    timeMarkup,
    time,
    async (fixture) => {
      const submitted = fixture.querySelector('[data-time-part="value"]');
      submitted.value = '22:45';
      submitted.disabled = true;
      fixture.querySelector('output').textContent = 'Application status';
      time.destroy(fixture);
      equal(submitted.value, '22:45', 'application canonical value survives');
      equal(submitted.defaultValue, '22:45', 'application canonical default survives');
      equal(submitted.disabled, true, 'application disabled state survives');
      equal(
        fixture.querySelector('output').textContent,
        'Application status',
        'application status survives'
      );
    }
  );
  await test(
    'time field teardown releases only its own custom validity',
    timeMarkup,
    time,
    async (fixture) => {
      const hour = fixture.querySelector('[data-time-part="hour"]');
      const minute = fixture.querySelector('[data-time-part="minute"]');
      hour.value = '99';
      fire(hour, 'input');
      equal(hour.validity.customError, true, 'invalid hour has enhanced validity');
      minute.setCustomValidity('Application validation');
      time.destroy(fixture);
      equal(hour.validity.customError, false, 'module-only segment validity is cleared');
      equal(hour.value, '99', 'teardown does not silently normalize the draft');
      equal(minute.validationMessage, 'Application validation', 'application validity is retained');
    }
  );
  return results;
}
