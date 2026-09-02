// -- Hover Card ----------------------------------------------

const HOVER_CARD_OPEN_DELAY = 150;
const HOVER_CARD_CLOSE_DELAY = 100;
const HOVER_CARD_ANCHOR_SUPPORTED = typeof CSS !== 'undefined'
  && typeof CSS.supports === 'function'
  && CSS.supports('position-area', 'bottom');

let activeHoverCard = null;

function positionHoverCardFallback(card, trigger) {
  card.style.positionArea = 'unset';
  card.style.positionTryFallbacks = 'none';
  card.style.marginTop = '0';
  card.style.marginRight = '0';
  card.style.marginBottom = '0';
  card.style.marginLeft = '0';

  const triggerRect = trigger.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  if (!cardRect.width || !cardRect.height) return;

  const side = card.dataset.side || 'bottom';
  const align = card.dataset.align || 'center';
  const gap = 8;
  const edge = 4;
  let top;
  let left;

  if (side === 'top' || side === 'bottom') {
    top = side === 'top'
      ? triggerRect.top - cardRect.height - gap
      : triggerRect.bottom + gap;
    if (align === 'start') left = triggerRect.left;
    else if (align === 'end') left = triggerRect.right - cardRect.width;
    else left = triggerRect.left + (triggerRect.width - cardRect.width) / 2;
  } else {
    left = side === 'left'
      ? triggerRect.left - cardRect.width - gap
      : triggerRect.right + gap;
    if (align === 'start') top = triggerRect.top;
    else if (align === 'end') top = triggerRect.bottom - cardRect.height;
    else top = triggerRect.top + (triggerRect.height - cardRect.height) / 2;
  }

  card.style.top = `${Math.max(edge, Math.min(top, window.innerHeight - cardRect.height - edge))}px`;
  card.style.left = `${Math.max(edge, Math.min(left, window.innerWidth - cardRect.width - edge))}px`;
}

function closeHoverCard(state, { restoreFocus = false, immediate = false } = {}) {
  clearTimeout(state.openTimer);
  clearTimeout(state.closeTimer);

  const close = () => {
    const focusWasInside = state.card.contains(document.activeElement);
    try {
      if (state.card.matches(':popover-open')) state.card.hidePopover();
    } catch {
      // The native popover can already be closed or unsupported.
    }
    if (activeHoverCard === state) activeHoverCard = null;
    if ((restoreFocus || focusWasInside)
      && state.trigger.isConnected
      && document.activeElement !== state.trigger) {
      state.suppressFocusOpen = true;
      state.trigger.focus();
    }
  };

  if (immediate) close();
  else state.closeTimer = setTimeout(close, HOVER_CARD_CLOSE_DELAY);
}

function scheduleHoverCardClose(state) {
  if (state.pointerOnTrigger || state.pointerOnCard || state.focusWithin) return;
  closeHoverCard(state);
}

function openHoverCard(state, immediate = false) {
  clearTimeout(state.closeTimer);
  clearTimeout(state.openTimer);

  const open = () => {
    if (!state.trigger.isConnected || !state.card.isConnected) return;
    if (activeHoverCard && activeHoverCard !== state) {
      closeHoverCard(activeHoverCard, { immediate: true });
    }
    try {
      if (!state.card.matches(':popover-open')) state.card.showPopover();
    } catch {
      return;
    }
    activeHoverCard = state;
    if (!HOVER_CARD_ANCHOR_SUPPORTED) positionHoverCardFallback(state.card, state.trigger);
  };

  if (immediate) open();
  else state.openTimer = setTimeout(open, HOVER_CARD_OPEN_DELAY);
}

function initHoverCards() {
  document.querySelectorAll('[data-hover-card-trigger]:not([data-hover-card-init])').forEach((trigger) => {
    const id = trigger.dataset.hoverCardTrigger;
    const card = document.getElementById(id);
    if (!card || !card.classList.contains('hover-card') || typeof card.showPopover !== 'function') return;

    trigger.dataset.hoverCardInit = '';
    const describedBy = new Set((trigger.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
    describedBy.add(card.id);
    trigger.setAttribute('aria-describedby', Array.from(describedBy).join(' '));

    const anchorId = `--hover-card-${card.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
    trigger.style.anchorName = anchorId;
    card.style.positionAnchor = anchorId;

    const state = {
      trigger,
      card,
      openTimer: null,
      closeTimer: null,
      pointerOnTrigger: false,
      pointerOnCard: false,
      focusWithin: false,
      suppressFocusOpen: false
    };

    trigger.addEventListener('mouseenter', () => {
      state.pointerOnTrigger = true;
      openHoverCard(state);
    });
    trigger.addEventListener('mouseleave', (event) => {
      state.pointerOnTrigger = false;
      if (event.relatedTarget && card.contains(event.relatedTarget)) return;
      scheduleHoverCardClose(state);
    });
    trigger.addEventListener('focus', () => {
      state.focusWithin = true;
      if (state.suppressFocusOpen) {
        state.suppressFocusOpen = false;
        return;
      }
      openHoverCard(state, true);
    });
    trigger.addEventListener('blur', (event) => {
      if (event.relatedTarget && card.contains(event.relatedTarget)) return;
      state.focusWithin = false;
      scheduleHoverCardClose(state);
    });

    card.addEventListener('mouseenter', () => {
      state.pointerOnCard = true;
      clearTimeout(state.closeTimer);
      clearTimeout(state.openTimer);
    });
    card.addEventListener('mouseleave', (event) => {
      state.pointerOnCard = false;
      if (event.relatedTarget && trigger.contains(event.relatedTarget)) return;
      scheduleHoverCardClose(state);
    });
    card.addEventListener('focusin', () => {
      state.focusWithin = true;
      clearTimeout(state.closeTimer);
    });
    card.addEventListener('focusout', (event) => {
      if (event.relatedTarget && (card.contains(event.relatedTarget) || trigger.contains(event.relatedTarget))) return;
      state.focusWithin = false;
      scheduleHoverCardClose(state);
    });

    const onEscape = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeHoverCard(state, { restoreFocus: true, immediate: true });
    };
    trigger.addEventListener('keydown', onEscape);
    card.addEventListener('keydown', onEscape);
  });

  if (activeHoverCard && (!activeHoverCard.trigger.isConnected || !activeHoverCard.card.isConnected)) {
    activeHoverCard = null;
  }
}

if (!document.__mewaHoverCardInit) {
  document.__mewaHoverCardInit = true;

  document.addEventListener('pointerdown', (event) => {
    if (!activeHoverCard) return;
    const { trigger, card } = activeHoverCard;
    if (trigger.contains(event.target) || card.contains(event.target)) return;
    closeHoverCard(activeHoverCard, { immediate: true });
  });

  document.addEventListener('scroll', () => {
    if (activeHoverCard) closeHoverCard(activeHoverCard, { immediate: true });
  }, { passive: true, capture: true });

  window.addEventListener('resize', () => {
    if (!activeHoverCard) return;
    if (HOVER_CARD_ANCHOR_SUPPORTED) return;
    positionHoverCardFallback(activeHoverCard.card, activeHoverCard.trigger);
  });

  initHoverCards();
  new MutationObserver(initHoverCards).observe(document, { childList: true, subtree: true });
}
