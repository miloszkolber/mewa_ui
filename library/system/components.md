# Component selection

Use this file to choose a component family.

Read `library/DESIGN.md` before this file.

Read `registry.json` for the complete component inventory.

Read the matching component skill before you write markup.

<!-- REGISTRY-FIELDS:START -->
## Registry fields

Use `purpose` to identify the component responsibility.

Use `useWhen` to confirm the selection condition.

Use `avoidWhen` to reject the nearest misuse.

Use `fallback` to select the simpler alternative.

Use `jsMode` to decide whether a module is required.

Use `files` to load the exact source assets.

Use `styleDependencies` to load component presentation dependencies.

Use `behaviorDependencies` to load required controller dependencies.

Use `assets` to load optional fonts, icons, or other files.

Use `stability` before you depend on a component contract.

Do not infer these values from the component name.

<!-- REGISTRY-FIELDS:END -->

## Selection order

Select the native element before a custom component.

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

Open the selected component entry in `registry.json`.

Load the listed stylesheet.

Load the listed module when `jsMode` is `required`.

Load the listed module only when needed when `jsMode` is `optional`.

Do not load a component module when `jsMode` is `none`.

Open the listed component skill.

Copy only documented markup, classes, attributes, and states.

Keep the documented fallback.

Keep the documented accessibility relationships.
