# Migrating services from `core-ui.css`

The canonical library is the production pair `src/base.css` and `src/mewa.css`, plus `src/components.js` only for components whose manifest entry has `requiresJs: true`. The root `core-ui.css` remains a temporary legacy reference; it is not extended with new APIs.

## Known consumers

The 2026-08-14 review found three consumers in `miloszkolber/core`. All mount `/repo/ui_library` read-only at `/ui` and still load `/ui/core-ui.css`:

| Service | Current entry points | Migration-specific boundary |
| --- | --- | --- |
| `docker/hf_ui` | `assets/index.html` | Framed workspace, status rows, tabs, and service-local CSS still use legacy structure. |
| `docker/moonlight_ui` | `assets/index.html` | Framed workspace and deployment status rows still use legacy structure. |
| `docker/meili_ui` | `assets/index/index.html`, `assets/duplicates/index.html` | Two pages use legacy route tabs and stats; the Go server explicitly serves `/ui/core-ui.css` and must allow the canonical assets. |

The service repositories were inspected but not changed by this library review.

## Asset switch

Replace the legacy stylesheet with the canonical order:

```html
<link rel="stylesheet" href="/ui/src/base.css">
<link rel="stylesheet" href="/ui/src/mewa.css">
<script src="/ui/src/components.js" defer></script>
```

Omit the script when every copied component has `requiresJs: false`. Static routing must permit the two stylesheets, `components.js` when used, `geist.woff2`, `geistmono.woff2`, and `lucide.svg`. Meili's explicit Go route is therefore part of its migration, not only its HTML.

Do not load `core-ui.css` and `src/mewa.css` together as a long-term compatibility layer. Their similarly named selectors describe different generations of markup and would make state ownership ambiguous.

## Structural replacements

| Legacy service pattern | Canonical direction |
| --- | --- |
| `.ui-framed-app`, `.ui-framed-workspace`, `.ui-framed-region`, `.ui-framed-panel` | Start from the closest file in `layouts/`; compose `.ui-shell`, navigation, workspace, content, and utility regions. |
| `.ui-tabs` and `.ui-tab` used for page navigation | Use Horizontal or Vertical Navbar links with `aria-current="page"`; links that navigate are not ARIA tabs. |
| `.ui-tabs` and `.ui-tab` used for in-page panel switching | Copy the Tabs snippet and preserve its tablist, tab, tabpanel, ids, and runtime hooks. |
| `.ui-row`, `.ui-status-row`, `.ui-status-indicator`, `.ui-status-icon-*` | Use non-interactive `.ui-item.ui-item--operation` rows with visible status text, `data-state`, optional `.ui-marker`, and independent actions. |
| `.ui-stats`, `.ui-stat`, `.ui-stat-label`, `.ui-stat-value` | Use the semantic Stat `<dl>` structure: `.ui-stat-grid` and `.ui-stat-card`. |
| Ad-hoc diagnostic/log containers | Use the labelled, focusable `.ui-scroll-area--output` pattern. |
| Ad-hoc key/value detail rows | Use `.ui-description-list`. |
| `--ui-border-hover` | Use `--ui-border-strong` for borders or `--ui-surface-hover` for hover surfaces. |
| Service-local monospace stacks | Use `--ui-font-mono`; technical output and `.ui-kbd` already consume Geist Mono. |

Keep service-specific layout and product logic in each service stylesheet and script. Copy component markup from the marked snippet fragment; do not recreate legacy aliases in `mewa_ui`.

## Recommended order

1. Migrate `moonlight_ui`: its status-oriented surface maps most directly to the operations Item and Description List patterns.
2. Migrate `hf_ui`: preserve download behavior while replacing the framed split and status/list presentation.
3. Migrate both `meili_ui` pages together: update the Go asset allowlist, replace route tabs with navigation links, and replace legacy stats consistently.

For each service, verify native submission and navigation before adding runtime enhancement. Then test pointer, keyboard, 200% zoom, reduced motion, forced colors, 390 px and 320 px widths, plus the service's existing functional checks. Remove the `/ui/core-ui.css` route only after every consumer has switched.
