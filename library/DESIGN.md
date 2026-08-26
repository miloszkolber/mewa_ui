# mewa_ui design contract

This file defines the mandatory design contract for mewa_ui.

Use this contract for every library change and every consumer interface.

## Read order

1. Read this file before you select a component or a shell.
2. Read `library/system/foundations.md` before you add visual rules.
3. Read `library/system/components.md` before you select a component.
4. Read the matching `library/components/{slug}/{slug}.md` before you write markup.
5. Read `library/system/patterns.md` before you compose a page region.
6. Read `library/system/layouts.md` before you compose application chrome.
7. Read `library/system/accessibility.md` before you add interaction.
8. Read `registry.json` before you load component assets.

The registry owns component selection metadata.

The component skill owns implementation-specific markup and behavior.

The component stylesheet and module define the executable contract.

The static documentation page demonstrates the contract.

The static documentation page does not define a second API.

## System boundaries

A component is a reusable control or content region.

A pattern is a documented composition of components.

A shell is a documented composition of application chrome.

mewa_ui does not ship complete layout templates.

App Shell supplies reusable application chrome and page regions.

Sidebar supplies collapsible navigation behavior.

Layout supplies local Grid and Flexbox composition.

A consumer owns routes, business rules, application state, and page-specific layout hooks.

The library owns shared appearance, semantics, and interaction contracts.

## Agent decision sequence

1. Identify the user task.
2. Identify the primary page landmark.
3. Select the smallest shell that supports the route structure.
4. Select the smallest documented pattern that supports the task.
5. Select native elements before custom interaction patterns.
6. Select components from `library/system/components.md`.
7. Read every selected component skill.
8. Load only the required stylesheets and modules.
9. Preserve the documented no-JavaScript path.
10. Verify the result against this contract.

Do not infer an API from another library.

Do not invent a class because its name looks familiar.

Do not invent a `data-*` attribute.

Do not copy a demo without its labels and relationships.

## Visual identity

Use a raw and technical visual language.

Use monochrome surfaces for normal interface structure.

Use red, amber, and green only for status and destructive meaning.

Use square geometry by default.

Use borders to show structure.

Do not use visual shadows.

Do not use decorative color gradients.

Use soft blur only on top-level sticky chrome.

Keep the main canvas continuous.

Do not place a card inside another card.

Do not wrap a table in a card.

Use one outer section border around dense rows.

Remove the inner border when a child fills a bordered section.

Use compact labels and direct descriptions.

Do not repeat information that the control already makes clear.

Use uppercase monospace text only for technical eyebrows and compact machine labels.

Use sentence case for headings, labels, buttons, and navigation.

## Foundations

Load `library/src/base.css` first.

Load `library/src/tokens.css` second.

Use Geist for interface text.

Use Geist Mono for code, output, keys, IDs, and technical labels.

Use palette primitives only inside foundation files.

Use semantic color roles inside components and consumers.

Use neutral as the CSS name for the Penpot grayscale family.

Use `000` for white and `050` through `950` for the neutral scale.

Do not define a pure-black primitive.

Keep palette symmetry across each palette's own `050` and `950` endpoints.

Test chromatic `600` primarily on the same palette's `050`.

Test chromatic `400` primarily on the same palette's `950`.

Keep chromatic palette hues constant in OKLCH.

Use tuned alpha primitives through semantic roles.

Use the token purposes in `registry.json`.

Use the numeric spacing and size tokens from `library/src/base.css`.

Do not add a second spacing scale.

Use `--border-radius-000` for normal geometry.

Use `--border-radius-6400` only when circular geometry carries meaning.

Use `--border-width-025` for normal structure.

Use `--border-width-050` for focus and strong emphasis.

Use `--border-width-100` only when the component contract requires it.

Use `--blur-100` for sticky shell chrome.

Do not use blur on controls, cards, rows, dialogs, or body content.

## Surfaces and borders

Use `--background` for the page canvas.

Use `--surface-primary` for a continuous content region.

Use `--surface-secondary` for quiet grouping and alternating emphasis.

Use `--surface-hover` for hover feedback.

Use `--surface-selected` for selected and current state.

Use `--surface-disabled` for disabled surfaces.

Use `--surface-inverted` for the primary high-contrast action.

Use status surfaces only with matching status text roles.

Use `--border-primary` for normal separation.

Use `--border-secondary` for stronger internal separation.

Use `--border-muted` for low-emphasis or dashed boundaries.

Use `--border-focus` for authored focus indicators.

Use the matching semantic border for status validation.

Use one border to define one visual boundary.

Do not stack equivalent borders on a parent and its direct child.

## Density and hierarchy

Use a 40px default interactive height.

Use a 32px compact interactive height for dense row actions.

Use a 24px target only when the component contract permits an inline or constrained target.

Keep the primary action visually strongest.

Use one primary filled action in a local action group.

Use outline or ghost treatments for secondary actions.

Reserve destructive fill for the final destructive confirmation.

Keep row actions compact.

Keep header actions at the default size.

Keep related controls close.

Use larger gaps only between different tasks or sections.

## Native HTML and JavaScript

Start with the native element that matches the task.

Use links for navigation.

Use buttons for actions.

Use `<dialog>` for modal surfaces.

