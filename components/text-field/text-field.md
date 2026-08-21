# Text Field

## Native basis

`Text Field` is an explicit composition of one real `<label>`, one real `<input>`, and optional description and error text. It follows the Kernel naming model while keeping the HTML visible and useful without a runtime component. Use the semantic `type` that matches the value, such as `email`, `password`, `search`, `tel`, or `url`.

## Native web APIs

- [`<input>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input) — editing, autofill, input modes, and constraint validation
- [`<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label) — native label-to-control association
- [`autocomplete`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete) — browser-managed autofill
- [`:user-invalid`](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid) — post-interaction validation styling

## Structure

### Default

```html
<div class="text-field">
  <label class="text-field-label" for="profile-email">Email</label>
  <input class="text-field-input" id="profile-email" name="email" type="email"
         autocomplete="email" placeholder="you@example.com"
         aria-describedby="profile-email-description">
  <p class="text-field-description" id="profile-email-description">
    We will never share your email address.
  </p>
</div>
```

The input is not a proxy or button. It remains the submitted, focusable form control. Keep `aria-describedby` explicit so the composition works before JavaScript loads.

### Required and invalid

```html
<div class="text-field" data-invalid>
  <label class="text-field-label" for="profile-name">
    Full name <span class="text-field-required" aria-hidden="true">*</span>
  </label>
  <input class="text-field-input" id="profile-name" name="name" type="text"
         required aria-invalid="true"
         aria-describedby="profile-name-error"
         aria-errormessage="profile-name-error" value="">
  <p class="text-field-error" id="profile-name-error" role="alert">
    Enter your full name.
  </p>
</div>
```

Use `required` for native required validation and `aria-invalid="true"` for an error already known by the application. `data-invalid` styles the whole composition and is not a replacement for the ARIA state on the input.

### Sizes

```html
<div class="text-field" data-size="sm">
  <label class="text-field-label" for="small-search">Search</label>
  <input class="text-field-input" id="small-search" type="search" placeholder="Search">
</div>
<div class="text-field" data-size="lg">
  <label class="text-field-label" for="large-search">Search</label>
  <input class="text-field-input" id="large-search" type="search" placeholder="Search">
</div>
```

`data-size` accepts `sm`, `md` (the default), and `lg`. It changes the native input's geometry and type scale without changing keyboard behavior.

### Disabled and readonly

```html
<div class="text-field">
  <label class="text-field-label" for="readonly-key">API key</label>
  <input class="text-field-input" id="readonly-key" type="text"
         value="sk-example" readonly
         aria-describedby="readonly-key-description">
  <p class="text-field-description" id="readonly-key-description">
    You can select and copy this value.
  </p>
</div>
<div class="text-field" data-disabled>
  <label class="text-field-label" for="disabled-email">Email</label>
  <input class="text-field-input" id="disabled-email" type="email" disabled>
</div>
```

Use the native `readonly` or `disabled` attribute. `data-disabled` is an optional wrapper styling hook and does not disable an input by itself.

### Hidden label

```html
<div class="text-field">
  <label class="text-field-label" data-hidden for="site-search">Search</label>
  <input class="text-field-input" id="site-search" type="search" placeholder="Search">
</div>
```

`data-hidden` visually clips the label while leaving its accessible name in the accessibility tree. Do not remove the label and rely only on placeholder text.

## Data attributes

| Attribute | Element | Values | Purpose |
| --- | --- | --- | --- |
| `data-size` | `.text-field` | `sm`, `md`, `lg` | Selects the control size |
| `data-invalid` | `.text-field` | presence | Marks a known application or server error |
| `data-disabled` | `.text-field` | presence | Styles a wrapper when a native disabled state is also applied |
| `data-hidden` | `.text-field-label` | presence | Visually hides, but does not remove, the label |

## Accessibility

- Pair the `<label>` `for` with the input `id`. Clicking the label focuses the input through native behavior.
- Point `aria-describedby` to every description or error ID. Set `aria-errormessage` only when `aria-invalid="true"` is present.
- Use `role="alert"` on an error that is inserted after validation. Do not use placeholder text as the accessible name.
- Keep `required`, `disabled`, `readonly`, `autocomplete`, and `type` on the native input.
- The stylesheet provides `:focus-visible`, `:user-invalid`, `prefers-contrast: more`, and forced-colors states without motion.

## Keyboard and events

Text Field adds no keyboard handlers and emits no custom events. Tab moves to the native input, and the input's type determines its browser and mobile keyboard behavior. Native `focus`, `blur`, `input`, `change`, `invalid`, `compositionstart`, and `compositionend` events are available on the input. Form `submit` and `reset` remain native.

## Limitations

This scaffold does not create IDs, auto-wire descriptions, implement floating labels, or replace the browser's editing and validation behavior. Floating labels, async validation, masking, and clear buttons belong to an embedding application. A no-JavaScript page still has a complete labelled `<input>` and native constraint validation.

## Standalone controls

Use `.text-field-input` for standalone native inputs and textareas. Use `.text-field` when a label, description, or error message belongs with the control.

### Basic

```html
<label class="label" for="email">Email</label>
<input class="text-field-input" type="email" id="email" placeholder="you@example.com">
```

### With description

```html
<div class="text-field">
  <label class="text-field-label" for="username">Username</label>
  <input class="text-field-input" type="text" id="username" placeholder="codylindley"
         aria-describedby="username-description">
  <p class="text-field-description" id="username-description">
    Choose a unique username for your account.
  </p>
</div>
```

### Required and invalid

```html
<label class="label" for="name">
  Name <span aria-hidden="true" class="text-negative">*</span>
</label>
<input class="text-field-input" type="text" id="name" required placeholder="Jane Doe">

<div class="text-field" data-invalid>
  <label class="text-field-label" for="bad-email">Email</label>
  <input class="text-field-input" type="email" id="bad-email" aria-invalid="true"
         aria-describedby="bad-email-error" aria-errormessage="bad-email-error" value="not-an-email">
  <p class="text-field-error" id="bad-email-error" role="alert">Please enter a valid email address.</p>
</div>
```

### With icon

```html
<div class="text-field" style="position:relative;">
  <label class="text-field-label" data-hidden for="icon-search">Search</label>
  <i data-lucide="search" aria-hidden="true" style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);color:var(--text-muted);width:1rem;height:1rem;"></i>
  <input class="text-field-input" id="icon-search" type="search" placeholder="Search..." style="padding-left:2.25rem;">
</div>
```

### File, password, and readonly

```html
<label class="label" for="avatar">Picture</label>
<input class="text-field-input" type="file" id="avatar">

<label class="label" for="password">Password</label>
<input class="text-field-input" type="password" id="password" placeholder="Enter your password">

<label class="label" for="api-key">API key</label>
<input class="text-field-input" type="text" id="api-key" readonly value="sk-1234567890abcdef">
```

### With button

```html
<form role="search" aria-label="Search" style="display:flex;gap:0.5rem;">
  <label class="text-field-label" data-hidden for="button-search">Search</label>
  <input class="text-field-input" id="button-search" type="search" placeholder="Search...">
  <button class="btn" type="submit" data-variant="default">Search</button>
</form>
```

### Textarea

```html
<label class="label" for="message">Message</label>
<textarea class="text-field-input" id="message" placeholder="Your message..."></textarea>
```

The `.text-field-input` API accepts `data-size="sm"` and native `disabled`, `readonly`, `required`, `aria-invalid`, and `type` attributes. `textarea.text-field-input` uses `field-sizing: content` for auto-growing text without JavaScript.
