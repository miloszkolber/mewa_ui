# Sortable

## Purpose

Sortable reorders a user-controlled list when item order has product meaning.

Use Sortable when users must change execution order, priority, display order, or another persistent sequence.

Do not use Sortable when order is fixed or cosmetic.

Do not make dragging the only pointer path.

## Native basis

Sortable uses a native list, draggable list items, compact move buttons, keyboard reordering, and a live status region.

The module provides drag behavior, non-drag pointer controls, roving item focus, announcements, and change events.

## Native Web APIs

- [HTML Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) provides optional direct drag interaction.
- [`draggable`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/draggable) marks items as draggable.
- [`DataTransfer`](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer) carries native drag state.
- [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) reports reordered state.
- [`aria-live`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-live) announces position changes.

## Structure

```html
<ul class="sortable" aria-label="Job priority">
  <li class="sortable-item" draggable="true" tabindex="0">
    <span class="sortable-handle" aria-hidden="true">
      <i class="ri-drag-move-2-line"></i>
    </span>
    <span>Nightly sync</span>
  </li>
  <li class="sortable-item" draggable="true" tabindex="-1">
    <span class="sortable-handle" aria-hidden="true">
      <i class="ri-drag-move-2-line"></i>
    </span>
    <span>Index refresh</span>
  </li>
</ul>
```

Use normal list semantics by default.

Do not add `role="listbox"` or `role="option"` unless the application also implements a real selection model.

The module creates compact move controls inside each enabled item.

The generated controls use 32px targets.

## Horizontal orientation

Add `data-orientation="horizontal"` when the ordered objects form a horizontal sequence.

```html
<ul class="sortable"
    data-orientation="horizontal"
    aria-label="Pipeline stages">
  <li class="sortable-item" draggable="true" tabindex="0">Prepare</li>
  <li class="sortable-item" draggable="true" tabindex="-1">Run</li>
  <li class="sortable-item" draggable="true" tabindex="-1">Verify</li>
</ul>
```

Use horizontal orientation only when horizontal order has meaning.

## Disabled item

Use `aria-disabled="true"` on an item that remains visible but cannot move.

```html
<li class="sortable-item" aria-disabled="true" tabindex="-1">
  <span>Required first step</span>
</li>
```

Do not set `draggable="true"` on a disabled item.

The module skips disabled items during managed movement.

## Behavior

Dragging an enabled item can place it before or after another item.

The generated move buttons provide a non-drag single-pointer path.

The first generated button moves the item earlier in the sequence.

The second generated button moves the item later in the sequence.

The module disables a move button at the relevant boundary.

Keyboard navigation moves item focus without changing order.

Alt plus the orientation arrow changes item order.

Every successful reorder updates the live status.

Every successful reorder dispatches `sortable-change`.

Direct manipulation remains immediate. Discrete control-state feedback uses the shared fast motion primitives.

## Keyboard

For a vertical list, Arrow Down moves focus to the next enabled item.

For a vertical list, Arrow Up moves focus to the previous enabled item.

For a horizontal list, Arrow Right moves focus to the next enabled item.

For a horizontal list, Arrow Left moves focus to the previous enabled item.

Home moves focus to the first enabled item.

End moves focus to the last enabled item.

Alt plus the next-direction arrow moves the active item later.

Alt plus the previous-direction arrow moves the active item earlier.

Tab can move into the generated pointer controls.

Enter or Space activates a focused move button.

## States

`data-dragging` marks the actively dragged item.

`data-over="before"` marks a before drop target.

`data-over="after"` marks an after drop target.

`data-active` marks the current roving-focus item.

Do not author these module-managed states as persistent application data.

## Events

The root dispatches `sortable-change` after every successful reorder.

The event bubbles.

The event detail is `{ item, index, source }`.

`source` is `drag`, `pointer`, or `keyboard`.

Persist the new order in application code after receiving the event.

## Accessibility

Give the list a visible heading or an accessible name when its purpose is not obvious.

Keep item labels visible during reordering.

Keep the move buttons available as the non-drag pointer path.

Keep keyboard reordering available.

Announce the new position after each reorder.

Hide decorative drag-handle icons from assistive technology.

Do not rely on cursor shape or drag visuals as the only explanation of reorder capability.

Do not add selection semantics when the list does not support selection.

## Runtime

Load `sortable.js` whenever Sortable appears.

Without the module, the list content remains readable but the documented reorder behavior is unavailable.
