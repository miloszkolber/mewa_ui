# Text Field

## Purpose

Text Field collects one line of free text with an explicit label and optional help or error text.

Use Text Field for text, email, password, search, telephone, URL, and similar native input types.

Use Textarea for multi-line text.

Use Select or Combobox for finite option selection.

Do not use placeholder text as the only field label.

## Native basis

Text Field uses one native `<input>` with one real `<label>`.

The browser owns editing, autocomplete, mobile input behavior, validation, and form submission.

The component adds no JavaScript behavior.

## Native Web APIs

- [`<input>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input) provides editing and type-specific behavior.
- [`<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label) provides the native accessible name association.
- [`autocomplete`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete) provides browser-managed autofill.
- [`inputmode`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode) can hint the mobile keyboard when the input type alone is insufficient.
- [`enterkeyhint`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/enterkeyhint) can label the mobile enter key.
- [`:user-invalid`](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid) exposes native invalid state after interaction.

## Structure

```html
<div class="text-field">
  <label class="text-field-label" for="profile-email">Email</label>
  <input class="text-field-input"
         id="profile-email"
         name="email"
         type="email"
         autocomplete="email"
         aria-describedby="profile-email-description">
  <p class="text-field-description" id="profile-email-description">
    Use the address that receives account notices.
  </p>
</div>
```

Keep the native input as the submitted and focusable control.

Give the input a `name` when its value belongs to a form submission.

Choose the native input type that matches the value.

## Required and invalid

Use native `required` when the field is required.

Use `aria-invalid="true"` when the application or server already knows the value is invalid.

Use `data-invalid` only as the documented wrapper styling hook.

```html
<div class="text-field" data-invalid>
  <label class="text-field-label" for="profile-name">
    Full name
    <span class="text-field-required" aria-hidden="true">*</span>
  </label>
  <input class="text-field-input"
         id="profile-name"
         name="name"
         type="text"
         required
         aria-invalid="true"
         aria-describedby="profile-name-error"
         aria-errormessage="profile-name-error">
  <p class="text-field-error" id="profile-name-error" role="alert">
    Enter your full name.
  </p>
</div>
```

Keep `aria-errormessage` only while the referenced error is active.

Use `role="alert"` only when the error appears dynamically.

Do not remove the entered value after validation fails.

## Disabled and readonly

Use `readonly` when users may still select and copy the value.

Use `disabled` when the control is unavailable and should not submit.

Use `data-disabled` only when the wrapper also needs disabled presentation.

```html
<div class="text-field">
  <label class="text-field-label" for="api-key">API key</label>
  <input class="text-field-input"
         id="api-key"
         name="api_key"
         type="text"
         value="sk-example"
         readonly>
</div>
```

## Hidden label

Use `data-hidden` on the label only when the visual context makes the field purpose clear without repeated visible text.

```html
<div class="text-field">
  <label class="text-field-label" data-hidden for="site-search">Search</label>
  <input class="text-field-input"
         id="site-search"
         name="q"
         type="search"
         placeholder="Search">
</div>
```

Do not remove the label and rely on placeholder text.

## Search with action

Compose a normal form when a search field has a submit action.

```html
<form class="form" role="search" aria-label="Search jobs">
  <div class="text-field">
    <label class="text-field-label" data-hidden for="job-search">Search jobs</label>
    <input class="text-field-input"
           id="job-search"
           name="q"
           type="search"
           enterkeyhint="search">
  </div>
  <div class="form-actions">
    <button class="btn" type="submit" data-variant="default">Search</button>
  </div>
</form>
```

Do not add an inline layout style to the field to create a one-off composition.

Use Layout or consumer CSS when a repeated horizontal search composition is required.

## Icons

Compose an icon only when it adds meaning or recognition.

Use a documented component or consumer composition for icon placement.

Do not position icons with inline styles in canonical Text Field markup.

Hide decorative icons from assistive technology.

Do not put the accessible name on a decorative icon instead of the field label.

## Data attributes

| Attribute | Purpose |
| --- | --- |
| `data-invalid` | Styles a Text Field with a known invalid state. |
| `data-disabled` | Styles a wrapper whose native input is disabled. |
| `data-hidden` | Visually hides the label while preserving its accessible name. |

Native control attributes remain the source of truth.

Do not invent additional Text Field state hooks.

## Behavior

Text Field adds no keyboard handlers.

Text Field emits no custom events.

Tab moves to the native input.

The input type controls browser editing and mobile keyboard behavior.

Native `input`, `change`, `invalid`, focus, composition, submit, and reset behavior remains available.

## Accessibility

Pair every label `for` value with the input `id`.

Reference help and error text explicitly.

Keep all referenced IDs unique.

Use the correct native `type` and `autocomplete` value.

Keep `required`, `disabled`, and `readonly` on the native input.

Keep visible focus on the input.

Do not use `aria-label` when a visible or deliberately hidden label already provides the name.

## Runtime

Text Field requires no component module.

The complete labelled input and native validation path work without JavaScript.
