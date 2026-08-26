# Alert Dialog

## Purpose

Alert Dialog interrupts the workflow for a brief important message that requires a response.

Use Alert Dialog for an irreversible or high-impact confirmation.

Use Dialog for a neutral modal task.

Do not use Alert Dialog for ordinary status feedback.

## Native basis

Use a native modal `<dialog>` with `role="alertdialog"`.

Use `aria-modal="true"` with the alertdialog role.

The browser supplies modal top-layer behavior and Escape dismissal.

The module wires external triggers, explicit action controls, and focus restoration.

## Native Web APIs

- [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) supplies native modal behavior.
- [`showModal()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal) opens the modal in the top layer.
- [`role="alertdialog"`](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/) identifies the interrupting response pattern.
- [`autofocus`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autofocus) selects the initial safe action.

## Structure

Keep the message brief.

Put the least destructive action first.

Use `autofocus` on the least destructive action when accidental confirmation would be costly.

```html
<button class="btn"
        type="button"
        data-variant="outline"
        data-alert-dialog-trigger="delete-account"
        aria-haspopup="dialog">
  Delete account
</button>

<dialog class="alert-dialog"
        id="delete-account"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description">
  <div class="alert-dialog-content">
    <div class="alert-dialog-header">
      <h2 class="alert-dialog-title" id="delete-account-title">Delete account?</h2>
      <p class="alert-dialog-description" id="delete-account-description">This action permanently deletes the account.</p>
    </div>

    <div class="alert-dialog-footer">
      <button class="btn"
              type="button"
              data-variant="outline"
              data-alert-dialog-close
              autofocus>
        Cancel
      </button>
      <button class="btn"
              type="button"
              data-variant="destructive"
              data-alert-dialog-close>
        Delete account
      </button>
    </div>
  </div>
</dialog>
```

## Behavior

Activating the trigger opens the native modal dialog.

Escape closes the dialog through native behavior.

Activating a documented response control closes the dialog.

Backdrop activation does not close Alert Dialog.

Closing the dialog restores focus to the opening trigger when it still exists.

State changes are immediate.

## Accessibility

Give Alert Dialog an accessible name with `aria-labelledby`.

Use `aria-describedby` when the message is short and simple.

Focus the least destructive action for an irreversible confirmation.

Keep every response action explicit.

Keep a cancellation path available.

Do not force users to confirm a destructive action to escape the dialog.

Do not use Alert Dialog when an undo action provides a simpler recovery path.

## Runtime

Load `alert-dialog.js` whenever an external trigger opens Alert Dialog.

The dialog content remains semantic without the module.

The external trigger does not open the dialog without the module.
