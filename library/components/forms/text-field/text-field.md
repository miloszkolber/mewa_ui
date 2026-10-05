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

## Affixes and attached actions

Use the optional `.text-field-control` wrapper when one input needs a prefix, suffix, decorative icon, or attached action.

Keep the standalone input structure unchanged when these parts are not needed.

| Class | Content and ownership |
| --- | --- |
| `.text-field-control` | Contains exactly one native `.text-field-input`, optional affixes, and at most one trailing action. Owns the input boundary and focus perimeter. |
| `.text-field-affix` | A non-interactive `<span>` with short plain text or one decorative inline SVG. |
| `.text-field-action` | A native `<button>` combined with `.btn`, `data-variant="ghost"`, and `data-icon-only`. Button owns activation, disabled state, and action focus. |

Put the input first in source order.

Put affix spans after the input and before the optional action.

Use at most one affix on each side.

Use `data-side="start"` for a leading affix.

Omit `data-side` to use the same start position.

Use `data-side="end"` for a trailing affix.

CSS changes only the affix's visual order.

Do not add a role, `tabindex`, label, or click-to-focus handler to `.text-field-control`.

Keep the label's `for` value pointed at the native input's `id`.

Keep links, buttons, and other inputs out of `.text-field-affix`.

Keep affix text concise.

Move long instructions to `.text-field-description` instead of using an affix as a second label.

Affix text can wrap when space is limited.

The wrapper can grow vertically to preserve this text.

The short control boundary is 36px high and uses 14px text, 12px inline insets, and an 8px gap between parts.

The attached Button retains its full 36px square target and 16px icon.

The nested input has no second border or focus ring.

The wrapper paints the input's focus perimeter with `--ring-default` or `--ring-invalid`.

The attached Button retains its own focus indicator so keyboard users can distinguish the two controls.

### Value context

Reference a meaningful prefix, suffix, or unit with `aria-describedby`.

Do not hide meaningful context with `aria-hidden`.

```html
<div class="text-field">
  <label class="text-field-label" for="service-url">Service URL</label>
  <div class="text-field-control">
    <input class="text-field-input" id="service-url" name="endpoint"
           type="url" value="https://api.example.test/v1" readonly
           aria-describedby="service-url-context">
    <span class="text-field-affix" data-side="end"
          id="service-url-context">production</span>
  </div>
</div>
```

Affixes are not part of the native input value or form submission.

Keep a complete URL in a `type="url"` input and a complete email address in a `type="email"` input.

Do not use a separate `https://` prefix or email domain to make an incomplete native value appear valid.

Keep units visible and associated instead of encoding units only in placeholder text.

## Required and invalid

Use native `required` when the field is required.

Let the field's required styling supply the visible marker instead of adding a second asterisk.

Use `aria-invalid="true"` when the application or server already knows the value is invalid.

Use `data-invalid` only as the documented wrapper styling hook.

Keep `data-invalid` on `.text-field`, not on `.text-field-control`.

The composition boundary reflects the input's `aria-invalid="true"` or `:user-invalid` state.

The invalid boundary and keyboard focus perimeter remain visible together.

```html
<div class="text-field" data-invalid>
  <label class="text-field-label" for="profile-name">Full name</label>
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

The composition boundary follows native `disabled` and `readonly` on its input.

`data-disabled` does not disable the input or an attached Button.

Author `disabled` on the Button explicitly when a disabled input makes that action unavailable.

Do not disable every attached action only because the input is readonly.

A readonly value can still have a caller-owned copy action.

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
<form role="search" aria-label="Search jobs" action="/jobs" method="get">
  <div class="text-field">
    <label class="text-field-label" for="job-search">Search jobs</label>
    <div class="text-field-control">
      <input class="text-field-input" id="job-search" name="q"
             type="search" enterkeyhint="search">
      <span class="text-field-affix" data-side="start" aria-hidden="true">
        <svg width="16" height="16" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6147 17.2475 15.8748 16.0248L16.0247 15.8748Z"/></svg>
      </span>
      <button class="text-field-action btn" type="submit"
              data-variant="ghost" data-icon-only aria-label="Search jobs">
        <svg width="16" height="16" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"/></svg>
      </button>
    </div>
  </div>
</form>
```

The native submit action sends `q` to the caller's `/jobs` route without JavaScript.

Use the caller's real search route instead of the example path.

Use `type="button"` for an action that must not submit the form.

### Clear a client-side filter

Use a separately named native action when the application needs an explicit clear control.

```html
<div class="text-field">
  <label class="text-field-label" for="job-filter">Filter jobs</label>
  <div class="text-field-control">
    <input class="text-field-input" id="job-filter" type="search">
    <span class="text-field-affix" data-side="start" aria-hidden="true">
      <svg width="16" height="16" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6147 17.2475 15.8748 16.0248L16.0247 15.8748Z"/></svg>
    </span>
    <button class="text-field-action btn" id="job-filter-clear"
            type="button" data-variant="ghost" data-icon-only
            aria-label="Clear job filter" hidden>
      <svg width="16" height="16" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"/></svg>
    </button>
  </div>
</div>
```

The caller owns filtering, the clear handler, and the action's availability.

Remove native `hidden` only after the caller attaches a working clear handler.

Keep the action hidden when JavaScript or its handler is unavailable.

Set the native input value to an empty string in that handler.

Update caller state through the caller's normal input path.

Assigning `input.value` does not emit a native `input` event.

Dispatch a bubbling `input` event when the caller's input listener owns filtering.

Return focus to the input after clearing.

Preserve ordinary editing, selection, paste, undo, autocomplete, and composition behavior.

Text Field supplies no clear, copy, or password-reveal handler.

## Icons

Compose an icon only when it adds meaning or recognition.

Place a leading decorative SVG in `.text-field-affix` when using the optional control wrapper.

Load Button's stylesheet when an attached `.btn` is present.

Do not position icons with inline styles in canonical Text Field markup.

Hide decorative icons from assistive technology.

Do not put the accessible name on a decorative icon instead of the field label.

## Data attributes

| Attribute | Purpose |
| --- | --- |
| `data-invalid` | Styles a Text Field with a known invalid state. |
| `data-disabled` | Styles a wrapper whose native input is disabled. |
| `data-hidden` | Visually hides the label while preserving its accessible name. |
| `data-side="start"` | Places an affix at the start of `.text-field-control`; omission uses the same position. |
| `data-side="end"` | Places an affix at the end of `.text-field-control`. |

Native control attributes remain the source of truth.

Do not invent additional Text Field state hooks.

## Behavior

Text Field adds no keyboard handlers.

Text Field emits no custom events.

Tab moves to the native input.

The next Tab reaches the optional action in native source order.

Do not add roving focus or wrapper keyboard handlers.

The input type controls browser editing and mobile keyboard behavior.

Native `input`, `change`, `invalid`, focus, composition, submit, and reset behavior remains available.

## Accessibility

Pair every label `for` value with the input `id`.

Reference help and error text explicitly.

Keep all referenced IDs unique.

Use the correct native `type` and `autocomplete` value.

Keep `required`, `disabled`, and `readonly` on the native input.

Keep visible input focus outside the control wrapper when the composition is present.

Keep action focus visible on the Button.

Do not use `aria-label` when a visible or deliberately hidden label already provides the name.

## Runtime

Text Field requires no component module.

The complete labelled input and native validation path work without JavaScript.

Affix layout, native submission, and native reset work without JavaScript.

Caller-owned enhancement actions need a working caller handler before they become visible.
