# File Diff

## Purpose

File Diff presents line-by-line changes to one file.

Use File Diff when old lines, new lines, change markers, and source content must remain related.

Use Code Block for source without before-and-after meaning.

Do not use File Diff for a list of changed file names without line content.

## Native basis

File Diff uses a native `<details>` disclosure containing a semantic `<table>`.

The summary names the file and shows visible addition and deletion counts.

The application owns row insertion and streaming state.

## Native Web APIs

- [`<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) provides disclosure behavior.
- [`<table>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table) preserves old line, new line, marker, and content relationships.
- [`<caption>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption) gives the change table an accessible name.
- [`scope`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th#scope) associates the column headers with rows.

## Structure

```html
<details class="file-diff" open>
  <summary class="file-diff-trigger">
    <span class="file-diff-path">src/session.js</span>
    <span class="file-diff-counts" aria-label="3 additions and 1 deletion">
      <span class="file-diff-additions">+3</span>
      <span class="file-diff-deletions">−1</span>
    </span>
    <span class="file-diff-state">Complete</span>
    <svg class="file-diff-chevron" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z"/></svg>
  </summary>
  <div class="file-diff-viewport">
    <table class="file-diff-table">
      <caption class="file-diff-caption">Changes to src/session.js: 3 additions and 1 deletion.</caption>
      <thead class="file-diff-head">
        <tr>
          <th scope="col">Old line</th>
          <th scope="col">New line</th>
          <th scope="col">Change</th>
          <th scope="col">Content</th>
        </tr>
      </thead>
      <tbody>
        <tr class="file-diff-row" data-kind="remove">
          <td class="file-diff-number">12</td>
          <td class="file-diff-number"></td>
          <td class="file-diff-marker">−</td>
          <td class="file-diff-code">const mode = "fast";</td>
        </tr>
        <tr class="file-diff-row" data-kind="add">
          <td class="file-diff-number"></td>
          <td class="file-diff-number">12</td>
          <td class="file-diff-marker">+</td>
          <td class="file-diff-code">const mode = "balanced";</td>
        </tr>
      </tbody>
    </table>
  </div>
</details>
```

Use `data-kind="add"`, `data-kind="remove"`, `data-kind="context"`, or `data-kind="hunk"` on each row.

Keep the `+`, `−`, space, or `@` marker as real text.

Keep line numbers in their own `.file-diff-number` cells.

Update the caption and visible counts when rows change.

Set `data-streaming` on `.file-diff` and show visible updating text while rows are arriving.

Keep the disclosure open while the current changes are important.

## Behavior

Native summary activation opens and closes the table.

The browser provides Enter and Space activation for the summary.

The viewport contains two-dimensional overflow inside the component.

The component adds no JavaScript behavior.

Application code can append rows without rebuilding existing rows.

## Accessibility

Keep one descriptive caption and four column headers.

Keep addition and deletion markers in text so color is not the only signal.

Hide line numbers from text selection when the source content is the intended copy target.

Keep the path available in full DOM text when visual truncation occurs.

Do not place a live role on the complete table.

Announce a separate concise status when a streaming update needs notification.

## Runtime

File Diff requires no component module.

The disclosure, table, overflow, and static states work without JavaScript.
