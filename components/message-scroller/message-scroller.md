# Message scroller

## Native basis

`Message Scroller` is a semantic ordered message list inside a focusable scroll container with `role="log"`, plus a native form composer. The browser owns scrolling, focus, text editing, and form validation. The optional module keeps the viewport at the latest message when the reader is already at the end, provides a jump-to-latest button when they are reading older content, and appends submitted messages with DOM methods.

## Native web APIs

- [`<ol>` and `<li>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol) — preserve the order of messages
- [`<article>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article) — gives each independently readable message a semantic boundary
- [`role="log"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/log_role) — identifies an append-oriented live message region
- [`<time>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time) — exposes machine-readable message times
- [`<form>` and `<textarea>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) — provide native composition, validation, and submission fallback
- [`scrollTop` and `scrollHeight`](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop) — detect and restore the latest viewport position
- [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) — follows messages appended by an embedding application
- [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) — publishes a sent-message notification
- [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) — formats a newly submitted message time for the user's locale

The component complements [Textarea](../textarea/textarea.md), [Form](../form/form.md), [Button](../button/button.md), and [Avatar](../avatar/avatar.md). Add an [Attachment](../file-input/file-input.md) composition separately when a composer needs file selection. Do not use this component as a replacement for a [Table](../table/table.md) or a generic scroll area.

## Structure

```html
<section class="message-scroller" aria-labelledby="discussion-title">
  <header class="message-scroller-header">
    <div>
      <h2 class="message-scroller-heading" id="discussion-title">Project discussion</h2>
      <p class="message-scroller-description">Launch planning · 3 participants</p>
    </div>
    <button
      class="message-scroller-jump"
      data-message-part="jump"
      type="button"
      aria-controls="discussion-messages"
      hidden
    >Jump to latest</button>
  </header>

  <div
    class="message-scroller-viewport"
    data-message-part="viewport"
    id="discussion-messages"
    role="log"
    aria-live="polite"
    aria-relevant="additions"
    aria-label="Project discussion messages"
    tabindex="0"
  >
    <ol class="message-scroller-messages" data-message-part="messages">
      <li class="message-scroller-item">
        <article class="message-scroller-message">
          <header class="message-scroller-message-header">
            <h3 class="message-scroller-message-author">Alex Morgan</h3>
            <time class="message-scroller-message-time" datetime="2026-08-13T09:00:00Z">9:00 AM</time>
          </header>
          <p class="message-scroller-message-body">Can we review the launch checklist?</p>
        </article>
      </li>
    </ol>
  </div>

  <p class="message-scroller-status" data-message-part="status" role="status" aria-live="polite">
    You are viewing the latest messages.
  </p>

  <form class="message-scroller-composer" data-message-part="composer" aria-label="Compose a message">
    <label class="message-scroller-composer-label" for="discussion-input">Message</label>
    <textarea id="discussion-input" name="message" required aria-describedby="discussion-help"></textarea>
    <p class="message-scroller-composer-help" id="discussion-help">Press Send to add a message to the discussion.</p>
    <div class="message-scroller-composer-actions">
      <button type="submit">Send</button>
    </div>
  </form>
</section>
```

The list and composer remain useful without JavaScript. A server-rendered form can submit the message normally when the module is omitted. When the module is loaded, a valid submission is appended locally and the form's native navigation is prevented.

## Data attributes and classes

| Attribute or class | Element | Purpose |
| --- | --- | --- |
| `.message-scroller` | `<section>` | Root and module initialization target |
| `data-message-author` | Root | Optional author label for locally appended messages. Defaults to `You`. |
| `data-follow-threshold` | Root | Optional non-negative pixel distance from the bottom that still counts as following. Defaults to `24`. |
| `data-message-part="viewport"` | Scroll container | Identifies the `role="log"` viewport |
| `data-message-part="messages"` | `<ol>` | Identifies the ordered message list |
| `data-message-part="jump"` | Button | Identifies the jump-to-latest control |
| `data-message-part="status"` | Status paragraph | Receives latest, older, and unread announcements |
| `data-message-part="composer"` | `<form>` | Identifies the native message composer |
| `data-init` | Root | Added by `message-scroller.js`; do not author it manually |
| `data-state="latest"` or `data-state="unread"` | Root | Managed state for the current viewport position |

The module requires the root, viewport, and ordered message list markers. The jump button, status, and composer are optional, but omitting them removes that enhancement. If class hooks are preferred, use `.message-scroller-viewport`, `.message-scroller-messages`, `.message-scroller-jump`, `.message-scroller-status`, and `.message-scroller-composer`.

## Progressive enhancement

Load the stylesheet with the foundation files. Load the module only when the application wants follow-at-bottom behavior or local composer handling:

```html
<link rel="stylesheet" href="/ui/src/base.css">
<link rel="stylesheet" href="/ui/src/tokens.css">
<link rel="stylesheet" href="/ui/components/message-scroller/message-scroller.css">
<script type="module" src="/ui/components/message-scroller/message-scroller.js"></script>
```

The module marks each root with `data-init` before inspecting it, so repeated module loading does not duplicate listeners. A document `MutationObserver` initializes roots inserted after SPA navigation. A second observer watches direct children of the message list, so edits inside an existing message do not announce a false new message or change the scroll position.

## Behavior and keyboard

- At initialization and after a message append, a viewport that is already at the bottom stays at the latest message.
- When the reader scrolls upward, the root receives `data-state="unread"`, the jump button becomes visible, and new messages do not move the reader unexpectedly.
- `Jump to latest` moves the native scroll container to its end and updates the polite status. It is a regular button and is reachable with `Tab` and `Enter` or `Space`.
- The viewport is focusable so keyboard users can scroll it with the browser's native Page Up, Page Down, Arrow, Home, and End behavior.
- The composer uses native `required` validation. A trimmed blank message is rejected with the browser's validation UI when enhanced.
- On a valid enhanced submission, the module appends the message using `textContent`, clears the textarea, and leaves focus in the composer.

## Events

The enhanced root dispatches a bubbling `message-scroller:send` event after a local message is appended:

```js
document.addEventListener('message-scroller:send', (event) => {
  console.log(event.detail.text, event.detail.following);
});
```

The detail is `{ text, following }`. `following` reports whether the viewport was at the latest position before submission. Native `scroll`, `input`, `change`, `invalid`, `submit`, and reset events remain available.

## Accessibility

- Give the section an accessible name with `aria-labelledby` or another explicit label.
- Keep `role="log"`, `aria-live="polite"`, `aria-relevant="additions"`, and a useful `aria-label` on the viewport. Do not put the live role on the entire application shell.
- Use an ordered list and an `<article>` for each message. Give every message a heading and a `<time datetime>` value.
- Keep the jump control a real button with `type="button"` and `aria-controls` pointing at the log viewport. Its label explains the destination without relying on color.
- Give the composer a real label and point `aria-describedby` at help or error text. Keep `required` on the textarea and let the browser report invalid input.
- The status is polite and supplemental. It does not replace the log's accessible name or the visible jump control.
- Message text is inserted with `textContent`, so user text cannot create markup or unexpected announcements.
- Styles include visible `:focus-visible`, `prefers-contrast: more`, and `forced-colors: active` paths and contain no motion or shadow.

## Limitations

This is a single chronological log. The module does not implement virtualization, pagination, message editing, reactions, delivery state, network requests, persistence, typing indicators, read receipts, or a focus trap. An embedding application owns server synchronization and should append confirmed messages through ordinary DOM operations. For very large histories, use a virtualized application surface around the same semantic message pattern and preserve a keyboard-accessible jump-to-latest control.
