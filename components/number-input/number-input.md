# Pattern: Number Input

## Native basis
`<input type="number">` with custom increment/decrement buttons.

---

## Native Web APIs
- [`<input type="number">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number) — native number input with built-in validation and step increment

---

## Structure

```html
<label class="label" for="quantity">Quantity</label>
<div class="number-input">
  <button type="button" data-action="decrement" aria-label="Decrease quantity">−</button>
  <input type="number" id="quantity" min="0" max="100" step="1" value="1">
  <button type="button" data-action="increment" aria-label="Increase quantity">+</button>
</div>
```

---

## Notes

- Places the native number input on the left and stacked step buttons on the right.
- Native spinner buttons are hidden with `::-webkit-inner-spin-button`.
- Use `min`, `max`, and `step` for range constraints.
- Keyboard: arrow keys increment/decrement by step value.
