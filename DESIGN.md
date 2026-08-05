# Design guidelines

This file is the design contract for interfaces built on `core-ui.css` and
`lucide.svg`. It captures the token system, the layout models, the state
machine, and the rules that keep the five services (`timers_ui`, `hf_ui`,
`moonlight_ui`, `meili_ui`, `rss`) visually aligned. `core-ui.css` is the
source of truth for values. `README.md` inventories the primitives. This file
explains how and why to use them.

## Principles

- **Token everything.** No hardcoded colors, spacing, radii, font sizes,
  weights, or z-indexes in service styles. If a token does not exist, add one
  to `core-ui.css`, then use it.
- **Compose, do not re-implement.** Rows, panels, status indicators, filter
  options, and empty states exist as primitives. Service CSS adds content
  rules, not restyled copies of shared behavior.
- **One state vocabulary.** A status is `ok`, `warning`, `error`, `running`,
  or `progress`, expressed as `data-state` on the owning element. Services map
  their domain terms onto this vocabulary rather than inventing per-app
  states.
- **Shared code lives here, product code lives with the service.** Layout,
  tokens, and interaction primitives belong in the library. Branding, product
  marks, media fallbacks, and per-layout panel heights belong in the service's
  own assets.
- **Dark-first and single-theme.** The palette targets dark surfaces only
  (`color-scheme: dark`). Do not add light-theme variants.
- **Accessibility is a default.** Every interactive primitive states its
  focus, selection, and live-region contract below.

## Tokens

All tokens are declared on `:root` and prefixed `--ui-`. Naming is
`--ui-<category>-<value>` with a role-based modifier where useful, for example
`--ui-text-secondary`, `--ui-border-hover`, `--ui-space-4`.

### Color roles

Use semantic roles, never raw hex values, in service CSS.

- Canvas and surfaces: `--ui-canvas` (page and media backdrop), `--ui-surface`,
  `--ui-surface-raised` (panels, dialogs), `--ui-media-bg`, `--ui-media-highlight`
- Controls: `--ui-control-bg`, `--ui-control-bg-hover`, `--ui-control-bg-active`,
  `--ui-control-primary-hover` (white, for the primary button hover)
- Borders: `--ui-border-subtle`, `--ui-border-default`, `--ui-border-hover`
- Text: `--ui-text-primary`, `--ui-text-secondary`, `--ui-text-tertiary`,
  `--ui-text-disabled`, `--ui-text-inverse` (on light surfaces),
  `--ui-text-on-danger`
- Status: `--ui-success`, `--ui-success-text`, `--ui-success-ring`,
  `--ui-warning`, `--ui-warning-muted`, `--ui-danger`, `--ui-danger-hover`,
  `--ui-danger-muted`
- Focus: `--ui-focus-ring`. Overlays: `--ui-header-overlay`,
  `--ui-control-overlay`, `--ui-dialog-overlay`, `--ui-lightbox-overlay`

`--ui-fill`, `--ui-border`, `--ui-text`, `--ui-focus`, `--ui-red`,
`--ui-green`, and `--ui-bg` are compatibility aliases. New code must use the
role tokens listed above.

### Typography

- Stacks: `--ui-font-sans` for interface text, `--ui-font-mono` for code,
  eyebrows, and technical values
- Sizes: `--ui-font-size-xs` 12px, `-sm` 14px, `-md` 14px (body default),
  `-base` 16px (titles), `-lg` 24px, `-xl` 24px, `-2xl` 32px (page headings
  via clamp)
- Weights: `--ui-font-weight-medium` 500, `-semibold` 600. Body text is the
  default weight
- Line heights: `--ui-line-height-tight` 1, `-snug` 1.25, `-normal` 1.5,
  `-relaxed` 1.6
- Letter spacing: `--ui-letter-spacing-tight`, `-title`, `-heading` for large
  titles, `-wide` for uppercase eyebrows
- Numeric values in stats use `font-variant-numeric: tabular-nums` so columns
  do not jump

### Spacing and layout

- Base scale in 4px steps: `--ui-space-1` 4px through `-8` 32px, then
  `-10` 40px, `-12` 48px, `-16` 64px
- Containers: `--ui-container-max` 1200px, `--ui-container-wide-max` 1560px,
  gutters 48px desktop and 24px mobile
