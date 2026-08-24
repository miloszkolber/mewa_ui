# Table

## Native basis

`<table>` with semantic `<caption>`, `<thead>`, `<tbody>`, `<tfoot>`, scoped headers, and native table cells. Table is the structural component. It has no required JavaScript and remains a normal HTML table in every rendering environment.

## Native web APIs

- [`<table>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table) — tabular data container
- [`<caption>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption) — accessible table name and description
- [`<thead>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead), [`<tbody>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody), and [`<tfoot>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot) — table row groups
- [`<th scope>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th#scope) — associates column and row headers with their cells
- [`<td>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td) — native data cell
- [`<div>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div) with `overflow-x: auto` — keeps wide tables usable at narrow widths

## Structure

### Plain table

Keep one descriptive caption and explicit header scopes. The same markup works with or without JavaScript.

```html
<div class="table-container" role="region" aria-label="Recent invoices" tabindex="0">
  <table class="table">
    <caption class="table-caption">A list of recent invoices.</caption>
    <thead>
      <tr class="table-row">
        <th class="table-head" scope="col">Invoice</th>
        <th class="table-head" scope="col">Status</th>
        <th class="table-head" scope="col">Method</th>
        <th class="table-head" scope="col" style="text-align: right">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr class="table-row">
        <th class="table-cell" scope="row">INV001</th>
        <td class="table-cell">Paid</td>
        <td class="table-cell">Credit card</td>
        <td class="table-cell" style="text-align: right">$250.00</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="table-row">
        <th class="table-cell" scope="row" colspan="3">Total</th>
        <td class="table-cell" style="text-align: right">$2,500.00</td>
      </tr>
    </tfoot>
  </table>
</div>
```

### Table with a footer

Use `<tfoot>` for a total or other summary that belongs to the table. Keep the summary label in a row header when it describes the row.

```html
<div class="table-container" role="region" aria-label="Monthly usage" tabindex="0">
  <table class="table">
    <caption class="table-caption">Monthly usage</caption>
    <thead>
      <tr class="table-row">
        <th class="table-head" scope="col">Workspace</th>
        <th class="table-head" scope="col">Requests</th>
      </tr>
    </thead>
    <tbody>
      <tr class="table-row">
        <th class="table-cell" scope="row">Atlas</th>
        <td class="table-cell">42,000</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="table-row">
        <th class="table-cell" scope="row">Total</th>
        <td class="table-cell">42,000</td>
      </tr>
    </tfoot>
  </table>
</div>
```

## Classes

| Class | Element | Purpose |
| --- | --- | --- |
| `.table-container` | `<div>` | Bordered horizontal overflow region around the table |
| `.table` | `<table>` | Table geometry and typography |
| `.table-caption` | `<caption>` | Caption styling |
| `.table-head` | `<th>` | Header styling |
| `.table-cell` | `<th>` or `<td>` | Body and footer cell styling |
| `.table-row` | `<tr>` | Row styling hook |

Behavioral filtering, sorting, status, empty results, and pagination belong to [Data Table](../../docs/data-table.html). Data Table composes this structural markup with Text Field and Pagination. Its optional module does not change the underlying table semantics.

## Accessibility

- Keep one descriptive `<caption>` for every table.
- Use `scope="col"` for column headers and `scope="row"` for row headers. Use `headers` and `id` when a complex table needs explicit associations.
- Keep row headers as `<th scope="row">` rather than turning the table into a collection of generic `<div>` elements.
- Put wide tables inside `.table-container` so horizontal scrolling does not change the table's semantic structure.
- When an overflow container has no links, buttons, or other focusable descendants, add `tabindex="0"`, `role="region"`, and an accessible name so keyboard users can scroll it. Do not add a redundant tab stop when the table already contains focusable controls.

## Notes

- Table is CSS-only. It does not require a module, event handlers, or a runtime dependency.
- Add only the table sections that the data needs. A footer is optional.
- Header labels use 0.75rem Geist Mono in uppercase. Header fills, row hover fills, and horizontal row rules are intentionally omitted.
- Avatar cells align the avatar and adjacent label on the middle axis without changing table semantics.
- Use logical table markup before adding visual treatments. The stylesheet stays square, tokenized, and motionless.
