# Design guidelines

This is the design contract for the expanded Core UI catalog. It applies to `core-ui.css`, `core-ui-components.css`, the optional `core-ui.js` enhancement runtime, and the 64 standalone snippets. `core-ui.css` remains the compatibility foundation for existing consumers. The expanded layer adds the current official shadcn catalog without requiring a framework or build step.

## Contract

- **Native first.** Start with semantic HTML and native controls. JavaScript is progressive enhancement, not a prerequisite for readable content or basic form submission.
- **Two stylesheet layers.** Load `/ui/core-ui.css`, then `/ui/core-ui-components.css`, then service CSS. The first layer preserves existing Core primitives and aliases. The second layer supplies the expanded component contract and may establish the newer square-ish, shadow-free visual policy.
- **Token everything.** Use `--ui-*` role tokens for color, typography, spacing, sizing, radius, focus, and layering. Typography is simple and tokenized. Spacing is based on 4px steps.
- **Monochrome plus semantic status.** Surfaces and controls are monochrome. Use semantic success, warning, danger, and focus roles for status and interaction, not arbitrary service colors.
- **Shape and elevation.** Prefer square-ish radii. Do not add visual `box-shadow` or `text-shadow`. Use blur only for approved overlays such as dialogs, popups, menus, and the catalog overlay. The legacy `--ui-shadow-dialog` compatibility token must not be used by new expanded-layer rules.
- **One status vocabulary.** Status elements use `data-state="ok"`, `warning`, `error`, `running`, or `progress`. These are reserved status values. Other component state should use ARIA and component-specific `data-ui-*` hooks rather than inventing status values.

## Catalog and source

The searchable catalog is `/ui/catalog/index.html`. `catalog/components.json` is the manifest. Its 64 entries are the live official `/docs/components` base-link list fetched 2026-08-13, and the catalog can evolve as that list changes. Every manifest entry has exactly one matching `/ui/snippets/<slug>.html` file, and every snippet exposes its copy-ready fragment between `<!-- core-ui-snippet:start -->` and `<!-- core-ui-snippet:end -->`. A copied fragment requires `/ui/core-ui.css` and `/ui/core-ui-components.css`, plus `/ui/lucide.svg` for icons and optionally `/ui/core-ui.js` for enhancement.

The catalog covers disclosure, navigation, overlays, forms, feedback, content, layout, and data display, including Accordion, Alert, Dialog, Tabs, Popover, Menu families, Listbox/combobox patterns, Calendar, Carousel, Resizable, forms, Toast, Message Scroller, Questionnaire, Data Table, Chart, Toggle, and Toggle Group.

## Behavior hooks and runtime

Use `data-ui-*` hooks such as `data-ui-disclosure`, `data-ui-tabs`, `data-ui-dialog`, `data-ui-popover`, `data-ui-menu`, `data-ui-combobox`, `data-ui-calendar`, `data-ui-carousel`, `data-ui-resizable`, `data-ui-toggle`, and `data-ui-toggle-group`. Markup may also use `data-ui-component` with a manifest slug.

When dynamic markup is inserted, call `CoreUI.enhance(root)`. Call `CoreUI.destroy(root)` before removing an enhanced subtree. The runtime supports disclosures, tabs, dialogs and alert dialogs, sheets and drawers, popups and menus, listbox/combobox-style choices, calendar, carousel, OTP, resizable panes, toggles, slider output, toasts, message scrollers, questionnaires, and sortable/filterable data tables.

## Accessibility and keyboard contracts

- **Focus:** interactive elements retain a visible `:focus-visible` ring. Never remove an outline without an equivalent replacement. Respect `prefers-reduced-motion`.
- **Disclosures:** triggers expose `aria-expanded` and `aria-controls`; controlled content uses `hidden` when closed.
- **Tabs:** use `tablist`, `tab`, and `tabpanel`, with `aria-selected`, `aria-controls`, and roving keyboard focus where applicable. Navigation tabs may use `aria-current="page"`.
- **Dialogs and popups:** dialogs use `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`; close on an explicit close control and Escape. Popovers, hover cards, sheets, and drawers expose their relationship with `aria-controls`, `aria-expanded`, or `aria-describedby`.
- **Menus and listboxes:** use the appropriate `menu`/`menuitem` or `listbox`/`option` roles, `aria-expanded`, `aria-selected`, `aria-checked`, and arrow-key navigation. Do not use a menu role for ordinary page links.
- **Calendar and carousel:** provide an accessible label, selected/current state, and keyboard movement with arrow keys. Carousel controls expose previous/next actions and announce slide changes when content changes.
- **Resizable:** the separator/handle has an accessible name and keyboard increments as well as pointer support.
- **Forms and toasts:** labels are associated with controls, validation is native-first, and non-critical updates use `role="status"` or `aria-live="polite"`; errors use `role="alert"`.
- **Message scroller:** preserve the user's scroll position when they are reading older content and provide an accessible jump-to-latest control.
- **Questionnaire:** expose the current step, validate required fields before advancing, and provide named previous/next controls.
- **Data table and chart:** tables retain captions, header scopes, and sortable `aria-sort`; charts need a text alternative or accessible summary.

## Icons

`lucide.svg` is served from `/ui/lucide.svg`. Use `<use href="/ui/lucide.svg#search" />` with `currentColor` and the icon tokens. Catalog previews are trusted same-origin documents so browsers can load the external local sprite. Their sandbox blocks top navigation and popups, but same-origin preview code can access the catalog parent and must never contain untrusted markup or scripts. Decorative icons are `aria-hidden="true"`; icon-only buttons require an accessible name. Product marks and media illustrations stay in the consuming service.

## Serving and consumers

Mount `/home/core/docker/ui_library` read-only at `/ui`. The requested five consumers are `homelab_ui`, `hf_ui`, `moonlight_ui`, `meili_ui`, and `rss`; `subtitles` also mounts the library and is a consumer. New or migrated services use the `/ui/` prefix. Keep layout and branding with the service.

## Contributing and validation

Add shared behavior or tokens here only when it belongs to the catalog or is shared by multiple consumers. Keep selectors composable, avoid IDs for styling, and preserve compatibility classes in `core-ui.css` unless an explicit migration is approved. Add or update the manifest and matching marked snippet together.

From `/home/core/docker/ui_library`, run `bun tests/catalog-contract.test.js` or `node tests/catalog-contract.test.js`, then `bun tests/runtime-contract.test.js` or `node tests/runtime-contract.test.js`. The catalog test checks assets, 64-entry manifest/snippet parity, source markers, local Lucide references, ARIA hooks, reserved state values, no-shadow/overlay-blur rules, and JavaScript syntax. The runtime test is a small DOM harness, not real browser or assistive-technology validation. A native Node syntax check can run in Alpine with `docker run --rm -v "$PWD:/work" -w /work node:alpine node --check core-ui.js`.

Run `tests/browser-smoke.mjs` when a Chromium DevTools endpoint and `puppeteer-core` are available. It loads the catalog at desktop and mobile widths, checks all standalone snippets for overflow and visible keyboard focus, watches browser console and network errors, and exercises representative dialogs, tabs, choices, date picking, and filtering. It does not replace screen-reader testing.
