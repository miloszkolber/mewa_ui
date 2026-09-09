# Callout

## Purpose

Callout presents persistent important information in the page flow.

Use Callout for guidance, caution, success, or error content that must remain visible.

Use Toast for brief non-blocking status.

Do not add a live role to static Callout content.

## Native basis

Use a normal semantic container for static Callout content.

Add `role="alert"` only when an urgent error is inserted dynamically.

Callout requires no JavaScript.

## Native Web APIs

- [`role="alert"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/alert_role) provides assertive announcement for urgent dynamic content.

## Structure

Use a visible title when the callout needs a short category or summary.

Hide decorative icons from assistive technology.

```html
<div class="callout">
  <i class="callout-icon ri-information-line" aria-hidden="true"></i>
  <div class="callout-content">
    <p class="callout-title">Connection required</p>
    <p class="callout-description">Connect the service before starting a sync.</p>
  </div>
</div>
```

Use the destructive variant for negative or failure content.

```html
<div class="callout" data-variant="destructive">
  <i class="callout-icon ri-error-warning-line" aria-hidden="true"></i>
  <div class="callout-content">
    <p class="callout-title">Sync failed</p>
    <p class="callout-description">The remote service rejected the request.</p>
  </div>
</div>
```

Put one compact recovery action at the inline end when the action directly resolves the message.

```html
<div class="callout" data-variant="destructive">
  <div class="callout-content">
    <p class="callout-title">Authentication expired</p>
    <p class="callout-description">Reconnect the account to continue.</p>
  </div>
  <div class="callout-action">
    <button class="btn" type="button" data-variant="secondary" data-size="sm">Reconnect</button>
  </div>
</div>
```

## Dynamic alert

Use `role="alert"` only when an urgent failure appears after a user action or asynchronous update.

```html
<div class="callout" data-variant="destructive" role="alert">
  <div class="callout-content">
    <p class="callout-title">Payment failed</p>
    <p class="callout-description">The payment provider rejected the transaction.</p>
  </div>
</div>
```

Do not pre-render an empty `role="alert"` container only to fill it repeatedly.

## Accessibility

Keep static Callout content in normal reading order.

Use `role="alert"` sparingly.

Do not move focus to Callout automatically unless the application workflow requires it.

Keep every recovery action keyboard reachable.

Pair status color with visible text.

Do not rely on an icon as the message label.

## Runtime

Callout requires no component module.

The complete message remains available without JavaScript.
