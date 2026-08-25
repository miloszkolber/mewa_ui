# Components

Use this file to select a component.

Read `DESIGN.md` before this file.

Read the matching component skill before you write markup.

The Purpose sentence states the component task.

The Use sentence states the intended selection condition.

The Avoid sentence states the nearest misuse.

The Behavior sentence states the user-visible contract.

The Runtime sentence states the JavaScript requirement.

The Contract link points to the exact markup and accessibility guide.

## Selection rules

Select the native element before a custom component.

Select the smallest component that completes the task.

Use one component for one primary responsibility.

Use a pattern when several components form a repeated task.

Use a layout when the page needs a complete shell.

Do not select a component from its visual appearance alone.

Do not select a component from a name used by another library.

Do not load a module when Runtime states `None`.

Load an optional module only when the interface uses its documented enhancement.

Load a required module whenever the interface uses the documented interactive component.

## Primitives
### Typography

Purpose: Formats document text, code, quotations, keyboard notation, and lists.

Use Typography for normal document hierarchy and readable prose.

Do not use Typography classes to imitate controls or status.

Behavior: The browser keeps the native text semantics and reading order.

Runtime: None.

Contract: [`components/typography/typography.md`](../components/typography/typography.md).

### Layout

Purpose: Creates intrinsic containers, stacks, grids, sidebar splits, centering, and opposite-end groups.

Use Layout for local page and component composition.

Do not use Layout as a replacement for App Shell or a complete template.

Behavior: CSS Grid and Flexbox adapt the composition without JavaScript.

Runtime: None.

Contract: [`components/layout/layout.md`](../components/layout/layout.md).

### Separator

Purpose: Marks a real visual or semantic division.

Use a horizontal rule for a topic break and a vertical separator for a labelled structural split.

Do not add a separator only to decorate empty space.

Behavior: The browser exposes a horizontal rule natively and ARIA exposes the documented vertical separator.

Runtime: None.

Contract: [`components/separator/separator.md`](../components/separator/separator.md).

### Icon

Purpose: Presents a local Lucide glyph inside text or a control.

Use Icon to support a visible label or a familiar icon-only action.

Do not use an icon as the only status explanation.

Behavior: Inline SVG provides the complete no-JavaScript path.

Runtime: None.

Contract: [`components/icon/icon.md`](../components/icon/icon.md).

## Actions
### Button

Purpose: Starts an action, submits a form, or styles a navigation link as a button.

Use a button for an action and an anchor for navigation.

Do not put a navigation destination on a button element.

Behavior: The browser provides focus, keyboard activation, disabled state, and form behavior.

Runtime: None.

Contract: [`components/button/button.md`](../components/button/button.md).

### Toggle

Purpose: Changes one independent pressed state.

Use Toggle for formatting controls and independent two-state tools.

Do not use Toggle for a submitted form setting when Checkbox or Switch matches the task.

Behavior: The module changes `aria-pressed` after native button activation.

Runtime: Required.

Contract: [`components/toggle/toggle.md`](../components/toggle/toggle.md).

### Toggle Group

Purpose: Coordinates a set of related pressed buttons.

Use Toggle Group for one or several choices in a compact toolbar.

Do not use Toggle Group when native radio or checkbox controls fit the form task.

Behavior: The module manages selection mode and roving keyboard focus.

Runtime: Required.

Contract: [`components/toggle-group/toggle-group.md`](../components/toggle-group/toggle-group.md).

### Button Group

Purpose: Connects related buttons into one visual control group.

Use Button Group when adjacent actions share one task or object.

Do not group unrelated actions only to save space.

Behavior: Native buttons keep their own activation and form behavior.

Runtime: None.

Contract: [`components/button-group/button-group.md`](../components/button-group/button-group.md).

### Toolbar

Purpose: Groups frequently used controls with managed arrow-key navigation.

Use Toolbar for a compact row of related application controls.

Do not use Toolbar for normal form fields or route navigation.

Behavior: The module manages roving focus while each control keeps its native action.

Runtime: Required.

Contract: [`components/toolbar/toolbar.md`](../components/toolbar/toolbar.md).

## Forms and inputs
### Label

Purpose: Names one native form control.

Use Label with an explicit `for` and `id` pair.

Do not use placeholder text as the only control name.

Behavior: The browser exposes the association and moves focus when the label is activated.

Runtime: None.

