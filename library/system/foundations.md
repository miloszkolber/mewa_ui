# Foundations

Use this file to apply the visual foundation.

Read `library/DESIGN.md` before this file.

## Identity

Use a technical and restrained visual language.

Use a dense interface when the task contains many related controls or data points.

Use plain language when the task is simple.

Keep decorative detail subordinate to information and action.

Use the entire page as one working surface.

Do not divide every content group into a separate card.

## Token ownership

Use `library/src/base.css` for static primitives.

Use `library/src/tokens.css` for semantic theme roles.

Use `registry.json` to read the purpose of each semantic token.

Do not consume a palette primitive in a component.

Do not invent a semantic token for one component.

<!-- TOKEN-REFERENCE:START -->
## Semantic token reference

This section is generated from `registry.json`.

| Token | Purpose |
| --- | --- |
| `--background` | Page canvas background. |
| `--background-glass` | Translucent page canvas for approved sticky shell chrome. |
| `--surface-primary` | Primary continuous content surface. |
| `--surface-primary-glass` | Translucent primary surface for approved sticky chrome. |
| `--surface-secondary` | Quiet surface for hover, selection, and secondary grouping. |
| `--surface-secondary-glass` | Translucent secondary surface for approved sticky chrome. |
| `--surface-positive` | Supporting surface for positive status. |
| `--surface-negative` | Supporting surface for negative status. |
| `--surface-caution` | Supporting surface for caution status. |
| `--surface-overlay` | Backdrop surface behind modal top-layer content. |
| `--surface-inverted` | Highest-contrast normal surface for primary actions and signets. |
| `--surface-destructive` | Filled destructive action surface. |
| `--text-primary` | Primary readable text and icon color. |
| `--text-secondary` | Supporting readable text and icon color. |
| `--text-muted` | Metadata and low-emphasis text color. |
| `--text-disabled` | Disabled text and icon color. |
| `--text-inverted` | Text and icon color on inverted surfaces. |
| `--text-positive` | Positive status text and icon color. |
| `--text-negative` | Negative status text and icon color. |
| `--text-caution` | Caution status text and icon color. |
| `--border-primary` | Default structural boundary. |
| `--border-secondary` | Stronger internal structural boundary. |
| `--border-muted` | Low-emphasis or dashed boundary. |
| `--border-subtle` | Quiet boundary for low-separation regions. |
| `--border-ring` | Authored focus-indicator color. |
| `--chart-1` | Highest-contrast monochrome chart series. |
| `--chart-2` | Second monochrome chart series. |
| `--chart-3` | Third monochrome chart series. |
| `--chart-4` | Fourth monochrome chart series. |
| `--chart-5` | Lowest-contrast monochrome chart series. |

<!-- TOKEN-REFERENCE:END -->

## Surface model

Use the page background as level zero.

Use one bordered section as level one.

Use rows, bands, and controls inside the section without another outer card.

Use `--surface-secondary` to show local state inside a level-one section.

Use a dialog, popover, tooltip, toast, or sheet as a top-layer surface.

Give a top-layer surface one border.

Do not give a top-layer surface a visual shadow.

Do not nest a card inside a card.

Do not wrap a table in a card.

Do not wrap a status list in a card.

Do not wrap an empty state in a card when the parent section already has a border.

## Borders

Use `--border-width-01` for normal structure.

Use `--border-width-02` for a strong divider or focus indicator.

Use `--border-width-03` only when the component skill specifies it.

Use a solid border for normal structure.

Use a dashed border for an empty or provisional region.

Use one border for one boundary.

Remove the child border when a child fills a bordered parent.

Keep separators flush with the content grid.

Do not use a border to imitate a shadow.

## Geometry

Use square corners on normal controls and surfaces.

Use `--border-radius` when a component needs the shared square value.

Use `--radius-full` for avatars, radio controls, circular progress, status dots, and circular skeletons.

Use an explicit `50%` value only when the component contract requires it.

Do not add a general radius scale.

Do not round a container to make it look softer.

## Typography

Use `var(--font-sans)` for interface text.

Use `var(--font-mono)` for code, terminal output, keyboard keys, IDs, and technical labels.

