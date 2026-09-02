# Input OTP

## Purpose

Input OTP collects a short fixed-length verification code in separate visible cells.

Use Input OTP for one-time verification codes and short numeric access codes.

Use Text Field when the value has no fixed cell structure.

Do not use Input OTP as the only authentication factor for a high-impact action.

## Native basis

Input OTP uses a native `<fieldset>` and one native text input for each code position.

The legend names the related inputs.

Each input submits one segment under the same field name.

The browser owns focus, validation, autofill, and form submission.

## Native Web APIs

- [`<fieldset>` and `<legend>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset) name the related code inputs.
- [`inputmode="numeric"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode) requests a numeric software keyboard.
- [`autocomplete="one-time-code"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete) identifies a one-time verification code.
- [`ClipboardEvent`](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardEvent) provides pasted code text.
- [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) reports logical value changes and completion.

## Structure

Use one stable ID and one position-specific accessible name for each input.

Use the same submitted `name` for every input.

```html
<fieldset class="input-otp" data-input-otp>
  <legend>Verification code</legend>
  <div class="input-otp-cells">
    <input class="input-otp-cell" id="verification-code-1"
           name="verification_code" type="text" inputmode="numeric"
           pattern="[0-9]" maxlength="1" autocomplete="one-time-code"
           aria-label="Digit 1 of 6" aria-describedby="verification-code-description">
    <input class="input-otp-cell" id="verification-code-2"
           name="verification_code" type="text" inputmode="numeric"
           pattern="[0-9]" maxlength="1" autocomplete="one-time-code"
           aria-label="Digit 2 of 6" aria-describedby="verification-code-description">
    <input class="input-otp-cell" id="verification-code-3"
           name="verification_code" type="text" inputmode="numeric"
           pattern="[0-9]" maxlength="1" autocomplete="one-time-code"
           aria-label="Digit 3 of 6" aria-describedby="verification-code-description">
    <input class="input-otp-cell" id="verification-code-4"
           name="verification_code" type="text" inputmode="numeric"
           pattern="[0-9]" maxlength="1" autocomplete="one-time-code"
           aria-label="Digit 4 of 6" aria-describedby="verification-code-description">
    <input class="input-otp-cell" id="verification-code-5"
           name="verification_code" type="text" inputmode="numeric"
           pattern="[0-9]" maxlength="1" autocomplete="one-time-code"
           aria-label="Digit 5 of 6" aria-describedby="verification-code-description">
    <input class="input-otp-cell" id="verification-code-6"
           name="verification_code" type="text" inputmode="numeric"
           pattern="[0-9]" maxlength="1" autocomplete="one-time-code"
           aria-label="Digit 6 of 6" aria-describedby="verification-code-description">
  </div>
  <p class="input-otp-description" id="verification-code-description">
    Enter the six-digit code.
  </p>
</fieldset>
```

Use the native `disabled` attribute on the fieldset to disable the full group.

Use `aria-invalid="true"` on every cell when the complete code is known to be invalid.

## Behavior

The module removes non-numeric input.

Typing a digit moves focus to the next cell.

Pasting digits fills cells from the current position.

Backspace on an empty cell clears and focuses the previous cell.

The module sets `data-filled` on non-empty cells.

The module dispatches `input-otp:change` after the logical value changes.

The module dispatches `input-otp:complete` once when every cell first becomes filled.

Both custom events bubble and expose the concatenated `value` in `event.detail`.

## Keyboard

Tab follows the native input order.

Arrow Left moves focus to the previous cell.

Arrow Right moves focus to the next cell.

Backspace keeps its native behavior in a filled cell.

## Accessibility

Keep the inputs inside a named fieldset.

Give each cell a position-specific accessible name.

Keep `autocomplete="one-time-code"` on the inputs.

Keep native validation available.

Do not add a roving-tabindex model to the text inputs.

## No-JavaScript

Every cell remains labelled, editable, validated, and submitted without JavaScript.

The server receives repeated values in document order under the shared field name.

Automatic focus movement, distributed paste, and logical custom events are unavailable without JavaScript.

## Runtime

Load `input-otp.js` when automatic focus movement and distributed paste are required.

The module is an optional enhancement because the native inputs remain complete without it.
