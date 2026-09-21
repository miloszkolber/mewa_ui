# Hover Card

## Purpose

Hover Card shows a rich contextual preview for one link or control.

Use Hover Card when the preview can include structured or interactive supporting content.

Use Tooltip for a short non-interactive hint.

Use Popover when the user must explicitly open contextual controls.

Do not put required information only in Hover Card.

## Native basis

Hover Card uses a native trigger, `popover="manual"`, and CSS Anchor Positioning.

The module manages deliberate pointer timing and immediate keyboard-focus behavior.

The module keeps the surface open while the pointer or focus moves between the trigger and card.

## Native Web APIs

- [`popover="manual"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/popover) provides non-modal top-layer rendering with component-owned timing.
- [CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) places the card beside its trigger.
- [`aria-describedby`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-describedby) connects the trigger to the supplementary preview.
- [`focusin`](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusin_event) keeps interactive card content available to keyboard users.

## Structure

Set `data-hover-card-trigger` to the card ID.

Keep the card directly after its trigger when keyboard users must reach interactive content inside it.

```html
<a class="hover-card-trigger"
   href="/people/maya-chen"
   data-hover-card-trigger="maya-chen-preview">
  Maya Chen
</a>

<div class="hover-card"
     id="maya-chen-preview"
     popover="manual"
     aria-label="Maya Chen preview">
  <div class="hover-card-header">
    <p class="hover-card-title">Maya Chen</p>
    <p class="hover-card-description">Design systems engineer</p>
  </div>
  <div class="hover-card-content">
    <p>Maintains shared interface foundations and accessibility contracts.</p>
    <a class="hover-card-link" href="/people/maya-chen">View profile</a>
  </div>
</div>
```

Keep the trigger useful without the preview.

Keep preview text concise.

Keep interactive descendants in normal document order.

## Placement

Use `data-side="top"`, `right`, `bottom`, or `left` on `.hover-card`.

Use `data-align="start"`, `center`, or `end` for secondary-axis alignment.

The default placement is bottom and center aligned.

Let position fallbacks move the card when the preferred placement does not fit.

Do not hardcode viewport coordinates in consumer code.

## Behavior

Pointer hover opens the card after 150ms.

Pointer exit closes the card after 100ms.

Keyboard focus opens the card immediately.

The close delay gives the pointer time to move from the trigger into the card.

Pointer or focus presence inside the card keeps it open.

Escape closes the card and restores focus to the trigger.

An outside pointer action or page scroll closes the card.

The module sets `aria-describedby` on the trigger.

The module retries initialization when a trigger appears before its target.

The module uses explicit coordinates when CSS Anchor Positioning is unavailable.

## Keyboard

Tab reaches the trigger through its native keyboard behavior.

Focus opens the card without a pointer delay.

Tab can move from the trigger to interactive content inside an adjacent open card.

Escape closes the card and returns focus to the trigger.

Hover Card adds no arrow-key behavior.

## Accessibility

Keep the trigger accessible without the preview.

Use a native link when the trigger names a destination.

Use a native button with an explicit `type` when the trigger performs an action.

Give the card an accessible label when its visible content does not provide clear context.

Keep required instructions and essential status visible outside Hover Card.

Do not use Hover Card as the trigger's accessible name.

Do not move form errors into Hover Card.

## No-JavaScript

Without the module, the trigger keeps its native link or button behavior.

The supplementary card stays closed.

Keep every required detail available at the trigger destination or in visible page content.

Do not use a script-only trigger when the preview is the only useful result.

## Runtime

Load `hover-card.js` whenever Hover Card appears.

The documented hover, focus, timing, and placement behavior requires JavaScript.
