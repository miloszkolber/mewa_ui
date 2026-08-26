# Sidebar

## Purpose

Sidebar provides persistent application navigation with a collapsible desktop rail and a mobile navigation dialog.

Use Sidebar when an application has several persistent routes that benefit from stable left or right navigation.

Use top navigation when a small flat route set fits comfortably in the header.

Do not use Sidebar for a single-purpose service without a route need.

Do not recreate Sidebar behavior with Layout primitives.

## Native basis

Sidebar uses `<aside>`, `<nav>`, native route links, a footer button, and a mobile `<dialog>`.

The module manages desktop collapse, mobile dialog triggers, focus restoration, and the documented keyboard shortcut.

## Native Web APIs

- [`<aside>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside) provides the complementary region.
- [`<nav>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav) provides route navigation semantics.
- [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) provides the mobile modal navigation surface.
- [`aria-current="page"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current) identifies the current route.
- [`matchMedia()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) coordinates the desktop and mobile modes at the shared shell tier.

## Desktop structure

Use `.sidebar-layout` for the rail and workspace pair.

Use `.sidebar-workspace` for the region that contains the toolbar and main content.

```html
<div class="sidebar-layout">
  <aside class="app-sidebar"
         id="workspace-sidebar"
         data-state="expanded"
         aria-label="Workspace navigation">
    <div class="sidebar-header">
      <a class="sidebar-logo" href="/" aria-label="Workspace home">
        <span class="sidebar-logo-mark" aria-hidden="true">
          <i data-lucide="command"></i>
        </span>
        <span class="sidebar-logo-text">Workspace</span>
      </a>
    </div>

    <div class="sidebar-content">
      <nav class="sidebar-nav" aria-label="Workspace">
        <a class="sidebar-link" href="/overview" aria-current="page">
          <i data-lucide="layout-dashboard" aria-hidden="true"></i>
          <span>Overview</span>
        </a>
        <a class="sidebar-link" href="/jobs">
          <i data-lucide="activity" aria-hidden="true"></i>
          <span>Jobs</span>
        </a>
      </nav>
    </div>

    <div class="sidebar-footer">
      <button class="sidebar-trigger"
              type="button"
              data-sidebar-trigger="workspace-sidebar"
              aria-controls="workspace-sidebar"
              aria-expanded="true"
              aria-label="Hide menu">
        <i data-lucide="panel-left" aria-hidden="true"></i>
        <span class="sidebar-trigger-label">Hide menu</span>
      </button>
    </div>
  </aside>

  <div class="sidebar-workspace">
    <main id="main-content">
      <!-- Route content. -->
    </main>
  </div>
</div>
```

Keep one flat labelled navigation list when the route set permits it.

Keep route links as native anchors.

Keep the collapse control in the footer.

Use `.sidebar-workspace` instead of a consumer-owned flex wrapper for the normal shell structure.

Do not place business actions in the route list.

## Collapsed state

`data-state="expanded"` uses the full 16rem rail.

`data-state="collapsed"` uses the compact icon rail.

The same links remain in the DOM in both states.

Labels remain available to assistive technology when visually hidden.

The module keeps the footer control label and `aria-expanded` state synchronized.

Use Tooltip only when collapsed icon meaning is not clear enough from the route context.

## Right side

Add `data-side="right"` when application structure requires right-side persistent navigation.

Do not use the right-side variant only for visual novelty.

Keep reading order and route access logical when the visual side changes.

## Mobile navigation

Use a native dialog below the `--breakpoint-compact` shell tier, 48rem.

```html
<button class="btn"
        type="button"
        data-variant="ghost"
        data-size="icon-sm"
        data-sidebar-mobile="workspace-mobile-nav"
        aria-haspopup="dialog"
        aria-expanded="false"
        aria-label="Open workspace navigation">
  <i data-lucide="menu" aria-hidden="true"></i>
</button>

<dialog class="sidebar-mobile"
        id="workspace-mobile-nav"
        aria-label="Workspace navigation">
  <button class="sidebar-mobile-close"
          type="button"
          aria-label="Close workspace navigation">
    <i data-lucide="x" aria-hidden="true"></i>
  </button>

  <nav class="sidebar-nav" aria-label="Mobile workspace">
    <a class="sidebar-link" href="/overview" aria-current="page">Overview</a>
    <a class="sidebar-link" href="/jobs">Jobs</a>
  </nav>
</dialog>
```

Keep the desktop and mobile route sets equivalent.

The module closes the mobile dialog after a route link activates.

The module closes an open mobile dialog above `--breakpoint-compact`, 48rem.

## Behavior

The desktop collapse control toggles `data-state` between expanded and collapsed.

`Cmd+B` toggles the first desktop Sidebar on macOS.

`Ctrl+B` toggles the first desktop Sidebar on other platforms.

The mobile trigger opens the native dialog with `showModal()`.

Escape closes the mobile dialog through native behavior.

The module restores focus after mobile navigation closes.

Control and navigation state feedback uses the shared fast motion primitives. Shell layout changes remain immediate.

The mobile backdrop uses the semantic overlay surface without blur.

## No-JavaScript behavior

Native route links remain usable without JavaScript.

At `--breakpoint-compact`, 48rem, the stylesheet exposes the desktop route list as normal flow when scripting is unavailable.

The stylesheet hides dead mobile and collapse controls when scripting is unavailable.

Desktop collapse and the mobile dialog require the module.

## Accessibility

Give the sidebar and each navigation landmark a clear accessible name.

Use `aria-current="page"` on only the current route in each route list.

Keep the footer collapse control keyboard reachable in both desktop states.

Hide decorative icons from assistive technology.

Keep visible focus on links and controls.

Keep collapsed link text in the accessibility tree.

Do not use tab roles for application routes.

Do not duplicate the same full product brand in adjacent App Shell and Sidebar regions.

## Runtime

Load `sidebar.js` whenever Sidebar uses collapse or mobile behavior.

The route links remain native navigation without the module.
