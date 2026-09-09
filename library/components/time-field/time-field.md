# Time Field

## Purpose

Time Field collects one 12-hour time from separate hour, minute, and period controls.

Use Time Field when segmented entry improves accuracy or scanning.

Use a native time input when the browser control is simpler for the product.

Do not use Time Field for dates, time zones, seconds, or locale-specific time composition.

## Native basis

Time Field uses a native `<fieldset>`, two text inputs, one native `<select>`, and an optional hidden input.

The visible controls remain editable and submittable without JavaScript.

The optional module synchronizes one canonical 24-hour `HH:MM` value and adds bounded segment stepping.

## Native Web APIs

- [`<fieldset>` and `<legend>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset) name the time group.
- [`<input>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input) provides native hour and minute editing.
- [`inputmode="numeric"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode) requests a numeric virtual keyboard.
- [`<select>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select) provides native AM and PM selection.
- [`<output>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output) can expose the normalized visible time.
- [`setCustomValidity()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/setCustomValidity) reports invalid segment values during enhanced editing.

## Structure

```html
<fieldset class="time-field" aria-describedby="reminder-time-help reminder-time-status">
  <legend>Reminder time</legend>

  <div class="time-field-controls">
    <div class="time-field-segment">
      <label class="time-field-label" for="reminder-hour">Hour</label>
      <input class="time-field-input"
             id="reminder-hour"
             name="reminder_hour"
             type="text"
             inputmode="numeric"
             maxlength="2"
             pattern="[0-9]{1,2}"
             data-time-part="hour">
    </div>

    <span class="time-field-separator" aria-hidden="true">:</span>

    <div class="time-field-segment">
      <label class="time-field-label" for="reminder-minute">Minute</label>
      <input class="time-field-input"
             id="reminder-minute"
             name="reminder_minute"
             type="text"
             inputmode="numeric"
             maxlength="2"
             pattern="[0-9]{1,2}"
             data-time-part="minute">
    </div>

    <div class="time-field-segment time-field-period">
      <label class="time-field-label" for="reminder-period">Period</label>
      <select class="time-field-select"
              id="reminder-period"
              name="reminder_period"
              data-time-part="period">
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>

    <input type="hidden"
           name="reminder_time"
           value=""
           disabled
           data-time-part="value">
  </div>

  <p class="time-field-description" id="reminder-time-help">
    Enter a time or use Up and Down to step the focused number.
  </p>
  <output class="time-field-status"
          id="reminder-time-status"
          data-time-part="status"
          aria-live="polite"></output>
</fieldset>
```

Keep visible segment names when the no-JavaScript form must submit them.

Keep the hidden canonical input disabled before enhancement.

## Required state

Put `required` on each required visible control.

Do not put `required` on the hidden canonical input.

Keep native validation active for empty visible segments.

## Data attributes

`data-time-part="hour"` identifies the hour input.

`data-time-part="minute"` identifies the minute input.

`data-time-part="period"` identifies the period select.

`data-time-part="value"` identifies the optional canonical hidden input.

`data-time-part="status"` identifies the optional normalized output.

Use `data-invalid` only as a root styling hook for known invalid state.

Use `data-disabled` only when the wrapper needs disabled presentation.

The module may expose the legacy `data-init` readiness marker for compatibility.

Do not author `data-init`.

## Behavior

The module leaves readonly and disabled segments unchanged during interaction.

The module waits for committed input before filtering composition text.

The module enables the hidden canonical input when it exists.

The module filters hour and minute entry to at most two ASCII digits.

Entering two hour digits moves focus to the minute input.

Arrow Up increments the focused numeric segment and wraps within its range.

Arrow Down decrements the focused numeric segment and wraps within its range.

Blur and change clamp a non-empty hour to 01 through 12.

Blur and change clamp a non-empty minute to 00 through 59.

Empty segments remain empty.

The module clears the canonical value when either numeric segment is empty or invalid.

The module serializes a complete time as 24-hour `HH:MM`.

The module updates the optional visible status.

A native form reset restores synchronization without dispatching a component event.

## Keyboard

Tab follows the native hour, minute, and period order.

Arrow Up and Arrow Down step the focused numeric segment.

Native Select keys control AM and PM.

The component does not trap focus.

The component does not implement a custom time popup.

## Events

The enhanced root dispatches `time-field:change` after an input, change, blur, or handled keyboard step.

The event bubbles.

The detail is `{ value, hour, minute, period, source }`.

`source` is `input`, `change`, `blur`, or `keyboard`.

The initial synchronization does not dispatch the event.

## Accessibility

Use a fieldset and legend for the shared time name.

Give each visible segment a real label.

Reference shared help and status text when they help segment entry.

Keep invalid state on the affected native control.

Keep the status visible when normalized-value confirmation helps users.

Do not replace labels with placeholders.

Do not describe the component as locale-aware.

## Runtime

`time-field.js` is optional.

Without the module, the visible named controls remain usable and submittable.

With the module, the enabled hidden input becomes the canonical `HH:MM` value when present.
