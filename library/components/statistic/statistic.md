# Statistic

## Purpose

Statistic presents one decision-relevant value with a short label and optional comparison.

Use Statistic when a compact summary helps the user understand current state before acting.

Use Table when several values need stable row and column comparison.

Do not use Statistic for decorative dashboard numbers that do not affect a decision.

## Native basis

Statistic uses normal semantic text inside a non-interactive container.

The component adds no ARIA role or JavaScript behavior.

## Native Web APIs

- [`<p>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p) provides normal text semantics.
- [`<data>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/data) can expose a machine-readable value when the application needs one.
- [`<time>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time) can expose a machine-readable date or duration when appropriate.

## Structure

```html
<div class="statistic">
  <p class="statistic-title">Active workers</p>
  <p class="statistic-value">12</p>
  <p class="statistic-description">Across 4 nodes</p>
</div>
```

Keep the title short.

Keep the value visually strongest.

Use the description only when it adds context that the title and value do not provide.

## Trend

Use `data-trend="up"` or `data-trend="down"` only when direction has clear product meaning.

```html
<div class="statistic">
  <p class="statistic-title">Failed jobs</p>
  <p class="statistic-value">3</p>
  <p class="statistic-description">
    <span class="statistic-trend" data-trend="down">
      <i class="ri-arrow-down-line" aria-hidden="true"></i>
      25 percent fewer
    </span>
    than yesterday
  </p>
</div>
```

Do not assume that an upward trend is positive.

Do not assume that a downward trend is negative.

Choose trend wording from the actual metric meaning.

Pair every trend color with explicit text.

## Numeric formatting

Use localized formatting when the value is user-facing.

Use tabular numerals for changing numeric values when alignment matters.

Keep units visible when the number is ambiguous without them.

Use a machine-readable element only when application logic benefits from it.

Do not abbreviate a number when the precise value matters to the task.

## Behavior

Statistic is static content.

Statistic does not update itself.

Application code owns live data updates and announcements.

Do not add a live region to a Statistic only because its value can change.

Use a separate status region when an asynchronous change must be announced.

## Accessibility

Keep the label and value as readable text.

Keep trend meaning understandable without color or icon shape.

Hide decorative trend icons from assistive technology.

Keep units and comparison periods available in text.

Do not use an icon-only Statistic.

Do not use `aria-label` to replace visible metric text.

## Runtime

Statistic requires no component module.

The complete component works without JavaScript.
