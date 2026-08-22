# Pattern: Button

## Native basis
`<button>` element. Also works on `<a>` for link-style buttons.

---

## Native Web APIs
- [`<button>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button) — native clickable element with built-in keyboard and form support
- [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) — keyboard-only focus ring, avoids showing focus on mouse clicks
- [`commandfor` / `command`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#command) — declarative button→dialog/popover triggers without JS click handlers
- [`prefers-contrast`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast) — adds visible borders to all variants in high-contrast mode
- [`forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors) — maps button border/text to system colors in Windows High Contrast Mode

---

## Structure

```html
<button class="btn" type="button" data-variant="default">Click me</button>
```

### With icon
```html
<button class="btn" type="button" data-variant="default">
  <svg aria-hidden="true" width="16" height="16" ...>...</svg>
  Save
</button>
```

### Icon-only
```html
<button class="btn" type="button" data-variant="outline" data-size="icon" aria-label="Settings">
  <svg aria-hidden="true" width="16" height="16" ...>...</svg>
</button>
```

---

## Variants

| `data-variant`  | Surface              | Text                     | Hover                          |
|-----------------|----------------------|--------------------------|--------------------------------|
| `default`       | `--surface-inverted` | `--text-inverted`       | `opacity: 0.88`               |
| `secondary`     | `--surface-secondary`| `--text-primary`        | `opacity: 0.8`                |
| `outline`       | `--background` + border | `--text-primary`     | `--surface-secondary` bg       |
| `ghost`         | transparent          | `--text-primary`         | `--surface-secondary` bg       |
| `destructive`   | `--surface-negative` | `--text-negative`        | `opacity: 0.88`                |
| `link`          | transparent          | `--text-primary`         | underline                      |

---

## Sizes

| `data-size` | Height          | Padding              | Font size                 |
|-------------|-----------------|----------------------|---------------------------|
| `sm`        | `var(--size-07)` | `0 var(--space-03)` | `var(--font-body-small)` |
| *(default)* | `var(--size-08)` | `0 var(--space-04)` | `var(--font-body-small)` |
| `icon`      | `var(--size-08)` | `0` (square)         | —                         |
| `icon-sm`   | `var(--size-07)` | `0` (square)         | —                         |

---

## Accessibility

- Use `<button>` for actions, `<a>` for navigation.
- Icon-only buttons require `aria-label`.
- Disabled buttons use `disabled` attribute or `aria-disabled="true"`.
- Loading state: add `aria-busy="true"` and swap icon for a spinner.

---

## Notes

- Hover shifts the background only (`color-mix` on the variant surface); text color never changes.
- The `link` variant resets height and padding — it flows inline.
- SVGs inside buttons auto-size to 1rem unless they have a `size-*` class.
- The button works on `<a>` tags for styled navigation links.
