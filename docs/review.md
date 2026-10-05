# Catalog review

The September 29, 2026 review covers all 80 registered components, all 41 behavior modules, the shared runtime, the component playgrounds, the Figma reference, and generated consumer packages. The reviewed changes start from `780a2cd`. The package version remains `0.2.0`; this review does not create a release or move a tag.

The final assembled validation passes in both browsers with the regression helper unchanged throughout execution. Independent follow-up accepts Data Table current-page presentation, documentation theme persistence, and Toast adoption into a document without a Window. No confirmed blocking finding remains in the verified scope. The changes remain uncommitted and unpushed.

## Delivered repairs

- Visual presentation: restore the collapsed playground Card; contain Date Picker at 320px; wrap Navigation Menu; retain 40px App Shell navigation targets in Firefox; keep readonly Time Field values readable; correct unavailable Tree and Navigation Menu presentation.
- State fidelity: synchronize Pagination's visual and semantic current page; use icon-only pagination boundary fixtures; show Combobox invalid boundaries; style native-disabled Command Palette items; retain a distinguishable pressed state on disabled outline Toggles.
- Static anatomy: retain authored disclosure summaries in isolated Tree and Todo List specimens; show disabled Resizable handles without fabricated readiness markers; render inert mixed Checkbox marks in forced colors without JavaScript.
- Native forms: adopt live Date Range bounds; preserve Tag Input defaults, pending drafts, and rejected text; retain Combobox active-option identity and canceled opening; correct Color Picker committed changes; restore native Time Field fallback submission; skip immutable OTP destinations.
- Overlays: release disconnected and adopted Toast bindings; preserve application anchor and description edits; reconcile replacement portals; give cloned Context Menu triggers independent ownership; honor inherited native disabled state, canceled opening, and composing or handled shortcuts.
- Dynamic content: reconcile Toolbar and Toggle Group focus ownership, Carousel membership, live Accordion mode, and Avatar display ownership; preserve application values and fallback semantics during content teardown.
- Live documentation: keep Data Table pagination presentation aligned after page changes and filtering; use App Shell as the preview's sole theme owner; synchronize theme class, metadata, native color scheme, and pressed controls; retain a separate toolbar-only controller for the inert matrix.
- Cleanup: release AI component resources after identifying classes change; restore only owned copy feedback; preserve replacement output nodes and authored nodes reused elsewhere; release controller-acquired lifecycle generations after child removal, including acquisition through `update()`.

Native reset synchronization uses an owned task after the default action. Trusted browser activation demonstrated that microtasks can run before later cancellation and before the native reset completes. Data Table Clear now uses the documented native reset button instead of intercepting its click. Unique update-registration records prevent old cleanup from deleting a replacement registration that reuses the same callback.

The maintainer guide now requires trusted native reset activation with a later canceling listener. This narrow test rule follows the browser-timing failure; it does not replace component ownership contracts or browser inspection.

Date Picker retains native month buttons and focusable gridcells, one roving tab stop, cell-owned date names and selection, and Enter/Space activation. Keyboard regressions navigate through actual arrow handlers rather than editing tabindex. Pixel captures show that collapsed table cells did not paint the computed shadow ring; the replacement outline is visibly painted. Accessibility names and states are verified in the DOM, not through a screen reader.

## Simplification and compatibility

Documentation removes unused helpers and re-exports, redundant model metadata and operations, phantom event listeners, obsolete hooks, and the duplicate full-state stylesheet. Only inert Checkbox mixed-state presentation extends native component selectors. The generated CSS responses shrink from 634,509 to 320,425 bytes, or from 79,735 to 40,287 bytes across separate gzip streams, compared with the base revision.

Generated controllers compact whitespace only. Authored source stays readable. Imports, exports, callable names, dependency closures, declarations, shared runtime ownership, and established compressed-size budgets remain unchanged. Two roving-focus composites share one exact-policy tabindex ownership helper. No repository dependency is added.

Public compatibility hooks remain intact, including Svelte `attachBehavior`, Data Table aliases, legacy readiness markers, and documented Tree and Tabs hooks. Navigation and menu rows retain their 40px rhythm. Accordion retains its documented 44px trigger. Authored inline SVG remains supported. Composite constraints, lowercase property labels, mounted playground state, native semantics, and the four-column matrix limit remain intact.

Both documentation views use the established `mewa-ui-theme` preference. A valid common preference takes precedence over the old docs preference. The bootstrap migrates a valid `mewa-docs-theme` choice when storage permits it, then falls back to a valid library legacy choice or the OS preference. System defaults are not persisted as manual choices. Standalone Toggle does not compete with App Shell on a `data-theme-toggle` control.

Earlier `0.2.0` migration decisions remain applicable: component sources move under `library/components/{category}/{slug}/`; Button and Avatar use one 36px size; Button's first variant is `primary`; the unsupported fixed-width collapsed Nav row is removed while Sidebar retains collapse. Typography uses rendered Markdown. Persistent properties replace the generic hover/focus selector; native hover and keyboard focus remain live-preview interactions.

## Review passes and evidence

Independent source and browser passes reproduce failures before repair, then check the corrections in Chrome `153.0.8010.52` and Firefox `155.0.1`. Follow-up review also catches introduced output-node and update-registration ownership failures; both receive focused regressions and independent rechecks. Final live review identifies a stale pagination class and competing theme controllers that initial-state snapshots miss. Independent follow-up accepts their corrections through actual paging, filtering, theme selection, reload, cross-document navigation, and keyboard activation. Window-less Toast adoption also receives failing-before and passing-after identity regressions. Unsubstantiated Checkbox, normal Message Scroller/Todo List cleanup, and Slider value-loss candidates are not treated as defects.

