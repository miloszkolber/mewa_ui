# Tooltip

## Native basis

Popover API (`popover="hint"`) for hover/focus hint popups with CSS anchor positioning for placement.

## Native Web APIs

- [`popover` attribute (`hint`)](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/popover) — native popover with light dismiss, doesn't close `auto` popovers
- [CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) — tether tooltip to trigger element
- [`position-area`](https://developer.mozilla.org/en-US/docs/Web/CSS/position-area) — declarative anchor-relative placement on a 3×3 grid
- [`position-try-fallbacks`](https://developer.mozilla.org/en-US/docs/Web/CSS/position-try-fallbacks) — automatic collision avoidance (flip-block, flip-inline)

## Structure

### Basic

```html
<button type="button" class="btn" data-tooltip-trigger="my-tip">Hover me</button>
<div class="tooltip" id="my-tip" popover="hint" role="tooltip">Tooltip text</div>
```

### With arrow

```html
<button type="button" class="btn" data-tooltip-trigger="my-tip">Hover me</button>
<div class="tooltip" id="my-tip" popover="hint" role="tooltip">
  Tooltip text
  <div data-arrow></div>
</div>
```

### Side placement

```html
<div class="tooltip" id="tip-bottom" popover="hint" role="tooltip" data-side="bottom">Below</div>
<div class="tooltip" id="tip-left" popover="hint" role="tooltip" data-side="left">Left</div>
<div class="tooltip" id="tip-right" popover="hint" role="tooltip" data-side="right">Right</div>
```

### Side + alignment

```html
<div class="tooltip" id="tip-top-start" popover="hint" role="tooltip" data-align="start">Top start</div>
<div class="tooltip" id="tip-bottom-end" popover="hint" role="tooltip" data-side="bottom" data-align="end">Bottom end</div>
```

### Disable the open delay

```html
<button type="button" class="btn" data-tooltip-trigger="my-tip" data-delay="0">Instant tooltip</button>
```

## Variants

### Side (`data-side`)

| Value    | Placement                | position-area |
| -------- | ------------------------ | ------------- |
| *(none)* | Above trigger (default)  | `top`         |
| `top`    | Above trigger            | `top`         |
| `bottom` | Below trigger            | `bottom`      |
| `left`   | Left of trigger          | `left`        |
| `right`  | Right of trigger         | `right`       |

### Alignment (`data-align`)

| Value      | Alignment                         |
| ---------- | --------------------------------- |
| *(none)*   | Centered on trigger axis (default)|
| `center`   | Centered on trigger axis          |
| `start`    | Aligned to start edge             |
| `end`      | Aligned to end edge               |

## ARIA

| Attribute          | Element  | Purpose                                   |
| ------------------ | -------- | ----------------------------------------- |
| `role="tooltip"`   | `.tooltip` | Identifies the element as a tooltip       |
| `aria-describedby` | trigger  | Links trigger to tooltip (set by JS)      |
| `popover="hint"`   | `.tooltip` | Hint popover semantics                   |

## Notes

- **Delay**: Default open delay is 500 ms. Custom delays are not supported; `data-delay="0"` on the trigger disables the open delay (instant tooltips).
- **Group behavior**: Once any tooltip becomes visible, subsequent tooltips in the document open instantly (skip delay). After 400 ms with no tooltip visible, the delay resets.
- **Collision avoidance**: Uses `position-try-fallbacks: flip-block, flip-inline` to automatically reposition when near viewport edges.
- **Fallback placement**: In engines without `position-area` support the tooltip is placed with explicit coordinates relative to the trigger, so it never falls back to an off-screen static position.
- **Scroll dismiss**: Open tooltips are automatically hidden when the page scrolls.
- **Escape dismiss**: Handled natively by `popover="hint"` — no extra JS needed.
- **Keyboard**: Tooltip shows on focus, hides on blur. Focus stays on trigger.
- **Disabled triggers**: Wrap a disabled button in a `<span>` with `data-tooltip-trigger` since disabled elements don't fire mouse/focus events.
- **Arrow**: Add `<div data-arrow></div>` inside the tooltip for a connecting caret. Arrow positioning is automatic based on `data-side`.
- **Do not set `display` on `.tooltip`**: The closed state relies on `display: none` (set by the component layer). Author `display` values (e.g. `display: flex`) override it and leave an invisible phantom in the layout. Put custom internal layout on a wrapper element inside the tooltip instead.
