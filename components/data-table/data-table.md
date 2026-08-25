# Data Table

## Native basis

Data Table is a progressive enhancement around the structural [Table](../table/table.md) component. It composes a semantic `<table>` with a labelled [Text Field](../text-field/text-field.md) filter and native [Pagination](../pagination/pagination.md) links. The table and links remain usable HTML when the optional module is not loaded.

## Native web APIs

- [`<table>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table) — semantic tabular data and row groups
- [`<caption>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption) and [`<th scope>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th#scope) — table name and header associations
- [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form), [`<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label), and [`<input type="search">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/search) — native filter submission and field composition
- [`<a>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a) and [`<button>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button) — native sort destinations and form reset action
- [`<nav>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav) and [`<a>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a) — no-JavaScript pagination navigation
- [`hidden`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden) — hides filtered rows and the empty state
- [`aria-sort`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-sort) — exposes the active sort direction on a header
- [`role="status"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/status_role) — politely announces result counts
- [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) — optional sort, filter, and page notifications
- [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) — initializes data tables added after navigation

## Structure

Add the `.data-table` class to a wrapper containing one Table, a Text Field filter, an optional empty state, and Pagination links. Load `data-table.css` for the enhancement styles and `data-table.js` only when client-side filtering, sorting, and pagination are wanted.

```html
<section class="data-table" data-page-size="3" aria-labelledby="projects-title">
  <h2 id="projects-title">Projects</h2>

  <div class="data-table-toolbar">
    <form class="data-table-filter-group" role="search" aria-label="Filter projects" method="get" action="">
      <div class="text-field data-table-filter-field">
        <label class="text-field-label" for="projects-filter">Filter projects</label>
        <input class="text-field-input data-table-filter" data-table-filter id="projects-filter" name="q" type="search"
               aria-controls="projects-table" aria-describedby="projects-status"
               placeholder="Search project names">
      </div>
      <button class="btn" data-variant="outline" data-table-clear type="reset">Clear</button>
    </form>
    <p class="data-table-summary" data-table-status data-singular="project" data-plural="projects"
       id="projects-status" role="status" aria-live="polite">3 projects</p>
  </div>

  <div class="table-container">
    <table class="table" id="projects-table">
      <caption class="table-caption">Projects and their current owners.</caption>
      <thead>
        <tr class="table-row">
          <th class="table-head" scope="col" aria-sort="ascending">
            <a class="data-table-sort" data-table-sort href="?sort=project" aria-label="Sort by project">Project</a>
          </th>
          <th class="table-head" scope="col" aria-sort="none" data-sort-type="text">
            <a class="data-table-sort" data-table-sort href="?sort=owner" aria-label="Sort by owner">Owner</a>
          </th>
          <th class="table-head" scope="col" aria-sort="none" data-sort-type="number">
            <a class="data-table-sort" data-table-sort href="?sort=seats" aria-label="Sort by seats">Seats</a>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr class="table-row">
          <th class="table-cell" scope="row">Atlas</th>
          <td class="table-cell">Ada Lovelace</td>
          <td class="table-cell" data-sort-value="42">42</td>
        </tr>
        <!-- More rows can be rendered here. -->
      </tbody>
    </table>
  </div>

  <p class="data-table-empty" data-table-empty hidden>No projects match this filter.</p>
  <p class="data-table-range" data-table-range data-range-label="projects">Showing 1–3 of 3 projects</p>

  <nav class="pagination data-table-pagination" data-table-pagination aria-label="Projects pages">
    <ul class="pagination-list data-table-pagination-list">
      <li><a class="pagination-prev data-table-pagination-link" data-table-page="previous" href="?page=1" aria-label="Previous page" aria-disabled="true" tabindex="-1">Previous</a></li>
      <li><a class="pagination-link data-table-pagination-link" data-table-page="1" href="?page=1" aria-current="page">1</a></li>
      <li><a class="pagination-link data-table-pagination-link" data-table-page="2" href="?page=2">2</a></li>
      <li><a class="pagination-next data-table-pagination-link" data-table-page="next" href="?page=2" aria-label="Next page">Next</a></li>
    </ul>
  </nav>
</section>
```

Without `data-table.js`, the `<form>` submits the filter query, the reset button clears the native field, each sort link retains a server-renderable destination, the `<table>` keeps its caption, scopes, and rows, and each Pagination link retains its destination. A server-rendered page can use the same markup and query parameters.

## Classes and data attributes

