# Runtime integration

Use generated release files in consumers. In a source checkout only, source component imports automatically register their behavior; generated `components/` imports are side-effect-free.

## Resolve package entries

Use the selected `components/{slug}.json` record's `component` object or the matching `manifest.json` entry for executable paths and dependencies.

Read its `contractLocal` Markdown before writing markup. The local contract matches the packaged build even when the optional remote `contract` URL is null.

Load `foundations.base` before `foundations.tokens`, then the selected `css` entry. Use `component` for application-owned controllers or `auto` for plain HTML; do not load both for the same region.

`library/...` paths in the core archive are read-only Markdown contracts, not executable source paths. Fonts are opt-in; SVG assets come from the separate optional `mewa-icons` archive.

Old archives without local contracts require a matching source checkout or their immutable `contract` URL when available.

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

Automatic enhancement observes additions and removals. Moving a node inside the observed root preserves its instance and resources. Each behavior has its own initialization marker. A module may also expose the legacy shared `data-init` readiness flag for compatibility; never author either marker or use it to exclude another behavior.

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

Controller destruction releases lifecycle generations acquired inside its root, including children removed before destruction. `update()` also acquires newly enhanced children. Transfer a component to another lifecycle owner by destroying its old owner and remounting it; a DOM move alone does not transfer a controller lease.

Choose one lifecycle owner per region. Do not combine automatic enhancement with explicit controllers on overlapping roots. Document-wide shortcuts and theme listeners are shared for the document lifetime. Dispose document-level controllers only when the document integration is ending.

`update()` repeats enhancement; it is not a virtual DOM renderer. Tabs and combobox option lookup read current children. Updates also refresh table rows, checkbox groups, toolbar focus, command items, sortable items, tree branches, and color fields. For replacement of a component's structural input, viewport, or list, destroy the old instance and mount the replacement. Preserve application values in application state.

Native `input` and `change` events carry form changes. Custom events are documented in each component contract. Programmatic assignments to DOM properties do not emit events automatically.

Form-reset synchronization runs in a task after the native default action. A canceled reset does not change enhanced state. Destroy cancels pending reset synchronization.

When retaining values across form removal, settle every pending native reset before taking the snapshot and destroying the owner.

Read the final reset cancellation outcome and actual control properties.

Do not retain a pre-reset draft after an uncanceled reset.

Do not restore defaults after a canceled reset.

Preserve native validation, submission, navigation, and composition behavior. The application owns submitted values and result handling; enhancement must not replace that ownership.

## Browser capabilities

Use browsers with native dialog, Popover API, CSS nesting, and modern color syntax for full interactive behavior. Tooltip and Hover Card include positioning fallbacks where CSS anchor positioning is unavailable. Other anchored surfaces require testing in the consumer's supported browsers. Reduced motion and forced colors have dedicated CSS rules.

The automated browser suite supports installed Chromium and Firefox binaries. The separate Safari WebDriver suite covers native runtime behavior and documentation rendering. Browser automation does not establish screen-reader conformance. Check the native fallback and the component's accessibility contract before shipping a consumer.
