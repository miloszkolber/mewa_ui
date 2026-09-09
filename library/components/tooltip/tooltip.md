# Tooltip

## Purpose

Tooltip shows a short supplementary hint on hover and keyboard focus.

Use Tooltip to clarify an unfamiliar icon or terse control.

Use visible helper text when the information is required to complete the task.

Do not put essential instructions only in Tooltip.

## Native basis

Use `popover="hint"` for the tooltip surface.

The module opens the hint for hover and focus.

CSS Anchor Positioning places the hint beside the trigger.

The module supplies explicit coordinate fallback when anchor positioning is unavailable.

The ready Tooltip is 24px high with 6px horizontal padding. Its placement and accessibility behavior remain repository-owned enhancements.

## Native Web APIs

- [`popover="hint"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/popover) provides hint top-layer behavior.
- [CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) positions the hint beside the trigger.
- [`position-try-fallbacks`](https://developer.mozilla.org/en-US/docs/Web/CSS/position-try-fallbacks) flips the surface when space is limited.
- [`aria-describedby`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-describedby) connects the trigger to supplementary text.

## Structure

Give the trigger its own accessible name.

Use Tooltip only as supplementary description.

```html
<button class="btn"
        type="button"
        data-size="icon"
        data-tooltip-trigger="settings-tip"
        aria-label="Open settings">
  <i class="ri-settings-3-line" aria-hidden="true"></i>
</button>

<div class="tooltip"
     id="settings-tip"
     popover="hint"
     role="tooltip">
  Configure application settings
  <div data-arrow aria-hidden="true"></div>
</div>
```

## Placement

Use `data-side="top"`, `bottom`, `left`, or `right` on the Tooltip surface.

Use `data-align="start"`, `center`, or `end` for secondary-axis alignment.

Let collision handling flip or clamp the Tooltip when necessary.

Do not set `display` on `.tooltip`.

Put custom internal layout inside a child wrapper.

## Delay

The first Tooltip opens after 500ms.

A Tooltip opens immediately while another Tooltip was recently visible.

The shared instant-open state resets after 400ms with no visible Tooltip.

Set `data-delay="0"` on the trigger only when the Tooltip must open immediately.

Do not use another custom delay value.

## Behavior

Hovering the trigger opens the Tooltip after the active delay.

Focusing the trigger opens the Tooltip after the active delay.

Leaving or blurring the trigger closes the Tooltip.

Scrolling closes open Tooltips.

The module sets `aria-describedby` on the trigger.

The module retries initialization when a trigger appears before its Tooltip target.

The module corrects the caret edge after native placement flips.

The module uses explicit coordinates when anchor positioning is unavailable.

Focus always stays on the trigger.

## Disabled controls

A disabled native control does not receive normal focus or pointer events.

Wrap a disabled control with a focusable explanatory trigger only when the unavailable reason needs a Tooltip.

Prefer visible explanatory text when the unavailable reason is important.

## Accessibility

Keep Tooltip content short.

Keep the trigger accessible without the Tooltip.

Do not use Tooltip as the trigger name.

Do not place interactive controls inside Tooltip.

Do not put validation errors in Tooltip.

Do not hide required instructions in Tooltip.

## Runtime

Load `tooltip.js` whenever Tooltip appears.

Without the module, the supplementary text does not receive the documented hover and focus behavior.
