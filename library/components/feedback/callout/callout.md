# Callout

## Purpose

Callout presents persistent important information in the page flow.

Use Callout for guidance, caution, success, or error content that must remain visible.

Use Toast for brief non-blocking status.

Do not add a live role to static Callout content.

## Native basis

Use a normal semantic container for static Callout content.

Add `role="alert"` only when an urgent error is inserted dynamically.

Add `role="status"` only when a dynamic non-urgent result needs a polite announcement.

Callout requires no JavaScript.

## Native Web APIs

- [`role="alert"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/alert_role) provides assertive announcement for urgent dynamic content.
- [`role="status"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/status_role) provides polite announcement for a dynamic result.

## Structure

Use a visible title when the callout needs a short category or summary.

Put an optional `.callout-icon` before `.callout-content`.

Inline a local SVG when the callout needs an icon.

In a source checkout, select the SVG from `library/src/icons/`.

With release archives, select `icons/{name}-line.svg` or `icons/{name}-fill.svg` from the optional `mewa-icons` archive.

Hide decorative icons from assistive technology.

```html
<div class="callout">
  <svg class="callout-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z" />
  </svg>
  <div class="callout-content">
    <p class="callout-title">Connection required</p>
    <p class="callout-description">Connect the service before starting a sync.</p>
  </div>
</div>
```

## Variants

Use the default variant for guidance.

Omit `data-variant` or use `data-variant="default"` for the default variant.

Use `data-variant="positive"` for a completed or successful result.

Use `data-variant="caution"` for a risk or required precaution.

Use `data-variant="destructive"` for negative or failure content.

```html
<div class="callout" data-variant="positive">
  <div class="callout-content">
    <p class="callout-title">Sync completed</p>
    <p class="callout-description">The remote service has saved the changes.</p>
  </div>
</div>
```

```html
<div class="callout" data-variant="caution">
  <div class="callout-content">
    <p class="callout-title">Sync paused</p>
    <p class="callout-description">Check the unstable connection before continuing.</p>
  </div>
</div>
```

## Recovery action

Put one recovery action at the inline end when the action directly resolves the message.

Keep the recovery button at the default 36px height.

Keep the recovery button label short.

Let the application own the recovery behavior.

```html
<div class="callout" data-variant="destructive">
  <div class="callout-content">
    <p class="callout-title">Authentication expired</p>
    <p class="callout-description">Reconnect the account to continue.</p>
  </div>
  <div class="callout-action">
    <button class="btn" type="button" data-variant="secondary">Reconnect</button>
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

Use Tab to reach a recovery button.

Use Enter or Space to activate a recovery button.

Pair status color with visible text.

Do not rely on an icon as the message label.

## Runtime

Callout requires no component module.

The complete message remains available without JavaScript.
