# Core UI

Core UI is a framework-agnostic, copy-ready implementation of the current official shadcn component catalog for Core's small service frontends. It is static HTML, CSS, and optional JavaScript. There is no framework or frontend build step.

`core-ui.css` is the compatibility foundation for existing Core services. Load `core-ui-components.css` after it for the expanded component layer, and load `core-ui.js` only when progressive enhancement is needed. See `DESIGN.md` for the design, accessibility, state, and contribution contract.

## Files and catalog

- `/ui/core-ui.css` provides the compatibility tokens and shared Core primitives.
- `/ui/core-ui-components.css` provides the expanded shadcn-style component selectors and tokens.
- `/ui/core-ui.js` is optional. `CoreUI.enhance(root)` wires dynamic markup and `CoreUI.destroy(root)` removes its listeners and observers.
- `catalog/index.html` is the searchable catalog. It loads component previews and source from `/ui/snippets/`.
- `catalog/components.json` is the component manifest and source of truth for the catalog.
- `snippets/` contains 64 copy-ready standalone HTML snippets matching the 64 current official components. Each source fragment is delimited by `<!-- core-ui-snippet:start -->` and `<!-- core-ui-snippet:end -->` markers.
- `lucide.svg` is the local Lucide sprite.

The catalog contains the 64 components in the live official `/docs/components` base-link list, fetched 2026-08-13. This catalog can evolve as the official list changes. Use the searchable catalog rather than copying preview-shell markup.

## Principles

- Prefer native-first HTML semantics and native controls. Add enhancement only where interaction requires it.
- Use `data-ui-*` hooks for component behavior and styling hooks. Reserve `data-state` for status only. Status values are `ok`, `warning`, `error`, `running`, and `progress`.
- Preserve visible focus, keyboard navigation, reduced motion, live-region semantics, and mobile layouts.
- Use tokenized simple typography and a 4px spacing scale. The expanded layer uses square-ish radii, no visual shadows, and blur only on approved overlays.
- Use semantic monochrome surfaces and semantic status colors. Do not introduce per-service palette values.

## Serving and consumers

Mount `/home/core/docker/ui_library` read-only at `/ui` and serve the library under the `/ui/` prefix. A copied fragment requires `/ui/core-ui.css` followed by `/ui/core-ui-components.css`; include `/ui/core-ui.js` only when using dynamic enhancement.

The requested five consumers are `homelab_ui`, `hf_ui`, `moonlight_ui`, `meili_ui`, and `rss`, with `meili_ui` as the reference implementation. `subtitles` also mounts this library and is a consumer. Service-specific branding belongs with the consuming service.

## Icons

Use same-origin Lucide sprite links such as `<svg aria-hidden="true"><use href="/ui/lucide.svg#search" /></svg>`. Icon-only controls need an accessible name. Keep product marks and media fallback illustrations with the consuming service.

## Checks

From `/home/core/docker/ui_library`, run `bun tests/catalog-contract.test.js` or `node tests/catalog-contract.test.js` for the catalog contract, and `bun tests/runtime-contract.test.js` or `node tests/runtime-contract.test.js` for the runtime harness. These are static and DOM-harness checks, not real browser or assistive-technology validation. For a native Node syntax check without a local Node install, run `docker run --rm -v "$PWD:/work" -w /work node:alpine node --check core-ui.js`.

`tests/browser-smoke.mjs` provides an optional real-browser check for every standalone snippet plus representative interactions. It expects `puppeteer-core`, a static server exposing this directory at `/ui`, and a Chromium DevTools endpoint. Configure those endpoints with `CORE_UI_BASE_URL` and `CORE_UI_BROWSER_URL`.
