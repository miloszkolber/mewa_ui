/* -- Slider component ------------------------------------------- */

import { queryAll, createLifecycle } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const lifecycle = createLifecycle('slider');

function updateSliderValue(el) {
  const min = parseFloat(el.min || 0);
  const max = parseFloat(el.max || 100);
  const value = parseFloat(el.value);
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
  el.style.setProperty('--slider-value', `${percent}%`);
}

export function enhance(root) {
  queryAll(root, '.slider').forEach((el) => {
    el.dataset.init = '';
    if (lifecycle.has(el)) return;
    el.dataset.mewaSliderInit = '';
    updateSliderValue(el);
    // Native `step` snapping can settle on `change` without a second `input`.
    lifecycle.listen(el, el, 'input', () => updateSliderValue(el));
    lifecycle.listen(el, el, 'change', () => updateSliderValue(el));
    lifecycle.reset(el, el.form, () => updateSliderValue(el));
  });
}

export function destroy(root) {
  lifecycle.destroy(root);
}

export const behavior = { name: 'slider', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
