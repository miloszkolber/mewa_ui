# Skeleton

## Native basis

Static placeholder `<div>` elements. No JavaScript or animation is used.

## Native Web APIs

- [`<div>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div) — generic block containers provide the static placeholder geometry
- [`hidden`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden) — optionally removes a placeholder when the real content is ready
- [`aria-hidden`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden) — keeps decorative placeholder shapes out of the accessibility tree
- [`role="status"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/status_role) — separately announces a loading state when an announcement is needed

## Structure

```html
<!-- Basic skeleton line -->
<div class="skeleton" aria-hidden="true" style="height:1rem;width:12rem;"></div>

<!-- Skeleton with rounded shape (avatar placeholder) -->
<div class="skeleton skeleton-round" aria-hidden="true" style="width:2.5rem;height:2.5rem;"></div>

<!-- Composition: card skeleton -->
<div aria-hidden="true" style="display:flex;align-items:center;gap:1rem;">
  <div class="skeleton skeleton-round" style="width:2.5rem;height:2.5rem;"></div>
  <div style="display:flex;flex-direction:column;gap:0.5rem;flex:1;">
    <div class="skeleton" style="height:0.875rem;width:60%;"></div>
    <div class="skeleton" style="height:0.875rem;width:40%;"></div>
  </div>
</div>
```

## Accessibility

- Skeleton elements are decorative — screen readers should skip them
- Use `aria-hidden="true"` on skeleton containers if they sit alongside real content
- Announce the loading state separately with `role="status"` if needed
