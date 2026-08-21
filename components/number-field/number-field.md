# Pattern: Number Field

## Native basis
`<input type="number">` with custom increment/decrement buttons.

---

## Native Web APIs
- [`<input type="number">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number) — native number input with built-in validation and step increment

---

## Structure

```html
<label class="label" for="quantity">Quantity</label>
<div class="number-field">
  <input type="number" id="quantity" min="0" max="100" step="1" value="1">
  <button type="button" data-action="increment" aria-label="Increase quantity">+</button>
  <button type="button" data-action="decrement" aria-label="Decrease quantity">−</button>
</div>
```

---

## Notes

- Places the native number input on the left and stacked step buttons on the right.
- The input is the only control with a focus highlight; both step buttons remain keyboard-operable.
- Native spinner buttons are hidden with `::-webkit-inner-spin-button`.
- Use `min`, `max`, and `step` for range constraints.
- Keyboard: arrow keys increment/decrement the native input by its step value. Tab reaches the input and then each step button in document order.
- The increment and decrement buttons use explicit `type="button"` and keep their accessible labels. They never submit a surrounding form.
- The input remains the submitted form control. The module clamps values through native `min`, `max`, and `step` validity and does not replace browser validation.
- The field has a fixed compact geometry. It has no size variants, animation, transition, or shadow. Use the surrounding layout to choose the available width.
