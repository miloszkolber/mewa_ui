# Slider

## Purpose

Slider selects one numeric value from a bounded range.

Use Slider when spatial adjustment helps users understand the value.

Use Number Field when precise typed values or repeated step buttons are more useful.

Do not use Slider when users must compare exact values before selection.

## Native basis

Slider uses `<input type="range">`.

The browser owns keyboard, pointer, touch, form submission, and range semantics.

The module updates the visual filled-track percentage for browsers that need it.

The ready Slider uses a 4px track and 16px thumb. Disabled thumbs use the shared `blur-400` effect in addition to explicit disabled surface and border roles.

## Native Web APIs

- [`<input type="range">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range) provides native range interaction.
- [`min`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/min), [`max`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/max), and [`step`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/step) define the numeric domain.
- [`<output>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output) can present a visible value when the application synchronizes it.
- [`aria-valuetext`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-valuetext) provides a human-readable value when the number alone is insufficient.

## Structure

```html
<div class="field">
  <label class="label" for="volume">Volume</label>
  <input class="slider"
         id="volume"
         name="volume"
         type="range"
         min="0"
         max="100"
         step="1"
         value="50">
</div>
```

Give the input a `name` when its value belongs to form submission.

Use native `min`, `max`, and `step` values.

## Visible value

Show a visible value when users need precise feedback while adjusting the slider.

```html
<div class="field">
  <label class="label" for="workers">Workers</label>
  <input class="slider"
         id="workers"
         name="workers"
         type="range"
         min="1"
         max="16"
         step="1"
         value="4"
         aria-describedby="workers-value">
  <output id="workers-value" for="workers">4</output>
</div>
```

Application code owns synchronization of an external output.

Do not add inline event handlers to canonical markup.

Use `aria-valuetext` when the meaningful value is a label such as “Low”, “Medium”, or “High”.

## Vertical orientation

Add `data-orientation="vertical"` when a vertical control better matches the surrounding spatial task.

```html
<input class="slider"
       type="range"
       data-orientation="vertical"
       aria-label="Zoom"
       aria-orientation="vertical"
       min="25"
       max="200"
       value="100">
```

Do not use vertical orientation only to save horizontal space.

## Disabled state

Use the native `disabled` attribute.

Do not use opacity alone as the disabled-state contract.

## Behavior

The browser changes the native range value.

The module calculates the current percentage from `min`, `max`, and `value`.

The module writes that percentage to `--slider-value` for the visual filled track.

The module updates the value on native `input` events.

The module does not change the submitted numeric value.

Direct manipulation remains immediate. Focus and disabled-state feedback uses the shared fast motion primitives.

## Keyboard

Arrow Right and Arrow Up increase the native value.

Arrow Left and Arrow Down decrease the native value.

Home moves to the minimum.

End moves to the maximum.

Page Up and Page Down use browser-defined larger range movement where supported.

Do not replace native range keyboard behavior.

## Accessibility

Give every Slider a visible label when space permits it.

Use a programmatic accessible name only when a visible label cannot fit the task.

Keep the native range input as the focusable control.

Use `aria-valuetext` only when the numeric value needs a human-readable equivalent.

Keep vertical orientation synchronized with `aria-orientation="vertical"`.

Do not add an explicit `role="slider"` to the native range input.

## Runtime

Load `slider.js` when the custom filled-track presentation is required.

The native range input remains fully usable and submittable without the module.
