# Badge

## Purpose

Badge shows short non-interactive status or metadata.

Use Badge to supplement nearby content with a concise label.

Do not use Badge as a button or link.

Do not use Badge as the only explanation of a status.

## Native basis

Use a `<span>` for inline badge content.

Badge adds presentation only.

Badge requires no JavaScript.

Ready badges use a 24px minimum height, 6px horizontal padding, and a 4px
icon gap. The default uses inverted general surface/text, the outline uses
secondary border/text with a transparent general surface, and status states
use the semantic alpha surfaces.

## Native Web APIs

- [`<span>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span) provides an inline phrasing container.
- [`aria-hidden`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden) can hide a purely decorative badge.

## Structure

```html
<span class="badge" data-variant="secondary">Draft</span>
```

Keep badge text short.

Keep badge text understandable without color.

## Variants

| `data-variant` | Use |
| --- | --- |
| `default` | Use for the strongest neutral metadata label. |
| `secondary` | Use for normal metadata. |
| `outline` | Use for low-emphasis metadata. |
| `count` | Use for a compact static numeric counter. Repository-only extension. |

```html
<span class="badge" data-variant="default">New</span>
<span class="badge" data-variant="secondary">Draft</span>
<span class="badge" data-variant="outline">v0.1.1</span>
<span class="badge" data-variant="count">3</span>
```

Use `99+` when a count greater than 99 does not need an exact visible value.

Do not use Count as an interactive target.

## Status states

Use `data-state` when the badge communicates operational status.

Use visible status text as the primary meaning.

```html
<span class="badge" data-state="positive">Ready</span>
<span class="badge" data-state="caution">Delayed</span>
<span class="badge" data-state="negative">Failed</span>
<span class="badge" data-state="running">Running</span>
```

Use `positive` for completed, healthy, connected, or ready status.

Use `caution` for delayed, degraded, or attention-needed status.

Use `negative` for failed or unavailable status.

Use `running` for active work.

The `count` and `running` forms are repository extensions retained alongside the Figma-aligned default, outline, and status treatments.

Do not combine `data-state` with `data-variant`.

Do not use status state for decoration.

## Accessibility

Keep meaningful Badge text in the accessibility tree.

Use `aria-hidden="true"` only when the badge duplicates adjacent accessible text exactly.

Pair status color with visible words.

Do not put essential information only in Badge when surrounding context needs a complete sentence.

## Runtime

Badge requires no component module.
