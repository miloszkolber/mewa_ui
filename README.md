# mewa_ui

`mewa_ui` is a standalone component library for personal services: semantic HTML, vanilla CSS, optional JavaScript, and a local Lucide SVG sprite. It has no framework, Tailwind, package-install, or build-step dependency.

The visual contract is monochrome, square, border-led, and shadow-free. Red, amber, and green communicate state. Blur is reserved for surfaces that overlap content. Geist is the primary interface family through the `geist` token, with a generic sans-serif fallback.

The portfolio and service interfaces that informed the visual direction remain separate projects. They are references, not dependencies, and are never modified as part of this library.

## Canonical assets

- `src/base.css` — six OKLCH palettes, semantic color roles, typography, geometry, focus, reset, and browser primitives.
- `src/mewa.css` — production component structures, variants, states, utilities, and responsive behavior.
- `src/components.js` — progressive enhancement with `enhance()` and `destroy()` lifecycle methods.
- `src/lucide.svg` — same-origin Lucide symbols.
- `src/demo.css` — catalog and standalone snippet presentation only; consuming applications do not load it.
- `catalog/components.json` — machine-readable public inventory and behavior metadata.
- `catalog/` — searchable, preview-only component reference.
- `snippets/` — 70 complete documents with reusable fragments marked by stable comments.
- `layouts/` — complete vertical- and horizontal-navbar application templates.
- `llms.txt` — concise machine-oriented integration guidance.

The root `core-ui.css` remains only as a legacy migration reference. New work uses the canonical `src/` assets.

## Use

```html
<link rel="stylesheet" href="/ui/src/base.css">
<link rel="stylesheet" href="/ui/src/mewa.css">
<script src="/ui/src/components.js" defer></script>
```

Static components do not require JavaScript. Interactive snippets use stable `data-ui-*` hooks and are enhanced automatically. For dynamically inserted markup:

```js
MewaUI.enhance(container);
```

Before permanently removing an enhanced subtree:

```js
MewaUI.destroy(container);
```

Custom events use the `mewa-ui:*` namespace. Lucide icons reference the local sprite:

```html
<svg aria-hidden="true"><use href="/ui/src/lucide.svg#search"></use></svg>
```

Decorative icons stay hidden from assistive technology. Icon-only controls need an accessible name.

## Foundation

The body scale is 12, 14, and 16 px. Headings use 16, 24, and 32 px. Line heights are 1.25 and 1.61; weights are 400 and 550; tracking is zero. Component spacing remains local instead of being hidden behind a semantic spacing taxonomy.

All six palettes use the same theme-specific 11-step `050`–`950` role map: gray, alpha white, alpha black, red, amber, and green. Steps `050`–`100` are surfaces, `200`–`300` are hover and active backgrounds, `400` is the subtle-border step, and `500`–`950` form an APCA contrast ladder. This is deliberately not a reversible dark-to-light ramp.

The opaque palettes stay inside sRGB. Every corresponding opaque step uses the same absolute OKLCH lightness, from `L 17.7` at `050` to `L 91.9351` at `950`. Gray defines the APCA baseline against `050`: steps `500` through `950` land at `Lc 15`, `30`, `45`, `60`, `75`, and `90`. Red, amber, and green keep fixed hues of `17`, `75`, and `145` and follow one shared chroma envelope that strengthens through the middle and tapers toward both ends; individual values are reduced only where a hue reaches the sRGB boundary. Their rendered Lc values can differ because chroma and hue affect sRGB luminance. The catalog reports absolute lightness and each opaque scale's signed Lc against its own `050`. Alpha values remain role-aligned because their final contrast depends on the backdrop. These values are design guidance, not an APCA compliance claim.

Components consume generalized semantic roles rather than palette steps. Hover and active backgrounds map directly to `200` and `300`; relative OKLCH modifiers remain available for light controls and status actions where a palette step is not the appropriate state change.

`--ui-border-dashed` is the shared structural-divider treatment. Ghost buttons have no border or fill at rest. Alert owns inline status and blocking confirmation variants. Progress owns task progress and native meter measurements.

## Catalog and layouts

Mount the repository at `/ui`, then open `/ui/catalog/`. The catalog displays the selected component's name, description, and live preview without embedding source-code controls. Open `/ui/catalog/#colors` for the role, absolute lightness, opacity, and APCA visualization of all six palettes.

Complete application previews:

- [Vertical navbar](layouts/vertical-navbar.html)
- [Horizontal navbar](layouts/horizontal-navbar.html)

## Validate

Run from the repository root:

```sh
node tests/catalog-contract.test.js
node tests/runtime-contract.test.js
```

`tests/browser-smoke.mjs` adds desktop/mobile geometry, focus, interaction, and visual-state checks when a Chromium debugging endpoint is available. Static checks do not replace keyboard, zoom, reduced-motion, forced-colors, or screen-reader review.

See [AUDIT.md](AUDIT.md) for the implementation review and [DESIGN.md](DESIGN.md) for the contribution contract.
