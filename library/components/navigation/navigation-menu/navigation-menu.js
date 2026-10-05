// -- Navigation Menu -----------------------------------------

import { queryAll, createLifecycle } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const lifecycle = createLifecycle('navigation-menu');
const triggerStates = new WeakMap();
const initializedTriggers = new Set();

function rebindTargets() {
  initializedTriggers.forEach((trigger) => {
    if (!trigger.isConnected || !trigger.closest('.nav-menu')) {
      lifecycle.destroy(trigger);
      return;
    }
    const state = triggerStates.get(trigger);
    const id = trigger.getAttribute('popovertarget');
    const content = trigger.ownerDocument.getElementById(id);
    if (state.content === content) return;
    state.unbind?.();
    state.content = content;
    state.unbind = null;
    if (!content) return;
    const previousTriggerAnchor = trigger.style.anchorName;
    const previousTargetAnchor = content.style.positionAnchor;
    const anchorId = `--nav-menu-${id}`;
    trigger.style.anchorName = anchorId;
    content.style.positionAnchor = anchorId;
    state.unbind = () => {
      if (trigger.style.anchorName === anchorId) trigger.style.anchorName = previousTriggerAnchor;
      if (content.style.positionAnchor === anchorId)
        content.style.positionAnchor = previousTargetAnchor;
    };
  });
}

export function enhance(root) {
  queryAll(root, '.nav-menu').forEach((nav) => {
    if (lifecycle.has(nav)) return;
    nav.dataset.init = '';
    nav.dataset.mewaNavigationMenuInit = '';
    lifecycle.add(nav, () => {});
  });
  queryAll(root, '.nav-menu-trigger[popovertarget]').forEach((trigger) => {
    if (triggerStates.has(trigger) || !trigger.closest('.nav-menu')) return;
    const state = { content: null, unbind: null };
    triggerStates.set(trigger, state);
    initializedTriggers.add(trigger);
    lifecycle.add(trigger, () => {
      state.unbind?.();
      triggerStates.delete(trigger);
      initializedTriggers.delete(trigger);
    });
  });
  rebindTargets();
}

export function destroy(root) {
  lifecycle.destroy(root);
  rebindTargets();
}

export const behavior = { name: 'navigation-menu', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