Contract: [`components/label/label.md`](../components/label/label.md).

### Field

Purpose: Composes a label, native control, help text, error text, and related fieldsets.

Use Field as the standard wrapper for form controls and control groups.

Do not add an unnamed group role around one control.

Behavior: Native labels, validation, submission, and reset remain authoritative.

Runtime: None.

Contract: [`components/field/field.md`](../components/field/field.md).

### Text Field

Purpose: Collects one line of text with labels, descriptions, icons, and validation.

Use Text Field for text, email, password, search, URL, and similar native input types.

Do not use Text Field for multi-line content or fixed option selection.

Behavior: The native input owns editing, autofill, validation, and events.

Runtime: None.

Contract: [`components/text-field/text-field.md`](../components/text-field/text-field.md).

### Textarea

Purpose: Collects multi-line text.

Use Textarea when the user can enter more than one line.

Do not use Textarea for a short fixed-format value.

Behavior: The browser owns editing and validation while CSS can size the field from its content.

Runtime: None.

Contract: [`components/textarea/textarea.md`](../components/textarea/textarea.md).

### Checkbox

Purpose: Selects one independent option or several independent options.

Use Checkbox for submitted choices and select-all groups.

Do not use Checkbox for one immediate system state when Switch communicates the effect better.

Behavior: The native checkbox owns checked state and the optional module coordinates documented group behavior.

Runtime: Optional.

Contract: [`components/checkbox/checkbox.md`](../components/checkbox/checkbox.md).

### Radio Group

Purpose: Selects one value from a visible set.

Use Radio Group when the options are short and all options should remain visible.

Do not use Radio Group for independent choices or a very long option set.

Behavior: Native radios share selection through their common `name`.

Runtime: None.

Contract: [`components/radio-group/radio-group.md`](../components/radio-group/radio-group.md).

### Switch

Purpose: Changes an immediate binary system state.

Use Switch when activation takes effect immediately.

Do not use Switch for a value that takes effect only after form submission.

Behavior: The native checkbox owns focus, keyboard input, checked state, and submission.

Runtime: None.

Contract: [`components/switch/switch.md`](../components/switch/switch.md).

### Slider

Purpose: Selects a value from a continuous or stepped numeric range.

Use Slider when spatial adjustment helps the user understand the value.

Do not use Slider when precise text entry is the only useful path.

Behavior: The native range input owns keyboard and pointer adjustment while the module updates documented output.

Runtime: Required.

Contract: [`components/slider/slider.md`](../components/slider/slider.md).

### Select

Purpose: Selects one or several values from a fixed native option list.

Use Select for a short or medium fixed option set.

Do not use Select when the user needs to search a long list.

Behavior: The browser owns the picker, keyboard behavior, and form submission.

Runtime: None.

Contract: [`components/select/select.md`](../components/select/select.md).

### Number Field

Purpose: Collects a numeric value with explicit increment and decrement controls.

Use Number Field when small step changes are common.

Do not use Number Field when a range or free text input communicates the task better.

Behavior: The module calls the native number input step methods and keeps input events available.

Runtime: Required.

Contract: [`components/number-field/number-field.md`](../components/number-field/number-field.md).

### File Input

Purpose: Opens the native file picker.

Use File Input when the user must choose one or more local files.

Do not create a custom file picker that hides the native input contract.

Behavior: The browser owns file selection, security, and form submission.

Runtime: None.

Contract: [`components/file-input/file-input.md`](../components/file-input/file-input.md).

### Date Field

Purpose: Collects a date or local date and time with the browser control.

Use Date Field when the browser picker meets the task.

Do not use Date Field when the interface requires a controlled month grid or date-range preview.

Behavior: The browser owns parsing, keyboard entry, picker behavior, and validation.

Runtime: None.

Contract: [`components/date-field/date-field.md`](../components/date-field/date-field.md).

### Date Picker

Purpose: Selects a date from a custom accessible month grid.

Use Date Picker when the product requires a consistent visible calendar.

Do not use Date Picker when a native Date Field is sufficient.

Behavior: The module manages month navigation, grid focus, selection, and date state.

Runtime: Required.

Contract: [`components/date-picker/date-picker.md`](../components/date-picker/date-picker.md).

### Date Range Picker

Purpose: Collects a start date and an end date with native inputs.

Use Date Range Picker for a submitted interval that benefits from a shared summary.

Do not use Date Range Picker for one date or a custom calendar grid.

