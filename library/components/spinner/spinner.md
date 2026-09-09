# Spinner

## Purpose

Spinner shows that an indeterminate task is active.

Use Spinner for short work when completion cannot be measured.

Use Progress when completion is known.

Do not use Spinner as decoration.

## Native basis

Spinner uses an SVG arc with CSS rotation.

Spinner is the only sanctioned continuous animation in mewa_ui.

Spinner requires no JavaScript.

## Native Web APIs

- [`<svg>`](https://developer.mozilla.org/en-US/docs/Web/SVG) provides the scalable indicator shape.

## Inside a labelled control

Hide Spinner from assistive technology when the parent control already provides the loading name.

```html
<button class="btn" type="button" aria-busy="true" disabled>
  <svg class="spinner" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.364 5.63604L16.9497 7.05025C15.683 5.7835 13.933 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12H21C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C14.4853 3 16.7353 4.00736 18.364 5.63604Z"/></svg>
  Saving
</button>
```

Do not announce the same loading state from both Spinner and its parent control.

## Sizes

The Figma-aligned size scale is `xs` 12px, `sm` 16px, `md` 20px, `lg` 24px, and `xl` 32px. Omit `data-size` for the 16px default.

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
