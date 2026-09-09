# Resizable

## Purpose

Resizable presents two panels with an optional user-controlled split.

Use Resizable when changing the panel proportion improves a repeated work task.

Use a static CSS split when resizing adds no task value.

Do not use Resizable for decorative balance.

## Native basis

Use two semantic panels and one static `role="separator"` divider.

Without JavaScript, both panels remain visible at the default split.

The module upgrades the divider with keyboard and pointer resizing.

The module generates decrease and increase buttons as a non-drag single-pointer alternative.

The module generates a live output when the author does not provide one.

## Native Web APIs

- [`role="separator"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/separator_role) identifies the adjustable divider.
- [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) supports mouse, pen, and touch dragging.
- [`setPointerCapture()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture) keeps dragging active outside the handle.
- [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) preserves the selected proportion after container resize.
- [`<output>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output) announces the current split.
- [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) publishes split changes.
- [WCAG 2.2 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) requires a non-drag single-pointer alternative for authored drag behavior.

## Structure

Keep exactly two `.resizable-panel` elements in one `.resizable-group`.

Place one `.resizable-handle` between the panels.

Give panel regions useful labels when their content does not name them.

```html
<section class="resizable" aria-labelledby="workspace-title">
  <h2 id="workspace-title">Project workspace</h2>

  <div class="resizable-group" data-orientation="vertical">
    <aside class="resizable-panel" id="files-panel" aria-label="Project files">
      File list
    </aside>

    <div class="resizable-handle"
         role="separator"
         aria-orientation="vertical"
         data-value-min="20"
         data-value-max="80"
         data-value-now="35"
         data-value-label="File list width"></div>

    <article class="resizable-panel" id="preview-panel">
      Document preview
    </article>
  </div>
</section>
```

Use `aria-orientation="vertical"` for a left and right split.

Use `aria-orientation="horizontal"` for a top and bottom split.

## Configuration

| Attribute | Element | Purpose |
| --- | --- | --- |
| `data-orientation` | root or group | Selects vertical or horizontal panel layout. |
| `data-step` | root or handle | Sets the arrow-key percentage step. |
| `data-page-step` | root or handle | Sets Page Up, Page Down, and generated pointer-button step size. |
| `data-value-label` | root or handle | Names the adjustable dimension. |
| `data-label` | root or handle | Overrides the separator accessible name. |
| `data-controls` | root or handle | Overrides the controlled panel IDs. |
| `data-value-min` | root or handle | Sets the minimum first-panel percentage. |
| `data-value-max` | root or handle | Sets the maximum first-panel percentage. |
| `data-value-now` | root or handle | Sets the initial first-panel percentage. |

The module may expose the legacy `data-init` readiness marker for compatibility.

Do not author `data-init` or `data-resizing`.

The default value is 35 percent.

The default arrow-key step is 1 percentage point.

The default page and pointer-control step is 10 percentage points.

## Keyboard

| Key | Vertical split | Horizontal split |
| --- | --- | --- |
| `ArrowLeft` | Decrease first-panel width. | No managed action. |
| `ArrowRight` | Increase first-panel width. | No managed action. |
| `ArrowUp` | No managed action. | Decrease first-panel height. |
| `ArrowDown` | No managed action. | Increase first-panel height. |
| `Home` | Set the minimum. | Set the minimum. |
| `End` | Set the maximum. | Set the maximum. |
| `PageDown` | Decrease by the page step. | Decrease by the page step. |
| `PageUp` | Increase by the page step. | Increase by the page step. |

The module adds `tabindex="0"` only while resize behavior is available.

## Pointer behavior

Dragging the separator changes the split continuously.

The generated decrease and increase buttons change the split without dragging.

Each generated button has a 32px target.

Each generated button uses one click or tap per change.

The module disables a generated button at the matching minimum or maximum.

Do not remove the generated controls while drag behavior remains enabled.

## Events

Resizable dispatches `resizable-change` after a user changes the split.

The event bubbles from `.resizable`.

The event detail contains `value`, `percentage`, `source`, `orientation`, and `panel`.

The `source` value is `keyboard` or `pointer`.

## Accessibility

Keep the separator visible.

Keep the generated pointer controls visible.

Keep the separator name specific when a page contains several adjustable splits.

Keep the current percentage available through `aria-valuenow` and `aria-valuetext`.

Keep the output concise.

Do not rely on dragging as the only pointer path.

Do not rely on keyboard support as the only alternative to dragging.

## No-JavaScript behavior

Both panels remain visible.

The first panel uses the default static proportion.

The separator remains a static visual divider.

No dead pointer or keyboard resize controls are rendered.

## Runtime

Load `resizable.js` only when user-controlled resizing is needed.

Omit the module for a static split.
