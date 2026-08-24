# mewa_ui

mewa_ui is a standalone library of square, border-led, shadow-free interface components built on semantic HTML principles, tokenized CSS, local SVG icons, and small native-first ES modules. It has no framework, no package runtime, and no production build step. Its foundations were originally derived from [shadcn-html](https://github.com/codylindley/shadcn-html) and have since diverged onto their own native-first contract.

The canonical consumer surface is the repository root: `src/` for foundations and icons, `components/` for component implementations, `docs/` for the static reference site, and `layouts/` for the two application-shell templates when they are present. New work must use those canonical directories.

## Contract at a glance

- Start with semantic HTML and native controls. Use JavaScript only for behavior that HTML and CSS cannot express.
- Load `src/base.css` before `src/tokens.css`. Add only the component stylesheets the consuming page uses.
- Load a component module only when the inventory says `Yes` or `Optional` and the markup uses the behavior it provides. A native fallback must remain usable where the component skill documents one.
- Use semantic roles from `src/tokens.css`. Red, amber, and green communicate status. Do not hardcode a palette into a component.
- Geometry is square by default. `--border-radius` is zero, and `--radius-full` or a 50% circle is reserved for objects whose meaning requires circular geometry, such as avatars, radios, progress, or skeleton avatars. Do not add a general radius scale.
- Elevation is expressed with borders, especially `--border-primary`. Do not add visual shadows, shadow tokens, or focus halos that look like elevation.
- The canonical source is motionless. Do not add CSS animations, CSS transitions, smooth scrolling, View Transitions, scroll-driven effects, Web Animations, shimmer, or spinner motion. State changes, disclosure, overlay, navigation, and drag updates are immediate. If a consuming product adds motion outside mewa_ui, it must provide its own `prefers-reduced-motion` behavior.
- Use `:focus-visible`, `prefers-contrast: more`, and `forced-colors: active` states. Keep labels, native validation, names, IDs, and ARIA relationships intact.

## Provenance

- Upstream: [codylindley/shadcn-html](https://github.com/codylindley/shadcn-html)
- Upstream commit: `0964e09e16034e39a244589d457a866171991f1d` (2026-04-19, v0.7.13-alpha)
- License: MIT (see `LICENSE`; upstream attribution retained)

## Repository map

```
ui_library/
├── src/base.css                   ← static palette, fonts, typography, geometry, and browser primitives
├── src/tokens.css                 ← light and dark semantic color roles
├── src/geist.woff2                ← Geist variable font, 400–550
├── src/geistmono.woff2            ← Geist Mono variable font, 400–550
├── src/icons/                     ← local Lucide SVG files, one file per icon
├── components/                    ← 59 self-contained component folders
│   └── {name}/
│       ├── {name}.md              ← skill: native basis, structure, attributes, and ARIA
│       ├── {name}.css             ← component stylesheet
│       └── {name}.js              ← interaction module when the component needs one
├── docs/                          ← 59 static component pages and doc-site scripts
├── layouts/                       ← canonical application-shell templates
└── AGENTS.md                     ← maintainer instructions
```

The number in this map is the current source count: every `components/{name}/` directory has a matching skill and stylesheet, and every component has a matching `docs/{name}.html` page. The inventory below is the maintained human-readable index.

## Consume the canonical system

### Include foundations and components

Load the foundations in order, then the stylesheets for the components used by the page:

```html
<link rel="stylesheet" href="/ui/src/base.css">
<link rel="stylesheet" href="/ui/src/tokens.css">
<link rel="stylesheet" href="/ui/components/button/button.css">
<link rel="stylesheet" href="/ui/components/dialog/dialog.css">
<script type="module" src="/ui/components/dialog/dialog.js"></script>
```

The `components/{name}/{name}.md` skill is the markup contract. The `.css` and `.js` files are the implementation source of truth. Use the documented classes and `data-*` attributes exactly. Do not invent a class or attribute because it resembles an API from another UI library.

### Use local icons

Icons live in `src/icons/` as standalone SVG files. Inline the matching SVG for the no-JavaScript path. When a local loader is available, `<i data-lucide="name">` is an optional convenience hook; the doc site's loader is in `docs/js/site.js`. Decorative icons need `aria-hidden="true"`; icon-only controls need an accessible name. Never load the Lucide CDN or any other external icon set.

### Theme with tokens

`src/base.css` owns static primitives such as the Geist font faces, neutral and status palettes, typography, spacing, border widths, and the limited full-circle token. `src/tokens.css` owns semantic roles for light and dark themes: `--background*`, `--surface-*`, `--text-*`, `--border-*`, and `--chart-1` through `--chart-5`. Add or remove `class="dark"` on `<html>` to select the dark block. Put consumer overrides in a stylesheet loaded after both foundation files.

### Preserve native behavior

Use `<dialog>` for modal surfaces, the Popover API for popovers and tooltips, `<details>/<summary>` for disclosures, `<progress>` for completion, `<meter>` for bounded scalar measurements, `<output>` for computed values, and native form controls wherever the skill calls for them. Use links for navigation and buttons for actions. Keep a keyboard path for pointer or drag interactions. Do not replace native behavior with a framework, a focus-trap library, a positioning library, or a custom form submission path.

## Canonical application shells

`layouts/` is the only canonical home for complete reusable application-shell templates. The current two templates are `layouts/vertical-navbar.html` for a left collapsible sidebar and `layouts/horizontal-navbar.html` for top navigation. Keep both serveable from the repository root, and compose them from current `src/`, `components/`, and layout-local files. `layouts/layouts.css` owns template-only layout rules, while `layouts/layouts.js` provides local icon inlining and the optional theme toggle. The App Shell component supplies shared header, toolbar, page-overview, status, empty-state, and optional theme primitives for consumer-owned shells without creating a third template.

### Left collapsible sidebar

Use the `Sidebar` component for this shell. Start with `.sidebar-layout`, an `<aside class="app-sidebar">`, and a `<main>`. Put every route in one flat, labelled `<nav>` of native links and use `data-state="expanded"` or `data-state="collapsed"` for the two widths. Keep the collapse control in `.sidebar-footer` as a full-width labelled button in the expanded state and an icon-only named button in the collapsed state. The `vertical-navbar.html` template adds the breadcrumb header, workspace content, and optional utility rail around that shell. The `sidebar.js` module owns the footer control, `aria-expanded` synchronization, the `Cmd+B`/`Ctrl+B` shortcut, and the mobile `<dialog>` trigger. Keep the link's `aria-current="page"`. Tooltips on icon-only collapsed links are optional and come from the Tooltip component. Do not copy vertical navbar classes, shell markup, or runtime code into a second implementation.

### Top navigation

The `layouts/horizontal-navbar.html` template uses a semantic `<header>` with a labelled `<nav>` of native `<a>` routes and an action cluster. Keep route navigation as links, use buttons for actions, and keep decorative icons hidden from assistive technology. Use `components/layout/` primitives and `layouts/layouts.css` for the surrounding content. Use `components/navigation-menu/` only when the layout needs a documented Popover API route group. Do not use tab roles for route navigation.

Both shells are immediate and motionless. Use `--border-primary` and semantic surfaces for separation, not shadows or animation. Keep the shell usable at narrow widths, with a visible keyboard path to every control.

## Component inventory

This is the complete current inventory, grouped by the same purpose groups used by `docs/js/layout.js`. `Yes` means the component's module is required for its documented behavior. `Optional` means the native markup works without the module, while the module enables a documented enhanced mode. `No` means the component has no component module. Icon loading is optional when using the doc-site loader, but inline SVG use needs no JavaScript.

### Primitives

| Component | Native basis | JS | Skill and doc |
|---|---|---|---|
| Typography | Native HTML text elements: headings, paragraphs, quotes, code, keyboard notation, and lists | No | [`components/typography/typography.md`](components/typography/typography.md) · [`docs/typography.html`](docs/typography.html) |
| Layout | CSS Grid and Flexbox primitives for containers, stacks, grids, sidebar splits, centering, and opposite-end groups | No | [`components/layout/layout.md`](components/layout/layout.md) · [`docs/layout.html`](docs/layout.html) |
| Separator | `<hr>` for horizontal rules and `<div role="separator">` for a vertical separator | No | [`components/separator/separator.md`](components/separator/separator.md) · [`docs/separator.html`](docs/separator.html) |
| Icon | Inline `<svg>` copied from a local standalone SVG file, with an optional loader hook | No | [`components/icon/icon.md`](components/icon/icon.md) · [`docs/icon.html`](docs/icon.html) |

### Actions

| Component | Native basis | JS | Skill and doc |
|---|---|---|---|
| Button | `<button>`, with the same styling available on navigation `<a>` elements | No | [`components/button/button.md`](components/button/button.md) · [`docs/button.html`](docs/button.html) |
| Toggle | `<button aria-pressed>` with a two-state pressed value | Yes | [`components/toggle/toggle.md`](components/toggle/toggle.md) · [`docs/toggle.html`](docs/toggle.html) |
| Toggle Group | `role="group"` containing buttons with `aria-pressed` and roving focus | Yes | [`components/toggle-group/toggle-group.md`](components/toggle-group/toggle-group.md) · [`docs/toggle-group.html`](docs/toggle-group.html) |
| Button Group | A `<div>` grouping connected `.btn` buttons with an accessible group name | No | [`components/button-group/button-group.md`](components/button-group/button-group.md) · [`docs/button-group.html`](docs/button-group.html) |
| Toolbar | `role="toolbar"` containing related controls | Yes | [`components/toolbar/toolbar.md`](components/toolbar/toolbar.md) · [`docs/toolbar.html`](docs/toolbar.html) |

### Forms and inputs

| Component | Native basis | JS | Skill and doc |
|---|---|---|---|
| Label | `<label>` associated with a control by `for` and `id` | No | [`components/label/label.md`](components/label/label.md) · [`docs/label.html`](docs/label.html) |
| Field | A labelled native control or `<fieldset>/<legend>` group with explicit descriptions and errors | No | [`components/field/field.md`](components/field/field.md) · [`docs/field.html`](docs/field.html) |
| Text Field | A labelled native `<input>` composition with descriptions, errors, autofill, and validation | No | [`components/text-field/text-field.md`](components/text-field/text-field.md) · [`docs/text-field.html`](docs/text-field.html) |
| Textarea | `<textarea>` with native validation and `field-sizing: content` | No | [`components/textarea/textarea.md`](components/textarea/textarea.md) · [`docs/textarea.html`](docs/textarea.html) |
| Checkbox | `<input type="checkbox">` with native checked and indeterminate states, plus an optional select-all group enhancement | Optional | [`components/checkbox/checkbox.md`](components/checkbox/checkbox.md) · [`docs/checkbox.html`](docs/checkbox.html) |
| Radio Group | `<input type="radio">` elements sharing a `name` inside `<fieldset>/<legend>` | No | [`components/radio-group/radio-group.md`](components/radio-group/radio-group.md) · [`docs/radio-group.html`](docs/radio-group.html) |
| Switch | `<input type="checkbox" role="switch">` | No | [`components/switch/switch.md`](components/switch/switch.md) · [`docs/switch.html`](docs/switch.html) |
| Slider | `<input type="range">` with native keyboard and touch support | Yes | [`components/slider/slider.md`](components/slider/slider.md) · [`docs/slider.html`](docs/slider.html) |
| Select | `<select>` with native options and optional `<optgroup>` labels | No | [`components/select/select.md`](components/select/select.md) · [`docs/select.html`](docs/select.html) |
| Number Field | `<input type="number">` with stacked increment and decrement buttons | Yes | [`components/number-field/number-field.md`](components/number-field/number-field.md) · [`docs/number-field.html`](docs/number-field.html) |
| File Input | `<input type="file">` with native picker and file-selector styling | No | [`components/file-input/file-input.md`](components/file-input/file-input.md) · [`docs/file-input.html`](docs/file-input.html) |
| Date Field | `<input type="date">` or `<input type="datetime-local">` with the browser picker | No | [`components/date-field/date-field.md`](components/date-field/date-field.md) · [`docs/date-field.html`](docs/date-field.html) |
| Date Picker | `<table>` month grid with `role="grid"` and button day cells | Yes | [`components/date-picker/date-picker.md`](components/date-picker/date-picker.md) · [`docs/date-picker.html`](docs/date-picker.html) |
| Date Range Picker | `<fieldset>` containing two native date inputs and an optional live summary | Optional | [`components/date-range-picker/date-range-picker.md`](components/date-range-picker/date-range-picker.md) · [`docs/date-range-picker.html`](docs/date-range-picker.html) |
| Combobox | Button trigger and Popover API popup containing a search input and `role="listbox"` | Yes | [`components/combobox/combobox.md`](components/combobox/combobox.md) · [`docs/combobox.html`](docs/combobox.html) |
| Time Field | `<fieldset>` with labelled hour and minute inputs, an AM/PM `<select>`, and a hidden submitted value | Optional | [`components/time-field/time-field.md`](components/time-field/time-field.md) · [`docs/time-field.html`](docs/time-field.html) |
| Form | `<form>` with native submission and constraint validation, composed with labelled fields | No | [`components/form/form.md`](components/form/form.md) · [`docs/form.html`](docs/form.html) |

### Data display

| Component | Native basis | JS | Skill and doc |
|---|---|---|---|
| Badge | `<span>` for a non-interactive visual indicator | No | [`components/badge/badge.md`](components/badge/badge.md) · [`docs/badge.html`](docs/badge.html) |
| Avatar | `<img>` inside a `<span>` with text fallback content | Yes | [`components/avatar/avatar.md`](components/avatar/avatar.md) · [`docs/avatar.html`](docs/avatar.html) |
| Card | `<div>` for grouping or `<article>` for standalone content | No | [`components/card/card.md`](components/card/card.md) · [`docs/card.html`](docs/card.html) |
| Image | `<figure>` with `<img>`, optional `<figcaption>`, and a native `<dialog>` preview | Yes | [`components/image/image.md`](components/image/image.md) · [`docs/image.html`](docs/image.html) |
| Statistic | `<div>` containers for a value, label, and optional trend | No | [`components/statistic/statistic.md`](components/statistic/statistic.md) · [`docs/statistic.html`](docs/statistic.html) |
| Table | `<table>` with semantic caption, header, body, and footer groups | No | [`components/table/table.md`](components/table/table.md) · [`docs/table.html`](docs/table.html) |
| Data Table | Progressive enhancement around a semantic table, labelled filter, result status, and native pagination links | Optional | [`components/data-table/data-table.md`](components/data-table/data-table.md) · [`docs/data-table.html`](docs/data-table.html) |
| Collapsible | `<details>` with a visible `<summary>` trigger | No | [`components/collapsible/collapsible.md`](components/collapsible/collapsible.md) · [`docs/collapsible.html`](docs/collapsible.html) |
| Timeline | Ordered `<ol>` with items connected by a visual line | No | [`components/timeline/timeline.md`](components/timeline/timeline.md) · [`docs/timeline.html`](docs/timeline.html) |
| Tree View | Nested `<ul>` elements with tree and treeitem roles and native disclosure branches | Yes | [`components/tree-view/tree-view.md`](components/tree-view/tree-view.md) · [`docs/tree-view.html`](docs/tree-view.html) |
| Carousel | Overflow container with CSS `scroll-snap`, native buttons, and `IntersectionObserver` | Yes | [`components/carousel/carousel.md`](components/carousel/carousel.md) · [`docs/carousel.html`](docs/carousel.html) |
| Scroll Area | CSS overflow with standard and WebKit scrollbar styling | No | [`components/scroll-area/scroll-area.md`](components/scroll-area/scroll-area.md) · [`docs/scroll-area.html`](docs/scroll-area.html) |
| Sortable | Native HTML Drag and Drop API plus keyboard reordering | Yes | [`components/sortable/sortable.md`](components/sortable/sortable.md) · [`docs/sortable.html`](docs/sortable.html) |

### Feedback and status

| Component | Native basis | JS | Skill and doc |
|---|---|---|---|
| Spinner | Static SVG loading indicator with `role="status"` | No | [`components/spinner/spinner.md`](components/spinner/spinner.md) · [`docs/spinner.html`](docs/spinner.html) |
| Skeleton | Static placeholder `<div>` elements | No | [`components/skeleton/skeleton.md`](components/skeleton/skeleton.md) · [`docs/skeleton.html`](docs/skeleton.html) |
| Progress | Native `<progress>` element | No | [`components/progress/progress.md`](components/progress/progress.md) · [`docs/progress.html`](docs/progress.html) |
| Callout | `<div role="alert">` for important callout content | No | [`components/callout/callout.md`](components/callout/callout.md) · [`docs/callout.html`](docs/callout.html) |
| Alert Dialog | Native `<dialog>` with `role="alertdialog"` for an explicit response | Yes | [`components/alert-dialog/alert-dialog.md`](components/alert-dialog/alert-dialog.md) · [`docs/alert-dialog.html`](docs/alert-dialog.html) |
| Toast | `popover="manual"` surface with `role="status"` and a polite live region | Yes | [`components/toast/toast.md`](components/toast/toast.md) · [`docs/toast.html`](docs/toast.html) |

### Overlays

| Component | Native basis | JS | Skill and doc |
|---|---|---|---|
| Popover | Popover API with `popover` and `popovertarget`, positioned with CSS anchors | Yes | [`components/popover/popover.md`](components/popover/popover.md) · [`docs/popover.html`](docs/popover.html) |
| Tooltip | `popover="hint"` with CSS anchor positioning for hover and focus hints | Yes | [`components/tooltip/tooltip.md`](components/tooltip/tooltip.md) · [`docs/tooltip.html`](docs/tooltip.html) |
| Dialog | Native `<dialog>` opened with `showModal()` | Yes | [`components/dialog/dialog.md`](components/dialog/dialog.md) · [`docs/dialog.html`](docs/dialog.html) |
| Sheet | Native `<dialog>` opened with `showModal()` and a `data-side` edge | Yes | [`components/sheet/sheet.md`](components/sheet/sheet.md) · [`docs/sheet.html`](docs/sheet.html) |
| Accordion | `<details>/<summary>` disclosures; single-open mode is enhanced, multi-open mode is native | Optional | [`components/accordion/accordion.md`](components/accordion/accordion.md) · [`docs/accordion.html`](docs/accordion.html) |
| Command Palette | Native `<dialog>` containing a search input and command list | Yes | [`components/command-palette/command-palette.md`](components/command-palette/command-palette.md) · [`docs/command-palette.html`](docs/command-palette.html) |

### Navigation

| Component | Native basis | JS | Skill and doc |
|---|---|---|---|
| Breadcrumbs | `<nav>` containing an ordered `<ol>` path | No | [`components/breadcrumbs/breadcrumbs.md`](components/breadcrumbs/breadcrumbs.md) · [`docs/breadcrumbs.html`](docs/breadcrumbs.html) |
| Pagination | `<nav>` containing a list of native `<a>` page links | No | [`components/pagination/pagination.md`](components/pagination/pagination.md) · [`docs/pagination.html`](docs/pagination.html) |
| Tabs | WAI-ARIA `tablist`, `tab`, and `tabpanel` roles | Yes | [`components/tabs/tabs.md`](components/tabs/tabs.md) · [`docs/tabs.html`](docs/tabs.html) |
| Dropdown Menu | Popover API with a button trigger and WAI-ARIA menu items | Yes | [`components/dropdown-menu/dropdown-menu.md`](components/dropdown-menu/dropdown-menu.md) · [`docs/dropdown-menu.html`](docs/dropdown-menu.html) |
| Navigation Menu | `<nav>` and `<ul>` with Popover API dropdown panels | Yes | [`components/navigation-menu/navigation-menu.md`](components/navigation-menu/navigation-menu.md) · [`docs/navigation-menu.html`](docs/navigation-menu.html) |

### Application

| Component | Native basis | JS | Skill and doc |
|---|---|---|---|
| App Shell | `<body>`, `<header>`, `<nav>`, and `<main>` page frame with native route links and an optional theme enhancement | Optional | [`components/app-shell/app-shell.md`](components/app-shell/app-shell.md) · [`docs/app-shell.html`](docs/app-shell.html) |
| Sidebar | `<aside>` and `<nav>` with a `<dialog>` mobile overlay, a flat link list, and a footer collapse button | Yes | [`components/sidebar/sidebar.md`](components/sidebar/sidebar.md) · [`docs/sidebar.html`](docs/sidebar.html) |
| Resizable | Two panels separated by a static `role="separator"`; the optional module adds the keyboard and pointer resizing behavior | Optional | [`components/resizable/resizable.md`](components/resizable/resizable.md) · [`docs/resizable.html`](docs/resizable.html) |

## Migration candidates and coverage gaps

These candidates are product patterns worth building against the current native, square, motionless contract. They are intentionally listed separately from the shipped inventory so consumers do not mistake a proposal for a supported API. Resizable and Date Range Picker are shipped components and are not migration candidates.

Table remains the structural semantic table component, while Data Table is its optional progressive enhancement. Date Field delegates to the native browser date control, while Date Picker provides the custom accessible month-grid interaction.

### Recreate as compositions or focused primitives

- **Attachment row** — compose `File input`, `Badge`, `Progress`, and `Callout` into a removable `<article>` with filename, size, state, and an accessible remove button.
- **Empty state** — compose `Card`, `Image`, `Typography`, and `Button` around a short explanation and one recovery action.
- **Description list** — add a small `<dl>` pattern for metadata-heavy pages before creating a broad “metadata” component.
- **Diff and chart** — use `<figure>`, `<figcaption>`, native `range`/`output`, SVG or canvas with a textual table fallback, and explicit summaries before introducing a visualization runtime.
- **Freeform autocomplete** — extend the documented `Combobox` pattern only if a text-entry mode is needed. Do not create a second listbox implementation.
- **Footer, tag input, OTP input, and hover card** — compare demand and native API support before adding them. Shared application headers are covered by App Shell, while complete template composition remains under `layouts/`.

The Kernel UI catalog is a useful parity checklist, not a requirement to add every named component. Its most relevant remaining gaps for this library are richer form composition and message or AI work surfaces. Karl Koch's semantic-HTML-first principles reinforce the existing contract: start with native elements, let pseudo-classes and browser validation express state, use `data-*` only for state the platform cannot represent, and keep the HTML useful without a framework runtime. Review [Karl Koch's semantic-HTML-first article](https://karlkoch.me/writing/why-i-built-a-semantic-html-first-library/) and the [Kernel UI component catalog](https://www.kernelui.com/components/) before promoting a candidate into the supported inventory.

## Documentation site

The current documentation site is static and has one page per component. There is no `docs/index.html`; serve `docs/` over HTTP and start at `typography.html`. The site navigation and router are centralized in `docs/js/layout.js`. Navigation imports destination module scripts before swapping `<main>` immediately and deliberately has no View Transition or other animation. `docs/js/site.js` owns doc-site-only behavior such as local icon inlining, copy buttons, and page-ready hooks.

Doc pages load the foundation styles and the complete component stylesheet list, plus only the modules their demos use; the router imports a destination page's modules before swapping content. Consumers should load only the assets listed by the component inventory. The pages show copyable HTML examples, not generated CSS or JavaScript source.

## Maintain the system

- Keep each component self-contained in `components/{name}/`. Its skill documents the HTML pattern, attributes, native basis, keyboard model, and ARIA. Edit the stylesheet and module directly. Do not create a framework wrapper or a second source tree.
- When adding a component, add its skill, stylesheet, optional module, and `docs/{name}.html`. Add the page to `NAV` and `BUILT` in `docs/js/layout.js`, and add its stylesheet link following the current doc-page convention, and its module script only on pages whose demos use it.
- Update the 59-row inventory in this file whenever a component is added, removed, renamed, or changes its JS requirement. Verify the row against the actual `components/{name}/` directory, the skill's Native basis section, and the matching doc page.
- Keep component docs, markup examples, CSS, and JS aligned. Do not document a variant, state, API, or layout that the current source does not implement.
- Preserve the no-animation contract, square geometry, semantic token usage, native fallback behavior, keyboard path, contrast modes, and forced-colors support in every change.
- Keep `docs/` imports and `docs/js/layout.js` synchronized. A missing import can make a cross-page demo fail silently.

Before changing a component skill or doc page, review the current component implementation and the relevant native references. The skill file is the markup reference; the stylesheet and module are the executable contract.
