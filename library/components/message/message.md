# Message

## Purpose

Message presents an ordered conversation as authored rows with optional metadata and expandable body content.

Use Message for chat transcripts and other exchanges where order and authorship carry meaning.

Use Timeline when the content records events instead of authored conversation.

Do not use Message as a generic comment card or unordered feed.

## Native basis

Message uses an ordered list for the transcript, a list item for each turn, and an article for each authored message.

Native details and summary elements provide optional expansion without JavaScript.

## Native Web APIs

- [`<ol>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol) preserves conversation order.
- [`<li>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li) identifies each turn.
- [`<article>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article) exposes each authored message as a self-contained region.
- [`<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) provides optional expansion.
- [`<time>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time) exposes machine-readable message time.

## Structure

```html
<ol class="message-list" aria-label="Conversation">
  <li class="message" data-author="user">
    <span class="message-avatar" aria-hidden="true">Y</span>
    <article class="message-content" aria-label="You">
      <header class="message-header">
        <strong class="message-name">You</strong>
        <time class="message-metadata" datetime="2026-08-31T09:14">09:14</time>
      </header>
      <p class="message-bubble" data-tone="selected">Summarise the release notes.</p>
    </article>
  </li>

  <li class="message" data-author="assistant">
    <span class="message-avatar" aria-hidden="true">A</span>
    <article class="message-content" aria-label="Assistant">
      <header class="message-header">
        <strong class="message-name">Assistant</strong>
        <span class="message-live">Writing</span>
      </header>
      <div class="message-bubble">
        <p>Three changes landed in this release.</p>
      </div>
    </article>
  </li>
</ol>
```

Keep each `.message` as a direct child of `.message-list`.

Use `data-author="user"`, `assistant`, or `system` to express authorship and alignment.

Use `data-grouped` when a row continues the previous message from the same author.

Use `data-tone="selected"`, `muted`, or `negative` only when the message meaning needs that treatment.

Use a native details element with `.message-bubble` for optional long content.

## Accessibility

Give the transcript an accessible name.

Give each message article an accessible name that identifies the author.

Hide a decorative avatar from assistive technology when the article already names the author.

Keep the visible `Writing` label when a message is in progress.

Do not use a colored dot as the only live-state indicator.

Do not place the whole transcript in a live region.

Announce only the newly inserted content when the application requires it.

## Runtime

Message requires no component JavaScript.

Authorship, grouping, and status are authored in HTML or updated by the application.

Native details elements remain expandable without JavaScript.
