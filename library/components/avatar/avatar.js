// -- Avatar ---------------------------------------------------

import { queryAll } from '../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../runtime/enhancer.js';
/* mewa:auto:end */

export function enhance(root) {
  queryAll(root, '.avatar-image:not([data-init])').forEach((img) => {
  img.dataset.init = '';
  img.addEventListener('error', () => {
    img.setAttribute('data-error', '');
    img.style.display = 'none';
  });
});
}

export const behavior = { name: 'avatar', enhance };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
