# Header

## Purpose

Header identifies the top-level banner and groups site-wide identity, navigation, and actions.

Use Header for a simple site banner or a small top-navigation composition.

Use App Shell when an application needs shared chrome and page-region primitives.

Do not use Header only to style a section heading.

## Native basis

Header uses a native `<header>` element.

CSS provides the banner layout and the optional sticky treatment.

Header requires no JavaScript.

## Native Web APIs

- [`<header>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header) provides banner semantics when it is not nested in sectioning content.
- [`position: sticky`](https://developer.mozilla.org/en-US/docs/Web/CSS/position) keeps an opted-in banner at the start of its scroll container.
- [`backdrop-filter`](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter) supports the approved sticky-chrome blur.
- [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) provides keyboard focus treatment.

## Structure

Use `.header-inner` to align the banner content.

Compose the Nav component when the banner contains route navigation.

```html
<header class="header">
  <div class="header-inner">
    <a class="header-brand-link" href="/" aria-label="Atlas home">
      <span class="header-brand-mark" aria-hidden="true">AT</span>
      <span>Atlas</span>
    </a>

    <nav class="nav" aria-label="Primary">
      <ul class="nav-list">
        <li class="nav-item">
          <a class="nav-item-link" href="/overview" aria-current="page">Overview</a>
        </li>
        <li class="nav-item">
          <a class="nav-item-link" href="/activity">Activity</a>
        </li>
      </ul>
    </nav>

    <div class="header-actions">
      <a href="/support">Support</a>
    </div>
  </div>
</header>
```

Keep one visible product identity in adjacent shell regions.

Keep global actions in `.header-actions`.

Use native links for destinations and native buttons for actions.

## Sticky header

Add `data-sticky` only when the banner must remain visible while the page scrolls.

```html
<header class="header" data-sticky>
  <div class="header-inner">
    <a class="header-brand-link" href="/">Atlas</a>
  </div>
</header>
```

Keep focused content clear of a sticky Header.

Do not add sticky behavior to a nested content header.

## Keyboard

Tab moves through links and controls in document order.

Enter follows a focused link.

Enter or Space activates a focused button.

Header adds no custom keyboard behavior.

## Accessibility

Use one top-level Header as the page banner.

Headers nested inside `<article>`, `<aside>`, `<main>`, `<nav>`, or `<section>` identify local content instead of the page banner.

Give each navigation landmark inside Header an accessible name.

Keep route destinations as links.

Hide decorative brand marks from assistive technology.

Do not duplicate the same product name in adjacent visible regions.

## Runtime

Header requires no component module.

The static and sticky variants remain complete without JavaScript.
