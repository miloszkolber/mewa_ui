# Date Field

## Purpose

Date Field collects one date or local date and time with the browser control.

Use Date Field when the native browser picker meets the task.

Use Date Picker when the interface requires a visible custom month grid.

Do not replace the native picker only to make its popup match application styling.

## Native basis

Date Field uses `<input type="date">` or `<input type="datetime-local">`.

The browser owns date parsing, editing, picker presentation, keyboard behavior, and validation.

## Native Web APIs

- [`<input type="date">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date) provides native date entry and selection.
- [`<input type="datetime-local">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local) provides local date and time entry.
- [`min`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/min) and [`max`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/max) constrain the accepted range.
- [`required`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/required) provides native required validation.

## Structure

```html
<div class="field">
  <label class="label" for="start-date">Start date</label>
  <input class="date-input"
         id="start-date"
         name="start_date"
         type="date">
</div>
```

Use `datetime-local` when the task needs a local date and time.

```html
<div class="field">
  <label class="label" for="run-at">Run at</label>
  <input class="date-input"
         id="run-at"
         name="run_at"
         type="datetime-local">
</div>
```

## Constraints

Use native constraints when they match the product rule.

```html
<input class="date-input"
       id="archive-date"
       name="archive_date"
       type="date"
       min="2026-01-01"
       max="2026-12-31"
       required>
```

Keep server validation authoritative for business rules.

Do not calculate a fixed future date in library markup.

## Behavior

The input remains the only focusable control.

The browser opens its native picker through the platform affordance.

The browser owns date-segment keyboard editing.

The browser submits the normalized native value.

The component adds no JavaScript behavior.

Field state feedback uses the shared fast motion primitives. Value changes remain immediate.

## Accessibility

Give every Date Field a visible label.

Associate the label with `for` and `id`.

Use Field descriptions and errors when additional guidance is necessary.

Keep `required`, `disabled`, and `readonly` on the native input.

Do not add ARIA that duplicates native date-input semantics.

Do not hide the native picker indicator from keyboard or pointer users.

## Runtime

Date Field requires no component module.

The complete input works without JavaScript.
