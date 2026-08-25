# Sheet

## Purpose

Sheet presents a focused modal task aligned to one viewport edge.

Use Sheet when edge alignment helps preserve the user's spatial context or supports a narrow secondary task.

Use Dialog for a centered neutral modal task.

Do not use Sheet only to imitate a sliding-panel aesthetic.

Do not use Sheet for persistent application navigation.

## Native basis

Sheet uses a native `<dialog>` opened with `showModal()`.

`data-side` selects the right, left, or bottom edge.

The module wires documented open and close controls.

The component does not animate between states.

## Native Web APIs

- [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) provides modal top-layer behavior, inert background content, and Escape dismissal.
- [`showModal()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal) opens the sheet as a modal.
- [`::backdrop`](https://developer.mozilla.org/en-US/docs/Web/CSS/::backdrop) provides the modal backdrop.

## Structure

```html
<button class="btn"
        type="button"
        data-variant="outline"
        data-sheet-trigger="settings-sheet"
        aria-haspopup="dialog">
  Open settings
</button>

<dialog id="settings-sheet"
        class="sheet"
        data-side="right"
        aria-labelledby="settings-sheet-title">
  <div class="sheet-content">
    <div class="sheet-header">
      <h2 class="sheet-title" id="settings-sheet-title">Settings</h2>
      <p class="sheet-description">Configure this workspace.</p>
    </div>

    <div class="sheet-body">
      <!-- Focused task content. -->
    </div>

    <div class="sheet-footer">
      <button class="btn"
              type="button"
              data-variant="outline"
              data-sheet-close>
        Cancel
      </button>
      <button class="btn" type="button" data-variant="default">
        Save changes
      </button>
    </div>
  </div>

  <button class="sheet-close-x"
          type="button"
          data-sheet-close
          aria-label="Close settings">
    <i data-lucide="x" aria-hidden="true"></i>
  </button>
</dialog>
```

Give every sheet an accessible name through `aria-labelledby` or `aria-label`.

Keep the title visible when it helps task orientation.

## Sides

Omit `data-side` or use `data-side="right"` for the default right edge.

Use `data-side="left"` when the task is spatially related to left-side content.

Use `data-side="bottom"` for a short task that benefits from full inline width.

Do not create a top variant.

Do not use side selection only for decoration.

## Wiring

Set `data-sheet-trigger` to the target dialog ID.

Put `data-sheet-close` on explicit close or cancel controls inside the sheet.

Place modal dialogs near the end of `<body>` when practical.

Keep application form submission separate from the generic close control.

## Behavior

Activating a documented trigger opens the native dialog with `showModal()`.

Escape closes the sheet through native dialog behavior.

Activating a `data-sheet-close` control closes the sheet.

Backdrop activation closes the sheet when the implementation receives the click on the dialog surface.

Closing restores focus according to the component module behavior.

State changes are immediate.

The sheet does not slide, fade, or transition.

## Action hierarchy

Use one filled primary action when the sheet has a clear commit action.

Use Outline for cancel or secondary actions.

Use a destructive filled action only for a final destructive confirmation.

Use Alert Dialog instead when the user must explicitly confirm a high-impact irreversible action.

## Accessibility

Use the native dialog element.

Do not add a redundant `role="dialog"` to `<dialog>`.

Give icon-only close actions a specific accessible name.

Hide decorative icons from assistive technology.

Keep all required task controls reachable by keyboard.

Keep focus visible inside the sheet.

Do not place essential page content inside a sheet when it should remain visible in normal flow.

## Runtime

Load `sheet.js` whenever Sheet appears.

The documented trigger and close wiring requires the module.

Native Escape behavior remains owned by the browser after the dialog is open.