Behavior: Native inputs remain usable and the optional module checks the cross-field range and updates the summary.

Runtime: Optional.

Contract: [`components/date-range-picker/date-range-picker.md`](../components/date-range-picker/date-range-picker.md).

### Combobox

Purpose: Selects one option from a searchable list.

Use Combobox when a long option set needs search and keyboard selection.

Do not use Combobox for free text or a short fixed list.

Behavior: The module filters options, manages active state, selects a value, and synchronizes ARIA.

Runtime: Required.

Contract: [`components/combobox/combobox.md`](../components/combobox/combobox.md).

### Time Field

Purpose: Collects a structured time from native numeric fields and a period selector.

Use Time Field when separate time segments improve entry and validation.

Do not use Time Field when a native time input is the simpler contract.

Behavior: Native controls remain usable and the optional module synchronizes the submitted value.

Runtime: Optional.

Contract: [`components/time-field/time-field.md`](../components/time-field/time-field.md).

### Form

Purpose: Composes a complete native submission task.

Use Form for one coherent submit and validation flow.

Do not use Form as a visual wrapper when no submission exists.

Behavior: The browser owns submission, reset, and constraint validation.

Runtime: None.

Contract: [`components/form/form.md`](../components/form/form.md).

## Data display
### Badge

Purpose: Shows short non-interactive status or metadata.

Use Badge for a concise label that supplements nearby content.

Do not use Badge as a button, link, or sole status explanation.

Behavior: The badge remains ordinary text in the accessibility tree.

Runtime: None.

Contract: [`components/badge/badge.md`](../components/badge/badge.md).

### Avatar

Purpose: Shows a person or entity image with a fallback and optional status.

Use Avatar when identity recognition helps the task.

Do not use Avatar as a decorative circle without identity meaning.

Behavior: The module handles the documented image fallback while the image alternative remains authoritative.

Runtime: Required.

Contract: [`components/avatar/avatar.md`](../components/avatar/avatar.md).

### Card

Purpose: Groups one standalone object or a small related content set.

Use Card when the group must read as one independent object.

Do not use Card as the default wrapper for sections, tables, rows, forms, or other cards.

Behavior: The card adds presentation only and keeps the chosen semantic container.

Runtime: None.

Contract: [`components/card/card.md`](../components/card/card.md).

### Image

Purpose: Presents an image, caption, fallback, and optional larger preview.

Use Image when visual content carries information.

Do not use Image when a CSS decoration has no content meaning.

Behavior: The module opens the documented dialog preview and preserves the figure and image semantics.

Runtime: Required.

Contract: [`components/image/image.md`](../components/image/image.md).

### Statistic

Purpose: Shows one value with a label, description, and optional trend.

Use Statistic for a small summary that helps the next decision.

Do not use Statistic for a value already obvious in the primary data view.

Behavior: The component remains static semantic text.

Runtime: None.

Contract: [`components/statistic/statistic.md`](../components/statistic/statistic.md).

### Table

Purpose: Presents data with stable row and column relationships.

Use Table when headers define the meaning of cells.

Do not use Table for general page layout.

Behavior: Native table semantics, captions, and header scopes remain available.

Runtime: None.

Contract: [`components/table/table.md`](../components/table/table.md).

### Data Table

Purpose: Adds filtering, sorting, status, and pagination around Table.

Use Data Table when the documented data controls are necessary.

Do not use Data Table when a static Table meets the task.

Behavior: The semantic table and native links remain usable while the optional module adds client behavior.

Runtime: Optional.

Contract: [`components/data-table/data-table.md`](../components/data-table/data-table.md).

### Collapsible

Purpose: Reveals and hides supplementary content.

Use Collapsible for optional detail that can remain closed.

Do not hide required instructions or primary actions in a disclosure.

Behavior: Native details and summary behavior works without JavaScript.

Runtime: None.

Contract: [`components/collapsible/collapsible.md`](../components/collapsible/collapsible.md).

### Timeline

Purpose: Presents events or steps in chronological or procedural order.

Use Timeline when sequence is the main relationship.

Do not use Timeline for an unordered status list.

Behavior: The ordered list preserves the sequence without JavaScript.

Runtime: None.

Contract: [`components/timeline/timeline.md`](../components/timeline/timeline.md).

### Tree View

Purpose: Presents hierarchical items with expandable branches.

Use Tree View when parent and child structure must remain visible.

