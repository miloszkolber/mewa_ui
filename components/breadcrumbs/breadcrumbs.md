# Breadcrumbs

## Purpose

Breadcrumbs shows the current route inside a hierarchy.

Use Breadcrumbs when parent routes improve orientation or navigation.

Do not use Breadcrumbs on a flat route set.

Do not use Breadcrumbs as the page title.

## Native basis

Use a labelled `<nav>` containing an ordered list.

Use native anchors for navigable ancestors.

Use non-interactive text for the current page.

Breadcrumbs requires no JavaScript.

## Native Web APIs

- [`<nav>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav) provides the navigation landmark.
- [`<ol>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol) preserves path order.
- [`aria-current="page"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current) identifies the current route.
- [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) provides keyboard focus treatment.

## Structure

```html
<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol class="breadcrumb-list">
    <li class="breadcrumb-item">
      <a class="breadcrumb-link" href="/">Home</a>
    </li>
    <li class="breadcrumb-separator" aria-hidden="true">/</li>
    <li class="breadcrumb-item">
      <a class="breadcrumb-link" href="/components">Components</a>
    </li>
    <li class="breadcrumb-separator" aria-hidden="true">/</li>
    <li class="breadcrumb-item">
      <span class="breadcrumb-page" aria-current="page">Breadcrumbs</span>
    </li>
  </ol>
</nav>
```

Keep separators hidden from assistive technology.

Keep only the current page marked with `aria-current="page"`.

## Long paths

Collapse middle ancestors when the path becomes difficult to scan.

Keep the first useful ancestor and the nearest useful ancestors visible.

```html
<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol class="breadcrumb-list">
    <li class="breadcrumb-item"><a class="breadcrumb-link" href="/">Home</a></li>
    <li class="breadcrumb-separator" aria-hidden="true">/</li>
    <li class="breadcrumb-item"><span class="breadcrumb-ellipsis" aria-hidden="true">…</span></li>
    <li class="breadcrumb-separator" aria-hidden="true">/</li>
    <li class="breadcrumb-item"><a class="breadcrumb-link" href="/components">Components</a></li>
    <li class="breadcrumb-separator" aria-hidden="true">/</li>
    <li class="breadcrumb-item"><span class="breadcrumb-page" aria-current="page">Breadcrumbs</span></li>
  </ol>
</nav>
```

Do not make an ellipsis interactive unless it opens a documented navigation control.

## Keyboard

Tab moves through ancestor links in document order.

Enter follows the focused ancestor link.

The current page does not enter the tab sequence.

## Accessibility

Name the navigation landmark `Breadcrumb`.

Use an ordered list to preserve hierarchy.

Keep ancestor destinations as links.

Keep the current page as non-interactive text.

Do not add tab roles to Breadcrumbs.

## Runtime

Breadcrumbs requires no component module.
