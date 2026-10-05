# Component selection

Use this file to choose a component family.

Read only the selection family or implementation section needed for the task.

In a source checkout, read `registry.json` for the complete component inventory.

In a core archive, find candidates in `components/index.md` and read only selected `components/{slug}.json` records.

Read the matching component skill before you write markup.

<!-- REGISTRY-FIELDS:START -->
## Registry fields

Use `purpose` to identify the component responsibility.

Use `useWhen` to confirm the selection condition.

Use `avoidWhen` to reject the nearest misuse.

Use `fallback` to select the simpler alternative.

Use `nativeBasis` to confirm the semantic basis; read the selected Markdown for exact markup and keyboard behavior.

Use `jsMode` to decide whether a module is required.

Use `files` only in a source checkout to locate exact source assets and `files.skill` Markdown.

In a core archive, use the selected record's `contractLocal`, `css`, `component`, and `auto` paths instead of source `files`.

Use `styleDependencies` to understand the flat CSS dependency closure emitted for a component.

Use `behaviorDependencies` to identify required behaviors; packaged `component` and `auto` entries include their dependencies.

Use `assets` to identify optional resources; archive icons come from the separate `mewa-icons` package, not source paths.

Use `stability` before you depend on a component contract.

Do not infer these values from the component name.

<!-- REGISTRY-FIELDS:END -->

## Selection order

Select the smallest component that completes the task.

Use one component for one primary responsibility.

Use `library/system/patterns.md` when several components form one repeated task.

Use `library/system/layouts.md` when the page needs application chrome.

Do not select a component from visual appearance alone.

Do not copy an API from another library.

## Actions

Use Button for a normal action.

Use Toggle for one pressed tool state.

Use Toggle Group for related pressed tool states.

Use Button Group for adjacent actions that share one task.

Use Toolbar for a compact control set that needs managed arrow-key navigation.

Do not use these components for route navigation.

## Form choices

Use Checkbox for an independent submitted choice.

Use Radio Group for one choice from a short visible set.

Use Switch for an immediate binary system state.

Use Select for a short or medium fixed option set.

Use Combobox for one searchable finite option set.

Use Date Field when the browser date control meets the task.

Use Date Picker when a visible custom month grid is required.

Use Date Range Picker for a start and end date pair.

Use Number Field when explicit step controls improve numeric entry.

Use Slider when spatial range adjustment helps the task.

Use Time Field when separate time segments improve entry.

Use File Input for local file selection.

Use Text Field for one-line free text.

Use Textarea for multi-line free text.

Use Field to compose labels, descriptions, errors, and related control groups.

Use Form for one complete native submission task.

Use Color Picker when a user needs a visible color control and editable color value.

Use File Upload when drag and drop, file feedback, or image preview improves native file selection.

Use Input OTP for a fixed-length verification code that benefits from segmented entry.

Use Tag Input when free text must become discrete removable values.

## Data display

Use Badge for concise non-interactive metadata.

Use Avatar when identity recognition helps the task.

Use Card for one independent object or small content group.

Use Statistic for one decision-relevant summary value.

Use Table for data with stable row and column relationships.

Use Data Table only when documented filtering, sorting, status, or pagination is required.

Use Collapsible for one optional disclosure.

Use Accordion for several related disclosures.

Use Timeline when sequence is the primary relationship.

Use Tree View when hierarchy must remain visible and keyboard navigable.

Use Carousel only when sequential items must share one bounded region.

Use Scroll Area only when local independent scrolling is necessary.

Use Sortable only when user-controlled order has meaning.

## Feedback

Use Spinner for short indeterminate work.

Use Progress for known completion.

Use Skeleton only when the final structure is known.

Use Callout for persistent important information.

Use Toast for brief non-blocking status.

Use Dialog for a focused neutral modal task.

Use Alert Dialog for a high-impact blocking decision.

Do not use Toast for a blocking error.

Do not use Dialog when inline content is simpler.

## Overlays and menus

Use Popover for small non-modal contextual content.

Use Tooltip for supplementary hover and focus hints.

Use Dropdown Menu for a compact action set.

Use Navigation Menu for grouped site routes.

Use Command Palette for a large searchable command set.

Use Context Menu for a compact action menu opened from the pointer context action or a keyboard trigger.

Use Hover Card for a rich supplementary preview that appears from pointer hover or keyboard focus.

Do not place essential instructions only in Tooltip.

Do not use Dropdown Menu for form option selection.

Do not use Navigation Menu for application actions.

## Navigation

Use Breadcrumbs when parent routes improve orientation.

Use Pagination for stable result-page destinations.

Use Tabs for peer panels inside one route.

Use Sidebar for persistent application routes.

