# mewa_ui design contract

This contract applies only to this standalone repository. The portfolio and service applications may guide visual judgment, but they are not dependencies and must remain untouched.

## Foundations

- `src/base.css` owns the six OKLCH palettes, generalized semantic roles, typography, geometry, focus, reset, and browser primitives.
- `src/mewa.css` owns production component layout, spacing, structure, variants, utilities, and responsive rules.
- `src/demo.css` owns only catalog and snippet presentation.
- Interface text uses `geist, sans-serif` through `--ui-font`.
- Body sizes are 12, 14, and 16 px. Heading sizes are 16, 24, and 32 px. Line heights are 1.25 and 1.61. Weights are 400 and 550. Tracking is zero.
- Every palette value is expressed in OKLCH and uses the theme-specific `050`, `100` … `900`, `950` role scale. Components address semantic roles, never raw red, amber, green, or gray steps. The scale is not intended to generate a light theme when reversed.
- The roles are fixed: `050`–`100` surfaces; `200`–`300` hover, active, and interactive backgrounds; `400` subtle borders; `500`–`700` borders and decoration; `800`–`950` muted through primary text.
- Opaque scales increase monotonically and remain in sRGB. Corresponding steps share the exact gray-defined OKLCH lightness curve from `L 17.7` to `L 91.9351`. Gray steps `500`–`950` target `Lc 15`, `30`, `45`, `60`, `75`, and `90` against gray `050`.
- Red, amber, and green hold fixed hues of `17`, `75`, and `145`. The families target one shared chroma envelope that increases toward the useful middle of the scale and tapers near the dark and light endpoints; hue-specific caps are allowed only to remain inside sRGB. Rendered APCA values may differ by family because hue and chroma affect sRGB luminance. Light-on-dark values have negative APCA polarity.
- APCA 0.0.98G-4g is used as perceptual design guidance, not as a standards-compliance claim. The catalog exposes absolute OKLCH lightness and each opaque scale's signed Lc against its own step `050`. Alpha scales expose absolute lightness and opacity because composite contrast is backdrop-dependent.
- Dark-surface hover and active states map directly to steps `200` and `300`. Relative OKLCH modifiers remain for light controls, pressed primary actions, and status actions where a dedicated palette step is not appropriate.
- Geometry is square. Shadows are forbidden. Circular geometry is limited to objects whose meaning depends on it, such as radios, avatars, and status dots.
- Backdrop blur belongs only to overlapping surfaces such as dialogs, sheets, drawers, menus, popovers, tooltips, toasts, mobile navigation panels, and sticky glass headers.
- Component-local dimensions and spacing are explicit. Do not recreate a semantic spacing-token taxonomy.
- Dashed structural divisions use `--ui-border-dashed`.

## Markup and behavior

Start with semantic HTML and native controls. A component remains understandable without JavaScript wherever the platform provides a native path. `data-ui-*` attributes are stable behavior hooks; classes are styling hooks. `data-state` is reserved for meaningful status.

`src/components.js` exposes `MewaUI.enhance(root)` and `MewaUI.destroy(root)`. Enhancement is idempotent, cleans up listeners, and preserves native submission and navigation. Custom events use the `mewa-ui:*` prefix.

Interactive patterns follow their platform and ARIA keyboard models:

- Disclosures synchronize `aria-expanded`, `aria-controls`, and `hidden`.
- Tabs, menus, listboxes, and grouped choices expose the expected arrow, Home, End, Escape, and activation behavior.
- Modal surfaces label their purpose, trap focus, inert background content, close with Escape, and restore focus.
- Forms keep explicit labels, descriptions, native validation, and live status announcements.
- Tables retain captions, scopes, and sorting state when their narrow-screen presentation changes.
- Drag interactions provide a keyboard path and a live announcement.
- Reduced-motion and forced-colors modes remain usable.

## Components and catalog

Every entry in `catalog/components.json` has exactly one complete document in `snippets/`. The reusable fragment is delimited by `<!-- mewa-ui-snippet:start -->` and `<!-- mewa-ui-snippet:end -->`. A component is complete only when markup, styling, behavior, focus, narrow-screen treatment, local icons, and contract coverage agree.

Snippets load `base.css`, `mewa.css`, `demo.css`, then `components.js`. Application layouts load only the production pair and runtime. The catalog renders the marked fragment as a preview plus its name and description; source-code controls do not belong in the catalog UI. Its `#colors` view documents palette roles, raw OKLCH tokens, absolute lightness or opacity, and APCA Lc without turning palette steps into component-level APIs.

Alert owns inline and blocking-dialog variants. Progress owns both task progress and bounded meter measurements. Ghost buttons are the default low-emphasis action inside calendars, date pickers, and compound controls. The vertical navbar subsumes the former sidebar component.

## LLM consumption

`llms.txt` is the concise entry point. `catalog/components.json` is the canonical inventory. An LLM should copy only marked snippet fragments, preserve their accessible names and ARIA relationships, load canonical assets in order, and avoid inventing undocumented `ui-*` classes or `data-ui-*` hooks.

Descriptions explain purpose rather than demo content. Examples use realistic variations without product-specific wrappers. Stable file names, marker comments, and hook schemas are covered by contract tests.

## Icons

Lucide is the primary icon source. Symbols live in `src/lucide.svg`, inherit `currentColor`, and use the shared stroke treatment. Decorative icons use `aria-hidden="true"`; icon-only controls have an `aria-label` or equivalent accessible name.

## Layouts

- `.ui-shell.ui-shell--vertical` contains `.ui-frame`, `.ui-navbar--vertical`, and `.ui-shell-main`. At narrow widths the navbar becomes a compact header with a blurred overlapping panel.
- `.ui-shell.ui-shell--horizontal` contains `.ui-frame`, `.ui-navbar--horizontal`, and `.ui-shell-main`. Route links scroll inside the bar with horizontal scroll-fade treatment.

Both layout documents are complete application templates with identity, navigation, account/actions, page hierarchy, status content, and responsive behavior.

The visual references in [`core/docker/meili_ui`](https://github.com/miloszkolber/core/tree/master/docker/meili_ui), [`core/docker/hf_ui`](https://github.com/miloszkolber/core/tree/master/docker/hf_ui), and [`core/docker/moonlight_ui`](https://github.com/miloszkolber/core/tree/master/docker/moonlight_ui) remain separate applications. Their compact tool clusters, framed workspaces, stable form alignment, operational rows, and early single-column breakpoints inform balance without being copied into this repository.

## Contribution checklist

1. Update the manifest and matching marked snippet together.
2. Reuse semantic roles; add a foundation token only when unrelated components share the need.
3. Add required Lucide symbols locally.
4. Cover runtime behavior and repository contracts.
5. Inspect desktop, 200% zoom, keyboard-only use, and 320–390 px widths in a real browser.
6. Run both Node contract suites before handoff.
