# Date Picker

## Purpose

Date Picker selects one date from a visible custom month grid.

Use Date Picker when a visible calendar is a product requirement.

Use Date Field when the browser date input meets the task.

Do not use Date Picker only to restyle the browser picker.

## Native basis

Date Picker renders a semantic `<table>` as an ARIA grid.

Native buttons provide month navigation and date selection.

The module renders the current month, manages grid focus, and dispatches the selected date.

## Native Web APIs

- [`<table>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table) provides the month structure.
- [`role="grid"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/grid_role) exposes two-dimensional managed navigation.
- [`<button>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button) provides date and month actions.
- [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) localizes month, weekday, and date names.
- [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) reports date selection to the application.

## Structure

```html
<div class="date-picker">
  <div class="date-picker-header">
    <button class="btn date-picker-nav"
            type="button"
            data-variant="ghost"
            data-action="prev-month"
            aria-label="Previous month">
      <i class="ri-arrow-left-s-line" aria-hidden="true"></i>
    </button>

    <span class="date-picker-heading" aria-live="polite"></span>

    <button class="btn date-picker-nav"
            type="button"
            data-variant="ghost"
            data-action="next-month"
            aria-label="Next month">
      <i class="ri-arrow-right-s-line" aria-hidden="true"></i>
    </button>
  </div>

  <table class="date-picker-grid" role="grid"></table>
</div>
```

The module creates the weekday headers and date cells.

Do not author generated date cells as application data.

Do not depend on generated internal markup beyond the documented classes and states.

## Generated states

The module adds `data-today` to today's cell.

The module adds `data-selected` to the selected cell.

The module adds `data-outside` to dates from an adjacent month.

The module sets `aria-current="date"` on today's cell.

The module sets `aria-selected` on each grid cell.

Do not author `data-selected` or `data-today` as persistent application state.

## Behavior

The component initially renders the current month.

Previous and next actions render the adjacent month.

Selecting an outside-month date moves the grid to that date's month.

Selecting a date updates the selected cell.

Selecting a date returns focus to the selected date button after the grid re-renders.

The month heading updates in a polite live region.

Date selection feedback uses the shared fast motion primitives. Month changes remain immediate.

## Keyboard

Arrow Right moves one rendered day forward when that day is present in the current grid.

Arrow Left moves one rendered day backward when that day is present in the current grid.

Arrow Down moves one rendered week forward when that day is present in the current grid.

Arrow Up moves one rendered week backward when that day is present in the current grid.

Enter or Space selects the focused date through native button activation.

Tab moves between the month navigation controls and the one active grid tab stop.

Do not document Home, End, Page Up, or Page Down until the module implements them.

## Events

The root dispatches `date-picker:select` after a date is selected.

The event bubbles.

The event detail is `{ date }` where `date` is a JavaScript `Date` object.

Use the event to synchronize application form state when the selected date must submit.

Date Picker does not create a hidden form input.

## Accessibility

Give the surrounding field or region a visible label when the calendar needs one.

Keep month navigation buttons explicitly named.

Hide decorative icons from assistive technology.

Keep one date button in the tab order.

Keep localized full-date names on generated date buttons.

Keep the month heading available for month-change announcements.

Do not use Date Picker for a required form value without an application-owned submitted control.

Do not claim disabled-date support until the component exposes a stable constraint API.

## Runtime

Load `date-picker.js` whenever Date Picker appears.

The empty grid has no useful selection behavior without the module.

Use Date Field when a complete no-JavaScript date-selection path is required.
