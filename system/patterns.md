# Patterns

Use this file to compose repeated interface tasks.

Read `DESIGN.md` before this file.

Read each selected component skill before you write markup.

## Page anatomy

Use one shell for the page.

Use one main landmark.

Use one page overview near the start of main.

Use the page overview to state the task.

Place page actions in the page overview.

Place route content after the page overview.

Use full-width sections for primary work.

Use a narrow utility rail only when secondary controls remain useful beside the primary work.

Keep the page background continuous.

Do not put every page region in a card.

## Page overview

Use App Shell `.page-overview` for a utility page introduction.

Use one short eyebrow only when the technical context helps orientation.

Use one `h1` for the page task.

Use one concise description.

Use one local action group.

Place the primary action last in the action group when the reading order supports it.

Use the inline stats strip only for immediate page context.

Do not repeat the page title in the description.

Do not place long instructions in the page overview.

Do not show a metric that the primary content already makes obvious.

## Section canvas

Use App Shell `.app-section` for a bordered working region.

Give the section an accessible heading.

Use `.app-section-header` for the heading and local actions.

Use `.app-section-content` for padded content.

Let a direct table or status list provide its own internal row structure.

Remove the inner outer border when a direct child fills the section.

Use one section border around connected rows.

Do not use `Card` as a generic section wrapper.

Do not put an `App section` inside a card.

## Dense row list

Use a semantic list when the items form an ordered or unordered collection.

Use a table when columns carry stable relationships.

Use one border between connected rows.

Use a fixed first column only for a status marker, icon, or selection control.

Keep the primary label first in the reading order.

Place metadata after the primary label.

Place row actions at the inline end.

Use compact row actions.

Wrap row actions below the copy at narrow widths.

Do not create a card for each row.

Do not repeat the same status in an icon, badge, and sentence.

## Status list

Use `.app-status-list` for independently actionable status rows.

Use `.app-status-row` for each item.

Use one `.status-dot` or `.status-icon` in the marker slot.

Pair the marker with visible status text.

Use `.app-status-copy` for the title and description.

Use `.app-status-actions` for optional local actions.

Use a live region only when the list updates asynchronously.

Do not put a spinner in every running row.

Do not use color as the status label.

## Data table page

Use `Table` for stable tabular data.

Use `Data Table` when the page needs documented filtering, sorting, result status, or pagination.

Place filters before the table.

Use a search form for server-owned filtering.

Use native links for server-owned sorting and pagination.

Use the Data Table module only for the documented client enhancement.

Keep the caption available.

Keep column headers scoped.

Keep wide table scrolling inside `.table-container`.

Use a compact action in the final column.

Do not wrap the table in a card.

Do not replace links with tab roles.

Do not hide columns that contain required information.

## Filter bar

Use a form when filters affect a result set.

Use `role="search"` only when the form searches content.

Give each control a visible label.

Use a text field for a free query.

Use Select for a short fixed set.

Use Combobox only when search inside a long option set is necessary.

Use one submit action when the server owns the result.

Use live filtering only when the result updates immediately and the status announces the change.

Keep a clear or reset action available when filters can persist.

Do not use placeholder text as the only label.

Do not add a filter control that does not change the result.

## Filter rail

Use `.app-filter-rail` for persistent category or tag navigation.

Use native links when each filter has a stable URL.

Use `aria-current="page"` on the active filter link.

Show a compact result count only when the count helps selection.

Use `.app-filter-list` for categories.

Use `.app-filter-tags` for a tag list.

Collapse the rail before it compresses the primary content.

Move the rail above the results on a narrow page.

Do not use tab roles for route filters.

Do not keep a rail beside content when both columns become difficult to scan.

## Form page

Use one form for one submission task.

Group related controls with fieldsets.

Use visible section headings for long forms.

Place help text before an error appears when the instruction prevents mistakes.

Place error text next to the control that needs correction.

Use one primary submit action.

Use a secondary cancel link or button only when cancellation has a clear destination or effect.

Preserve entered values after validation fails.

Use a status region for the submission result.

Do not split a short task into a stepper.

Do not disable the submit action to conceal incomplete requirements.

