// -- Popover --------------------------------------------------

import { queryAll, createLifecycle } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const lifecycle = createLifecycle('popover');
const targets = new WeakMap();
const initializedTriggers = new Set();

function initPopoverTrigger(trigger) {
  const previous = targets.get(trigger);
  const current = trigger.ownerDocument.getElementById(trigger.getAttribute('popovertarget'));
  if (previous === current && current) return;
  lifecycle.destroy(trigger);
  const id = trigger.getAttribute('popovertarget');
  const popover = trigger.ownerDocument.getElementById(id);
  if (!popover || !popover.classList.contains('popover')) {
    return;
  }
  trigger.dataset.init = '';
  trigger.dataset.mewaPopoverInit = '';

  const previousTriggerAnchor = trigger.style.anchorName;
  const previousTargetAnchor = popover.style.positionAnchor;
  const anchorId = `--popover-${id}`;
  targets.set(trigger, popover);
  initializedTriggers.add(trigger);
  lifecycle.add(trigger, () => {
    if (trigger.style.anchorName === anchorId) trigger.style.anchorName = previousTriggerAnchor;
    if (popover.style.positionAnchor === anchorId)
      popover.style.positionAnchor = previousTargetAnchor;
    targets.delete(trigger);
    initializedTriggers.delete(trigger);
  });
  trigger.style.anchorName = anchorId;
  popover.style.positionAnchor = anchorId;
}

function rebindTargets() {
  // Iterate a copy: rebinding replaces the trigger's lifecycle entry.
  [...initializedTriggers].forEach((trigger) => {
    if (!trigger.isConnected) lifecycle.destroy(trigger);
    else initPopoverTrigger(trigger);
  });
}

export function enhance(root) {
  const popovers = queryAll(root, '.popover[id]');
  queryAll(root, '[popovertarget]').forEach(initPopoverTrigger);
  if (popovers.length) {
    queryAll(popovers[0].ownerDocument, '[popovertarget]').forEach(initPopoverTrigger);
  }
  rebindTargets();
}

export function destroy(root) {
  lifecycle.destroy(root);
  rebindTargets();
}

export const behavior = { name: 'popover', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
