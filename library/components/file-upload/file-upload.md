# File Upload

## Purpose

File Upload adds a drop target, selection feedback, and removal controls to native file selection.

Use File Upload when drag-and-drop or an editable file list improves the task.

Use File Input when the native picker and filename display are sufficient.

Do not imply that selected files have reached a server before application code uploads them.

## Native basis

File Upload uses `<input type="file">` as the authoritative submitted control.

The drop target is a native `<label>` that contains the input.

The module assigns accepted dropped files to the native `FileList` through `DataTransfer`.

The browser owns the file picker, security boundary, native validation, and form submission.

## Native Web APIs

- [`<input type="file">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file) provides local file selection and form submission.
- [Drag and Drop](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) provides pointer-based file delivery.
- [`DataTransfer`](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer) transfers dropped files to the native input.
- [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) exposes file name, type, and size metadata.
- [`URL.createObjectURL()`](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static) provides local image previews.

## Structure

Keep the file input inside the drop-zone label.

Keep the native input visible until the module initializes.

Use `accept` as a picker hint only.

```html
<div class="file-upload"
     data-file-upload
     data-max-files="4"
     data-max-size="5242880"
     data-preview>
  <label class="file-upload-dropzone" for="project-images">
    <span class="file-upload-title" id="project-images-label">Project images</span>
    <span class="file-upload-prompt">Choose files or drop them here</span>
    <span class="file-upload-hint" id="project-images-description">
      PNG or JPEG. Maximum 5 MB per file.
    </span>
    <input class="file-upload-input"
           id="project-images"
           name="project_images"
           type="file"
           accept="image/png,image/jpeg"
           multiple
           aria-labelledby="project-images-label"
           aria-describedby="project-images-description project-images-status project-images-error">
  </label>
  <ul class="file-upload-list" data-file-upload-list></ul>
  <p class="file-upload-status"
     id="project-images-status"
     data-file-upload-status
     role="status"></p>
  <p class="file-upload-error"
     id="project-images-error"
     data-file-upload-error
     role="alert"
     hidden></p>
</div>
```

Use `data-max-files` for the maximum selected count.

Use `data-max-size` for the maximum byte size of each file.

Use `data-preview` to show local thumbnails for supported image files.

Validate file type, size, and contents again in application and server code.

## Behavior

Picker selection replaces the current native selection.

Dropped files accumulate when the input has `multiple`.

A single-file input uses the first dropped file.

The module rejects the complete attempted batch when one file fails the `accept`, size, count, or directory rule.

The module keeps the native input `files` value synchronized after a drop or removal.

The module revokes old preview object URLs before it renders a new list.

The module dispatches native `input` and `change` events from the file input after a drop or removal.

The module dispatches `file-upload:change` from the component after an accepted picker, drop, or removal change.

The custom event detail contains `files` and `source` properties.

## Keyboard

Tab reaches the native file input.

Enter or Space opens the native picker while the file input has focus.

Tab reaches each generated Remove button.

Enter or Space activates a focused Remove button.

Drag-and-drop is never the only file-selection path.

## Accessibility

Give the file input a visible label.

State required type and size limits before selection.

Give every generated removal button a filename-specific accessible name.

Keep the result status separate from the error alert.

Do not rely on drag state color as the only drop-target feedback.

## No-JavaScript

The native file input remains visible and usable without JavaScript.

The browser continues to display the native selected filename.

Drag-and-drop, previews, the enhanced file list, and removal controls are unavailable without JavaScript.

## Runtime

Load `file-upload.js` when the enhanced drop target and file list are required.

The module is an optional enhancement because native file selection and submission remain available without it.
