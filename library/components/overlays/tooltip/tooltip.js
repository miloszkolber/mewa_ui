// -- Tooltip --------------------------------------------------

import { queryAll, createLifecycle } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const lifecycle = createLifecycle('tooltip');

const DELAY_DEFAULT = 500;
const GROUP_TIMEOUT = 400;

const documentGroups = new WeakMap();
const triggerStates = new WeakMap();
const initializedTriggers = new Set();

function documentView(doc) {
  return doc.defaultView || (typeof window === 'undefined' ? null : window);
}

function supportsAnchorPosition(element) {
  const css = documentView(element.ownerDocument)?.CSS;
  return Boolean(css?.supports && css.supports('position-area', 'top'));
}

function markGroupOpen(group) {
  group.open = true;
  clearTimeout(group.timer);
}

function scheduleGroupReset(group) {
  clearTimeout(group.timer);
  group.timer = setTimeout(() => {
    group.open = [...group.triggers].some((trigger) =>
      triggerStates.get(trigger)?.tip?.matches(':popover-open')
    );
    group.timer = null;
  }, GROUP_TIMEOUT);
}

function positionFallback(tip, trigger) {
  tip.style.positionArea = 'unset';
  tip.style.positionTryFallbacks = 'none';
  tip.style.marginTop = '0';
  tip.style.marginRight = '0';
  tip.style.marginBottom = '0';
  tip.style.marginLeft = '0';

  const triggerRect = trigger.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  if (!tipRect.width || !tipRect.height) return;
  const view = documentView(trigger.ownerDocument);
  if (!view) return;

  const side = tip.dataset.side || 'top';
  const align = tip.dataset.align || 'center';
  const gap = 6;
  let top;
  let left;

  if (side === 'top' || side === 'bottom') {
    top = side === 'top' ? triggerRect.top - tipRect.height - gap : triggerRect.bottom + gap;
    if (align === 'start') left = triggerRect.left;
    else if (align === 'end') left = triggerRect.right - tipRect.width;
    else left = triggerRect.left + (triggerRect.width - tipRect.width) / 2;
  } else {
    left = side === 'left' ? triggerRect.left - tipRect.width - gap : triggerRect.right + gap;
    if (align === 'start') top = triggerRect.top;
    else if (align === 'end') top = triggerRect.bottom - tipRect.height;
    else top = triggerRect.top + (triggerRect.height - tipRect.height) / 2;
  }

  top = Math.max(4, Math.min(top, view.innerHeight - tipRect.height - 4));
  left = Math.max(4, Math.min(left, view.innerWidth - tipRect.width - 4));
  tip.style.top = `${top}px`;
  tip.style.left = `${left}px`;
}

function syncArrowSide(tip, trigger) {
  const triggerRect = trigger.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  if (!tipRect.width || !tipRect.height) return;

  const side = tip.dataset.side || 'top';
  const gap = 6;
  let arrowSide;

  if (side === 'top' || side === 'bottom') {
    if (tipRect.bottom <= triggerRect.top + gap) arrowSide = 'bottom';
    else if (tipRect.top >= triggerRect.bottom - gap) arrowSide = 'top';
    else arrowSide = 'bottom';
  } else {
    if (tipRect.right <= triggerRect.left + gap) arrowSide = 'right';
    else if (tipRect.left >= triggerRect.right - gap) arrowSide = 'left';
    else arrowSide = 'right';
  }

  tip.style.setProperty('--tooltip-arrow-side', arrowSide);
}

function installScrollListener(doc) {
  if (documentGroups.has(doc)) return documentGroups.get(doc);
  const group = { open: false, timer: null, triggers: new Set() };
  documentGroups.set(doc, group);
  doc.__tooltipScrollInit = true;
  lifecycle.add(doc, () => {
    delete doc.__tooltipScrollInit;
    clearTimeout(group.timer);
    group.open = false;
    documentGroups.delete(doc);
  });
  lifecycle.listen(
    doc,
    doc,
    'scroll',
    () => {
      group.triggers.forEach((trigger) => {
        const state = triggerStates.get(trigger);
        if (!state) return;
        clearTimeout(state.openTimer);
        state.openTimer = null;
        try {
          if (state.tip?.matches(':popover-open')) state.tip.hidePopover();
        } catch {
          // The native popover can already be closed.
        }
      });
      scheduleGroupReset(group);
    },
    { passive: true, capture: true }
  );
  return group;
}