Use App Shell for reusable application chrome and page regions.

Use Layout for local Grid and Flexbox composition.

Use Resizable when adjustable split panes improve repeated work.

Use Header for a reusable banner landmark with brand, navigation, or global actions.

Use Nav for a small flat set of semantic route links.

Use Footer for reusable content information and secondary route links.

Do not use Tabs for routes.

Do not use Sidebar for a small flat route set.

## AI responses

Use Composer for a message-entry form with optional leading and trailing actions.

Use Message for ordered authored conversation rows.

Use Message Scroller when streamed conversation output must follow the live edge until the reader scrolls away.

Use Suggestion for short prompt choices that seed a Composer.

Use Thinking Indicator for a visible polite status while an assistant prepares a response.

Use Reasoning for an optional or streaming reasoning trace on native disclosure markup.

Use Agent Activity for one ordered stream of reasoning, searches, tool calls, and related steps.

Use Tool Call for one named agent operation with status and optional results.

Use Todo List for an ordered execution plan with explicit task status.

Use Sources for inline citations connected to a reference list.

Use Code Block for code that needs a copy action, line numbers, or stable streaming updates.

Use File Diff for additions and removals that need file metadata and tabular line relationships.

Do not use an AI response component when a simpler semantic list, disclosure, status, or code block completes the task.

## Implementation

For source-checkout assets, open the selected component entry in `registry.json` and use its `files` paths.

For core-archive assets, use the selected scoped record's `component` object or matching `manifest.json` entry.

Open its `contractLocal` Markdown for the exact implementation contract.

Use its `css`, `component`, and `auto` paths for packaged styles and dependency-aware behavior.

Load the listed stylesheet.

Load the listed module when `jsMode` is `required`.

Load the listed module only when needed when `jsMode` is `optional`.

Do not load a component module when `jsMode` is `none`.

Copy only documented markup, classes, attributes, and states.

Keep the documented fallback.

Keep the documented accessibility relationships.

Do not infer an API from previews or copy a demo without its labels and relationships.

Use native attributes and pseudo-classes before documented custom state.

Use `data-*` only for state the platform cannot express, and `data-state` only for meaningful component status.

## Component contract

Keep one primary responsibility per component.

State the native basis, native Web APIs, and supported structure in each component Markdown.

State accessibility requirements and the keyboard, focus, state changes, and events for managed interaction.

State the no-JavaScript behavior for every enhanced component.

Keep examples short and complete, with explicit button types and stable relationship IDs.

Do not use inline styles in canonical examples or document an unimplemented variant.

Keep each source component in `library/components/{category}/{slug}/` with one same-name Markdown and stylesheet.

Add one same-name ES module only when behavior needs JavaScript.

Do not add extra reference files inside a component folder.

## New component gate

Confirm that two real tasks need the same responsibility and composition cannot solve them cleanly.

Require a stable semantic basis, one clear responsibility, and documented keyboard and fallback contracts.

Add implementation files, the registry entry, and source-parity and behavior tests together.

Regenerate catalog metadata through the source maintainer workflow.

Do not add a proposal to the shipped inventory or create a component for one shell.

## Enhancement implementation

Use JavaScript only for behavior that native HTML and CSS cannot express.

Keep core behavior framework-neutral and modules safe to import without a DOM.

Keep initialization idempotent and support markup inserted after navigation.

Export `enhance` and `behavior` from every component module.

In source implementations, use `library/runtime/enhancer.js` for document-wide insertion handling.

Scope component observers to their own changing content; do not add polling loops or core runtime dependencies.

Synchronize visual and ARIA state, restore focus when contracted, and dispatch only documented events.

Do not replace native submission, navigation, validation, or disclosure.

Use behavior-specific initialization markers.

The module-owned legacy `data-init` readiness flag may remain for compatibility; never author it or use it to exclude another behavior.

Give each listener, observer, timer, object URL, and generated DOM region an explicit owner and cleanup path.

Use `createLifecycle` for listeners, including external-form listeners; keep cleanup idempotent and preserve application-owned values.

Synchronize native form reset after its default action and honor canceled resets and composition events.

Use the [Runtime guide](../runtime/README.md#application-lifecycle) for consumer mount, update, teardown, and lifecycle ownership.

## Framework integration

Use side-effect-free packaged `mewa-ui/components/*.js` controllers with application-owned lifecycles, or automatic entries for plain HTML.

Keep adapters optional and outside `mewa-ui`; do not couple core controllers to a framework lifecycle.

Use the optional `mewa-svelte` attachment for Svelte-owned elements and clean up when the framework removes them.

Keep Svelte as a peer dependency; the attachment is not a server-rendering contract.
