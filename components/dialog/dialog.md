# Pattern: Dialog

## Native basis
`<dialog>` element + `showModal()`. The browser provides:
- Modal top-layer placement and inert background content
- Escape key to close (automatically)
- `::backdrop` for overlay
- `aria-modal` behavior when opened with `showModal()`

Requires minimal JavaScript for trigger wiring, keyboard focus wrapping, focus restoration, and backdrop-click-to-close.

---

## Native Web APIs
- [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) — native modal element with top-layer placement, inert background content, and Escape-to-close
- [`HTMLDialogElement.showModal()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal) — opens dialog as modal in the top layer with backdrop
- [`::backdrop`](https://developer.mozilla.org/en-US/docs/Web/CSS/::backdrop) — pseudo-element for the overlay behind the modal

---

## Structure

```html
<!-- Trigger -->
<button class="btn" data-variant="default"
        data-dialog-trigger="my-dialog"
        aria-haspopup="dialog">
  Open
</button>

<!-- Dialog -->
<dialog id="my-dialog"
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-dialog-title">

  <div class="dialog-content">
    <div class="dialog-header">
      <h2 class="dialog-title" id="my-dialog-title">Dialog Title</h2>
      <p class="dialog-description">Supporting description.</p>
    </div>

    <div class="dialog-body">
      <!-- Content goes here -->
    </div>

    <div class="dialog-footer">
      <button class="btn" data-variant="outline" data-dialog-close>
        Cancel
      </button>
      <button class="btn" data-variant="default">
        Confirm
      </button>
    </div>
  </div>
</dialog>
```

---

---

## ARIA

| Attribute            | Element     | Value                |
|----------------------|-------------|----------------------|
| `role="dialog"`      | `<dialog>`  | Identifies as dialog |
| `aria-modal="true"`  | `<dialog>`  | Content behind is inert |
| `aria-labelledby`    | `<dialog>`  | Points to title `id` |
| `aria-haspopup="dialog"` | trigger | Indicates dialog will open |

---

## Wiring conventions

- `data-dialog-trigger="[id]"` on any element → opens that dialog
- `data-dialog-close` on any element inside → closes the dialog
- Click on backdrop → closes (click lands on `<dialog>` itself)
- Tab and Shift+Tab wrap between the dialog's first and last enabled controls
- Place `<dialog>` elements as direct children of `<body>`

---

## Notes

- Dialog state changes are immediate for now, with no CSS transition.
- The selector is `dialog.dialog` (element + class) to avoid styling native `<dialog>` elements used elsewhere.
- For forms inside dialogs, use the `dialog-body` wrapper for the form content.
- The modal surface uses the mostly opaque semantic glass role with a small backdrop blur. The native backdrop uses the stronger layered scrim.
