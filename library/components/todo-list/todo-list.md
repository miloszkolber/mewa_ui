# Todo List

## Purpose

Todo List presents an ordered task plan with visible item status and compact completion context.

Use Todo List when a user benefits from following an agent or process plan in execution order.

Use a normal ordered list when task status does not change.

Do not use Todo List as a general checklist input.

## Native basis

Todo List uses details and summary for disclosure and an ordered list for the task sequence.

The optional module derives the completion count from direct task items.

## Native Web APIs

- [`<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) provides disclosure state.
- [`<summary>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary) provides native keyboard activation.
- [`<ol>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol) preserves execution order.
- [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) updates derived progress after task changes.
- [`role="status"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/status_role) can announce meaningful progress updates.

## Structure

```html
<details class="todo-list" open>
  <summary class="todo-list-summary">
    <span class="todo-list-label">Fix the failing motion check</span>
    <span class="todo-list-metadata">sheet.js</span>
    <span class="todo-list-progress" data-todo-progress>1 of 3 complete</span>
  </summary>
  <div class="todo-list-content">
    <ol class="todo-list-items">
      <li class="todo-item" data-todo-item data-status="done">
        <span class="todo-item-mark" aria-hidden="true">✓</span>
        <span class="todo-item-copy">Read the failing test</span>
        <span class="todo-item-status">Done</span>
        <span class="todo-item-metadata">0.4s</span>
      </li>
      <li class="todo-item" data-todo-item data-status="active">
        <span class="todo-item-mark" aria-hidden="true">›</span>
        <span class="todo-item-copy">Trace the assertion</span>
        <span class="todo-item-status">In progress</span>
      </li>
      <li class="todo-item" data-todo-item data-status="pending">
        <span class="todo-item-mark" aria-hidden="true">·</span>
        <span class="todo-item-copy">Run the checks</span>
        <span class="todo-item-status">To do</span>
      </li>
    </ol>
  </div>
</details>
```

Use `data-status="pending"`, `active`, `done`, or `error` on every direct task item.

Keep a visible or visually hidden status label inside every task item.

Use `data-todo-progress` when the optional module should derive the summary count.

## Behavior

The module counts direct `[data-todo-item]` elements.

The module treats only `data-status="done"` as completed.

The module updates `[data-todo-progress]` after task insertion, removal, or status changes.

The module dispatches `todo-list:progress` with `completed` and `total` values.

Native disclosure behavior remains immediate.

## Accessibility

Keep task order meaningful.

Keep a text status for every task.

Use `role="status"` on the progress output only when changes need announcement.

Do not use a shape or color as the only status label.

Do not disable the native summary.

## Runtime

`todo-list.js` is optional.

Without the module, the authored completion text remains visible and the disclosure remains usable.

Load the module when task status changes in place and automatic progress derivation is useful.
