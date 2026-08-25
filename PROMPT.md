# mewa_ui application compliance prompt

Use this prompt to review one application or several applications that consume mewa_ui.

Replace bracketed values before use.

## Prompt

You are a design engineer responsible for mewa_ui compliance and interface quality.

Review `[APPLICATION_SCOPE]` as a complete product experience.

Treat mewa_ui as the shared design and implementation source of truth.

Read the current mewa_ui repository before you judge the application.

Read `DESIGN.md` first.

Read `system/foundations.md` before you review visual styling.

Read `system/components.md` before you review component selection.

Read each used component skill before you change its markup.

Read `system/patterns.md` before you review page composition.

Read `system/layouts.md` before you review application chrome.

Read `system/accessibility.md` before you review interaction.

Read `registry.json` before you review loaded assets or runtime requirements.

Read `CONSUMERS.md` when the scope contains several mewa_ui consumers.

Read audits in `.opencode/` as supplementary evidence.

Do not treat an older audit as the current source of truth.

Use attached visual references only as aesthetic guidance.

Do not copy a reference when it conflicts with the current mewa_ui contract.

## Objective

Perform a holistic UI and UX review.

Fix clear problems when the task permits code changes.

Prefer surgical changes over a redesign.

Preserve business behavior unless a flow change improves usability and does not change product requirements.

Enforce mewa_ui aesthetics, rules, standards, components, patterns, and shell guidance.

Standardize repeated solutions across the reviewed applications.

Remove snowflakes when an existing mewa_ui solution covers the need.

Propose a shared library change when several applications need the same missing behavior.

Do not create a new shared component for one isolated styling need.

## Visual review

Keep the interface technical, dense, and restrained.

Keep normal surfaces monochrome.

Use status color only for status and destructive meaning.

Keep normal geometry square.

Use borders for structure.

Do not add visual shadows.

Use blur only on top-level sticky shell chrome.

Keep the page as one continuous working surface.

Remove cards inside cards.

Remove card wrappers around tables.

Use one outer section border around connected rows.

Remove duplicate borders between a parent section and a direct child.

Keep default controls at the documented 40px height.

Keep compact row actions at the documented 32px height.

Keep one visually strongest primary action in a local action group.

Remove unnecessary labels, descriptions, badges, icons, and repeated metadata.

Keep technical labels concise.

Use sentence case for normal interface text.

## Component review

Inventory every mewa_ui component used by the application.

Verify each component against its current skill.

Verify each component asset against `registry.json`.

Load only required component CSS.

Load a module only when the registry marks the runtime as `required` or `optional`.

Use the optional module only when the application uses the documented enhancement.

Replace bespoke controls with mewa_ui components when the existing component meets the task.

Replace copied component internals with documented component markup.

Remove undocumented classes and `data-*` attributes.

Use native HTML instead of a component when the native element fully meets the task.

Check related component choices carefully.

Use Select for a short fixed option set.

Use Combobox for a searchable finite option set.

Use Checkbox for submitted independent choices.

Use Switch for an immediate binary system state.

Use Table for structural tabular data.

Use Data Table only when its extra controls are necessary.

Use Callout for persistent important content.

Use Toast for brief non-blocking results.

Use Dialog for a focused modal task.

Use Alert Dialog for a high-impact blocking decision.

Use Card only for one independent object or small content group.

## Page and shell review

Identify the primary task of each route.

Identify the navigation model of each application.

Use the sidebar shell for persistent application navigation.

Use the top-navigation shell for a small flat route set.

Use the focused-tool shell for one primary task.

Do not add persistent navigation to a single-purpose service without a route need.

Keep one main landmark.

Keep one working page canvas.

Use one page overview near the start of the primary route content.

Keep global actions in application chrome.

Keep route actions near the page task.

Keep row actions near the affected row.

Move controls when their current position makes the flow harder to understand.

Collapse secondary rails before they make the primary task too narrow.

Keep header and content widths aligned.

Do not copy complete page templates into the application.

Compose the shell from App Shell, Sidebar, Layout, navigation components, and native landmarks.

## Usability review

Trace the primary user flow on every route.

Remove steps that do not help the user complete the task.

Move prerequisites before the action that depends on them.

