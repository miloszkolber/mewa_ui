# Penpot translation layer

This directory is the editable source for the Penpot representation of `mewa_ui`.

It does not replace the library contracts. `library/components/*`, `library/src/*`, and
`registry.json` remain the implementation source of truth. This layer extracts those
contracts into a stable, inspectable plan, then adds only the information the design
tool needs: component anatomy, master variants, state matrices, semantic tokens, and
layout intent.

## Files

- `extract-contracts.mjs` reads the Markdown, CSS, and optional module for every
  component and writes `source-contracts.generated.json`.
- `blueprints.mjs` is the hand-maintained translation policy. It assigns each component
  to a specific renderer and records the meaningful matrix axes. It deliberately has no
  generic fallback renderer.
- `compile-plan.mjs` combines the extraction and translation policy into
  `plan.generated.json` and `sync-manifest.generated.json`. It validates renderer,
  layout, source-axis, tuple, and shared-reference integrity.
- `sync-manifest.generated.json` is the normalized Penpot input. It gives each
  registered component stable keys, explicit master and matrix container records,
  covered variant tuples, and shared component instance references.
- `renderers.mjs` is the adjustable visual anatomy for each component family. It is
  intentionally independent of the Penpot API so it can be inspected and tested before
  it is applied to the live file.
- `foundation-overrides.mjs` records intentional tool limitations. At present,
  `font.weight.550` maps to weight 500 in Penpot because variable-font interpolation is
  unavailable there.
- `layout-presets.mjs` contains the explicit pixel geometry used by Penpot. It keeps
  the 4px-based numeric system and avoids the parent-offset/layout-collapse issue that
  affected the first attempt.

Generated JSON files are deterministic reviewable snapshots. Do not edit them directly.

## Workflow

1. Run `npm run penpot:extract` after a component contract changes.
2. Update `blueprints.mjs` or `renderers.mjs` when the Penpot representation needs a
   new anatomy, variant, state, or layout rule.
3. Run `npm run penpot:check`.
4. Inspect `sync-manifest.generated.json` before applying any changes through MCP.

## MCP application contract

Read `PLAYBOOK.md` before any live Penpot mutation. It records the one-shot
application procedure, the approved file structure, and every tool limitation
discovered during application.

The MCP application reads only `sync-manifest.generated.json`. It does not infer variants, containers, or shared instances from a documentation page at mutation time.

Use the shared plugin-data namespace `mewa.ui`. Store each manifest `key` as shared plugin data named `key` on its managed page root, component, variant, and instance.

Keep `Examples` unmanaged. Treat its Figma imports as visual references only.

Keep reusable atoms on `01_SHARED`. Use linked instances of those atoms for referenced anatomy parts.

Keep one managed component sheet on each component page. Use Flexbox for intrinsic component anatomy. Use Grid for state and variant matrices. Use a linked component instance in each matrix cell.

Reconcile managed objects by stable key. Update an existing managed object before creating a replacement. Remove only stale objects in the `mewa.ui` namespace after the new graph validates. Never remove unmanaged objects.

After an MCP application, verify every registered component page, all shared references, both token themes, component-instance links, Flexbox and Grid usage, and the unchanged `Examples` page.
