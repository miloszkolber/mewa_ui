# Button

## Purpose

Button starts an action, submits a form, or gives a navigation link the shared button treatment.

## Use when

Use a `<button>` for an action.

Use an `<a>` for navigation.

Use one filled default button for the primary action in a local group.

Use secondary or ghost buttons for secondary actions.

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
<a class="btn" data-variant="secondary" href="/settings">
  Open settings
</a>
```

## Icon use

Keep a visible label when space permits it.

Mark a decorative icon as hidden.

```html
<button class="btn" type="button" data-variant="default">
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M9.9997 15.1709L19.1921 5.97852L20.6063 7.39273L9.9997 17.9993L3.63574 11.6354L5.04996 10.2212L9.9997 15.1709Z"/></svg>
  Save
</button>
```

Give an icon-only button an accessible name.

```html
<button
  class="btn"
  type="button"
  data-variant="secondary"
  data-size="icon"
  aria-label="Open settings"
>
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3.33946 17.0002C2.90721 16.2515 2.58277 15.4702 2.36133 14.6741C3.3338 14.1779 3.99972 13.1668 3.99972 12.0002C3.99972 10.8345 3.3348 9.824 2.36353 9.32741C2.81025 7.71651 3.65857 6.21627 4.86474 4.99001C5.7807 5.58416 6.98935 5.65534 7.99972 5.072C9.01009 4.48866 9.55277 3.40635 9.4962 2.31604C11.1613 1.8846 12.8847 1.90004 14.5031 2.31862C14.4475 3.40806 14.9901 4.48912 15.9997 5.072C17.0101 5.65532 18.2187 5.58416 19.1346 4.99007C19.7133 5.57986 20.2277 6.25151 20.66 7.00021C21.0922 7.7489 21.4167 8.53025 21.6381 9.32628C20.6656 9.82247 19.9997 10.8336 19.9997 12.0002C19.9997 13.166 20.6646 14.1764 21.6359 14.673C21.1892 16.2839 20.3409 17.7841 19.1347 19.0104C18.2187 18.4163 17.0101 18.3451 15.9997 18.9284C14.9893 19.5117 14.4467 20.5941 14.5032 21.6844C12.8382 22.1158 11.1148 22.1004 9.49633 21.6818C9.55191 20.5923 9.00929 19.5113 7.99972 18.9284C6.98938 18.3451 5.78079 18.4162 4.86484 19.0103C4.28617 18.4205 3.77172 17.7489 3.33946 17.0002ZM8.99972 17.1964C10.0911 17.8265 10.8749 18.8227 11.2503 19.9659C11.7486 20.0133 12.2502 20.014 12.7486 19.9675C13.1238 18.8237 13.9078 17.8268 14.9997 17.1964C16.0916 16.5659 17.347 16.3855 18.5252 16.6324C18.8146 16.224 19.0648 15.7892 19.2729 15.334C18.4706 14.4373 17.9997 13.2604 17.9997 12.0002C17.9997 10.74 18.4706 9.5632 19.2729 8.6665C19.1688 8.4405 19.0538 8.21822 18.9279 8.00021C18.802 7.78219 18.667 7.57148 18.5233 7.36842C17.3457 7.61476 16.0911 7.43447 14.9997 6.80405C13.9083 6.17395 13.1246 5.17768 12.7491 4.03455C12.2509 3.98714 11.7492 3.98646 11.2509 4.03292C10.8756 5.17671 10.0916 6.17364 8.99972 6.80405C7.9078 7.43447 6.65245 7.61494 5.47428 7.36803C5.18485 7.77641 4.93463 8.21117 4.72656 8.66637C5.52881 9.56311 5.99972 10.74 5.99972 12.0002C5.99972 13.2604 5.52883 14.4372 4.72656 15.3339C4.83067 15.5599 4.94564 15.7822 5.07152 16.0002C5.19739 16.2182 5.3324 16.4289 5.47612 16.632C6.65377 16.3857 7.90838 16.5663 8.99972 17.1964ZM11.9997 15.0002C10.3429 15.0002 8.99972 13.6571 8.99972 12.0002C8.99972 10.3434 10.3429 9.00021 11.9997 9.00021C13.6566 9.00021 14.9997 10.3434 14.9997 12.0002C14.9997 13.6571 13.6566 15.0002 11.9997 15.0002ZM11.9997 13.0002C12.552 13.0002 12.9997 12.5525 12.9997 12.0002C12.9997 11.4479 12.552 11.0002 11.9997 11.0002C11.4474 11.0002 10.9997 11.4479 10.9997 12.0002C10.9997 12.5525 11.4474 13.0002 11.9997 13.0002Z"/></svg>
</button>
```

Replace the example path with the matching local SVG from `library/src/icons/`.

## Variants

| `data-variant` | Intended use |
| --- | --- |
| `default` | Use for the primary normal action. |
| `secondary` | Use for a secondary action with a persistent boundary. |
| `ghost` | Use for a low-emphasis local action. |
| `destructive` | Use for the final destructive confirmation. |

The secondary variant uses the shared secondary surface and border roles.

The destructive variant uses the semantic destructive surface.

## Sizes

| `data-size` | Height | Intended use |
| --- | --- | --- |
| `sm` | `var(--size-800)` | Use for compact row actions. |
| Omitted | `var(--size-900)` | Use for normal actions. |
| `icon` | `var(--size-900)` | Use for a normal icon-only action. |
| `icon-sm` | `var(--size-800)` | Use for a compact icon-only action. |

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

Keep the default 36px target for normal actions.

Use the compact 32px size only for dense local actions.

Do not add `role="button"` to a non-button element.

## Runtime

Button requires no component module.

Native button and link behavior remains complete without JavaScript.