Keep destructive actions away from routine primary actions.

Use confirmation only when the consequence justifies interruption.

Prefer undo over confirmation for a low-risk reversible action.

Keep error recovery close to the failed action.

Keep loading feedback proportional to the wait.

Keep empty states concise and actionable.

Keep filters close to the result they affect.

Keep important status visible without opening a menu or tooltip.

Do not hide required information behind a disclosure.

Do not use a modal when inline work is simpler.

## Accessibility review

Use native semantics before ARIA.

Verify every interactive control has an accessible name.

Verify every form control has a visible label.

Verify every ID reference resolves to one element.

Verify keyboard order follows the visual and task order.

Verify every pointer interaction has a keyboard path.

Verify every drag interaction has another single-pointer path.

Verify visible focus on every interactive control.

Verify dialogs and popovers return focus when the component contract requires it.

Verify live regions announce only dynamic information.

Verify status meaning does not depend on color.

Verify the application at 200 percent zoom.

Verify the application at 320 CSS pixels.

Verify increased contrast.

Verify forced colors.

Verify the documented no-JavaScript path where one exists.

## Technical review

Look for broken alignment.

Look for clipped content.

Look for accidental overflow.

Look for double borders.

Look for inconsistent control heights.

Look for unexpected gaps.

Look for stale disabled states.

Look for missing focus states.

Look for detached popup arrows.

Look for incorrect sticky offsets.

Look for z-index collisions.

Look for controls that move when state changes.

Look for unfinished placeholder content.

Look for dead controls.

Look for console errors.

Look for missing local assets.

Look for duplicated component JavaScript.

Look for consumer-specific CSS that should become a shared pattern.

Look for shared-library CSS that contains consumer-specific selectors.

## Responsive review

Check the application at 320px.

Check the application near 37.5rem.

Check the application near 48rem.

Check the application near 60rem.

Check the application at a normal desktop width.

Check the application on a wide desktop.

Use intrinsic wrapping before a new breakpoint.

Use only the documented responsive tiers for shared library rules.

Keep page-level horizontal scrolling disabled.

Contain necessary horizontal scrolling inside a table, grid, code region, or media region.

## Library-gap review

Record every repeated application workaround.

Check whether an existing component can absorb the need without expanding its responsibility.

Check whether a documented pattern can solve the need before you propose a component.

Propose a shared component change only when the behavior has a stable reusable contract.

Prefer a pattern when several existing components solve the task.

Keep one-off business composition inside the consumer.

Update mewa_ui before consumers when a shared fix belongs to the library.

Do not fork the same shared behavior across consumers.

## Implementation rules

Make the smallest complete set of changes.

Keep semantic HTML readable without a framework.

Do not introduce React or another UI runtime.

Do not introduce a production build step.

Do not introduce a runtime dependency without an explicit requirement.

Do not invent undocumented mewa_ui APIs.

Do not change product data or backend behavior to solve a visual issue.

Do not remove accessibility information to simplify markup.

Keep application-specific state in the application.

Keep shared UI behavior in mewa_ui.

## Validation

Run the mewa_ui contract tests after shared-library changes.

Run each application test suite after application changes.

Run the browser smoke suite when Chromium is available.

Inspect every changed route in a real browser when possible.

Check the browser console.

Re-run existing `.opencode/` audit checks that still apply.

Do not claim a visual issue is fixed when the rendered result was not verified.

State the verification gap when browser inspection is unavailable.

## Deliverable

Implement safe fixes when code changes are allowed.

List the applications and routes reviewed.

List the important fixes by user impact.

List shared consistency changes.

List accessibility changes.

List remaining snowflakes.

List proposed mewa_ui changes that need a separate decision.

List unresolved product questions only when the source cannot resolve them.

List the validation commands that passed.

List any browser or environment checks that could not run.

Keep the final report focused on decisions and remaining risks.

Do not repeat every small CSS edit.

## Writing rules

Use ASD-STE100 style.

Use active voice.

Use present tense.

Write one instruction or finding in each sentence.

Keep each finding self-contained.

Use exact file paths, component names, classes, and attributes.

Avoid vague statements such as “make this cleaner”.

State the concrete inconsistency and the required correction.
