# Accordion

## Purpose

Accordion groups several related disclosures.

Use Accordion when users can inspect optional sections independently or one at a time.

Use Collapsible for one disclosure.

Do not hide primary sequential content in Accordion.

## Native basis

Use native `<details>` and `<summary>` elements.

The browser owns focus, keyboard activation, open state, and disclosure semantics.

Use the `name` attribute for an exclusive accordion that allows all items to close.

Use the optional module only when one item must always remain open.

## Native Web APIs

- [`<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) provides native disclosure state.
- [`<summary>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary) provides the native disclosure trigger.
- [`name`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details#name) groups exclusive disclosures without JavaScript.
- [`open`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details#open) exposes the current disclosure state.
- [`toggle`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDetailsElement/toggle_event) reports disclosure state changes.

## Multi-open structure

Omit `name` when several items can remain open.

```html
<div class="accordion">
  <details class="accordion-item" open>
    <summary class="accordion-trigger">
      <span>Connection status</span>
      <i class="accordion-chevron" data-lucide="chevron-down" aria-hidden="true"></i>
    </summary>
    <div class="accordion-content">
      <p>The service is connected.</p>
    </div>
  </details>

  <details class="accordion-item">
    <summary class="accordion-trigger">
      <span>Storage status</span>
      <i class="accordion-chevron" data-lucide="chevron-down" aria-hidden="true"></i>
    </summary>
    <div class="accordion-content">
      <p>The service has 48 GB available.</p>
    </div>
  </details>
</div>
```

## Exclusive structure

Give each related `<details>` element the same `name`.

```html
<div class="accordion">
  <details class="accordion-item" name="service-status" open>
    <summary class="accordion-trigger">Connection</summary>
    <div class="accordion-content">Connected.</div>
  </details>

  <details class="accordion-item" name="service-status">
    <summary class="accordion-trigger">Storage</summary>
    <div class="accordion-content">48 GB available.</div>
  </details>
</div>
```

Opening one named item closes another named item in the same group.

The user can close the active item.

This mode requires no component module.

## Enforced one-open mode

Use `data-type="single"` only when the interface must keep one item open.

Keep the same native `<details>` structure.

```html
<div class="accordion" data-type="single">
  <details class="accordion-item" name="service-status" open>
    <summary class="accordion-trigger">Connection</summary>
    <div class="accordion-content">Connected.</div>
  </details>

  <details class="accordion-item" name="service-status">
    <summary class="accordion-trigger">Storage</summary>
    <div class="accordion-content">48 GB available.</div>
  </details>
</div>
```

Load `accordion.js` for this stricter mode.

The module reopens the last item when closing it would leave every item closed.

## Keyboard

Tab moves focus between summary elements.

Enter toggles the focused summary.

Space toggles the focused summary.

These interactions remain browser-native.

## Accessibility

Keep a visible summary for every details element.

Keep summary text specific to the hidden content.

Do not add redundant `aria-expanded` to native summary elements.

Do not nest Accordion inside Accordion.

Keep required actions outside collapsed content.

## No-JavaScript behavior

Multi-open Accordion remains fully functional.

Named exclusive Accordion remains fully functional in current browsers.

The enforced one-open rule falls back to a normal named exclusive Accordion.

## Runtime

Accordion requires no module for normal multi-open or named exclusive use.

Load `accordion.js` only for `data-type="single"` enforced one-open behavior.
