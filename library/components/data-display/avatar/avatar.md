# Avatar

## Purpose

Avatar identifies a person, account, workspace, or entity with an image or short fallback.

Use Avatar when visual identity helps recognition in a dense interface.

Do not use Avatar as a decorative circle or as the only source of a person's name.

## Native basis

Avatar uses an `<img>` inside a `<span>` container.

A text fallback remains available when the image is missing or fails to load.

## Native Web APIs

- [`<img>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img) provides image loading and alternative text.
- [`error`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/error_event) reports a failed image load.
- The shared enhancer uses [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) to initialize avatar images inserted after navigation.

## Structure

Use an image and fallback when an image URL is available.

```html
<span class="avatar">
  <img class="avatar-image" src="/people/casey.jpg" alt="Casey Nguyen">
  <span class="avatar-fallback" aria-hidden="true">CN</span>
</span>
```

Use the fallback alone when no image is available.

```html
<span class="avatar" role="img" aria-label="Casey Nguyen">
  <span class="avatar-fallback" aria-hidden="true">CN</span>
</span>
```

Avatar has one size. It is 36px and uses the general surface with secondary fallback text.

Do not add a size variant. The avatar keeps one consistent target so row heights stay stable.

## Status badge

Use `.avatar-badge` only when the badge communicates a real state.

Pair a visual badge with visible nearby status text or an accessible label.

The ready badge is 8px and uses the positive text role.

```html
<span class="avatar">
  <img class="avatar-image" src="/people/casey.jpg" alt="Casey Nguyen">
  <span class="avatar-fallback" aria-hidden="true">CN</span>
  <span class="avatar-badge" role="img" aria-label="Online"></span>
</span>
```

Do not rely on badge color alone.

## Behavior

The image renders when loading succeeds.

The fallback remains available when the image is absent.

The module hides a failed image and exposes the fallback.

The module transfers non-empty image alternative text to an unnamed fallback with image semantics.

The module restores the authored fallback attributes when the image loads successfully or the enhancement is destroyed.

An image without a fallback keeps its native alternative text visible after failure.

The module marks a failed image with `data-error`.

The component adds no click or keyboard behavior.

## Accessibility

Use meaningful `alt` text when the image itself identifies the entity.

Use empty `alt` text when an adjacent visible name already provides the same identity.

Hide fallback initials from assistive technology when the accessible name comes from another element.

Give a fallback-only avatar `role="img"` and an accessible name when no adjacent text provides one.

Keep status meaning available without color.

Do not put interactive behavior on the Avatar container.

## Runtime

Load `avatar.js` when Avatar can render an image.

The fallback-only form works without JavaScript.

An image with a broken URL can remain visually broken when the module is omitted.
