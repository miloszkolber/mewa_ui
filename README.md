# mewa_ui

mewa_ui is a small, framework-free interface library for utility applications. It combines semantic HTML, tokenized CSS, local SVG icons, and focused JavaScript modules without adding a production build step.

The library grew out of a practical need: several compact tools should feel like parts of the same product without sharing a framework or copying whole pages between repositories.

## Character

mewa_ui is technical, quiet, and dense. Square geometry, monochrome surfaces, structural borders, and restrained type keep attention on the work. Color is reserved for status and destructive meaning. Motion is absent except where it communicates ongoing activity.

The system favors a continuous working surface over stacks of decorative containers. Tables stay tables. Connected rows share one outer boundary. Cards are used for independent objects, not as a default wrapper for every section.

## What is included

The repository contains 59 components, from basic controls and form fields to data tables, dialogs, navigation, and application shell primitives. Each component has:

- a precise implementation contract;
- its own stylesheet;
- a small ES module when behavior needs JavaScript;
- a static reference page that shows the component in context.

Browse the examples in [`docs/`](docs/). The complete machine-readable inventory lives in [`registry.json`](registry.json).

## Using the library

Load the foundations before component styles:

```html
<link rel="stylesheet" href="/ui/library/src/base.css">
<link rel="stylesheet" href="/ui/library/src/tokens.css">
<link rel="stylesheet" href="/ui/library/components/button/button.css">
```

Add a component module only when its registry entry marks JavaScript as required or optional:

```html
<script type="module" src="/ui/library/components/dialog/dialog.js"></script>
```

The CSS and JavaScript are shipped directly. There is no compilation step and no runtime dependency.

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

### Sources and metadata

```text
mewa_ui/
├── library/
│   ├── DESIGN.md               canonical design instructions
│   ├── components/             component contracts and implementations
│   ├── src/                    foundations, fonts, and local icons
│   └── system/                 selection and composition instructions
├── docs/                       static reference pages
├── registry.json               component, asset, and token metadata
├── README.md                   human overview
├── AGENTS.md                   maintainer instructions
├── PROMPT.md                   application review prompt
└── llms.txt                    machine routing index
```

## Design approach

mewa_ui starts with the browser. Links navigate, buttons act, native controls keep their semantics, and ARIA fills real gaps instead of replacing HTML. JavaScript enhances that base and stays local to the component that needs it.

Application shells are compositions rather than templates. App Shell, Sidebar, Layout, navigation components, and native landmarks provide the pieces; each product keeps ownership of its routes and page-specific composition.

Accessibility is part of the component contract. Keyboard behavior, focus, contrast, zoom, reduced motion, forced colors, and no-JavaScript behavior are documented where they apply.

## Development

Install the single development dependency and run the contract suites:

```sh
npm install
npm test
```

When Chromium is available, run the documentation smoke test as well:

```sh
npm run test:browser
```

The catalog check verifies that generated references still match [`registry.json`](registry.json):

```sh
npm run catalog:check
```

## License

mewa_ui is available under the [MIT License](LICENSE).
