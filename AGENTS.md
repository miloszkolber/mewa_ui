# mewa_ui — Maintainer Instructions

You are working on the **mewa_ui** design system, a fork of
[shadcn-html](https://github.com/codylindley/shadcn-html) at upstream commit
`0964e09e` (v0.7.13-alpha), MIT. The consumer-facing system lives at the
repository root: `components/`, `src/base.css`, and the `docs/` site.

Radii, shadows, and serif fonts are deliberately removed. Geometry is square;
circular geometry exists only where meaning requires it (avatars, radios,
switches, progress). Elevation is expressed with `--border`, never shadows.

---

## Project structure

```
ui_library/
├── src/base.css                   ← base layer (primitive + semantic tokens; source of truth for colors, spacing, tracking)
├── src/geist.woff2, geistmono.woff2 ← the only fonts (Geist variable, 400–550)
├── src/icons/                         ← the full Lucide icon set (standalone SVGs, no CDN)
├── components/                      ← self-contained component folders
│   └── {name}/
│       ├── {name}.md                ← component skill (HTML structure & ARIA reference)
│       ├── {name}.css               ← component stylesheet (edit directly)
│       └── {name}.js                ← interaction JS (only for interactive components)
├── docs/                            ← doc site (one page per component, no overview page)
│   ├── *.html                       ← component pages (no index.html)
│   ├── css/docs-utilities.css       ← hand-written utility classes for doc pages
│   ├── css/docs-theme.css           ← doc-site font overrides (Geist from src/, not part of the system)
│   ├── css/layout.css               ← doc-site layout (not part of the system)
│   ├── js/layout.js                 ← SPA router, <site-header>/<site-nav> web components
│   ├── js/site.js                   ← doc-site-only JS (copy buttons, skill modal, spec details)
│   ├── js/shiki-highlight.js        ← Shiki-based syntax highlighting (ES module, CDN)
│   └── js/sync-css-snippets.js, sync-js-snippets.js ← snippet sync scripts (node, no deps)
├── legacy/                          ← previous hand-rolled mewa_ui (porting source only)
└── AGENTS.md                        ← this file (maintainer instructions)
```

---

## Critical rules

### Native web platform first

Every component starts from a native HTML element or browser API. If the browser
can do it, we don't write JavaScript for it.

**HTML elements & attributes**

- Use `<dialog>` for modals — not divs with JS show/hide
- Use `popover` API for dropdowns, tooltips, toasts — not JS positioning
- Use `popover="hint"` for tooltips — not `popover="auto"` (hints don't
  close other popovers)
- Use `<details>/<summary>` for accordions — not JS toggle logic
- Use `<details name="group">` for exclusive (single-open) accordions — not
  JS that closes siblings
- Use `commandfor` / `command` attributes for declarative button→dialog/popover
  triggers — not JS click handlers that call `showModal()` or `togglePopover()`
- Use `<progress>` for completion indicators — not div-based progress bars
- Use `<meter>` for scalar values in a range — not custom gauge components
- Use `<output>` for computed/live results — not manual `aria-live` regions
- Use `inert` attribute to disable interaction on background content — not
  JS focus traps or `aria-hidden` toggling
- Use `loading="lazy"` for images/iframes — not JS lazy load libraries
- Use `autofocus` in dialogs/popovers — not JS `.focus()` calls
- Use `inputmode` for mobile keyboard hints — not separate input types
- Use `enterkeyhint` for mobile Enter key labels (`search`, `send`, `go`)
- Use `autocomplete` with proper field names — not custom autofill
- Use `<datalist>` for native type-ahead suggestions — not custom dropdowns
- Use `fetchpriority` for resource priority hints (`high`/`low`)
- Use `disabled` / `readonly` for native form states — not JS class toggling

**CSS**

- Use `@starting-style` + `transition-behavior: allow-discrete` for
  enter/exit animations on `display: none` elements — not JS class toggling
- Use CSS anchor positioning for popover placement — not Floating UI / Popper
- Use `::backdrop` + `backdrop-filter` for dialog/sheet overlays — not
  JS-managed overlay divs or canvas blur
- Use `:has()` for parent-state reactions — not JS class propagation
- Use `:focus-visible` for keyboard-only focus rings — not JS focus detection
- Use `:user-valid` / `:user-invalid` for post-interaction validation
  styling — not JS blur listeners with class toggling
- Use `field-sizing: content` for auto-growing textareas — not JS resize
- Use `oklch()` and relative color syntax for wide-gamut, derived colors — not
  hardcoded hex/hsl palettes
- Use `color-mix(in oklch, ...)` for hover/disabled color derivation — not
  Sass `darken()`/`lighten()` or hardcoded variants
- Use `light-dark()` for inline dark mode values — not media queries or
  class toggles when `color-scheme` is already set
- Use `color-scheme` property for dark mode browser defaults — not all-manual
  dark overrides on every native element
- Use `accent-color` for theming native form controls — not custom replacements
- Use `text-wrap: balance` for headings and labels — not JS text-balancing
- Use `text-wrap: pretty` for body text orphan prevention — not manual `&nbsp;`
- Use `overscroll-behavior: contain` on scroll containers inside overlays — not
  JS scroll-lock libraries
- Use `scroll-snap` for carousel/slider snap points — not JS snap calculations
- Use `scrollbar-gutter: stable` to prevent layout shift from scrollbars — not
  padding hacks
- Use individual transform properties (`rotate`, `scale`, `translate`) — not
  compound `transform` strings
- Use CSS nesting, `@layer`, container queries — not preprocessors
- Use `aspect-ratio` for intrinsic ratios — not padding-bottom hacks
- Use `content-visibility` for expand/collapse transitions — not JS lazy rendering
- Use `interpolate-size: allow-keywords` for animating to `auto` height — not
  JS measurement or `max-height` hacks
- Use `@property` for typed, animatable custom properties — not JS animation
  of CSS values
- Use scroll-driven animations (`animation-timeline: scroll()` / `view()`) for
  scroll-linked effects — not scroll listeners or IntersectionObserver
- Use View Transitions API for smooth DOM state changes — not JS crossfades
- Use `@supports` for CSS feature detection — not Modernizr or JS detection
- Use logical properties (`margin-inline`, `padding-block`) for RTL support — not
  separate LTR/RTL stylesheets
- Use subgrid for aligned child layouts — not manually synchronized columns
- Use dynamic viewport units (`dvh`, `svh`, `lvh`) — not JS `innerHeight` hacks
- Use CSS math functions (`clamp()`, `min()`, `max()`) for responsive sizing — not
  JS resize calculations
- Use `:is()` / `:where()` for selector grouping — not repeated selectors
- Use `hanging-punctuation` for optical quote alignment — not negative text-indent
- Use `@layer` + descriptive prefixed class names (`card-header`, `slider-track`) for
  style scoping — not `@scope` (generic class names lose context for AI generation)
  or Shadow DOM
- Use `@media (scripting)` for no-JS progressive enhancement — not `<noscript>` alone

**Accessibility (REQUIRED)**

- Use `prefers-reduced-motion: reduce` to suppress/simplify all animations — not
  ignoring motion preferences (this is an accessibility requirement, not optional)
- Use `prefers-contrast: more` to increase contrast when requested
- Use `forced-colors: active` to support Windows High Contrast Mode with system colors
- Use `prefers-color-scheme` for automatic dark mode defaults

**JavaScript (only when HTML/CSS cannot express it)**

- Use Web Animations API (`el.animate()`) for imperative animations — not CSS
  class toggling when JS needs to coordinate timing
- Use `Intl` APIs (`DateTimeFormat`, `NumberFormat`, `RelativeTimeFormat`,
  `ListFormat`) for locale-aware formatting — not moment.js or date-fns
- Use native Drag and Drop API for reordering — not SortableJS or drag libraries
- Use `CustomEvent` for component-to-component communication — not framework
  event systems
- Use `element.checkVisibility()` for visibility detection — not manual
  offset calculations
- Use `IntersectionObserver` for viewport-entry detection — not scroll listeners
  with `getBoundingClientRect()`
- Use `ResizeObserver` for element size changes — not window resize listeners
- Use `MutationObserver` for DOM change reactions — not polling loops
- Use `navigator.clipboard` for clipboard access — not `document.execCommand('copy')`
- Use `CloseWatcher` for platform close signals in custom UI — not manual
  Escape key listeners
- Use `AbortController` for canceling fetches/listeners — not boolean flags
- Use `FormData` for form serialization — not manual value collection loops
- Use `structuredClone()` for deep cloning — not `JSON.parse(JSON.stringify())`
- Use `ElementInternals` for custom form elements — not hidden input proxies
- Use Navigation API for SPA routing — not History API hacks

JavaScript is only for behavior that HTML and CSS cannot express: keyboard
navigation patterns, focus management, and state coordination between elements.
Use modern ECMAScript (ES modules, arrow functions, `const`/`let`, etc.) —
no libraries, no frameworks.

All `querySelectorAll` loops that add event listeners **must** guard against
double-initialization using `:not([data-init])` in the selector and setting
`element.dataset.init = ''` as the first line inside the loop.

Component JS files wrap initialization in an `init()` function, call it once,
then use a `MutationObserver` to auto-initialize new elements after SPA
navigation or dynamic DOM changes:

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

For document-level event delegation (no per-element loop), use a global flag:
```js
if (!document.__myComponentInit) {
  document.__myComponentInit = true;
  document.addEventListener('click', (e) => { /* … */ });
}
```

### Each component is a self-contained folder

Each component at `components/{name}/` contains:
- `{name}.md` — component skill: HTML structure, attributes, ARIA, and usage notes
- `{name}.css` — the component stylesheet (edit directly)
- `{name}.js` — interaction JS (only for interactive components, edit directly)

The component skill `{name}.md` file documents **how to build the HTML**. The `.css` and `.js` files
are the actual implementation — edit them directly, no build step needed.

### Tokens are the source of truth for design values

`src/base.css` defines all CSS custom properties. These must match
the shape of tweakcn.com theme exports so color themes are drop-in compatible.

The token file provides:
- Primitive color tokens (Tailwind v4 palette: red, amber, green, neutral, black, white)
- Semantic color pairs (surface + foreground) for light and dark modes
- Font stacks (generic sans + mono — overridden by the doc site; serif removed)
- Spacing and tracking

Radii, shadows, and serif fonts were deliberately removed in this fork. Never
reintroduce `--radius-*`, `--shadow-*`, or serif font tokens; components must
stay square and border-led.

### Documentation site architecture

The doc site is fully static. Serve `docs/` with any static
server (e.g. `python3 -m http.server` or `bunx serve`) and open a page.

The doc site is a **SPA-style multi-page app** with no landing/overview page. `layout.js` loads synchronously in
`<head>` and provides:

- `<site-header>` — renders the fixed header (brand, dark mode toggle)
- `<site-nav>` — renders the sidebar from a centralized `NAV` array, auto-detecting the active page
- **SPA router** — intercepts nav clicks, fetches HTML, swaps `<main>` content
  without full-page reloads (uses View Transitions API for smooth crossfade)

**Sidebar nav is centralized in `layout.js`.** To add or reorder nav links, edit
the `NAV` array and the `BUILT` set in that one file — individual HTML pages
do not contain nav markup.

Each HTML page duplicates the full list of component CSS `<link>` tags in `<head>`
and component JS `<script>` tags at end of `<body>`. When adding a new component,
these imports must be added to **every** HTML file.

---

## Using the system

### Include pattern

Link `src/base.css` first, then the stylesheets of only the components you use:

```html
<link rel="stylesheet" href="src/base.css">
<link rel="stylesheet" href="components/button/button.css">
<link rel="stylesheet" href="components/dialog/dialog.css">
<!-- JS — only when the component needs it -->
<script type="module" src="components/dialog/dialog.js"></script>
```

Read the component skill, copy the HTML pattern, fill in your content. Serve over
HTTP — ES modules do not run from `file://`.

### Icons

All icons ship locally as standalone SVGs in `src/icons/`. Write
`<i data-lucide="name">` and let the doc site's loader in `docs/js/site.js`
fetch `src/icons/{name}.svg` and inline it at page load — no CDN. Consumers
must never load the Lucide CDN; copy the loader or inline the SVG directly.

### Theming

All design values live in `src/base.css` as `:root` (light) and `.dark` (dark)
custom properties, in the tweakcn.com export format. Swap both blocks with an
exported theme and every component updates instantly. To override individual
tokens, add a stylesheet *after* the tokens link.

### Dark mode

Add or remove `class="dark"` on the `<html>` element. Every token switches
automatically via `color-scheme` and the `.dark` block. The doc site header
toggle shows the pattern: a `prefers-color-scheme` media query for the default,
`localStorage` for the user's manual choice, and a button that flips the class.

### Data attribute API

Components are configured with `data-*` attributes instead of props:
`data-variant`, `data-size`, `data-state`, and component-specific ones like
`data-ratio`. The CSS and JS react to these attributes directly, so markup is
the only API. Each component skill documents its attributes.

### CSS architecture

Component stylesheets live in `@layer components` (typography additionally uses
`@layer base`); tokens are plain custom properties outside any layer. Author
overrides outside the layers always win.

### Visual contract

- Semantic color pairs (surface + foreground) from `src/base.css`; red, amber,
  and green communicate status.
- Focus rings via `--ring` with `:focus-visible`. All animation respects
  `prefers-reduced-motion`, `prefers-contrast: more`, and `forced-colors: active`.
- Keep native form submission and fallback behavior. Do not remove labels,
  `aria-*` relationships, live regions, or keyboard instructions. Provide a
  keyboard path for drag or pointer interactions.
- Keep the square, border-led contract: no radii, no shadows, circular geometry
  only where meaning requires it.

---

## Adding a new component

### Reference sites (REQUIRED)

Before writing any component skill or documentation page, **fetch and review** the component on these sites:

#### Feature checklist (what to build)
1. **shadcn/ui** → `https://ui.shadcn.com/docs/components/{name}`
2. **Basecoat UI** → `https://basecoatui.com/components/{name}/`

These define the completeness bar. Every variant, size, state, and composition pattern
shown on those pages must be accounted for in the component skill and doc page — adapted
to our semantic HTML / CSS custom property / vanilla JS model. Do not copy their markup;
use them as a feature checklist.

#### Native implementation (how to build it)
3. **WAI-ARIA APG** → `https://www.w3.org/WAI/ARIA/apg/patterns/{name}/` — canonical keyboard navigation and ARIA patterns
4. **MDN Web Docs** → `https://developer.mozilla.org/` — authoritative reference for HTML elements, CSS properties, and JS APIs
5. **Open UI** → `https://open-ui.org` — W3C community group defining native component standards
6. **Base UI** → `https://base-ui.com/react/components/{name}` — headless component architecture (closest to our approach in spirit)

Always prefer native browser APIs over JS workarounds. Check MDN for the latest
support status of newer APIs (`popover`, anchor positioning, `@starting-style`, etc.).

### Steps

1. **Create the component folder** → `components/{name}/`

2. **Write the component skill** → `components/{name}/{name}.md`
   - Follow the template: Native basis → Native Web APIs → Structure → Variants → Sizes → ARIA → Notes
   - Documents the HTML pattern, not CSS/JS (those are the actual files)
   - Cross-check variants, sizes, and states against the reference sites above

3. **Write the CSS** → `components/{name}/{name}.css`
   - Edit directly — no build step

4. **Write the JS** (if interactive) → `components/{name}/{name}.js`
   - Plain ES module — wrap initialization in an `init()` function
   - Call `init()` immediately, then add `new MutationObserver(init).observe(document, { childList: true, subtree: true });`
   - This auto-initializes new elements after SPA navigation or dynamic DOM changes
   - No `export`, no `window.onPageReady` — just the init function + MutationObserver

5. **Create the doc page** → `docs/{name}.html`
   - Copy an existing component page as template (e.g., badge.html)
   - Add `<link rel="stylesheet" href="../components/{name}/{name}.css">` to the head
   - Add `<script type="module" src="../components/{name}/{name}.js"></script>` if interactive
   - Replace demo content with working examples

6. **Update layout.js** → add the component to the `NAV` array and `BUILT` set
   in `docs/js/layout.js` (this is the single source of truth for sidebar nav)

7. **Add CSS/JS imports to all HTML pages** → add the new component's `<link>` and
   `<script>` tags to every HTML file in `docs/`

8. **Sync inline source snippets** → run `node docs/js/sync-css-snippets.js` and
    `node docs/js/sync-js-snippets.js` to replace the inline `<pre><code>` blocks in
    every doc page with the actual contents of each component's `.css` and `.js` files.
    This must be done after any change to a component's CSS or JS — not just for new components.

---

## Common pitfalls

- **Dialog/Sheet centering**: Always set `margin: auto; position: fixed; inset: 0;`
  explicitly for centered dialogs.
- **CSS drift**: If the component skill's variant/size tables don't match the `.css` file,
  update the component skill to stay in sync — the `.css` file is the source of truth for styles.
- **CSS/JS import drift**: When adding a component, you must add its `<link>` and
  `<script>` tags to ALL HTML pages. Missing imports cause components in cross-page
  demos to break silently.
- **SPA re-initialization**: Component JS modules use `MutationObserver` to
  auto-initialize new elements when the DOM changes — no manual re-import needed.
  Doc-site-only scripts (site.js) use `window.onPageReady(fn)` for their own re-init.
- **Font stacks**: The system tokens use generic font stacks. The doc site overrides
  them in `css/docs-theme.css`. Don't put custom fonts in `src/base.css`.
- **Icons**: All icons ship locally in `src/icons/` — never load the Lucide CDN.
  The doc site inlines `src/icons/{name}.svg` for `<i data-lucide="name">` via `js/site.js`.
- **Sentence case**: Use sentence case for every heading and label in docs, skills,
  and demo content (first word capitalized, rest lowercase; acronyms like HTML, CSS,
  API, ARIA stay uppercase).
- **Inline source snippet drift**: Doc pages show the component's CSS and JS in
  `<pre><code>` blocks. These must always match the actual files. After editing any
  component `.css` or `.js`, run `node docs/js/sync-css-snippets.js` and
  `node docs/js/sync-js-snippets.js` to update all doc pages automatically.

