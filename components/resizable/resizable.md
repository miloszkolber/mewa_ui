# Pattern: Resizable

## Native basis

Two semantic panels in a flex container, separated by a focusable `<button role="separator">`. The separator uses the ARIA separator value properties, native Pointer Events, and a native `<output>` live region. CSS keeps both panels usable when JavaScript is unavailable.

## Native Web APIs

- [`role="separator"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/separator_role) — identifies a focusable, movable divider and exposes its value
- [`<button>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button) — provides a native focus target and disabled state for the separator control
- [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) — one pointer model for mouse, pen, and touch dragging
- [`setPointerCapture()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture) — keeps a drag active when the pointer leaves the handle
- [`<output>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output) — native status output that can be announced as a live region
- [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) — keeps the selected percentage when the group changes size
- [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) — publishes `resizable-change` updates to embedding code
- [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) — visible keyboard focus indication
- [`forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors) — system-color support for high contrast modes

The matching shadcn/ui reference describes a panel-group, panel, and handle composition. No matching Basecoat UI, WAI-ARIA APG separator pattern, or Base UI resizable page was available, so MDN's focusable separator guidance is the accessibility authority for this implementation.

---

## Structure

### Vertical divider (default)

```html
<section class="resizable" aria-labelledby="workspace-title">
  <h2 id="workspace-title">Project workspace</h2>
  <div class="resizable-group" data-orientation="vertical">
    <aside class="resizable-panel" id="file-panel" aria-label="Project files">
      File list
    </aside>
    <button
      class="resizable-handle"
      type="button"
      role="separator"
      tabindex="0"
      aria-orientation="vertical"
      aria-label="Resize file list"
      aria-controls="file-panel document-panel"
      aria-valuemin="20"
      aria-valuemax="80"
      aria-valuenow="35"
      aria-valuetext="File list width: 35 percent"
      data-value-label="File list width"
    ></button>
    <article class="resizable-panel" id="document-panel">
      Document content
    </article>
  </div>
  <output class="resizable-output" aria-live="polite" aria-atomic="true">
    File list width: 35 percent
  </output>
</section>
```

The group must contain exactly two `.resizable-panel` elements and one `.resizable-handle`. The first panel is the panel whose size changes. The output is optional because `resizable.js` creates one when it is absent.

### Horizontal divider

```html
<div class="resizable" data-orientation="horizontal">
  <div class="resizable-group" data-orientation="horizontal">
    <section class="resizable-panel">Inspector</section>
    <button
      class="resizable-handle"
      type="button"
      role="separator"
      tabindex="0"
      aria-orientation="horizontal"
      aria-label="Resize inspector"
      aria-valuemin="25"
      aria-valuemax="75"
      aria-valuenow="50"
      aria-valuetext="Inspector height: 50 percent"
    ></button>
    <section class="resizable-panel">Preview</section>
  </div>
</div>
```

`aria-orientation="vertical"` means a vertical divider and a left/right width adjustment. `aria-orientation="horizontal"` means a horizontal divider and an up/down height adjustment.

---

## Data attributes

| Attribute | Element | Values | Description |
|-----------|---------|--------|-------------|
| `data-orientation` | `.resizable` or `.resizable-group` | `vertical` or `horizontal` | Selects the divider direction. The handle's `aria-orientation` takes precedence. |
| `data-step` | root or handle | positive number | Arrow-key percentage increment. Defaults to `1`. |
| `data-page-step` | root or handle | positive number | Page-key percentage increment. Defaults to `10`. |
| `data-value-label` | root or handle | text | Prefix for `aria-valuetext` and the output announcement. |
| `data-init` | root | empty | Set by the module after initialization. Do not set manually. |
| `data-resizing` | root and handle | empty | Present only during a pointer drag. |

The separator's `aria-valuemin`, `aria-valuemax`, and `aria-valuenow` values are percentages from `0` to `100`. Defaults are `0`, `100`, and `35` when the corresponding attributes are omitted. Values are clamped to the declared range.

---

## States

| State | Element | Behavior |
|-------|---------|----------|
| Initial | `.resizable` | CSS lays out two panels even before JavaScript runs. |
| Resizing | `.resizable` and `.resizable-handle` with `data-resizing` | Pointer drag is active and text selection is disabled on the handle. |
| Disabled | `.resizable-handle[disabled]` or `[aria-disabled="true"]` | The divider cannot be dragged or adjusted by keyboard. |
| Narrow group | `.resizable-group` | Panels keep `min-inline-size: 0` and scroll their own content instead of forcing a second viewport. |
| No JavaScript | `.resizable-group` | Both panels remain visible using the default 35/65 flex split. The divider is static. |

---

## Keyboard

Focus the separator with `Tab`. Every handled key prevents the browser's default page action.

| Key | Vertical divider | Horizontal divider |
|-----|------------------|--------------------|
| `Left Arrow` | Decrease first-panel width | — |
| `Right Arrow` | Increase first-panel width | — |
| `Up Arrow` | — | Decrease first-panel height |
| `Down Arrow` | — | Increase first-panel height |
| `Home` | Set first panel to minimum | Set first panel to minimum |
| `End` | Set first panel to maximum | Set first panel to maximum |
| `Page Up` | Increase by `data-page-step` | Increase by `data-page-step` |
| `Page Down` | Decrease by `data-page-step` | Decrease by `data-page-step` |

Arrow keys use `data-step` (one percentage point by default). Values stop at `aria-valuemin` and `aria-valuemax`.

---

## ARIA

| Attribute | Element | Purpose |
|-----------|---------|---------|
| `role="separator"` | `.resizable-handle` | Identifies the movable divider. |
| `aria-orientation` | `.resizable-handle` | Describes the divider direction. |
| `aria-label` | `.resizable-handle` | Names the adjustment when the page has more than one divider. |
| `aria-controls` | `.resizable-handle` | References the two panels controlled by the divider. |
| `aria-valuemin` | `.resizable-handle` | Lower percentage boundary. |
| `aria-valuemax` | `.resizable-handle` | Upper percentage boundary. |
| `aria-valuenow` | `.resizable-handle` | Current first-panel percentage. Updated after keyboard and pointer changes. |
| `aria-valuetext` | `.resizable-handle` | Human-readable value, for example `File list width: 35 percent`. |
| `aria-live="polite"` | `.resizable-output` | Announces the latest value without moving focus. |
| `aria-atomic="true"` | `.resizable-output` | Announces the complete value sentence. |

The button element supplies a native focus target. The explicit separator role is the semantic role exposed to assistive technology, and the handle's descendants are decorative only.

---

## Events

| Event | Target | `detail` |
|-------|--------|----------|
| `resizable-change` | `.resizable` | `{ value, percentage, source, orientation, panel }` |

`source` is `keyboard` or `pointer`. The event bubbles so a parent can persist the layout or update related content. No event is dispatched for initial setup or a resize that does not change the quantized value.

---

## Notes

- Include `resizable.css` with the foundation files. Load `resizable.js` only when pointer and keyboard resizing is needed.
- The first panel receives a pixel flex basis during enhancement so `aria-valuenow` tracks the rendered group dimension. A `ResizeObserver` reapplies the same percentage when the group changes size.
- Pointer dragging uses `touch-action: none`, pointer capture, and `pointercancel` cleanup. The module never starts a polling loop or animation.
- Keep the output in the component when a visible value helps all users. If it is omitted, the module adds a tokenized output status after the group.
- The CSS contains no transitions, animations, shadows, or rounded containers. Forced colors use system color keywords and keyboard focus uses `:focus-visible`.
