# Combobox

## Purpose

Combobox lets a user search one finite option list and select one value.

Use Combobox when a native Select becomes difficult to scan.

Use Select when the option list is short and search is not necessary.

Do not use Combobox for free-form text entry.

Do not use Combobox for multiple selection.

## Native basis

Combobox uses a button trigger, a native popover, a search input, and a listbox.

The Popover API provides top-layer rendering and light dismiss.

CSS Anchor Positioning places the popover beside the trigger.

The module provides filtering, option navigation, selection, focus management, and form-value synchronization.

## Native Web APIs

- [`<button>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button) provides trigger semantics.
- [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) provides top-layer rendering and light dismiss.
- [CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) positions the popover.
- [`<input type="hidden">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/hidden) submits the selected value.
- [`role="combobox"`](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) exposes the searchable input pattern.
- [`overscroll-behavior`](https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior) stops scroll chaining from the list.

## Structure

```html
<div class="combobox">
  <span class="label" id="framework-label">Framework</span>
  <input type="hidden" name="framework" value="" data-combobox-input>

  <button class="btn combobox-trigger"
          type="button"
          data-variant="secondary"
          id="framework-trigger"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-controls="framework-popover"
          aria-labelledby="framework-label framework-value">
    <span class="combobox-value"
          id="framework-value"
          data-placeholder="Select framework">Select framework</span>
    <svg class="combobox-chevron" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.2072 9.0428 12.0001 2.83569 5.793 9.0428 7.20721 10.457 12.0001 5.66412 16.793 10.457 18.2072 9.0428ZM5.79285 14.9572 12 21.1643 18.2071 14.9572 16.7928 13.543 12 18.3359 7.20706 13.543 5.79285 14.9572Z"/></svg>
  </button>

  <div class="combobox-content" id="framework-popover" popover>
    <div class="combobox-search">
      <svg class="combobox-search-icon" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z"/></svg>
      <input class="combobox-search-input"
             type="text"
             role="combobox"
             autocomplete="off"
             aria-label="Search frameworks"
             aria-expanded="false"
             aria-controls="framework-listbox"
             aria-activedescendant=""
             aria-autocomplete="list"
             placeholder="Search">
    </div>

    <div class="combobox-listbox"
         id="framework-listbox"
         role="listbox"
         aria-label="Frameworks">
      <div class="combobox-empty" hidden>No results found.</div>
      <div class="combobox-item"
           id="framework-next"
           role="option"
           data-value="nextjs"
           aria-selected="false">Next.js</div>
      <div class="combobox-item"
           id="framework-svelte"
           role="option"
           data-value="sveltekit"
           aria-selected="false">SvelteKit</div>
      <div class="combobox-item"
           id="framework-nuxt"
           role="option"
           data-value="nuxt"
           aria-selected="false">Nuxt</div>
    </div>
  </div>
</div>
```

Give every option a unique ID.

Give every option a stable `data-value`.

Give the search input an explicit accessible name.

Use a hidden input when the selected value belongs to a form.

Omit the hidden input when the selection does not submit a form value.

## Groups

```html
<div class="combobox-listbox"
     id="timezone-listbox"
     role="listbox"
     aria-label="Time zones">
  <div class="combobox-empty" hidden>No results found.</div>
  <div class="combobox-group-label">North America</div>
  <div class="combobox-item"
       id="timezone-est"
       role="option"
       data-value="est"
       aria-selected="false">Eastern</div>
  <div class="combobox-item"
       id="timezone-pst"
       role="option"
       data-value="pst"
       aria-selected="false">Pacific</div>
  <div class="combobox-separator" aria-hidden="true"></div>
  <div class="combobox-group-label">Europe</div>
  <div class="combobox-item"
       id="timezone-gmt"
       role="option"
       data-value="gmt"
       aria-selected="false">London</div>
</div>
```

Use a group label only when the grouping helps scanning.

Hide a separator from assistive technology.

## Data attributes

| Attribute | Element | Owner | Purpose |
| --- | --- | --- | --- |
| `data-combobox-input` | hidden input | Author | Identifies the submitted value control. |
| `data-placeholder` | `.combobox-value` | Module | Marks visible placeholder text. |
| `data-highlighted` | `.combobox-item` | Module | Marks the active keyboard option. |
| `data-value` | `.combobox-item` | Author | Defines the submitted option value. |
| `data-init` | `.combobox` | Module | Legacy readiness marker; do not author. |

Do not set `data-highlighted` in static markup.

Do not use visible option text as a stable application value.

## ARIA

The trigger uses `aria-haspopup="listbox"`.

The trigger reports the popover state with `aria-expanded`.

The trigger points to the popover with `aria-controls`.

The trigger receives its name from the field label and visible value.

The search input uses `role="combobox"`.

The search input points to the listbox with `aria-controls`.

The search input reports the active option with `aria-activedescendant`.

The list container uses `role="listbox"`.

Each option uses `role="option"` and `aria-selected`.

A disabled option uses `aria-disabled="true"`.

## Behavior

Activating the trigger opens the popover.

Opening the popover moves focus to the search input.

Opening the popover clears the previous search query.

Typing filters options with case-insensitive substring matching.

Filtering highlights the first enabled result.

Filtering announces the enabled result count through one generated status region.

Selecting an option updates the visible value.

Selecting an option updates the optional hidden input.

Selecting an option dispatches `input` and `change` from the hidden input.

Selecting an option closes the popover.

Selecting an option returns focus to the trigger.

Light dismiss closes the popover without forcing focus back to the trigger.

The module restores a static `aria-selected="true"` option during initialization.

## Keyboard

| Key | Behavior |
| --- | --- |
| `ArrowDown` | Move to the next enabled visible option. |
| `ArrowUp` | Move to the previous enabled visible option. |
| `Home` | Move to the first enabled visible option. |
| `End` | Move to the last enabled visible option. |
| `Enter` | Select the highlighted option. |
| `Escape` | Close the popover and return focus to the trigger. |
| `Tab` | Close the popover and continue the normal tab sequence. |

The trigger uses native button keyboard activation.

The search input keeps DOM focus while option focus uses `aria-activedescendant`.

## Form behavior

The hidden input submits the selected `data-value`.

Native form reset restores the initial value and visible label, clears the query, and closes the popover.

A canceled reset preserves the current selection.

The hidden input does not provide native required-field validation.

Validate a required selection before submission.

Show the validation error through the surrounding Field pattern.

Do not put `required` on the hidden input.

## Accessibility

Keep the visible field label.

Keep trigger, popover, listbox, and option IDs stable.

Do not remove the search input accessible name.

Do not put DOM focus on listbox options.

Keep disabled options visible when their presence explains unavailable choices.

Pair an application validation error with visible error text.

## Runtime

Load `combobox.js` whenever the component appears.

The component has no useful interactive fallback without the module.

Use a native Select when a no-JavaScript selection path is required.
