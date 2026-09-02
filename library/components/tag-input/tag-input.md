# Tag Input

## Purpose

Tag Input converts free text into a list of discrete submitted values.

Use Tag Input when users create several short freeform labels.

Use Combobox when users must choose values from a known searchable set.

Use Text Field when the application only needs one unstructured string.

Do not add suggestions or option selection to Tag Input.

## Native basis

Tag Input starts as one native text input that submits a delimiter-separated string.

The module changes the original input to a hidden authoritative value input.

The module adds a visible text input and native removal buttons.

The enhanced chip collection uses a native list role without selection behavior.

## Native Web APIs

- [`<input type="text">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/text) provides the no-JavaScript editor and submitted value.
- [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) receives the serialized hidden value after enhancement.
- [`ClipboardEvent`](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardEvent) provides pasted tag text.
- [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) reports logical tag changes.

## Structure

Put the submitted `name`, label ID, starting value, and help relationships on the fallback input.

Use a delimiter-separated starting value.

```html
<div class="field">
  <label for="skill-tags">Skills</label>
  <div class="tag-input"
       data-tag-input
       data-delimiters=",;"
       data-max-tags="6">
    <div class="tag-input-field" data-tag-input-field>
      <input class="tag-input-fallback"
             id="skill-tags"
             name="skills"
             type="text"
             value="Accessibility, Forms"
             placeholder="Add a skill"
             autocomplete="off"
             aria-describedby="skill-tags-description skill-tags-status">
    </div>
    <p class="tag-input-status"
       id="skill-tags-status"
       data-tag-input-status
       role="status"></p>
  </div>
  <p class="field-description" id="skill-tags-description">
    Press Enter, comma, or semicolon to add a tag.
  </p>
</div>
```

Use `data-delimiters` for the characters that commit a draft.

Enter always commits a draft.

Use `data-max-tags` to set a maximum count.

Use `data-allow-duplicates` only when repeated values have distinct meaning.

## Behavior

The module parses the initial text value into trimmed tags.

The module serializes tags back to the original submitted input as a comma-separated string.

Enter or a configured delimiter commits a non-empty draft.

Pasting delimiter-separated or line-separated text commits several tags.

Backspace on an empty draft removes the last tag.

Each Remove button removes its specific tag.

The module rejects a duplicate or a value above the maximum count and writes a polite status message.

The module commits a remaining draft before native form submission.

The module dispatches native `input` and `change` events from the authoritative input after a logical change.

The module dispatches `tag-input:change` from the component with `tags` and `source` properties in `event.detail`.

## Keyboard

Tab reaches the draft input and every Remove button.

Enter commits the draft.

Backspace on an empty draft removes the last tag and keeps focus in the draft input.

Enter or Space activates a focused Remove button.

Tag Input adds no arrow-key selection model.

## Accessibility

Keep the visible label associated with the enhanced draft input ID.

Give every generated Remove button a tag-specific accessible name.

Keep removal buttons in the normal Tab order.

Use the status region for duplicate and maximum-count feedback.

Do not present freeform tags as selectable options.

## No-JavaScript

The original text input remains visible, labelled, editable, and submitted without JavaScript.

Users enter delimiter-separated values in the fallback input.

Chips, individual removal controls, and multi-part paste are unavailable without JavaScript.

## Runtime

Load `tag-input.js` when discrete chips and individual removal are required.

The module is an optional enhancement because the delimiter-separated native input remains complete without it.
