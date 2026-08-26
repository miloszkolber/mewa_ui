# Toolbar

## Purpose

Toolbar groups frequently used application controls into one managed keyboard region.

Use Toolbar when related actions benefit from arrow-key navigation and compact visual grouping.

Use a normal action row when standard Tab navigation is sufficient.

Do not use Toolbar for route navigation, form fields, or unrelated page actions.

## Native basis

Toolbar uses a container with `role="toolbar"` and native child controls.

The module manages roving focus across supported toolbar items.

Child components keep ownership of their own pressed, selected, or action state.

## Native Web APIs

- [`role="toolbar"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/toolbar_role) identifies the composite control region.
- [`aria-orientation`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-orientation) exposes horizontal or vertical keyboard direction.
- [WAI-ARIA Toolbar Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) defines managed toolbar focus behavior.

## Structure

```html
<div class="toolbar"
     role="toolbar"
     aria-label="Editor controls"
     aria-orientation="horizontal">
  <button class="toggle"
          type="button"
          aria-pressed="false"
          aria-label="Bold">
    <i data-lucide="bold" aria-hidden="true"></i>
  </button>

  <button class="toggle"
          type="button"
          aria-pressed="false"
          aria-label="Italic">
    <i data-lucide="italic" aria-hidden="true"></i>
  </button>

  <div class="separator" data-orientation="vertical" role="separator"></div>

  <button class="btn" type="button" data-variant="ghost">
    Clear formatting
  </button>
</div>
```

Give every Toolbar an accessible name.

Keep separators between real logical groups.

Do not add a separator only to decorate spacing.

## Composition

Toolbar can contain Button, Toggle, Toggle Group, Button Group, and Separator.

Use the child component contract for child state and activation.

Do not make Toolbar duplicate Toggle Group selection logic.

Do not put text inputs or route links in Toolbar unless the component keyboard model explicitly supports that composition.

## Orientation

Use horizontal orientation by default.

Set `aria-orientation="vertical"` when controls are visually stacked.

Keep arrow-key direction synchronized with the visual orientation.

Do not use CSS order to make keyboard order differ from visual order.

## Behavior

Tab enters the Toolbar through one managed tab stop.

Arrow keys move focus between enabled toolbar controls.

Home moves focus to the first enabled control.

End moves focus to the last enabled control.

Child controls activate with their native keyboard behavior.

The Toolbar does not change child selection state.

Control state feedback uses the shared fast motion primitives.

## Keyboard

For horizontal orientation, Arrow Right moves to the next enabled item.

For horizontal orientation, Arrow Left moves to the previous enabled item.

For vertical orientation, Arrow Down moves to the next enabled item.

For vertical orientation, Arrow Up moves to the previous enabled item.

Home moves to the first enabled item.

End moves to the last enabled item.

Tab leaves the Toolbar after the managed focus stop.

## Accessibility

Use `role="toolbar"` only when managed arrow navigation provides a real usability benefit.

Give icon-only child controls accessible names.

Keep disabled controls out of managed arrow movement when the module specifies it.

Keep visible focus on every toolbar control.

Keep child `aria-pressed` and other state owned by the child component.

Do not put application route navigation inside Toolbar.

## Runtime

Load `toolbar.js` whenever Toolbar uses the documented managed keyboard behavior.

Without the module, native child controls remain independently operable through normal Tab navigation.
