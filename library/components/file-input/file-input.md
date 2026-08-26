# File Input

## Purpose

File Input lets a user choose one or more local files with the native picker.

Use File Input when a form or application needs local file selection.

Do not replace the native input with a fake button that removes native file semantics.

Do not imply that file selection uploads the file before application code performs the upload.

## Native basis

File Input uses `<input type="file">`.

CSS styles the native `::file-selector-button`.

The browser owns the picker, selected file list, security boundary, keyboard activation, and form submission.

## Native Web APIs

- [`<input type="file">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file) provides local file selection.
- [`::file-selector-button`](https://developer.mozilla.org/en-US/docs/Web/CSS/::file-selector-button) styles the native picker action.
- [`multiple`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/multiple) enables multiple selection.
- [`accept`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept) provides a file-type hint to the picker.

## Structure

```html
<div class="field">
  <label class="label" for="model-file">Model file</label>
  <input class="file-input"
         id="model-file"
         name="model_file"
         type="file">
</div>
```

Use `multiple` when the task accepts several files.

```html
<input class="file-input"
       id="attachments"
       name="attachments"
       type="file"
       multiple>
```

Use `accept` only as a picker hint.

```html
<input class="file-input"
       id="image-file"
       name="image_file"
       type="file"
       accept="image/png,image/jpeg">
```

Validate file type and size in application and server code.

Do not treat `accept` as security validation.

## Behavior

Activating the native selector opens the browser or operating-system file picker.

The selected filename remains visible in the native control.

The selected `FileList` is available through the native input.

The component adds no JavaScript behavior.

File upload behavior belongs to the consuming application.

## Accessibility

Give every File Input a visible label.

Associate the label through `for` and `id`.

Use Field help text for file restrictions that affect task completion.

State accepted size or type constraints in text when the user must know them before selection.

Keep the native focus indication visible.

Do not hide the native input from keyboard users.

Do not use placeholder text as the file-control label.

## Runtime

File Input requires no component module.

The complete picker works without JavaScript.
