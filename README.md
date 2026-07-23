# Core UI

`core-ui.css` is the shared, framework-agnostic UI foundation for Core's small
service frontends. It follows Geist's published tokens and metrics with
shadcn/ui's open-code composition model.

## Principles

- Use semantic HTML and native controls before adding JavaScript components.
- Keep shared tokens and primitives here; keep service layout in service CSS.
- Use the system font stacks, 4px spacing scale, modest radii, and neutral
  surfaces.
- Use a 2px element border for focused inputs and selected content; reserve red
  for destructive actions and green for healthy status.
- Preserve visible focus, keyboard navigation, reduced motion, and mobile
  layouts.
- Do not add a frontend build step solely to consume the foundation.

## Tokens

Tokens are grouped by semantic colors, typography, component sizing, spacing
and layout, then elevation and layering. Prefer role-based tokens such as
`--ui-text-primary`, `--ui-control-bg-hover`, and `--ui-danger` in shared
primitives. The shorter legacy color names remain aliases for existing service
styles.

Typography uses the 12/14/16/24/32px size scale and four unitless line-height
roles: `tight` (1), `snug` (1.25), `normal` (1.5), and `relaxed` (1.6).

## Primitives

- Layout: `ui-container`, `ui-container-wide`, `ui-app-header`,
  `ui-page-overview`, `ui-workspace`, `ui-panel`, `ui-panel-header`,
  `ui-panel-body`
- Navigation: `ui-brand`, `ui-tabs`, `ui-tab`
- Type: `ui-page-heading`, `ui-eyebrow`, `ui-description`, `ui-title-sm`,
  `ui-title-md`, `ui-meta-text`
- Controls: `ui-button` with `ui-button-primary`, `ui-button-secondary`,
  `ui-button-tertiary`, or `ui-button-danger`; `ui-button-icon`,
  `ui-icon-button`, `ui-field-stack`, `ui-field-label`, `ui-field`,
  `ui-select-wrap`, `ui-select`, `ui-input-group`, `ui-textarea`, `ui-checkbox`
- Feedback: `ui-badge`, `ui-stats`, `ui-status-indicator`,
  `ui-status-icon`, `ui-empty`, `ui-empty-compact`, `ui-field-error`,
  `ui-progress`, `ui-code-output`
- Overlays: `ui-dialog`, `ui-dialog-panel`, `lightbox`

Mount `/home/core/docker/ui_library` read-only and load `core-ui.css` before
service-specific CSS. `meili_ui` is the reference implementation.
Service-specific branding belongs with that service's assets rather than in
this shared foundation.

Interface icons live in `lucide.svg`. Reference them with same-origin sprite
links such as `<use href="/lucide.svg#search" />`; keep product marks and media
fallback illustrations with the consuming service.
