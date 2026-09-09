# Pagination

## Purpose

Pagination moves between stable result pages.

Use Pagination when each result page has a navigable URL.

Do not use Pagination for a small result set or an in-page panel switch.

Use Tabs for peer panels inside one route.

## Native basis

Use native anchors inside a labelled navigation landmark.

Pagination requires no JavaScript.

## Native Web APIs

- [`<nav>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav) provides the navigation landmark.
- [`<a>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a) preserves URL navigation and browser history.
- [`aria-current="page"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current) identifies the current result page.
- [`aria-disabled`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-disabled) can identify a rendered non-link boundary control.

## Structure

Keep page destinations as real links.

Render an unavailable Previous or Next control without `href`.

```html
<nav class="pagination" aria-label="Pagination">
  <ul class="pagination-list">
    <li>
      <span class="pagination-prev" aria-disabled="true" aria-label="Previous page">
        <i class="ri-arrow-left-s-line" aria-hidden="true"></i>
      </span>
    </li>
    <li><a class="pagination-link pagination-active" href="?page=1" aria-current="page">1</a></li>
    <li><a class="pagination-link" href="?page=2">2</a></li>
    <li><a class="pagination-link" href="?page=3">3</a></li>
    <li><span class="pagination-ellipsis" aria-hidden="true">…</span></li>
    <li>
      <a class="pagination-next" href="?page=2" aria-label="Next page">
        <i class="ri-arrow-right-s-line" aria-hidden="true"></i>
      </a>
    </li>
  </ul>
</nav>
```

Do not leave a working `href` on a visually disabled boundary control.

Keep only the current page marked with `aria-current="page"`.

## Page range

Show a compact subset when every page number would make the control difficult to scan.

Keep the first, current-nearby, and last useful destinations when the product needs direct page access.

Use a decorative ellipsis for omitted ranges.

Do not make the ellipsis interactive.

## Keyboard

Tab moves through available page links.

Enter follows the focused page link.

Unavailable boundary controls do not enter the tab sequence.

## Accessibility

Give the navigation landmark a concise name.

Keep link text or accessible names clear enough to identify the destination.

Use `aria-current="page"` on the current page link.

Do not use a button for URL page navigation.

Do not use `aria-disabled="true"` as the only mechanism preventing anchor navigation.

## Runtime

Pagination requires no component module.
