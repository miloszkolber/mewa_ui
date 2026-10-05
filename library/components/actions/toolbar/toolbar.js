// -- Toolbar --------------------------------------------------

import { queryAll, createLifecycle, createTabIndexOwner } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const lifecycle = createLifecycle('toolbar');

export function enhance(root) {
  lifecycle.refresh(root);
  queryAll(root, '.toolbar[role="toolbar"]').forEach((toolbar) => {
    toolbar.dataset.init = '';
    if (lifecycle.has(toolbar)) return;
    toolbar.dataset.mewaToolbarInit = '';
    const tabIndices = createTabIndexOwner();
    const setActive = (active) => {
      const candidates = getCandidates();
      tabIndices.releaseExcept(candidates);
      candidates.forEach((item) => {
        const value = item === active ? '0' : '-1';
        tabIndices.set(item, value);
      });
    };
    lifecycle.add(toolbar, tabIndices.restore);
    const getCandidates = () =>
      Array.from(toolbar.querySelectorAll('button, a[href], [tabindex]')).filter(
        (item) => item.closest('[role="toolbar"]') === toolbar
      );
    const getItems = () =>
      getCandidates().filter(
        (item) =>
          !item.matches(':disabled') &&
          item.getAttribute('aria-disabled') !== 'true' &&
          !item.closest('[hidden], [inert]')
      );
    const update = () => {
      const current = getItems();
      const active =
        current.find((item) => item === toolbar.ownerDocument.activeElement) ||
        current.find((item) => item.getAttribute('tabindex') === '0') ||
        current[0];
      setActive(active);
    };
    lifecycle.onUpdate(toolbar, update);
    const observer = new MutationObserver(update);
    observer.observe(toolbar, { childList: true, subtree: true });
    lifecycle.add(toolbar, () => observer.disconnect());
    update();

    lifecycle.listen(toolbar, toolbar, 'focusin', (event) => {
      if (getItems().includes(event.target)) setActive(event.target);
    });

    lifecycle.listen(toolbar, toolbar, 'keydown', (e) => {
      if (e.defaultPrevented) return;
      const items = getItems();
      const current = items.indexOf(toolbar.ownerDocument.activeElement);
      if (current === -1) return;

      const vertical = toolbar.getAttribute('aria-orientation') === 'vertical';
      const fwd = vertical ? 'ArrowDown' : 'ArrowRight';
      const bwd = vertical ? 'ArrowUp' : 'ArrowLeft';
      let next;

      if (e.key === fwd) {
        e.preventDefault();
        next = (current + 1) % items.length;
      } else if (e.key === bwd) {
        e.preventDefault();
        next = (current - 1 + items.length) % items.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        next = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        next = items.length - 1;
      }

      if (next !== undefined) {
        e.stopPropagation();
        setActive(items[next]);
        items[next].focus();
      }
    });
  });
}

export function destroy(root) {
  lifecycle.destroy(root);
}

export const behavior = { name: 'toolbar', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
