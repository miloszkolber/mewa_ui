// -- Number Field ---------------------------------------------

import { queryAll, createLifecycle } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const lifecycle = createLifecycle('number-field');

export function enhance(root) {
  lifecycle.refresh(root);
  queryAll(root, '.number-field').forEach((wrapper) => {
    wrapper.dataset.init = '';
    if (lifecycle.has(wrapper)) return;
    wrapper.dataset.mewaNumberFieldInit = '';
    const input = wrapper.querySelector('input[type="number"]');
    const decBtn = wrapper.querySelector('[data-action="decrement"]');
    const incBtn = wrapper.querySelector('[data-action="increment"]');
    if (!input) {
      wrapper.removeAttribute('data-mewa-number-field-init');
      return;
    }

    const buttons = [decBtn, incBtn].filter(Boolean);
    const disabledState = new Map(
      buttons.map((button) => [
        button,
        {
          authored: button.disabled,
          written: button.disabled
        }
      ])
    );
    const syncDisabled = () => {
      buttons.forEach((button) => {
        const state = disabledState.get(button);
        if (button.disabled !== state.written) state.authored = button.disabled;
        button.disabled = state.authored || input.matches(':disabled') || input.readOnly;
        state.written = button.disabled;
      });
    };
    const observer = new MutationObserver(syncDisabled);
    observer.observe(input, { attributes: true, attributeFilter: ['disabled', 'readonly'] });
    lifecycle.add(wrapper, () => {
      observer.disconnect();
      buttons.forEach((button) => {
        const state = disabledState.get(button);
        if (button.disabled === state.written) button.disabled = state.authored;
      });
    });
    lifecycle.onUpdate(wrapper, syncDisabled);
    syncDisabled();

    const update = (direction) => {
      if (input.matches(':disabled') || input.readOnly) return;
      try {
        const previous = input.value;
        if (direction > 0) input.stepUp();
        else input.stepDown();
        if (input.value === previous) return;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } catch {
        /* Native stepping can reject unsupported step values, such as "any". */
      }
    };

    if (decBtn)
      lifecycle.listen(wrapper, decBtn, 'click', () => {
        update(-1);
      });
    if (incBtn)
      lifecycle.listen(wrapper, incBtn, 'click', () => {
        update(1);
      });
  });
}

export function destroy(root) {
  lifecycle.destroy(root);
}

export const behavior = { name: 'number-field', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
