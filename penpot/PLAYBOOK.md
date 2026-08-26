# Penpot application playbook

This file records the live Penpot application procedure and the pitfalls
discovered while building it. Read it before any Penpot mutation.

Treat this as a one-shot procedure. Do not re-derive the approach.

## One-shot principle

Run the application exactly once when the manifest and the connected file agree.

Do not plan a repeated bidirectional sync. Penpot is generated output.

Build from atoms upward. Composite components hold instances of the atoms.

## Atom-first architecture

Every component is a real Penpot library component. A component with several
states or axes is one variant container with named variant properties, exactly
like the `button` blueprint on `Examples`:

- `button` has `variant` (primary, secondary, outline, ghost, link,
  destructive), `state` (default, hover, pressed, focused), `type` (text,
  textIcon, icon).
- `badge` has `variant` (default, secondary, outline, count) and `state`
  (positive, caution, negative, running).
- `sidebar-item` has `variant` (default, compact) and `state` (default, hover,
  selected, focused).
- `checkbox`, `radio`, `switch` have one `state` axis.

Do not draw state matrices. Do not draw component sheets. Variant containers
are the deliverable.

## Composition rule

Composite components place instances of the atoms inside their own layout:

- `sidebar` holds a `brand` instance and four `sidebar-item` instances.
- `card` holds a real `button` instance in its footer.
- `icon` wraps an instance from the connected `mewa_icons` library.

Use `switchVariant(position, value)` on an instance to pick its variant.

Never redraw an atom inside a composite. Use an instance.

## Approved file structure

- One component page per component, holding one variant container or one main
  instance.
- `button`, `icon`, `badge`, `label`, `brand`, `sidebar-item`, `sidebar`,
  `card`, `checkbox`, `radio`, `switch`, `input`, `avatar`, `spinner`,
  `separator` are the atomic set.
- `mewa_icons` remains connected and is the only icon source.
- The `Examples` page and its Figma imports stay untouched.
- Two token themes, Light and Dark.

## Token application

Token application is asynchronous. After `applyToShapes`, the binding appears
on a later read, not in the same call. Read tokens in a subsequent call to
verify.

Look up tokens in active sets first, then inactive sets.

Apply by name, never by copied value. The theme changes the resolved color
later.

### Token properties

- Color: `fill`, `strokeColor`.
- Spacing: `rowGap`, `columnGap`, `paddingTop`, `paddingRight`,
  `paddingBottom`, `paddingLeft`.
- Sizing: `width`, `height`.
- Border radius: `borderRadiusTopLeft`, `borderRadiusTopRight`,
  `borderRadiusBottomRight`, `borderRadiusBottomLeft`.
- Typography: `typography` on a text shape. This sets family, size, weight,
  line height, and letter spacing in one call.
- Opacity: `opacity`.
- Stroke width: `strokeWidth`.

Use the existing predefined typography styles (`body.base.default`,
`body.base.strong`, `body.small.default`, `body.small.strong`,
`body.xsmall.strong`, `heading.hX`, `code.base.default`). Do not hand-set
font size, family, or weight.

## Pitfalls

### Variant containers need component main instances

`createVariantContainer` rejects raw boards. Create each variant as a
component with `createComponent`, take its `mainInstance()`, then build the
container from the main instances.

### Library state races across calls

Library lookups (`components.find`) occasionally return stale or empty state
right after a mutation batch. Create dependent components in the same call as
their parents, or re-read the library in a fresh call before using it.

### Duplicate library names

Old builds can leave two components with the same name. Identify ownership by
component id prefix, or by variant properties when both are variants:

- New atoms use variant properties that match the blueprint, for example
  `button` uses `[variant, state, type]`.
- Figma imports on `Examples` use different property lists. Never remove
  `Examples` imports.

### Flex layouts and layout repair

Child positions report zero until Penpot recomputes. Repairs by removing and
re-adding the flex layout are slow and can reorder children. Avoid them when a
variant container is the target; build the container last and let Penpot lay
out its variants.

### Resize and sizing literals

Never resize to zero. Use `fix` for fixed sizing, never `fixed`.

### Long executions

Large batches that create many components can time out at the MCP layer even
when they commit. After a timeout, re-read the page and library to confirm
what committed before continuing. Never blindly re-run the whole batch.

## Verification

After applying, check in a fresh connection:

- Each atomic component page has one variant container with the declared
  variant properties.
- Variant roots carry token bindings on fill, stroke, padding, and typography.
- Composite components hold instances (query with `isComponentCopyInstance`).
- `Examples` is untouched.
- Library has no duplicated atom names.
