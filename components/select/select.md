# Select

## Purpose

Select chooses a value from a fixed native option list.

Use Select when the option set is short or medium and search is unnecessary.

Use Combobox when a long option set needs search.

Do not replace Select with a custom popup only for visual consistency.

## Native basis

Use a native `<select>` element.

The stylesheet uses `appearance: none` for the closed control.

The browser owns the opened option picker.

## Native Web APIs

- [`<select>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select) provides keyboard navigation, form submission, validation, and the platform picker.
- [`<option>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option) defines one submitted value.
- [`<optgroup>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup) groups related options.
- [`required`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/required) enables native required-field validation.

## Structure

Give Select a visible label.

Give Select a stable `name` when the value belongs to a form.

Use an empty disabled option only when the control needs an explicit prompt.

```html
<div class="field">
  <label for="fruit">Fruit</label>
  <select class="select" id="fruit" name="fruit" required>
    <option value="" disabled selected>Select a fruit</option>
    <option value="apple">Apple</option>
    <option value="banana">Banana</option>
    <option value="cherry">Cherry</option>
  </select>
</div>
```

## Groups

Use `<optgroup>` only when the grouping improves scanning.

```html
<div class="field">
  <label for="timezone">Time zone</label>
  <select class="select" id="timezone" name="timezone">
    <optgroup label="Americas">
      <option value="america-new-york">New York</option>
      <option value="america-los-angeles">Los Angeles</option>
    </optgroup>
    <optgroup label="Europe">
      <option value="europe-london">London</option>
      <option value="europe-paris">Paris</option>
    </optgroup>
  </select>
</div>
```

Keep submitted values stable.

Do not use visible option text as an application identifier.

## Behavior

Select uses the shared 40px control height.

The browser provides arrow-key navigation and type-ahead.

The browser provides the platform picker on touch devices.

The browser submits the selected option value.

The component adds no JavaScript behavior.

## Accessibility

Use a visible `<label>` with `for` and `id`.

Use `disabled` on an unavailable option.

Use `disabled` on the control when the complete control is unavailable.

Use `required` when the form requires a choice.

Use Field error text for an application validation error.

Do not put instructions only in the placeholder option.

Do not replace native keyboard behavior.

## Runtime

Select requires no component module.

The complete control remains usable without JavaScript.