- Header: `--ui-header-height` 64px, `-mobile` 56px
- Copy: `--ui-copy-max` 620px for description text

### Shape and sizing

- Radii: `--ui-radius-xs` 4px, `-sm` 6px, `-md` 12px, `-lg` 16px,
  `-full` for pills and circles
- Control heights: `--ui-control-height` 40px, `-sm` 32px
- Icons: `--ui-icon-size-sm` 16px, `-md` 18px, `--ui-status-icon-size` 20px,
  `--ui-icon-button-size` 36px, `--ui-icon-stroke-width` 1.8
- Hairlines: `--ui-border-width` 1px. Focus uses `--ui-focus-ring-width` 2px
  plus `--ui-focus-ring-outer-width` 4px for the double ring
- Status: `--ui-status-dot-size` 6px, `--ui-status-ring-width` 3px,
  `--ui-status-indicator-size` 44px

### Elevation and layering

Z-indexes form a fixed scale. Never invent values between the steps:

- `--ui-z-header` 50 (sticky header)
- `--ui-z-lightbox` 1000
- `--ui-z-dialog` 1200
- `--ui-z-toast` 1500

Dialogs and lightboxes share `--ui-shadow-dialog`.

## Layout models

Two models exist. Choose one per page and do not mix their parts.

**Document layout** for content pages: `ui-container` or `ui-container-wide`
centers the flow, `ui-app-header` sticks to the top, `ui-page-overview`
heads the page, `ui-workspace` grids the content, and `ui-panel` /
`ui-panel-header` / `ui-panel-body` frame sections.

**Framed application shell** for tool pages that fill the viewport:
`ui-framed-app` adds the fixed 24px frame gutter, the striped canvas
background, and edge-to-edge borders. Inside it, `ui-framed-dashboard`
(header plus one scrollable main area) or `ui-framed-workspace` +
`ui-framed-split` (two columns at 0.8fr / 1.2fr) structure the page. Columns
are `ui-framed-region` elements; a scrollable column is a `ui-framed-panel`,
which grids its own header and body rows (`auto minmax(0, 1fr)`).

Framed rules to respect:

- Radius is zero for panels, tabs, buttons, fields, and empty states inside a
  framed app. Only the frame gutter rounds the shell
- Adjacent framed regions separate with 1px hairlines, never gaps
- At 900px and below the frame gutter drops, columns stack to one, and region
  separators become top hairlines
- The framed workspace needs no width utilities. Its regions own their width
  and the shell owns the gutters

## Primitives

The full inventory lives in `README.md`. The contracts that matter most:

- **`ui-row`** is the base list row: grid, 16px gap and padding, 1px top
  separator between siblings. Content goes in its own cells
- **`ui-status-row`** is `ui-row` plus the standard status columns:
  `var(--ui-status-indicator-size) minmax(0, 1fr) auto`. The indicator goes
  in the first cell, copy in the middle, actions on the right. Rows without
  actions override to two columns
- **`ui-list-row`** is the interactive row for tabs, menus, and filter
  options. Selected and pressed states come from `aria-selected`,
  `aria-pressed`, and `aria-checked`. Filter options use
  `role="menuitemradio"` plus `aria-checked`
- **`ui-status-indicator`** with **`ui-status-icon-*`** children is the
  status surface. See the state machine below
- **`ui-code-output`** is the log and output pane. `is-empty` turns it into a
  centered placeholder with sans text
- **`ui-button`** variants: `-primary` (white), `-secondary` (outline),
  `-tertiary` (quiet), `-danger`, `-small`. Busy state is `is-busy`, which
  draws a spinner before the label
- **`ui-empty`** is the dashed drop-zone style; `ui-empty-compact` is the
  inline placeholder
- **`ui-dialog`** + **`ui-dialog-panel`** and **`.lightbox`** +
  **`.lightbox-content`** are the overlays. Lightbox layout is main media plus
  a 360px info column that collapses below 900px

## State machine

Status elements (rows, cards, indicators, summaries) carry
`data-state` in one of five values. Set it from JS on
`dataset.state`, never through a class toggling scheme.

