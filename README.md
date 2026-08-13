# mewa_ui

`mewa_ui` is a standalone, dependency-free component library for personal services. It ships semantic HTML, vanilla CSS, optional JavaScript, and a local Lucide sprite. There is no Tailwind, framework, package install, or frontend build step. All interface text uses the system monospace stack.

The visual language is intentionally narrow: monochrome, square, border-led, and shadow-free. Red, yellow, and green are reserved for meaningful status communication. Surfaces use translucent blur only when they overlap other content.

## Canonical assets

- `src/base.css` — compact color and type tokens, reset, focus, and browser primitives.
- `src/components.css` — component structures, variants, states, and responsive behavior.
- `src/components.js` — progressive enhancement and lifecycle methods.
- `src/lucide.svg` — same-origin Lucide symbols used by snippets.
- `catalog/` — searchable live reference with a compact preview, description, and copyable marked fragment for every component.
- `snippets/` — 75 complete, copy-ready component documents.
- `layouts/` — complete vertical-navigation and horizontal-navigation application templates.

The root `core-ui.css` is preserved as a legacy migration reference. New work should use only the four `src/` assets above. The portfolio website is not a dependency or part of this repository.

## Foundation

The body scale is 12, 14, and 16 px. The heading scale is 16, 20, 24, and 32 px. Line heights are 1.2, 1.4, and 1.6; font weights are 400 and 500. Component spacing stays local instead of being disguised behind a large semantic spacing scale.

Four color scales support the visual system: monochrome plus red, yellow, and green. Components consume semantic roles such as surface, border, text, danger, warning, and success. `data-state` is limited to `ok`, `warning`, `error`, `running`, and `progress`.

## Use

```html
<link rel="stylesheet" href="/ui/src/base.css">
<link rel="stylesheet" href="/ui/src/components.css">
<script src="/ui/src/components.js" defer></script>
```

Copy the marked fragment from a catalog example. JavaScript is optional for static components and progressive enhancement for interactive ones. If markup is inserted dynamically, call:

```js
MewaUI.enhance(container);
```

Call `MewaUI.destroy(container)` before removing a long-lived enhanced subtree. Runtime events use the `mewa-ui:*` namespace.

Lucide icons are served from the local sprite:

```html
<svg aria-hidden="true"><use href="/ui/src/lucide.svg#search"></use></svg>
```

Add a symbol to `src/lucide.svg` before referencing a new icon. Decorative icons stay hidden from assistive technology; icon-only controls require an accessible name.

Alert includes both inline status messages and the blocking confirmation variant. Buttons include bordered, filled, destructive, and borderless ghost variants. Autocomplete, Checkbox Group, Lightbox, Sortable List, Split Button, and Time Field include their keyboard and live-announcement behavior in the shared runtime.

## Serve the catalog

The library expects to be mounted at `/ui`. One local option is:

```sh
python3 -m http.server 8080 --directory /path/to/parent
```

Open `http://localhost:8080/ui/catalog/` when the repository directory is named `ui` under that parent. In a service deployment, mount this repository read-only at `/ui`; deployment configuration remains with the consuming service.

## Validate

Run from the repository root:

```sh
node tests/catalog-contract.test.js
node tests/runtime-contract.test.js
```

The optional Chromium suite uses `MEWA_UI_BASE_URL`, `MEWA_UI_BROWSER_URL`, and `MEWA_UI_SCREENSHOT_DIR`. Static checks do not replace browser, keyboard, zoom, or screen-reader review.

See [AUDIT.md](AUDIT.md) for the coverage review and [DESIGN.md](DESIGN.md) for the contribution contract.
