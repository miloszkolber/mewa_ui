# Catalog review

The September 2026 catalog review covers all 80 registered components, their source contracts, the interactive preview, and the generated Figma reference. Implementation and documentation corrections are integrated; no confirmed blocking finding remains open in the verified scope below.

## Contract changes

- Component sources live under `library/components/{category}/{slug}/`. Registry paths are authoritative. Distribution entrypoints remain flat.
- Button and Avatar each use one 36px size. Button examples and generated Toast actions no longer request the removed compact size.
- Typography presents a complete Markdown document without property or state controls. Existing text-role classes remain available for composition.
- Nav route lists retain their horizontal and vertical forms. The undocumented fixed-width collapsed-row hook is removed because it clipped text-only links. Sidebar retains its supported collapse behavior.
- Progress supports measured completion and a stationary indeterminate treatment. It does not replace native `meter` for utilization.
- Control-boundary and focus-perimeter roles use solid colors with measured contrast above 3:1 against the adjacent input surface in both themes. Decorative selected-tab shadows are removed.
- The generic hover/focus "visual state" selector is removed. Persistent conditions are boolean properties (`disabled`, `invalid`, `readonly`, `required`, `checked`, `indeterminate`, `loading`, `open`, `optional`) and content toggles (`showLabel`, `showIconStart`, `showIconEnd`). Toggle uses `pressed` through `aria-pressed`; native checkable inputs use `checked`. Property labels are lowercase.
- Button's first variant is renamed `primary`. Grouped buttons and toggles no longer own a variant; the owning group or toolbar sets it once. Button and Toggle expose content toggles instead of a single icon-only flag.
- Icon exposes a line/fill variant and uses the local `ri-*` class hook. A documentation loader injects the local glyph, so the rendered specimen stays visual and the HTML output stays a short class hook.
- Field, Text Field, and Textarea expose editable label and description text; `required` marks the label. Label exposes an `optional` property.

## Playground interaction

The catalog-wide control sweep covers select options, booleans, value editors, exclusive selection, disclosure, and Reset. Independent browser regressions also exercise real native activation and constraints, selected Combobox and File Upload values, canceled reset, and accessible action names. Inspector edits now update mounted components rather than replacing their nodes; native reset retains authored defaults. Composite owners propagate constraints to their native controls. Authored inline SVG paths survive code export, and the Icon loader modifies only empty class hooks. Text content can be cleared and re-entered. Existing File Upload Remove buttons track dynamic native disabled state. No page error was reported in the executed browser suites.

## Systemic follow-up

The same defect classes found in the reviewed components were checked across the rest of the catalog. Fixed here: menu and command list rows were 40px and now use the 36px control rhythm (Command Palette, Context Menu, Dropdown Menu); Tabs now keeps 36px targets, reserves space for focus inside its scroll container, and scrolls the active tab into view on keyboard navigation; Date Range Picker had the Time Field legend-spacing bug and the native date-picker glyph color; Select, Number Field, File Input, and Date Field now mark a required label. A nested `:has()` selector in the Label required indicator was invalid CSS and silently dropped the whole rule; it now uses a relative child selector. Command Palette close handling no longer steals focus after the browser has restored it.

The remaining candidates were measured in a real browser rather than assumed, and each resolved against existing contract text:

- Navigation Menu rows rendered at 38.39px from ad-hoc padding. `--size-1000` is the documented 40px navigation and menu row, so the row now uses that token. Nav, Sidebar, Tree View, and Collapsible already did.
- The four components whose `<legend>` names a group of controls separated it from that group by 4px (Input OTP), 8px (Radio Group), or 12px (Time Field, Date Range Picker). `--space-300` is the documented compact control group gap, so all four now render 12px and use one logical property.
- Checkbox, Radio Group, and Switch pair a 16px or 20px input with a 19-22px label, leaving a pointer target under the documented 24px minimum. Each label now carries `min-block-size: var(--size-600)`, which raises the activating union to 24px without changing the control size.
- A catalog-wide sweep of every focusable node then found the same defect in the components that size a control from its line box rather than a control token: Breadcrumb links, the Hover Card trigger, the Agent Activity trigger, the Sources citation marker, and the Toast close button were 20-22.39px. Each now takes the 24px minimum, and Toast's close button also gained the disabled treatment its property had been emitting without any matching rule.
- Accordion's 44px trigger is not a defect. Its component contract documents that height, and it sits in the overlay family rather than the navigation and menu family that `--size-1000` governs.
- The 22 fixtures that embed inline icon SVG are not a defect. Authored SVG is a supported shape: the build-time inliner accepts an `<svg>` host, the loader deliberately skips SVG-namespace elements, and the in-repository reference markup carries its vectors in a child `<svg>`. Rewriting them as empty class hooks would trade the preview's no-JavaScript icons for deduplicated path data.

## Second scan

An independent pass over the whole library, executed against a served preview, reported the following. Each was re-checked before any edit, because the first reading of a computed style can be sampled mid-transition and look like a missing rule.

Fixed here:

