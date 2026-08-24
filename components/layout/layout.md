# Pattern: Layout

## Native basis
Intrinsic layout primitives built on CSS Grid and Flexbox: `.layout-container`, `.layout-stack`, `.layout-grid`, `.layout-sidebar`, `.layout-center`, `.layout-split`.
Pure CSS — no JavaScript or ARIA required.

---

## Native Web APIs
- [CSS Grid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout) — `auto-fit` / `minmax()` intrinsic column wrapping
- [Flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout) — stacking, app-shell splits, wrapping
- [`min()`](https://developer.mozilla.org/en-US/docs/Web/CSS/min) — fluid container width that cannot overflow
- [`fit-content()`](https://developer.mozilla.org/en-US/docs/Web/CSS/fit-content) — sidebar sizing up to a cap
- [Custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) — `--gap`, `--min`, `--container-max`, `--sidebar-width` configuration
- [Logical properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) — `margin-inline`, `padding-inline` for RTL support
- [CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting) — child selectors in the sidebar split

---

## Structure

### Container
Constrains content to a centered max width. The padding keeps the content off the viewport edges.
```html
<div class="layout-container">
  <p>Constrained, centered content.</p>
</div>
```

### Stack
Vertical rhythm for arbitrary content. Children are separated by the gap.
```html
<div class="layout-stack">
  <h2>Heading</h2>
  <p>Paragraph</p>
  <button type="button" class="btn">Action</button>
</div>
```

### Grid
Intrinsically responsive columns. Each column tries to be at least `--min` wide; columns wrap to new rows when they no longer fit.
```html
<div class="layout-grid">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>
```

### Sidebar
App-shell split. The first child is the sidebar (up to `--sidebar-width`), the last child takes the remaining space. When the container narrows, the content wraps below the sidebar — no media queries.
```html
<div class="layout-sidebar">
  <nav>Sidebar links</nav>
  <main>Main content</main>
</div>
```

### Center
Centers children on both axes. Give the element an explicit size (for example `min-block-size: 50vh` or a fixed height) or it shrinks to its content.
```html
<div class="layout-center" style="min-block-size: 16rem;">
  <p>Centered content</p>
</div>
```

### Split
Pushes groups to opposite ends and wraps when space runs out. Useful for page headers and card footers.
```html
<div class="layout-split">
  <div>
    <h2>Title</h2>
    <p class="muted">Description</p>
  </div>
  <button type="button" class="btn">Action</button>
</div>
```

---

## Classes

| Class | Description |
|---|---|
| `.layout-container` | Centered, max-width container |
| `.layout-stack` | Vertical stack with uniform gap |
| `.layout-grid` | Intrinsically responsive auto-fit grid |
| `.layout-sidebar` | App-shell split that wraps below the content minimum |
| `.layout-center` | Both-axis centering |
| `.layout-split` | Opposite-end groups that wrap |

---

## Custom properties

| Property | Default | Applies to | Description |
|---|---|---|---|
| `--gap` | `var(--space-04)` | all | Gap between children |
| `--min` | `15rem` | `.layout-grid` | Minimum column width |
| `--container-max` | `64rem` | `.layout-container` | Maximum container width |
| `--sidebar-width` | `14rem` | `.layout-sidebar` | Maximum sidebar width |

Override per instance with inline styles or a wrapping rule, for example `--min: 20rem`.

---

## Data attributes

| Attribute | Values | Description |
|---|---|---|
| `data-gap` | `none`, `xs`, `sm`, `md`, `lg`, `xl` | Named gap from the `--space-*` scale (maps to 0 / 0.5 / 0.75 / 1 / 1.5 / 2.5rem) |

---

## ARIA

No ARIA required — these are purely visual layout containers. Structure semantics come from the elements placed inside them (for example `<nav>` for the sidebar, `<main>` for content).

---

## Notes

- All primitives are intrinsic: they respond to container width, not breakpoints. No media queries needed.
- Default gaps use the `--space-*` scale from `src/base.css`; the `data-gap` attribute and `--gap` custom property map to it.
- `.layout-sidebar` requires exactly two children: first = sidebar, last = content. Wrap groups in a single child when you need multiple elements on one side.
- `.layout-center` needs an explicit size on the element itself to visibly center.
- Layout is pure CSS — no `{name}.js` file exists; do not load one.
