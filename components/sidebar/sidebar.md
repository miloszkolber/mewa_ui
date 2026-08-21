# Sidebar

## Native basis

`<aside>` + `<nav>` + `<dialog>` for a full application sidebar with collapsible state, mobile sheet overlay, collapsible groups, submenus, and keyboard shortcut.

## Native Web APIs

- [`<aside>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside) — complementary content landmark
- [`<nav>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav) — navigation landmark for assistive technology
- [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) — native modal for mobile sidebar overlay
- [`<details>/<summary>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) — collapsible groups and submenus without JS toggle logic
- [`::backdrop`](https://developer.mozilla.org/en-US/docs/Web/CSS/::backdrop) — dialog overlay styling
- [`@starting-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) — slide-in animation for mobile dialog
- [`<button>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button) — keyboard-accessible vertical rail toggle
- [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) — keyboard-only focus ring on nav links
- [`overscroll-behavior`](https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior) — prevents scroll chaining in nav area
- [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — suppresses all transitions

## Structure

### Full application layout
```html
<div class="sidebar-layout">
  <aside class="app-sidebar" id="main-sidebar" data-state="expanded">
    <div class="sidebar-header">
      <a class="sidebar-logo" href="/">
        <i data-lucide="command"></i>
        <span class="sidebar-logo-text">MyApp</span>
      </a>
    </div>
    <div class="sidebar-content">
      <details class="sidebar-group" open>
        <summary>
          <span>Platform</span>
          <i data-lucide="chevron-right"></i>
        </summary>
        <nav class="sidebar-nav">
          <a class="sidebar-link" href="#" aria-current="page" data-tooltip-trigger="side-tip-dashboard">
            <i data-lucide="house"></i> <span>Dashboard</span>
          </a>
          <div class="tooltip" id="side-tip-dashboard" popover="hint" role="tooltip">Dashboard</div>
          <a class="sidebar-link" href="#">
            <i data-lucide="inbox"></i> <span>Inbox</span>
            <span class="sidebar-badge">12</span>
          </a>
          <details class="sidebar-submenu">
            <summary>
              <i data-lucide="settings"></i> <span>Settings</span>
              <i data-lucide="chevron-right"></i>
            </summary>
            <nav class="sidebar-nav">
              <a class="sidebar-link" href="#"><span>General</span></a>
              <a class="sidebar-link" href="#"><span>Team</span></a>
            </nav>
          </details>
        </nav>
      </details>
    </div>
    <div class="sidebar-footer">user@example.com</div>
    <button class="sidebar-rail" type="button" data-sidebar-trigger="main-sidebar" aria-controls="main-sidebar" aria-label="Collapse sidebar" aria-expanded="true"></button>
  </aside>

  <dialog class="sidebar-mobile" id="mobile-sidebar">
    <button class="sidebar-mobile-close" aria-label="Close">
      <i data-lucide="x"></i>
    </button>
    <!-- same nav content as desktop -->
  </dialog>

  <main style="flex:1;min-width:0;">
    <button class="sidebar-trigger" data-sidebar-trigger="main-sidebar" aria-controls="main-sidebar" aria-label="Collapse sidebar" aria-expanded="true">
      <i data-lucide="panel-left"></i>
    </button>
  </main>
</div>
```

### Collapsed
```html
<aside class="app-sidebar" id="main-sidebar" data-state="collapsed">
  <!-- rail: a full-height edge control toggles the icon rail -->
  <button class="sidebar-rail" type="button" data-sidebar-trigger="main-sidebar" aria-controls="main-sidebar" aria-label="Expand sidebar" aria-expanded="false"></button>
</aside>
```

The collapse toggle can be a `button.sidebar-trigger` placed next to the sidebar or a full-height `button.sidebar-rail` inside it. Both use `data-sidebar-trigger="<sidebar-id>"`; `sidebar.js` toggles `data-state` on the `<aside>` and keeps `aria-expanded` synchronized.

## Variants

| `data-state`   | Width    | Behavior                              |
| -------------- | -------- | ------------------------------------- |
| `expanded`     | 16rem    | Full sidebar with labels              |
| `collapsed`    | 3.5rem   | Icon rail: labels, badges, footer, logo text, section titles and group/submenu labels hidden; links centered |

| `data-side`    | Position                              |
| -------------- | ------------------------------------- |
| *(none)*       | Left (default)                        |
| `right`        | Right side, border on left            |

In collapsed mode nested submenu nav flattens (no indent, no border) so every icon sits centered on the rail. The full-height `.sidebar-rail` remains keyboard accessible in both states and toggles the sidebar from its edge. Pair collapsed links with tooltips — the sidebar demo does this with the Tooltip component so the icon rail stays discoverable.

## ARIA

| Attribute        | Element            | Purpose                            |
| ---------------- | ------------------ | ---------------------------------- |
| `<aside>`        | `.app-sidebar`     | Complementary landmark             |
| `<nav>`          | `.sidebar-nav`     | Navigation landmark                |
| `aria-current`   | `.sidebar-link`    | `"page"` for current page link     |
| `<dialog>`       | `.sidebar-mobile`  | Modal with focus trap + Escape     |

## Keyboard

| Key          | Action                                |
| ------------ | ------------------------------------- |
| `Cmd+B`      | Toggle sidebar collapse (macOS)       |
| `Ctrl+B`     | Toggle sidebar collapse (Windows)     |
| `Escape`     | Close mobile sidebar (native dialog)  |

## Notes

- **Mobile**: Desktop sidebar hidden below 768px. Use `<dialog class="sidebar-mobile">` for slide-in sheet.
- **Collapsible groups**: `<details class="sidebar-group">` — native toggle, no JS.
- **Submenus**: `<details class="sidebar-submenu">` for nested nav with left border (flattened when collapsed).
- **Badges**: `<span class="sidebar-badge">` for notification counts (hidden when collapsed).
- **Collapsed state**: Icons remain and stay centered; labels, titles, badges, footer, and logo text are hidden.
- **Toggle**: `sidebar.js` flips `data-state` on click and on `Cmd+B`/`Ctrl+B`. The toggle button lives outside the sidebar so it is always reachable.
- **Rail**: Add `.sidebar-rail` inside the sidebar for a full-height edge toggle. Set `data-sidebar-trigger` to the sidebar ID and keep `aria-expanded` on the button.
- **Sidebar tokens**: Uses the shared `--surface-*`, `--text-*`, and `--border-*` roles.
- **Self-contained**: The sidebar needs no other component CSS for its core layout. Tooltips on collapsed icons are an optional enhancement that requires the Tooltip component.
