import * as time from '../library/components/forms/time-field/time-field.js';
import * as number from '../library/components/forms/number-field/number-field.js';
import * as otp from '../library/components/forms/input-otp/input-otp.js';

// Serve the repository root, then import and call runFormsCompletion() in a browser.
// Source imports intentionally verify this boundary without regenerating packages.
export async function runFormsCompletion() {
  const results = [];
  const equal = (actual, expected, message) => {
    if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
  };
  const fire = (element, type) => element.dispatchEvent(new Event(type, { bubbles: true }));
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
  return results;
}
