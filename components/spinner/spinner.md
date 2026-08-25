# Spinner

## Native basis

SVG loading indicator with a CSS rotation animation. The spinner is the one sanctioned animated primitive in the library: a loading indicator is meaningless without motion. No JavaScript is used.

## Native Web APIs

- [`role="status"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/status_role) — ARIA live region for loading state
- [`<svg>`](https://developer.mozilla.org/en-US/docs/Web/SVG) — scalable vector graphic for the spinner icon

## Structure

```html
<!-- Basic spinner -->
<svg class="spinner" role="status" aria-label="Loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
</svg>
```

Use `data-size="md"`, `data-size="lg"`, or `data-size="xl"` for the same sizes as the Icon component. The rotation is a pure CSS transform and causes no layout shift; consuming applications that must respect a reduced-motion preference can pause it with their own stylesheet.

## Accessibility

- Must have `role="status"` and `aria-label="Loading"` (or contextual label)
- Screen readers announce the loading state via the ARIA live region