Rendered review covers 426 matrix cells per theme, all 160 full component matrices, and 18 category contact sheets. Full matrices retain native scale; cropped or scaled contact sheets are not substitutes for variant inspection. Browser sweeps cover all 80 playgrounds in seven conditions: light and dark desktop, light and dark 320px layouts, increased contrast, forced colors, and 200% CSS zoom reflow. Selected invalid, disabled, pressed, open, focused, and cleared states receive separate browser checks.

The layout gate mounts every default playground and measures visible targets, labelled checkable activation areas, legend gaps, row heights, and narrow component containment. Closed overlay content receives separate interaction coverage. Catalog lifecycle listener counts establish listener removal, not complete functional teardown; focused ownership suites test values, node identity, observers, timers, native submission, cleanup, and remount independently against source and shipped controllers.

Fresh consumer evaluation starts with `llms.txt` in an isolated workspace. All six tasks pass in both browsers: a native form, searchable destination selection, a dialog form, a dynamic table, keyed Svelte checkbox controls, and a streaming transcript. Trusted checks retain native validation, navigation, submission, reset cancellation, focus, reading position, and lifecycle cleanup. The final 31 consumer screenshots match the earlier post-repair capture byte-for-byte; image inspection is recorded with the consumer evidence.

Reproducible images and coverage are retained under ignored `screenshots/review/`, including `deep-before/`, `final-after/`, and `final-accepted/`. All 160 final acceptance matrices and all 19 category/forced-color images match the independently inspected post-repair capture byte-for-byte. Both final visual helpers select themes through the real UI. Browser logs, independent reports, consumer results, mutation controls, and runnable probes are retained under `/tmp/opencode/mewa-review-20260929/`. These files are local review evidence, not release contents.

## Executed checks

| Check | Result |
| --- | --- |
| `bun run check` | Pass: schema, generation, source contracts, palette, packages, Svelte, lint, formatting, and types |
| `bun run package:check` | Pass, including 12 acquired-generation protocol regressions |
| `bun run docs:check`, `palette:check`, and `catalog:check` | Pass |
| `bun run test:browser`, Chrome and Firefox | Pass: native runtime, playground semantics, visual states, source/shipped ownership, Svelte, and keyboard regressions |
| Ownership browser suites | Pass: 147 cases against source and the same 147 against shipped controllers, plus 24 Forms completion cases |
| Trusted reset, detached controller removal, and composite Tab transfer | Pass in both browsers |
| Theme persistence and ownership helper | Pass: baseline reload fails meaningfully; corrected selection, precedence, controlled storage failures, and both controller orders pass |
| Trusted table pagination | Pass: 14 light/dark states against source and 14 against shipped controllers in each browser |
| `bun tests/docs-visual-review.mjs`, Chrome | Pass: 560 route/condition checks, 160 matrices with 852 rendered cells, control/focus contrast, and inert mixed rendering |
| `bun run test:consumer` | Pass with Svelte 5.29.0 and 5.57.0 |
| Fresh six-task consumer replay | Pass in Chrome and Firefox; no page, console, or asset errors |
| `bun run test:performance` | Complete: functional workloads pass; timings are diagnostic, not portable budgets |
| `bun run measure` | Complete; separate-response sizes are recorded in `dist/size-report.json` |
| `git diff --check` | Pass |

The measured default control and focus roles exceed 3:1 against the adjacent control surface in both themes. The package tests retain the 50KiB combined-controller and 75KiB separate-controller budgets. Complete CSS transfers 42,884 gzip bytes; combined controllers use 46,554 gzip bytes; separate controller responses total 63,819 gzip bytes. Independently compressed flat CSS entries intentionally repeat shared dependencies and total 115,527 gzip bytes.

## Verification limits

Safari, screen-reader announcements, browser-toolbar zoom, and actual Figma importer output remain unverified. Desktop browser access reports `browser.disconnected`; local Chrome and Firefox automation works. The enlarged layout check uses CSS `zoom: 2`, not browser-toolbar zoom. Firefox BiDi cannot emulate forced colors or disable JavaScript; Chrome covers those conditions in the shared suite, and focused Firefox checks use native preferences.

Cross-tab theme synchronization is not checked. Preference and storage-failure fixtures distinguish observed native preferences, Chrome media emulation, and deliberate API failures from operating-system integration.

The early temporary review server did not implement `/blank` or optional `/favicon.ico` responses. Its missing-file/HTTP-500 records are test-host failures, not library failures. Final regression and helper servers implement their fixture routes and return HTTP 204 for the optional favicon. The final checks do not suppress console errors. The temporary server is stopped after review.

Clipboard payload fixtures exercise actual browser handlers but do not establish OS clipboard integration. No-JavaScript checks cover representative native and static paths rather than every enhancement. Toast announcements still require assistive-technology testing. External demonstration photographs require network access; packaged runtime code does not.

The horizontal Form concern applies to a 320px local container inside a wide viewport; the actual 320px viewport correctly stacks its fields. It is not classified as a reproduced viewport-reflow failure. No claim of universal bug freedom, accessibility conformance, or final importer fidelity follows from these checks.
