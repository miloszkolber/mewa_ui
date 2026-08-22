# Sidebar

## Native basis

`<aside>` + `<nav>` + `<dialog>` + `<button>` for a full application sidebar with a flat link list, a collapsible desktop width, a mobile navigation dialog, and a keyboard shortcut.

## Native Web APIs

- [`<aside>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside) — complementary content landmark
- [`<nav>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav) — navigation landmark for assistive technology
- [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) — native modal for the mobile sidebar overlay
- [`::backdrop`](https://developer.mozilla.org/en-US/docs/Web/CSS/::backdrop) — dialog overlay styling
- [`<button>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button) — keyboard-accessible footer collapse control
- [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) — keyboard-only focus ring on links and controls
- [`overscroll-behavior`](https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior) — prevents scroll chaining in the nav area

## Structure

### Full application layout

```html
<div class="sidebar-layout">
  <aside class="app-sidebar" id="main-sidebar" data-state="expanded" aria-label="Primary navigation">
    <div class="sidebar-header">
      <a class="sidebar-logo" href="/" aria-label="MyApp home">
        <i data-lucide="command" aria-hidden="true"></i>
        <span class="sidebar-logo-text">MyApp</span>
      </a>
    </div>

    <div class="sidebar-content">
      <nav class="sidebar-nav" aria-label="Primary">
        <a class="sidebar-link" href="#" aria-current="page">
          <i data-lucide="house" aria-hidden="true"></i>
          <span>Dashboard</span>
        </a>
        <a class="sidebar-link" href="#inbox">
          <i data-lucide="inbox" aria-hidden="true"></i>
          <span>Inbox</span>
        </a>
        <a class="sidebar-link" href="#settings">
          <i data-lucide="settings" aria-hidden="true"></i>
          <span>Settings</span>
        </a>
        <a class="sidebar-link" href="#team">
          <i data-lucide="users" aria-hidden="true"></i>
          <span>Team</span>
        </a>
      </nav>
    </div>

    <div class="sidebar-footer">
      <button class="sidebar-trigger" type="button" data-sidebar-trigger="main-sidebar" aria-controls="main-sidebar" aria-label="Hide menu" aria-expanded="true">
        <i data-lucide="panel-left" aria-hidden="true"></i>
        <span class="sidebar-trigger-label">Hide menu</span>
      </button>
    </div>
  </aside>

  <dialog class="sidebar-mobile" id="mobile-sidebar" aria-label="Primary navigation">
    <button class="sidebar-mobile-close" type="button" aria-label="Close navigation">
      <i data-lucide="x" aria-hidden="true"></i>
    </button>
    <nav class="sidebar-nav" aria-label="Mobile primary">
      <a class="sidebar-link" href="#" aria-current="page">Dashboard</a>
      <a class="sidebar-link" href="#inbox">Inbox</a>
      <a class="sidebar-link" href="#settings">Settings</a>
    </nav>
  </dialog>

  <main>
    <button type="button" data-sidebar-mobile="mobile-sidebar" aria-haspopup="dialog" aria-expanded="false" aria-label="Open primary navigation">
      <i data-lucide="menu" aria-hidden="true"></i>
    </button>
    <!-- Main application content. -->
  </main>
</div>
```

### Collapsed

```html
<aside class="app-sidebar" id="main-sidebar" data-state="collapsed" aria-label="Primary navigation">
  <!-- The same flat nav remains available as an icon rail. -->
  <div class="sidebar-footer">
    <button class="sidebar-trigger" type="button" data-sidebar-trigger="main-sidebar" aria-controls="main-sidebar" aria-label="Show menu" aria-expanded="false">
      <i data-lucide="panel-left" aria-hidden="true"></i>
      <span class="sidebar-trigger-label">Show menu</span>
    </button>
  </div>
</aside>
```

The collapse control belongs in `.sidebar-footer`. It is a full-width button with a visible label when the sidebar is expanded and an icon-only, named button when collapsed. Set `data-sidebar-trigger` to the ID of the `<aside>`; `sidebar.js` toggles `data-state`, keeps `aria-expanded` synchronized, and updates the accessible and visible labels.

## Variants

| `data-state` | Width | Behavior |
| --- | --- | --- |
| `expanded` | 16rem | Full sidebar with icon and text labels |
| `collapsed` | 3.5rem | Icon rail with visually hidden labels and a footer icon-only collapse control |

| `data-side` | Position |
| --- | --- |
| *(none)* | Left (default) |
| `right` | Right side, border on left |

The nav stays flat in both widths. In collapsed mode, link and control labels remain available to assistive technology while CSS centers the icons. The mobile dialog remains closed and `display: none` until its native `open` state is set.

## ARIA

| Attribute | Element | Purpose |
| --- | --- | --- |
| `aria-label` | `.app-sidebar` or `.sidebar-nav` | Names the complementary and navigation landmarks |
| `aria-current="page"` | `.sidebar-link` | Identifies the current page link |
| `aria-controls` | `.sidebar-trigger` | Identifies the desktop sidebar controlled by the button |
| `aria-expanded` | `.sidebar-trigger` | Reports whether the desktop sidebar is expanded |
| `aria-label` | `.sidebar-trigger` | Announces “Hide menu” or “Show menu” |
| `<dialog>` | `.sidebar-mobile` | Native modal with focus management and Escape dismissal |

## Keyboard

| Key | Action |
| --- | --- |
| `Cmd+B` | Toggle the desktop sidebar width on macOS |
| `Ctrl+B` | Toggle the desktop sidebar width on Windows and Linux |
| `Escape` | Close the mobile sidebar through native dialog behavior |
| `Tab` | Move through links and the footer control in document order |

## Notes

- **Mobile**: Hide the desktop sidebar below 768px and use `<dialog class="sidebar-mobile">` for the mobile navigation dialog. Open it with a separate button using `data-sidebar-mobile="dialog-id"` and `aria-expanded`. Activating a mobile link closes the dialog and preserves native navigation.
- **Flat navigation**: Put every route in one labelled `<nav class="sidebar-nav">` as a native `<a class="sidebar-link">`.
- **Collapsed state**: Icons remain centered. Link and footer labels are visually hidden but remain accessible through the link text and the button’s updated `aria-label`.
- **Footer control**: Keep one `.sidebar-trigger` in `.sidebar-footer`, give it an explicit `type="button"`, `data-sidebar-trigger`, `aria-controls`, `aria-expanded`, and accessible label. It shares link geometry — same fixed row height, no border — so the footer reads as part of the nav.
- **Row parity**: Links use one fixed row height expanded and resolve to square icon tiles collapsed; heights match across states.
- **Progressive enhancement**: Links remain native navigation when JavaScript is unavailable. Desktop width changes and the mobile dialog trigger are the only scripted behavior.
- **No JavaScript**: At narrow widths, `@media (scripting: none)` presents the flat desktop nav as a normal block and hides the inert dialog trigger and footer control.
- **Responsive resize**: If an open mobile dialog crosses into the desktop breakpoint, the module closes it and restores focus to its trigger.
- **Sidebar tokens**: Use the shared `--surface-*`, `--text-*`, and `--border-*` roles.
- **Self-contained**: The sidebar needs no other component CSS for its core layout. Optional tooltips can label collapsed links when a consuming application provides them.
- **Shell**: Wrap the rail and workspace in `.sidebar-layout`; use `.app-sidebar` for the sticky rail and keep the footer collapse control reachable in both expanded and collapsed states.
