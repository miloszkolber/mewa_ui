# Popover

## Purpose

Popover shows small non-modal contextual content in the top layer.

Use Popover when one trigger needs a compact contextual surface.

Use Dialog when the task must block the page.

Do not use Popover for essential content that should remain visible.

## Native basis

Use the native Popover API.

Use `popovertarget` for declarative open and close behavior.

Use CSS Anchor Positioning for placement.

The module assigns the documented anchor relationship.

## Native Web APIs

- [`popover`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/popover) provides top-layer rendering and light dismiss.
- [`popovertarget`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#popovertarget) provides declarative trigger wiring.
- [CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) positions the surface beside its trigger.
- [`position-try-fallbacks`](https://developer.mozilla.org/en-US/docs/Web/CSS/position-try-fallbacks) flips the surface when space is limited.

## Structure

Give the trigger a meaningful visible or accessible name.

Keep the popover content semantically complete.

```html
<button class="btn"
        type="button"
        data-variant="outline"
        popovertarget="display-options">
  Display options
</button>

<div class="popover" id="display-options" popover>
  <div class="popover-header">
    <p class="popover-title">Display options</p>
    <p class="popover-description">Choose the visible detail level.</p>
  </div>
  <div class="popover-content">
    <!-- Contextual controls. -->
  </div>
</div>
```

## Placement

Use `data-side="top"`, `right`, `bottom`, or `left` when the default bottom placement does not fit the task.

Use `data-align="start"`, `center`, or `end` for alignment on the secondary axis.

Let position fallbacks move the popover when the preferred placement does not fit.

Do not hardcode viewport coordinates in consumer code.

## Behavior

Native `popovertarget` toggles the surface.

Native light dismiss closes an automatic popover after outside activation or Escape.

The module assigns unique CSS anchor names.

The module retries initialization when a trigger appears before its target.

The popover remains non-modal.

Focus stays in normal sequential order unless a child uses `autofocus`.

## Accessibility

Keep the trigger keyboard operable.

Keep the trigger name descriptive of the content or action.

Use semantic headings, labels, and controls inside the popover.

Do not rely on the Popover API to name the trigger or content.

Do not move required instructions into a popover.

Do not add dialog semantics to a non-modal popover.

## Runtime

Load `popover.js` for the documented anchored placement behavior.

Native open, close, and light-dismiss behavior remains available without the module.

Placement falls back to normal browser positioning without the module.
