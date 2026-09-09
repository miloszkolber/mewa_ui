# mewa_ui

mewa_ui is a small, framework-neutral interface library for utility applications. It combines semantic HTML, tokenized CSS, local SVG icons, and focused native JavaScript controllers.

## Character

mewa_ui is technical, quiet, and dense. Square geometry, monochrome surfaces, structural borders, and restrained type keep attention on the work. Color is reserved for status and destructive meaning. Subtle, fast motion clarifies control states, modal surfaces, shell changes, and ongoing activity.

The system favors a continuous working surface over stacks of decorative containers. Tables stay tables. Connected rows share one outer boundary. Cards are used for independent objects, not as a default wrapper for every section.

## What is included

The repository contains 80 components, from basic controls and form fields to data tables, dialogs, navigation, application shell primitives, and AI response surfaces. Each component has:

- a precise implementation contract;
- its own stylesheet;
- a small ES module when behavior needs JavaScript;
   - an anchored section in the shared component preview.

Browse the single [component preview](docs/preview.html). It contains every component, provides scroll anchors in the left navigation, and switches between light and dark themes without duplicating documentation pages. The complete machine-readable inventory lives in [`registry.json`](registry.json).

## Get a release from GitHub

Each tagged [GitHub release](https://github.com/miloszkolber/mewa_ui/releases) provides three ready-to-host archives:

- `mewa-ui-<version>.tar.gz` contains foundations, per-component CSS, native controllers, automatic enhancers, types, and the package manifest.
- `mewa-icons-<version>.tar.gz` contains optional Remix Icon line and fill assets for mewa_ui integrations.
- `mewa-svelte-<version>.tar.gz` contains the optional Svelte 5 lifecycle attachment and Bun compiler plugin.

Download and extract only the archive that the application needs. The release files are ordinary web assets; an application does not need npm or a framework to use them.

For plain HTML, load the foundations and one flat, dependency-aware component stylesheet:

```html
<link rel="stylesheet" href="/vendor/mewa-ui/css/base.css">
<link rel="stylesheet" href="/vendor/mewa-ui/css/tokens.css">
<link rel="stylesheet" href="/vendor/mewa-ui/css/dialog.css">
<script type="module" src="/vendor/mewa-ui/auto/dialog.js"></script>
```

Each component entry already contains its declared style dependencies, so an isolated feature remains one component stylesheet request. When a page uses many components, prefer `css/all.css` so shared styles are transferred once.

Fonts are opt-in. Load `fonts/google-sans-code.css` when the application does not already provide Google Sans Code.

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

Call `destroy()` before unmounting the region. Choose one lifecycle owner per region. See the [runtime guide](library/runtime/README.md) for ownership, dynamic markup, native forms, and browser capabilities.

Use `css/all.css` and `auto.js` for a quick prototype or a broad application surface. For a small feature, load only its flat component entry and matching automatic/controller entry.

## Use Mewa UI with Svelte

The optional `mewa-svelte` package provides a Svelte 5.29+ attachment and a Bun compiler plugin for components and rune modules. The [Svelte guide](library/adapters/svelte/README.md) includes a complete component example, build setup, and state ownership rules.

## Repository guide

The repository keeps description separate from instruction.

### For people

- [`README.md`](README.md) describes the library and its structure.
- [`docs/preview.html`](docs/preview.html) contains the complete browsable component reference.
- The preview shows supported results without defining a second API.

### For agents and maintainers

- [`AGENTS.md`](AGENTS.md) defines the maintenance workflow.
- [`library/DESIGN.md`](library/DESIGN.md) is the canonical design contract.
- [`library/system/`](library/system/) covers foundations, selection, patterns, shells, and accessibility.
- `library/components/{slug}/{slug}.md` gives exact implementation instructions for one component.
- [`llms.txt`](llms.txt) is the compact machine router.

### Sources and generated output

```text
mewa_ui/
├── library/
│   ├── DESIGN.md               canonical design instructions
│   ├── adapters/               optional framework integration sources
│   ├── components/             authored component contracts and implementations
│   ├── runtime/                shared controller and enhancement lifecycle
│   ├── src/                    foundations, fonts, and local icons
│   └── system/                 selection and composition instructions
├── docs/                       single component preview and its assets
├── scripts/                    reproducible catalog and distribution builders
├── dist/                       ignored, generated release packages
├── registry.json               component, dependency, asset, and token metadata
├── README.md                   human overview
├── AGENTS.md                   maintainer instructions
└── llms.txt                    machine routing index
```

`library/` is the only authored implementation tree. The build generates `dist/` from that source and never modifies the source files.

## Design approach

mewa_ui starts with the browser. Links navigate, buttons act, native controls keep their semantics, and ARIA fills real gaps instead of replacing HTML. JavaScript enhances that base and stays scoped to the component that needs it.

Application shells are compositions rather than templates. App Shell, Sidebar, Layout, navigation components, and native landmarks provide the pieces; each product keeps ownership of its routes and page-specific composition.

Accessibility is part of the component contract. Keyboard behavior, focus, contrast, zoom, reduced motion, forced colors, and no-JavaScript behavior are documented where they apply.

## Development

Bun 1.4 is the repository's only JavaScript toolchain. Install the locked development dependencies, then build and verify all three release packages:

```sh
bun install --frozen-lockfile
bun run build
bun run check
```

The generated archives are published only through GitHub Releases. The workspace and all generated packages are marked private so an accidental package-registry publication is rejected.

Run the browser and isolated consumer suites when Chromium is available. Set `PUPPETEER_EXECUTABLE_PATH` for a custom installation. The consumer suite installs pinned Svelte versions in temporary directories:

```sh
bun run test:browser
bun run test:consumer
bun run test:performance
bun run measure
```

If the local Bun runtime cannot bind an ephemeral port, provide a free fixed
port for the browser gate; all browser harness servers honor this override:

```sh
MEWA_UI_PORT=41880 bun run test:browser
```

Set `MEWA_BROWSER=firefox` and `PUPPETEER_EXECUTABLE_PATH` to run the browser suite in Firefox. Firefox's tested automation protocol does not support forced-colors emulation or disabling JavaScript; those cases run in Chromium.

For Safari, enable remote automation in Safari Settings, start `safaridriver -p 4447`, and run `bun run test:safari`. The Safari report records the actual viewport widths. Set `SAFARI_WEBDRIVER_URL` to use another local driver port. Screen-reader acceptance remains a separate manual check.

The source repository uses no Node, npm, Vite, or SvelteKit tooling. Consumers of `mewa-ui` need no package manager. Consumers of `mewa-svelte` can use the GitHub archive with their existing Svelte 5 application.

## License

mewa_ui's authored code and documentation are available under the [MIT License](LICENSE).

Bundled Google Sans Code uses the [SIL Open Font License 1.1](library/src/licenses/GOOGLE-SANS-CODE-OFL.txt). Optional Remix Icon assets use the [upstream Remix Icon license](library/src/licenses/REMIX-ICON-LICENSE.txt). The generated GitHub archives include the applicable notices.