- Data Table resolved its status region with a bare `[role="status"]` fallback and took the first match in document order, so an author's own live region placed inside the table was overwritten with the row count and given `aria-live`. The selector now claims only regions the table owns.
- Resizable generated an `<output>` carrying `aria-live="polite"` while also writing the same text to the focused separator's `aria-valuetext`, announcing every step twice. The output is now `aria-live="off"`, and the component contract no longer describes it as a live region.
- Navigation Menu had no rule for `aria-current` or `aria-disabled`, and Sources had none for `aria-disabled`, so both playground properties emitted attributes the component ignored. Both now mark the current route, and both take the disabled text role and leave the pointer path. Their contracts are unchanged because the states were already documented.
- Carousel read `data-loop` once during enhancement, so the property had no effect on a carousel that was already running. It is now read at use time, the module re-derives its state through the shared lifecycle refresh every other composite already calls, and turning the property off restores the non-loop end states.
- Carousel reported itself ready when its viewport was missing, and teardown left the generated region role, roledescription, tab stop and slide roles in place. A carousel without a viewport is no longer marked, and both Carousel and Date Picker now snapshot every attribute and generated region they write, restoring the authored baseline on destroy and leaving application edits alone.
- Date Range Picker, Time Field, and Tag Input emit `data-readonly` on their root, which no stylesheet matched, so the state was enforceable but invisible. All three now take the same readonly treatment the other text and date controls give the native attribute, including a forced-colors rule, and Tag Input covers its enhanced control as well as its fallback.

Date Picker put `aria-selected` on the `role="gridcell"` while the roving `tabindex` sat on a native button nested inside it, so the selected day was never announced on the focused node and the widget combined two focus models. The grid cell is now the date control: it carries the day text, `aria-selected`, the localized full-date name, and the roving tab stop, and it holds no nested control. The component skill changed with it, because its keyboard model did. A focusable cell is not natively activatable, so the module now handles Enter and Space itself instead of relying on button activation, and native buttons remain for month navigation only. The inert Figma specimen was rewritten to the same structure, so the reference no longer shows markup the component cannot produce. Day cells grew from a 32px button inside a 36px cell to a 36px cell, which keeps the documented 36px control rhythm and the 24px target minimum.

## Documentation acceptance

Preview and Figma use the same nine registry categories. Boolean controls distinguish presence attributes from string-valued ARIA booleans. Selection cardinality does not control which neighboring item may be disabled. Each component declares a bounded matrix dimension list; behavior-only properties and isolated placement controls do not create redundant specimens.

The matrix contains 426 generated cells at this revision. This count is an inspection result, not a coverage target. Independent assertions require checked and invalid Checkbox, pressed Toggle, line/fill Icon, disabled Button, loading Button, selected Radio, and open disclosure specimens rather than trusting generated inventory counts alone.

The static Figma matrix caps outer specimen rows and inner cells at four columns on large canvases, preserves readable wide compositions, and keeps each cell isolated for import. Chromium also verifies that line/fill Icon and checked Checkbox specimens render with JavaScript disabled.

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
| `bun run test:browser` with Chrome 153 and Firefox 155 | Pass: existing suites plus native playground semantics, icon ownership, measured layout rhythm, the gridcell focus model, runtime, form, display, Tabs geometry, and remaining-component regressions |
| `bun tests/docs-visual-review.mjs` with Chrome 153 | Pass: 560 preview route/condition checks, measured control/focus contrast, 160 rendered matrix captures |

The layout-rhythm regression measures rendered boxes rather than reading source. It activates each playground and asserts that every group legend resolves to one 12px gap, that navigation and menu rows render exactly 40px, and that no focusable node in the catalog falls under the 24px minimum. A native input counts through the union of its own box and its label. A source grep cannot observe whether a legend is followed by content, and a fractional row height is invisible in CSS.

A second sweep toggles every `disabled` property control in the catalog and diffs a signature of the whole rendered demo subtree. A control that emits an attribute no rule matches leaves the signature untouched, which is how the Navigation Menu and Sources gaps were found and how a future regression in this class is caught. A third check asserts that the `readonly` property changes the rendered control and reaches a native control on every component that offers it.
| `bun run measure` | Complete; generated report at `dist/size-report.json` |
| `git diff --check` | Pass |

The visual sweep covers light and dark desktop, light and dark 320px layouts, increased contrast, forced colors, and 200% CSS zoom reflow. Eighteen light/dark category contact sheets were inspected. Oversized default specimens are cropped in these contact sheets; they are not substitutes for full variant screenshots. Reproducible evidence is generated under ignored `screenshots/review/`, including `coverage.json`.

## Verification limits

Safari, browser-toolbar zoom, actual Figma importer output, and screen-reader announcements were not tested. Firefox BiDi could not emulate forced colors or JavaScript-disabled navigation; Chrome covered those conditions. The enlarged layout check uses CSS `zoom: 2`, explicitly recorded in the coverage output. Native JavaScript-disabled checks cover the Figma matrix and representative disclosure, popover, navigation, and resize fallback paths rather than every enhanced component. Toast announces by inserting a populated live region into a closed popover, which is unreliable across assistive technology and was not verified. External demonstration photographs require network access; package runtime code has no such dependency.

No repository dependency was added. Build-time palette, schema, lint, format, type, browser, and optional Svelte tooling each have active consumers. Screenshots remain as ignored review evidence. Required third-party asset licenses remain intact.
