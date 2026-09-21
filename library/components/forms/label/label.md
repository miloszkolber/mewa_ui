# Label

## Purpose

Label gives a visible name to one native form control.

Use Label with a stable `for` and `id` association.

Use Field when the control also needs help text, errors, or grouped layout.

Do not use placeholder text as the only control name.

## Native basis

Use a native `<label>` element.

The browser provides click-to-focus behavior for the associated control.

Label requires no JavaScript.

## Native Web APIs

- [`<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label) provides native control association.
- [`for`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/for) references the control ID.
- [`:has()`](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) lets the stylesheet reflect an adjacent disabled control.
- [`forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors) preserves disabled-label contrast.

## Structure

```html
<label class="label" for="email">Email</label>
<input class="text-field-input" id="email" name="email" type="email">
```

Keep one visible label for each editable form control.

## Required field

Use the native `required` attribute as the source of truth.

Hide a visible required marker from assistive technology when the control already exposes `required`.

```html
<label class="label" for="name">
  Name <span aria-hidden="true">*</span>
</label>
<input class="text-field-input" id="name" name="name" type="text" required>
```

## Optional field

Use `.label-hint` for a short optional indicator.

```html
<label class="label" for="bio">
  Bio <span class="label-hint">Optional</span>
</label>
<textarea class="textarea" id="bio" name="bio"></textarea>
```

## Disabled field

Prefer the native `disabled` state on the control.

The adjacent Label reflects the disabled control automatically.

```html
<label class="label" for="plan">Plan</label>
<select class="select" id="plan" name="plan" disabled>
  <option>Free</option>
</select>
```

Use `data-disabled` on Label only when no adjacent native disabled control can express the state.

## Checkbox, radio, and switch labels

Use the composition defined by Checkbox, Radio Group, or Switch.

Do not add inline margin overrides to Label.

Do not recreate those component layouts with utility classes.

## Accessibility

Keep `for` equal to the target control ID.

Keep the visible label text consistent with the accessible control name.

Do not use an empty Label.

Do not add a second `aria-label` that conflicts with the visible Label.

## Runtime

Label requires no component module.