| State | Meaning | Indicator treatment |
| --- | --- | --- |
| `ok` | healthy, complete, connected | success ring, success icon |
| `warning` | degraded, needs attention | warning tint, warning icon |
| `error` | failed, broken | danger tint, danger icon |
| `running` | in progress, neutral (no color) | spinner, no tint |
| `progress` | same as running (hf domain term) | spinner, no tint |

The markup contract: include all four icon classes (`ui-status-icon-loading`,
`-ok`, `-warning`, `-error`) inside the `ui-status-indicator`. Core-ui shows
the loading icon by default and swaps in the state icon and the indicator
tint when `data-state` resolves. `running` and `progress` intentionally carry
no tint so their rows stay quiet.

Domain mappings in use: hf jobs map `success` to `ok` and queue states to
`progress`. Moonlight device, cert, and update cards map to `ok` or
`warning`, and to `running` while a status refresh or reconnect is in
flight. Timers map `running` to `running` and results to `ok` or
`warning`. RSS maps feed fetch results to `ok` or `error` on its status
badges.

## Accessibility contracts

- **Focus.** Keyboard focus draws the double ring (2px canvas gap plus 4px
  `--ui-focus-ring`). Applies to `:focus-visible` on buttons, links, inputs,
  selects, textareas, and `[tabindex]`. Never ship a `outline: none` without
  replacing it
- **Tabs.** `role="tablist"`, `role="tab"`, `role="tabpanel"` with
  `aria-selected` on the active tab. `ui-tab` reads `aria-current="page"` for
  navigation
- **Menus and options.** `role="menu"` with `role="menuitemradio"` options
  that set `aria-checked`. `aria-haspopup="menu"` + `aria-expanded` on the
  trigger
- **Dialogs.** `role="dialog"` with `aria-modal="true"` and an
  `aria-labelledby` pointing at the dialog title. Hide dialogs and lightboxes
  with the `hidden` attribute, not inline `display` styles; the global
  `[hidden]` rule overrides component `display`
- **Live regions.** `role="status"` or `aria-live="polite"` for non-critical
  updates, `role="alert"` for errors
- **Motion.** Loading spinners use `ui-spin`. `prefers-reduced-motion` is
  handled globally; do not add animations that fight it
- **Icons.** Decorative icons get `aria-hidden="true"`. Icon-only buttons
  need an accessible name, for example `aria-label`

## Icons

`lucide.svg` is a same-origin sprite served from `/ui/lucide.svg`. Reference
icons with `<use href="/ui/lucide.svg#search" />` and size them with the
icon tokens. Stroke inherits `currentColor`. Product marks, logos, and media
fallback illustrations stay with the consuming service and are never added
to the sprite.

## Serving

Mount `/home/core/docker/ui_library` read-only at `/ui` and serve the
library under the `/ui/` prefix. Load `/ui/core-ui.css` before the service
stylesheet so service rules can override primitives. All five services serve
the library under the `/ui/` prefix. New or migrated services must use the
`/ui/` prefix.

## Contributing to the library

- Add a primitive to `core-ui.css` only when two or more services share the
  pattern, or when it completes a broken token scale. One-off rules belong in
  service CSS
- Prefer role-based tokens over literal values everywhere, including new
  library rules
- Keep selectors to a single class level, prefix library classes with `ui-`,
  and avoid IDs for styling
- Core-ui is additive. Consumers include services that reference only parts
  of it, so new rules must not restyle existing classes unless the change is
  part of an explicit migration
- Service state mappings must land on the shared vocabulary, not new
  `data-state` values
- Changes that touch the state machine, the z-index scale, or the token set
  belong in the same commit as their consumers

## Anti-patterns

These are the defects this library exists to prevent:

- Hardcoded `px` values for gap, padding, min-height, radius, or z-index when
  a token exists
- Copying row, panel, status, or empty-state styling into a service instead
  of composing the primitive
- Per-app status colors and icon toggling instead of `data-state`
- Using the compatibility aliases (`--ui-red`, `--ui-text`, `--ui-fill`,
  `--ui-border`, `--ui-green`, `--ui-focus`) in new code
- Serving or referencing library assets outside the `/ui/` prefix
- Adding a fourth overlapping layout model. Extend the framed or document
  model instead
- Inverting the dark palette or adding a light theme
