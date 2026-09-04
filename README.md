# mewa_ui

mewa_ui is a small, framework-neutral interface library for utility applications. It combines semantic HTML, tokenized CSS, local SVG icons, and focused native JavaScript controllers.

The library grew out of a practical need: several compact tools should feel like parts of the same product without requiring the same framework or copying whole pages between repositories.

## Character

mewa_ui is technical, quiet, and dense. Square geometry, monochrome surfaces, structural borders, and restrained type keep attention on the work. Color is reserved for status and destructive meaning. Subtle, fast motion clarifies control states, modal surfaces, shell changes, and ongoing activity.

The system favors a continuous working surface over stacks of decorative containers. Tables stay tables. Connected rows share one outer boundary. Cards are used for independent objects, not as a default wrapper for every section.

## What is included

The repository contains 80 components, from basic controls and form fields to data tables, dialogs, navigation, application shell primitives, and AI response surfaces. Each component has:

- a precise implementation contract;
- its own stylesheet;
- a small ES module when behavior needs JavaScript;
- a static reference page that shows the component in context.

Browse the examples in [`docs/`](docs/). The complete machine-readable inventory lives in [`registry.json`](registry.json).

## Get a release from GitHub

Each tagged [GitHub release](https://github.com/miloszkolber/mewa_ui/releases) provides two ready-to-host archives:

- `mewa-ui-<version>.tar.gz` contains foundations, per-component CSS, native controllers, automatic enhancers, types, and the package manifest.
- `mewa-icons-<version>.tar.gz` contains the complete SVG icon set as a separate, optional download.

Download and extract only the archive that the application needs. The release files are ordinary web assets; an application does not need npm or a framework to use them.

For plain HTML, load the foundations and one dependency-aware component stylesheet:

```html
<link rel="stylesheet" href="/vendor/mewa-ui/css/base.css">
<link rel="stylesheet" href="/vendor/mewa-ui/css/tokens.css">
<link rel="stylesheet" href="/vendor/mewa-ui/css/dialog.css">
<script type="module" src="/vendor/mewa-ui/auto/dialog.js"></script>
```

Fonts are opt-in. Load `fonts/geist-sans.css` or `fonts/geist-mono.css` when the application does not already provide suitable typefaces.

For an application with its own lifecycle, import a side-effect-free controller and enhance only the mounted region:

```js
import { behavior } from "/vendor/mewa-ui/components/dialog.js";
import { createController } from "/vendor/mewa-ui/index.js";

const dialogRegion = document.querySelector("[data-settings-region]");
const dialogController = createController(behavior, dialogRegion);

// Call this when the application unmounts the region.
dialogController.destroy();
```

This controller API works with plain JavaScript and can sit behind a framework adapter. The `components/` entries compose the behavior dependencies declared in the manifest; the lower-level `controllers/` entries expose only one component's own behavior.

Call `destroy()` before a framework unmounts the region. It runs every cleanup hook the composed behaviors provide. Behaviors without a cleanup hook use element-owned listeners that become collectible only after the application releases all references to those elements.

Document-level adapters are installed once and remain shared for the document lifetime. The core package has no runtime dependency and does not impose a framework lifecycle.

Use `css/all.css` and `auto.js` for a quick prototype that needs the complete library. Production applications should load only their component entries.

## Repository guide

The repository keeps description separate from instruction.

### For people

- [`README.md`](README.md) describes the library and its structure.
- [`docs/`](docs/) contains browsable component examples.
- Component pages show the supported result without defining a second API.

### For agents and maintainers

- [`AGENTS.md`](AGENTS.md) defines the maintenance workflow.
- [`library/DESIGN.md`](library/DESIGN.md) is the canonical design contract.
- [`library/system/`](library/system/) covers foundations, selection, patterns, shells, and accessibility.
- `library/components/{slug}/{slug}.md` gives exact implementation instructions for one component.
- [`PROMPT.md`](PROMPT.md) starts an application compliance review.
- [`llms.txt`](llms.txt) is the compact machine router.

### Sources and generated output

```text
mewa_ui/
├── library/
│   ├── DESIGN.md               canonical design instructions
│   ├── components/             authored component contracts and implementations
│   ├── runtime/                shared controller and enhancement lifecycle
│   ├── src/                    foundations, fonts, and local icons
│   └── system/                 selection and composition instructions
├── docs/                       static reference pages
├── scripts/                    reproducible catalog and distribution builders
├── dist/                       ignored, generated release packages
├── registry.json               component, dependency, asset, and token metadata
├── README.md                   human overview
├── AGENTS.md                   maintainer instructions
├── PROMPT.md                   application review prompt
└── llms.txt                    machine routing index
```

`library/` is the only authored implementation tree. The build generates `dist/` from that source and never modifies the source files.

## Design approach

mewa_ui starts with the browser. Links navigate, buttons act, native controls keep their semantics, and ARIA fills real gaps instead of replacing HTML. JavaScript enhances that base and stays scoped to the component that needs it.

Application shells are compositions rather than templates. App Shell, Sidebar, Layout, navigation components, and native landmarks provide the pieces; each product keeps ownership of its routes and page-specific composition.

Accessibility is part of the component contract. Keyboard behavior, focus, contrast, zoom, reduced motion, forced colors, and no-JavaScript behavior are documented where they apply.

## Development

Node.js 24 or later is the only required build runtime. Build and verify the release packages without installing dependencies:

```sh
node --run build
node --run test
```

The generated archives are published only through GitHub Releases. The workspace and both generated packages are marked private so an accidental npm publication is rejected.

The browser smoke suite is the one development check that needs an installed tool. Install the locked Puppeteer dependency and run it when Chromium is available:

```sh
npm ci
node --run test:browser
```

npm is therefore a development convenience for the browser test, not a distribution channel or a runtime requirement.

## License

mewa_ui's authored code and documentation are available under the [MIT License](LICENSE).

Bundled Geist font files use the [SIL Open Font License 1.1](library/src/licenses/GEIST-OFL.txt). Lucide icons and derived Feather icons retain their [upstream ISC and MIT notices](library/src/licenses/LUCIDE-LICENSE.txt). The generated GitHub archives include the applicable notices.
