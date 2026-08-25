# mewa_ui

mewa_ui is a framework-free UI library for semantic utility applications.

The library uses semantic HTML, tokenized CSS, local SVG icons, and small native-first ES modules.

The library has no production build step.

The visual system uses square geometry, monochrome surfaces, structural borders, compact density, and soft blur on top-level sticky chrome.

The library includes 59 self-contained component folders and 59 static component pages.

## Read the system

Read the files in this order.

1. Read [`DESIGN.md`](DESIGN.md) for the mandatory contract.
2. Read [`system/foundations.md`](system/foundations.md) for visual rules.
3. Read [`system/components.md`](system/components.md) for component selection.
4. Read the matching component skill for exact markup.
5. Read [`system/patterns.md`](system/patterns.md) for page composition.
6. Read [`system/layouts.md`](system/layouts.md) for shell composition.
7. Read [`system/accessibility.md`](system/accessibility.md) for acceptance rules.
8. Read [`registry.json`](registry.json) for machine-readable assets.

Do not infer an API from another library.

Do not invent undocumented classes, attributes, variants, events, or tokens.

## Repository map

```text
mewa_ui/
├── src/                         foundations, fonts, and local icons
├── components/                  exact component contracts and implementations
├── docs/                        one static reference page per component
├── system/                      agent-facing selection and composition rules
├── layouts/                     complete serveable reference compositions
├── registry.json                machine-readable component inventory
├── DESIGN.md                    canonical design contract
├── llms.txt                     concise machine router
└── AGENTS.md                    maintainer workflow
```

`components/{slug}/{slug}.md` defines exact markup and accessibility behavior.

`components/{slug}/{slug}.css` defines component appearance.

`components/{slug}/{slug}.js` defines required or optional enhancement behavior.

`docs/{slug}.html` demonstrates the component.

The documentation page does not define a second API.

## Consume the library

Load the foundations before component styles.

```html
<link rel="stylesheet" href="/ui/src/base.css">
<link rel="stylesheet" href="/ui/src/tokens.css">
<link rel="stylesheet" href="/ui/components/button/button.css">
```

Load a component module only when the registry marks it as required or optional.

```html
<script type="module" src="/ui/components/dialog/dialog.js"></script>
```

Inline local SVG files for the complete no-JavaScript icon path.

Never load a remote icon CDN.

Use links for navigation.

Use buttons for actions.

Preserve labels, IDs, native constraints, accessible names, and ARIA relationships.

## Visual contract

Use square geometry by default.

Use circles only when the object has circular meaning.

Use semantic borders instead of shadows.

Do not add decorative gradients.

Use soft blur only on top-level sticky chrome.

Keep the canonical source motionless.

Spinner rotation is the only motion exception.

Use one outer section border around dense rows.

Do not put a card inside another card.

Do not wrap a table in a card.

Use red, amber, and green only for status and destructive meaning.

## Application shells

The repository has two shell families.

The sidebar family uses Sidebar with utility application content.

The top-navigation family uses a semantic header and route links.

The repository keeps three reference files.

- [`layouts/vertical-navbar.html`](layouts/vertical-navbar.html) shows the utility sidebar reference.
- [`layouts/horizontal-navbar.html`](layouts/horizontal-navbar.html) shows the top-navigation reference.
- [`layouts/app-shell-sidebar.html`](layouts/app-shell-sidebar.html) shows a branded sidebar composition.

The three files do not define three shell families.

App Shell supplies reusable shell regions.

Sidebar supplies collapsible navigation behavior.

`layouts/` supplies complete page compositions.

## Component inventory

The inventory mirrors `registry.json`.

`None` means the component has no module.

`Optional` means native markup works without the documented enhancement.

`Required` means the documented interaction needs the module.

### Primitives

| Component | Purpose | Runtime | Contract and demo |
| --- | --- | --- | --- |
| Typography | Formats document text, code, quotations, keyboard notation, and lists. | None | [`components/typography/typography.md`](components/typography/typography.md) · [`docs/typography.html`](docs/typography.html) |
| Layout | Creates intrinsic containers, stacks, grids, sidebar splits, centering, and opposite-end groups. | None | [`components/layout/layout.md`](components/layout/layout.md) · [`docs/layout.html`](docs/layout.html) |
| Separator | Marks a real visual or semantic division. | None | [`components/separator/separator.md`](components/separator/separator.md) · [`docs/separator.html`](docs/separator.html) |
| Icon | Presents a local Lucide glyph inside text or a control. | None | [`components/icon/icon.md`](components/icon/icon.md) · [`docs/icon.html`](docs/icon.html) |

