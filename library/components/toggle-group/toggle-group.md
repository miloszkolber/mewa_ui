# Toggle Group

## Purpose

Toggle Group coordinates several related pressed tool states with one keyboard focus model.

Use Toggle Group when a compact control set needs single or multiple pressed selection.

Use Radio Group or Checkbox when the values are normal form choices.

Do not use Toggle Group for route navigation.

## Native basis

Toggle Group uses a labelled `role="group"` containing native Toggle buttons.

Each child exposes state with `aria-pressed`.

The module manages selection mode and roving focus.

## Native Web APIs

- [`role="group"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/group_role) groups related controls.
- [`<button>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button) provides native activation.
- [`aria-pressed`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-pressed) exposes each pressed state.

## Single selection

Use `data-type="single"` when zero or one item can be pressed.

```html
<div class="toggle-group"
     role="group"
     aria-label="View mode"
     data-type="single"
     data-variant="outline">
  <button class="toggle" type="button" value="list" aria-pressed="true">
    <i class="ri-list-unordered" aria-hidden="true"></i>
    List
  </button>
  <button class="toggle" type="button" value="grid" aria-pressed="false">
    <i class="ri-layout-grid-line" aria-hidden="true"></i>
    Grid
  </button>
</div>
```

The current implementation permits deselecting the active item.

Use Radio Group instead when exactly one value must always remain selected.

## Multiple selection

Use `data-type="multiple"` when each item has an independent pressed state within one compact tool group.

```html
<div class="toggle-group"
     role="group"
     aria-label="Visible columns"
     data-type="multiple">
  <button class="toggle" type="button" value="owner" aria-pressed="true">Owner</button>
  <button class="toggle" type="button" value="size" aria-pressed="false">Size</button>
  <button class="toggle" type="button" value="updated" aria-pressed="true">Updated</button>
</div>
```

Do not use multiple Toggle Group as a substitute for a normal group of submitted checkboxes.

## Orientation

Horizontal orientation is the default.

Use `data-orientation="vertical"` when the control set is visually vertical.

Arrow-key direction follows the visual orientation.

## Visual options

Use `data-variant="outline"` when the group needs persistent boundaries.

Use `data-spacing` when items should remain visually separate.

Omit `data-spacing` when connected outline items should share borders.

Square geometry remains unchanged in both modes.

## Disabled state

Disable the individual native buttons when the group is unavailable.

Use `data-disabled` only as the documented group presentation hook.

Do not rely on `data-disabled` alone when the buttons must be natively disabled.

Disabled items are skipped during managed focus movement.

## Behavior

Tab enters the group through one active tab stop.

Arrow keys move focus among enabled items and wrap at the ends.

Home moves focus to the first enabled item.

End moves focus to the last enabled item.

Enter or Space activates the focused native button.

Single mode clears other pressed items before setting the activated item state.

Multiple mode toggles only the activated item.

Visual selection feedback uses the shared fast motion primitives.

## Accessibility

Give the group an accessible name.

Give icon-only child Toggles accessible names.

Keep `aria-pressed` synchronized on every child.

Keep one enabled child in the normal Tab sequence.

Keep visual orientation consistent with arrow-key behavior.

Do not add radio roles to Toggle Group when the implementation uses pressed-button semantics.

## Runtime

Load `toggle-group.js` whenever Toggle Group appears.

The child buttons remain natively clickable without the module, but coordinated selection and roving focus require JavaScript.
