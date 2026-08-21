# Time field

## Native basis

`Time Field` is a labelled `<fieldset>` containing native hour and minute text inputs, a native period `<select>`, and one hidden input for the canonical submitted 24-hour value. The browser owns editing, focus, form submission, and constraint validation. The optional module enables the hidden canonical value, keeps it in sync with the visible segments, and adds bounded stepping.

## Native web APIs

- [`<fieldset>` and `<legend>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset) — names and groups the related time controls
- [`<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label) — gives each segment its accessible name
- [`<input>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input) — native text editing and form controls for the hour and minute segments
- [`inputmode="numeric"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode) — requests a numeric virtual keyboard without changing the input's value model
- [`<select>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select) — native period choice with browser keyboard behavior
- [`<output>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output) — announces the formatted selected time
- [Constraint Validation API](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation) — supports `required`, `pattern`, and other native form constraints
- [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) — serializes the enhanced hidden `HH:MM` value or the named visible segments in the no-JavaScript fallback
- [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) — publishes `time-field:change` updates from the enhanced field
- [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) — initializes fields inserted after SPA navigation
- [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) — keeps keyboard focus visible without adding motion
- [`prefers-contrast`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast) and [`forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors) — preserve high-contrast and system-color affordances

The component complements [Text Field](../text-field/text-field.md), [Select](../select/select.md), and [Form](../form/form.md). Use [Date Field](../date-field/date-field.md) when a date or a browser-provided `datetime-local` control is the better native basis.

---

## Structure

### Basic field

```html
<fieldset class="time-field" aria-describedby="reminder-time-help reminder-time-status">
  <legend>Reminder time</legend>
  <div class="time-field-controls" role="group" aria-label="Reminder time">
    <div class="time-field-segment">
      <label class="time-field-label" for="reminder-hour">Hour</label>
      <input
        class="time-field-input"
        data-time-part="hour"
        id="reminder-hour"
        name="reminder_hour"
        type="text"
        inputmode="numeric"
        maxlength="2"
        pattern="[0-9]{1,2}"
        value="09"
        aria-describedby="reminder-time-help reminder-time-status"
      >
    </div>
    <span class="time-field-separator" aria-hidden="true">:</span>
    <div class="time-field-segment">
      <label class="time-field-label" for="reminder-minute">Minute</label>
      <input
        class="time-field-input"
        data-time-part="minute"
        id="reminder-minute"
        name="reminder_minute"
        type="text"
        inputmode="numeric"
        maxlength="2"
        pattern="[0-9]{1,2}"
        value="30"
        aria-describedby="reminder-time-help reminder-time-status"
      >
    </div>
    <div class="time-field-segment time-field-period">
      <label class="time-field-label" for="reminder-period">Period</label>
      <select
        class="time-field-select"
        data-time-part="period"
        id="reminder-period"
        name="reminder_period"
        aria-describedby="reminder-time-help reminder-time-status"
      >
        <option value="AM" selected>AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
    <input class="time-field-value" data-time-part="value" type="hidden" name="reminder_time" value="09:30" disabled>
  </div>
  <p class="time-field-description" id="reminder-time-help">Enter two digits, or use Up and Down to step the focused segment.</p>
  <output class="time-field-status" data-time-part="status" id="reminder-time-status" aria-live="polite" aria-atomic="true">09:30 AM</output>
</fieldset>
```

The visible controls use a 12-hour display. When enhanced, the hidden input is the canonical submitted time value and uses the 24-hour `HH:MM` format. Before enhancement, the hidden input is disabled and the named visible segments provide a usable no-JavaScript fallback. If either visible segment is empty, the enhanced field keeps it empty, clears the hidden value, and leaves native `required` validation effective.

### Required field

```html
<fieldset class="time-field" aria-describedby="meeting-time-help meeting-time-status">
  <legend>Meeting time <span aria-hidden="true">*</span></legend>
  <div class="time-field-controls" role="group" aria-label="Meeting time">
    <div class="time-field-segment">
      <label class="time-field-label" for="meeting-hour">Hour</label>
       <input class="time-field-input" data-time-part="hour" id="meeting-hour" name="meeting_hour" type="text" inputmode="numeric" maxlength="2" pattern="[0-9]{1,2}" value="09" required>
    </div>
    <span class="time-field-separator" aria-hidden="true">:</span>
    <div class="time-field-segment">
      <label class="time-field-label" for="meeting-minute">Minute</label>
       <input class="time-field-input" data-time-part="minute" id="meeting-minute" name="meeting_minute" type="text" inputmode="numeric" maxlength="2" pattern="[0-9]{1,2}" value="00" required>
    </div>
    <div class="time-field-segment time-field-period">
      <label class="time-field-label" for="meeting-period">Period</label>
       <select class="time-field-select" data-time-part="period" id="meeting-period" name="meeting_period" required>
        <option value="AM" selected>AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
    <input data-time-part="value" type="hidden" name="meeting_time" value="09:00" disabled>
  </div>
  <p class="time-field-description" id="meeting-time-help">Choose a time for the meeting.</p>
  <output class="time-field-status" data-time-part="status" id="meeting-time-status" aria-live="polite" aria-atomic="true">09:00 AM</output>
</fieldset>
```

Use `required`, `pattern`, and `aria-invalid` on the native visible controls as appropriate for the containing form. The module does not replace native validation or invent IDs.

---

## Data attributes and classes

| Attribute or class | Element | Purpose |
| --- | --- | --- |
| `.time-field` | `<fieldset>` | Component root and module initialization target |
| `.time-field-controls` | Control wrapper | Lays out the three visible segments |
| `.time-field-segment` | Segment wrapper | Keeps a label associated with one native control |
| `.time-field-input` | Hour and minute `<input>` | Applies control styling |
| `.time-field-select` | Period `<select>` | Applies native select styling |
| `.time-field-description` | Help text | Describes editing and keyboard behavior |
| `.time-field-status` | `<output>` | Receives the formatted `HH:MM AM/PM` announcement |
| `data-time-part="hour"` | Hour input | Identifies the hour segment for the module |
| `data-time-part="minute"` | Minute input | Identifies the minute segment for the module |
| `data-time-part="period"` | Period select | Identifies the AM/PM select for the module |
| `data-time-part="value"` | Hidden input | Identifies the canonical 24-hour value enabled by the module |
| `data-time-part="status"` | Output | Identifies the status output |
| `data-invalid` | Root fieldset | Optional styling hook for a known application error |
| `data-disabled` | Root fieldset | Optional wrapper styling hook when a disabled presentation is needed |
| `data-init` | Root fieldset | Added by `time-field.js`; do not author it manually |

The module requires the `.time-field` root, the hour and minute markers, and the period marker. The submitted and status markers are optional, but omitting them removes synchronization or announcements for that part. The classes and explicit `for`/`id` pairs remain useful with no JavaScript.

---

## Progressive enhancement

Load `time-field.css` with the foundation files. Load `time-field.js` as a module only when segment synchronization and stepping are wanted:

```html
<link rel="stylesheet" href="/ui/src/base.css">
<link rel="stylesheet" href="/ui/src/tokens.css">
<link rel="stylesheet" href="/ui/components/time-field/time-field.css">
<script type="module" src="/ui/components/time-field/time-field.js"></script>
```

The module initializes each `.time-field` once. It sets `data-init` before reading the controls, so loading the module more than once does not duplicate listeners. A `MutationObserver` initializes matching fields added after the initial page load. On initialization it enables the hidden canonical input, clamps and pads non-empty visible segments, and updates the hidden input and output without emitting an event. Empty segments stay empty rather than receiving a fallback value.

---

## Numeric behavior

- `inputmode="numeric"`, `maxlength="2"`, and the example `pattern` provide native editing and validation hints. They do not make a text input numeric by themselves.
- On `input`, the module removes non-ASCII digits and keeps at most two digits. Entering two hour digits moves focus to the minute input, matching the original segmented-field behavior.
- While editing, an out-of-range hour or minute retains the typed text, receives native custom validity, and clears the hidden canonical value. On `change` and `blur`, non-empty hour values are clamped to `01`–`12` and non-empty minute values to `00`–`59`. Empty values stay empty so a required field can still report that the user has not supplied a time.
- `ArrowUp` and `ArrowDown` step the focused hour or minute and wrap within that segment's range. Hour stepping does not change AM/PM, and minute stepping does not change the hour.
- The period select remains native. Values other than `AM` or `PM` are normalized to `AM` before serialization.

---

## Keyboard

| Key or action | Result |
| --- | --- |
| `Tab` / `Shift+Tab` | Uses the browser's native focus order through hour, minute, and period controls |
| Digits | Edits the focused native input; non-digits are filtered after `input` |
| Two hour digits | Moves focus to the minute input |
| `ArrowUp` | Increments the focused hour or minute and wraps at the upper bound |
| `ArrowDown` | Decrements the focused hour or minute and wraps at the lower bound |
| `Blur` or native `change` | Pads and clamps the edited segment, then synchronizes the submitted value |
| Native select keys | The browser controls AM/PM selection and type-ahead |

The module prevents the browser's page-scrolling behavior only for handled ArrowUp and ArrowDown events. It does not trap focus or replace the native input and select keyboard models.

---

## Events

The enhanced root dispatches a bubbling `CustomEvent` after an input, change, blur, or handled arrow step:

```js
document.addEventListener('time-field:change', (event) => {
  console.log(event.target, event.detail.value);
});
```

| Event | Target | Detail |
| --- | --- | --- |
| `time-field:change` | `.time-field` | `{ value, hour, minute, period, source }` |

`value` is the serialized 24-hour `HH:MM` string. `hour` and `minute` are two-digit display strings, `period` is `AM` or `PM`, and `source` is `input`, `change`, `blur`, or `keyboard`. The initial synchronization and a native form reset update the controls without dispatching this event. Native `input`, `change`, `blur`, `invalid`, `submit`, and `reset` events remain available on the underlying controls and form.

---

## Accessibility

- Use a native `<fieldset>` and `<legend>` for the shared time name. Do not replace the legend with a placeholder or a `div` heading.
- Give every visible segment a real `<label>` associated with its input or select through matching `for` and `id` attributes. Keep labels visible unless the surrounding design has a documented visually hidden-label pattern.
- Put descriptions and the output ID in `aria-describedby` on the visible controls when they should be announced with each segment. The fieldset may also reference them for group-level context.
- Keep `aria-invalid="true"` on each invalid native control. `data-invalid` only styles the composition and is not an accessibility state.
- The module uses `setCustomValidity()` for out-of-range numeric segments while the user is editing. Native `required`, `pattern`, and custom validity remain authoritative for form submission.
- Keep the output `aria-live="polite"` and `aria-atomic="true"` so a changed value is announced without moving focus. Make the output visible when users benefit from confirmation of the normalized value.
- Preserve the native `disabled`, `readonly`, `required`, `pattern`, and `maxlength` attributes. A disabled visible control is not editable and a disabled hidden input is omitted from form submission.
- Focus styles use `:focus-visible`, semantic border tokens, and system colors in forced-colors mode. The stylesheet adds no motion or shadow that could obscure focus.

---

## Limitations

- This is a 12-hour field with an AM/PM select. It does not provide locale-specific ordering, localized separators, seconds, time zones, or a custom picker popup.
- Without `time-field.js`, the browser can edit and validate the named visible segments and the disabled hidden canonical input is omitted from submission. With the module, the hidden input is enabled and synchronized as the canonical `HH:MM` value. An empty visible segment clears it instead of defaulting to noon.
- The module does not generate IDs, labels, descriptions, error messages, or hidden inputs. The documented markup must be complete before enhancement.
- Numeric filtering handles ASCII digits only. Locale-specific numeral entry and localization of the status sentence belong to the embedding application.
- The visible segments keep their fallback names for no-JavaScript forms. When enhanced, read the enabled hidden `HH:MM` field from `FormData` as the canonical value and treat the visible segment names as supplemental fields in the containing [Form](../form/form.md).