### Actions

| Component | Purpose | Runtime | Contract and demo |
| --- | --- | --- | --- |
| Button | Starts an action, submits a form, or styles a navigation link as a button. | None | [`components/button/button.md`](components/button/button.md) · [`docs/button.html`](docs/button.html) |
| Toggle | Changes one independent pressed state. | Required | [`components/toggle/toggle.md`](components/toggle/toggle.md) · [`docs/toggle.html`](docs/toggle.html) |
| Toggle Group | Coordinates a set of related pressed buttons. | Required | [`components/toggle-group/toggle-group.md`](components/toggle-group/toggle-group.md) · [`docs/toggle-group.html`](docs/toggle-group.html) |
| Button Group | Connects related buttons into one visual control group. | None | [`components/button-group/button-group.md`](components/button-group/button-group.md) · [`docs/button-group.html`](docs/button-group.html) |
| Toolbar | Groups frequently used controls with managed arrow-key navigation. | Required | [`components/toolbar/toolbar.md`](components/toolbar/toolbar.md) · [`docs/toolbar.html`](docs/toolbar.html) |

### Forms and inputs

| Component | Purpose | Runtime | Contract and demo |
| --- | --- | --- | --- |
| Label | Names one native form control. | None | [`components/label/label.md`](components/label/label.md) · [`docs/label.html`](docs/label.html) |
| Field | Composes a label, native control, help text, error text, and related fieldsets. | None | [`components/field/field.md`](components/field/field.md) · [`docs/field.html`](docs/field.html) |
| Text Field | Collects one line of text with labels, descriptions, icons, and validation. | None | [`components/text-field/text-field.md`](components/text-field/text-field.md) · [`docs/text-field.html`](docs/text-field.html) |
| Textarea | Collects multi-line text. | None | [`components/textarea/textarea.md`](components/textarea/textarea.md) · [`docs/textarea.html`](docs/textarea.html) |
| Checkbox | Selects one independent option or several independent options. | Optional | [`components/checkbox/checkbox.md`](components/checkbox/checkbox.md) · [`docs/checkbox.html`](docs/checkbox.html) |
| Radio Group | Selects one value from a visible set. | None | [`components/radio-group/radio-group.md`](components/radio-group/radio-group.md) · [`docs/radio-group.html`](docs/radio-group.html) |
| Switch | Changes an immediate binary system state. | None | [`components/switch/switch.md`](components/switch/switch.md) · [`docs/switch.html`](docs/switch.html) |
| Slider | Selects a value from a continuous or stepped numeric range. | Required | [`components/slider/slider.md`](components/slider/slider.md) · [`docs/slider.html`](docs/slider.html) |
| Select | Selects one or several values from a fixed native option list. | None | [`components/select/select.md`](components/select/select.md) · [`docs/select.html`](docs/select.html) |
| Number Field | Collects a numeric value with explicit increment and decrement controls. | Required | [`components/number-field/number-field.md`](components/number-field/number-field.md) · [`docs/number-field.html`](docs/number-field.html) |
| File Input | Opens the native file picker. | None | [`components/file-input/file-input.md`](components/file-input/file-input.md) · [`docs/file-input.html`](docs/file-input.html) |
| Date Field | Collects a date or local date and time with the browser control. | None | [`components/date-field/date-field.md`](components/date-field/date-field.md) · [`docs/date-field.html`](docs/date-field.html) |
| Date Picker | Selects a date from a custom accessible month grid. | Required | [`components/date-picker/date-picker.md`](components/date-picker/date-picker.md) · [`docs/date-picker.html`](docs/date-picker.html) |
| Date Range Picker | Collects a start date and an end date with native inputs. | Optional | [`components/date-range-picker/date-range-picker.md`](components/date-range-picker/date-range-picker.md) · [`docs/date-range-picker.html`](docs/date-range-picker.html) |
| Combobox | Selects one option from a searchable list. | Required | [`components/combobox/combobox.md`](components/combobox/combobox.md) · [`docs/combobox.html`](docs/combobox.html) |
| Time Field | Collects a structured time from native numeric fields and a period selector. | Optional | [`components/time-field/time-field.md`](components/time-field/time-field.md) · [`docs/time-field.html`](docs/time-field.html) |
| Form | Composes a complete native submission task. | None | [`components/form/form.md`](components/form/form.md) · [`docs/form.html`](docs/form.html) |

