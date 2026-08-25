# Layouts

Use this file to select and compose a complete page shell.

Read `DESIGN.md` before this file.

Read `system/patterns.md` before you add page content.

## Ownership model

App Shell is a component.

Sidebar is a component.

A layout is a complete composition.

App Shell owns shared header, toolbar, page overview, content canvas, status, empty-state, and optional theme primitives.

Sidebar owns the collapsible desktop rail and mobile dialog behavior.

`layouts/layouts.css` owns template-only page composition.

`layouts/layouts.js` owns local template icon loading and the optional template theme toggle.

A consumer owns routes, account data, application state, and business content.

Do not copy component behavior into a layout script.

Do not add a layout-only variant to a component class.

Do not restyle a component internal element unless the component contract documents the composition hook.

## Layout families

Use the sidebar family for applications with several persistent work areas.

Use the top-navigation family for a small number of primary destinations.

The repository has two layout families.

The repository has three reference HTML files.

`vertical-navbar.html` represents the utility sidebar family.

`horizontal-navbar.html` represents the top-navigation family.

`app-shell-sidebar.html` represents a branded sidebar composition.

Do not describe the branded sidebar composition as a third family.

## Sidebar family

Use Sidebar as the navigation primitive.

Use one labelled flat navigation list.

Use native links for routes.

Use `aria-current="page"` on the current route.

Use the footer control for desktop collapse.

Use the mobile dialog below the shell breakpoint.

Keep the main region next to the desktop sidebar.

Use a sticky local toolbar when the page needs breadcrumbs and local actions.

Use App Shell page overview and content patterns inside main.

Keep the sidebar and page content on one continuous canvas.

Do not use nested route groups unless a documented navigation need requires them.

Do not use tab roles for route navigation.

Do not duplicate the full product brand in two visible shell regions.

## Utility sidebar reference

Use `layouts/vertical-navbar.html` for a service or utility application.

Use the sidebar header for the product or workspace identity.

Use the local sticky toolbar for breadcrumbs, account access, and page tools.

Use the page intro to state the current task.

Use the utility rail only when secondary controls remain useful beside the main task.

Collapse the utility rail at `60rem`.

Open mobile navigation at `48rem`.

Apply compact single-column rules at `37.5rem`.

## Branded sidebar composition

Use `layouts/app-shell-sidebar.html` when a global product header must remain visible above the workspace.

Let the global header own the product brand.

Let the sidebar header identify the current workspace or navigation scope.

Keep the global header and sidebar labels different.

Use the global header for account access and global actions.

Use the sidebar for workspace routes.

Use App Shell `.page-overview` inside main.

Do not add a second sticky local toolbar below the global header.

Do not repeat the same action in the global header and page overview.

Do not repeat the same product name in the global header and sidebar header.

## Top-navigation family

Use a semantic header.

Use one labelled navigation landmark.

Use native links for destinations.

Use an action cluster at the inline end.

Keep the current route visible with `aria-current="page"`.

Keep top navigation horizontally scrollable when the route set cannot wrap cleanly.

Use a 64rem canvas for focused content.

Use App Shell content primitives when the page is an application.

Use normal document sections when the page is editorial.

Do not use tab roles for route navigation.

Do not add a sidebar to the top-navigation reference.

## Horizontal reference scope

Use `layouts/horizontal-navbar.html` as the top-navigation composition reference.

Treat the current profile content as example content.

Treat the header and route structure as the reusable part.

Replace the example content for a utility service.

Keep the shared shell rules when the content changes.

Do not infer a portfolio component API from the example sections.

Do not move profile-specific classes into App Shell.

## Header selection

Use `.app-header` for a reusable application header.

Use `.app-toolbar` for a reusable local toolbar.

Use `.layout-app-header` only inside the sidebar layout reference.

Use `.layout-top-header` only inside the top-navigation reference.

Do not stack `.app-header` and `.app-toolbar` at the same sticky offset.

Do not stack two account menus.

Do not place the same brand link in adjacent shell regions.

## Content canvas

Use a 90rem canvas for dense data and multi-column utility pages.

Use a 64rem canvas for focused tools and content pages.

Keep header, toolbar, page overview, and main content on the same canvas.

Use App Shell `.app-content` for shared canvas math.

Use Layout `.layout-container` for a standalone focused region.

Do not combine different maximum widths on one vertical page axis.

Do not introduce a page-specific global maximum.

## Utility rail

Use a utility rail for filters, metadata, or contextual actions.

Keep the primary task in the wider column.

Keep the rail between 15rem and 20rem.

Collapse the rail at `60rem`.

Move the rail before the content only when its controls must precede the result in reading order.

Keep the source order consistent with the important reading order.

Do not use the rail for primary navigation.

Do not keep the rail visible when it makes the main task too narrow.

## Responsive behavior

Use intrinsic wrapping before a media query.

Use `60rem` for wide content-and-rail collapse.

Use `48rem` for shell navigation changes.

Use `37.5rem` for compact single-column changes.

Use rem units for each breakpoint.

Keep desktop and mobile route sets equivalent.

Keep every action available at narrow widths.

Allow headers to wrap.

Contain horizontal route overflow inside the navigation region.

Do not hide required content.

Do not create page-level horizontal scrolling.

## Shell blur

Use blur only on a sticky shell header or toolbar.

Use `--background-glass` with `--blur-01`.

Keep the semantic background visible when blur is unavailable.

Keep the bottom border visible.

Do not blur the sidebar body.

Do not blur main content.

Do not blur a menu or dialog.

## Layout-local CSS

Use the `layouts` cascade layer.

Use `layout-` class names for template-only hooks.

Use component classes for component appearance.

Use layout classes only for placement, width, alignment, and page-level spacing.

Keep normal component states in the component stylesheet.

Keep forced-colors rules for layout-specific boundaries.

Do not add raw colors.

Do not add shadows.

Do not add transitions.

Do not add a general utility framework.

## Layout-local JavaScript

Use local SVG loading only when the template uses the documented loader hook.

Use the optional theme toggle only when the template includes its trigger.

Use Sidebar JavaScript for sidebar behavior.

Use App Shell JavaScript for the App Shell theme trigger.

Do not duplicate Sidebar state logic.

Do not duplicate dialog focus logic.

Do not add route state that belongs to the consumer.

## Template content

Use realistic content that demonstrates the shell.

Keep demo data generic.

Use one primary task.

Use one representative table or row list.

Use one representative empty, error, or loading state only when it clarifies the shell.

Keep dates valid and stable.

Do not include a visual bug in demo markup.

Do not use a consumer-specific class as a library API.

Do not make example content look like a required product model.

## Acceptance checks

Check that the selected family matches the route count.

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

Check the template without JavaScript.

Check the template at 200% zoom.

Check the template at 320px width.
