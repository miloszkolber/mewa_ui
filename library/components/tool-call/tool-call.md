# Tool Call

## Purpose

Tool Call presents an agent tool operation with a visible status and optional result content.

Use Tool Call for searches, file reads, code runs, and other discrete operations inside an assistant response.

Use Thinking Indicator for a general response state without a named operation.

Do not use Tool Call for an application action performed directly by the user.

## Native basis

Tool Call uses details and summary when result content can expand.

A status-only tool call uses a normal status row without a disclosure control.

## Native Web APIs

- [`<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) exposes optional results.
- [`<summary>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary) provides native activation and expanded state.
- [`role="status"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/status_role) announces an active status-only operation.
- [`data-*`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*) carries application-owned operation state.

## Structure

```html
<details class="tool-call" data-status="running" open>
  <summary class="tool-call-summary">
    <span class="tool-call-mark" aria-hidden="true">›</span>
    <span class="tool-call-label">Searching for accessibility guidance</span>
    <span class="tool-call-state">Running</span>
  </summary>
  <div class="tool-call-content">
    <p>Result content appears here.</p>
  </div>
</details>
```

Use a status-only row when no result content exists.

```html
<div class="tool-call tool-call-static" data-status="complete" role="status">
  <span class="tool-call-mark" aria-hidden="true">✓</span>
  <span class="tool-call-label">Read src/auth.js</span>
  <span class="tool-call-state">Complete</span>
</div>
```

Use `data-status="pending"`, `running`, `complete`, or `error`.

Update the visible `.tool-call-state` text with the same status.

Keep result content inside `.tool-call-content`.

## Accessibility

Keep status text visible.

Use native summary behavior when results exist.

Do not render a disclosure trigger when there is nothing to expand.

Use `role="status"` only while an important state change needs polite announcement.

Do not use animation as the only running-state cue.

## Runtime

Tool Call requires no component JavaScript.

The application owns status and result updates.

Native details behavior remains usable without JavaScript.