Use `var(--font-body)` for normal body text.

Use `var(--font-body-small)` for supporting text and dense controls.

Use `var(--font-body-xsmall)` for metadata and technical labels.

Use the heading tokens for document hierarchy.

Use sentence case for headings.

Use sentence case for buttons.

Use sentence case for labels.

Use sentence case for navigation.

Use uppercase only for a short eyebrow or machine label.

Use normal font weight for body text.

Use strong weight for labels, headings, selected routes, and primary values.

Use tabular numerals for changing numeric values.

Keep technical labels concise.

Do not repeat a title in the description.

Do not add explanatory text when the control label already explains the action.

## Spacing

Use the numeric `--space-*` scale.

Use `--space-01` for a tight relation.

Use `--space-02` for text and icon spacing.

Use `--space-03` for compact control groups.

Use `--space-04` for normal component padding and section gaps.

Use `--space-05` or `--space-06` between different local tasks.

Use `--space-08` or larger only between major page regions.

Use zero gap between connected rows.

Use borders to separate connected rows.

Do not add a new semantic spacing token.

Do not use an arbitrary pixel value when a current token matches the need.

## Interactive size

Use `--size-08` for the default 40px control height.

Use `--size-07` for the compact 32px control height.

Use `--size-08` for normal buttons, inputs, tabs, pagination items, and primary navigation rows.

Use `--size-07` for icon-only header tools and dense row actions.

Keep icon-only controls square.

Keep a custom pointer target at least 24px by 24px when possible.

Add spacing when a permitted target is smaller than 24px.

Do not reduce a target because the icon is small.

## Icons

Use an SVG from `library/src/icons/`.

Inline the SVG for the no-JavaScript path.

Use the local loader only when the host already provides it.

Use `currentColor` for icon stroke.

Use a 16px icon in a normal control.

Use `aria-hidden="true"` for a decorative icon.

Give an icon-only control an accessible name.

Do not load an icon from a CDN.

Do not mix icon families in one interface.

## Blur

Use blur only on sticky shell chrome.

Use `--background-glass` or a matching glass surface with blur.

Use `--blur-01` for normal sticky chrome.

Use `--blur-02` only when the component contract permits it.

Keep an opaque semantic background as the fallback.

Keep borders visible over blurred content.

Do not blur controls.

Do not blur dialogs.

Do not blur cards.

Do not blur tables.

Do not blur body content.

Do not use blur as elevation.

## Motion

Keep state changes immediate.

Use no transition duration token.

Use no animation duration token.

Use no smooth scroll behavior.

Use no entrance or exit animation.

Use no hover movement.

Use no shimmer.

Use no animated skeleton.

Use Spinner rotation only for active loading.

Stop the Spinner when work finishes.

Do not use Spinner as decoration.

## Responsive tiers

Use `60rem` when a wide main-and-rail composition needs one column.

Use `48rem` when a shell changes navigation mode.

Use `37.5rem` when a page needs compact single-column behavior.

Use rem units for each breakpoint.

Use content-driven intrinsic layout before a media query.

Use wrapping flex and auto-fit grid before a new breakpoint.

Keep one page scroll direction for normal content.

Contain horizontal overflow in the table, grid, code, or media region that needs it.

Use a 90rem maximum for dense application canvases.

Use a 64rem maximum for focused tools and content pages.

Do not add a third global maximum.

## Theme

Use the light theme as the base token block.

Use the `.dark` class for the dark token block.

Follow the operating system until the user makes a manual choice.

Use the shared pre-paint theme decision from App Shell.

Use the App Shell module for the optional persisted toggle.

Keep every component legible in both themes.

Do not hardcode a theme color in a component.

## Acceptance checks

Check every visual rule against a current token.

Check every boundary for duplicate borders.

Check every surface for unnecessary nesting.

Check every control for the documented height.

Check every icon for local loading and accessible use.

Check every status for visible text.

Check every sticky region for an opaque fallback.

Check every responsive change at 60rem, 48rem, and 37.5rem.

Check the page at 320px width.

Check the page at 200% zoom.
