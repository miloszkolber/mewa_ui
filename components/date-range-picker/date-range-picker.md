# Date Range Picker

## Native basis

Date Range Picker is a native-first pair of `<input type="date">` controls. A `<fieldset>` and `<legend>` name the group, while separate labels keep the start and end controls independently addressable. The optional module progressively adds cross-field constraints and a range status. Without JavaScript, both date inputs still open the browser or operating-system date picker and submit ordinary form values.

## Native web APIs

- [`<input type="date">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date) — date editing and the browser's native calendar UI
- [`<fieldset>` and `<legend>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset) — accessible group naming
- [`min` and `max`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date#min) — native date bounds
- [`setCustomValidity()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/setCustomValidity) — optional cross-field validation added by the module
- [`aria-errormessage`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-errormessage) — associates an active error with a control only while it is invalid
- [`<output>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output) — optional range status

## Structure

### No-JavaScript fallback

```html
<fieldset class="date-range-picker">
  <legend>Trip dates</legend>
  <p class="date-range-description" id="trip-dates-description">
    Choose a start and end date.
  </p>
  <div class="date-range-controls">
    <div class="date-range-field">
      <label for="trip-start">Start date</label>
      <input class="date-range-input" data-range-start id="trip-start"
             name="start" type="date"
             aria-describedby="trip-dates-description">
    </div>
    <span class="date-range-separator" aria-hidden="true">to</span>
    <div class="date-range-field">
      <label for="trip-end">End date</label>
      <input class="date-range-input" data-range-end id="trip-end"
             name="end" type="date"
             aria-describedby="trip-dates-description">
    </div>
  </div>
  <p class="date-range-error" data-range-error id="trip-dates-error" role="alert" hidden>
    End date must be on or after the start date.
  </p>
  <output class="date-range-status" data-range-status aria-live="polite"></output>
</fieldset>
```

The two controls are independently focusable and submit `start=YYYY-MM-DD` and `end=YYYY-MM-DD` when they have names. Add static `min` and `max` attributes when a server-rendered form needs bounds even if JavaScript is unavailable.

### Required range

```html
<fieldset class="date-range-picker">
  <legend>Reservation dates</legend>
  <div class="date-range-controls">
    <div class="date-range-field">
      <label for="reservation-start">Start date <span aria-hidden="true">*</span></label>
      <input class="date-range-input" data-range-start id="reservation-start"
             name="start" type="date" required>
    </div>
    <span class="date-range-separator" aria-hidden="true">to</span>
    <div class="date-range-field">
      <label for="reservation-end">End date <span aria-hidden="true">*</span></label>
      <input class="date-range-input" data-range-end id="reservation-end"
             name="end" type="date" required>
    </div>
  </div>
</fieldset>
```

`required` belongs on both native inputs. The indicators are decorative because the browser and the labels already expose the required state.

### Known invalid range

```html
<fieldset class="date-range-picker" data-invalid>
  <legend>Report range</legend>
  <div class="date-range-controls">
    <div class="date-range-field">
      <label for="report-start">Start date</label>
      <input class="date-range-input" data-range-start id="report-start"
             type="date" value="2026-08-21">
    </div>
    <span class="date-range-separator" aria-hidden="true">to</span>
    <div class="date-range-field">
      <label for="report-end">End date</label>
      <input class="date-range-input" data-range-end id="report-end"
             type="date" value="2026-08-10" aria-invalid="true"
             aria-errormessage="report-error">
    </div>
  </div>
  <p class="date-range-error" id="report-error" role="alert">
    End date must be on or after the start date.
  </p>
</fieldset>
```

Use `data-invalid` on the group when an application or server check knows the range is invalid. Keep `aria-invalid="true"` on the affected native controls.

## Progressive enhancement

Load `date-range-picker.js` after the markup when the application wants cross-field behavior. Each `.date-range-picker` is initialized once using `data-init`; a `MutationObserver` initializes pickers inserted by an SPA. The module:

1. Keeps author-provided `min` and `max` bounds and adds `start` as the end input's minimum and `end` as the start input's maximum.
2. Uses `setCustomValidity()` on the end input when both dates are present and the end precedes the start.
3. Updates a `[data-range-status]` `<output>` and a `[data-range-error]` message when those elements are present.
4. Dispatches `date-range:change` after a native `change` event and `date-range:invalid` when the chronological validity changes.

Values that arrive reversed from a server remain dormant until an input or change interaction makes the chronological error actionable. This keeps a hidden live-region error from announcing on page load. A server-rendered invalid state (`data-invalid`, `aria-invalid="true"`, `data-range-order-invalid`, or a visible range error) is preserved and remains active. A form reset restores the initial values and the module's invalidity baseline so later chronological transitions still emit the expected event.

## Data attributes

| Attribute | Element | Purpose |
| --- | --- | --- |
| `data-range-start` | start `<input>` | Identifies the first native date control |
| `data-range-end` | end `<input>` | Identifies the second native date control |
| `data-range-status` | `<output>` | Receives the optional selected-range summary |
| `data-range-error` | error text | Receives the optional cross-field error |
| `data-range-order-invalid` | `.date-range-picker` | Module state hook for an active chronological error |
| `data-invalid` | `.date-range-picker` | Marks a known invalid range |
| `data-disabled` | `.date-range-picker` | Styling hook when a wrapper needs a disabled presentation |

The start and end markers are the only required component hooks. `data-invalid` and `data-disabled` do not replace native control attributes.

## Accessibility

- Use a native `<fieldset>` and `<legend>` so the group has a name before any script runs.
- Give each date control its own visible label and stable `id`. Use `aria-describedby` for shared help and associate the managed chronological error with the end control through `aria-errormessage` only while `aria-invalid="true"`.
- Keep errors in an element with `role="alert"` when they are inserted after interaction. The module sets `aria-invalid` on the end input only for its managed chronological error.
- The module removes only the `aria-invalid`, `aria-errormessage`, `data-invalid`, custom validity, and error state that it added. Existing server or application validity remains in place when the range becomes chronologically valid.
- The status uses `<output aria-live="polite">` and is informational. It is not a replacement for the labels or validation message.
- `required`, `disabled`, `min`, and `max` remain native HTML attributes and work without the module.

## Keyboard and events

Tab moves between the start and end inputs. Each browser owns date segment keys, arrow-key editing, and the native calendar popup. This component does not provide a custom month grid, roving tabindex, presets, or a keyboard shortcut between endpoints.

Native `focus`, `input`, `change`, `invalid`, `submit`, and `reset` events remain available. With the module loaded, `date-range:change` bubbles from the fieldset with `detail: { start, end, complete, valid }`, where dates are ISO strings or `null`. `date-range:invalid` bubbles when chronological validity changes and includes the same detail plus `reason: "order"`.

## Limitations

The calendar popup and date formatting are browser or operating-system UI and cannot be themed consistently. This component deliberately does not implement a custom calendar, timezone handling, presets, range hover states, or animation. Cross-field ordering and the live summary are progressive enhancements; server-side validation remains authoritative. For a custom month grid, compose the existing Date Picker component instead of treating these inputs as a calendar replacement.
