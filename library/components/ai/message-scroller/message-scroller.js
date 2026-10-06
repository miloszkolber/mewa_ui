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
  // A native scrollbar gesture starts with a pointer press in the scrollbar
  // gutter, but unlike wheel and keyboard input it carries no scroll distance
  // the module can key a suspension off. Suspend follow writes for the gesture
  // so growth cannot overwrite it. Native scroll events keep driving pin state.
  // Gutter geometry is cached outside the press because reading layout inside
  // pointerdown can disturb the browser's own scrollbar handling.
  //
  // Releasing the press never writes. Some engines apply the scrollbar scroll
  // at or after pointerup, and a synchronous catch-up write would erase that
  // native scroll before its scroll event is even dispatched. Resumption
  // emerges instead: the next growth still finds the reader pinned and follows
  // again, while a reader the gesture moved away stays unpinned.
  //
  // A press whose scroll lands after release keeps the suspension until the
  // scroll event, scrollend, or a generous input-settle bound proves no scroll
  // is coming. The bound only delays resuming follow writes; it never moves
  // the reader.
  const BAR_SETTLE_MS = 500;
  let barPressId = null;
  let barMoved = false;
  let barEnded = false;
  let barSettle = null;
  let barLeft = 0;
  let barRight = 0;
  let barGutter = 0;
  let barRTL = false;
  const refreshBarGeometry = () => {
    const rect = viewport.getBoundingClientRect();
    barLeft = rect.left;
    barRight = rect.right;
    barGutter = viewport.offsetWidth - viewport.clientWidth;
  };
  const clearBarSettle = () => {
    if (barSettle !== null) view?.clearTimeout(barSettle);
    barSettle = null;
  };

  const clearIntent = () => {
    intent = null;
    if (intentFrame !== null) view.cancelAnimationFrame(intentFrame);
    intentFrame = null;
  };
  lifecycle.add(root, clearIntent);
  lifecycle.add(root, () => {
    clearBarSettle();
    barPressId = null;
    barMoved = false;
    barEnded = false;
  });

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
    // Explicit navigation wins over a held press. Observer-driven follow
    // writes below stay gated on a released press instead.
    barPressId = null;
    barMoved = false;
    barEnded = false;
    clearBarSettle();
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

  // Ending a gutter press only lifts the suspension. A press whose scroll was
  // already observed leaves pin state as native scrolling set it, and a press
  // that never moved leaves the reader pinned so the next growth follows
  // again. Neither path writes here: a write on release could land between a
  // late native scroll and its scroll event and erase it.
  //
  // A scrollend only ends a press that both released and moved. Scrolling
  // settles mid-hold too, and a stale scrollend from positioning the fixture
  // can land after release, so neither ends an unmoved press: only the settle
  // bound does, and it never writes.
  const endBarPress = (type, pointerId) => {
    if (barPressId === null) return;
    if (type === 'scrollend') {
      if (!barEnded || !barMoved) return;
    } else {
      if (pointerId !== barPressId) return;
      barEnded = true;
    }
    if (barMoved) {
      barPressId = null;
      barMoved = false;
      barEnded = false;
      clearBarSettle();
      return;
    }
    // No scroll observed yet, but the engine may still apply one after
    // release. Hold the suspension until a scroll or the settle bound proves
    // nothing is coming.
    clearBarSettle();
    barSettle = view?.setTimeout(() => {
      barSettle = null;
      barPressId = null;
      barMoved = false;
      barEnded = false;
    }, BAR_SETTLE_MS);
  };

  const onBarDown = (event) => {
    if (!event.isTrusted || !pinned || barGutter <= 0) return;
    const inGutter = barRTL
      ? event.clientX >= barLeft && event.clientX <= barLeft + barGutter
      : event.clientX >= barRight - barGutter && event.clientX <= barRight;
    if (!inGutter) return;
    clearBarSettle();
    barPressId = event.pointerId;
    barMoved = false;
    barEnded = false;
  };

  const onScroll = () => {
    refreshBarGeometry();
    if (barPressId !== null) barMoved = true;
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
    endBarPress('scrollend', null);
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
  lifecycle.listen(root, viewport, 'pointerdown', onBarDown, { passive: true });
  lifecycle.listen(
    root,
    viewport,
    'pointerup',
    (event) => endBarPress(event.type, event.pointerId),
    {
      passive: true
    }
  );
  lifecycle.listen(
    root,
    viewport,
    'pointercancel',
    (event) => endBarPress(event.type, event.pointerId),
    {
      passive: true
    }
  );
  lifecycle.listen(root, jump, 'click', onJump);

  const contentObserver = new MutationObserver(() => {
    if (pinned && !intent && barPressId === null) scrollToBottom(false);
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
          refreshBarGeometry();
          if (pinned && !intent && barPressId === null) scrollToBottom(false);
        })
      : null;
  lifecycle.add(root, () => resizeObserver?.disconnect());
  resizeObserver?.observe(viewport);
  resizeObserver?.observe(content);

  barRTL = view?.getComputedStyle(viewport).direction === 'rtl';
  refreshBarGeometry();
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
