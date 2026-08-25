# mewa_ui — Maintainer instructions

You are working on **mewa_ui**, a standalone framework-free component library built on semantic HTML principles, MIT. Its foundations were originally derived from [shadcn-html](https://github.com/codylindley/shadcn-html) at upstream commit `0964e09e` (v0.7.13-alpha) and have since diverged onto their own native-first contract. The consumer-facing system is the repository root: `src/`, `components/`, `docs/`, and the canonical complete application-shell templates in `layouts/`.

## Source-of-truth boundaries

New work must use the current source tree:

- `src/base.css` owns static foundations, font faces, palette primitives, typography, geometry, and browser defaults.
- `src/tokens.css` owns light and dark semantic color roles.
- `src/icons/` owns the local Lucide SVG files.
- `components/` owns the 59 current component folders. Each has a skill (`{name}.md`) and stylesheet (`{name}.css`), with `{name}.js` only when the documented behavior needs a module. `components/app-shell/` owns the shared application chrome primitives and optional theme enhancement.
- `docs/` owns the static reference site, one HTML page per current component.
- `layouts/` is the only canonical home for complete reusable application-shell templates. The current three templates are `layouts/vertical-navbar.html` for a left collapsible rail, `layouts/horizontal-navbar.html` for top navigation, and `layouts/app-shell-sidebar.html` for the branded application shell with a collapsible sidebar and decorative edge accents. `layouts/layouts.css` owns template-only rules and `layouts/layouts.js` provides local icon inlining and the optional theme toggle.

## Project structure

```
ui_library/
├── src/base.css                   ← static foundation
├── src/tokens.css                 ← theme-dependent semantic color tokens
├── src/geist.woff2                ← Geist variable font, 400–550
├── src/geistmono.woff2            ← Geist Mono variable font, 400–550
├── src/icons/                     ← standalone local Lucide SVG files
├── components/                    ← 59 self-contained component folders
│   └── {name}/
│       ├── {name}.md              ← native basis, structure, variants, ARIA, and notes
│       ├── {name}.css             ← component stylesheet
│       └── {name}.js              ← module only when required or explicitly optional
├── docs/                          ← one static page per component plus doc-site scripts
├── layouts/                       ← canonical left-rail and top-navigation templates
└── README.md                     ← consumer guide and complete component inventory
```

The complete component inventory is maintained in `README.md`. It is grouped as Primitives, Actions, Forms and inputs, Data display, Feedback and status, Overlays, Navigation, and Application, matching the purpose groups in `docs/js/layout.js`. It records each component's native basis, JS requirement, skill path, and doc path. Treat that table as the human-readable manifest. Verify it against the actual component directories and docs pages whenever a component changes.

## Visual and motion contract

- The system is monochrome at rest. Red, amber, and green communicate status. Consume semantic roles from `src/tokens.css`, not raw palette values.
- Geometry is square by default. `--border-radius` is zero. The sole full-circle token, `--radius-full`, and explicit 50% circles are reserved for meaningful circular objects such as avatars, radios, progress, and skeleton avatars. Do not add a radius scale or rounded containers.
- Shadows are forbidden in the canonical source. Use `--border-primary` and the other border roles to express separation and elevation. Do not add `box-shadow`, `text-shadow`, shadow tokens, or visual elevation halos.
- The canonical source is motionless. Do not add `animation`, `transition`, smooth scrolling, View Transitions, scroll-driven animation, Web Animations, `@starting-style`, `transition-behavior`, shimmer, or spinning loaders. State changes, disclosure, popovers, dialogs, sheets, tabs, drag updates, and SPA navigation are immediate. If an embedding application adds motion outside this repository, it owns `prefers-reduced-motion` handling.
- Keep `:focus-visible`, `prefers-contrast: more`, `forced-colors: active`, and `prefers-color-scheme` behavior usable. Do not rely on motion, color alone, or a pointer-only affordance to communicate state.
- The only shipped fonts are Geist and Geist Mono from `src/`. Do not introduce serif or remote font dependencies.

## Native web platform first

Start every component from a native element or browser API. If the platform provides the behavior, keep it native and do not write a replacement runtime.

- Use `<dialog>` and `showModal()` for modal surfaces. Use `::backdrop` for the modal scrim.
- Use the Popover API and CSS anchor positioning for popovers, tooltips, dropdown panels, and non-modal top-layer content. Use `popover="hint"` for tooltips.
- Use `<details>/<summary>` for disclosures and accordion items. Use the module only for a documented single-open or coordination behavior.
- Use `commandfor`/`command` or `popovertarget` for declarative trigger wiring when the component skill specifies it. Do not add imperative click handlers for behavior the markup already provides.
- Use `<progress>` for completion and `<meter>` for a scalar measurement in a bounded range.
- Use `<output>` for computed values and status values that belong to a control.
- Use `inert` for non-interactive background content when a native modal does not already provide it.
- Use `loading="lazy"` for non-critical images and iframes, `autofocus` where a dialog or popover needs an initial focus target, `inputmode` and `enterkeyhint` for mobile input hints, and `autocomplete` with the correct field name. Use JavaScript focus only for documented restoration or keyboard coordination.
- Use `<datalist>` for native suggestions where it meets the requirement. Use `disabled` and `readonly` for native form states, not class toggles.
- Use logical properties, CSS Grid, Flexbox, intrinsic sizing, container queries, CSS math, `:has()`, `:is()`, and `:where()` where the implementation needs them. Keep the browser behavior understandable without a framework.

## Accessibility requirements

Keep semantic elements, accessible names, labels, descriptions, IDs, and `aria-*` relationships from the skill examples. Use native keyboard behavior first. Follow the relevant WAI-ARIA pattern only when no native element provides the interaction. Every pointer or drag interaction needs a keyboard path and an announcement or visible status when its result is not otherwise clear. Test focus visibility, keyboard order, 200% zoom, narrow widths, `prefers-contrast: more`, forced colors, and the no-JavaScript fallback where the skill documents one.

## JavaScript contract

JavaScript is only for behavior that HTML and CSS cannot express: keyboard navigation patterns, focus management, state coordination, filtering, positioning hooks, and drag or pointer coordination. Use modern ES modules with no framework and no runtime dependency.

Every component module must be safe to load more than once and must initialize markup added after SPA navigation. A per-element listener loop must use `:not([data-init])` and set `element.dataset.init = ''` as its first operation. Wrap initialization in `init()`, call it once, then observe the document with a `MutationObserver`:

```js
function init() {
  document.querySelectorAll('.my-component:not([data-init])').forEach((el) => {
    el.dataset.init = '';
    el.addEventListener('click', () => { /* … */ });
  });
}

init();
new MutationObserver(init).observe(document, { childList: true, subtree: true });
```

Document-level delegation must use a global guard:

```js
if (!document.__myComponentInit) {
  document.__myComponentInit = true;
  document.addEventListener('click', (event) => { /* … */ });
}
```

Use `Intl` for locale-aware formatting, `CustomEvent` for component communication, `IntersectionObserver` for viewport entry, `ResizeObserver` for size changes, `MutationObserver` for DOM changes, `navigator.clipboard` for clipboard access, `AbortController` for cancellation, `FormData` for form serialization, and `structuredClone()` for deep copies. Do not use animation APIs, focus-trap libraries, positioning libraries, polling loops, manual `innerHeight` calculations, or ad hoc History API routing in component modules. The doc-site-only router is an explicit exception and keeps its existing `pushState`/`popstate` implementation.

## Tokens and CSS architecture

Load `src/base.css` before `src/tokens.css`. The base file contains static primitives such as the Geist faces, color primitives, typography, border widths, spacing, and the zero default radius. The token file contains `:root` light roles and `.dark` dark roles for `--background*`, `--surface-*`, `--text-*`, `--border-*`, and `--chart-*` values. Component stylesheets belong in `@layer components`; typography may also use `@layer base`; token declarations stay outside component layers. Consumer overrides loaded after both foundation files win without editing source tokens.

Do not use literal palette colors or recreate a spacing-token taxonomy inside a component. Use existing semantic roles and the current static dimensions. Keep the square, border-led contract. `--radius-full` is the only shared circular radius token and is not a general component radius API.

## Fleet conventions

Consumer migrations follow the shared conventions documented in `DESIGN.md`: the `48rem` and `37.5rem` rem breakpoint tiers, the `64rem` and `90rem` `--app-shell-max` container presets, the OS-following theme policy with the shared pre-paint snippet and the `app-shell.js` toggle, inline-SVG-first icon loading from `src/icons/`, and the application-JS exemption from the component module init pattern. Do not introduce additional breakpoint tiers, container widths, or theme bootstrap mechanisms.

## Canonical shells

`components/app-shell/` supplies shared header, toolbar, page-overview, inline-status, empty-state, skip-link, and optional OS-aware theme primitives for consumer-owned shells. It does not create a third complete shell template, replace Sidebar, or own application route data. Keep complete reusable left-rail and top-navigation examples under `layouts/`.

### Left collapsible sidebar

The left-sidebar template at `layouts/vertical-navbar.html` uses `components/sidebar/`. Its semantic shell is `.sidebar-layout` with an `<aside class="app-sidebar">` and a `<main>`. The sidebar skill defines one flat labelled `<nav>`, a footer collapse button, `aria-current="page"`, collapsed `data-state`, and an optional mobile `<dialog>`. The template adds a breadcrumb header, workspace content, and optional utility rail around the sidebar. `sidebar.js` synchronizes `aria-expanded`, toggles expanded/collapsed state, supports `Cmd+B`/`Ctrl+B`, and wires the mobile dialog. The footer control remains keyboard reachable in both states. Use Tooltip for optional labels on icon-only collapsed links. Do not re-create a second sidebar implementation in `layouts/`.

### Top navigation

The top-navigation template at `layouts/horizontal-navbar.html` uses `components/layout/` primitives, a semantic `<header>`, and a labelled `<nav>` of native `<a>` routes with an action cluster. Keep route navigation as links, hide decorative icons from assistive technology, and keep layout-only behavior in `layouts/layouts.js`. Use `components/navigation-menu/` only when a layout needs its documented Popover API route group and anchor pairing. Route navigation is not a tablist.

Both shells must be responsive without adding motion. Keep the keyboard path and visible focus at every width. Layout-local CSS and JavaScript belong under `layouts/`, and use current components and tokens.

## Documentation site architecture

The doc site is static and has one HTML page per current component. There is no landing page or `docs/index.html`; serve `docs/` over HTTP and start at `typography.html`. `docs/js/layout.js` loads synchronously, defines `<site-header>` and `<site-nav>`, centralizes `NAV` and `BUILT`, imports destination module scripts before an SPA-style main-content swap, and keeps the swap explicitly instant with no View Transition or other animation. `docs/js/site.js` owns doc-site-only icon loading, copy buttons, table-of-contents links, and page-ready hooks.

Every doc page currently loads the foundation styles and the complete current component CSS list, then the current component modules needed by the doc demos. This is a documentation-site convenience, not the consumer include pattern. When adding a component, add its CSS link and module script to every existing HTML page where the doc-site convention requires them, add the page to `NAV` and `BUILT`, and verify that all referenced files exist. Consumers should load only the assets for the components they use.

Current docs contain copyable HTML examples. They do not use generated CSS or JavaScript source snippets. Do not add a new source-of-truth mechanism that diverges from `components/{name}/{name}.css` or `{name}.js`.

## Adding or changing a component

1. Inspect the current source, the matching README inventory row, and the relevant native element or API before editing.
2. For a new component, create `components/{name}/` with `{name}.md` and `{name}.css`. Add `{name}.js` only when the native basis cannot provide the documented interaction. Keep the skill focused on markup, attributes, ARIA, keyboard behavior, and notes. The CSS and JS files are the implementation source of truth.
3. Before writing a new skill or doc page, review the matching shadcn/ui and Basecoat UI pages for a feature checklist. Review the WAI-ARIA APG, MDN, Open UI, and Base UI references for the native implementation. Prefer the native platform even when a reference site uses a framework.
4. Create `docs/{name}.html` from a current component page. Keep examples sentence case, accessible, motionless, and limited to implemented variants and states.
5. Add the page to `docs/js/layout.js` in the purpose group that matches the inventory. Update both `NAV` and `BUILT`.
6. Add the component stylesheet link to every doc page per the current convention, and add module scripts only to pages whose demos use them. Check relative paths from `docs/`. The SPA router lazy-imports destination modules, so cross-page demos keep working.
7. Update the 59-row README inventory with the exact native basis, JS requirement, skill path, and doc path. Verify the row against the actual directory and files.
8. Check all changed JavaScript with Node syntax checking, serve the doc site over HTTP, and exercise keyboard, focus, narrow-width, forced-colors, and no-JavaScript paths that apply.

Do not silently add a new component family, layout template, token namespace, dependency, or compatibility alias. Raise an ambiguity before choosing a product or architecture boundary that is not supported by the current source.

## Reference sites for new components

Before writing a component skill or documentation page, fetch and review the matching pages on these sites when an applicable page exists. Component names and URL slugs differ between projects. Use the site's component search when the obvious `{name}` URL is not valid, and record an unavailable reference as an evidence gap rather than copying a different pattern. MDN and the WAI-ARIA APG remain the fallback authority for native behavior and keyboard requirements.

1. **shadcn/ui** — `https://ui.shadcn.com/docs/components/{name}`
2. **Basecoat UI** — `https://basecoatui.com/components/{name}/`
3. **WAI-ARIA APG** — `https://www.w3.org/WAI/ARIA/apg/patterns/{name}/`
4. **MDN Web Docs** — `https://developer.mozilla.org/`
5. **Open UI** — `https://open-ui.org`
6. **Base UI** — `https://base-ui.com/react/components/{name}`

Use the first two as a feature checklist and the remaining references for the native and accessibility implementation. Do not copy framework markup. Do not document a feature merely because a reference site has it; confirm that the current mewa_ui source supports it.

## Common pitfalls

- **Inventory drift:** The README table must match the 59 actual component folders, 59 skill files, 59 stylesheets, optional module files, and 59 doc pages.
- **CSS drift:** Keep the skill's variants and states aligned with the stylesheet. The stylesheet is the source of truth for rendered behavior.
- **Import drift:** Every doc page follows the same current foundation and component import convention. Missing imports break cross-page demos silently.
- **Motion drift:** No animation or transition belongs in canonical source. Do not reintroduce reduced-motion fallbacks for motion that should not exist.
- **Dialog centering:** Centered dialogs explicitly need `margin: auto; position: fixed; inset: 0;` in the component stylesheet.
- **Accessibility drift:** Do not remove labels, `aria-*` relationships, native fallback content, keyboard instructions, or visible focus styles.
- **Icon drift:** Icons come from `src/icons/` or inline SVG. Never use the Lucide CDN or a remote sprite.
- **Sentence case:** Use sentence case for headings, labels, skills, doc examples, and inventory descriptions. Keep acronyms such as HTML, CSS, API, and ARIA uppercase.
