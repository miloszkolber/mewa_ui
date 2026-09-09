# Nav

## Purpose

Nav presents one small, flat list of route destinations.

Use Nav when all destinations fit in one directly visible list.

Use Navigation Menu when grouped site routes need disclosure panels.

Use Sidebar when application routes need persistent side navigation.

Do not use Nav for actions, form choices, or tab panels.

## Native basis

Nav uses a labelled `<nav>`, an unordered list, and native links.

CSS provides horizontal and vertical layouts.

Nav requires no JavaScript.

## Visual states

Nav links use a 40px outer row with a 36px inner surface, 10px content padding,
20px icons, and a 10px icon gap. The state matrix accepts
`aria-current="page"`, `aria-expanded`, `aria-disabled`, and
`data-state="selected|expanded|hover|focus|disabled"` hooks.

Figma's `nav_search` and `nav_brand` are represented as Nav subprimitives:

```html
<div class="nav-search" data-state="focus">
  <i class="nav-search-icon ri-search-line" aria-hidden="true"></i>
  <input class="nav-search-input" type="search" aria-label="Search navigation">
  <span class="nav-search-shortcut" aria-hidden="true">
    <kbd class="kbd">⌘K</kbd>
  </span>
</div>

<a class="nav-brand" data-state="collapsed" href="/">
  <span class="nav-brand-mark" aria-hidden="true"><i class="ri-command-line"></i></span>
  <span data-nav-brand-label>Workspace</span>
</a>
```

These subprimitives remain composition points inside Nav or Sidebar; they do not add registry entries.

## Native Web APIs

- [`<nav>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav) provides the navigation landmark.
- [`<ul>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul) preserves the destination list relationship.
- [`<a>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a) provides native route navigation and browser link actions.
- [`aria-current="page"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current) identifies the current route.
- [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) provides keyboard focus treatment.

## Structure

Give every Nav landmark an accessible name.

Keep each destination inside a list item.

```html
<nav class="nav" aria-label="Documentation">
  <ul class="nav-list">
    <li class="nav-item">
      <a class="nav-item-link" href="/overview">Overview</a>
    </li>
    <li class="nav-item">
      <a class="nav-item-link" href="/components" aria-current="page">Components</a>
    </li>
    <li class="nav-item">
      <a class="nav-item-link" href="/foundations">Foundations</a>
    </li>
  </ul>
</nav>
```

The consumer owns route state.

Keep `aria-current="page"` on only the current destination in each Nav.

## Vertical orientation

Add `data-orientation="vertical"` when the surrounding region needs a vertical route list.

```html
<nav class="nav" data-orientation="vertical" aria-label="Account settings">
  <ul class="nav-list">
    <li class="nav-item">
      <a class="nav-item-link" href="/account/profile" aria-current="page">Profile</a>
    </li>
    <li class="nav-item">
      <a class="nav-item-link" href="/account/security">Security</a>
    </li>
  </ul>
</nav>
```

Do not add arrow-key navigation to Nav.

## Keyboard

Tab moves through links in document order.

Enter follows the focused destination.

Browser link commands remain available.

Nav adds no custom keyboard behavior.

## Accessibility

Give each navigation landmark a distinct name when the page contains more than one Nav.

Keep route destinations as native links.

Use `aria-current="page"` on the current destination.

Do not add `role="menu"`, tab roles, or roving `tabindex` behavior.

Do not use color as the only current-route indicator.

## Runtime

Nav requires no component module.

All routes remain available without JavaScript.
