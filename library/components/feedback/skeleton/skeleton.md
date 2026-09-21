# Skeleton

## Purpose

Skeleton reserves space for content that is still loading.

Use Skeleton when the final structure is known and the placeholder prevents layout shift.

Use Spinner when one compact active loading indicator communicates the state better.

Do not animate Skeleton.

## Native basis

Use static decorative placeholder elements.

Skeleton adds no semantic loading state by itself.

Skeleton requires no JavaScript.

## Native Web APIs

- [`aria-hidden`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden) keeps placeholder shapes out of the accessibility tree.
- [`role="status"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/status_role) can announce loading from a separate status element.
- [`aria-busy`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-busy) can mark the region whose content is updating.

## Line placeholder

A normal Skeleton fills the inline size of its container.

```html
<div class="skeleton" aria-hidden="true"></div>
```

Set the container width when a shorter line is needed.

Do not add arbitrary inline dimensions to canonical component markup.

## Circular placeholder

Use `.skeleton-round` only for content that will become a circular identity or status object.

```html
<div class="skeleton skeleton-round" aria-hidden="true"></div>
```

Do not use circular geometry for normal text or rectangular content.

## Loading composition

Hide placeholder shapes from assistive technology.

Announce loading separately when the update needs an announcement.

```html
<div aria-busy="true">
  <p role="status">Loading account details</p>
  <div class="skeleton" aria-hidden="true"></div>
</div>
```

Remove the loading status when the real content becomes available.

## Accessibility

Keep Skeleton decorative.

Use one loading announcement for one loading region.

Do not repeat hidden placeholder labels.

Do not use Skeleton as a substitute for a useful empty state.

## Runtime

Skeleton requires no component module.
