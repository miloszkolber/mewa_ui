# Field

## Native basis

`Field` is a semantic composition around a native form control. Use a plain `<div class="field">` for one labelled control and a native `<fieldset class="fieldset">` with a `<legend>` for related controls. Reserve a labelled `role="group"` for a structural group that cannot use a fieldset. The browser remains responsible for focus, validation, submission, and reset.

## Native web APIs

- [`<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label) — associates the visible label with a control
- [`<fieldset>` and `<legend>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset) — names a group of related controls
- [`aria-describedby`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-describedby) — associates help and error text
- [`aria-invalid`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-invalid) — exposes a known validation error
- [`:user-invalid`](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid) — styles native validation after user interaction

## Structure

### One field

```html
<div class="field">
  <label for="account-email">
    Email <span class="field-required" aria-hidden="true">*</span>
  </label>
  <input class="text-field-input" id="account-email" name="email" type="email"
         autocomplete="email" required
         aria-describedby="account-email-description">
  <p class="field-description" id="account-email-description">
    We will use this address for account notices.
  </p>
</div>
```

The `for` and `id` pair is the label association. `required` is the source of truth for required validation. The visible asterisk is supplementary and hidden from assistive technology.

### Invalid field

```html
<div class="field" data-invalid>
  <label for="account-handle">Username</label>
  <input class="text-field-input" id="account-handle" name="username" type="text"
         aria-invalid="true"
         aria-describedby="account-handle-description account-handle-error"
         aria-errormessage="account-handle-error" value="taken-name">
  <p class="field-description" id="account-handle-description">
    Choose a public name for your profile.
  </p>
  <p class="field-error" id="account-handle-error" role="alert">
    This username is already in use.
  </p>
</div>
```

Put `aria-invalid="true"` on the control, not only on the wrapper. Use `data-invalid` when a server or application check already knows the field is invalid before native validation has run.

### Disabled field

```html
<div class="field" data-disabled>
  <label for="account-plan">Plan</label>
  <select class="select" id="account-plan" name="plan" disabled>
    <option>Free</option>
  </select>
  <p class="field-description" id="account-plan-description">
    Your administrator controls this setting.
  </p>
</div>
```

Prefer the native `disabled` attribute. `data-disabled` is only a styling hook for a wrapper or a non-form state. A disabled control is omitted from form submission by the browser.

### Related controls

```html
<fieldset class="fieldset">
  <legend>Notification preferences</legend>
  <p class="field-description" id="notifications-description">
    Choose how we contact you.
  </p>
  <div>
    <div class="field" data-orientation="horizontal">
      <input id="notify-email" type="checkbox" name="email-updates">
      <label for="notify-email">Email updates</label>
    </div>
    <div class="field" data-orientation="horizontal">
      <input id="notify-sms" type="checkbox" name="sms-updates">
      <label for="notify-sms">Text-message updates</label>
    </div>
  </div>
</fieldset>
```

Use `<fieldset>` and `<legend>` when the group has a shared name. A labelled `role="group"` is suitable only for a structural group that cannot use a fieldset.

## Data attributes

| Attribute | Element | Purpose |
| --- | --- | --- |
| `data-invalid` | `.field` | Marks a known application or server error and colors supporting text |
| `data-disabled` | `.field` | Styles a wrapper when a native `disabled` state cannot be used |
| `data-orientation="horizontal"` | `.field` | Places an inline control and its label on one row |

These attributes do not replace `required`, `disabled`, or `aria-invalid` on the native control.

## Accessibility

- Give every control a visible `<label>` or a deliberately visually hidden label, and pair it with `for`/`id`.
- Join description and error IDs in `aria-describedby`. Keep `aria-errormessage` on a control only when `aria-invalid="true"` is present.
- Use `role="alert"` for an error that is inserted after validation. Do not use a role to replace the native label.
- Use a native `<fieldset>` and `<legend>` for related controls. Do not add a fieldset role to a single text input.
- Do not add an unnamed `role="group"` around a single labelled control. Reserve `role="group"` for a genuinely grouped composition and give it an accessible name.
- The stylesheet preserves `:focus-visible`, `prefers-contrast: more`, and forced-colors focus and disabled states.

## Keyboard and events

Field adds no keyboard handlers and emits no custom events. Labels use native click-to-focus behavior. Tab order, control-specific keys, constraint validation, `input`, `change`, `invalid`, `submit`, and `reset` events all come from the rendered native elements.

## Limitations

Field intentionally does not generate IDs or rewrite `aria-describedby` at runtime. Keep the associations explicit in markup so the no-JavaScript version is complete. The browser or the composed control owns its popup and keyboard details.
