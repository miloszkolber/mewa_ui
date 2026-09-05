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

The jump button moves immediately to the live edge.

Activating a focused jump button moves focus to the viewport before hiding the button.

The module dispatches `message-scroller:pinned-change` with `detail.pinned` when pinned state changes.

Changing `data-conversation-key` re-arms live-edge following for the new conversation.

The module adds no wheel, touch, or keyboard interception.

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
