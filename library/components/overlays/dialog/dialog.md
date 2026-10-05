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

Use one direct `.dialog-content` child.

Use a `<div>` for reading content or a `<form>` for a submission task.

Put `.dialog-header`, `.dialog-body`, and `.dialog-footer` directly inside `.dialog-content` in that order.

Keep `method`, `action`, named controls, and native constraints on the form.

The following example uses a local GET review fixture instead of a settings-write endpoint.

Replace `/connection-review` and `method` with the application's submission contract before saving settings.

Load the foundation styles and the Dialog, Button, Text Field, and Form styles for this composition.

Resolve exact assets from the selected registry records in a source checkout or the matching manifest metadata in a core archive.

```html
<button class="btn"
        type="button"
        data-variant="primary"
        data-dialog-trigger="connection-settings"
        aria-haspopup="dialog">
  Review connection settings
</button>

<dialog class="dialog"
        id="connection-settings"
        data-scroll="body"
        aria-labelledby="connection-settings-title"
        aria-describedby="connection-settings-description">
  <form class="dialog-content" method="get" action="/connection-review">
    <div class="dialog-header">
      <h2 class="dialog-title" id="connection-settings-title">Connection settings</h2>
      <p class="dialog-description" id="connection-settings-description">Review the settings for new jobs.</p>
    </div>

    <div class="dialog-body">
      <div class="form-group">
        <div class="text-field">
          <label for="connection-endpoint">Service endpoint</label>
          <input class="text-field-input" id="connection-endpoint" name="endpoint"
                 type="url" value="https://jobs.example.test" required autofocus>
        </div>
        <p>New jobs use this endpoint after the application accepts the settings. Running jobs keep their original connection.</p>
        <div class="text-field">
          <label for="connection-workspace">Workspace</label>
          <input class="text-field-input" id="connection-workspace" name="workspace"
                 type="text" value="production" required>
        </div>
        <p>Confirm the workspace owns the queues, retry policy, and result retention required by these jobs.</p>
        <div class="text-field">
          <label for="connection-owner">Result owner email</label>
          <input class="text-field-input" id="connection-owner" name="owner"
                 type="email" value="jobs@example.test" required>
        </div>
        <p>Failure notices go to this address. Review access and notification settings before saving the connection.</p>
      </div>
    </div>

    <div class="dialog-footer">
      <button class="btn" type="button" data-variant="secondary" data-dialog-close>Cancel</button>
      <button class="btn" type="submit" data-variant="primary">Save settings</button>
    </div>
  </form>
</dialog>
```

Put the dialog near the end of `<body>` when practical.

Do not add `tabindex` to the dialog element.

## Scroll presentation

Omit `data-scroll` for the default whole-dialog native overflow.

Use `data-scroll="body"` when reviewing a long connection settings form while Cancel and Save remain in view.

Use the same presentation when inspecting a multi-paragraph job result before a Return action.

This attribute changes presentation only.

The body presentation bounds the dialog to the available dynamic viewport with the existing 32px total gutter.

The bound includes the outer border, including the 2px increased-contrast border.

The fixed containing-block bound also keeps the surface within the viewport under CSS zoom.

The content keeps 24px padding and uses a three-row grid with 16px gaps instead of the default section margins.

Only `.dialog-body` scrolls while the header, footer, and minimum body row fit the available height.

The body has 2px internal focus clearance.

Forced colors uses 3px clearance for the system outline and its offset.

The header and footer stay in normal flow without sticky positioning, shadows, or custom scrollbars.

Footer labels wrap without reducing the 36px minimum button target.

If enlarged text or a very short viewport cannot fit the header, footer, padding, gaps, and minimum body row, the body retains a 72px minimum row and the native dialog can also scroll.

This recovery row fits a normal single-line label, its gap, a 36px control, and 2px focus clearance on each side.

The 72px minimum defines a useful body viewport, not a control size.

The footer extends the existing 24px bottom clearance into the native overflow area.

A matching negative end margin prevents double padding.

The body and native outer scrollports reserve 24px at each block edge so keyboard focus remains clear when either region needs to scroll.

Do not depend on a permanently visible footer in that recovery state.

Use the default whole-dialog overflow or an inline form when the remaining body height is too small for the task.

## Data attributes

| Attribute | Element | Owner | Purpose |
| --- | --- | --- | --- |
| `data-dialog-trigger="id"` | trigger | Author | Opens the matching dialog. |
| `data-dialog-close` | control inside dialog | Author | Closes the containing dialog. |
| `data-scroll="body"` | `dialog.dialog` | Author | Scrolls the bounded body while the header and footer remain in flow. |
| `data-init` | trigger and dialog | Module | Legacy readiness marker; do not author. |

Do not author `data-init`.

## Focus

Use `autofocus` on the control that should receive initial focus.

For long reading content, use `autofocus` and `tabindex="-1"` on the title inside `.dialog-header` when the title is the useful initial focus target.

Let the browser select the initial focus target when no `autofocus` target is present.

The module does not force focus onto the dialog surface.

The module restores focus to the opening trigger after close.

The module keeps Tab movement inside the open dialog.

For a long reading body without focusable controls, add `tabindex="0"` when keyboard scrolling needs a reachable wrapper.

Give that wrapper `role="region"` and `aria-labelledby` that references a concise visible heading for the reading content.

The body presentation supplies a visible inset focus perimeter for the wrapper.

Do not add a redundant body tab stop when the form controls provide a usable keyboard path.

## Behavior

Footer actions wrap onto another line when the available width cannot fit the actions.

Activating a documented trigger calls `showModal()`.

Clicking a documented close control closes the dialog.

Clicking the backdrop closes the dialog.

Escape uses native dialog dismissal.

Keep Cancel as `type="button"` when it uses `data-dialog-close` inside a form.

Keep Save as `type="submit"` without `data-dialog-close` so native validation runs before submission.

The browser owns form submission, validation, reset, and implicit Enter submission.

Closing the dialog restores focus to the opening trigger when it still exists.

Control state feedback uses the fast motion primitives. Opening and closing use the spatial motion duration.

## Accessibility

Keep an explicit close or cancel action available.

Keep the dialog title concise.

Keep multi-paragraph reading content out of the dialog's `aria-describedby` value.

Keep destructive confirmation in Alert Dialog instead of Dialog.

Do not use a modal when inline editing is simpler.

Do not add a second focus-trap library.

## Runtime

Load `dialog.js` whenever the documented trigger behavior appears.

The closed dialog remains hidden without the module.

The external trigger does not open the dialog without the module.

Use an inline section or form for the no-JavaScript fallback.

Replace the external trigger and scripted close control with native navigation or form actions in that fallback.

The visible native form retains submission and validation without JavaScript.

Do not add a scroll controller or a second focus trap for `data-scroll="body"`.
