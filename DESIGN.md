# mewa_ui design contract

This contract applies only to this standalone repository. The portfolio and service applications may guide visual judgment, but they are not dependencies and must remain untouched.

## Foundations

- Load `src/base.css` first. It owns the Geist faces, static palette primitives, typography, geometry, spacing, border widths, reset, and browser defaults.
- Load `src/tokens.css` second. It owns the light and dark semantic roles for backgrounds, surfaces, text, borders, and charts.
- Interface text uses Geist through the foundation font tokens. Technical output, code, and keyboard notation use Geist Mono.
- Palette primitives remain in OKLCH. Components consume semantic roles from `src/tokens.css`, never raw red, amber, green, or gray steps. Red, amber, and green communicate status.
- Geometry is square by default. `--border-radius` is zero. Use `--radius-full` or an explicit 50% circle only when the object's meaning requires it, such as avatars, radios, progress, or skeleton avatars.
- Elevation is expressed with semantic borders, not shadows. Do not add `box-shadow`, `text-shadow`, shadow tokens, or visual focus halos.
- The canonical source is motionless. Do not add animation, transition, smooth scrolling, View Transitions, scroll-driven effects, Web Animations, shimmer, or spinning loaders. State changes are immediate.
- Keep `:focus-visible`, `:checked`, `:disabled`, `:required`, `:valid`, `:invalid`, `:open`, `:has()`, `prefers-contrast: more`, and `forced-colors: active` behavior usable where applicable. Do not communicate state with color alone.
- Component-local dimensions and spacing are explicit. Do not recreate a semantic spacing-token taxonomy. Dashed structural divisions use `--ui-border-dashed`.

## Native-first markup and behavior

Start with semantic HTML and native controls. Progressive enhancement means the documented markup remains understandable and useful without JavaScript wherever the platform provides a path. Use `<dialog>` and `showModal()` for modal surfaces, the Popover API for popovers and tooltips, `<details>/<summary>` for disclosures, `<progress>` for completion, `<meter>` for bounded measurements, `<output>` for computed status, and native form controls wherever the component skill specifies them.

Use links for navigation and buttons for actions. Preserve native submission, navigation, validation, disclosure, date controls, and dialog or popover semantics. JavaScript modules under `components/{name}/` add only behavior that HTML and CSS cannot express, such as keyboard coordination, filtering, custom calendar navigation, focus restoration, positioning hooks, drag coordination, or live status updates. Modules are modern ES modules, safe to load more than once, and initialize markup inserted after navigation.

Classes are styling hooks. `data-*` attributes are not a general API or compatibility convention: use only attributes documented by the matching `components/{name}/{name}.md` skill and implementation. `data-state` is reserved for meaningful component status. Do not invent undocumented classes, attributes, token names, variants, or events.

Interactive patterns follow their native or documented ARIA keyboard models:

- Disclosures synchronize native `open` or documented `aria-expanded`, `aria-controls`, and `hidden` state.
- Tabs, menus, listboxes, toolbars, trees, and grouped choices implement their documented arrow, Home, End, Escape, and activation behavior.
- Native modal surfaces provide the top layer, focus handling, Escape behavior, backdrop, inert background, and focus restoration. JavaScript supplies only documented trigger or coordination behavior.
- Forms keep explicit labels, descriptions, stable IDs, native constraints, error references, and live status announcements.
- Tables retain captions, scoped headers, and sorting state when their presentation changes.
- Every pointer or drag interaction has a keyboard path and a visible or announced result.

## Components, documentation, and inventory

Each current component lives in `components/{name}/` with `{name}.md` as its markup and accessibility contract, `{name}.css` as its stylesheet, and `{name}.js` only when the documented behavior needs a module. `docs/` contains one static reference page per current component. The page demonstrates the current implementation but is not a second source of truth.

`registry.json` is the machine-readable inventory. Match entries by `slug` and use `requiresJs`, `enhancementJs`, `files`, `docs`, and `nativeBasis` when selecting assets. `README.md` contains the complete 59-row human-readable inventory. `llms.txt` is the concise guide for machine consumption. Copy only documented markup, preserve accessible names and ARIA relationships, and load only the assets required by the registry entry.

`Table` is the structural semantic `<table>` component and remains ordinary HTML without JavaScript. `Data Table` is an optional progressive enhancement around Table, adding documented filtering, sorting, status, and pagination while keeping the table and native links usable without its module.

`Date Field` is a labelled native date or datetime input that delegates calendar editing to the browser. `Date Picker` is the custom accessible month-grid calendar with documented keyboard navigation and date selection. Do not substitute one for the other or infer APIs from their names.

## Icons

Lucide is the primary icon source. Standalone SVG files live in `src/icons/` and inherit `currentColor` with the shared stroke treatment. Use the documented local loader or inline the matching SVG directly. Never use a remote icon CDN. Decorative icons use `aria-hidden="true"`; icon-only controls have a visible or programmatic accessible name.

## Fleet conventions

- Responsive tiers collapse at `max-width: 48rem` and `max-width: 37.5rem`. Use these two rem breakpoints for component and shell adaptation instead of introducing pixel or viewport-unit breakpoints.
- Shell content width uses the two `--app-shell-max` presets: `90rem` for dense data surfaces (the shell default) and `64rem` for focused single-purpose tools. Do not introduce additional container widths.
- Theme policy is OS-following by default with a manual toggle. Consumers ship the shared pre-paint snippet from `components/app-shell/app-shell.md` in `<head>` and load `app-shell.js` for the persisted toggle. Do not hand-roll deferred class-addition theme bootstrapping.
- Icons load by preference: inline the SVG from `src/icons/` first, use the documented local loader second, and never reference a remote icon CDN. JavaScript path-literal icon copies are deprecated and are phased out during consumer migrations.
- Consumer application scripts (a service's `assets/app.js` and equivalents) are exempt from the component module initialization contract. The `:not([data-init])` plus `MutationObserver` pattern binds library component modules only; application scripts coordinate their own state and lifecycle.

## Layouts

`components/app-shell/` provides shared application header, toolbar, page-overview, inline-status, empty-state, skip-link, and optional theme primitives. It does not replace a complete shell template or own application route data.

`layouts/vertical-navbar.html` is the canonical left collapsible navigation shell. It uses the current Sidebar component with `.sidebar-layout`, an `<aside class="app-sidebar">`, one labelled flat `<nav>` of native links, a footer collapse button, `aria-current="page"`, and an optional mobile `<dialog>`. `components/sidebar/sidebar.js` owns collapse state, `aria-expanded`, the `Cmd+B`/`Ctrl+B` shortcut, and mobile dialog wiring.

`layouts/horizontal-navbar.html` is the canonical top-navigation shell. It uses a semantic `<header>`, a labelled `<nav>` of native route links, and an action cluster. Route navigation is not a tablist. `layouts/layouts.css` owns template-only rules, and `layouts/layouts.js` provides local icon inlining and the optional theme toggle. Both shells use current components and tokens, remain responsive, and are immediate and motionless.

The documentation router in `docs/js/layout.js` imports module scripts declared by the destination page before swapping `<main>`. Component modules therefore remain available when SPA navigation enters a page whose enhancement was not loaded on the entry page.

## Validation

- Verify referenced assets and documentation paths against the repository tree before handoff.
- Run `npm test` for the catalog and runtime contract suites.
- Run `npm run test:browser` for the browser smoke checks when Chromium is available.
- Inspect changed markup in a real browser at desktop width, 200% zoom, keyboard-only use, and 320–390 px widths. Check visible focus, native fallback behavior, forced colors, high contrast, and the browser console.
