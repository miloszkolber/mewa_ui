# Command Palette

## Native basis

`<dialog>` + search input for a command palette. Uses `showModal()` for focus trap and Escape-to-close.

---

## Native Web APIs

- [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) — modal with focus trap and Escape-to-close
- [`showModal()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal) — opens dialog as modal with backdrop
- [`::backdrop`](https://developer.mozilla.org/en-US/docs/Web/CSS/::backdrop) — scrim overlay behind the dialog
- [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) — keyboard-only focus ring on items
- [`overscroll-behavior`](https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior) — prevents scroll chaining in command list
- [`forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors) — maps highlights to system colors

---

## Structure

```html
<button class="btn" type="button" data-command-palette-trigger="cmd">Open Command</button>
<dialog id="cmd" class="command-palette" role="dialog" aria-modal="true" aria-label="Command menu">
  <div class="command-palette-content">
    <div class="command-palette-input-wrapper">
      <svg aria-hidden="true"><!-- search icon --></svg>
      <input class="command-palette-input" type="text" aria-label="Command search"
             placeholder="Type a command or search..."
             autocomplete="off" autocorrect="off" spellcheck="false">
    </div>
    <div class="command-palette-list">
      <div class="command-palette-group">
        <p class="command-palette-group-heading">Suggestions</p>
        <button class="command-palette-item" type="button">Calendar</button>
        <button class="command-palette-item" type="button">Search Emoji</button>
      </div>
      <div class="command-palette-separator"></div>
      <div class="command-palette-group">
        <p class="command-palette-group-heading">Settings</p>
        <button class="command-palette-item" type="button">Profile <span class="command-palette-shortcut">⌘P</span></button>
        <button class="command-palette-item" type="button">Settings <span class="command-palette-shortcut">⌘S</span></button>
      </div>
    </div>
    <div class="command-palette-empty" hidden>No results found.</div>
  </div>
</dialog>
```

---

## ARIA

| Attribute | Element | Purpose |
|-----------|---------|---------|
| `role="dialog"` | `<dialog>` | Identifies as a dialog |
| `aria-modal="true"` | `<dialog>` | Indicates modal behavior |
| `aria-label="Command menu"` | `<dialog>` | Labels the dialog for screen readers |
| `aria-hidden="true"` | Search icon `<svg>` | Hides decorative icon |
| `aria-disabled="true"` | Disabled `<button>` | Marks item as disabled |
| `data-highlighted` | Active `<button>` | JS-managed visual highlight for the active command |
| `aria-selected` | Active `<button>` | Exposes the active command to assistive technology |
| `aria-activedescendant` | Search input | Identifies the active command while focus remains in the search field |

---

## Keyboard

| Key | Action |
|-----|--------|
| `Cmd/Ctrl + K` | Opens/closes the command palette (global) |
| `Escape` | Closes the dialog (native `<dialog>` behavior) |
| `Arrow Down` | Highlights the next visible item |
| `Arrow Up` | Highlights the previous visible item |
| `Enter` | Activates the highlighted item |
| `Home` | Highlights the first visible item |
| `End` | Highlights the last visible item |

---

## Notes

- The search input filters items by text content — groups with no matching items are hidden automatically.
- When all items are filtered out, the `.command-palette-empty` element is shown.
- Separators are hidden during filtering to avoid visual orphans.
- The `data-command-palette-trigger` attribute on any element wires it as a trigger button via JS.
- `Cmd/Ctrl+K` is registered as a global keyboard shortcut.
- Items with `aria-disabled="true"` are excluded from keyboard navigation and activation.
- The dialog uses `showModal()` — focus is trapped inside and Escape closes it natively.
- The search row owns the full-width focus highlight, including its icon and padded click area.
- On close, the search input is cleared and all items are restored.
- No JavaScript positioning is needed — the dialog uses CSS `position: fixed` with `top: 15%`.
- Opening moves focus into the search input, and closing returns focus to the trigger. State changes are immediate with no animation or transition.