Do not use Tree View for a flat route list or ordinary disclosure list.

Behavior: The module manages tree keyboard navigation, branch state, and roving focus.

Runtime: Required.

Contract: [`components/tree-view/tree-view.md`](../components/tree-view/tree-view.md).

### Carousel

Purpose: Presents a sequence of slides in a bounded scroll region.

Use Carousel when sequential visual items must share one space.

Do not use Carousel for required content that should remain visible in a normal list.

Behavior: Native scrolling remains available and the module coordinates controls and active indicators.

Runtime: Required.

Contract: [`components/carousel/carousel.md`](../components/carousel/carousel.md).

### Scroll Area

Purpose: Contains overflow inside a bounded region.

Use Scroll Area when a local region must scroll independently.

Do not create nested scrolling when normal page flow works.

Behavior: Native overflow and browser scrollbars provide the behavior.

Runtime: None.

Contract: [`components/scroll-area/scroll-area.md`](../components/scroll-area/scroll-area.md).

### Sortable

Purpose: Reorders a user-owned list.

Use Sortable when item order changes meaning or execution.

Do not use Sortable when order is fixed or when drag would be the only path.

Behavior: The module supports drag, keyboard movement, and announced position changes.

Runtime: Required.

Contract: [`components/sortable/sortable.md`](../components/sortable/sortable.md).

## Feedback and status
### Spinner

Purpose: Shows that an indeterminate task is active.

Use Spinner for short active work with an accompanying status name.

Do not use Spinner for decoration or known completion.

Behavior: CSS rotation provides the only sanctioned library animation.

Runtime: None.

Contract: [`components/spinner/spinner.md`](../components/spinner/spinner.md).

### Skeleton

Purpose: Reserves the shape of content that is loading.

Use Skeleton when the final structure is known and the placeholder prevents layout shift.

Do not use Skeleton for unknown content or as an animated effect.

Behavior: Static decorative shapes remain hidden from assistive technology.

Runtime: None.

Contract: [`components/skeleton/skeleton.md`](../components/skeleton/skeleton.md).

### Progress

Purpose: Shows known task completion.

Use Progress when the system knows the current value and maximum.

Do not use Progress for an indeterminate task.

Behavior: The native progress element exposes the bounded value.

Runtime: None.

Contract: [`components/progress/progress.md`](../components/progress/progress.md).

### Callout

Purpose: Presents persistent important information in the page flow.

Use Callout for guidance, warning, success, or error content that remains visible.

Do not add a live alert role to static information.

Behavior: The region remains normal semantic content unless the documented urgent role is explicitly needed.

Runtime: None.

Contract: [`components/callout/callout.md`](../components/callout/callout.md).

### Alert Dialog

Purpose: Requires an explicit response to a high-impact decision.

Use Alert Dialog for destructive or blocking confirmation.

Do not use Alert Dialog for low-risk information or an easy undo.

Behavior: The module opens a native modal dialog and coordinates the documented response flow.

Runtime: Required.

Contract: [`components/alert-dialog/alert-dialog.md`](../components/alert-dialog/alert-dialog.md).

### Toast

Purpose: Announces a brief non-blocking result.

Use Toast for a short status that does not require a decision.

Do not use Toast for a blocking error or essential instructions.

Behavior: The module manages the manual popover and polite live status.

Runtime: Required.

Contract: [`components/toast/toast.md`](../components/toast/toast.md).

## Overlays
### Popover

Purpose: Shows non-modal contextual content in the top layer.

Use Popover for a small surface that relates to one trigger.

Do not use Popover for a blocking task or large form.

Behavior: The module coordinates documented trigger and positioning behavior on the native Popover API.

Runtime: Required.

Contract: [`components/popover/popover.md`](../components/popover/popover.md).

### Tooltip

Purpose: Shows a short supplementary hint on hover and focus.

Use Tooltip to clarify an unfamiliar icon or terse control.

Do not place essential instructions only in a tooltip.

Behavior: The module coordinates hint popovers while the trigger remains keyboard focusable.

Runtime: Required.

Contract: [`components/tooltip/tooltip.md`](../components/tooltip/tooltip.md).

### Dialog

Purpose: Contains a focused modal task.

Use Dialog for a task that must temporarily block the page.

Do not use Dialog for ordinary page content or a simple status.

Behavior: The module opens the native dialog, restores focus, and coordinates documented controls.

