# Toast

## Purpose

Toast announces a brief non-blocking result.

Use Toast for status that does not require a decision.

Use Callout for persistent important information.

Use Dialog or Alert Dialog for blocking work.

Do not use Toast as the only presentation of a form validation error.

## Native basis

Toast uses a manual Popover surface and a live status role.

The module creates, stacks, pauses, dismisses, and announces Toast instances.

The module exposes the `window.toast` API.

## Native Web APIs

- [`popover="manual"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/popover) keeps a Toast in the top layer without light dismiss.
- [`role="status"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/status_role) provides polite status announcement.
- [`role="alert"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/alert_role) provides assertive announcement for an urgent error status.
- [`aria-atomic`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-atomic) announces the complete message.

## Container

The module creates the container when the page does not provide one.

Provide one container only when the application needs a non-default position.

```html
<div class="toast-container"
     id="toast-container"
     role="region"
     aria-label="Notifications"
     data-position="bottom-right"></div>
```

Supported positions are `bottom-right`, `bottom-left`, `bottom-center`, `top-right`, `top-left`, and `top-center`.

The default position is `bottom-right`.

## API

Show a neutral status with `toast.show()`.

```js
window.toast.show({
  title: 'Settings saved',
  description: 'The new configuration is active.'
});
```

Use `toast.success()`, `toast.warning()`, `toast.info()`, or `toast.error()` for semantic status variants.

Use `toast.dismiss()` to dismiss all visible Toast instances.

## Actions

Use one short action only when the action directly reverses or completes the reported result.

```js
window.toast.show({
  title: 'Item removed',
  action: {
    label: 'Undo',
    onClick() {
      restoreItem();
    }
  }
});
```

Do not put a multi-step task inside Toast.

## Duration

The default duration is 4000ms.

Pass `duration: 8000` when the message needs more reading time.

Pass `duration: Infinity` when application code must dismiss the Toast explicitly.

A finite Toast pauses while the pointer is over it.

A finite Toast pauses while focus is inside it.

A finite Toast resumes with the remaining time.

The container keeps at most three Toast instances visible.

## Behavior

The module creates Toast markup through controlled DOM operations.

The module uses fixed local SVG strings for built-in status and close icons.

The module uses `textContent` for application-provided title, description, and action label values.

The newest Toast appears nearest the active stack edge.

The close button dismisses one Toast.

An action dismisses its Toast after the action callback runs.

A destructive Toast uses assertive announcement.

Other Toast variants use polite announcement.

## Accessibility

Keep the title concise.

Keep descriptions short enough to understand without opening another surface.

Use inline Field errors for form validation.

Use Toast only as supplementary confirmation after form submission.

Pause timed dismissal during hover and focus.

Keep the close control keyboard reachable.

Do not move focus to a newly created Toast.

Do not use repeated assertive Toast messages for routine events.

## Runtime

Load `toast.js` before application code calls `window.toast`.

Toast has no useful interactive fallback without the module.
