# Collapsible

## Purpose

Collapsible reveals one optional block of supporting content.

Use Collapsible when the user can complete the primary task without opening the content.

Use Accordion when several related disclosures form one group.

Do not hide required instructions, errors, or primary actions in Collapsible.

## Native basis

Collapsible uses native `<details>` and `<summary>` elements.

The browser owns expanded state, focus, keyboard activation, and disclosure semantics.

## Native Web APIs

- [`<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) provides native disclosure state.
- [`<summary>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary) provides the visible trigger.
- [`open`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details#open) represents the expanded state.
- [`toggle`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/toggle_event) reports disclosure changes when application code needs them.

## Structure

```html
<details class="collapsible">
  <summary class="collapsible-trigger">
    <span>Advanced options</span>
    <i data-lucide="chevron-down" aria-hidden="true"></i>
  </summary>
  <div class="collapsible-content">
    <p>Configure optional processing behavior.</p>
  </div>
</details>
```

Keep the summary text specific to the hidden content.

Hide the chevron from assistive technology.

Do not add `role="button"` to `<summary>`.

## Initial state

Add the native `open` attribute when the content should start expanded.

```html
<details class="collapsible" open>
  <summary class="collapsible-trigger">Processing details</summary>
  <div class="collapsible-content">...</div>
</details>
```

Use the closed state when optional detail would otherwise dominate the page.

Use the open state when hiding the content would make the current state harder to understand.

## Behavior

Activating the summary toggles the native `open` state.

Enter and Space activate the summary through browser behavior.

Trigger state feedback uses the shared fast motion primitives. Content opening and closing remain immediate.

The component adds no custom JavaScript.

## Accessibility

Keep visible summary text.

Keep the summary first inside `<details>`.

Use normal semantic content inside the expanded region.

Do not duplicate `aria-expanded` on the native summary.

Do not hide required content only to reduce page length.

Keep focus styling visible on the summary.

## Runtime

Collapsible requires no component module.

The complete disclosure works without JavaScript.
