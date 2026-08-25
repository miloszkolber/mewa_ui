# Avatar

## Native basis

`<img>` element wrapped in a container `<span>` with a text fallback for when the image fails to load.

## Native Web APIs

- [`<img>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img) — image element with `onerror` fallback
- [`:has()` selector](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) — toggle fallback visibility based on image state

## Structure

```html
<!-- Avatar with image -->
<span class="avatar">
  <img class="avatar-image" src="https://example.com/photo.jpg" alt="@username" />
  <span class="avatar-fallback">CN</span>
</span>

<!-- Avatar with fallback only -->
<span class="avatar">
  <span class="avatar-fallback">CN</span>
</span>

<!-- Avatar with badge (status indicator) -->
<span class="avatar">
  <img class="avatar-image" src="https://example.com/photo.jpg" alt="@username" />
  <span class="avatar-fallback">CN</span>
  <span class="avatar-badge"></span>
</span>
```

Sizes use the shared `data-size` shorthand: `sm` (32px), default (40px), and `lg` (48px).

```html
<span class="avatar" data-size="sm"><span class="avatar-fallback">CN</span></span>
<span class="avatar"><span class="avatar-fallback">CN</span></span>
<span class="avatar" data-size="lg"><span class="avatar-fallback">CN</span></span>
```


## Accessibility

- `<img>` must have an `alt` attribute describing the user
- Fallback text should be initials or a meaningful abbreviation
- Avatar badge should use `aria-label` to convey status when meaningful

## Notes

- The badge is a flat square flush on the bottom-right corner of the avatar; it is painted over the corner and never clips.
- Image and fallback content is clipped by their own `overflow: hidden` and `border-radius: inherit`.
