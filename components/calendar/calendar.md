# Calendar

## Native basis

`<table>` element rendered as a month grid with navigation controls. Uses `role="grid"` for accessible day cell navigation.

## Native Web APIs

- [`<table>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table) — tabular grid for the month
- [`role="grid"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/grid_role) — ARIA grid pattern for 2D keyboard navigation
- [`<button>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button) — navigation and day selection buttons

## Structure

```html
<div class="calendar">
  <div class="calendar-header">
    <button class="calendar-nav" data-action="prev-month" aria-label="Previous month">
      <svg><!-- chevron left --></svg>
    </button>
    <span class="calendar-heading" aria-live="polite">April 2026</span>
    <button class="calendar-nav" data-action="next-month" aria-label="Next month">
      <svg><!-- chevron right --></svg>
    </button>
  </div>
  <table class="calendar-grid" role="grid">
    <thead>
      <tr>
        <th class="calendar-day-label" abbr="Sunday" scope="col">Sun</th>
        <th class="calendar-day-label" abbr="Monday" scope="col">Mon</th>
        <!-- ... -->
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="calendar-day" data-outside role="gridcell" aria-selected="false">
          <button type="button" tabindex="-1" data-date="2026-03-29" data-outside="prev">29</button>
        </td>
        <td class="calendar-day" role="gridcell" aria-selected="false">
          <button type="button" tabindex="0" data-date="2026-04-01">1</button>
        </td>
        <!-- ... -->
      </tr>
    </tbody>
  </table>
</div>
```

## Day cell states

| Class                   | Description                        |
|-------------------------|------------------------------------|
| `calendar-day`          | Base day cell                      |
| `data-today`    | Today's date                       |
| `data-selected` | Selected date                      |
| `data-outside`  | Day from adjacent month            |
| `data-disabled` | Non-selectable date                |

## Accessibility

- Month heading uses `aria-live="polite"` for navigation announcements
- Day cells contain focusable buttons with an accessible date label
- A roving `tabindex` keeps one day button in the tab order at a time
- Arrow keys navigate the grid, Enter/Space selects a day
- Previous/next navigation buttons have `aria-label`
