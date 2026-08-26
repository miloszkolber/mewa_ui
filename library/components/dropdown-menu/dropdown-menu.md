# Dropdown Menu

## Purpose

Dropdown Menu presents a compact set of application actions from one trigger.

Use Dropdown Menu when showing every action as a visible button would create unnecessary local clutter.

Use Navigation Menu for grouped routes.

Use Select or Combobox for form-value selection.

Do not use Dropdown Menu for primary application navigation.

## Native basis

Dropdown Menu uses a native button trigger and the Popover API.

CSS Anchor Positioning places the menu beside its trigger.

The module provides the ARIA menu keyboard model, highlighted state, and checkable item behavior.

## Native Web APIs

- [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) provides top-layer rendering and light dismiss.
- [CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) positions the menu without a positioning library.
- [WAI-ARIA Menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) defines menu and menuitem keyboard behavior.
- [`forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors) preserves system-color highlights.

## Structure

```html
<button class="btn"
        type="button"
        data-variant="outline"
        data-dropdown-menu-trigger="job-actions"
        aria-haspopup="menu"
        aria-expanded="false"
        aria-controls="job-actions">
  Actions
  <i data-lucide="chevron-down" aria-hidden="true"></i>
</button>

<div id="job-actions"
     class="dropdown-menu-content"
     role="menu"
     popover
     aria-label="Job actions">
  <button class="dropdown-menu-item"
          type="button"
          role="menuitem"
          tabindex="-1">
    Retry job
  </button>
  <button class="dropdown-menu-item"
          type="button"
          role="menuitem"
          tabindex="-1">
    View logs
  </button>
  <div class="dropdown-menu-separator" role="separator"></div>
  <button class="dropdown-menu-item"
          type="button"
          role="menuitem"
          data-variant="destructive"
          tabindex="-1">
    Delete job
  </button>
</div>
```

Set `data-dropdown-menu-trigger` to the menu ID.

Give the menu an accessible name.

Keep normal action labels as verbs.

## Checkable items

Use `role="menuitemcheckbox"` for one independent menu setting.

```html
<button class="dropdown-menu-item dropdown-menu-check"
        type="button"
        role="menuitemcheckbox"
        aria-checked="true"
        tabindex="-1">
  Show timestamps
</button>
```

Use `role="menuitemradio"` inside a labelled group for one menu choice from a small set.

```html
<div role="group" aria-label="Sort order">
  <p class="dropdown-menu-label">Sort order</p>
  <button class="dropdown-menu-item dropdown-menu-radio"
          type="button"
          role="menuitemradio"
          aria-checked="true"
          tabindex="-1">
    Newest first
  </button>
  <button class="dropdown-menu-item dropdown-menu-radio"
          type="button"
          role="menuitemradio"
          aria-checked="false"
          tabindex="-1">
    Oldest first
  </button>
</div>
```

Do not use checkable menu items when a visible Checkbox, Radio Group, or Switch would improve discovery.

## Behavior

Activating the trigger toggles the native popover.

Opening the menu focuses the first enabled menu item.

Pointer movement highlights the menu item under the pointer.

Arrow navigation wraps through enabled items.

Type-ahead moves focus to the first enabled item whose label starts with the typed character.

Enter or Space activates the focused item.

Activating a normal menu item closes the menu.

Activating a checkbox or radio item updates `aria-checked`.

Escape closes the menu.

Light dismiss keeps focus on the outside control that received focus.

Keyboard closure restores focus to the trigger when focus remains inside the menu.

Item state feedback uses the shared fast motion primitives. Opening and closing remain immediate.

## Keyboard

| Key | Behavior |
| --- | --- |
| `ArrowDown` | Focus the next enabled item. |
| `ArrowUp` | Focus the previous enabled item. |
| `Home` | Focus the first enabled item. |
| `End` | Focus the last enabled item. |
| `Enter` | Activate the focused item. |
| `Space` | Activate the focused item. |
| `Escape` | Close the menu. |
| Printable character | Focus the first matching item. |

Menu items stay out of the normal Tab sequence with `tabindex="-1"`.

Tab leaves the menu through normal browser focus movement and light dismiss behavior.

## Accessibility

Use `aria-haspopup="menu"` on the trigger.

Keep `aria-expanded` synchronized with native popover state.

Use `role="menu"` on the menu container.

Use the documented menuitem role on each actionable item.

Use `disabled` on native button items when possible.

Skip disabled items during managed keyboard movement.

Hide decorative icons from assistive technology.

Do not add submenu markup until the component implements and documents submenu keyboard behavior.

## Runtime

Load `dropdown-menu.js` whenever Dropdown Menu appears.

The popover can render without the module, but the documented menu focus and keyboard behavior require JavaScript.
