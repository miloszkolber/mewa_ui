# Progress

## Purpose

Progress shows task completion or an unknown completion state.

Use Progress when the system can expose a current value and maximum.

Use Spinner for short indeterminate work when a rotating status is clearer.

Do not use Progress as decoration.

## Native basis

Use the native `<progress>` element.

The browser exposes determinate and indeterminate states.

Progress requires no JavaScript.

The ready Progress is 6px high. Its track uses the control surface and its value uses the inverted control surface.

Progress is a read-only indicator, not a form control that can be disabled.

Do not add a native `disabled` attribute to Progress.

The legacy `aria-disabled="true"` muted-value treatment remains for compatibility, but does not pause or cancel work.

## Native Web APIs

- [`<progress>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress) provides native progress semantics.
- [`value`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress#value) exposes current completion.
- [`max`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress#max) exposes the completion range.

## Determinate structure

Give Progress a visible or programmatic label.

```html
<label for="download-progress">Download progress</label>
<progress class="progress"
          id="download-progress"
          value="66"
          max="100">66%</progress>
```

Update `value` when the task advances.

Keep `max` stable unless the real task range changes.

## Indeterminate structure

Omit `value` when completion cannot be measured.

The indeterminate state shows a stationary centered segment, not a percentage or animation.

Keep visible working text beside the indicator because fallback text inside `<progress>` is not normally displayed.

```html
<label for="sync-progress">Sync in progress</label>
<progress class="progress" id="sync-progress">Working</progress>
```

Use Spinner instead when the compact animated indicator fits the context better.

## Accessibility

Keep the task name available outside the percentage value.

Use a `<label>` association when Progress describes a labelled task.

Use `aria-label` only when visible text cannot name the Progress element.

Do not announce every small percentage change through a second live region.

Keep fallback text concise.

## Runtime

Progress requires no component module.
