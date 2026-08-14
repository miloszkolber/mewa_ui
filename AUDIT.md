# mewa_ui implementation audit

Audit baseline: 2026-08-14. The portfolio and `core/docker` interfaces are visual guidance only and remain outside this repository.

## Current pass

- Rebuilt the foundation around six theme-specific 11-step role palettes and generalized semantic roles. All palette values and color interpolation use OKLCH; the ramps are deliberately not reversible theme generators.
- Assigned `050`–`100` to surfaces, `200`–`300` to hover and active backgrounds, `400` to subtle borders, `500`–`700` to borders and decoration, and `800`–`950` to muted through primary text.
- Rebuilt all opaque palettes on the same `L 17.7`–`91.9351` OKLCH lightness curve. Gray defines the APCA baseline against `050`: `500`–`950` target `Lc 15`, `30`, `45`, `60`, `75`, and `90`.
- Fixed red, amber, and green at hues `17`, `75`, and `145`, then harmonized them around one reference-informed chroma envelope with only the hue-specific reductions required to remain inside sRGB.
- Simplified the catalog palette view to role labels, raw token swatches, absolute lightness or opacity, signed APCA Lc against `050`, and an explicit non-compliance disclaimer. Relative and surface-minimum reporting were removed.
- Adopted Geist and the established size, line-height, weight, icon, control, border, focus, and checkbox tokens.
- Removed text-spacing additions, the relaxed line-height scale, shadows, rounded component geometry, and decorative blur.
- Renamed production component CSS to `src/mewa.css` and moved all catalog/snippet presentation into `src/demo.css`.
- Simplified the catalog to name, description, and preview; removed embedded HTML/copy controls and pinned the component list to the left on desktop.
- Added Scroll Fade and Shimmer utilities, a slower spinner, larger resizable hit area, and a corrected vertical-divider cursor/geometry contract.
- Replaced Sidebar with Vertical Navbar and added a Horizontal Navbar. Both also ship as full application templates linked from the catalog.
- Rebuilt application layouts around one measured shell: 15rem expanded navigation, 4rem collapsed navigation, 4rem headers, and optional 22.5rem utility rails. The catalog now links expanded, collapsed, left-utility, right-utility, horizontal, and operations-workspace previews.
- Merged Meter into Progress and kept native `<progress>` and `<meter>` semantics.
- Removed Navigation Menu, Input OTP, Hover Card, Rating, Steps, Toggle Group, and Toolbar from the public inventory. Button Group keeps its own pressed-state behavior without exposing a Toggle Group component.
- Preserved the previously added Autocomplete, Checkbox Group, Lightbox, Sortable List, Split Button, and Time Field behavior and accessibility coverage.
- Added `llms.txt` and strengthened machine-readable descriptions, stable snippet markers, canonical asset rules, and contract checks.
- Completed a fresh visual pass across every component at desktop/tablet and 380 px mobile widths, with targeted 320 px checks for the densest layouts. The sweep found no document overflow, missing media, stray radii or shadows, malformed SVGs, or unlabeled fields.
- Corrected compact input/date-picker groups, responsive chart labels, diff copy balance, resizable pane overflow and file-name clipping, slider width, progress-label spacing, separator composition, and the vertical-navbar brand target.
- Moved accordion state marks into explicit `aria-hidden` elements so generated symbols no longer alter trigger or region names, while retaining the larger 24 px visual icon.
- Removed duplicate button overrides and redundant resizable compatibility selectors without changing the public class or behavior contract.
- Added Description List for compact metadata, operational Item rows with visible state and independent actions, and a labelled bounded diagnostic-output Scroll Area example.
- Added an operations workspace layout that composes existing controls, stats, Item rows, tabs, Description List metadata, Progress, and Scroll Area output without creating compatibility APIs.

The resulting catalog contains 71 components and six complete layouts.

## Deliberate boundaries

The library does not reproduce every decorative effect or product-specific widget from its references. Tailwind recipes, framework adapters, theme controllers, device mockups, 3D effects, and product branding remain excluded. Blur is limited to overlapping surfaces. Lucide is local and canonical.

The useful next candidates are requirement-led patterns such as a date-range picker, form-level validation summary, or tree view. They should be added only with full keyboard, fallback, responsive, and test contracts.

## References reviewed

- [shadcn/ui components and utilities](https://ui.shadcn.com/docs)
- [Vercel Geist colors](https://vercel.com/geist/colors)
- [Radix Colors scale composition](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)
- [APCA usage guidance](https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html)
- [daisyUI components](https://daisyui.com/components/)
- [Basecoat source and patterns](https://github.com/hunvreus/basecoat)
- [Coss UI component index](https://coss.com/ui/llms.txt)
- [0build documentation](https://0build.dev/docs/latest/kit/installation/)
