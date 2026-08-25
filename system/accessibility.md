# Accessibility

Use this file as the accessibility acceptance contract.

Read `DESIGN.md` before this file.

## Native semantics

Use a native HTML element when it matches the task.

Use a button for an action.

Use a link for navigation.

Use a checkbox for an independent binary choice.

Use radio controls for one choice from a visible set.

Use a select when the browser picker meets the task.

Use a fieldset and legend for related form controls.

Use a table for data with row and column relationships.

Use a details element for a disclosure.

Use a dialog element for a modal surface.

Use a progress element for completion.

Use a meter element for a bounded scalar value.

Do not add an ARIA role when native HTML already supplies the role.

Do not change native semantics to match a visual treatment.

## Names and descriptions

Give every interactive control an accessible name.

Use a visible text label when space permits it.

Use `aria-label` only when visible text cannot provide the name.

Keep the accessible name consistent with the visible label.

Associate each form label with `for` and `id`.

Use a legend to name a related control group.

Use `aria-describedby` for help text and supporting status.

Use `aria-errormessage` only when the control has `aria-invalid="true"`.

Keep every referenced ID unique and present.

Mark decorative icons with `aria-hidden="true"`.

Give informative images useful alternative text.

Use an empty `alt` value for a decorative image.

## Landmarks and headings

Use one main landmark on each page.

Add a skip link before repeated page chrome.

Point the skip link to the main landmark.

Give each navigation landmark a clear name.

Use headings in document order.

Use one page heading for the primary page task.

Use section headings for distinct page regions.

Do not use a heading only to change text size.

Do not add a landmark around every small group.

## Keyboard

Keep every interactive element in a logical tab order.

Use native keyboard behavior when the element provides it.

Use arrow keys only when the component pattern requires them.

Use Home and End when the documented composite pattern requires them.

Use Escape to close a dismissible top-layer surface.

Return focus to the trigger after a scripted modal or popup closes.

Keep one active tab stop in a roving-focus composite.

Do not add a positive `tabindex`.

Do not trap focus outside a modal dialog.

Do not remove an element from the keyboard path while it remains pointer operable.

## Focus

Show a visible focus indicator for keyboard focus.

Use `:focus-visible` for authored focus treatment.

Use a solid focus perimeter with sufficient contrast.

Keep focus visible over every surface.

Keep focused controls clear of sticky headers and toolbars.

Use scroll padding or scroll margin when sticky chrome can cover a target.

Do not use a shadow as the focus indicator.

Do not remove the browser outline without an equivalent replacement.

## Target size

Use a 40px target for normal controls.

Use a 32px target for compact controls.

Keep a custom pointer target at least 24px by 24px when possible.

Add spacing when a permitted target is smaller than 24px.

Keep adjacent dense controls visually and physically distinct.

Do not reduce a target because the icon is small.

## Forms and errors

Keep a visible label for each form control.

Keep native validation attributes when they express the rule.

Use `required`, `min`, `max`, `step`, and `pattern` when they match the rule.

Show an error near the control that needs correction.

Set `aria-invalid="true"` after the application knows the value is invalid.

Reference inserted error text from the control.

Use `role="alert"` only for an error that appears dynamically.

Keep entered values after a failed submission.

Move focus only when the move helps the user find a blocking error.

Do not use placeholder text as the only label.

Do not disable submission only to hide validation errors.

## Dynamic content

Use `role="status"` for a polite dynamic result.

Use `aria-live="polite"` only when a status role does not meet the task.

Use `role="alert"` for urgent dynamic information that needs immediate announcement.

Keep static callouts without a live role.

Announce the result of filtering when the visible result count changes.

Announce a reorder or resize result when the change is not otherwise clear.

Do not announce the same update from two live regions.

Do not place a live role on a large container that changes often.

## Status and color

Pair every status color with visible text.

Use a status icon only as supporting information.

Keep positive, caution, negative, and running labels explicit.

Use shape or text in addition to color.

Keep status contrast usable in light and dark themes.

Keep status meaning available in forced colors.

Do not use green or red as decoration.

## Dialogs and popovers

Give every dialog an accessible name.

Use `showModal()` for a modal dialog.

Use the native dialog backdrop.

Keep the close action reachable from the keyboard.

Restore focus after a scripted close.

Use a non-modal popover only for content that does not block the page.

Keep a tooltip supplementary.

Do not place essential instructions only in a tooltip.

Do not use a tooltip as an accessible name replacement when a visible label fits.

## Composite widgets

Follow the exact keyboard model in the component skill.

Keep visual state synchronized with ARIA state.

Keep `aria-selected`, `aria-pressed`, `aria-expanded`, and `aria-checked` current.

Keep `aria-activedescendant` on the element that owns DOM focus.

Give every referenced active descendant a stable ID.

Skip disabled items during managed keyboard movement.

Do not combine two different focus models in one component.

## Drag, resize, and reorder

Provide a keyboard path for each drag action.

Provide a single-pointer alternative that does not require dragging.

Use explicit move controls when direct selection cannot replace dragging.

Announce the new position after a reorder.

Keep the separator focusable only when resizing is enabled.

Expose the current value when a resizable separator changes.

Do not require fine pointer movement for the only path.

## Reflow and zoom

Keep normal content usable at a 320px viewport width.

Keep text usable at 200% zoom.

Reflow non-tabular content into one page scroll direction.

Contain two-dimensional scrolling inside a table, grid, code block, or media region.

Keep sticky chrome from covering focused content.

Wrap long labels and values when the task permits it.

Expose a full value when visual truncation is necessary.

Do not create page-level horizontal scrolling.

Do not hide an action only because the viewport is narrow.

## Contrast modes

Support `prefers-contrast: more`.

Support `forced-colors: active`.

Use system colors inside forced-colors rules.

Keep borders visible in forced colors.

Keep the current item visible in forced colors.

Keep focus visible in forced colors.

Do not depend on background images for meaning.

## No-JavaScript behavior

Keep native navigation usable without JavaScript.

Keep native form submission usable without JavaScript.

Keep native validation usable without JavaScript.

Keep details disclosures usable without JavaScript.

Keep native date inputs usable without JavaScript.

Keep documented static tables and content readable without JavaScript.

Hide an enhancement trigger when it cannot work without its module.

State the no-JavaScript behavior in each enhanced component skill.

Do not render a dead control.

## Test procedure

Use the keyboard to reach every control.

Use the keyboard to operate every control.

Check the focus order.

Check the visible focus indicator.

Check the skip link.

Check the accessible names.

Check each label and description relationship.

Check each dynamic status announcement.

Check each dialog and popover close path.

Check the page at 200% zoom.

Check the page at 320px width.

Check increased contrast.

Check forced colors.

Check the no-JavaScript path.

Check a screen reader for each new composite widget.
