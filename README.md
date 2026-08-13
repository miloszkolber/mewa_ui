# Core UI library

Core UI is a framework-agnostic, copy-ready catalog for Core service frontends. It is static HTML, CSS, and optional JavaScript with no framework or frontend build step.

## Canonical assets

The architecture has exactly two canonical CSS files: `/ui/src/base.css` for tokens, reset, typography, layout primitives, and shared foundations, and `/ui/src/components.css` for component selectors and states. The other canonical assets are `/ui/src/components.js` for progressive enhancement and `/ui/src/lucide.svg` for the local icon sprite.

The root `core-ui.css` is legacy-only for existing services. Root `core-ui-components.css`, root `core-ui.js`, and root `lucide.svg` are removed by this architecture. New snippets and services must use the `src/` assets and must not add another stylesheet layer.

`catalog/index.html` is the searchable catalog, `catalog/components.json` is its manifest, and `snippets/` contains the 64 copy-ready fragments. Each snippet is delimited by `<!-- core-ui-snippet:start -->` and `<!-- core-ui-snippet:end -->`.

## Serving

Mount `/repo/ui_library` read-only at `/ui` in Compose. The deployment Compose and Nginx files remain in the parent Core repository. The catalog is then available at `http://localhost:<published-port>/ui/catalog/`, and a consumer references `/ui/src/base.css`, `/ui/src/components.css`, `/ui/src/components.js`, and `/ui/src/lucide.svg`.

For a quick local catalog server, run `python3 -m http.server 8080 --directory /repo/ui_library` and open `http://localhost:8080/catalog/`. For a Compose consumer, use the relevant deployment file from the parent Core repository, then use that service's published URL with the `/ui/catalog/` path.

## Usage principles

- Start with semantic HTML and native controls. JavaScript is progressive enhancement.
- Use `data-ui-*` hooks for behavior and styling, and reserve `data-state` for `ok`, `warning`, `error`, `running`, and `progress`.
- Use 10-step scales and semantic role mapping from `src/base.css`; do not introduce service-specific palette values.
- Use square geometry. Do not use shadows or blur except for approved overlays.
- Preserve visible focus, keyboard behavior, reduced motion, live-region semantics, and mobile contracts.

Every Lucide icon used by a snippet or service must first be added as a symbol to `src/lucide.svg`. Reference it with a same-origin `<use href="/ui/src/lucide.svg#name">`; icon-only controls require an accessible name.

## Contribution and validation

Add shared tokens or behavior only when they belong to the catalog or serve multiple consumers. Update the manifest and its marked snippet together. Keep selectors composable and IDs out of styling.

From `/repo/ui_library`, run `node tests/catalog-contract.test.js` and `node tests/runtime-contract.test.js` (Bun may run either command). These checks cover catalog parity, asset references, accessibility hooks, state vocabulary, and runtime behavior. They are not real-browser or assistive-technology validation. When available, run `node tests/browser-smoke.mjs` with `CORE_UI_BASE_URL` and `CORE_UI_BROWSER_URL` configured.
