# Foundations

Use this file to apply the visual foundation.

Read `DESIGN.md` before this file.

## Identity

Use a technical and restrained visual language.

Use a dense interface when the task contains many related controls or data points.

Use plain language when the task is simple.

Keep decorative detail subordinate to information and action.

Use the entire page as one working surface.

Do not divide every content group into a separate card.

## Token ownership

Use `src/base.css` for static primitives.

Use `src/tokens.css` for semantic theme roles.

Use `registry.json` to read the purpose of each semantic token.

Do not consume a palette primitive in a component.

Do not invent a semantic token for one component.

## Color palettes

Use neutral, red, amber, green, and blue solid palettes.

Use `000` for white in the neutral family.

Use the symmetric `050` through `950` scale for every palette.

Use neutral `050` and neutral `950` as the symmetry endpoints.

Keep neutral `000` as white outside the symmetric range.

Pair `600` on neutral `050` with `400` on neutral `950`.

Do not define a pure-black primitive.

Treat neutral as the CSS name for the grayscale family in Penpot.

Keep one OKLCH hue across each chromatic palette.

Use the tuned alpha primitives only through semantic roles.

Do not recreate an alpha primitive with opacity on its matching solid token.

Use red, amber, and green only for status and destructive meaning.

Use blue for focus and approved informational emphasis.

<!-- TOKEN-REFERENCE:START -->
## Semantic token reference

This section is generated from `registry.json`.

| Token | Purpose |
| --- | --- |
| `--background` | Page canvas background. |
| `--background-glass` | Translucent page canvas for approved sticky shell chrome. |
| `--surface-primary` | Primary continuous content surface. |
| `--surface-primary-glass` | Translucent primary surface for approved sticky chrome. |
| `--surface-secondary` | Quiet structural surface for secondary grouping. |
| `--surface-secondary-glass` | Translucent secondary surface for approved sticky chrome. |
| `--surface-hover` | Theme-aware translucent surface for pointer and keyboard hover feedback. |
| `--surface-selected` | Theme-aware translucent surface for a selected or current item. |
| `--surface-disabled` | Theme-aware translucent surface for a disabled control or region. |
| `--surface-positive` | Supporting surface for positive status. |
| `--surface-negative` | Supporting surface for negative status. |
| `--surface-caution` | Supporting surface for caution status. |
| `--surface-inverted` | Highest-contrast normal surface for primary actions and signets. |
| `--surface-destructive` | Filled destructive action surface. |
| `--overlay-subtle` | Lowest-emphasis translucent overlay for local state and separation. |
| `--overlay-moderate` | Medium-emphasis translucent overlay for local state and separation. |
| `--overlay-strong` | Strong backdrop overlay behind modal top-layer content. |
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
| `--border-hover` | Boundary color for an interactive element under hover. |
| `--border-selected` | Boundary color for a selected or current interactive element. |
| `--border-disabled` | Boundary color for a disabled control or region. |
| `--border-focus` | Theme-aware blue boundary for authored focus indicators. |
| `--border-positive` | Boundary color for positive status and validation. |
| `--border-negative` | Boundary color for negative status and validation. |
| `--border-caution` | Boundary color for caution status and validation. |
| `--chart-1` | Highest-contrast monochrome chart series. |
| `--chart-2` | Second monochrome chart series. |
| `--chart-3` | Third monochrome chart series. |
| `--chart-4` | Fourth monochrome chart series. |
| `--chart-5` | Lowest-contrast monochrome chart series. |
| `--chart-neutral` | Primary neutral chart mark with theme-aware contrast. |
| `--chart-positive` | Positive chart mark with theme-aware contrast. |
| `--chart-negative` | Negative chart mark with theme-aware contrast. |
| `--chart-caution` | Caution chart mark with theme-aware contrast. |
| `--chart-area-neutral` | Translucent neutral chart area that adapts to its surface. |
| `--chart-area-positive` | Translucent positive chart area that adapts to its surface. |
| `--chart-area-negative` | Translucent negative chart area that adapts to its surface. |
| `--chart-area-caution` | Translucent caution chart area that adapts to its surface. |

<!-- TOKEN-REFERENCE:END -->

## Surface model

Use the page background as level zero.

Use one bordered section as level one.

Use rows, bands, and controls inside the section without another outer card.

Use `--surface-secondary` for quiet grouping inside a level-one section.

Use `--surface-hover` for hover feedback.

