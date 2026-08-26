# Field

## Purpose

Field composes one labelled control or one related control group with help and error text.

Use Field as the default semantic wrapper around form controls.

Use a native fieldset when several controls share one question or group label.

Do not add an unnamed group role around one control.

## Native basis

Use `<div class="field">` for one labelled control.

Use `<fieldset class="fieldset">` with `<legend>` for related controls.

The browser remains responsible for focus, validation, submission, and reset.

## Native Web APIs

- [`<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label) associates visible text with a control.
- [`<fieldset>` and `<legend>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset) name related controls.
- [`aria-describedby`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-describedby) references supporting text.
- [`aria-invalid`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-invalid) exposes a known invalid value.
- [`aria-errormessage`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-errormessage) references an active error.
- [`:user-invalid`](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid) exposes native validation after user interaction.

## One field

```html
<div class="field">
  <label for="account-email">
    Email
    <span class="field-required" aria-hidden="true">*</span>
  </label>
  <input class="text-field-input"
         id="account-email"
         name="email"
         type="email"
         autocomplete="email"
         required
         aria-describedby="account-email-description">
  <p class="field-description" id="account-email-description">
    Use the address that receives account notices.
  </p>
</div>
```

The `for` and `id` pair defines the label association.

The native `required` attribute defines required state.

The visible asterisk is supplementary.

Do not use an asterisk as the only required-state signal.

## Invalid field

```html
<div class="field" data-invalid>
  <label for="account-handle">Username</label>
  <input class="text-field-input"
         id="account-handle"
         name="username"
         type="text"
         value="taken-name"
         aria-invalid="true"
         aria-describedby="account-handle-description account-handle-error"
         aria-errormessage="account-handle-error">
  <p class="field-description" id="account-handle-description">
    Choose a public account name.
  </p>
  <p class="field-error" id="account-handle-error" role="alert">
    This username is already in use.
  </p>
</div>
```

Put `aria-invalid="true"` on the invalid control.

Use `data-invalid` only as the documented wrapper styling hook.

Keep `aria-errormessage` only while the referenced error is active.

Use `role="alert"` when the error appears after interaction and needs announcement.

Do not add an alert role to static help text.

## Disabled field

```html
<div class="field" data-disabled>
  <label for="account-plan">Plan</label>
  <select class="select"
          id="account-plan"
          name="plan"
          disabled
          aria-describedby="account-plan-description">
    <option>Free</option>
  </select>
  <p class="field-description" id="account-plan-description">
    Your administrator controls this setting.
  </p>
</div>
```

Prefer the native `disabled` attribute.

Use `data-disabled` only when the wrapper also needs disabled presentation.

Remember that a disabled native control does not submit a form value.

## Related controls

```html
<fieldset class="fieldset">
  <legend>Notification preferences</legend>
  <p class="field-description" id="notification-help">
    Choose each channel that can receive updates.
  </p>

  <div class="field" data-orientation="horizontal">
    <input id="notify-email"
           type="checkbox"
           name="notification"
           value="email"
           aria-describedby="notification-help">
    <label for="notify-email">Email</label>
  </div>

  <div class="field" data-orientation="horizontal">
    <input id="notify-sms"
           type="checkbox"
           name="notification"
           value="sms"
           aria-describedby="notification-help">
    <label for="notify-sms">Text message</label>
  </div>
</fieldset>
```

Use a fieldset when the controls answer one shared question.

Use a labelled `role="group"` only when a fieldset cannot represent the structure.

## Data attributes

| Attribute | Purpose |
| --- | --- |
| `data-invalid` | Styles a field with a known application or server error. |
| `data-disabled` | Styles a wrapper that contains a disabled control. |
| `data-orientation="horizontal"` | Places a compact control and label on one row. |

These attributes do not replace native control state.

Do not author additional Field state hooks without updating the contract.

## Behavior

Field adds no keyboard handlers.

Field emits no custom events.

The control owns its native input and change events.

The form owns native submit and reset behavior.

The label owns native click-to-focus behavior.

## Accessibility

Give every control a visible label unless a deliberately hidden label is necessary.

Keep labels associated through `for` and `id`.

Reference help and active errors explicitly.

Keep all referenced IDs unique.

Use fieldsets for related controls.

Do not add redundant ARIA roles to native form structures.

Keep the component-specific control keyboard model in the selected control skill.

## Runtime

Field requires no component module.

The complete composition works without JavaScript.
