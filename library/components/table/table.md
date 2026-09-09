# Table

## Purpose

Table presents data with stable row and column relationships.

Use Table when headers define the meaning of cells.

Use Data Table when the page also needs documented filtering, sorting, result status, or pagination.

Do not use Table for page layout.

## Visual contract

Default table heads and cells use a 36px row height, 8px padding, 14px regular text, and a bottom static border. Rows and headings use the control-hover surface on hover.

Data Table inherits this default Table contract. The repository-only `table--dense` treatment may add vertical density where a terminal-style view needs it.

## Native basis

Use native `<table>` markup.

Use `<caption>` to name the data set.

Use `<thead>`, `<tbody>`, and `<tfoot>` only when the data needs those row groups.

Use scoped `<th>` cells for row and column headers.

Table requires no JavaScript.

## Native Web APIs

- [`<table>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table) provides tabular semantics.
- [`<caption>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption) names the table.
- [`<thead>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead) groups column headers.
- [`<tbody>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody) groups body rows.
- [`<tfoot>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot) groups table summaries.
- [`<th scope>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th#scope) associates headers with cells.

## Structure

Keep one descriptive caption.

Keep explicit header scopes.

Contain horizontal overflow in `.table-container`.

```html
<div class="table-container" role="region" aria-label="Recent invoices" tabindex="0">
  <table class="table">
    <caption class="table-caption">Recent invoices.</caption>
    <thead>
      <tr class="table-row">
        <th class="table-head" scope="col">Invoice</th>
        <th class="table-head" scope="col">Status</th>
        <th class="table-head" scope="col">Method</th>
        <th class="table-head" scope="col">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr class="table-row">
        <th class="table-cell" scope="row">INV001</th>
        <td class="table-cell">Paid</td>
        <td class="table-cell">Credit card</td>
        <td class="table-cell">$250.00</td>
      </tr>
    </tbody>
  </table>
</div>
```

Use a column class in consumer CSS when a numeric column needs end alignment.

Do not use inline style attributes in canonical table markup.

## Footer

Use `<tfoot>` when the summary belongs to the table.

```html
<tfoot>
  <tr class="table-row">
    <th class="table-cell" scope="row" colspan="3">Total</th>
    <td class="table-cell">$2,500.00</td>
  </tr>
</tfoot>
```

Keep the summary label as a row header.

## Classes

| Class | Element | Purpose |
| --- | --- | --- |
| `.table-container` | `<div>` | Contains horizontal overflow. |
| `.table` | `<table>` | Applies shared table geometry and typography. |
| `.table-caption` | `<caption>` | Styles the caption. |
| `.table-head` | `<th>` | Styles column headers. |
| `.table-cell` | `<th>` or `<td>` | Styles body and footer cells. |
| `.table-row` | `<tr>` | Provides the row styling hook. |

## Behavior

Table adds no filtering, sorting, pagination, or selection behavior.

Wide tables scroll inside `.table-container`.

The table keeps one semantic data structure at every viewport.

The component adds no JavaScript behavior.

## Accessibility

Keep one descriptive caption.

Use `scope="col"` for column headers.

Use `scope="row"` for row headers.

Use `headers` and `id` when a complex table needs explicit associations.

Keep row headers as `<th>` elements.

Add `tabindex="0"`, `role="region"`, and a name to an overflow container only when it has no focusable descendants.

Do not add a redundant tab stop when the table already contains interactive controls.

Do not hide required columns at narrow widths.

## Runtime

Table requires no component module.

Use Data Table only when the extra behavior is required.
