# Penpot translation layer

This directory is the editable source for the Penpot representation of `mewa_ui`.

It does not replace the library contracts. `library/components/*`, `library/src/*`, and
`registry.json` remain the implementation source of truth. This layer extracts those
contracts into a stable, inspectable plan, then adds only the information the design
tool needs: component anatomy, atoms, variant axes, semantic tokens, and layout intent.

## Files

- `extract-contracts.mjs` reads the Markdown, CSS, and optional module for every
  component and writes `source-contracts.generated.json`.
- `blueprints.mjs` is the hand-maintained translation policy. It assigns each component
  to a specific renderer and records the meaningful variant axes.
- `compile-plan.mjs` combines the extraction and translation policy into
  `plan.generated.json` and `sync-manifest.generated.json`. It validates renderer,
  layout, source-axis, tuple, and shared-reference integrity.
- `sync-manifest.generated.json` is the normalized Penpot input. It gives each
  registered component stable keys and explicit variant axes and references.
- `renderers.mjs` is the adjustable visual anatomy for each component family. It is
  intentionally independent of the Penpot API so it can be inspected and tested before
  it is applied to the live file.
- `PLAYBOOK.md` is the live-application procedure and pitfall log. Read it before any
  Penpot mutation.
- `foundation-overrides.mjs` records intentional tool limitations.
- `layout-presets.mjs` contains the explicit pixel geometry used by Penpot.

Generated JSON files are deterministic reviewable snapshots. Do not edit them directly.

## Architecture

Penpot components are building blocks, not visual displays. Compose from atoms up:

- An atom is one Penpot library component. An atom with several axes is one variant
  container with named variant properties, exactly like the `button` blueprint on the
  `Examples` page.
- A composite is one component whose children are instances of atoms. `sidebar` holds
  `brand` and `sidebar-item` instances. `card` holds a `button` instance.
- Icons are instances from the connected `mewa_icons` library inside an `icon` atom.
- No state matrices and no component sheets. Variant containers are the deliverable.

## Workflow

1. Run `npm run penpot:extract` after a component contract changes.
2. Update `blueprints.mjs` or `renderers.mjs` when the Penpot representation needs a
   new anatomy, variant, state, or layout rule.
3. Run `npm run penpot:check`.
4. Inspect `sync-manifest.generated.json` before applying any changes through MCP.
5. Read `PLAYBOOK.md` before any live mutation.

## MCP application contract

The MCP application reads only `sync-manifest.generated.json`. It does not infer
variants, containers, or instances from a documentation page at mutation time.

Keep `Examples` unmanaged. Treat its Figma imports as authoritative blueprints for
variant-property naming, not as mutation targets.

Keep `mewa_icons` connected. It is the only icon source.

Keep one component page per component. Each page holds one variant container or one
main instance. Never put a visual matrix on a page.

Reconcile by stable library component id. Do not remove `Examples` imports.

After an MCP application, verify variant properties, token bindings, instance links,
both token themes, and the unchanged `Examples` page.
