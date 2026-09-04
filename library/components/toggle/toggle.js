// -- Toggle ---------------------------------------------------

import { queryAll } from '../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../runtime/enhancer.js';
/* mewa:auto:end */

export function enhance(root) {
  queryAll(root, '.toggle:not([data-init]):not(.toggle-group .toggle)').forEach((toggle) => {
  toggle.dataset.init = '';
  toggle.addEventListener('click', () => {
    const pressed = toggle.getAttribute('aria-pressed') === 'true';
    toggle.setAttribute('aria-pressed', !pressed);
  });
});
}

export const behavior = { name: 'toggle', enhance };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
