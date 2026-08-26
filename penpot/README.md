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
  `plan.generated.json` and fails when a component, source variant, or renderer is
  missing.
- `renderers.mjs` is the adjustable visual anatomy for each component family. It is
  intentionally independent of the Penpot API so it can be inspected and tested before
  it is applied to the live file.
- `foundation-overrides.mjs` records intentional tool limitations. At present,
  `font.weight.550` maps to weight 500 in Penpot because variable-font interpolation is
  unavailable there.
- `layout-presets.mjs` contains the explicit pixel geometry used by Penpot. It keeps
  the 4px-based numeric system and avoids the parent-offset/layout-collapse issue that
  affected the first attempt.

Generated JSON files are committed as reviewable snapshots. Do not edit them directly.

## Workflow

1. Run `npm run penpot:extract` after a component contract changes.
2. Update `blueprints.mjs` or `renderers.mjs` when the Penpot representation needs a
   new anatomy, variant, state, or layout rule.
3. Run `npm run penpot:check`.
4. Inspect `plan.generated.json` before applying any changes through MCP.

The eventual MCP application reads only `plan.generated.json`; it must not infer
variants or anatomy from a documentation page at mutation time.
