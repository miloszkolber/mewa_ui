# mewa base

`base/` is the foundation for the UI library: a fork of [shadcn-html](https://github.com/codylindley/shadcn-html), stripped to a square, border-led, shadow-free design system that agents can extend reliably. It is vanilla HTML, CSS, and JavaScript only — no framework, no build step, no React.

The visual contract matches the surrounding library: monochrome, square, border-led, shadow-free, Geist typography. Red, amber, and green communicate state.

## Provenance

- Upstream: [codylindley/shadcn-html](https://github.com/codylindley/shadcn-html)
- Upstream commit: `0964e09e16034e39a244589d457a866171991f1d` (2026-04-19, v0.7.13-alpha)
- License: MIT (see `LICENSE`; the upstream license is retained verbatim)

## What was stripped

- **Radii** — every `--radius-*` token and every `border-radius` declaration that used it, including `calc()` variants and logical-property corner radii. Geometry is square. Circular geometry remains only where meaning requires it: avatars, radios, switches, sliders, progress bars, badges, timeline, steps, skeleton, carousel (`9999px` / `50%`).
- **Shadows** — the `--shadow-*` token scale and every elevation `box-shadow`. Elevated surfaces (dialog, dropdown, tabs) keep a `0 0 0 1px var(--border)` ring. `box-shadow: none` and focus halos built on `var(--ring)` are kept.
- **Serif fonts** — `--font-serif` and the `--font-display` serif stack. The doc site uses self-hosted Geist and Geist Mono only (the Fraunces files were deleted).

What is kept, unchanged from upstream: all color tokens (light + dark, sidebar, chart), `--spacing`, `--tracking-normal`, component markup/APIs, the five-layer skill structure, and the Lucide CDN (to be replaced with a downloaded local package later).

## Structure

```
base/
├── theme/default-semantic-tokens.css   ← design tokens (colors, spacing, tracking)
├── components/                         ← 55 self-contained component folders
│   └── {name}/
│       ├── component-skill.md          ← skill: markup, variants, ARIA, wiring
│       ├── {name}.css                  ← component stylesheet
│       └── {name}.js                   ← interaction JS (only when needed)
├── documentation/                      ← doc site (reference implementations)
├── scripts/                            ← snippet sync scripts (node, no deps)
├── AGENTS.md                           ← maintainer instructions
└── LICENSE                             ← upstream MIT
```

The doc site is static: serve `documentation/` with any static server and open a page. Doc pages embed component CSS/JS in copyable snippets; after editing a component, re-run `node scripts/sync-css-snippets.js` and `node scripts/sync-js-snippets.js` from `base/`.

## Roadmap

1. Port the adapted mewa_ui components into `components/` where they do not duplicate the base (source lives in the repo root: `src/`, `snippets/`, `layouts/`, `catalog/`, `DESIGN.md`, `AUDIT.md`).
2. Adapt tokens (fonts, spacing, palette) to the mewa_ui contract.
3. Replace the Lucide CDN with a downloaded local sprite.
4. Replace `documentation/` with the library's own catalog.