# Toggle

## Purpose

Toggle changes one independent pressed tool state.

Use Toggle for controls such as bold, pin, mute, or another reversible pressed action.

Use Checkbox for a submitted independent choice.

Use Switch for an immediate binary system setting.

Do not use Toggle for route navigation.

## Native basis

Toggle uses a native `<button>` with `aria-pressed`.

The browser provides focus and button activation.

The module synchronizes the pressed state after activation.

## Native Web APIs

- [`<button>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button) provides native action behavior.
- [`aria-pressed`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-pressed) exposes the pressed state.
- [`forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors) preserves selected-state contrast.

## Structure

```html
<button class="toggle"
        type="button"
        aria-pressed="false"
        aria-label="Pin job">
  <i data-lucide="pin" aria-hidden="true"></i>
</button>
```

Use visible text when the action is not clear from the icon.

```html
<button class="toggle" type="button" aria-pressed="false">
  <i data-lucide="eye" aria-hidden="true"></i>
  Show details
</button>
```

## Variant

Omit `data-variant` for the default quiet treatment.

Use `data-variant="outline"` when the control needs a persistent boundary.

Do not use a filled primary Button treatment for a normal Toggle.

## Behavior

Activating a standalone Toggle switches `aria-pressed` between `true` and `false`.

A Toggle inside Toggle Group is managed by the Toggle Group module.

The standalone Toggle module skips grouped toggles.

Pressed state remains visible during hover.

State changes are immediate.

## Keyboard

Enter activates the native button.

Space activates the native button.

Tab follows normal document order.

Do not add arrow-key navigation to a standalone Toggle.

## Accessibility

Keep `aria-pressed` on the button.

Give an icon-only Toggle an accessible name.

Hide decorative icons from assistive technology.

Keep visible text stable when pressed state changes.

Do not change the accessible name from “Pin job” to “Unpin job” when `aria-pressed` already communicates state unless the action model explicitly requires command wording.

Keep focus visible.

## Runtime

Load `toggle.js` for standalone Toggle behavior.

Without the module, the button remains operable but `aria-pressed` does not change automatically.
