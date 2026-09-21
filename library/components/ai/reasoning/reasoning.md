# Reasoning

## Purpose

Reasoning reveals a concise trace of analysis that supports an automated result.

Use Reasoning when the trace helps a reader verify or understand the result.

Use Agent Activity when reasoning is one step in a mixed execution sequence.

Do not expose private chain-of-thought or hidden model internals.

## Native basis

Reasoning uses a native `<details>` element with a `<summary>` trigger.

The browser owns focus, keyboard activation, disclosure state, find-in-page behavior, and print output.

The optional module opens a streaming disclosure without replacing native interaction.

## Native Web APIs

- [`<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) provides disclosure state.
- [`<summary>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary) provides the visible trigger.
- [`open`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details#open) represents the expanded state.
- [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) observes streaming-state changes without polling.
- [`aria-busy`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-busy) identifies a region that is still updating.

## Structure

```html
<details class="reasoning" data-streaming data-collapse-on-complete open aria-busy="true">
  <summary class="reasoning-trigger">
    <span class="reasoning-summary">
      <span class="reasoning-marker" aria-hidden="true"></span>
      <span class="reasoning-label">Reasoning</span>
      <span class="reasoning-status" role="status">In progress</span>
    </span>
    <svg class="reasoning-chevron" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z"/></svg>
  </summary>
  <div class="reasoning-content">
    <p>Checked the active configuration and compared it with the documented fallback.</p>
  </div>
</details>
```

Keep the summary first inside `<details>`.

Use `data-streaming` only while new reasoning text is arriving.

Keep `aria-busy="true"` and visible `In progress` text synchronized with `data-streaming`.

Replace the visible status with a completion label when streaming finishes.

Use `data-collapse-on-complete` only when the completed trace should close automatically.

Keep conclusions and important warnings outside the disclosure.

## Keyboard

Tab moves focus to the summary.

Enter toggles the focused summary.

Space toggles the focused summary.

These interactions remain browser-native.

## Behavior

Load `reasoning.js` to open the disclosure when `data-streaming` appears.

The module closes the disclosure after streaming only when `data-collapse-on-complete` is present.

Manual summary interaction prevents automatic closing for the current streaming period.

The module changes the native `open` property immediately.

The application owns streamed text, visible status, duration text, and `aria-busy`.

## Accessibility

Keep the visible summary specific to the hidden trace.

Keep the static marker decorative.

Use one concise live status for the start or completion of reasoning.

Do not put a live role on `.reasoning-content`.

Do not hide errors, approvals, or required actions inside Reasoning.

Do not add redundant `aria-expanded` to the native summary.

## No-JavaScript

The disclosure remains fully operable without JavaScript.

Author `open` with `data-streaming` when a server-rendered streaming trace must start expanded.

Automatic open and optional automatic close do not run without the module.

## Runtime

Reasoning uses an optional component module.

Load `reasoning.js` when streaming state must control the initial disclosure state.
