# Suggestion

## Purpose

Suggestion presents short prompt choices that can seed the next composer value.

Use Suggestion near an empty or waiting composer when a small set of useful starts improves discovery.

Use Button Group when the actions do not insert prompt text.

Do not use Suggestion for route navigation or a long command catalog.

## Native basis

Suggestion uses an unordered list of native buttons.

The application handles the selected button value and updates the target composer.

## Native Web APIs

- [`<ul>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul) groups the prompt choices.
- [`<button>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button) provides keyboard and pointer activation.
- [`disabled`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled) exposes unavailable items.
- [`dataset`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset) can carry an application-owned prompt value.

## Structure

```html
<ul class="suggestion" aria-label="Suggestions">
  <li class="suggestion-item">
    <button class="suggestion-button"
            type="button"
            data-suggestion-value="Summarise the latest release notes">
      Summarise the latest release notes
    </button>
  </li>
  <li class="suggestion-item">
    <button class="suggestion-button"
            type="button"
            data-suggestion-value="Explain this error">
      Explain this error
    </button>
  </li>
</ul>
```

Keep the visible button text equal to the inserted value when possible.

Use `data-suggestion-value` only when application code needs a value that differs from the visible label.

Keep the list short enough to scan without search.

## Behavior

Listen for normal button click events in the consuming application.

Read `data-suggestion-value` or the button text.

Move focus to the composer only when the inserted value is ready for editing.

Do not add arrow-key management to the list.

Tab, Shift+Tab, Enter, and Space retain native button behavior.

## Accessibility

Give the list an accessible name.

Use a real disabled attribute for an unavailable suggestion.

Keep each button label specific enough to predict the inserted text.

## Runtime

Suggestion requires no component JavaScript.

The list remains readable and each button remains operable without application enhancement.

The consuming application owns the target field and value change.