| Class or attribute | Element | Purpose |
| --- | --- | --- |
| `.data-table` | wrapper | Data Table root and optional module boundary |
| `.data-table-toolbar` | `<div>` | Layout for the filter and result status |
| `.data-table-filter-group` | `<form>` | Native filter submission and layout for the Text Field and reset action |
| `.data-table-filter-field` | `.text-field` | Text Field composition wrapper |
| `.data-table-filter-label` | `<label>` | Label styling when the Text Field class is not used |
| `.data-table-filter` | `<input>` or `<textarea>` | Filter field styling and module target |
| `.data-table-summary` | `role="status"` element | Result-count announcement |
| `.data-table-sort` | `<a>` or `<button>` | Native sort destination or enhanced sort action inside a table header |
| `.data-table-empty` | `<p>` or `<div>` | Empty result message, controlled with native `hidden` |
| `.data-table-range` | range element | Optional `Showing X–Y of Z` output |
| `.data-table-pagination` | `<nav>` | Pagination landmark and module target |
| `.data-table-pagination-list` | `<ul>` | Pagination list layout |
| `.data-table-pagination-link` / `.data-table-pagination-button` | `<a>` / `<button>` | Pagination control styling |
| `data-page-size` | root or `<table>` | Enables client-side pagination with this many rows per page |
| `data-table-filter` | filter input | Identifies one or more filter fields |
| `data-table-clear` | reset `<button>` | Clears filters and returns to page one when enhanced |
| `data-table-sort` | sort button | Identifies a native sort action |
| `data-sort-type="text"`, `number`, or `date` | sortable `<th>` | Selects the comparison used by the module. Text is the default. |
| `data-sort-value` | `<th>` or `<td>` | Optional machine-readable value for sorting a cell |
| `data-table-status` | `role="status"` element | Result-count announcement target |
| `data-singular` / `data-plural` | status element or root | Result-count grammar, such as `project` and `projects` |
| `data-table-empty` | empty-state element | Target whose native `hidden` state follows the filtered result count |
| `data-table-range` | range element | Identifies the optional range output |
| `data-range-label` | range element or root | Noun used by the range output |
| `data-table-pagination` | `<nav>` | Identifies client-side Pagination controls |
| `data-table-page` | Pagination link or button | Page number, `previous`, or `next` |
| `data-init` | enhanced root | Added by the module to make initialization idempotent. Do not author it. |

`data-*` hooks describe enhancement configuration or state that has no native equivalent. Native `disabled`, `hidden`, `aria-sort`, `aria-current`, and `role="status"` remain the source of truth for their respective states.

## Events

Enhanced data tables dispatch bubbling `CustomEvent`s on the `.data-table` root:

| Event | Detail |
| --- | --- |
| `data-table:sort` | `{ column, direction, header }` after a sort button changes `aria-sort` and row order |
| `data-table:filter` | `{ query, matching, total }` after a filter input or clear button updates the rows |
| `data-table:page` | `{ page, pageSize, pageCount, matching, total }` after client-side pagination changes page |

## Accessibility

- Keep one descriptive `<caption>` for every Table and use `scope="col"` and `scope="row"` for its headers.
- Put each sort action in a real link with a server-renderable destination, or a button when the page requires JavaScript. The module keeps `aria-sort` on headers and exposes the next action in the link or button name.
- Compose the filter from a real `<form>`, Text Field label, and input. Use `aria-controls` for the table and `aria-describedby` for the result status when those IDs are present.
- Give the result summary `role="status"` and `aria-live="polite"`. The empty state is revealed with `hidden` when no rows match.
- Use native Pagination and sort links when they should work without JavaScript. Use a reset button for clearing a filter and a disabled `<button>` when a page action has no destination.

## Notes

- The module uses delegated events, so rows and controls added after initialization continue to work.
- Sorting is locale-aware and stable. Numeric and date columns can provide `data-sort-type` and cells can provide `data-sort-value`.
- The sort glyph is shown only on the sorted column: a plain up or down arrow. Unsorted columns reserve the same fixed-width slot but show nothing, so column geometry never shifts when sorting toggles. The arrow is a real glyph (not an SVG), matching the neutral textual style of the header.
- Filtering matches row text case-insensitively. The result summary counts all matching rows, while the optional range reports the current page against the filtered total.
- Client-side pagination is enabled only when `data-page-size` is a positive integer. Without it, Pagination links retain native navigation behavior.
- State changes are immediate. The component does not add transitions, animations, or shadows.
