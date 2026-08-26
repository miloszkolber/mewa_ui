# Command Palette

## Purpose

Command Palette finds and activates application-wide commands from a searchable modal list.

Use Command Palette when a large command set benefits from keyboard search and direct activation.

Do not use Command Palette as the only route to normal navigation or frequently used actions.

Do not use Command Palette for selecting a form value.

## Native basis

Command Palette uses a native `<dialog>`, a search input, and native command buttons.

The module provides global triggering, filtering, managed active state, command activation, and focus restoration.

## Native Web APIs

- [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) provides modal top-layer behavior and Escape dismissal.
- [`showModal()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal) opens the palette as a modal.
- [`::backdrop`](https://developer.mozilla.org/en-US/docs/Web/CSS/::backdrop) provides the modal scrim.
- [`aria-activedescendant`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-activedescendant) exposes the active command while focus remains in search.
- [`overscroll-behavior`](https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior) contains command-list scrolling.

## Structure

```html
<button class="btn"
        type="button"
        data-command-palette-trigger="command-menu">
  Open commands
</button>

<dialog id="command-menu"
        class="command-palette"
        aria-label="Command menu">
  <div class="command-palette-content">
    <div class="command-palette-input-wrapper">
      <i data-lucide="search" aria-hidden="true"></i>
      <input class="command-palette-input"
             type="search"
             aria-label="Search commands"
             placeholder="Search commands"
             autocomplete="off"
             spellcheck="false">
    </div>

    <div class="command-palette-list">
      <div class="command-palette-group">
        <p class="command-palette-group-heading">Navigation</p>
        <button class="command-palette-item" type="button">Open jobs</button>
        <button class="command-palette-item" type="button">Open history</button>
      </div>
      <div class="command-palette-separator" aria-hidden="true"></div>
      <div class="command-palette-group">
        <p class="command-palette-group-heading">Actions</p>
        <button class="command-palette-item" type="button">
          Refresh data
          <kbd class="command-palette-shortcut">R</kbd>
        </button>
      </div>
    </div>

    <p class="command-palette-empty" role="status" hidden>No commands match.</p>
  </div>
</dialog>
```

Use a specific dialog label.

Keep command labels as actions.

Use normal links outside the palette for discoverable route navigation.

## Triggers

Set `data-command-palette-trigger` to the dialog ID.

The module also uses `Cmd+K` on macOS and `Ctrl+K` on other platforms.

Do not register a second application shortcut for the same key combination.

## Disabled commands

Use the native `disabled` attribute when the command is a button.

Use `aria-disabled="true"` only when application behavior requires a non-native command item state.

Skip disabled items during managed keyboard navigation.

Do not hide a disabled command when its presence explains an unavailable capability.

## Behavior

Activating a trigger opens the dialog with `showModal()`.

Opening the palette moves focus to the search input.

Typing filters commands by their visible text.

Filtering hides empty groups and orphan separators.

Filtering shows the empty state when no command matches.

Arrow movement updates `aria-activedescendant` while DOM focus stays in the search input.

Enter activates the highlighted command.

Escape closes the dialog through native dialog behavior.

Closing clears the query and restores the full command list.

Closing returns focus to the trigger when the component opened from a trigger.

Result state feedback uses the fast motion primitives. Opening and closing use the spatial duration; filtering remains immediate.

## Keyboard

| Key | Behavior |
| --- | --- |
| `Cmd+K` or `Ctrl+K` | Open or close the palette. |
| `ArrowDown` | Highlight the next enabled visible command. |
| `ArrowUp` | Highlight the previous enabled visible command. |
| `Home` | Highlight the first enabled visible command. |
| `End` | Highlight the last enabled visible command. |
| `Enter` | Activate the highlighted command. |
| `Escape` | Close the native dialog. |
| `Tab` | Move through any other focusable controls in the dialog. |

Do not move DOM focus to command items during arrow navigation.

## Accessibility

Give the dialog an accessible name.

Give the search input an accessible name.

Hide decorative icons and separators from assistive technology.

Keep active-command state synchronized with `aria-activedescendant`.

Use `role="status"` on the dynamic empty message only when its announcement helps the search task.

Do not put essential application navigation only in the palette.

Do not use a command shortcut as the accessible name.

## Runtime

Load `command-palette.js` whenever Command Palette appears.

The static dialog content remains readable without JavaScript when opened by developer tools, but the documented palette interaction requires the module.
