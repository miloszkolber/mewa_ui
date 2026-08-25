# Separator

## Purpose

Separator marks a real visual or semantic division.

Use Separator for a thematic break or a labelled structural split.

Do not add Separator only to decorate empty space.

## Native basis

Use `<hr>` for a horizontal thematic break.

Use a non-interactive element with `role="separator"` for a vertical structural division.

Separator requires no JavaScript.

## Native Web APIs

- [`<hr>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr) provides the native horizontal separator role.
- [`role="separator"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/separator_role) identifies a non-native separator.
- [`aria-orientation`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-orientation) communicates vertical orientation when needed.

## Horizontal structure

```html
<hr class="separator">
```

Do not add a redundant separator role to `<hr>`.

## Vertical structure

```html
<div class="separator"
     data-orientation="vertical"
     role="separator"
     aria-orientation="vertical"></div>
```

Use vertical Separator only inside a parent layout that gives it a useful block size.

## Labelled visual division

Use `.separator-label` when visible text sits between two horizontal rules.

```html
<div class="separator-label">
  <hr class="separator">
  <span>Or continue with</span>
  <hr class="separator">
</div>
```

Treat the rules as part of the visual composition.

Keep the visible label as normal readable text.

## Decorative separator

Hide a separator from assistive technology when it carries no semantic division.

```html
<hr class="separator" aria-hidden="true">
```

Do not hide a real thematic break.

## Accessibility

Use semantic separation only when the content relationship changes.

Keep decorative separators out of the accessibility tree.

Keep vertical structural separators non-focusable unless another component upgrades them to an adjustable separator.

Use Resizable for an interactive adjustable separator.

## Runtime

Separator requires no component module.
