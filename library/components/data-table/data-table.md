# Data Table

## Purpose

Data Table adds filtering, sorting, result status, and optional client pagination around a semantic Table.

Use Data Table when the page needs at least one documented data-control enhancement.

Use Table when the data only needs semantic rows and columns.

Do not use Data Table as a generic list or layout grid.

## Native basis

Data Table composes Table, Text Field, native forms, native links, and Pagination.

The table, filter form, sort destinations, and pagination links can remain usable without JavaScript.

The optional module adds client-side filtering, sorting, result counting, and pagination.

Data Table inherits Table's ready 36px row rhythm, 8px cell padding, 14px regular typography, and control-hover row state.

## Native Web APIs

- [`<table>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table) provides semantic tabular data.
- [`<caption>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption) names the table.
- [`<th scope>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th#scope) associates headers with cells.
- [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) provides the server-capable filter path.
- [`<input type="search">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/search) provides native search entry.
- [`<a>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a) preserves server-capable sorting and pagination.
- [`hidden`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden) hides filtered rows and empty states.
- [`aria-sort`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-sort) exposes sort direction.
- [`role="status"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/status_role) announces result changes.

## Structure

```html
<section class="data-table" data-page-size="20" aria-labelledby="jobs-title">
  <h2 id="jobs-title">Jobs</h2>

  <div class="data-table-toolbar">
    <form class="data-table-filter-group"
          role="search"
          aria-label="Filter jobs"
          method="get">
      <div class="text-field data-table-filter-field">
        <label class="text-field-label" for="jobs-filter">Filter jobs</label>
        <input class="text-field-input data-table-filter"
               id="jobs-filter"
               name="q"
               type="search"
               data-table-filter
               aria-controls="jobs-table"
               aria-describedby="jobs-status">
      </div>
      <button class="btn"
              type="reset"
              data-variant="secondary"
              data-table-clear>
        Clear
      </button>
    </form>

    <p class="data-table-summary"
       id="jobs-status"
       role="status"
       data-table-status
       data-singular="job"
       data-plural="jobs">
      20 jobs
    </p>
  </div>

  <div class="table-container">
    <table class="table" id="jobs-table">
      <caption class="table-caption">Current jobs and their state.</caption>
      <thead>
        <tr class="table-row">
          <th class="table-head" scope="col" aria-sort="ascending">
            <a class="data-table-sort" data-table-sort href="?sort=name">Job</a>
          </th>
          <th class="table-head" scope="col" aria-sort="none" data-sort-type="text">
            <a class="data-table-sort" data-table-sort href="?sort=state">State</a>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr class="table-row">
          <th class="table-cell" scope="row">Nightly sync</th>
          <td class="table-cell">Running</td>
        </tr>
      </tbody>
    </table>
  </div>

  <p class="data-table-empty" data-table-empty hidden>No jobs match the filter.</p>
  <p class="data-table-range" data-table-range data-range-label="jobs">Showing 1–20 of 20 jobs</p>

  <nav class="pagination data-table-pagination"
       data-table-pagination
       aria-label="Job pages">
    <ul class="pagination-list data-table-pagination-list">
      <li><a class="pagination-link data-table-pagination-link" data-table-page="1" href="?page=1" aria-current="page">1</a></li>
      <li><a class="pagination-link data-table-pagination-link" data-table-page="2" href="?page=2">2</a></li>
    </ul>
  </nav>
</section>
```

Keep the Table contract intact inside Data Table.

Keep server-renderable destinations on sort and pagination links when server navigation exists.

Use a button instead of a link only when sorting is exclusively client-owned.

## Filter behavior

Use a labelled native search input.

Use a real form when the server can process the query.

Use `data-table-filter` on each client-side filter input.

Use `data-table-clear` on a reset button.

The module filters row text case-insensitively.

The module returns to the first client page after a filter changes.

Keep the result count near the filter.

Do not add a filter when the result set is already easy to scan.

## Sorting behavior

Use `aria-sort` on sortable column headers.

Use `data-table-sort` on the sort action.

Use `data-sort-type="text"`, `number`, or `date` when the module must choose a comparison.

Use `data-sort-value` on a cell when its displayed value is not the correct machine value.

Keep only the active sort direction visible.

Do not put sorting state on a non-header element.

## Pagination behavior

Use native Pagination links when pages have stable URLs.

Add `data-page-size` only when client-side pagination is required.

Use `data-table-page` with a page number, `previous`, or `next`.

The module updates visible rows and the optional range output.

Do not add client pagination to a small result set.

## Data attributes

| Attribute | Purpose |
| --- | --- |
| `data-page-size` | Enables client pagination with a positive row count per page. |
| `data-table-filter` | Identifies a client filter input. |
| `data-table-clear` | Identifies the filter reset action. |
| `data-table-sort` | Identifies a sort action. |
| `data-sort-type` | Selects text, number, or date comparison. |
| `data-sort-value` | Provides a machine-readable cell value. |
| `data-table-status` | Identifies the result-count status. |
| `data-singular` | Provides the singular result noun. |
| `data-plural` | Provides the plural result noun. |
| `data-table-empty` | Identifies the empty result message. |
| `data-table-range` | Identifies the visible range output. |
| `data-range-label` | Provides the noun used by the range output. |
| `data-table-pagination` | Identifies client pagination controls. |
| `data-table-page` | Identifies a page action. |

Do not author `data-init`.

## Events

The enhanced root dispatches `data-table:sort` after client sorting.

The enhanced root dispatches `data-table:filter` after client filtering.

The enhanced root dispatches `data-table:page` after client page changes.

Use these events only when application behavior needs to react to the documented client state.

## Accessibility

Keep one descriptive caption.

Use `scope="col"` and `scope="row"` where header relationships apply.

Keep the filter visibly labelled.

Reference the result status from the filter when the announcement helps orientation.

Use `role="status"` for dynamic result counts.

Keep sort direction synchronized with `aria-sort`.

Keep native pagination links available when JavaScript is absent.

Contain horizontal overflow inside `.table-container`.

Do not hide required columns only to make the table fit a narrow page.

## Runtime

`data-table.js` is optional.

Without the module, the table remains semantic and server-rendered filter, sort, and pagination destinations remain usable.

Load the module only when the page uses the documented client-side enhancement.
