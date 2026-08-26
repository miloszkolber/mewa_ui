# Timeline

## Purpose

Timeline presents events or steps when sequence is the primary relationship.

Use Timeline for chronology, execution history, or a completed process record.

Use a normal list when order does not need a visual sequence.

Do not use Timeline for a flat status list or application navigation.

## Native basis

Timeline uses an ordered `<ol>` with semantic list items.

Visual markers and connector lines do not replace the ordered-list semantics.

## Native Web APIs

- [`<ol>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol) communicates sequence.
- [`<li>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li) identifies each event or step.
- [`<time>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time) provides machine-readable dates and times.

## Structure

```html
<ol class="timeline">
  <li class="timeline-item">
    <span class="timeline-dot" aria-hidden="true"></span>
    <div class="timeline-content">
      <p class="timeline-title">Job queued</p>
      <p class="timeline-description">The scheduler accepted the request.</p>
      <time class="timeline-time" datetime="2026-08-25T09:10:00Z">09:10 UTC</time>
    </div>
  </li>
  <li class="timeline-item">
    <span class="timeline-dot" data-variant="active" aria-hidden="true"></span>
    <div class="timeline-content">
      <p class="timeline-title">Processing</p>
      <p class="timeline-description">Worker 03 is resolving the manifest.</p>
      <time class="timeline-time" datetime="2026-08-25T09:12:00Z">09:12 UTC</time>
    </div>
  </li>
</ol>
```

Keep events in logical chronological or procedural order.

Use a real `<time>` element when a machine-readable date or time exists.

## Active state

Use `data-variant="active"` only when one current item needs visual emphasis.

Do not use active marker color as the only indication of current state.

Include visible text that communicates the current event or step.

Do not use several active markers unless several items are genuinely current.

## Behavior

Timeline is static semantic content.

Timeline adds no keyboard interaction.

Timeline adds no JavaScript behavior.

Application code owns live updates when timeline data changes.

Do not put a live region on the complete Timeline when many items can update.

Use a separate status message when a new event needs announcement.

## Accessibility

Keep the ordered-list structure.

Keep marker shapes decorative and hidden from assistive technology.

Keep event titles and descriptions as normal readable text.

Use visible status text in addition to any active marker treatment.

Use valid `datetime` values on `<time>` elements.

Do not use CSS-generated text to provide event meaning.

## Runtime

Timeline requires no component module.

The complete sequence works without JavaScript.
