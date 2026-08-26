# Shell layouts

Use this file to compose application chrome.

Read `DESIGN.md` before this file.

Read `system/patterns.md` before you add route content.

mewa_ui does not ship complete layout templates.

Compose shells from documented components and native landmarks.

## Ownership model

App Shell is a component.

Sidebar is a component.

Layout is a component.

A shell is a composition.

App Shell owns shared header, toolbar, page overview, content canvas, status, empty-state, and optional theme primitives.

Sidebar owns the collapsible desktop rail, workspace wrapper, and mobile navigation behavior.

Layout owns local Grid and Flexbox composition.

A consumer owns routes, account data, application state, and business content.

Do not copy component behavior into application code.

Do not create a shell-specific component variant when composition solves the task.

## Choose a shell

Use the sidebar shell for an application with several persistent work areas.

Use the top-navigation shell for a small flat route set.

Use the focused-tool shell for one primary task with little or no persistent navigation.

Use no persistent shell navigation when the service has one route.

Do not select a shell from visual preference alone.

## Sidebar shell

Use Sidebar as the navigation primitive.

Use one labelled flat navigation list.

Use native links for routes.

Use `aria-current="page"` on the current route.

Use the Sidebar footer control for desktop collapse.

Use the Sidebar mobile dialog below `--breakpoint-compact`, `48rem`.

Use `.sidebar-workspace` for the toolbar and main-content column.

Use App Shell `.app-toolbar` when breadcrumbs and local page actions are needed.

Use App Shell `.page-overview` near the start of main.

Use App Shell `.app-content` for the shared content canvas.

Keep the sidebar and page content on one continuous canvas.

Do not use tab roles for route navigation.

Do not repeat the same product brand in the toolbar and sidebar.

### Minimal sidebar composition

```html
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>

  <div class="sidebar-layout">
    <aside class="app-sidebar"
           id="primary-sidebar"
           data-state="expanded"
           aria-label="Primary navigation">
      <!-- Use the Sidebar component contract here. -->
    </aside>

    <div class="sidebar-workspace">
      <header class="app-toolbar">
        <div class="app-toolbar-inner">
          <!-- Breadcrumbs and local actions. -->
        </div>
      </header>

      <main id="main-content">
        <section class="page-overview">
          <!-- Route title and actions. -->
        </section>
        <div class="app-content">
          <!-- Route content. -->
        </div>
      </main>
    </div>
  </div>

  <!-- Keep the Sidebar mobile dialog as a direct body child. -->
</body>
```

Keep the mobile Sidebar dialog as a direct body child.

Load `sidebar.js` when the Sidebar component appears.

Load `app-shell.js` only when the shell includes its optional theme control.

## Top-navigation shell

Use App Shell `.app-header` for the top-level header.

Use one labelled `.app-nav` landmark.

Use native links for destinations.

Use `aria-current="page"` on the current route.

Use `.app-header-actions` for global actions.

Use `.page-overview` for the route task.

Use `.app-content` for route content.

Keep the route set small enough to scan quickly.

Allow the navigation region to scroll horizontally when it cannot fit at narrow widths.

Do not use tab roles for route navigation.

Do not add a Sidebar when the route set fits the header.

### Minimal top-navigation composition

```html
<body class="app-shell">
  <a class="skip-link" href="#main-content">Skip to content</a>

  <header class="app-header">
    <div class="app-header-inner">
      <a class="brand" href="/">Service name</a>

      <nav class="app-nav" aria-label="Primary">
        <a href="/" aria-current="page">Overview</a>
        <a href="/history">History</a>
      </nav>

      <div class="app-header-actions">
        <!-- Global actions. -->
      </div>
    </div>
  </header>

  <main id="main-content">
    <section class="page-overview">
      <!-- Route title and actions. -->
    </section>
    <div class="app-content">
      <!-- Route content. -->
    </div>
  </main>
</body>
```

## Focused-tool shell

Use the focused-tool shell for a service with one primary task.

Use the `--breakpoint-max-focused` application canvas, `64rem`.

Keep navigation absent or minimal.

Use one header only when brand, theme, or account actions are necessary.

Use `.page-overview` for the task title and local actions.

Use `.app-content` for the working surface.

Use one main action hierarchy.

Do not add persistent navigation only to fill empty space.

### Minimal focused-tool composition

```html
<body class="app-shell focused-tool-shell">
  <a class="skip-link" href="#main-content">Skip to content</a>

  <main id="main-content">
    <section class="page-overview">
      <!-- Task title and actions. -->
    </section>
    <div class="app-content">
      <!-- Focused tool. -->
    </div>
  </main>
</body>
```

Define the focused canvas in the consumer stylesheet.

```css
.focused-tool-shell {
  --app-shell-max: 64rem;
}
```

## Utility rail

Use a utility rail for filters, metadata, or contextual actions.

Keep the primary task in the wider column.

Keep the rail between 15rem and 20rem.

Collapse the rail at `60rem`.

Move the rail before the content only when its controls must precede the result in reading order.

Keep source order consistent with the important reading order.

Do not use the rail for primary navigation.

Do not keep the rail visible when it makes the main task too narrow.

## Content canvas

Use `--breakpoint-max-dense`, `90rem`, for dense data and multi-column utility pages.

Use `--breakpoint-max-focused`, `64rem`, for focused tools and content pages.

Keep header, toolbar, page overview, and main content on the same canvas.

Use App Shell `.app-content` for shared canvas math.

Use Layout `.layout-container` for a standalone focused region.

Do not combine different maximum widths on one vertical page axis.

Do not introduce a page-specific global maximum.

## Responsive behavior

Use intrinsic wrapping before a media query.

Use `60rem` for wide content-and-rail collapse.

Use `--breakpoint-compact`, `48rem`, for shell navigation changes.

Use `--breakpoint-narrow`, `37.5rem`, for compact single-column changes.

Use rem units for each breakpoint.

Keep desktop and mobile route sets equivalent.

Keep every action available at narrow widths.

Allow headers to wrap.

Contain horizontal route overflow inside the navigation region.

Do not hide required content.

Do not create page-level horizontal scrolling.

## Shell blur

Use blur only on a sticky shell header or toolbar.

Use `--background-glass` with `--blur-100`.

Keep the semantic background visible when blur is unavailable.

Keep the bottom border visible.

Do not blur the sidebar body.

Do not blur main content.

Do not blur a menu or dialog.

## Consumer CSS

Use consumer CSS for business-specific page composition.

Use local layout names only when a business-specific composition needs them.

Prefer component classes for component appearance.

Keep consumer layout classes limited to placement, width, alignment, and page-level spacing.

Do not override component states from consumer CSS.

Do not copy component internals into consumer CSS.

## Consumer JavaScript

Use Sidebar JavaScript for sidebar behavior.

Use App Shell JavaScript for the App Shell theme trigger.

Use component modules for component behavior.

Keep route state in the consumer.

Do not duplicate Sidebar state logic.

Do not duplicate dialog focus logic.

Do not create a second icon runtime when inline SVG meets the task.

## Acceptance checks

Check that the selected shell matches the route count.

Check that every route uses a link.

Check that only the current route has `aria-current="page"`.

Check that the page has one main landmark.

Check that the skip link reaches main.

Check that visible shell labels do not repeat without purpose.

Check that header and content widths align.

Check that the utility rail collapses at `60rem`.

Check that navigation changes at `48rem`.

Check that compact layout applies at `37.5rem`.

Check that focus remains visible below sticky chrome.

Check the page without JavaScript.

Check the page at 200% zoom.

Check the page at 320px width.
