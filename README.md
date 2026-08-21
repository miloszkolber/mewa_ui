# mewa_ui

The UI library: a fork of [shadcn-html](https://github.com/codylindley/shadcn-html), stripped to a square, border-led, shadow-free design system built with vanilla HTML, CSS, and JavaScript only — no framework, no build step.

The visual contract is monochrome, square, border-led, and shadow-free, with Geist typography. Red, amber, and green communicate state. Circular geometry exists only where meaning requires it (avatars, radios, switches, progress).

## Provenance

- Upstream: [codylindley/shadcn-html](https://github.com/codylindley/shadcn-html)
- Upstream commit: `0964e09e16034e39a244589d457a866171991f1d` (2026-04-19, v0.7.13-alpha)
- License: MIT (see `LICENSE`; the upstream notice is retained alongside the fork's)

## What was stripped

- **Radii** — every `--radius-*` token and every `border-radius` declaration that used it, including `calc()` variants and logical-property corner radii. Geometry is square. Circular geometry remains only where meaning requires it: avatars, radios, switches, sliders, progress, badges, timeline, steps, skeleton, carousel (`9999px` / `50%`).
- **Shadows** — the `--shadow-*` token scale and every elevation `box-shadow`. Elevated surfaces (dialog, dropdown, tabs) keep a `0 0 0 1px var(--border-primary)` ring. `box-shadow: none` and focus halos built on `var(--border-ring)` are kept.
- **Serif fonts** — `--font-serif` and the `--font-display` serif stack. The only fonts are `src/geist.woff2` and `src/geistmono.woff2` (Geist variable, 400–550).

What is kept, unchanged from upstream: component markup/APIs and the five-layer skill structure. Static primitives live in `src/base.css`; theme-dependent semantic color roles live in `src/tokens.css`. The Lucide CDN is retired — the full icon set ships locally in `src/icons/`.

## Structure

```
ui_library/
├── src/base.css                   ← static foundation (palette, fonts, typography, geometry)
├── src/tokens.css                 ← theme-dependent semantic color tokens
├── src/geist.woff2, geistmono.woff2 ← the only fonts
├── src/icons/                        ← the full Lucide icon set (standalone SVGs, no CDN)
├── components/                      ← 55 self-contained component folders
│   └── {name}/
│       ├── {name}.md                ← skill: markup, variants, ARIA, wiring
│       ├── {name}.css               ← component stylesheet
│       └── {name}.js                ← interaction JS (only when needed)
├── docs/                            ← doc site (one page per component, no overview)
│   └── js/                          ← layout, site JS, and snippet sync scripts (node, no deps)
├── legacy/                          ← previous mewa_ui (porting source only)
└── AGENTS.md                        ← maintainer instructions
```

## Use

```html
<link rel="stylesheet" href="/ui/src/base.css">
<link rel="stylesheet" href="/ui/src/tokens.css">
<link rel="stylesheet" href="/ui/components/button/button.css">
<!-- Icons: fetch src/icons/{name}.svg and inline it for <i data-lucide="name"> -->
```

Components are configured with `data-*` attributes (`data-variant`, `data-size`, `data-state`, ...) — markup is the only API. Read the component's `{name}.md` skill for the HTML pattern, attributes, and ARIA requirements. Load a component's `<script type="module" src=".../{name}.js">` only when the component folder contains one; interaction alone does not imply a runtime dependency because native controls stay native.

Icons: write `<i data-lucide="name">` and inline the matching SVG from `src/icons/` (the doc site's `js/site.js` shows a fetch-and-inline loader). Never load the Lucide CDN.

Dark mode: add or remove `class="dark"` on `<html>`. The semantic values in
`src/tokens.css` switch automatically.

Semantic color roles are separated by purpose: `--background*` for page backdrops, `--surface-*` for containers and state fills, `--text-*` for content, `--border-*` for outlines and focus rings, and `--chart-1` through `--chart-5` for data visualization. The canonical roles include primary, secondary, muted, disabled, inverted, positive, negative, and caution variants without foreground-style aliases.

## Documentation

The doc site is static: serve `docs/` with any static server (e.g. `python3 -m http.server` or `bunx serve`) and open a page (there is no `index.html`; start at `typography.html`). It is a SPA-style multi-page app — one page per component, no overview page. Doc pages embed component CSS/JS in copyable snippets; after editing a component, re-run `node docs/js/sync-css-snippets.js` and `node docs/js/sync-js-snippets.js` from the repository root.

## Roadmap

1. Port adapted mewa_ui components into `components/` where they do not duplicate the base (source lives in `legacy/`).
2. Adapt tokens (fonts, spacing, palette) to the mewa_ui contract.
3. ~~Replace the Lucide CDN with a downloaded local sprite~~ — done: the full set ships in `src/icons/`.
4. Retire `legacy/` once the ports are complete.

---

# Legacy reference (mewa_ui)

`mewa_ui` was a standalone component library for personal services: semantic HTML, vanilla CSS, optional JavaScript, and a local Lucide SVG sprite. It remains in `legacy/` untouched as the porting source. The repository has a dev-only package contract for repeatable browser testing.

## Canonical assets (legacy paths)

- `legacy/src/base.css` — six OKLCH palettes, semantic color roles, typography, geometry, focus, reset, and browser primitives.
- `legacy/src/mewa.css` — production component structures, variants, states, utilities, and responsive behavior.
- `legacy/src/components.js` — progressive enhancement with `enhance()` and `destroy()` lifecycle methods.
- `legacy/src/lucide.svg` — same-origin Lucide symbols.
- `legacy/src/demo.css` — catalog and standalone snippet presentation only; consuming applications do not load it.
- `legacy/catalog/` — searchable, preview-only component reference (superseded by `docs/`).
- `legacy/snippets/` — complete documents with reusable fragments marked by stable comments.
- `legacy/layouts/` — complete application compositions built from one vertical/horizontal shell contract.

The root `core-ui.css` remains only as a legacy migration reference. New work uses `src/base.css`, `src/tokens.css`, and `components/`.

## Use (legacy)

```html
<link rel="stylesheet" href="/ui/legacy/src/base.css">
<link rel="stylesheet" href="/ui/legacy/src/mewa.css">
<script src="/ui/legacy/src/components.js" defer></script>
```

For dynamically inserted markup call `MewaUI.enhance(container)`; before permanently removing an enhanced subtree call `MewaUI.destroy(container)`. Custom events use the `mewa-ui:*` namespace. Lucide icons reference the local sprite; decorative icons stay hidden from assistive technology and icon-only controls need an accessible name.

## Foundation (legacy)

Body scale is 12, 14, and 16 px; headings 16, 24, and 32 px. Line heights are 1.25 and 1.61, weights 400 and 550, tracking zero. All six palettes share the same theme-specific 11-step `050`–`950` role map: gray, alpha white, alpha black, red, amber, and green. Steps `050`–`100` are surfaces, `200`–`300` are hover and active backgrounds, `400` is the subtle-border step, and `500`–`950` form an APCA contrast ladder. Components consume generalized semantic roles rather than palette steps.

## Catalog and layouts (legacy)

Mount the repository at `/ui` and open `/ui/legacy/catalog/` for previews. The documentation for the current system lives in `docs/`.

- [Vertical navigation](legacy/layouts/vertical-navbar.html)
- [Vertical navigation with right utility rail](legacy/layouts/vertical-navbar-utility-end.html)
- [Vertical navigation with left utility rail](legacy/layouts/vertical-navbar-utility-start.html)
- [Collapsed vertical navigation](legacy/layouts/vertical-navbar-collapsed.html)
- [Horizontal navigation](legacy/layouts/horizontal-navbar.html)
- [Operations workspace](legacy/layouts/operations-workspace.html)

## Validate (legacy)

Install the locked dev-only browser driver, then run from the repository root:

```sh
pnpm install --ignore-scripts
pnpm test
```

`pnpm test:browser` adds catalog, six-layout, and component desktop/mobile geometry, focus, interaction, and visual-state checks when the documented local server and Chromium debugging endpoints are available. Static checks do not replace keyboard, zoom, reduced-motion, forced-colors, or screen-reader review. See [DESIGN.md](DESIGN.md) for the legacy contribution contract.