Runtime: Required.

Contract: [`components/dialog/dialog.md`](../components/dialog/dialog.md).

### Sheet

Purpose: Presents an edge-aligned modal task.

Use Sheet when the task benefits from a persistent edge orientation.

Do not use Sheet only to imitate a fashionable panel.

Behavior: The module uses native modal dialog behavior and the documented side state.

Runtime: Required.

Contract: [`components/sheet/sheet.md`](../components/sheet/sheet.md).

### Accordion

Purpose: Groups several disclosure sections.

Use Accordion when users can inspect one or several optional sections.

Do not use Accordion for primary sequential content that should remain visible.

Behavior: Native details elements support multi-open mode and the optional module coordinates single-open mode.

Runtime: Optional.

Contract: [`components/accordion/accordion.md`](../components/accordion/accordion.md).

### Command Palette

Purpose: Finds and activates global application commands.

Use Command Palette for a large command set that benefits from search.

Do not use Command Palette as the only route to normal navigation or common actions.

Behavior: The module manages the modal dialog, filtering, keyboard selection, and activation.

Runtime: Required.

Contract: [`components/command-palette/command-palette.md`](../components/command-palette/command-palette.md).

## Navigation
### Breadcrumbs

Purpose: Shows the current route within a hierarchy.

Use Breadcrumbs when parent routes help orientation or navigation.

Do not use Breadcrumbs on a flat site or as a page title replacement.

Behavior: Native links and ordered-list semantics provide the path.

Runtime: None.

Contract: [`components/breadcrumbs/breadcrumbs.md`](../components/breadcrumbs/breadcrumbs.md).

### Pagination

Purpose: Moves between result pages.

Use Pagination when the result set has stable page URLs.

Do not use Pagination for a small list or an in-page tab switch.

Behavior: Native links preserve navigation, history, and no-JavaScript use.

Runtime: None.

Contract: [`components/pagination/pagination.md`](../components/pagination/pagination.md).

### Tabs

Purpose: Switches among related panels within one route.

Use Tabs when panels are peers and only one panel is active.

Do not use Tabs for application routes or sequential steps.

Behavior: The module manages tab selection, roving focus, and panel visibility.

Runtime: Required.

Contract: [`components/tabs/tabs.md`](../components/tabs/tabs.md).

### Dropdown Menu

Purpose: Shows a compact set of actions from one trigger.

Use Dropdown Menu when visible buttons would create excessive local clutter.

Do not use Dropdown Menu for primary site navigation or form option selection.

Behavior: The module manages the popover, menu keyboard model, and item activation.

Runtime: Required.

Contract: [`components/dropdown-menu/dropdown-menu.md`](../components/dropdown-menu/dropdown-menu.md).

### Navigation Menu

Purpose: Groups related site routes in top-level navigation popovers.

Use Navigation Menu when a route group is too large for a flat top navigation.

Do not use Navigation Menu for application actions or a small route set.

Behavior: The module coordinates route popovers and documented keyboard behavior.

Runtime: Required.

Contract: [`components/navigation-menu/navigation-menu.md`](../components/navigation-menu/navigation-menu.md).

## Application
### App Shell

Purpose: Provides reusable application header, toolbar, page overview, content, status, and empty-state primitives.

Use App Shell to compose shared application chrome and utility page regions.

Do not treat App Shell as a complete route template or business-content component.

Behavior: Semantic landmarks work without JavaScript and the optional module adds the persisted theme toggle.

Runtime: Optional.

Contract: [`components/app-shell/app-shell.md`](../components/app-shell/app-shell.md).

### Sidebar

Purpose: Provides collapsible desktop navigation and a mobile navigation dialog.

Use Sidebar for applications with persistent route navigation.

Do not use Sidebar for a small flat site that fits top navigation.

Behavior: The module manages collapse state, shortcut behavior, ARIA state, and mobile dialog triggers.

Runtime: Required.

Contract: [`components/sidebar/sidebar.md`](../components/sidebar/sidebar.md).

### Resizable

Purpose: Presents two panels with an optional adjustable separator.

Use Resizable when changing the split improves a repeated work task.

Do not use Resizable for decorative balance or when a static split is sufficient.

Behavior: The static separator remains understandable and the optional module adds pointer and keyboard resizing.

Runtime: Optional.

Contract: [`components/resizable/resizable.md`](../components/resizable/resizable.md).