### Data display

| Component | Purpose | Runtime | Contract and demo |
| --- | --- | --- | --- |
| Badge | Shows short non-interactive status or metadata. | None | [`components/badge/badge.md`](components/badge/badge.md) · [`docs/badge.html`](docs/badge.html) |
| Avatar | Shows a person or entity image with a fallback and optional status. | Required | [`components/avatar/avatar.md`](components/avatar/avatar.md) · [`docs/avatar.html`](docs/avatar.html) |
| Card | Groups one standalone object or a small related content set. | None | [`components/card/card.md`](components/card/card.md) · [`docs/card.html`](docs/card.html) |
| Image | Presents an image, caption, fallback, and optional larger preview. | Required | [`components/image/image.md`](components/image/image.md) · [`docs/image.html`](docs/image.html) |
| Statistic | Shows one value with a label, description, and optional trend. | None | [`components/statistic/statistic.md`](components/statistic/statistic.md) · [`docs/statistic.html`](docs/statistic.html) |
| Table | Presents data with stable row and column relationships. | None | [`components/table/table.md`](components/table/table.md) · [`docs/table.html`](docs/table.html) |
| Data Table | Adds filtering, sorting, status, and pagination around Table. | Optional | [`components/data-table/data-table.md`](components/data-table/data-table.md) · [`docs/data-table.html`](docs/data-table.html) |
| Collapsible | Reveals and hides supplementary content. | None | [`components/collapsible/collapsible.md`](components/collapsible/collapsible.md) · [`docs/collapsible.html`](docs/collapsible.html) |
| Timeline | Presents events or steps in chronological or procedural order. | None | [`components/timeline/timeline.md`](components/timeline/timeline.md) · [`docs/timeline.html`](docs/timeline.html) |
| Tree View | Presents hierarchical items with expandable branches. | Required | [`components/tree-view/tree-view.md`](components/tree-view/tree-view.md) · [`docs/tree-view.html`](docs/tree-view.html) |
| Carousel | Presents a sequence of slides in a bounded scroll region. | Required | [`components/carousel/carousel.md`](components/carousel/carousel.md) · [`docs/carousel.html`](docs/carousel.html) |
| Scroll Area | Contains overflow inside a bounded region. | None | [`components/scroll-area/scroll-area.md`](components/scroll-area/scroll-area.md) · [`docs/scroll-area.html`](docs/scroll-area.html) |
| Sortable | Reorders a user-owned list. | Required | [`components/sortable/sortable.md`](components/sortable/sortable.md) · [`docs/sortable.html`](docs/sortable.html) |

### Feedback and status

| Component | Purpose | Runtime | Contract and demo |
| --- | --- | --- | --- |
| Spinner | Shows that an indeterminate task is active. | None | [`components/spinner/spinner.md`](components/spinner/spinner.md) · [`docs/spinner.html`](docs/spinner.html) |
| Skeleton | Reserves the shape of content that is loading. | None | [`components/skeleton/skeleton.md`](components/skeleton/skeleton.md) · [`docs/skeleton.html`](docs/skeleton.html) |
| Progress | Shows known task completion. | None | [`components/progress/progress.md`](components/progress/progress.md) · [`docs/progress.html`](docs/progress.html) |
| Callout | Presents persistent important information in the page flow. | None | [`components/callout/callout.md`](components/callout/callout.md) · [`docs/callout.html`](docs/callout.html) |
| Alert Dialog | Requires an explicit response to a high-impact decision. | Required | [`components/alert-dialog/alert-dialog.md`](components/alert-dialog/alert-dialog.md) · [`docs/alert-dialog.html`](docs/alert-dialog.html) |
| Toast | Announces a brief non-blocking result. | Required | [`components/toast/toast.md`](components/toast/toast.md) · [`docs/toast.html`](docs/toast.html) |

### Overlays