function resolveTooltip(trigger) {
  const id = trigger?.dataset?.tooltipTrigger;
  if (!id) return null;
  const tip = trigger.ownerDocument?.getElementById(id);
  return tip?.classList?.contains('tooltip') ? tip : null;
}

function unbindTooltip(state) {
  clearTimeout(state.openTimer);
  clearTimeout(state.closeTimer);
  state.openTimer = null;
  state.closeTimer = null;
  const view = documentView(state.trigger.ownerDocument);
  state.frames.forEach((frame) => view?.cancelAnimationFrame(frame));
  state.frames.clear();
  if (state.tip && state.onToggle) {
    state.tip.removeEventListener('toggle', state.onToggle);
    state.tip.removeEventListener('mouseenter', state.show);
    state.tip.removeEventListener('mouseleave', state.hide);
    try {
      state.tip.hidePopover();
    } catch {
      /* Already closed. */
    }
    state.tip.style.positionAnchor = '';
  }
  if (state.describedBy.size) {
    state.trigger.setAttribute('aria-describedby', Array.from(state.describedBy).join(' '));
  } else {
    state.trigger.removeAttribute('aria-describedby');
  }
  state.trigger.style.anchorName = '';
  state.tip = null;
  state.onToggle = null;
  state.pointerOnTip = false;
}

