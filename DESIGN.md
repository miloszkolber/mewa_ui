# Core UI design contract

This document defines the new static architecture for the Core UI catalog. It covers only `src/base.css`, `src/components.css`, `src/components.js`, `src/lucide.svg`, and the copy-ready snippets. Existing services may remain on their legacy root asset during migration, but new work uses the `src/` contract.

## Foundations

- **Two CSS files:** `src/base.css` owns reset, typography, layout primitives, focus, tokens, and responsive foundations. `src/components.css` owns component selectors, variants, and component state. There are exactly two canonical CSS files.
- **10-step scales:** define spacing, type, size, radius, and layering as steps 0 through 9. Components consume scale tokens, never one-off values.
- **Semantic mapping:** map neutral surface, text, border, accent, focus, success, warning, danger, and disabled roles to the scale tokens. Components use semantic roles, not raw palette names or service colors.
- **Status vocabulary:** `data-state` may be only `ok`, `warning`, `error`, `running`, or `progress`. Use ARIA and component-specific `data-ui-*` hooks for every other state.
- **Geometry:** use square or near-square geometry with restrained radii. Never add shadows. Blur is allowed only on approved overlays, including dialogs, popovers, menus, sheets, drawers, and catalog overlays.

## Runtime and accessibility

`src/components.js` is progressive enhancement. It must not be required for readable content, native form submission, or basic navigation. Mark dynamic roots with hooks such as `data-ui-disclosure`, `data-ui-tabs`, `data-ui-dialog`, `data-ui-popover`, `data-ui-menu`, `data-ui-combobox`, `data-ui-calendar`, `data-ui-carousel`, `data-ui-resizable`, `data-ui-toggle`, and `data-ui-toggle-group`. Call `CoreUI.enhance(root)` after inserting markup and `CoreUI.destroy(root)` before removing an enhanced subtree.

Interactive elements retain a visible `:focus-visible` indicator and honor `prefers-reduced-motion`. Disclosure triggers expose `aria-expanded` and `aria-controls`, with closed content `hidden`. Tabs use `tablist`, `tab`, `tabpanel`, `aria-selected`, `aria-controls`, and roving focus. Dialogs use `role="dialog"`, `aria-modal="true"`, a labelled title, an explicit close control, and Escape handling. Menus and listboxes use their correct roles, selected/checked state, and arrow-key navigation. Forms associate labels, use native validation, and announce non-critical updates with `role="status"` or `aria-live="polite"`; errors use `role="alert"`. Calendars, carousels, resizable handles, scrollers, questionnaires, tables, and charts provide the labels, keyboard operations, announcements, captions, scopes, sorting state, and text alternatives appropriate to their content.

## Layouts and navigation

There are exactly two supported layouts.

### Vertical rail

Use `<body class="ui-shell ui-shell--rail">` with a direct `<div class="ui-frame">` containing `<nav class="ui-rail" aria-label="Workspace navigation">…</nav>` and `<main class="ui-shell-main">…</main>`. Put the navigation links directly inside `.ui-rail`, use native anchors and `aria-current="page"`, and give every icon-only link an accessible name. Desktop places the rail on the left. Narrow screens move it below the main content as a compact navigation row.

### Horizontal tabs

Use `<body class="ui-shell ui-shell--top">` with a direct `<div class="ui-frame">` containing `<header class="ui-topbar">…</header>` and `<main class="ui-shell-main">…</main>`. The header contains `.ui-topbar-brand` and `<nav class="ui-topnav" aria-label="Workspace navigation">…</nav>`. Links use native anchors and `aria-current="page"`. Narrow screens preserve the bar and allow the route links to scroll without causing page overflow.

## Icons

Every Lucide icon used must first be added as a symbol to `src/lucide.svg`. Use same-origin references such as `<svg aria-hidden="true"><use href="/ui/src/lucide.svg#search" /></svg>` and `currentColor`. Decorative icons are hidden from assistive technology. Icon-only controls have an accessible name. Product marks and media illustrations belong to the consuming service.

## Catalog and serving

The catalog is `/ui/catalog/index.html`; `catalog/components.json` is the manifest and each entry has one matching marked file in `snippets/`. Its `.ui-catalog-*` classes are catalog-specific composition rather than a third reusable layout. Mount `/home/core/docker/ui_library` read-only at `/ui` in Compose. The serving URL is `http://localhost:<published-port>/ui/catalog/`. For local serving run `python3 -m http.server 8080 --directory /home/core/docker/ui_library`; for Compose run `docker compose -f /home/core/docker/meili_ui/docker-compose.yaml up -d` or the relevant consumer file.

## Contribution and validation

Keep shared changes in `src/`, update the manifest and matching snippet together, and preserve semantic HTML and composable selectors. Run `node tests/catalog-contract.test.js` and `node tests/runtime-contract.test.js` from this directory. These are static and DOM-harness checks, not real-browser or screen-reader validation. When a Chromium DevTools endpoint and `puppeteer-core` are available, run `node tests/browser-smoke.mjs` with `CORE_UI_BASE_URL` and `CORE_UI_BROWSER_URL`.
