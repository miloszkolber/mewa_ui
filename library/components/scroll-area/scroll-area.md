# Scroll Area

## Purpose

Scroll Area contains overflow inside one bounded local region.

Use Scroll Area when independent scrolling is necessary for the task.

Use normal page flow when the content can expand without harming the interface.

Do not create nested scrolling only to constrain a section visually.

## Native basis

Scroll Area uses native CSS overflow and browser scrollbars.

The browser owns wheel, touch, keyboard, and assistive scrolling behavior.

## Native Web APIs

- [`overflow`](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow) creates the scroll container.
- [`scrollbar-width`](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-width) provides compact native scrollbar width.
- [`scrollbar-color`](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-color) applies semantic scrollbar colors where supported.
- [`scrollbar-gutter`](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-gutter) reserves scrollbar space and limits layout shift.
- [`overscroll-behavior`](https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior) contains scroll chaining.

## Structure

```html
<div class="scroll-area">
  <!-- Content whose owning layout constrains the block size. -->
</div>
```

Set the required block or inline constraint from the owning component or consumer stylesheet.

Do not put sizing styles in canonical Scroll Area markup.

## Horizontal content

Use Scroll Area for local horizontal overflow only when the content genuinely requires two-dimensional space.

Tables, code, timelines, and media can own their own overflow container when their component already documents one.

Do not wrap every wide component in an additional Scroll Area.

## Behavior

Native overflow provides scrolling.

`scrollbar-gutter: stable` reserves scrollbar space where supported.

`overscroll-behavior: contain` limits scroll transfer to the parent.

The component adds no JavaScript behavior.

## Accessibility

Keep focusable content inside the region reachable in normal document order.

Add `tabindex="0"` only when a non-focusable scroll region itself must receive keyboard focus.

Give a focusable scroll region an accessible name when its purpose is not obvious from nearby text.

Keep critical controls outside a clipped region when users must always reach them.

Do not create a scroll trap inside a modal or sheet.

Do not hide the scrollbar when the user needs a visible overflow cue.

## Runtime

Scroll Area requires no component module.

The complete scrolling behavior works without JavaScript.