function bindTooltip(state, tip) {
  const { trigger } = state;
  const anchorId = `--tooltip-${tip.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  trigger.style.anchorName = anchorId;
  tip.style.positionAnchor = anchorId;
  trigger.setAttribute(
    'aria-describedby',
    Array.from(new Set([...state.describedBy, tip.id])).join(' ')
  );

  state.tip = tip;
  state.onToggle = () => {
    if (state.tip !== tip) return;
    if (!tip.matches(':popover-open')) {
      scheduleGroupReset(state.group);
      return;
    }
    const view = documentView(tip.ownerDocument);
    if (!view?.requestAnimationFrame) {
      syncArrowSide(tip, trigger);
      return;
    }
    const frame = (callback) => {
      const id = view.requestAnimationFrame(() => {
        state.frames.delete(id);
        callback();
      });
      state.frames.add(id);
    };
    frame(() => {
      frame(() => {
        if (state.tip === tip) syncArrowSide(tip, trigger);
      });
    });
  };
  tip.addEventListener('toggle', state.onToggle);
  tip.addEventListener('mouseenter', state.show);
  tip.addEventListener('mouseleave', state.hide);
}

function cleanupTooltipTrigger(trigger) {
  const state = triggerStates.get(trigger);
  if (!state) return;
  unbindTooltip(state);
  trigger.removeEventListener('mouseenter', state.show);
  trigger.removeEventListener('mouseleave', state.hide);
  trigger.removeEventListener('focus', state.show);
  trigger.removeEventListener('blur', state.hide);
  trigger.removeEventListener('keydown', state.onKeydown);
  delete trigger.dataset.mewaTooltipInit;
  triggerStates.delete(trigger);
  initializedTriggers.delete(trigger);
  state.group.triggers.delete(trigger);
  if (!state.group.triggers.size) lifecycle.destroy(trigger.ownerDocument);
  else scheduleGroupReset(state.group);
}

function rebindTooltipTargets() {
  initializedTriggers.forEach((trigger) => {
    const state = triggerStates.get(trigger);
    if (!state || !trigger.isConnected) {
      cleanupTooltipTrigger(trigger);
      return;
    }

    const tip = resolveTooltip(trigger);
    if (state.tip === tip) return;
    unbindTooltip(state);
    if (tip) bindTooltip(state, tip);
  });
}

function initTooltipTrigger(trigger) {
  if (triggerStates.has(trigger)) return;
  const tip = resolveTooltip(trigger);
  if (!tip) return;

  const state = {
    trigger,
    describedBy: new Set(
      (trigger.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)
    ),
    tip: null,
    onToggle: null,
    openTimer: null,
    closeTimer: null,
    frames: new Set(),
    show: null,
    hide: null
  };
  state.group = installScrollListener(trigger.ownerDocument);
  state.group.triggers.add(trigger);
  state.pointerOnTrigger = false;
  state.pointerOnTip = false;
  state.focused = false;
  const delayDisabled = trigger.dataset.delay === '0';

  state.show = (event) => {
    if (event.type === 'focus') state.focused = true;
    else if (event.currentTarget === trigger) state.pointerOnTrigger = true;
    else state.pointerOnTip = true;
    clearTimeout(state.closeTimer);
    clearTimeout(state.openTimer);
    const wait = state.group.open || delayDisabled ? 0 : DELAY_DEFAULT;
    state.openTimer = setTimeout(() => {
      state.openTimer = null;
      const currentTip = state.tip;
      if (!currentTip?.isConnected) return;
      try {
        if (!currentTip.matches(':popover-open')) currentTip.showPopover();
      } catch {
        return;
      }
      if (!supportsAnchorPosition(trigger)) positionFallback(currentTip, trigger);
      markGroupOpen(state.group);
    }, wait);
  };

  state.hide = (event) => {
    if (event.type === 'blur') state.focused = false;
    else if (event.currentTarget === trigger) state.pointerOnTrigger = false;
    else state.pointerOnTip = false;
    if (state.focused || state.pointerOnTrigger || state.pointerOnTip) return;
    clearTimeout(state.openTimer);
    state.openTimer = null;
    clearTimeout(state.closeTimer);
    state.closeTimer = setTimeout(() => {
      state.closeTimer = null;
      const currentTip = state.tip;
      if (!currentTip) return;
      try {
        currentTip.hidePopover();
      } catch {
        // The native popover can already be closed.
      }
      scheduleGroupReset(state.group);
    }, 120);
  };

  state.onKeydown = (event) => {
    if (event.key !== 'Escape') return;
    const open = state.tip?.matches(':popover-open');
    if (!open && state.openTimer === null) return;
    event.preventDefault();
    event.stopPropagation();
    clearTimeout(state.openTimer);
    clearTimeout(state.closeTimer);
    state.openTimer = null;
    state.closeTimer = null;
    if (open) state.tip.hidePopover();
    scheduleGroupReset(state.group);
  };

  trigger.dataset.init = '';
  trigger.dataset.mewaTooltipInit = '';
  trigger.addEventListener('mouseenter', state.show);
  trigger.addEventListener('mouseleave', state.hide);
  trigger.addEventListener('focus', state.show);
  trigger.addEventListener('blur', state.hide);
  trigger.addEventListener('keydown', state.onKeydown);
  triggerStates.set(trigger, state);
  initializedTriggers.add(trigger);
  bindTooltip(state, tip);
}

export function enhance(root) {
  const scope = root || (typeof document === 'undefined' ? null : document);
  const doc = scope?.nodeType === 9 ? scope : scope?.ownerDocument;
  if (!scope || !doc) return;

  const tips = queryAll(scope, '.tooltip[id]');
  const triggerScope = tips.length ? doc : scope;
  queryAll(triggerScope, '[data-tooltip-trigger]').forEach(initTooltipTrigger);
  rebindTooltipTargets();
}

export function destroy(root) {
  queryAll(root, '[data-tooltip-trigger]').forEach(cleanupTooltipTrigger);
  lifecycle.destroy(root);
  rebindTooltipTargets();
}

export const behavior = { name: 'tooltip', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
