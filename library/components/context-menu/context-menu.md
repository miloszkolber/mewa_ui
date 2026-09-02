# Context Menu

## Purpose

Context Menu presents a compact action set for a specific object at the pointer or keyboard invocation point.

Use Context Menu for secondary object actions that also have a discoverable keyboard path.

Use Dropdown Menu when a visible trigger improves discovery.

Use Select or Combobox for form-value selection.

Do not make Context Menu the only way to reach an important action.

## Native basis

Context Menu uses a focusable trigger region, `popover="manual"`, and the ARIA menu pattern.

The module opens the menu from the native `contextmenu` event or a keyboard context-menu command.

The module positions the menu at the pointer or beside the focused trigger.

## Native Web APIs

- [`contextmenu`](https://developer.mozilla.org/en-US/docs/Web/API/Element/contextmenu_event) identifies a pointer or platform context-menu request.
- [`popover="manual"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/popover) provides top-layer rendering without automatic light dismiss.
- [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key) identifies `ContextMenu`, `Apps`, and `Shift+F10` keyboard requests.
- [WAI-ARIA Menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) defines menu focus and keyboard behavior.

## Structure

Set `data-context-menu-trigger` to the menu ID.

Keep a non-native trigger region in the normal keyboard path with `tabindex="0"`.

```html
<div class="context-menu-trigger"
     tabindex="0"
     data-context-menu-trigger="file-context-actions"
     aria-haspopup="menu"
     aria-expanded="false"
     aria-controls="file-context-actions">
  <strong>quarterly-report.csv</strong>
  <span>Right-click or press Shift+F10 for actions.</span>
</div>

<div class="context-menu-content"
     id="file-context-actions"
     role="menu"
     popover="manual"
     aria-label="File actions">
  <button class="context-menu-item" type="button" role="menuitem" tabindex="-1">
    Open file
  </button>
  <button class="context-menu-item" type="button" role="menuitem" tabindex="-1">
    Rename file
  </button>
  <div class="context-menu-separator" role="separator"></div>
  <button class="context-menu-item"
          type="button"
          role="menuitem"
          data-variant="destructive"
          tabindex="-1">
    Delete file
  </button>
</div>
```

Give the menu an accessible name.

Use native button items for actions.

Keep action labels as verbs.

## Checkable items

Use `role="menuitemcheckbox"` for one independent menu setting.

```html
<button class="context-menu-item context-menu-check"
        type="button"
        role="menuitemcheckbox"
        aria-checked="true"
        tabindex="-1">
  Show hidden files
</button>
```

Use `role="menuitemradio"` inside a labelled group for one menu choice.

Do not use checkable items when visible Checkbox, Radio Group, or Switch controls improve discovery.

## Behavior

Right-click or a platform context-menu gesture opens the menu at the pointer.

The Context Menu key, the Apps key, or Shift+F10 opens the menu beside the focused trigger.

The menu position stays inside the viewport.

Opening focuses the first enabled item.

Pointer movement highlights the item under the pointer.

Arrow navigation wraps through enabled items.

Type-ahead focuses the first matching enabled item.

Activating a normal item closes the menu.

Activating a checkbox or radio item updates `aria-checked` and keeps the menu open.

Escape, an outside pointer action, scrolling, or resizing closes the menu.

## Keyboard

| Key | Behavior |
| --- | --- |
| `ContextMenu`, `Apps`, or `Shift+F10` | Open the menu for the focused trigger. |
| `ArrowDown` | Focus the next enabled item. |
| `ArrowUp` | Focus the previous enabled item. |
| `Home` | Focus the first enabled item. |
| `End` | Focus the last enabled item. |
| `Enter` | Activate the focused item. |
| `Space` | Activate the focused item. |
| `Escape` | Close the menu and restore focus to the trigger. |
| Printable character | Focus the first matching item. |

Menu items stay out of the normal Tab sequence with `tabindex="-1"`.

Tab closes the menu and continues normal document navigation.

## Accessibility

Keep the trigger keyboard focusable.

Use `aria-haspopup="menu"`, `aria-controls`, and synchronized `aria-expanded` on the trigger.

Use `role="menu"` on the surface.

Use the documented menuitem role on each action.

Use `disabled` on native button items when an action is unavailable.

Skip disabled items during managed keyboard movement.

Provide the same important actions through a visible control or another discoverable route.

Do not add submenu markup until submenu keyboard behavior is implemented.

## No-JavaScript

Without the module, the browser keeps its native context menu because the page does not cancel the `contextmenu` event.

The trigger content and every separate visible action remain usable.

The custom popover menu stays closed.

Do not depend on the custom menu for the only path to a task.

## Runtime

Load `context-menu.js` whenever Context Menu appears.

The documented custom menu behavior requires JavaScript.
