# Spinner

## Purpose

Spinner shows that an indeterminate task is active.

Use Spinner for short work when completion cannot be measured.

Use Progress when completion is known.

Do not use Spinner as decoration.

## Native basis

Spinner uses an SVG arc with CSS rotation.

Spinner is the only sanctioned animation in mewa_ui.

Spinner requires no JavaScript.

## Native Web APIs

- [`<svg>`](https://developer.mozilla.org/en-US/docs/Web/SVG) provides the scalable indicator shape.
- [`role="status"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/status_role) provides polite loading status when Spinner owns the announcement.
- [`aria-busy`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-busy) can mark the region that is updating.

## Standalone structure

Give a standalone Spinner a contextual status name.

```html
<svg class="spinner"
     role="status"
     aria-label="Loading service status"
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     stroke-width="2"
     stroke-linecap="round"
     stroke-linejoin="round">
  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
</svg>
```

## Inside a labelled control

Hide Spinner from assistive technology when the parent control already provides the loading name.

```html
<button class="btn" type="button" aria-busy="true" disabled>
  <svg class="spinner" aria-hidden="true" viewBox="0 0 24 24">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
  </svg>
  Saving
</button>
```

Do not announce the same loading state from both Spinner and its parent control.

## Sizes

Omit `data-size` for the default icon size.

Use the documented size values only when a larger indicator is necessary.

Keep Spinner proportional to the surrounding control or status region.

## Behavior

Spinner rotates without changing layout.

Stop rendering Spinner when the task finishes.

Do not use Spinner when no work is active.

## Accessibility

Keep a visible loading label when space permits it.

Use `aria-busy="true"` on the region or control that is updating when useful.

Use one live status source for one loading state.

Do not rely on rotation alone to communicate the task state.

## Runtime

Spinner requires no component module.
