# Callout

## Native basis

`<div class="callout">` with a context-neutral title and description. Static callouts do not expose a live-region role. Add `role="alert"` only when an urgent error is inserted dynamically and should interrupt assistive technology.

## Native Web APIs

- [`role="alert"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/alert_role) — opt-in assertive announcement for urgent dynamically inserted errors

## Structure

```html
<!-- Static informational callout -->
<div class="callout">
  <svg class="callout-icon"><!-- icon --></svg>
  <div class="callout-content">
    <p class="callout-title">Heads up!</p>
    <p class="callout-description">You can add components using the CLI.</p>
  </div>
</div>

<!-- Static destructive callout -->
<div class="callout" data-variant="destructive">
  <svg class="callout-icon"><!-- icon --></svg>
  <div class="callout-content">
    <p class="callout-title">Error</p>
    <p class="callout-description">Your session has expired.</p>
  </div>
</div>

<!-- Static callout with action -->
<div class="callout">
  <svg class="callout-icon"><!-- icon --></svg>
  <div class="callout-content">
    <p class="callout-title">New feature available</p>
    <p class="callout-description">Dark mode is now available.</p>
  </div>
  <div class="callout-action">
    <button class="btn" type="button" data-variant="outline" data-size="sm">Enable</button>
  </div>
</div>

<!-- Urgent error inserted after an action -->
<div class="callout" data-variant="destructive" role="alert">
  <svg class="callout-icon" aria-hidden="true"><!-- icon --></svg>
  <div class="callout-content">
    <p class="callout-title">Payment failed</p>
    <p class="callout-description">Your payment could not be processed.</p>
  </div>
</div>
```

## Variants (`data-variant`)

| Value         | Description                               |
|---------------|-------------------------------------------|
| `default`     | Standard informational callout              |
| `destructive` | Error or warning styling with a negative surface fill; it is not live by default |

## Accessibility

- Leave the role off for static or already-visible callouts
- Add `role="alert"` only to urgent error content inserted dynamically
- The alert role triggers an assertive live-region announcement, so do not use it for every callout
- Icon should be decorative (`aria-hidden="true"`) when a title is present
- Keep action controls as native buttons with an explicit type and a visible `:focus-visible` indicator
- Callout content is static by default. It adds no animation or transition. Applications should manage focus when inserting an urgent callout after a user action.
