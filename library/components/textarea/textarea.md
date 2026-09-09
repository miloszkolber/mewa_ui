# Textarea

## Purpose

Textarea collects multi-line text.

Use Textarea when the user can enter more than one line.

Use Text Field for one-line input.

Do not use Textarea for a short fixed-format value.

## Native basis

Use a native `<textarea>` element.

The browser owns editing, selection, validation, and form submission.

CSS uses `field-sizing: content` for content-driven growth.

Textarea requires no JavaScript.

## Repository contract

Textarea keeps the repository-owned spacious minimum: an 80px minimum height and 12px horizontal padding. The Figma text-area set is treated as an abstraction for this component and does not replace the native multiline editing geometry.

## Native Web APIs

- [`<textarea>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea) provides native multi-line text editing.
- [`field-sizing: content`](https://developer.mozilla.org/en-US/docs/Web/CSS/field-sizing) lets the control grow from its content.
- [`maxlength`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/maxlength) limits submitted text length when the product has a real limit.
- [`required`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/required) enables native required-field validation.
- [`autocomplete`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete) provides an input-purpose hint when a matching value exists.
- [`:user-invalid`](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid) exposes native validation after user interaction.

## Structure

Give Textarea a visible label.

Give Textarea a stable `name` when the value belongs to a form.

Use Field when the control needs help text or an error.

```html
<div class="field">
  <label for="message">Message</label>
  <textarea class="textarea"
            id="message"
            name="message"
            rows="4"
            required
            aria-describedby="message-help"></textarea>
  <p class="field-description" id="message-help">Describe the issue and the expected result.</p>
</div>
```

Do not use placeholder text as the only label.

Use `rows` to provide a useful initial height when the content is empty.

## Validation

Use native constraints when they express the real product rule.

Use `required` when the form requires a value.

Use `maxlength` when the backend or product has a real text limit.

Set `aria-invalid="true"` after the application knows the value is invalid.

Reference visible error text with `aria-describedby` or `aria-errormessage` according to the Field contract.

Do not clear the entered value after validation fails.

## Behavior

Textarea grows from its content when the browser supports `field-sizing: content`.

Textarea keeps its minimum control height when content is short.

The browser provides normal selection, clipboard, undo, and text-editing behavior.

The component adds no JavaScript behavior.

## Accessibility

Keep a visible label.

Keep label, description, and error relationships explicit.

Keep the control reachable in normal tab order.

Do not disable resizing behavior through JavaScript.

Do not announce every keystroke through a live region.

## Runtime

Textarea requires no component module.

The complete control remains usable without JavaScript.