## Settings list

Use a fieldset for a group of related settings.

Use a horizontal Field composition for one short checkbox or switch label.

Use Checkbox when the setting selects an option.

Use Switch when the setting changes an immediate system state.

Place the control before the label when the native pattern requires it.

Place supporting text below the label.

Keep one setting on one row.

Separate connected rows with borders.

Do not use a card for each setting.

Do not use Switch for a form value that takes effect only after submission.

## Empty state

Use `.app-empty` for an empty page result.

Use `.app-empty--compact` inside a bordered section.

State what is empty.

State the cause only when the system knows it.

Offer one recovery action when the user can resolve the state.

Use `role="status"` only when the state replaces content asynchronously.

Keep the message short.

Do not add an illustration by default.

Do not add a card inside the empty section.

Do not present a normal first-use state as an error.

## Error state

Use Callout for a persistent page or section error.

Use `role="alert"` only when the error appears dynamically and needs immediate attention.

State the failed task.

State the recovery action.

Keep technical details available but secondary.

Use an Alert Dialog only when the user must respond before work continues.

Use Toast only for a brief result that does not require a decision.

Do not use Toast for a blocking error.

Do not use destructive red for neutral system information.

## Loading state

Keep existing content visible when possible.

Use Spinner for an active control or short waiting state.

Use Progress when the system knows completion.

Use Skeleton only when the final structure is stable and the placeholder reduces layout shift.

Mark decorative skeleton shapes as hidden from assistive technology.

Expose a text status for asynchronous loading.

Stop loading indicators when the task ends.

Do not replace an entire page with many spinners.

Do not animate Skeleton.

Do not show both Spinner and Progress for the same task.

## Confirmation flow

Use Dialog for a reversible or neutral task that needs focused input.

Use Alert Dialog for a destructive or high-impact confirmation.

State the affected object.

State the consequence.

Use one destructive filled action for the final destructive confirmation.

Use an outline or ghost action for cancellation.

Return focus after cancellation or completion.

Do not use a confirmation dialog for a low-risk action with an easy undo.

Do not use destructive language for a neutral close action.

## Command flow

Use Command Palette for global application commands.

Use Dropdown Menu for a small action menu.

Use Navigation Menu for grouped site routes.

Use Combobox for selecting one item from a searchable set.

Use native Select for a short fixed set.

Keep command names as verbs.

Keep route names as nouns or destinations.

Do not use a menu when visible buttons fit and improve discovery.

Do not put normal page navigation in a command palette only.

## Two-panel work area

Use Resizable when the user benefits from changing the split.

Use a static CSS split when resizing does not improve the task.

Give each panel a clear region label.

Keep the separator visible.

Provide keyboard resizing.

Provide a non-drag pointer alternative.

Preserve usable minimum panel sizes.

Stack the panels when the available width cannot support the task.

Do not use Resizable for decorative balance.

Do not make the separator the only way to reach content.

## Reorder flow

Use Sortable only when item order changes meaning or execution.

Keep the item label visible during the task.

Provide keyboard move actions.

Provide non-drag pointer controls.

Announce the new position.

Persist the order only after the application confirms the change.

Offer undo when a reorder has a meaningful consequence.

Do not use drag as the only path.

Do not add reordering to a list that the user does not own.

## Action hierarchy

Use one filled primary action in a local group.

Use Outline for a normal secondary action.

Use Ghost for a low-emphasis local action.

Use Link style for an inline action.

Use Destructive fill only for the final destructive confirmation.

Use a destructive outline or ghost treatment for a non-final destructive option.

Use icon-only actions only when the icon is familiar and the control has an accessible name.

Keep action labels specific.

Do not use “OK” when a specific action name fits.

Do not show duplicate actions in the header and section unless both locations solve a real navigation need.

## Pattern acceptance

Check the pattern against the page task.

Check the pattern against the selected layout family.

Check each component against its skill.

Check the number of outer borders.

Check the action hierarchy.

Check keyboard order.

Check the narrow layout.

Check the empty state.

Check the error state.

Check the loading state.

Remove every element that does not help the task.
