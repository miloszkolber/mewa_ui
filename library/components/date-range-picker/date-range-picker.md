# Date Range Picker

## Purpose

Date Range Picker collects a start date and an end date as one submitted interval.

Use Date Range Picker when both endpoints belong to the same task and native date inputs meet the interaction need.

Use Date Field for one date.

Use Date Picker when the interface needs a visible custom month grid.

Do not use Date Range Picker as a custom calendar surface.

## Native basis

Date Range Picker uses two native `<input type="date">` controls inside a `<fieldset>`.

Each date remains independently editable and submittable without JavaScript.

The optional module adds chronological cross-field validation and a shared status.

## Native Web APIs

- [`<input type="date">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date) provides date editing and the native picker.
- [`<fieldset>` and `<legend>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset) provide group semantics.
- [`min` and `max`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date#min) constrain native date values.
- [`setCustomValidity()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/setCustomValidity) adds the optional chronological error.
- [`aria-errormessage`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-errormessage) references the active error.
- [`<output>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output) provides the optional range summary.

## Structure

```html
<fieldset class="date-range-picker">
  <legend>Report range</legend>
  <p class="date-range-description" id="report-range-help">
    Choose the first and last date to include.
  </p>

  <div class="date-range-controls">
    <div class="date-range-field">
      <label for="report-start">Start date</label>
      <input class="date-range-input"
             id="report-start"
             name="start"
             type="date"
             data-range-start
             aria-describedby="report-range-help">
    </div>

    <span class="date-range-separator" aria-hidden="true">to</span>

    <div class="date-range-field">
      <label for="report-end">End date</label>
      <input class="date-range-input"
             id="report-end"
             name="end"
             type="date"
             data-range-end
             aria-describedby="report-range-help">
    </div>
  </div>

  <p class="date-range-error"
     id="report-range-error"
     data-range-error
     role="alert"
     hidden>
    End date must be on or after the start date.
  </p>

  <output class="date-range-status"
          data-range-status
          aria-live="polite"></output>
</fieldset>
```

`data-range-start` and `data-range-end` are the required enhancement hooks.

The description, error, and output are optional.

Keep `name` attributes when the values belong to a form submission.

## Required range

Put `required` on both native inputs when both values are required.

Do not use a visual asterisk as the source of required state.

Use native `min` and `max` values when static bounds are known before JavaScript runs.

## Known server error

Keep server-rendered invalid state in the markup.

Put `aria-invalid="true"` on the affected input.

Reference the visible error with `aria-errormessage`.

Use `data-invalid` on the root only as the documented group styling hook.

The module preserves server-owned invalid state when its own chronological condition becomes valid.

## Progressive enhancement

Load the module when the application needs cross-field ordering behavior.

The module constrains the end input from the current start value.

The module constrains the start input from the current end value.

The module sets a custom error when both values exist and the end precedes the start.

The module updates the optional error and status elements.

The module does not announce a reversed server value on initial page load unless the server already exposes it as invalid.

The module resets its managed state after a native form reset.

## Data attributes

| Attribute | Purpose |
| --- | --- |
| `data-range-start` | Identifies the start input. |
| `data-range-end` | Identifies the end input. |
| `data-range-status` | Identifies the optional summary output. |
| `data-range-error` | Identifies the optional chronological error. |
| `data-range-order-invalid` | Marks a chronological error owned by the module. |
| `data-invalid` | Styles a known invalid group. |
| `data-disabled` | Styles a wrapper when a native disabled state cannot represent the whole group. |

Do not use wrapper data attributes instead of native `required`, `disabled`, `min`, or `max` attributes.

Do not author `data-range-order-invalid` as application state.

## Events

The enhanced root dispatches `date-range:change` after a native change event.

Its detail is `{ start, end, complete, valid }`.

The enhanced root dispatches `date-range:invalid` when chronological validity changes.

The invalid event also includes `reason: "order"`.

Date values in event detail are ISO strings or `null`.

## Keyboard

Tab moves between the two native date inputs.

The browser owns date-segment editing and native picker keys.

The component does not add roving focus or range-grid keyboard behavior.

## Accessibility

Use one native fieldset and legend for the interval.

Give each date input its own visible label.

Keep shared help text explicitly referenced when present.

Reference an error only while the affected input is invalid.

Use the status output for information, not as a replacement for labels or errors.

Keep server-side validation authoritative.

Do not add custom calendar roles to the native date inputs.

## Runtime

`date-range-picker.js` is optional.

Without the module, both date inputs remain fully usable and submit ordinary native values.

Load the module only when chronological cross-field validation or the shared status is required.
