# Thinking Indicator

## Purpose

Thinking Indicator communicates that an assistant is actively preparing a response.

Use Thinking Indicator for a short indeterminate AI state with a visible descriptive label.

Use Spinner for a compact control-level loading state.

Use Progress when the system knows completion.

Do not leave Thinking Indicator visible after work stops.

## Native basis

Thinking Indicator uses a polite status region with visible text.

Decorative dots reinforce the state without carrying meaning or motion.

## Native Web APIs

- [`role="status"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/status_role) provides polite status announcement.
- [`aria-hidden`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden) hides decorative dots.

## Structure

```html
<div class="thinking-indicator" role="status">
  <span class="thinking-dots" aria-hidden="true">
    <span class="thinking-dot"></span>
    <span class="thinking-dot"></span>
    <span class="thinking-dot"></span>
  </span>
  <span class="thinking-label">Thinking</span>
</div>
```

Replace the label with a specific active task such as `Searching` when that context helps.

Keep the label visible.

Do not animate the dots.

## Accessibility

Use one status region for one active state.

Keep the dots hidden from assistive technology.

Remove the component when the active state ends.

Do not announce repeated text changes that do not help the user.

## Runtime

Thinking Indicator requires no component JavaScript.

The application controls insertion, label updates, and removal.
