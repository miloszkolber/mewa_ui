# Runtime integration

Use generated release files in consumers. Source component imports automatically register their behavior; generated `components/` imports are side-effect-free.

## Vanilla HTML

Extract the core release archive to `/vendor/mewa-ui`. Serve the page over HTTP.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Toggle example</title>
  <link rel="stylesheet" href="/vendor/mewa-ui/css/base.css">
  <link rel="stylesheet" href="/vendor/mewa-ui/css/tokens.css">
  <link rel="stylesheet" href="/vendor/mewa-ui/css/toggle.css">
  <script type="module" src="/vendor/mewa-ui/auto/toggle.js"></script>
</head>
<body>
  <button class="toggle" type="button" aria-pressed="false">Pin</button>
</body>
</html>
```

Automatic enhancement observes additions and removals. Moving a node inside the observed root preserves its instance and resources. Each behavior has its own initialization marker. A module may also expose the legacy shared `data-init` readiness flag for compatibility; never author either marker.

## Application lifecycle

```js
import { createController } from '/vendor/mewa-ui/index.js';
import { behavior } from '/vendor/mewa-ui/components/tabs.js';

const region = document.querySelector('[data-settings]');
const controller = createController(behavior, region);
controller.update();
// Before removing the region:
controller.destroy();
```

`components/` entries include declared behavior dependencies. `controllers/` entries expose only the named behavior. CSS component entries are flat bundles in declared style-dependency order. Fonts and icons remain separate.

Use one component CSS entry for a small feature. Use `css/all.css` when many components share a page, because flat entries intentionally repeat shared dependency styles across separate responses.

Controllers are idempotent on destroy. Dependency compositions release resources in reverse order, attempt all cleanup hooks, and roll back partial initial setup. Controllers on the same behavior and root share a lease.

Choose one lifecycle owner per region. Do not combine automatic enhancement with explicit controllers on overlapping roots. Document-wide shortcuts and theme listeners are shared for the document lifetime. Dispose document-level controllers only when the document integration is ending.

`update()` repeats enhancement; it is not a virtual DOM renderer. Tabs and combobox option lookup read current children. Updates also refresh table rows, checkbox groups, toolbar focus, command items, sortable items, tree branches, and color fields. For replacement of a component's structural input, viewport, or list, destroy the old instance and mount the replacement. Preserve application values in application state.

Native `input` and `change` events carry form changes. Custom events are documented in each component contract. Programmatic assignments to DOM properties do not emit events automatically.

## Browser capabilities

Use browsers with native dialog, Popover API, CSS nesting, and modern color syntax for full interactive behavior. Tooltip and Hover Card include positioning fallbacks where CSS anchor positioning is unavailable. Other anchored surfaces require testing in the consumer's supported browsers. Reduced motion and forced colors have dedicated CSS rules.

The automated browser suite supports installed Chromium and Firefox binaries. The separate Safari WebDriver suite covers native runtime behavior and documentation rendering. Browser automation does not establish screen-reader conformance. Check the native fallback and the component's accessibility contract before shipping a consumer.
