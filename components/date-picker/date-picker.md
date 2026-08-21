# Pattern: Date Picker

## Native basis

`<table>` element rendered as a month grid with navigation controls. Uses `role="grid"` for accessible day cell navigation. The `.date-picker` markup API follows the Date Picker component name.

## Native Web APIs

- [`<table>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table) — tabular grid for the month
- [`role="grid"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/grid_role) — ARIA grid pattern for 2D keyboard navigation
- [`<button>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button) — navigation and day selection buttons

## Structure

```html
<div class="date-picker">
  <div class="date-picker-header">
    <button class="btn date-picker-nav" type="button" data-variant="ghost" data-action="prev-month" aria-label="Previous month">
      <svg aria-hidden="true"><!-- chevron left --></svg>
    </button>
    <span class="date-picker-heading" aria-live="polite">April 2026</span>
    <button class="btn date-picker-nav" type="button" data-variant="ghost" data-action="next-month" aria-label="Next month">
      <svg aria-hidden="true"><!-- chevron right --></svg>
    </button>
  </div>
  <table class="date-picker-grid" role="grid">
    <thead>
      <tr>
        <th class="date-picker-day-label" abbr="Sunday" scope="col">Sun</th>
        <th class="date-picker-day-label" abbr="Monday" scope="col">Mon</th>
        <!-- ... -->
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="date-picker-day" data-outside role="gridcell" aria-selected="false">
          <button type="button" tabindex="-1" data-date="2026-03-29" data-outside="prev">29</button>
        </td>
        <td class="date-picker-day" role="gridcell" aria-selected="false">
          <button type="button" tabindex="0" data-date="2026-04-01">1</button>
        </td>
        <!-- ... -->
      </tr>
    </tbody>
  </table>
</div>
```

## Day cell states

| Attribute or class | Element | Description |
|---|---|---|
| `date-picker-day` | `<td>` | Base day cell |
| `data-today` | `<td>` | Today's date |
| `data-selected` | `<td>` | Selected date |
| `data-outside` | `<td>` | Day from an adjacent month |
| `data-disabled` | `<td>` | Non-selectable date when supplied by an embedding application |

## Accessibility

- Month heading uses `aria-live="polite"` for navigation announcements
- The grid has an `aria-label` for the rendered month and day buttons have localized accessible date labels
- Day cells expose `aria-selected`, and today's cell exposes `aria-current="date"`
- A roving `tabindex` keeps one day button in the tab order at a time
- Arrow keys navigate the grid, while native button Enter/Space activation selects a day
- Previous/next navigation buttons have `type="button"` and an `aria-label`
- Selected day focus is restored after the module re-renders the month grid

## Notes

- The module renders `.date-picker` markup and initializes each picker once. It emits a bubbling `date-picker:select` event with the selected `Date`.
- Month changes and selection updates are immediate. The component adds no animation, transition, smooth scrolling, or custom focus trap.
- This is a custom month grid, not the browser popup used by [Date Field](../date-field/date-field.md). Use Date Field when native date input behavior is the requirement.

## Visual notes

- Month navigation uses compact ghost buttons. The controls retain visible focus without adding a filled button surface.
