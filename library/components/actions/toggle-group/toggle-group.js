// -- Toggle Group ---------------------------------------------

import { queryAll, createLifecycle } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const lifecycle = createLifecycle('toggle-group');

export function enhance(root) {
  lifecycle.refresh(root);
  queryAll(root, '.toggle-group').forEach((group) => {
    group.dataset.init = '';
    if (lifecycle.has(group)) return;
    group.dataset.mewaToggleGroupInit = '';
    const tabIndices = new Map();
    const inToolbar = () => Boolean(group.closest('.toolbar[role="toolbar"]'));
    const getToggles = () =>
      Array.from(group.querySelectorAll('.toggle')).filter(
        (toggle) => toggle.closest('.toggle-group') === group
      );
    const enabled = (toggle) =>
      !toggle.matches(':disabled') &&
      toggle.getAttribute('aria-disabled') !== 'true' &&
      !toggle.closest('[hidden], [inert]');
    const setTabindex = (toggle, value) => {
      if (!tabIndices.has(toggle))
        tabIndices.set(toggle, { original: toggle.getAttribute('tabindex') });
      tabIndices.get(toggle).current = value;
      toggle.setAttribute('tabindex', value);
    };
    lifecycle.add(group, () => {
      for (const [toggle, { original, current }] of tabIndices) {
        if (toggle.getAttribute('tabindex') !== current) continue;
        if (original === null) toggle.removeAttribute('tabindex');
        else toggle.setAttribute('tabindex', original);
      }
    });

    const initTabindex = () => {
      if (inToolbar()) return;
      const toggles = getToggles();
      const available = toggles.filter(enabled);
      const active =
        available.find((toggle) => toggle === group.ownerDocument.activeElement) ||
        available.find((toggle) => toggle.getAttribute('tabindex') === '0') ||
        available.find((toggle) => toggle.getAttribute('aria-pressed') === 'true') ||
        available[0];
      toggles.forEach((t) => {
        setTabindex(t, t === active ? '0' : '-1');
      });
    };

    lifecycle.onUpdate(group, initTabindex);
    initTabindex();

    lifecycle.listen(group, group, 'click', (e) => {
      const toggle = e.target.closest('.toggle');
      if (
        !toggle ||
        toggle.closest('.toggle-group') !== group ||
        !enabled(toggle) ||
        group.hasAttribute('data-disabled')
      )
        return;

      const toggles = getToggles();
      const pressed = toggle.getAttribute('aria-pressed') === 'true';

      if ((group.getAttribute('data-type') || 'single') === 'single') {
        toggles.forEach((t) => t.setAttribute('aria-pressed', 'false'));
        if (!pressed) toggle.setAttribute('aria-pressed', 'true');
      } else {
        toggle.setAttribute('aria-pressed', String(!pressed));
      }

      if (!inToolbar()) toggles.forEach((t) => setTabindex(t, t === toggle ? '0' : '-1'));
    });

    lifecycle.listen(group, group, 'keydown', (e) => {
      const toggle = e.target.closest('.toggle');
      if (!toggle || inToolbar() || e.defaultPrevented || group.hasAttribute('data-disabled'))
        return;

      const toggles = getToggles().filter(enabled);
      const idx = toggles.indexOf(toggle);
      if (idx === -1) return;

      const vertical = group.getAttribute('data-orientation') === 'vertical';
      const fwd = vertical ? 'ArrowDown' : 'ArrowRight';
      const bwd = vertical ? 'ArrowUp' : 'ArrowLeft';
      let next;

      if (e.key === fwd) {
        e.preventDefault();
        next = (idx + 1) % toggles.length;
      } else if (e.key === bwd) {
        e.preventDefault();
        next = (idx - 1 + toggles.length) % toggles.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        next = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        next = toggles.length - 1;
      }

      if (next !== undefined) {
        e.stopPropagation();
        getToggles().forEach((t) => setTabindex(t, t === toggles[next] ? '0' : '-1'));
        toggles[next].focus();
      }
    });
  });
}

export function destroy(root) {
  lifecycle.destroy(root);
}

export const behavior = { name: 'toggle-group', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