| Component | Purpose | Runtime | Contract and demo |
| --- | --- | --- | --- |
| Popover | Shows non-modal contextual content in the top layer. | Required | [`components/popover/popover.md`](components/popover/popover.md) · [`docs/popover.html`](docs/popover.html) |
| Tooltip | Shows a short supplementary hint on hover and focus. | Required | [`components/tooltip/tooltip.md`](components/tooltip/tooltip.md) · [`docs/tooltip.html`](docs/tooltip.html) |
| Dialog | Contains a focused modal task. | Required | [`components/dialog/dialog.md`](components/dialog/dialog.md) · [`docs/dialog.html`](docs/dialog.html) |
| Sheet | Presents an edge-aligned modal task. | Required | [`components/sheet/sheet.md`](components/sheet/sheet.md) · [`docs/sheet.html`](docs/sheet.html) |
| Accordion | Groups several disclosure sections. | Optional | [`components/accordion/accordion.md`](components/accordion/accordion.md) · [`docs/accordion.html`](docs/accordion.html) |
| Command Palette | Finds and activates global application commands. | Required | [`components/command-palette/command-palette.md`](components/command-palette/command-palette.md) · [`docs/command-palette.html`](docs/command-palette.html) |

### Navigation

| Component | Purpose | Runtime | Contract and demo |
| --- | --- | --- | --- |
| Breadcrumbs | Shows the current route within a hierarchy. | None | [`components/breadcrumbs/breadcrumbs.md`](components/breadcrumbs/breadcrumbs.md) · [`docs/breadcrumbs.html`](docs/breadcrumbs.html) |
| Pagination | Moves between result pages. | None | [`components/pagination/pagination.md`](components/pagination/pagination.md) · [`docs/pagination.html`](docs/pagination.html) |
| Tabs | Switches among related panels within one route. | Required | [`components/tabs/tabs.md`](components/tabs/tabs.md) · [`docs/tabs.html`](docs/tabs.html) |
| Dropdown Menu | Shows a compact set of actions from one trigger. | Required | [`components/dropdown-menu/dropdown-menu.md`](components/dropdown-menu/dropdown-menu.md) · [`docs/dropdown-menu.html`](docs/dropdown-menu.html) |
| Navigation Menu | Groups related site routes in top-level navigation popovers. | Required | [`components/navigation-menu/navigation-menu.md`](components/navigation-menu/navigation-menu.md) · [`docs/navigation-menu.html`](docs/navigation-menu.html) |

### Application

| Component | Purpose | Runtime | Contract and demo |
| --- | --- | --- | --- |
| App Shell | Provides reusable application header, toolbar, page overview, content, status, and empty-state primitives. | Optional | [`components/app-shell/app-shell.md`](components/app-shell/app-shell.md) · [`docs/app-shell.html`](docs/app-shell.html) |
| Sidebar | Provides collapsible desktop navigation and a mobile navigation dialog. | Required | [`components/sidebar/sidebar.md`](components/sidebar/sidebar.md) · [`docs/sidebar.html`](docs/sidebar.html) |
| Resizable | Presents two panels with an optional adjustable separator. | Optional | [`components/resizable/resizable.md`](components/resizable/resizable.md) · [`docs/resizable.html`](docs/resizable.html) |

## Layout and pattern ownership

Use Layout for local Grid and Flexbox composition.

Use App Shell for reusable chrome and page regions.

Use Sidebar for collapsible navigation.

Use a system pattern for repeated task composition.

Use a layout file for a complete serveable shell.

Do not move product-specific routes or business state into the library.

## Accessibility baseline

Start with native HTML before ARIA.

Keep visible focus on every interactive element.

Keep every pointer interaction available from a keyboard.

Keep every drag interaction available through another single-pointer method.

Keep text usable at 200 percent zoom.

Keep content usable at 320 CSS pixels without two-dimensional page scrolling.

Keep status understandable without color.

Test forced colors and increased contrast.

## Documentation contract

Each component skill must state its purpose, native basis, structure, behavior, accessibility requirements, and runtime.

`system/components.md` states the selection contract for all components.

Use active voice and present tense.

Use one instruction in each sentence.

Keep every rule explicit and self-contained.

Do not add extra files inside a component folder.

## Validation

Run the dependency-free contract suites.

```sh
npm test
```

Run the browser smoke suite when Chromium is available.

```sh
npm run test:browser
```

Inspect changed interfaces with keyboard-only input.

Inspect changed interfaces at 200 percent zoom.

Inspect changed interfaces at 320 CSS pixels.

Inspect changed interfaces in forced-colors mode.

## Provenance

The original foundations came from shadcn-html.

The current library follows its own native-first contract.

The repository uses the MIT license.
