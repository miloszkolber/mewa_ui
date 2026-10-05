# Card

## Purpose

Card groups one independent object or one small self-contained content set.

Use Card when the group must read as one object.

Do not use Card as the default wrapper for page sections, forms, tables, row lists, or other cards.

## Native basis

Use `<div>` for visual grouping without standalone document meaning.

Use `<article>` when the card can stand on its own outside the surrounding page.

Card adds presentation only.

Card requires no JavaScript.

## Native Web APIs

- [`<article>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article) identifies standalone content.
- [CSS Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) compact the card when its own container becomes narrow.

## Structure

Use the header for the object title and supporting context.

Use the content region for the primary object content.

Use the footer only when the object owns local actions.

```html
<article class="card">
  <div class="card-header">
    <h2 class="card-title">Backup policy</h2>
    <p class="card-description">Daily snapshot configuration.</p>
  </div>

  <div class="card-content">
    <p>Keep seven daily snapshots.</p>
  </div>

  <div class="card-footer">
    <button class="btn" type="button" data-variant="secondary">Edit policy</button>
  </div>
</article>
```

Remove a region when the object does not need it.

## Density

Omit `data-density` for an independent object with 24px internal padding.

Use `data-density="compact"` on `.card` for service or job objects in a dense workspace.

Compact Card uses 16px padding from `--space-400` at every container width.

Keep the same horizontal edge for the header, content, and footer.

Keep the header bottom padding at zero.

Keep the footer top padding at zero.

Use the content padding to separate the header, body, and actions.

```html
<article class="card" data-density="compact">
  <header class="card-header">
    <h2 class="card-title" id="queue-worker-title">Queue worker</h2>
    <p class="card-description">Processes the production job queue.</p>
  </header>
  <div class="card-content">
    <p>Running with 4 workers.</p>
  </div>
  <footer class="card-footer">
    <a class="btn" data-variant="secondary" href="/services/queue-worker">Inspect service</a>
  </footer>
</article>
```

Do not use compact Card to wrap a page section, Table, or another Card.

Keep child Button targets at 36px in both densities.

## Composition

Use App Shell `.app-section` for a full-width working section.

Use Table directly inside App Shell `.app-section` for tabular data.

Use connected rows directly inside App Shell `.app-section` for dense lists.

Use Statistic directly in page composition when a separate object boundary adds no value.

Do not put a Card inside another Card.

Do not wrap Table in Card.

Do not wrap an entire settings form in Card by default.

Do not add Card only to create spacing.

Use the parent layout for spacing between cards.

## Interactive cards

Use an anchor as the Card root only when the whole object has one navigation destination.

```html
<a class="card" href="/projects/atlas">
  <div class="card-header">
    <h2 class="card-title">Atlas</h2>
    <p class="card-description">Open project details.</p>
  </div>
</a>
```

Do not place a button, link, input, or other interactive descendant inside an interactive Card link.

Use a normal Card with explicit child actions when the object has several actions.

## Behavior

Card has no interaction behavior.

Container queries reduce default internal padding to 16px when the card content width is at most 280px.

The narrow-container fallback keeps compact Card at 16px.

Long labels and text values wrap without truncation.

Card uses one outer border.

Card uses no shadow.

Card uses no radius.

Card adds no motion unless it contains an interactive stateful control.

## Accessibility

Choose the semantic root before you apply `.card`.

Use a heading when the card needs a document label.

Keep heading levels consistent with the surrounding page.

Keep interactive descendants in normal document order.

Do not add a landmark role to every card.

Do not use a clickable `<div>` as an interactive card.

## Runtime

Card requires no component module.

The complete card remains usable without JavaScript.
