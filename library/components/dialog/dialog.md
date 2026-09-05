# Dialog

## Purpose

Dialog contains a focused modal task.

Use Dialog when the user must complete or dismiss a task before returning to the page.

Use Alert Dialog for a high-impact destructive decision.

Do not use Dialog for ordinary page content or brief status feedback.

## Native basis

Use a native `<dialog>` opened with `showModal()`.

The browser places the modal in the top layer.

The browser makes the rest of the document inert.

The browser supports Escape dismissal.

The module wires triggers, close controls, backdrop dismissal, and focus restoration.

## Native Web APIs

- [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) provides native modal semantics.
- [`showModal()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal) opens the modal in the top layer.
- [`::backdrop`](https://developer.mozilla.org/en-US/docs/Web/CSS/::backdrop) styles the modal backdrop.
- [`autofocus`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autofocus) identifies the intended initial focus target.

## Structure

Give the dialog a visible title.

Reference the title with `aria-labelledby`.

Reference supporting text with `aria-describedby` when it explains the task.

Do not add redundant `role="dialog"` or `aria-modal="true"` to native modal markup.

```html
<button class="btn"
        type="button"
        data-variant="default"
        data-dialog-trigger="edit-profile"
        aria-haspopup="dialog">
  Edit profile
</button>

<dialog class="dialog"
        id="edit-profile"
        aria-labelledby="edit-profile-title"
        aria-describedby="edit-profile-description">
  <div class="dialog-content">
    <div class="dialog-header">
      <h2 class="dialog-title" id="edit-profile-title">Edit profile</h2>
      <p class="dialog-description" id="edit-profile-description">Update the public profile details.</p>
    </div>

    <div class="dialog-body">
      <label for="profile-name">Name</label>
      <input class="text-field-input" id="profile-name" name="name" autofocus>
    </div>

    <div class="dialog-footer">
      <button class="btn" type="button" data-variant="outline" data-dialog-close>Cancel</button>
      <button class="btn" type="button" data-variant="default">Save changes</button>
    </div>
  </div>
</dialog>
```

Put the dialog near the end of `<body>` when practical.

Do not add `tabindex` to the dialog element.

## Data attributes

| Attribute | Element | Owner | Purpose |
| --- | --- | --- | --- |
| `data-dialog-trigger="id"` | trigger | Author | Opens the matching dialog. |
| `data-dialog-close` | control inside dialog | Author | Closes the containing dialog. |
| `data-init` | trigger and dialog | Module | Prevents duplicate initialization. |

Do not author `data-init`.

## Focus

Use `autofocus` on the control that should receive initial focus.

Let the browser select the initial focus target when no `autofocus` target is present.

The module does not force focus onto the dialog surface.

The module restores focus to the opening trigger after close.

The module keeps Tab movement inside the open dialog.

## Behavior

Footer actions wrap onto another line when the available width cannot fit the actions.

Activating a documented trigger calls `showModal()`.

Clicking a documented close control closes the dialog.

Clicking the backdrop closes the dialog.

Escape uses native dialog dismissal.

Closing the dialog restores focus to the opening trigger when it still exists.

Control state feedback uses the fast motion primitives. Opening and closing use the spatial motion duration.

## Accessibility

Keep an explicit close or cancel action available.

Keep the dialog title concise.

Keep destructive confirmation in Alert Dialog instead of Dialog.

Do not use a modal when inline editing is simpler.

Do not add a second focus-trap library.

## Runtime

Load `dialog.js` whenever the documented trigger behavior appears.

The dialog content remains semantic without the module.

The external trigger does not open the dialog without the module.
