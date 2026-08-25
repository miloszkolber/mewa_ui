// -- Tooltip --------------------------------------------------

const DELAY_DEFAULT = 500;      // ms before first tooltip opens
const GROUP_TIMEOUT = 400;      // ms after last tooltip hides before delay resets
const ANCHOR_SUPPORTED = typeof CSS !== 'undefined' && !!CSS.supports && CSS.supports('position-area', 'top');

let groupOpen = false;       // true while any tooltip is visible
let groupTimer = null;       // timeout to reset groupOpen

function markGroupOpen() {
  groupOpen = true;
  clearTimeout(groupTimer);
}

function scheduleGroupReset() {
  clearTimeout(groupTimer);
  groupTimer = setTimeout(() => { groupOpen = false; }, GROUP_TIMEOUT);
}

// Fallback placement for engines without position-area: anchor the tip
// to the trigger's box with explicit coordinates instead of the static
// position (which can land off-screen when the tip sits at the end of
// the document).
function positionFallback(tip, trigger) {
  // Clear declarative placement and side-gap margins so explicit
  // coordinates are the only positioning
  tip.style.positionArea = 'unset';
  tip.style.positionTryFallbacks = 'none';
  tip.style.marginTop = '0';
  tip.style.marginRight = '0';
  tip.style.marginBottom = '0';
  tip.style.marginLeft = '0';
  const tr = trigger.getBoundingClientRect();
  const r = tip.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const side = tip.dataset.side || 'top';
  const align = tip.dataset.align || 'center';
  const gap = 6;
  let top, left;
  if (side === 'top' || side === 'bottom') {
    top = side === 'top' ? tr.top - r.height - gap : tr.bottom + gap;
    if (align === 'start') left = tr.left;
    else if (align === 'end') left = tr.right - r.width;
    else left = tr.left + (tr.width - r.width) / 2;
  } else {
    left = side === 'left' ? tr.left - r.width - gap : tr.right + gap;
    if (align === 'start') top = tr.top;
    else if (align === 'end') top = tr.bottom - r.height;
    else top = tr.top + (tr.height - r.height) / 2;
  }
  top = Math.max(4, Math.min(top, window.innerHeight - r.height - 4));
  left = Math.max(4, Math.min(left, window.innerWidth - r.width - 4));
  tip.style.top = `${top}px`;
  tip.style.left = `${left}px`;
}

function init() {
document.querySelectorAll('[data-tooltip-trigger]:not([data-init])').forEach((trigger) => {
  trigger.dataset.init = '';
  const tip = document.getElementById(trigger.dataset.tooltipTrigger);
  if (!tip) return;

  // CSS anchor positioning — unique, ident-safe name per trigger-tooltip pair
  const anchorId = `--tooltip-${tip.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  trigger.style.anchorName = anchorId;
  tip.style.positionAnchor = anchorId;

  trigger.setAttribute('aria-describedby', tip.id);

  // Custom delays are not supported. Only `data-delay="0"` is honored,
  // and it disables the open delay; any other value keeps the 500 ms default.
  const delayDisabled = trigger.dataset.delay === '0';

  let openTimer = null;
  let closeTimer = null;

  function show() {
    clearTimeout(closeTimer);
    clearTimeout(openTimer);
    const wait = groupOpen || delayDisabled ? 0 : DELAY_DEFAULT;
    openTimer = setTimeout(() => {
      let open = false;
      try {
        open = tip.matches(':popover-open');
        if (!open) { tip.showPopover(); open = true; }
      } catch { return; }
      if (!ANCHOR_SUPPORTED) positionFallback(tip, trigger);
      markGroupOpen();
    }, wait);
  }

  function hide() {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      try { tip.hidePopover(); } catch (e) { /* already closed */ }
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

// -- Scroll dismiss -------------------------------------------
if (!document.__tooltipScrollInit) {
  document.__tooltipScrollInit = true;
  document.addEventListener('scroll', () => {
    document.querySelectorAll('.tooltip:popover-open').forEach((tip) => {
      try {
        tip.hidePopover();
      } catch (e) {}
    });
    scheduleGroupReset();
  }, { passive: true, capture: true });
}