Use the Popover API for supported non-modal top-layer surfaces.

Use `<details>` and `<summary>` for disclosures.

Use native form controls when the platform supports the required input.

Use `<progress>` for completion.

Use `<meter>` for a bounded scalar value.

Use `<output>` for a computed result.

Use JavaScript only for behavior that HTML and CSS cannot express.

Keep component modules as modern ES modules.

Keep component modules safe after repeated initialization.

Keep component modules safe for markup inserted after navigation.

Do not replace native submission, navigation, validation, or disclosure.

## State and data attributes

Use native attributes and pseudo-classes first.

Use `data-*` only for a documented state that the platform cannot express.

Use `data-state` only for meaningful component status.

Keep ARIA state synchronized with visual state.

Do not use color as the only state indicator.

Do not create compatibility aliases without a documented migration need.

## Motion

Keep every state change immediate.

Do not add CSS transitions.

Do not add smooth scrolling.

Do not add View Transitions.

Do not add scroll-driven animation.

Do not add Web Animations.

Do not add shimmer.

Spinner rotation is the only library motion exception.

Use the Spinner component only while work is in progress.

## Responsive behavior

Use `60rem` to collapse a wide content-and-rail composition.

Use the `--breakpoint-compact` value, `48rem`, for shell navigation and major page structure.

Use the `--breakpoint-narrow` value, `37.5rem`, for compact single-column behavior.

Use rem units for responsive breakpoints.

Use the `--breakpoint-max-dense` value, `90rem`, for dense application canvases.

Use the `--breakpoint-max-focused` value, `64rem`, for focused tools and content pages.

Do not add another global canvas preset.

Keep normal content usable at a 320px viewport width.

Keep text and controls usable at 200% zoom.

Contain two-dimensional scrolling inside tables, grids, and media that require it.

Do not create horizontal page scrolling.

## Accessibility

Use native semantics before ARIA.

Give every control an accessible name.

Keep visible labels for form controls.

Keep stable IDs for labels, descriptions, errors, and controlled regions.

Use `aria-current="page"` on the current route link.

Use live regions only for dynamic information.

Keep every pointer path available from the keyboard.

Give every drag interaction a non-drag pointer alternative.

Keep focus visible.

Keep focused content clear of sticky regions.

Support `prefers-contrast: more`.

Support `forced-colors: active`.

Keep the no-JavaScript state understandable and usable.

Read `library/system/accessibility.md` for the complete acceptance contract.

## Component documentation

Use `library/system/components.md` to select a component.

Use the component skill to implement the component.

The registry stores each component purpose.

The registry stores each selection condition.

The registry stores each nearest misuse.

The registry stores each fallback.

The registry stores each runtime mode.

Each component skill must state its native basis.

Each component skill must state its supported structure.

Each interactive component skill must state its keyboard behavior.

Each interactive component skill must state its state changes or events.

Each enhanced component skill must state its no-JavaScript behavior.

Keep examples short.

Keep every example complete.

Use explicit `type` attributes on buttons.

Do not use inline styles in canonical examples.

Do not include a variant that the stylesheet does not implement.

## Patterns

Use a pattern when several components solve one repeated task.

Keep patterns in `library/system/patterns.md`.

Do not add pattern CSS until repeated use needs a shared hook.

Prefer composition before a new component.

Promote a pattern to a component only when it has a stable API and repeated behavior.

## Shells

Use `library/system/layouts.md` to select a shell composition.

Use the sidebar shell for persistent application navigation.

Use the top-navigation shell for a small flat route set.

Use the focused-tool shell for one primary task.

Compose shells from App Shell, Sidebar, Layout, navigation components, and native landmarks.

Keep page-specific shell CSS in the consumer.

Do not ship complete shell templates from this repository.

Do not create a new component only for one shell.

## Source ownership

`library/src/base.css` owns static foundations.

`library/src/tokens.css` owns semantic theme roles.

`library/components/{slug}/{slug}.md` owns component implementation guidance.

`library/components/{slug}/{slug}.css` owns component presentation.

`library/components/{slug}/{slug}.js` owns component enhancement behavior.

`registry.json` owns machine-readable component and token metadata.

`docs/{slug}.html` owns the rendered reference example.

`library/system/` owns design selection and composition rules.

`README.md` owns the human repository overview.

`PROMPT.md` owns the reusable consumer-compliance prompt.

`llms.txt` owns the short machine routing guide.

`AGENTS.md` owns maintainer workflow.

## Writing contract

Use ASD-STE100 style.

Use active voice.

Use present tense.

Write one instruction in each sentence.

Keep each rule self-contained.

Use the exact class, attribute, token, and path names.

Avoid pronouns when the noun is not clear.

Avoid idioms.

Avoid rhetorical language.

Avoid deep heading nesting.

Avoid long examples.

## Validation

Run `npm test`.

Run `npm run test:browser` when Chromium is available.

Run `npm run catalog:check` after registry changes.

Check the changed page with a keyboard.

Check the changed page at 200% zoom.

Check the changed page at a 320px viewport width.

Check the changed page in light and dark themes.

Check the changed page with increased contrast.

Check the changed page in forced colors.

Check the changed page without JavaScript when a native path exists.

Check the browser console.

Reject the change when documentation and implementation differ.
