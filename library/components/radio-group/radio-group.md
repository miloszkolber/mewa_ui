# Radio Group

## Purpose

Radio Group selects one value from a short visible option set.

Use Radio Group when seeing all choices helps comparison.

Use Select when the option set should stay compact.

Do not use Radio Group for independent choices.

## Native basis

Use native `<input type="radio">` controls with one shared `name`.

Group related radios with `<fieldset>` and `<legend>`.

The browser owns exclusivity, keyboard movement, focus, validation, and form submission.

Radio Group requires no JavaScript.

## Native Web APIs

- [`<input type="radio">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio) provides native mutually exclusive choice behavior.
- [`<fieldset>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset) provides a semantic group and native disabled propagation.
- [`<legend>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend) gives the group an accessible name.
- [`:checked`](https://developer.mozilla.org/en-US/docs/Web/CSS/:checked) exposes the selected state to CSS.
- [`:has()`](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) lets the stylesheet reflect checked and focused state on a choice surface.

## Structure

Keep one shared `name` for every radio in the group.

Give each radio a unique ID and stable submitted value.

```html
<fieldset class="radio-group">
  <legend>Plan</legend>

  <div class="radio-item">
    <input class="radio" type="radio" name="plan" id="plan-free" value="free" checked>
    <label for="plan-free">Free</label>
  </div>

  <div class="radio-item">
    <input class="radio" type="radio" name="plan" id="plan-pro" value="pro">
    <label for="plan-pro">Pro</label>
  </div>
</fieldset>
```

## Supporting text

Use `.radio-item-block` when a choice needs one short description.

```html
<fieldset class="radio-group">
  <legend>Density</legend>

  <div class="radio-item-block">
    <input class="radio" type="radio" name="density" id="density-compact" value="compact" checked>
    <label for="density-compact">Compact</label>
    <span class="radio-description">Show more rows in the available space.</span>
  </div>

  <div class="radio-item-block">
    <input class="radio" type="radio" name="density" id="density-comfortable" value="comfortable">
    <label for="density-comfortable">Comfortable</label>
    <span class="radio-description">Use more space between rows.</span>
  </div>
</fieldset>
```

## Choice surface

Use `.radio-card` only when the complete option needs a larger selectable surface.

Keep the native radio inside the surface.

Keep one associated label for the radio.

Do not nest buttons, links, or other form controls inside a Radio Card.

```html
<fieldset class="radio-group">
  <legend>Storage profile</legend>

  <div class="radio-card">
    <input class="radio" type="radio" name="storage" id="storage-local" value="local" checked>
    <label for="storage-local">Local</label>
    <span class="radio-description">Store artifacts on this device.</span>
  </div>

  <div class="radio-card">
    <input class="radio" type="radio" name="storage" id="storage-remote" value="remote">
    <label for="storage-remote">Remote</label>
    <span class="radio-description">Store artifacts on the remote service.</span>
  </div>
</fieldset>
```

## Keyboard

Tab moves focus into or out of the radio group.

Arrow keys move between enabled radios and select the focused option.

Space selects the focused radio.

The browser provides these interactions.

## States

Use `checked` for the initial selected option.

Use `required` on one radio when the group requires a selection.

Use `<fieldset disabled>` when the complete group is unavailable.

Use `disabled` on one radio when one option is unavailable.

Explain an unavailable option when the reason is not obvious.

## Accessibility

Keep a visible legend for the group.

Keep each visible option label associated with its radio.

Keep submitted values stable.

Do not add `role="radiogroup"` to a native fieldset.

Do not add custom roving focus to native radios.

## Runtime

Radio Group requires no component module.

The complete group remains usable without JavaScript.
