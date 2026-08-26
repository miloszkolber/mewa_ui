# Layout

## Purpose

Layout provides small intrinsic Grid and Flexbox primitives for local composition.

Use Layout to arrange content inside a page, component, or documented pattern.

Use App Shell and Sidebar guidance for application chrome.

Do not treat Layout as a complete page shell.

Do not create semantic structure with generic layout containers when native elements fit.

## Native basis

Layout uses CSS Grid, Flexbox, intrinsic sizing, logical properties, and custom properties.

Layout adds no interaction or ARIA behavior.

## Native Web APIs

- [CSS Grid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout) provides intrinsic multi-column layout.
- [Flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout) provides stacks, splits, and wrapping.
- [`min()`](https://developer.mozilla.org/en-US/docs/Web/CSS/min) constrains fluid container width.
- [Custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) configure local gaps and dimensions.
- [Logical properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) preserve writing-direction support.

## Container

Use `.layout-container` for a centered focused-content region.

```html
<div class="layout-container">
  <p>Focused content.</p>
</div>
```

The default maximum is `--breakpoint-max-focused`, 64rem.

Use App Shell canvas rules with `--breakpoint-max-dense`, 90rem, for dense application content.

Do not introduce a third global content-width preset.

## Stack

Use `.layout-stack` for one-dimensional vertical flow.

```html
<div class="layout-stack" data-gap="md">
  <h2>Connection</h2>
  <p>Configure the selected endpoint.</p>
  <button class="btn" type="button">Test connection</button>
</div>
```

Use normal document flow when no explicit uniform gap is necessary.

## Grid

Use `.layout-grid` for intrinsically wrapping peer columns.

```html
<div class="layout-grid" data-gap="md">
  <section>First region</section>
  <section>Second region</section>
  <section>Third region</section>
</div>
```

The default minimum column width is 15rem.

Set `--min` from a consumer stylesheet when a repeated composition needs another minimum.

Do not put inline style attributes in canonical markup.

## Sidebar split

Use `.layout-sidebar` for a local two-region content split.

```html
<div class="layout-sidebar">
  <aside>Filters</aside>
  <section>Results</section>
</div>
```

The first child uses the local sidebar basis.

The last child grows into remaining space.

The composition wraps intrinsically when the content can no longer fit.

Use the Sidebar component when the first region is persistent application navigation.

Do not recreate collapsible application navigation with `.layout-sidebar`.

## Center

Use `.layout-center` to center content inside a region that already has a meaningful block size.

```html
<section class="layout-center">
  <p>No active jobs.</p>
</section>
```

Set the region size from its owning component or consumer stylesheet.

Do not add arbitrary inline heights only to make centering visible.

## Split

Use `.layout-split` for two local groups that belong at opposite inline ends.

```html
<div class="layout-split">
  <div>
    <h2>Workers</h2>
    <p>Current execution state.</p>
  </div>
  <button class="btn" type="button" data-variant="outline">Refresh</button>
</div>
```

The groups wrap when available width becomes insufficient.

Do not use Split when source order differs from the correct reading order.

## Gap values

Use `data-gap="none"` for connected content.

Use `data-gap="xs"` for a tight 0.5rem relation.

Use `data-gap="sm"` for a 0.75rem relation.

Use `data-gap="md"` for the normal 1rem relation.

Use `data-gap="lg"` for a 1.5rem section relation.

Use `data-gap="xl"` for a 2.5rem major relation.

Use the smallest gap that clearly communicates the relationship.

## Custom properties

`--gap` controls the local child gap.

`--min` controls the Grid minimum column width.

`--container-max` controls a local container maximum.

`--sidebar-width` controls the local split basis.

Define repeated overrides in consumer CSS.

Do not create a new shared token for one local layout need.

## Behavior

Layout responds to available container width through CSS.

Layout does not change DOM order.

Layout does not add focus targets.

Layout does not add JavaScript behavior.

## Accessibility

Choose semantic child and container elements before adding Layout classes.

Use `<nav>`, `<aside>`, `<section>`, `<main>`, and other landmarks only when their semantics fit the content.

Keep visual order consistent with reading and focus order.

Do not add ARIA roles to Layout classes themselves.

Do not use CSS ordering to create a different task order from the DOM.

## Runtime

Layout requires no component module.

All primitives work without JavaScript.
