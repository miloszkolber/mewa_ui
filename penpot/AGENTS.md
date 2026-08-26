# Penpot agent guidance

This file is for agents that build or maintain the Penpot component library. It is the
condensed version of `PLAYBOOK.md`. Read `PLAYBOOK.md` before any mutation, and read
this file before every Penpot session.

## Orientation

- The library is a connected Penpot file. Its token sets, connected `mewa_icons`
  library, and `Examples` page are authoritative.
- `sync-manifest.generated.json` is the machine-readable source of what each component
  should look like: anatomy parts, variant axes, and shared references.
- `library/components/{slug}/` is the implementation truth. Read the component `.md`
  and `.css` before building its Penpot representation.
- `library/DESIGN.md` and the token reference in `library/system/foundations.md`
  explain the design contract.

## Non-negotiables

- Build atoms first, composites second. A composite holds instances of atoms; it never
  redraws them.
- Use real Penpot variant containers with named variant properties for state axes.
  Never draw visual state matrices or component sheets.
- Use mewa_icons instances for every glyph. Never draw paths.
- Use the predefined typography tokens (`body.base.default`, `body.small.strong`,
  `heading.h2`, ...). Never hand-set font size, family, or weight.
- Use semantic tokens for all fills, strokes, spacing, sizing, radius, and opacity.
  Never write raw colors or dimensions.
- Use flex layouts for component structure and grids for calendars and tables.
- Never touch the `Examples` page or its Figma imports.

## Token application

Token application is asynchronous. After `applyToShapes`, the binding appears on a
later read, not in the same call. Verify bindings in a separate read call.

Apply tokens by name, never by copied value. The active theme resolves the final
color.

The extraction maps `--font-sans` to `font.sans` and `--font-mono` to `font.mono`.
The Penpot file additionally defines composite typography tokens (`body.base.default`,
`heading.h2`, `code.base.default`) that reference `font.family.sans`. Those composites
are created in the Penpot file itself from the CSS primitives; use them as-is and do
not recreate them from the manifest.

Supported token properties:

- Color: `fill`, `strokeColor`.
- Spacing: `rowGap`, `columnGap`, `paddingTop`, `paddingRight`, `paddingBottom`,
  `paddingLeft`.
- Sizing: `width`, `height`.
- Border radius: the four `borderRadius*` corners.
- Typography: `typography` on a text shape (sets family, size, weight, line height,
  letter spacing in one call).
- Opacity: `opacity`.
- Stroke width: `strokeWidth`.

## Variant containers

`createVariantContainer` rejects raw boards. For each variant:

1. Build the variant board.
2. Create a component from it with `createComponent`.
3. Take its `mainInstance()`.
4. Pass the main instances plus their property values to
   `penpotUtils.createVariantContainer`.

Name the container after the atom (`button`, `badge`, `sidebar-item`, `checkbox`).
Use property names that match the `Examples` blueprint, for example `variant`, `state`,
`type`.

Composites switch instance variants with `switchVariant(position, value)`.

## Session pitfalls

- Library lookups (`components.find`) can return stale or empty state right after a
  mutation batch. Create dependent components in the same call as their parents, or
  re-read the library in a fresh call.
- Old builds can leave duplicate library names. Identify ownership by component id
  prefix or by variant properties. Never remove `Examples` imports.
- Large batches can time out at the MCP layer even when they commit. After a timeout,
  re-read the page and library to confirm what committed. Do not blindly re-run.
- Never resize to zero. Use the layout literal `fix`, never `fixed`.
- Flex layout child positions can report zero until Penpot recomputes. Prefer building
  the container last over removing and re-adding flex layouts.

## Verification

After applying, check in a fresh connection:

- Each atom page has one variant container with the declared variant properties.
- Variant roots carry token bindings on fill, stroke, padding, and typography.
- Composite components hold instances (`isComponentCopyInstance`).
- The `Examples` page is untouched.
- Library has no duplicated atom names.
- Both token themes resolve correctly.