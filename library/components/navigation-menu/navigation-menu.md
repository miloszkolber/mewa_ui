# Navigation Menu

## Purpose

Navigation Menu groups related site routes under a top-level navigation trigger.

Use Navigation Menu when a flat top navigation cannot present a route group clearly.

Use normal route links when the route set is small.

Use Dropdown Menu for application actions.

Do not use Navigation Menu for form options or command actions.

## Native basis

Navigation Menu uses `<nav>`, lists, native links, button triggers, and the Popover API.

Declarative `popovertarget` handles open and close behavior.

The module only assigns CSS anchor pairs for documented positioning.

## Native Web APIs

- [`<nav>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav) provides the navigation landmark.
- [`<a>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a) provides route navigation.
- [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) provides top-layer dropdown panels and light dismiss.
- [`popovertarget`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#popovertarget) declaratively connects a trigger and popover.
- [CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) aligns each panel to its trigger.

## Structure

```html
<nav class="nav-menu" aria-label="Primary">
  <ul class="nav-menu-list">
    <li class="nav-menu-item">
      <a class="nav-menu-link" href="/overview" aria-current="page">Overview</a>
    </li>
    <li class="nav-menu-item">
      <button class="nav-menu-trigger"
              type="button"
              popovertarget="resource-routes">
        Resources
        <i class="ri-arrow-down-s-line" aria-hidden="true"></i>
      </button>
      <div class="nav-menu-content" id="resource-routes" popover>
        <a class="nav-menu-content-link" href="/models">
          <strong>Models</strong>
          <span>Browse available model files.</span>
        </a>
        <a class="nav-menu-content-link" href="/datasets">
          <strong>Datasets</strong>
          <span>Browse available datasets.</span>
        </a>
      </div>
    </li>
  </ul>
</nav>
```

Keep every destination as a native link.

Keep `aria-current="page"` on the current route link.

Give the navigation landmark an accessible name.

## Content links

Use a short title for each route.

Add one short description only when route names alone are ambiguous.

Do not repeat the same label and description.

Do not add cards inside the navigation panel.

Keep route groups compact and scan-friendly.

## Behavior

The trigger uses native button activation.

The Popover API opens and closes the route panel.

Light dismiss closes an open panel.

Escape closes the open popover through native behavior.

The module assigns an anchor name to each trigger and panel pair.

The module adds no click handler for show or hide behavior.

The chevron state follows native `:popover-open` state through CSS.

Item state feedback uses the shared fast motion primitives. Submenu opening and closing remain immediate.

## Keyboard

Tab moves through route links and menu triggers in document order.

Enter activates a route link or trigger.

Space activates a button trigger.

Escape closes an open route popover.

The component does not implement menuitem roles or arrow-key menu navigation.

Do not add `role="menu"` to route navigation.

## Accessibility

Keep route navigation as native links.

Give every navigation landmark an accessible name.

Hide decorative chevrons and icons from assistive technology.

Give an icon-only trigger an accessible name when one is unavoidable.

Keep the current route available through `aria-current="page"`.

Do not use tab roles for route navigation.

Do not place essential site routes only in a Command Palette.

## Runtime

Load `navigation-menu.js` when anchored dropdown positioning is required.

Native route links and declarative popovers remain usable without the module.

Without the module, browser default popover placement can differ from the documented anchored position.
