# Pattern: Icon

## Native basis
Inline `<svg>` elements copied from the standalone files in `src/icons/` are the no-JavaScript basis. The optional `<i data-lucide="name">` hook can be expanded by a local loader, such as the documentation site's loader, but Icon has no required component runtime and never uses a CDN or external icon set.

---

## Native Web APIs
- [`<svg>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg) — inline scalable vector graphics (inlined from the local file)
- [`aria-hidden`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden) — hides decorative icons from screen readers
- [`currentColor`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#currentcolor_keyword) — icons inherit stroke color from the parent's `color` property
- [`forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors) — maps icon color to system `CanvasText` in Windows High Contrast Mode
- [`prefers-contrast`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast) — increases stroke width when user requests more contrast

---

## Setup

All icons live in `src/icons/` (e.g. `src/icons/search.svg`). Two ways to use them:

### 1. Inline SVG (no JavaScript)
Copy the matching local SVG file where the icon is used. Preserve or add the attributes needed by the surrounding composition:

```html
<!-- Copy src/icons/search.svg and keep decorative state explicit. -->
<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m21 21-4.34-4.34"></path>
  <circle cx="11" cy="11" r="8"></circle>
</svg>
```

### 2. Local loader (optional)
Keep `data-lucide` markup and provide a local loader when many icons should be inlined at runtime. The doc site ships one in `docs/js/site.js` (path relative to the page):

```html
<i data-lucide="search"></i>
```

```js
// page-relative path: ../src/icons/{name}.svg from docs/, adjust for your layout
document.querySelectorAll('[data-lucide]').forEach(function (el) {
  var name = el.getAttribute('data-lucide');
  fetch('../src/icons/' + name + '.svg')
    .then(function (r) { return r.text(); })
    .then(function (svg) { el.outerHTML = svg; });
});
```

Attributes on the `<i>` (`data-size`, `stroke-width`, `fill`, `style`, `aria-*`) move onto the `<svg>` when a loader replaces the placeholder.

---

## Data Attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-lucide` | any icon name | Icon to render (required) |
| `data-size` | `md`, `lg`, `xl` | Controls icon dimensions |

---

## Structure

### Decorative icon (default)
```html
<i data-lucide="sun"></i>
```

### With accessible label (aria-label)
```html
<i data-lucide="triangle-alert" aria-label="Warning" role="img"></i>
```

### With visually-hidden text (preferred for accessibility)
```html
<span style="display:inline-flex;align-items:center;">
  <i data-lucide="phone" aria-hidden="true"></i>
  <span class="sr-only">Phone number</span>
</span>
```

### Inside a button
```html
<button class="btn" data-variant="outline" data-size="icon" aria-label="Settings">
  <i data-lucide="settings"></i>
</button>
```

### With text
```html
<button class="btn" data-variant="default">
  <i data-lucide="save"></i>
  Save
</button>
```

---

## Sizing

Control icon size with `data-size`, inline styles, or HTML attributes:

| Method | Example |
|--------|--------|
| `data-size` attribute | `<i data-lucide="star" data-size="lg"></i>` |
| Inline style | `<i data-lucide="star" style="width:16px;height:16px;"></i>` |
| HTML attributes | `<i data-lucide="star" width="16" height="16"></i>` |
| `em` units (font-relative) | `<i data-lucide="star" style="width:1em;height:1em;"></i>` |

The component CSS sets a default size of `1rem` (16px). Available sizes via `data-size`:

| `data-size` | Size |
|-------------|------|
| *(default)* | 16px (1rem) |
| `md` | 20px (1.25rem) |
| `lg` | 24px (1.5rem) |
| `xl` | 32px (2rem) |

---

## Stroke width

Adjust stroke weight with the `stroke-width` attribute on the `<i>` element:

```html
<i data-lucide="heart" stroke-width="1.5"></i>
<i data-lucide="heart" stroke-width="2"></i>
```

Default stroke width is `2`.

---

## Filled icons

Use the `fill` attribute for filled icon variants. Set `stroke-width="0"` for fill-only, or keep a stroke for a fill+outline look. Works well with simple shapes (star, heart, circle, bookmark).

```html
<i data-lucide="star" fill="currentColor" stroke-width="0"></i>
<i data-lucide="heart" fill="currentColor" stroke-width="1.5"></i>
```

---

## Color

Icons inherit `currentColor` for stroke. Change color with inline styles or token references:

```html
<i data-lucide="star" style="color:var(--text-primary);"></i>
<i data-lucide="star" style="color:var(--text-muted);"></i>
<i data-lucide="star" style="color:var(--text-negative);"></i>
<i data-lucide="star" style="color:oklch(0.72 0.19 142);"></i>
```

---

## ARIA

| Attribute | When | Value |
|-----------|------|-------|
| (none) | Decorative (icon next to text) | The icon carries no accessible name, so assistive tech ignores it |
| `role="img"` + `aria-label` | Meaningful (icon conveys info alone) | Describes the icon's purpose |
| Visually-hidden `<span>` | Meaningful (preferred alternative) | Provides screen reader text via `.sr-only` |

---

## Notes

- Icons inherit `currentColor` for stroke — they automatically match the parent's text color
- The full Lucide set is local in `src/icons/`; browse names at [lucide.dev/icons](https://lucide.dev/icons/)
- The optional loader fetches `src/icons/{name}.svg` (page-relative path) and inlines it; missing icons leave the placeholder untouched
- Inline SVG use is the no-JavaScript path; the documentation loader is not a component module
- Use `stroke-width` attribute to adjust line thickness (default: `2`)
- Prefer visually-hidden text (`.sr-only`) over `aria-label` for accessible standalone icons — `aria-label` may not be translated by browser translation tools
- `pointer-events: none` is set in CSS — icons don't capture clicks, so the parent element handles interaction
- Loading icons are static for now. Add your own animation only when the product explicitly requires it.
- `prefers-contrast: more` increases stroke width to 2.5 for better visibility
