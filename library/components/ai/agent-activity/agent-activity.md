# Agent Activity

## Purpose

Agent Activity presents one chronological record of automated work.

Use Agent Activity when reasoning, searches, tool use, and traces share one meaningful sequence.

Use Timeline for ordinary product events that do not need activity kinds or execution states.

Do not use Agent Activity for navigation or a flat status summary.

## Native basis

Agent Activity uses an ordered `<ol>` with semantic `<li>` items.

Native `<details>` elements reveal optional step output.

The application owns step insertion and status changes.

## Native Web APIs

- [`<ol>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol) communicates execution order.
- [`<li>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li) identifies each activity step.
- [`<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) reveals optional output.
- [`role="status"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/status_role) announces one newly active plain step when needed.

## Structure

```html
<ol class="agent-activity" aria-label="Agent activity">
  <li class="agent-activity-item" data-kind="search" data-status="complete">
    <span class="agent-activity-marker" aria-hidden="true"></span>
    <div class="agent-activity-content">
      <div class="agent-activity-meta">
        <span class="agent-activity-kind">Search</span>
        <span class="agent-activity-status">Complete</span>
      </div>
      <p class="agent-activity-label">Found the authentication entry points.</p>
      <details class="agent-activity-disclosure">
        <summary class="agent-activity-trigger">View search details</summary>
        <div class="agent-activity-body">
          <p>Matched three files in the session module.</p>
        </div>
      </details>
    </div>
  </li>
  <li class="agent-activity-item" data-kind="tool" data-status="running">
    <span class="agent-activity-marker" aria-hidden="true"></span>
    <div class="agent-activity-content">
      <div class="agent-activity-meta">
        <span class="agent-activity-kind">Tool</span>
        <span class="agent-activity-status" role="status">Running</span>
      </div>
      <p class="agent-activity-label">Running the focused test suite.</p>
    </div>
  </li>
</ol>
```

Keep items in the order in which the work occurred.

Use `data-kind="reasoning"`, `data-kind="search"`, `data-kind="tool"`, or `data-kind="trace"`.

Use `data-status="pending"`, `data-status="running"`, `data-status="complete"`, or `data-status="error"`.

Keep the visible kind and status text synchronized with the data attributes.

Compose Reasoning or Tool Call inside `.agent-activity-body` when that component owns the step behavior.

Omit `.agent-activity-disclosure` when a step has no supporting output.

## Behavior

The ordered list adds no custom interaction.

Native summary activation controls each optional disclosure.

Application code appends steps and updates their visible status text.

Do not place a live role on the complete ordered list.

## Accessibility

Keep the ordered-list structure and the visible execution order aligned.

Keep decorative markers hidden from assistive technology.

Include visible kind and status text for every item.

Add `role="status"` only to a plain status that changes dynamically.

Do not announce the same running state from a nested component and the item status.

## Runtime

Agent Activity requires no component module.

The complete sequence and every disclosure work without JavaScript.
