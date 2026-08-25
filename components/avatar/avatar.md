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


## Accessibility

- `<img>` must have an `alt` attribute describing the user
- Fallback text should be initials or a meaningful abbreviation
- Avatar badge should use `aria-label` to convey status when meaningful

## Notes

- The badge sits on the bottom-right edge of the square avatar and extends beyond it, so the avatar itself never clips its children.
- Image and fallback content is clipped by their own `overflow: hidden` and `border-radius: inherit`.
