# mewa_ui implementation audit

Audit baseline: 2026-08-14. The portfolio and `core/docker` interfaces are visual guidance only and remain outside this repository.

## Current pass

- Second-pass review on 2026-08-15 covered all 71 snippets, six layouts, and the catalog with static checks for duplicate IDs, broken label and ARIA references, unlabeled controls, missing button types, invalid ARIA values, missing sprite symbols, and undefined production tokens. No new findings were confirmed. Focused browser checks for all six layouts at desktop/mobile widths, plus Dialog, Command, and Date Picker open states, passed with zero axe violations and no runtime errors.
- The full Puppeteer smoke rerun remains pending because the shared CDP endpoint at `127.0.0.1:9223` is currently unavailable (`ECONNREFUSED`); the prior full suite passed before the latest Table and popup fixes.
- Evaluated the captured desktop and mobile screenshots plus fresh 1280 × 900 and 390 × 844 screenshots for all six application layouts. Corrected the standalone Table example so its Updated column remains visible on mobile through the responsive table pattern and explicit data labels.
- Expanded Dropdown Menu and Command popup capacity to `20rem` within the viewport. Their screenshot states now show complete action lists instead of ending on a partially clipped row. Horizontal navigation fades and bounded scroll-area content were reviewed as intentional scroll affordances rather than layout overflow.
- Ran a live-browser visual audit across the catalog, all six layouts, and all 71 snippets: every visible text element meets 4.5:1 contrast (3:1 for large text), no text is clipped, no stray border radii or computed shadows exist, and no page overflows at 200% zoom. Reduced-motion disables shimmer, spinner, and carousel motion. Placeholder text uses the documented subtle foreground.
- Removed 15 unused Lucide symbols from the canonical sprite (44 to 29), including leftovers from the removed Rating and catalog copy controls. Every referenced symbol still exists and the full static, runtime, and browser suites pass.
- Completed a fresh-eyes review of every snippet, stylesheet, runtime handler, catalog file, layout, and test. Scoped the global `[data-ui-toggle][aria-pressed="true"]` pressed-state rule to button groups and standalone toggles, moved dialogs, sheets, and drawers from the toast stacking token to `--ui-z-dialog`, and removed the global SVG size override while keeping the required baseline rule.
- Gave custom select triggers explicit `:disabled` and invalid-focus styling, and guarded slider output wiring on `type="range"` so an `output[for]` pointing at a `<progress>` or `<meter>` element never overwrites its label. The operations workspace layout exercised the corrected path.
- Corrected the manifest Message entry, whose description described chat semantics, to match its inline status-message snippet. All three suites pass: static catalog contract, runtime contract, and the live browser smoke across the catalog, all 71 snippets at 1280 × 900 and 390 × 844, and component interactions.
- Re-inspected all 71 manifest entries, marked snippets, production styles, runtime handlers, catalog code, six layouts, and contract tests. The final browser suite passed every snippet at 1280 × 900 and 390 × 844, all six layouts at both widths, the catalog and palette view, the no-JavaScript questionnaire fallback, and targeted open/focus/filter/resize/sort states.
- Compared the canonical library with the current `hf_ui`, `moonlight_ui`, and both `meili_ui` surfaces. Preserved their strongest interaction qualities through distinct rest/hover/active states and clearer operational patterns, while recording the verified asset and structural migration boundary in `MIGRATION.md` instead of adding legacy aliases.
- Moved Dialog, blocking Alert, Drawer, Sheet, and Lightbox onto native `<dialog>` top-layer semantics with a generic-container fallback, explicit focus restoration, Escape/cancel handling, and directional edge-panel geometry.
- Corrected Tooltip so only its trigger and description surface own hover, removed duplicate Toast and Carousel announcements, stopped the inline Command example from claiming dialog semantics, and prevented Carousel shortcuts from consuming arrow keys inside descendant controls.
- Added accumulated menu typeahead, committed pointer-sort events with canceled-drag rollback, vertical and horizontal Resizable behavior with Home/End bounds, decimal-safe Number Field stepping, and complete Data Table filter clearing, singular/plural status, and visible-range synchronization.
- Restored meaningful visual state separation for form controls, input groups, tabs, pagination, breadcrumbs, and resize handles. Narrowed disabled-button styling so it no longer leaks onto unrelated `aria-disabled` options.
- Activated the existing Geist Mono asset through `--ui-font-mono` for code, logs, and keyboard notation; running Message feedback now has a status-colored, reduced-motion-aware spinner.
- Added explicit `requiresJs` metadata to every manifest entry, exposed it in the catalog, and updated the LLM contract so native interactivity is not confused with a runtime dependency.
- Declared and locked the dev-only `puppeteer-core` dependency, added portable package scripts and ignore rules, and expanded static, runtime, and browser regression coverage. Production remains zero-build and dependency-free.

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
- [Basecoat installation and runtime patterns](https://basecoatui.com/installation/)
- [Coss UI component index](https://coss.com/ui/llms.txt)
- [0build documentation](https://0build.dev/docs/latest/kit/installation/)
- [WAI-ARIA Tooltip Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)
- [WAI-ARIA Modal Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [WAI-ARIA Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
