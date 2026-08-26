# Penpot application playbook

This file records the live Penpot application procedure and the pitfalls
discovered while building it. Read it before any Penpot mutation.

Treat this as a one-shot procedure. Do not re-derive the approach.

## One-shot principle

Run the application exactly once when the manifest and the connected file agree.

Do not plan a repeated bidirectional sync. Penpot is generated output.

After the application, review the file for layout collapse, section order,
token binding, link integrity, and theme switching. Record only corrections
here.

To regenerate after an approval, rebuild only the affected component sheet from
the same procedure. Never re-run the whole file.

## Approved result

The connected file has:

- 59 component pages with one managed sheet per page.
- One component master and one variant-instance matrix per sheet.
- Nine reusable atoms on the `01_SHARED` page.
- Semantic token bindings on fills, strokes, and text.
- Flex for anatomy, Grid for matrices.
- Two token themes, Light and Dark.
- The `Examples` page unchanged.

## Page contract

Use one managed sheet per component page. The sheet is the only board on the
page.

Keep the sheet board named `{Title} / Component sheet`.

Keep the child order:

1. `Page title` text.
2. `Section` text, `Variant and state coverage`.
3. `Variant state matrix` board.
4. `Section` text, `Component master`.
5. `{Title} / Mewa / {Title}` main instance.

Keep the master main instance linked to the library component.

Keep the matrix inside one grid board with flex-track columns and fixed-width
rows.

Keep one linked component instance in every matrix cell.

Keep one mawa-monospaced variant label above the instance in each cell.

## Token application

Look up tokens in active sets first, then inactive sets.

Apply color tokens with `applyToShapes(shape, ['fill'])` or `['strokeColor']`.

Apply stroke width tokens with `['strokeWidth']`.

Apply text color with `['fill']` on text shapes.

Never write a raw color when a semantic token covers the intent.

## Pitfalls

### Flexible layout does not recompute automatically

After building children, a flex board can report child positions all at zero.

Fix by removing and re-adding the flex layout, waiting for Penpot to settle,
then continuing. Use a delay of at least 250 ms after the re-add.

### Child order resets after a layout repair

A layout repair can reorder children. After the repair, set the intended order
with `setParentIndex` and wait again.

### The resize zero value is invalid

Do not call `resize(width, 0)` or `resize(0, height)`. Penpot rejects zero.

Give a board a real size or set the sizing to `auto` and let content drive it.

### The horizontal sizing literal is `fix`

Use the layout literal `fix` for fixed sizing. `fixed` is invalid.

Use `auto` for hug. Use `fill` to stretch in a parent flex.

### Font weight 500 is unavailable on loaded Geist

The loaded Geist variant does not support every weight. Use 600 for strong
text in Penpot, or map the CSS 550 strong weight to 600.

Keep that mapping in the renderer. Do not change the source CSS.

### Token application is by name, not by id

When a set is inactive, apply by name so the active theme still changes the
color later.

### Matrix geometry must be explicit

Compute the matrix width as cell width times columns, plus gap times column
count minus one, plus padding. Compute the matrix height from rows, row gap,
and padding.

Do not reuse the master width for the matrix.

### Component instance overrides

Set instance child properties after instantiation to show a variant. Instance
child styles remain bound to the master and update with it.

For a collapsed layout, resize inner regions when the instance root shrinks.

### Specialized renderers beat a generic template

Write a renderer per component family, aligned with `renderers.mjs` anatomy.

Do not derive component structure from prose alone. Use the canonical markup
tree and the component CSS as the source.

## Verification

After applying, check:

- Text, surface, and border tokens resolve in both themes.
- All sheets have one grid matrix and one linked master instance.
- Correct section order.
- No zero-sized or collapsed boards.
- No overlapping children at origin.
- `Examples` untouched.
- Library component count equals shared atoms plus registered components.
