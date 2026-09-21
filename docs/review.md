# Catalog review

The September 2026 catalog review covers all 80 registered components, their source contracts, the interactive preview, and the generated Figma reference. Implementation and documentation corrections are integrated; no confirmed blocking finding remains open in the verified scope below.

## Contract changes

- Component sources live under `library/components/{category}/{slug}/`. Registry paths are authoritative. Distribution entrypoints remain flat.
- Button and Avatar each use one 36px size. Button examples and generated Toast actions no longer request the removed compact size.
- Typography presents a complete Markdown document without property or state controls. Existing text-role classes remain available for composition.
- Nav route lists retain their horizontal and vertical forms. The undocumented fixed-width collapsed-row hook is removed because it clipped text-only links. Sidebar retains its supported collapse behavior.
- Progress supports measured completion and a stationary indeterminate treatment. It does not replace native `meter` for utilization.
- Control-boundary and focus-perimeter roles use solid colors with measured contrast above 3:1 against the adjacent input surface in both themes. Decorative selected-tab shadows are removed.
- The generic hover/focus "visual state" selector is removed. Persistent conditions are boolean properties (`disabled`, `invalid`, `readonly`, `required`, `checked`, `indeterminate`, `loading`, `open`, `optional`) and content toggles (`showLabel`, `showIconStart`, `showIconEnd`). Property labels are lowercase.
- Button's first variant is renamed `primary`. Grouped buttons and toggles no longer own a variant; the owning group or toolbar sets it once. Button and Toggle expose content toggles instead of a single icon-only flag.
- Icon exposes a line/fill variant and uses the local `ri-*` class hook. A documentation loader injects the local glyph, so the rendered specimen stays visual and the HTML output stays a short class hook.
- Field, Text Field, and Textarea expose editable label and description text; `required` marks the label. Label exposes an `optional` property.

## Systemic follow-up

The same defect classes found in the reviewed components were checked across the rest of the catalog. Fixed here: menu and command list rows were 40px and now use the 36px control rhythm (Command Palette, Context Menu, Dropdown Menu); the Tabs scroll container clipped child focus rings and now reserves the ring spread, with the line variant's selected underline kept flush; Date Range Picker had the Time Field legend-spacing bug and the native date-picker glyph color; Select, Number Field, File Input, and Date Field now mark a required label. A nested `:has()` selector in the Label required indicator was invalid CSS and silently dropped the whole rule; it now uses a relative child selector. A command-palette close assertion in the runtime suite raced the native toggle events and now waits for the settled attribute.

Remaining candidates, measured but not changed: Navigation, Tree View, Accordion, and Collapsible rows are 40-45px; Input OTP and Radio Group legends use 4px and 8px where Time Field and Date Range Picker use 12px; 22 component fixtures still embed inline icon SVG rather than the local `ri-*` class hook.

## Documentation acceptance

Preview and Figma use the same nine registry categories. Boolean controls distinguish presence attributes from string-valued ARIA booleans. Selection cardinality does not control which neighboring item may be disabled. Each component declares a bounded matrix dimension list; behavior-only properties and isolated placement controls do not create redundant specimens.

The matrix contains 363 generated rows at this revision. This count is an inspection result, not a coverage target. Independent inventory assertions cover required combinations and compound states, so deleting a model entry cannot make an omitted feature disappear from the expected result.

The static Figma matrix caps outer specimen rows and inner cells at four columns on large canvases, preserves readable wide compositions, and keeps each cell isolated for import.

Preview regressions cover bidirectional radio changes, all-disabled tabs and panel correspondence, committed Tag Input values plus pending drafts, native indeterminate checkbox transitions, retained calendar context, semantic switches, conditional controls, and status-only Tool Call anatomy. Static ID references are rewritten as exact HTML attributes, including command-palette triggers and Markdown footnotes.

## Runtime acceptance

The browser suite covers all 41 behavior lifecycles and the existing native-form, controller, package, and Svelte integration paths. Added regressions cover toolbar composition and tabindex cleanup, palette ARIA ownership and focus restoration, native Sheet autofocus, dropdown target replacement, document listener ownership, sidebar shortcuts, immutable OTP cells, number-step failures, time-change events, Avatar fallback identity, carousel labels, and disabled tree/sortable controls.

## Executed checks

| Check | Result |
| --- | --- |
| `bun run test` | Pass: schema, source contracts, generation parity, independent documentation inventory, palette, packages, Svelte |
| `bun run package:check` | Pass |
| `bun run lint` | Pass |
| `bun run format:check` | Pass |
| `bun run typecheck` | Pass |
| `bun run palette:check` and `bun run catalog:check` | Pass |
| `bun run test:browser` with Chrome 153 | Pass: existing suites plus the added runtime, form, display, and remaining-component regressions |
| `bun tests/docs-visual-review.mjs` with Chrome 153 | Pass: 560 preview route/condition checks, measured control/focus contrast, 160 rendered matrix captures |
| `bun run measure` | Complete; generated report at `dist/size-report.json` |
| `git diff --check` | Pass |

The visual sweep covers light and dark desktop, light and dark 320px layouts, increased contrast, forced colors, and 200% CSS zoom reflow. Eighteen light/dark category contact sheets were inspected. Oversized default specimens are cropped in these contact sheets; they are not substitutes for full variant screenshots. Reproducible evidence is generated under ignored `screenshots/review/`, including `coverage.json`.

## Verification limits

Safari, Firefox, browser-toolbar zoom, and screen-reader announcement testing were not executed in this pass. The enlarged layout check uses CSS `zoom: 2`, explicitly recorded in the coverage output. Native JavaScript-disabled checks cover representative disclosure, popover, navigation, and resize fallback paths rather than every enhanced component. External demonstration photographs require network access; package runtime code has no such dependency.

No repository dependency was added. Build-time palette, schema, lint, format, type, browser, and optional Svelte tooling each have active consumers. Temporary browser binaries and task-owned servers are removed after verification; screenshots remain as ignored review evidence. Required third-party asset licenses remain intact.
