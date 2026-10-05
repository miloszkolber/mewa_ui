// -- Avatar ---------------------------------------------------

import { queryAll, createLifecycle } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const lifecycle = createLifecycle('avatar');

export function enhance(root) {
  queryAll(root, '.avatar-image').forEach((img) => {
    img.dataset.init = '';
    if (lifecycle.has(img)) return;
    img.dataset.mewaAvatarInit = '';
    let display = null;
    const restoreDisplay = () => {
      if (!display) return;
      if (img.style.display === 'none' && img.style.getPropertyPriority('display') === '') {
        if (display.value) img.style.setProperty('display', display.value, display.priority);
        else img.style.removeProperty('display');
      }
      display = null;
    };
    const fallback = img.closest('.avatar')?.querySelector('.avatar-fallback');
    const fallbackAttributes = new Map();
    const restoreFallback = () => {
      for (const [name, { original, owned }] of fallbackAttributes) {
        if (fallback.getAttribute(name) !== owned) continue;
        if (original === null) fallback.removeAttribute(name);
        else fallback.setAttribute(name, original);
      }
      fallbackAttributes.clear();
    };
    const setFallbackAttribute = (name, value) => {
      fallbackAttributes.set(name, { original: fallback.getAttribute(name), owned: value });
      fallback.setAttribute(name, value);
    };
    const sync = () => {
      const failed = img.complete && img.naturalWidth === 0;
      restoreFallback();
      restoreDisplay();
      img.toggleAttribute('data-error', failed);
      if (failed && fallback) {
        display = { value: img.style.display, priority: img.style.getPropertyPriority('display') };
        img.style.setProperty('display', 'none');
      }
      if (failed && fallback && img.alt.trim()) {
        setFallbackAttribute('aria-hidden', 'false');
        if (!fallback.hasAttribute('role')) setFallbackAttribute('role', 'img');
        if (!fallback.hasAttribute('aria-label') && !fallback.hasAttribute('aria-labelledby')) {
          setFallbackAttribute('aria-label', img.alt);
        }
      }
    };
    lifecycle.listen(img, img, 'error', sync);
    lifecycle.listen(img, img, 'load', sync);
    lifecycle.add(img, () => {
      restoreFallback();
      restoreDisplay();
      img.removeAttribute('data-error');
    });
    sync();
  });
}

export function destroy(root) {
  lifecycle.destroy(root);
}

export const behavior = { name: 'avatar', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