Use `--surface-selected` for a selected or current item.

Use `--surface-disabled` for a disabled surface.

Use a dialog, popover, tooltip, toast, or sheet as a top-layer surface.

Give a top-layer surface one border.

Do not give a top-layer surface a visual shadow.

Do not nest a card inside a card.

Do not wrap a table in a card.

Do not wrap a status list in a card.

Do not wrap an empty state in a card when the parent section already has a border.

## Borders

Use `--border-width-025` for normal structure.

Use `--border-width-050` for a strong divider or focus indicator.

Use `--border-width-100` only when the component skill specifies it.

Use `--border-focus` for an authored focus perimeter.

Use the matching status border for status validation.

Use a solid border for normal structure.

Use a dashed border for an empty or provisional region.

Use one border for one boundary.

Remove the child border when a child fills a bordered parent.

Keep separators flush with the content grid.

Do not use a border to imitate a shadow.

## Geometry

Use square corners on normal controls and surfaces.

Use `--border-radius` when a component needs the shared square value.

Use `--border-radius-6400` for avatars, radio controls, circular progress, status dots, and circular skeletons.

Use an explicit `50%` value only when the component contract requires it.

Do not add a general radius scale.

Do not round a container to make it look softer.

## Typography

Use `var(--font-sans)` for interface text.

Use `var(--font-mono)` for code, terminal output, keyboard keys, IDs, and technical labels.

Use `var(--font-size-400)` for normal body text.

Use `var(--font-size-350)` for supporting text and dense controls.

Use `var(--font-size-300)` for metadata and technical labels.

Use the heading tokens for document hierarchy.

Use sentence case for headings.

Use sentence case for buttons.

Use sentence case for labels.

Use sentence case for navigation.

Use uppercase only for a short eyebrow or machine label.

Use normal font weight for body text.

Use strong weight for labels, headings, selected routes, and primary values.

Use `--font-weight-550` as the variable-font strong weight in CSS.

Use weight 500 only as the Penpot fallback for the `550` token.

Keep composed typography rules in Penpot only.

Compose repository typography from the font primitives.

Use the text-case and text-decoration primitives for explicit authored variants.

Use tabular numerals for changing numeric values.

Keep technical labels concise.

Do not repeat a title in the description.

Do not add explanatory text when the control label already explains the action.

## Spacing

Use the numeric `--space-*` scale.

Treat `100` as 4px throughout numeric dimension scales.

Use `025` for a 1px dimension when the scale includes quarter steps.

Use `--space-100` for a tight relation.

Use `--space-200` for text and icon spacing.

Use `--space-300` for compact control groups.

Use `--space-400` for normal component padding and section gaps.

Use `--space-500` or `--space-600` between different local tasks.

Use `--space-1000` or larger only between major page regions.

Use zero gap between connected rows.

Use borders to separate connected rows.

Do not add a new semantic spacing token.

Do not use an arbitrary pixel value when a current token matches the need.

## Interactive size

Use `--size-1000` for the default 40px control height.

Use `--size-800` for the compact 32px control height.

Use `--size-1000` for normal buttons, inputs, tabs, pagination items, and primary navigation rows.

Use `--size-800` for icon-only header tools and dense row actions.

Keep icon-only controls square.

Keep a custom pointer target at least 24px by 24px when possible.

Add spacing when a permitted target is smaller than 24px.

Do not reduce a target because the icon is small.

## Icons

Use an SVG from `src/icons/`.

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

Use `--blur-100` for normal sticky chrome.

Use `--blur-200` only when the component contract permits it.

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

Use the `--breakpoint-compact` value, `48rem`, when a shell changes navigation mode.

Use the `--breakpoint-narrow` value, `37.5rem`, for compact single-column behavior.

Use rem units for each breakpoint.

Use content-driven intrinsic layout before a media query.

Use wrapping flex and auto-fit grid before a new breakpoint.

Keep one page scroll direction for normal content.

Contain horizontal overflow in the table, grid, code, or media region that needs it.

Use the `--breakpoint-max-dense` value, `90rem`, for dense application canvases.

Use the `--breakpoint-max-focused` value, `64rem`, for focused tools and content pages.

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

Check every text and icon pair against its actual surface.

Check alpha roles after compositing on each supported surface.

Check every sticky region for an opaque fallback.

Check every responsive change at 60rem, 48rem, and 37.5rem.

Check the page at 320px width.

Check the page at 200% zoom.
