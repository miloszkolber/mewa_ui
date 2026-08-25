# Button

## Purpose

Button starts an action, submits a form, or gives a navigation link the shared button treatment.

## Use when

Use a `<button>` for an action.

Use an `<a>` for navigation.

Use one filled default button for the primary action in a local group.

Use outline or ghost buttons for secondary actions.

Use the destructive variant only for the final destructive confirmation.

## Do not use when

Do not use a button element for navigation.

Do not use a link element for a form action.

Do not use an icon-only button when a visible label fits.

Do not show several filled primary buttons in one local group.

## Native basis

Use `<button>` for an action.

Use `<a>` for a navigation destination that needs button presentation.

## Native Web APIs

- [`<button>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button) provides focus, keyboard activation, disabled state, and form behavior.
- [`<a>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a) provides native navigation, history, and link behavior.
- [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) shows the authored keyboard focus indicator.
- [`commandfor` and `command`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#command) can provide declarative dialog or popover commands.
- [`prefers-contrast`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast) strengthens borders in increased contrast.
- [`forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors) maps the control to system colors.

## Structure

```html
<button class="btn" type="button" data-variant="default">
  Save changes
</button>
```

Use `type="submit"` only when the button submits the current form.

```html
<button class="btn" type="submit" data-variant="default">
  Save changes
</button>
```

Use an anchor for navigation.

```html
<a class="btn" data-variant="outline" href="/settings">
  Open settings
</a>
```

## Icon use

Keep a visible label when space permits it.

Mark a decorative icon as hidden.

```html
<button class="btn" type="button" data-variant="default">
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24">
    <path d="M5 12l4 4L19 6"></path>
  </svg>
  Save
</button>
```

Give an icon-only button an accessible name.

```html
<button
  class="btn"
  type="button"
  data-variant="outline"
  data-size="icon"
  aria-label="Open settings"
>
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24">
    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"></path>
  </svg>
</button>
```

Replace the example path with the matching local SVG from `src/icons/`.

## Variants

| `data-variant` | Intended use |
| --- | --- |
| `default` | Use for the primary normal action. |
| `secondary` | Use for a filled secondary action. |
| `outline` | Use for a normal secondary action. |
| `ghost` | Use for a low-emphasis local action. |
| `destructive` | Use for the final destructive confirmation. |
| `link` | Use for an inline action that must still be a button. |

The secondary variant uses the primary border color as its fill.

The destructive variant uses the semantic destructive surface.

## Sizes

| `data-size` | Height | Intended use |
| --- | --- | --- |
| `sm` | `var(--size-07)` | Use for compact row actions. |
| Omitted | `var(--size-08)` | Use for normal actions. |
| `icon` | `var(--size-08)` | Use for a normal icon-only action. |
| `icon-sm` | `var(--size-07)` | Use for a compact icon-only action. |

The `link` variant uses inline text geometry.

## Behavior

The browser activates a button with Enter or Space.

The browser follows an anchor with Enter.

The browser submits a form when a submit button activates.

The component adds no JavaScript behavior.

## Disabled state

Use the native `disabled` attribute on a button.

```html
<button class="btn" type="button" disabled>
  Save changes
</button>
```

Do not use a disabled anchor.

Remove the link or replace it with non-interactive text when navigation is unavailable.

Use `aria-disabled="true"` only when the application must keep a custom action focusable.

Block activation in application code when `aria-disabled="true"` is present.

## Loading state

Keep the action name available during loading.

Set `aria-busy="true"` on the button while the action runs.

Disable repeated activation when duplicate work is unsafe.

Use Spinner only when visible activity feedback helps.

Do not replace the accessible name with “Loading”.

## Accessibility

Keep the visible label specific.

Give every icon-only button an accessible name.

Keep decorative icons hidden.

Keep the focus indicator visible.

Keep the default 40px target for normal actions.

Use the compact 32px size only for dense local actions.

Do not add `role="button"` to a non-button element.

## Runtime

Button requires no component module.

Native button and link behavior remains complete without JavaScript.
