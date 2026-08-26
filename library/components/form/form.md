# Form

## Purpose

Form composes one complete native submission task from labelled mewa_ui controls.

Use Form when several fields submit or reset together.

Use Field without Form when no submission exists.

Do not use Form only as a visual container.

## Native basis

Form uses the native `<form>` element.

The browser owns submission, reset, constraint validation, autocomplete, and form-associated control behavior.

Form composes Field and the selected input components.

## Native Web APIs

- [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) provides native submission and reset.
- [`<fieldset>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset) groups related controls.
- [Constraint Validation API](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation) provides native field constraints.
- [`:user-valid`](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-valid) and [`:user-invalid`](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid) expose post-interaction validation state.
- [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) serializes successful controls when application code needs it.

## Structure

```html
<form class="form" method="post" action="/profile">
  <div class="form-field">
    <label class="label" for="profile-name">Name</label>
    <input class="text-field-input"
           id="profile-name"
           name="name"
           type="text"
           autocomplete="name"
           required>
  </div>

  <div class="form-field">
    <label class="label" for="profile-email">Email</label>
    <input class="text-field-input"
           id="profile-email"
           name="email"
           type="email"
           autocomplete="email"
           required>
  </div>

  <div class="form-actions">
    <button class="btn" type="submit" data-variant="default">Save changes</button>
    <button class="btn" type="reset" data-variant="outline">Reset</button>
  </div>
</form>
```

Give every successful form control a `name`.

Use a meaningful `action` and `method` when the browser owns submission.

Do not omit `name` from a value that must submit.

## Related controls

Use a native fieldset and legend for a group that answers one question.

```html
<fieldset class="form-fieldset">
  <legend>Notifications</legend>
  <p class="field-description" id="notification-description">
    Choose the channels that can receive updates.
  </p>

  <div class="form-group">
    <div class="form-field-inline">
      <input class="checkbox"
             id="notify-email"
             name="notification"
             type="checkbox"
             value="email"
             aria-describedby="notification-description">
      <label for="notify-email">Email</label>
    </div>
    <div class="form-field-inline">
      <input class="checkbox"
             id="notify-push"
             name="notification"
             type="checkbox"
             value="push"
             aria-describedby="notification-description">
      <label for="notify-push">Push</label>
    </div>
  </div>
</fieldset>
```

Do not add a generic group role when fieldset semantics fit.

## Switch row

Use `.form-field-row` for one immediate setting with supporting text.

Keep the row flat and border-led.

Do not treat the row as a nested card.

```html
<div class="form-field-row">
  <div>
    <label class="label" for="auto-refresh">Automatic refresh</label>
    <p class="field-description">Refresh data when the source changes.</p>
  </div>
  <input class="switch"
         id="auto-refresh"
         name="auto_refresh"
         type="checkbox"
         role="switch">
</div>
```

Use Switch only when changing the control has immediate meaning.

Use Checkbox when the value is only submitted later.

## Invalid field

Keep invalid state on the native control.

Use wrapper state only for presentation.

```html
<div class="form-field" data-invalid>
  <label class="label" for="account-email">Email</label>
  <input class="text-field-input"
         id="account-email"
         name="email"
         type="email"
         aria-invalid="true"
         aria-describedby="account-email-error"
         aria-errormessage="account-email-error">
  <p class="field-error" id="account-email-error" role="alert">
    Enter a valid email address.
  </p>
</div>
```

Keep the entered value after validation fails.

Use `role="alert"` only when the error appears dynamically.

## Data attributes

| Attribute | Purpose |
| --- | --- |
| `data-orientation="horizontal"` | Places a label beside its control. |
| `data-invalid` | Styles a field with a known invalid state. |
| `data-disabled` | Styles a row whose native control is disabled. |

Native attributes remain the source of truth.

Do not use `data-invalid` instead of `aria-invalid` on the affected control.

## Behavior

Submit buttons use native form submission.

Reset buttons use native reset behavior.

Native constraints run without a component module.

Application JavaScript can listen to native form events when the product needs custom submission.

Form itself adds no JavaScript behavior.

## Accessibility

Give every control a visible label.

Use explicit labels and stable IDs.

Use fieldsets for related controls.

Reference descriptions and errors from the affected controls.

Keep action order consistent with the task.

Keep one visually strongest submit action in the local action group.

Do not disable submit only to hide incomplete validation requirements.

## Runtime

Form requires no component module.

The complete native submission and validation path works without JavaScript.

Load modules only for the individual controls that require them.
