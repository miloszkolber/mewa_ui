# Pattern: Badge

## Native basis
`<span>` element. No interactivity required — pure visual indicator.

---

## Native Web APIs
- [`<span>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span) — inline container for phrasing content

---

## Structure

```html
<span class="badge" data-variant="default">Badge</span>
```

---

## Variants

| `data-variant` | Purpose                           |
|----------------|-----------------------------------|
| `default`      | Primary background, high emphasis  |
| `secondary`    | Secondary background, medium       |
| `outline`      | Border only, low emphasis          |
| `count`        | Fixed 24x24 square counter, inside buttons |

```html
<span class="badge" data-variant="default">New</span>
<span class="badge" data-variant="secondary">Draft</span>
<span class="badge" data-variant="outline">v0.1.0</span>
<span class="badge" data-variant="count">3</span>
```

The count variant is a static 24x24 square used for notification counters. When the count exceeds 99, render `99+`.

---

## Status states

Use `data-state` instead of `data-variant` when the badge communicates operational status. The visible label remains the authoritative state, while the filled semantic status surface provides a secondary visual cue. Status badges never use borders.

| `data-state` | Purpose |
|---|---|
| `positive` | Completed, healthy, connected, or ready |
| `caution` | Delayed, degraded, or requiring attention |
| `negative` | Failed, unavailable, or destructive result |
| `running` | Active work or an operation in progress |

```html
<span class="badge" data-state="positive">Ready</span>
<span class="badge" data-state="caution">Delayed</span>
<span class="badge" data-state="negative">Failed</span>
<span class="badge" data-state="running">Running</span>
```

Status changes are immediate and motionless. Do not use `data-state` for decorative color or combine it with `data-variant`.

---

## Accessibility

- Use descriptive text content — badges are read inline by screen readers.
- Do not rely on status color alone. Use a label such as “Ready,” “Delayed,” “Failed,” or “Running.”
- If the badge is purely decorative, add `aria-hidden="true"`.
