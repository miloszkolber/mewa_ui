import { queryAll, createLifecycle } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const lifecycle = createLifecycle('message-scroller');

function messageScrollerThreshold(root) {
  const configured = Number.parseFloat(root.dataset.threshold || '');
  return Number.isFinite(configured) && configured > 0 ? configured : 24;
}

function initMessageScroller(root) {
  if (lifecycle.has(root)) return;
  const viewport = root.querySelector('.message-scroller-viewport');
  const content = root.querySelector('.message-scroller-content');
  const jump = root.querySelector('[data-message-scroller-jump]');
  if (!viewport || !content) return;

  root.dataset.init = '';
  root.dataset.mewaMessageScrollerInit = '';
  lifecycle.add(root, () => {
    if (jump) jump.hidden = true;
    root.removeAttribute('data-pinned');
  });

  const threshold = messageScrollerThreshold(root);
  let pinned = root.dataset.defaultPinned !== 'false';
  let conversationKey = root.dataset.conversationKey || '';
  let scrollPosition = viewport.scrollTop;
  const view = root.ownerDocument.defaultView;
  let intent = null;
  let intentFrame = null;

  const clearIntent = () => {
    intent = null;
    if (intentFrame !== null) view.cancelAnimationFrame(intentFrame);
    intentFrame = null;
  };
  lifecycle.add(root, clearIntent);

  const atBottom = () =>
    viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= threshold;

  const syncJump = () => {
    if (jump) jump.hidden = pinned;
  };

  const setPinned = (next, emit = true) => {
    const changed = pinned !== next;
    pinned = next;
    root.dataset.pinned = pinned ? 'true' : 'false';
    syncJump();
    if (changed && emit) {
      root.dispatchEvent(
        new CustomEvent('message-scroller:pinned-change', {
          bubbles: true,
          detail: { pinned }
        })
      );
    }
  };

  const scrollToBottom = (emit = true) => {
    clearIntent();
    viewport.scrollTop = viewport.scrollHeight;
    scrollPosition = viewport.scrollTop;
    setPinned(true, emit);
  };

  // A native scroll can begin after content observers run. Withhold writes,
  // not native input or derived pin state, until that scroll has settled.
  const suspendFollowing = (event, distance = null) => {
    if (
      !pinned ||
      viewport.scrollTop <= 0 ||
      !view?.requestAnimationFrame ||
      !('onscrollend' in viewport)
    )
      return;
    if (intent && !intent.moved && intent.event.defaultPrevented) clearIntent();
    if (!intent)
      intent = { top: scrollPosition, moved: viewport.scrollTop < scrollPosition, event, distance };
    else {
      intent.event = event;
      intent.distance =
        intent.distance === null || distance === null ? null : intent.distance + distance;
    }
    if (intentFrame !== null) return;
    intentFrame = view.requestAnimationFrame(() => {
      intentFrame = null;
      // A later application listener may cancel the native action.
      if (intent && !intent.moved && intent.event.defaultPrevented) {
        clearIntent();
        if (pinned) scrollToBottom(false);
      }
    });
  };

  const onWheel = (event) => {
    if (
      !event.isTrusted ||
      event.defaultPrevented ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      event.shiftKey ||
      event.deltaY >= 0 ||
      // Subpixel pixel-mode input may produce no scroll/scrollend pair.
      (event.deltaMode === 0 && Math.abs(event.deltaY) < 1) ||
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
    )
      return;
    if (
      event.target.closest?.(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
      )
    )
      return;
    // A nested native scroll surface owns its input, including at its edges.
    for (let target = event.target; target && target !== viewport; target = target.parentElement) {
      if (
        target.scrollHeight > target.clientHeight &&
        /^(auto|scroll)$/.test(view?.getComputedStyle(target).overflowY)
      )
        return;
    }
    // Wheel pixels are viewport-relative; scrollTop uses the element's local
    // CSS pixels. Include ancestor zoom so fractional native progress completes.
    let zoom = viewport.currentCSSZoom;
    if (!Number.isFinite(zoom) || zoom <= 0) {
      zoom = 1;
      for (let target = viewport; target; target = target.parentElement) {
        const scale = Number.parseFloat(view?.getComputedStyle(target).zoom);
        if (Number.isFinite(scale) && scale > 0) zoom *= scale;
      }
    }
    suspendFollowing(
      event,
      event.deltaMode === 0 ? Math.min(-event.deltaY / zoom, scrollPosition) : null
    );
  };

  const onKeyDown = (event) => {
    if (
      !event.isTrusted ||
      event.defaultPrevented ||
      event.target !== viewport ||
      event.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    if (['ArrowUp', 'PageUp', 'Home'].includes(event.key) || (event.key === ' ' && event.shiftKey))
      suspendFollowing(event);
  };

  const onScroll = () => {
    const position = viewport.scrollTop;
    if (intent) {
      // Ignore an already queued follow-scroll event before native progress.
      if (position >= intent.top && !intent.moved) return;
      intent.moved = true;
    }
    // Geometry can grow before a queued module scroll event is delivered.
    if (pinned && position === scrollPosition) return;
    scrollPosition = position;
    setPinned(atBottom());
    if (
      intent &&
      (!pinned || (intent.distance !== null && intent.top - position >= intent.distance))
    )
      clearIntent();
  };
  const onScrollEnd = () => {
    if (!intent?.moved) return;
    clearIntent();
    setPinned(atBottom());
  };
  const onJump = () => {
    if (root.ownerDocument.activeElement === jump) viewport.focus({ preventScroll: true });
    scrollToBottom();
  };

  lifecycle.listen(root, viewport, 'scroll', onScroll, { passive: true });
  lifecycle.listen(root, viewport, 'scrollend', onScrollEnd, { passive: true });
  lifecycle.listen(root, viewport, 'wheel', onWheel, { passive: true });
  lifecycle.listen(root, viewport, 'keydown', onKeyDown);
  lifecycle.listen(root, jump, 'click', onJump);

  const contentObserver = new MutationObserver(() => {
    if (pinned && !intent) scrollToBottom(false);
  });
  lifecycle.add(root, () => contentObserver.disconnect());
  contentObserver.observe(content, { childList: true, subtree: true, characterData: true });

  const attributeObserver = new MutationObserver(() => {
    const nextKey = root.dataset.conversationKey || '';
    if (nextKey === conversationKey) return;
    conversationKey = nextKey;
    scrollToBottom();
  });
  lifecycle.add(root, () => attributeObserver.disconnect());
  attributeObserver.observe(root, { attributes: true, attributeFilter: ['data-conversation-key'] });

  const resizeObserver =
    typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => {
          if (pinned && !intent) scrollToBottom(false);
        })
      : null;
  lifecycle.add(root, () => resizeObserver?.disconnect());
  resizeObserver?.observe(viewport);
  resizeObserver?.observe(content);

  if (pinned) scrollToBottom(false);
  else setPinned(false, false);
}

export function enhance(root) {
  const scrollers = queryAll(root, '.message-scroller');
  const ancestor = root?.nodeType === 1 ? root.closest?.('.message-scroller') : null;
  if (ancestor) scrollers.push(ancestor);
  new Set(scrollers).forEach(initMessageScroller);
}

export function destroy(root = typeof document === 'undefined' ? null : document) {
  lifecycle.destroy(root);
}

export const behavior = { name: 'message-scroller', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
