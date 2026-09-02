# Composer

## Purpose

Composer collects a message and groups the actions used to send it.

Use Composer for a conversational prompt, instruction, or follow-up message.

Use Textarea for ordinary multi-line form content without message actions.

Do not use Composer as a general page toolbar.

## Native basis

Composer uses a native `<form>`, visible or visually hidden `<label>`, `<textarea>`, and submit button.

Native form submission is the default behavior.

CSS uses `field-sizing: content` for content-driven textarea growth.

The optional module adds documented Enter submission modes.

## Native Web APIs

- [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) provides submission and validation.
- [`<textarea>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea) provides multi-line editing.
- [`requestSubmit()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/requestSubmit) preserves native submitter and validation behavior.
- [`field-sizing`](https://developer.mozilla.org/en-US/docs/Web/CSS/field-sizing) grows the textarea from its content.

## Structure

```html
<form class="composer" action="/messages" method="post" data-submit-on="mod-enter">
  <label class="composer-label" for="composer-message">Message</label>
  <textarea class="composer-input"
            id="composer-message"
            name="message"
            rows="2"
            placeholder="Ask a follow-up question"
            aria-describedby="composer-submit-hint"
            required></textarea>
  <div class="composer-actions">
    <div class="composer-actions-leading">
      <button class="btn" type="button" data-variant="ghost" data-size="icon-sm" aria-label="Attach file">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"></path>
        </svg>
      </button>
    </div>
    <div class="composer-actions-trailing">
      <span class="composer-hint" id="composer-submit-hint">⌘ or Ctrl + Enter</span>
      <button class="btn composer-submit" type="submit" data-variant="default">Send</button>
    </div>
  </div>
</form>
```

Keep one label associated with the textarea.

Use `.composer-label` when the surrounding conversation already supplies visible context.

Keep action groups after the textarea in source order.

Use existing Button, File Input, Select, or Popover contracts for composed controls.

Set `aria-busy="true"` and `data-state="thinking"` while a response is in progress.

Keep visible status text inside `.composer-status` during the thinking state.

Disable only actions that would start duplicate unsafe work.

## Keyboard

The browser provides normal textarea editing, selection, undo, and clipboard behavior.

Set `data-submit-on="mod-enter"` to submit with Command+Enter or Control+Enter.

Set `data-submit-on="enter"` to submit with Enter and insert a line break with Shift+Enter.

The submit button always uses native Enter and Space activation.

Do not intercept an Enter key while an input method composition is active.

## Behavior

Load `composer.js` only when a keyboard submission mode is required.

The module calls `requestSubmit()` and preserves native validation and submit events.

The module does not clear the textarea or prevent the application from retaining a failed message.

Application code owns sending, thinking state, and response handling.

## Accessibility

Keep an explicit label even when `.composer-label` hides it visually.

Keep the placeholder supplementary to the label.

Keep every icon-only action named.

Keep visible text for the thinking state.

Use one live status source for one response state.

Do not announce each textarea input event.

## No-JavaScript

The textarea, native validation, and submit button work without JavaScript.

Keyboard shortcuts fall back to normal multi-line editing.

The form submits through its authored `action` and `method`.

## Runtime

Composer uses an optional component module.

Load `composer.js` when `data-submit-on` keyboard behavior is required.
