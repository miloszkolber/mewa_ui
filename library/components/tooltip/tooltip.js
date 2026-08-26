// -- Tooltip --------------------------------------------------

const DELAY_DEFAULT = 500;
const GROUP_TIMEOUT = 400;
const ANCHOR_SUPPORTED = typeof CSS !== 'undefined'
  && !!CSS.supports
  && CSS.supports('position-area', 'top');

let groupOpen = false;
let groupTimer = null;

function markGroupOpen() {
  groupOpen = true;
  clearTimeout(groupTimer);
}

function scheduleGroupReset() {
  clearTimeout(groupTimer);
  groupTimer = setTimeout(() => { groupOpen = false; }, GROUP_TIMEOUT);
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

  const side = tip.dataset.side || 'top';
  const align = tip.dataset.align || 'center';
  const gap = 6;
  let top;
  let left;

  if (side === 'top' || side === 'bottom') {
    top = side === 'top'
      ? triggerRect.top - tipRect.height - gap
      : triggerRect.bottom + gap;
    if (align === 'start') left = triggerRect.left;
    else if (align === 'end') left = triggerRect.right - tipRect.width;
    else left = triggerRect.left + (triggerRect.width - tipRect.width) / 2;
  } else {
    left = side === 'left'
      ? triggerRect.left - tipRect.width - gap
      : triggerRect.right + gap;
    if (align === 'start') top = triggerRect.top;
    else if (align === 'end') top = triggerRect.bottom - tipRect.height;
    else top = triggerRect.top + (triggerRect.height - tipRect.height) / 2;
  }

  top = Math.max(4, Math.min(top, window.innerHeight - tipRect.height - 4));
  left = Math.max(4, Math.min(left, window.innerWidth - tipRect.width - 4));
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

function init() {
  document.querySelectorAll('[data-tooltip-trigger]:not([data-init])').forEach((trigger) => {
    trigger.dataset.init = '';
    const tip = document.getElementById(trigger.dataset.tooltipTrigger);
    if (!tip || !tip.classList.contains('tooltip')) {
      delete trigger.dataset.init;
      return;
    }

    const anchorId = `--tooltip-${tip.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
    trigger.style.anchorName = anchorId;
    tip.style.positionAnchor = anchorId;
    trigger.setAttribute('aria-describedby', tip.id);

    tip.addEventListener('toggle', () => {
      if (!tip.matches(':popover-open')) return;
      requestAnimationFrame(() => requestAnimationFrame(() => syncArrowSide(tip, trigger)));
    });

    const delayDisabled = trigger.dataset.delay === '0';
    let openTimer = null;
    let closeTimer = null;

    function show() {
      clearTimeout(closeTimer);
      clearTimeout(openTimer);
      const wait = groupOpen || delayDisabled ? 0 : DELAY_DEFAULT;
      openTimer = setTimeout(() => {
        try {
          if (!tip.matches(':popover-open')) tip.showPopover();
        } catch {
          return;
        }
        if (!ANCHOR_SUPPORTED) positionFallback(tip, trigger);
        markGroupOpen();
      }, wait);
    }

    function hide() {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        try {
          tip.hidePopover();
        } catch {
          // The native popover can already be closed.
        }
        scheduleGroupReset();
      }, 0);
    }

    trigger.addEventListener('mouseenter', show);
    trigger.addEventListener('mouseleave', hide);
    trigger.addEventListener('focus', show);
    trigger.addEventListener('blur', hide);
  });
}

init();
new MutationObserver(init).observe(document, { childList: true, subtree: true });

if (!document.__tooltipScrollInit) {
  document.__tooltipScrollInit = true;
  document.addEventListener('scroll', () => {
    document.querySelectorAll('.tooltip:popover-open').forEach((tip) => {
      try {
        tip.hidePopover();
      } catch {
        // The native popover can already be closed.
      }
    });
    scheduleGroupReset();
  }, { passive: true, capture: true });
}
