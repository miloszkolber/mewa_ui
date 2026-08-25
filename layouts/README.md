# Layout templates

This directory contains complete reference compositions.

Read `../DESIGN.md` before you copy a template.

Read `../system/layouts.md` before you change a template.

## Layout families

The library has two shell families.

The sidebar family supports persistent application navigation.

The top-navigation family supports a small number of primary destinations.

## Reference files

`vertical-navbar.html` is the utility sidebar reference.

`horizontal-navbar.html` is the top-navigation reference.

`app-shell-sidebar.html` is a branded sidebar composition.

`layouts.css` contains template-only composition rules.

`layouts.js` contains local icon loading and the optional template theme toggle.

The three HTML files are serveable examples.

The three HTML files do not define three shell families.

## App Shell relationship

App Shell supplies reusable application chrome and page-region primitives.

Sidebar supplies collapsible desktop and mobile navigation behavior.

A template composes these components into a complete page.

A template must not duplicate component behavior.

A template must not create a new component API.

Use App Shell `.page-overview` and `.app-content` when the composition needs the shared application canvas.

Use Sidebar classes and `sidebar.js` for collapsible navigation.

## Sidebar references

Use `vertical-navbar.html` for a normal utility service.

Use its local toolbar for breadcrumbs, account access, and page actions.

Use `app-shell-sidebar.html` when a global product header must remain above the workspace.

Let the global header own the product brand.

Let the sidebar header identify the workspace.

Do not repeat the full product brand in both regions.

## Top-navigation reference

Use `horizontal-navbar.html` for a flat route set.

Keep route navigation as native links.

Use `aria-current="page"` on the current route.

Treat the current profile content as example content.

Replace the example content when the consumer is a utility service.

Do not use tab roles for route navigation.

## Responsive rules

Use `60rem` to collapse a wide main-and-rail composition.

Use `48rem` to change shell navigation.

Use `37.5rem` for compact single-column behavior.

Use a 90rem canvas for dense utility pages.

Use a 64rem canvas for focused tools and content pages.

Keep the page usable at 320px width.

Keep the page usable at 200% zoom.

## Copy procedure

1. Copy one HTML reference.
2. Keep the foundation load order.
3. Remove unused component stylesheets.
4. Replace demo routes and content.
5. Keep the documented shell classes.
6. Keep the skip link and main target.
7. Load only the required modules.
8. Test the keyboard path.
9. Test the narrow layout.
10. Test the no-JavaScript path.

Do not copy a component module into `layouts.js`.

Do not add consumer business logic to this directory.
