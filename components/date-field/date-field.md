# Pattern: Date Field

## Native basis
`<input type="date">` element with native browser date picker.

---

## Native Web APIs
- [`<input type="date">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date) — native date picker with calendar UI
- [`<input type="datetime-local">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local) — date and time picker

---

## Structure

### Date
```html
<label class="label" for="birthday">Birthday</label>
<input class="date-input" type="date" id="birthday">
```

### Date and time
```html
<label class="label" for="meeting">Meeting</label>
<input class="date-input" type="datetime-local" id="meeting">
```

### With constraints
```html
<input class="date-input" type="date" id="start" min="2024-01-01" max="2025-12-31">
```

---

## Notes

- Uses the `.date-input` class — the native date picker provides the calendar UI.
- No custom calendar implementation needed — the browser handles it.
- The calendar popup is rendered by the OS/browser and cannot be styled.
- The calendar indicator is a full-height square hit area at the end of the field, with the icon painted at a compact 1rem scale and centered.
- The input remains the only focusable control. Its native `:focus-visible` indicator and browser date-segment keyboard behavior remain intact.
- Date values use the native `min`, `max`, `required`, `disabled`, and `readonly` attributes. Keep a real `<label>` associated with each input.
- Date and time state changes are immediate. This component adds no animation, transition, smooth scrolling, or custom focus management.
- For a fully custom month grid, use the [Date Picker](../date-picker/date-picker.md) component instead of replacing the browser picker.
