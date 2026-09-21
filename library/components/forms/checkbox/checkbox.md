# Checkbox

## Purpose

Checkbox selects one independent submitted choice.

Checkbox can also coordinate several independent choices.

Use the optional module only for the documented Select all pattern.

Use Switch when one immediate system state changes on activation.

Use Radio Group when exactly one visible option can be selected.

## Native basis

Use `<input type="checkbox">`.

The native input owns focus, keyboard activation, checked state, validation, and form submission.

CSS changes the visual presentation.

The optional module coordinates Select all state.

The ready checkbox is 16px square. Invalid checked and indeterminate states keep the control-inverted fill and use inverted marks.

## Native Web APIs

- [`<input type="checkbox">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox) provides native binary form state.
- [`:checked`](https://developer.mozilla.org/en-US/docs/Web/CSS/:checked) exposes the checked state to CSS.
- [`:indeterminate`](https://developer.mozilla.org/en-US/docs/Web/CSS/:indeterminate) exposes a mixed state to CSS.
- [`HTMLInputElement.indeterminate`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/indeterminate) sets a mixed Select all state.
- [`:user-invalid`](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid) exposes native validation after interaction.
- [`forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors) restores native high-contrast rendering.
- The shared enhancer uses [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) to initialize added checkbox groups.
- [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) reports enhanced group changes.

## Structure

Use `.checkbox-item` for a compact labelled choice.

```html
<div class="checkbox-item">
  <input class="checkbox" type="checkbox" id="terms" name="terms">
  <label for="terms">Accept terms and conditions</label>
</div>
```

Use `.checkbox-item-block` when the choice needs supporting text.

```html
<div class="checkbox-item-block">
  <input class="checkbox" type="checkbox" id="notify" name="notifications">
  <div>
    <label for="notify">Enable notifications</label>
    <p class="checkbox-description">Receive updates about completed jobs.</p>
  </div>
</div>
```

Use the surrounding Field pattern when the choice needs help text or an error relationship.

## States

Use `checked` for the initial selected state.

Use `disabled` when the choice cannot change.

Use `required` when native validation requires the choice.

Use `aria-invalid="true"` when the application knows the control is invalid.

Set `indeterminate` only through JavaScript.

Do not use `aria-checked="mixed"` on the native checkbox.

## Select all group

Use a fieldset and legend for the group.

Keep each submitted item as a native checkbox.

Use the optional module only when the Select all control must reflect all, none, or mixed item state.

```html
<fieldset class="checkbox-group"
          data-checkbox-group
          aria-describedby="channels-help channels-status">
  <legend>Visible channels</legend>
  <p class="checkbox-description" id="channels-help">Choose the channels to show.</p>

  <label class="checkbox-item checkbox-group-select-all" for="channels-all">
    <input class="checkbox"
           data-checkbox-all
           id="channels-all"
           type="checkbox"
           aria-controls="channels-items">
    <span>Select all</span>
  </label>

  <div class="checkbox-group-items" data-checkbox-items id="channels-items">
    <div class="checkbox-item">
      <input class="checkbox"
             data-checkbox-item
             id="channel-email"
             name="channels"
             type="checkbox"
             value="email">
      <label for="channel-email">Email</label>
    </div>

    <div class="checkbox-item">
      <input class="checkbox"
             data-checkbox-item
             id="channel-push"
             name="channels"
             type="checkbox"
             value="push">
      <label for="channel-push">Push</label>
    </div>
  </div>

  <output class="checkbox-group-status"
          data-checkbox-status
          id="channels-status"
          role="status"></output>
</fieldset>
```

Disabled item checkboxes are excluded from Select all coordination.

The module never changes a disabled item.

## Data attributes

| Attribute | Element | Owner | Purpose |
| --- | --- | --- | --- |
| `data-checkbox-group` | group root | Author | Enables the optional group enhancement. |
| `data-checkbox-all` | Select all input | Author | Identifies the coordinating checkbox. |
| `data-checkbox-items` | item container | Author | Identifies the controlled item region. |
| `data-checkbox-item` | item input | Author | Identifies one coordinated checkbox. |
| `data-checkbox-status` | status output | Author | Receives the selected-count announcement. |
| `data-init` | group root | Module | Legacy readiness marker; do not author. |

Do not author `data-init`.

## Behavior

Space toggles a native checkbox.

Tab follows normal document order.

The optional module synchronizes Select all checked and indeterminate state.

The optional module updates the selected-count output.

The optional module dispatches `checkbox-group:change`.

The event detail contains `values`, `selected`, `total`, and `source`.

## Accessibility

Use the interactive-default border role to keep the unselected control visible against the canvas.

Keep a visible label for every checkbox.

Associate each label with `for` and `id`.

Use `<fieldset>` and `<legend>` for a related checkbox group.

Use `aria-controls` on Select all when it coordinates a visible item region.

Keep error text referenced from the invalid control.

Keep the group status polite.

Do not duplicate the same status with another live region.

## No-JavaScript behavior

Each item remains a native submitted checkbox without the module.

The Select all control becomes an independent checkbox without the module.

Do not include Select all when its independent no-JavaScript meaning would be misleading.

## Runtime

Checkbox requires no module for normal use.

Load `checkbox.js` only for the Select all enhancement.
