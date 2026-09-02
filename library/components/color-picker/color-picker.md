# Color Picker

## Purpose

Color Picker collects one opaque color value through the operating-system picker.

Use Color Picker when a user needs to choose an arbitrary color.

Use a fixed group of buttons when the user must choose from a small approved palette.

Do not use Color Picker when alpha transparency is required.

## Native basis

Color Picker uses `<input type="color">` as the submitted control.

An optional text input provides an editable hexadecimal view of the same value.

The native color input remains the only source of truth.

The browser owns the picker surface, keyboard activation, validation, and form submission.

## Native Web APIs

- [`<input type="color">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color) provides the platform color picker.
- [`input`](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event) reports live color changes.
- [`change`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) reports a committed color change.
- [`HTMLInputElement.value`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/value) keeps the native and text views synchronized.

## Structure

Keep the submitted `name` on the native color input.

Keep the hexadecimal input unnamed because it is a second view of the same value.

Use `hidden` on the hexadecimal input so the no-JavaScript path does not show a stale second control.

```html
<div class="field">
  <label for="accent-color">Accent color</label>
  <div class="color-picker">
    <input class="color-picker-input"
           id="accent-color"
           name="accent_color"
           type="color"
           value="#c43131"
           aria-describedby="accent-color-description">
    <input class="color-picker-hex"
           type="text"
           value="#c43131"
           maxlength="7"
           inputmode="text"
           autocomplete="off"
           spellcheck="false"
           aria-label="Hex color value"
           data-color-picker-hex
           hidden>
  </div>
  <p class="field-description" id="accent-color-description">
    Choose an opaque color.
  </p>
</div>
```

Use `aria-invalid="true"` on the native color input for a known form error.

## Behavior

The native input opens the operating-system color picker.

The module reveals the hexadecimal input after successful initialization.

The module normalizes three-digit and six-digit hexadecimal input to a lowercase six-digit value.

The module updates the native input only when the hexadecimal draft is valid.

The module restores the committed value when the hexadecimal input loses focus with an invalid draft.

The module dispatches native `input` and `change` events from the color input when hexadecimal editing changes the committed color.

## Keyboard

Tab reaches the native color input and the enhanced hexadecimal input in document order.

The native color input keeps its platform keyboard behavior.

Enter commits a valid hexadecimal draft and removes focus from the text input.

## Accessibility

Give the native color input a visible label.

Give the hexadecimal input a specific accessible name.

Keep the hexadecimal input without a submitted `name`.

Use text to identify a validation error.

Do not communicate the selected color through the swatch alone when the exact value matters.

## No-JavaScript

The native color input remains visible, labelled, focusable, and submitted without JavaScript.

The hidden hexadecimal input stays unavailable without JavaScript.

## Runtime

Load `color-picker.js` when the editable hexadecimal input is present.

The module is an optional enhancement because the native color picker remains complete without it.
