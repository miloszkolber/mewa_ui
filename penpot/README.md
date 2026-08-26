# Penpot translation layer

This directory is the editable source for the Penpot representation of `mewa_ui`.

It does not replace the library contracts. `library/components/*`, `library/src/*`, and
`registry.json` remain the implementation source of truth. This layer extracts those
contracts into one stable, inspectable manifest, then adds only the information the
design tool needs: component anatomy, atoms, variant axes, semantic tokens, and
composition intent.

## Pipeline

The pipeline is intentionally small. Three scripts read the library and produce three
deterministic JSON snapshots.

1. `extract-contracts.mjs` reads the Markdown, CSS, and optional module for every
   component and writes `source-contracts.generated.json`.
2. `extract-foundations.mjs` reads `library/src/base.css` and `tokens.css` and writes
   `foundations.generated.json`.
3. `compile-plan.mjs` combines both extractions with the visual policy and writes
   `sync-manifest.generated.json` — the only input the Penpot application consumes.

Run the full pipeline with `npm run penpot:extract`. Check freshness with
`npm run penpot:check`.

## Files

- `extract-contracts.mjs` — component contract extraction (markup, CSS states, data
  axes, canonical structure).
- `extract-foundations.mjs` — token extraction (core, light, dark sets).
- `compile-plan.mjs` — manifest compilation and validation. Derives each renderer key
  from the contract id, folds contract axes and CSS states into the renderer-declared
  axes, and validates coverage and shared references.
- `renderers.mjs` — the hand-maintained visual policy. Each component family declares
  its intent, anatomy (named parts with visual roles), and variant axes. It is
  independent of the Penpot API so it can be reviewed and tested before application.
- `visual-roles.mjs` — maps each anatomy role to its semantic token style.
- `foundation-overrides.mjs` — records intentional tool limitations, such as the
  550 → 500 weight fallback.
- `PLAYBOOK.md` — the live-application procedure and pitfall log. Read it before any
  Penpot mutation.
- `AGENTS.md` — concise guidance for agents that build or maintain Penpot components.

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
2. Update `renderers.mjs` when the Penpot representation needs a new anatomy, variant,
   or state rule.
3. Run `npm run penpot:check`.
4. Inspect `sync-manifest.generated.json` before applying any changes through MCP.
5. Read `PLAYBOOK.md` and `AGENTS.md` before any live mutation.

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