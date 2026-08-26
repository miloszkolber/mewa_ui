# Switch

## Purpose

Switch changes an immediate binary system state.

Use Switch when the change takes effect immediately.

Use Checkbox when the value is only submitted later with a form.

Do not use Switch for a multi-value choice.

## Native basis

Use `<input type="checkbox" role="switch">`.

The native checkbox owns focus, checked state, and form behavior.

CSS changes the visual presentation.

## Native Web APIs

- [`<input type="checkbox">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox) provides native binary state.
- [`role="switch"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/switch_role) exposes on and off semantics.
- [`:checked`](https://developer.mozilla.org/en-US/docs/Web/CSS/:checked) exposes the on state to CSS.
- [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) exposes keyboard focus.
- [`forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors) preserves system high-contrast rendering.

## Structure

Use `.switch-item` for a short label.

```html
<div class="switch-item">
  <input class="switch" type="checkbox" role="switch" id="airplane">
  <label for="airplane">Airplane mode</label>
</div>
```

Use `.switch-item-block` when the setting needs supporting text.

```html
<div class="switch-item-block">
  <label for="share">Share across devices</label>
  <input class="switch" type="checkbox" role="switch" id="share">
  <span class="switch-description">Sync settings across all devices.</span>
</div>
```

Keep the switch beside the label that names the state.

## States

Use `checked` for the initial on state.

Use `disabled` when the setting cannot change.

Use `aria-invalid="true"` only when the switch participates in a validation error.

Do not use a disabled Switch only to hide a permission problem.

Explain the unavailable state when the reason is not obvious.

## Behavior

Space changes the native checked state.

Tab moves focus through the switch in normal document order.

The visual thumb uses the shared fast motion primitives when the checked state changes.

The component adds no JavaScript behavior.

## Accessibility

Keep a visible label.

Associate the label with `for` and `id`.

Keep `role="switch"` on the checkbox.

Do not add a second `aria-checked` state.

Keep the visible label phrased as the setting name.

Do not put “on” or “off” in the label when the switch already exposes that state.

## Runtime

Switch requires no component module.

The complete control remains usable without JavaScript.
