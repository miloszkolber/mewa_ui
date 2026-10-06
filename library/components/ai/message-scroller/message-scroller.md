# Message Scroller

## Purpose

Message Scroller contains a growing conversation and follows its live edge while the reader stays there.

Use Message Scroller when new messages or streamed output append to one bounded transcript.

Use Scroll Area for ordinary local overflow without live-edge behavior.

Do not force the reader back to the latest message after the reader scrolls away.

## Native basis

Message Scroller uses a native overflow container with `role="log"`.

The browser owns wheel, touch, keyboard, and scrollbar interaction.

The optional module derives pinned state from scroll position and reveals a native jump button.

## Native Web APIs

- [`role="log"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/log_role) identifies a sequential stream of additions.
- [`aria-live`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-live) controls polite announcement of appended messages.
- [`scrollTop`](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop) moves immediately to the live edge.
- [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) detects appended transcript content without polling.
- [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) follows content growth that does not insert a new node.
- [`scrollend`](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollend_event) releases a temporary following suspension after native scrolling settles.
- [`currentCSSZoom`](https://developer.mozilla.org/en-US/docs/Web/API/Element/currentCSSZoom) converts pixel-wheel distance to the viewport's local CSS pixels.
- [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) checks for a later canceled input action without delaying native scrolling.

## Structure

```html
<section class="message-scroller" data-default-pinned="true" data-conversation-key="support-42">
  <h2 class="message-scroller-label" id="message-scroller-heading">Conversation</h2>
  <div class="message-scroller-viewport"
       id="message-scroller-log"
       role="log"
       aria-live="off"
       aria-relevant="additions text"
       aria-labelledby="message-scroller-heading"
       tabindex="0">
    <ol class="message-scroller-content">
      <li class="message-scroller-entry">
        <article aria-label="User message">
          <p>Can you verify the deployment state?</p>
        </article>
      </li>
      <li class="message-scroller-entry">
        <article aria-label="Assistant message">
          <p>I will inspect the active services and recent logs.</p>
        </article>
      </li>
    </ol>
  </div>
  <button class="message-scroller-jump"
          type="button"
          data-message-scroller-jump
          aria-controls="message-scroller-log"
          hidden>
    Jump to latest
  </button>
</section>
```

Give the log viewport a stable accessible name.

Keep appended messages inside `.message-scroller-content`.

Compose the Message component inside the content when authored message presentation is required.

Keep transcript announcements off during streaming.

Use a separate application-owned status region for concise new-message announcements.

Set `data-default-pinned="false"` only when the initial reading position must stay unchanged.

Set `data-threshold` to a positive pixel number only when the default 24-pixel live-edge tolerance is unsuitable.

Change `data-conversation-key` when the same viewport displays another conversation.

## Behavior

Load `message-scroller.js` to follow appended content while the viewport is pinned.

Scrolling away updates `data-pinned="false"` and reveals the jump button.

Scrolling back to the live edge updates `data-pinned="true"` and hides the jump button.

Pinned state uses the current native position and the configured live-edge tolerance.

The module suspends observer-driven following before trusted upward wheel input takes effect.

The module also suspends following for native `ArrowUp`, `PageUp`, `Home`, and `Shift`+`Space` input when the viewport has keyboard focus.

A trusted pointer press in the scrollbar gutter suspends observer-driven following for that gesture. Native scroll events keep driving pinned state while the press is held.

The suspension prevents streamed growth from overwriting an in-flight native scroll.

The browser still performs the scroll.

Releasing the press never writes. A press whose scroll was already observed leaves pin state as native scrolling set it. A press with no observed scroll keeps the suspension until a scroll, scrollend, or a short settle bound proves nothing is coming, because some engines apply the scrollbar scroll at or after release. The next growth then resumes following when the reader never left the live edge.

A press on the scrollbar is a takeover signal even when it never moves, so following stays suspended for its duration rather than guessing at a completion time.

The wheel and key suspension ends when native movement leaves the tolerance, completes the requested pixel-wheel distance, or emits `scrollend`.

Pixel-wheel completion includes CSS zoom on the viewport and its ancestors.

A tiny pixel-wheel scroll within the tolerance keeps pinned state and resumes following after its native movement completes.

The early wheel guard excludes modified wheel input, horizontal-dominant input, subpixel pixel-mode deltas, editing controls, and nested native scroll surfaces.

Native scroll events still determine pinned state for excluded input, touch scrolling, and scrollbar scrolling.

Only the pointer that started a gutter press ends it. Other pointers never clear another gesture's suspension.

Gutter geometry is cached outside the press. The cache refreshes on scroll, resize, and setup. A stale cache misses a suspension and keeps current behavior instead of blocking input.

A later canceling listener releases the pending suspension on the next animation frame when the viewport does not move.

Browsers without native `scrollend` retain position-based following without the early input guards.

The jump button moves immediately to the live edge.

Activating a focused jump button moves focus to the viewport before hiding the button.

The module dispatches `message-scroller:pinned-change` with `detail.pinned` when pinned state changes.

Changing `data-conversation-key` re-arms live-edge following for the new conversation.

Native `End` scrolling can re-arm following when the viewport reaches the live edge.

The module does not cancel wheel, touch, keyboard, or scrollbar interaction.

## Accessibility

Keep `aria-live="off"` on the log so streaming updates do not repeatedly announce the transcript.

Keep the constrained viewport keyboard focusable when keyboard scrolling is required.

Keep the jump button after the viewport in source order.

Do not place another live role around the complete component.

Do not move keyboard focus when new content arrives.

## No-JavaScript

The transcript remains readable and natively scrollable without JavaScript.

The jump button stays hidden when the enhancement module does not run.

The viewport does not follow appended content without the module.

## Runtime

Message Scroller uses an optional component module.

Load `message-scroller.js` when live-edge pinning or the jump action is required.

Call the controller's `destroy()` when the application releases the scroller or its enclosing region.

Cleanup releases listeners, observers, and pending animation frames even if the application removes `.message-scroller` before destruction.

Cleanup hides the inactive jump button and removes the derived `data-pinned` state.

Cleanup preserves the current transcript, log attributes, and reading position.

Repeated enhancement and remounting do not add duplicate listeners or observers.
