# Button Group

## Purpose

Button Group connects related actions into one visual control group.

Use Button Group when adjacent buttons operate on the same task or object.

Do not group unrelated actions only to reduce spacing.

Use Toolbar when the group needs managed arrow-key navigation.

## Native basis

Use native buttons inside a labelled `role="group"` container.

Each button keeps its own native activation and form behavior.

Button Group requires no JavaScript.

## Native Web APIs

- [`role="group"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/group_role) identifies a related control group.
- [`aria-label`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label) can name the group when no visible label exists.
- [`role="separator"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/separator_role) identifies a structural separator.

## Horizontal structure

```html
<div class="btn-group" role="group" aria-label="Document actions">
  <button class="btn" type="button" data-variant="secondary">Save</button>
  <button class="btn" type="button" data-variant="secondary">Duplicate</button>
  <button class="btn" type="button" data-variant="secondary">Archive</button>
</div>
```

Use Secondary when the connected border treatment helps the group read as one unit.

## Vertical structure

```html
<div class="btn-group"
     data-orientation="vertical"
     role="group"
     aria-label="Document actions">
  <button class="btn" type="button" data-variant="secondary">Save</button>
  <button class="btn" type="button" data-variant="secondary">Duplicate</button>
  <button class="btn" type="button" data-variant="secondary">Archive</button>
</div>
```

Use vertical orientation only when the surrounding layout requires a vertical action set.

## Separator

Use a separator only when filled adjacent buttons need a visible division.

```html
<div class="btn-group" role="group" aria-label="Clipboard actions">
  <button class="btn" type="button" data-variant="default">Copy</button>
  <hr role="separator">
  <button class="btn" type="button" data-variant="default">Paste</button>
</div>
```

Do not add separators between Secondary buttons when their borders already provide the division.

## Behavior

Tab reaches each native button in normal document order.

Enter and Space activate the focused button.

Button Group adds no roving focus.

Button Group adds no shared pressed state.

Button Group adds no JavaScript behavior.

## Accessibility

Give the group an accessible name when nearby context does not name it.

Keep every child button label specific.

Keep destructive actions visually distinct from routine actions.

Do not place a second control group inside Button Group.

## Runtime

Button Group requires no component module.
