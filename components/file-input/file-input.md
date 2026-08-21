# Pattern: File Input

## Native basis
`<input type="file">` element with custom `::file-selector-button` styling.

---

## Native Web APIs
- [`<input type="file">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file) — native file picker with drag-and-drop support
- [`::file-selector-button`](https://developer.mozilla.org/en-US/docs/Web/CSS/::file-selector-button) — styles the native Choose File button

---

## Structure

```html
<label class="label" for="avatar">Picture</label>
<input class="file-input" type="file" id="avatar">
```

### Multiple
```html
<input class="file-input" type="file" id="docs" multiple>
```

### Accept filter
```html
<input class="file-input" type="file" id="photo" accept="image/*">
```

---

## Notes

- Uses the same border and focus treatment as text fields for consistency.
- The `::file-selector-button` is the only button-like surface. The selected filename remains plain muted text.
- Use `.file-input` as the standalone class for file controls.
