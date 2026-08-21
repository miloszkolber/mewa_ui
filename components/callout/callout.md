# Callout

## Native basis

`<div>` with `role="alert"` for important callout messages.

## Native Web APIs

- [`role="alert"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/alert_role) — ARIA alert role for assertive announcements

## Structure

```html
<!-- Default alert -->
<div class="callout" role="alert">
  <svg class="callout-icon"><!-- icon --></svg>
  <div class="callout-content">
    <h5 class="callout-title">Heads up!</h5>
    <p class="callout-description">You can add components using the CLI.</p>
  </div>
</div>

<!-- Destructive alert -->
<div class="callout" data-variant="destructive" role="alert">
  <svg class="callout-icon"><!-- icon --></svg>
  <div class="callout-content">
    <h5 class="callout-title">Error</h5>
    <p class="callout-description">Your session has expired.</p>
  </div>
</div>

<!-- Alert with action -->
<div class="callout" role="alert">
  <svg class="callout-icon"><!-- icon --></svg>
  <div class="callout-content">
    <h5 class="callout-title">New feature available</h5>
    <p class="callout-description">Dark mode is now available.</p>
  </div>
  <div class="callout-action">
     <button class="btn" type="button" data-variant="outline" data-size="sm">Enable</button>
  </div>
</div>
```

## Variants (`data-variant`)

| Value         | Description                               |
|---------------|-------------------------------------------|
| `default`     | Standard informational alert              |
| `destructive` | Error or warning state with destructive styling |

## Accessibility

- Use `role="alert"` for important messages that should interrupt screen readers
- The alert role triggers an assertive live region announcement
- Icon should be decorative (`aria-hidden="true"`) when a title is present
- Keep action controls as native buttons with an explicit type and a visible `:focus-visible` indicator
- Callout content is static. It adds no animation or transition. Applications should manage focus when inserting a callout after a user action.
