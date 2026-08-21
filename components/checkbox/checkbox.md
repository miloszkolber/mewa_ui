# Pattern: Checkbox

## Native basis
`<input type="checkbox">` element styled with CSS `appearance: none`.

---

## Native Web APIs
- [`<input type="checkbox">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox) — native toggle control with built-in keyboard and form support
- [`:checked`](https://developer.mozilla.org/en-US/docs/Web/CSS/:checked) — matches checked state
- [`:indeterminate`](https://developer.mozilla.org/en-US/docs/Web/CSS/:indeterminate) — matches the indeterminate (mixed) state
- [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) — keyboard-only focus ring
- [`:user-invalid`](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid) — post-interaction validation styling
- [`prefers-contrast`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast) — thicker borders for high-contrast preference
- [`forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors) — reverts to native checkbox in Windows High Contrast Mode
- [`HTMLInputElement.indeterminate`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/indeterminate) — represents a mixed select-all state
- [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) — initializes enhanced groups inserted after SPA navigation
- [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) — publishes group selection changes

---

## Structure

### Basic
```html
<div class="flex items-center gap-2">
  <input class="checkbox" type="checkbox" id="terms">
  <label class="label" for="terms" style="margin:0;">Accept terms and conditions</label>
</div>
```

### With description
```html
<div class="checkbox-item-block">
  <input class="checkbox" type="checkbox" id="notify">
  <div>
    <label for="notify">Enable notifications</label>
    <p class="checkbox-description">You can enable or disable notifications at any time.</p>
  </div>
</div>
```

### Checked by default
```html
<input class="checkbox" type="checkbox" id="checked" checked>
```

### Disabled
```html
<input class="checkbox" type="checkbox" disabled>
<input class="checkbox" type="checkbox" disabled checked>
```

### Invalid
```html
<input class="checkbox" type="checkbox" aria-invalid="true" required>
```

### Checkbox group
```html
<fieldset class="checkbox-group" data-checkbox-group aria-describedby="channels-help channels-status">
  <legend>Select items to display</legend>
  <p class="checkbox-description" id="channels-help">Choose which items are visible.</p>
  <label class="checkbox-item checkbox-group-select-all" for="channels-all">
    <input class="checkbox" data-checkbox-all id="channels-all" type="checkbox" aria-controls="channels-items">
    <span>Select all</span>
  </label>
  <div class="checkbox-group-items" data-checkbox-items id="channels-items">
    <div class="checkbox-item">
      <input class="checkbox" data-checkbox-item id="item-1" name="channels" type="checkbox" value="one" checked>
      <label for="item-1">Item 1</label>
    </div>
    <div class="checkbox-item">
      <input class="checkbox" data-checkbox-item id="item-2" name="channels" type="checkbox" value="two">
      <label for="item-2">Item 2</label>
    </div>
  </div>
  <output class="checkbox-group-status" data-checkbox-status id="channels-status" role="status" aria-live="polite"></output>
</fieldset>
```

The group module is optional. Without it, the select-all control is an ordinary checkbox and the item controls remain native form controls. With it, the select-all control reflects all, none, or mixed item state and updates the polite status output. Disabled items are excluded from the count and are never changed by Select all.

---

## Keyboard

| Key     | Action                         |
| ------- | ------------------------------ |
| `Space` | Toggles checked / unchecked    |
| `Tab`   | Moves focus to the next control |

All keyboard behavior is provided natively by `<input type="checkbox">`.

---

## Accessibility

- The native `<input type="checkbox">` provides all keyboard and screen reader support.
- Use `<label>` with `for` to associate the label text.
- Use `<fieldset>` + `<legend>` for checkbox groups.
- Use `aria-invalid="true"` for validation errors.
- Use `indeterminate` property via JS for the indeterminate (mixed) state.
- Use the group module's `data-checkbox-all`, `data-checkbox-item`, and `data-checkbox-status` hooks when a select-all control needs coordinated state. Keep the group in a `<fieldset>` with a `<legend>`.
- Give the select-all control an `aria-controls` value that references the item container. The mixed state is exposed through the native checkbox's `indeterminate` property.

---

## Notes

- Styled with `appearance: none` and a custom checkmark via `::after` pseudo-element.
- The checkmark uses a CSS-only approach — no SVG or icon font needed.
- Use `.checkbox-description` inside `.checkbox-item-block` for helper text; it is part of the checkbox component and does not depend on other components' classes.
- Indeterminate state is set via JavaScript: `checkbox.indeterminate = true;`.
- In `forced-colors: active`, the checkbox reverts to `appearance: auto` so Windows High Contrast Mode controls rendering.

## Progressive enhancement

Load `checkbox.css` with the foundation files. Load `checkbox.js` only when a group needs Select all coordination:

```html
<link rel="stylesheet" href="/ui/src/base.css">
<link rel="stylesheet" href="/ui/src/tokens.css">
<link rel="stylesheet" href="/ui/components/checkbox/checkbox.css">
<script type="module" src="/ui/components/checkbox/checkbox.js"></script>
```

The module initializes each `.checkbox-group` or `[data-checkbox-group]` once and retries an incomplete root if its required hooks are not present yet. A `MutationObserver` initializes groups added after SPA navigation. It dispatches a bubbling `checkbox-group:change` event with `{ values, selected, total, source }` after a user changes an item or Select all.

The component complements [Field](../field/field.md), [Form](../form/form.md), and [Checkbox](checkbox.md)'s native single-control pattern. Use [Radio group](../radio-group/radio-group.md) when exactly one option must be selected.

```js
document.addEventListener('checkbox-group:change', (event) => {
  console.log(event.detail.values, event.detail.source);
});
```
