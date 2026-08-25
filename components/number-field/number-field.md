# Number Field

## Purpose

Number Field collects a numeric value with explicit decrement and increment controls.

Use Number Field when repeated small step changes are common.

Use Slider when spatial range adjustment is more useful.

Use a plain native number input when step buttons add no value.

## Native basis

Use a native `<input type="number">` as the submitted control.

Use two native buttons for decrement and increment actions.

The browser owns numeric editing, constraints, and form validation.

The module calls native `stepDown()` and `stepUp()` methods.

## Native Web APIs

- [`<input type="number">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number) provides numeric editing and constraint validation.
- [`stepUp()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/stepUp) applies the native increment rule.
- [`stepDown()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/stepDown) applies the native decrement rule.
- [`min`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/min) defines the lower constraint.
- [`max`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/max) defines the upper constraint.
- [`step`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/step) defines the numeric increment.

## Structure

Give the native input a visible label.

Keep the input as the form control with the stable `name`.

Keep both step buttons `type="button"`.

```html
<div class="field">
  <label for="quantity">Quantity</label>
  <div class="number-field">
    <input type="number"
           id="quantity"
           name="quantity"
           min="0"
           max="100"
           step="1"
           value="1">
    <button type="button" data-action="decrement" aria-label="Decrease quantity">
      <i data-lucide="minus" aria-hidden="true"></i>
    </button>
    <button type="button" data-action="increment" aria-label="Increase quantity">
      <i data-lucide="plus" aria-hidden="true"></i>
    </button>
  </div>
</div>
```

Use local SVG icons or the documented local icon loader.

Do not use text plus and minus glyphs when the application already uses the local icon system.

## Behavior

The input accepts normal numeric typing.

Arrow Up and Arrow Down use native number-input stepping.

The decrement button calls `stepDown()`.

The increment button calls `stepUp()`.

The module dispatches bubbling `input` and `change` events after a successful button step.

Native `min`, `max`, and `step` constraints remain authoritative.

The module ignores a step operation that the browser rejects at a constraint boundary.

## Keyboard

Tab reaches the input, decrement button, and increment button in document order.

Enter or Space activates a focused step button.

Arrow keys retain native input behavior while focus is on the input.

## Accessibility

Keep the visible label associated with the input.

Give each step button a specific accessible name.

Keep the button names consistent with the labelled numeric field.

Do not put the submitted `name` on the step buttons.

Do not replace native validation with custom button state.

## Runtime

Load `number-field.js` whenever the step buttons are present.

The native numeric input remains usable without the module.

The step buttons do not provide the documented action without the module.
