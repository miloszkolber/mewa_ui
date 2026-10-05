# Maintainer guide

Use this file for repository maintenance, not consumer implementation.

Use `library/DESIGN.md#read-for-the-task` to select only relevant system sections and component contracts.

## Repository scope

Change only this repository unless the task names a consumer repository.

Do not assume active consumers of this experimental library.

Document a breaking change before removing a current hook.

For authorized breaking changes, update implementation, registry, examples, and checks together instead of retaining unsupported compatibility hooks.

Preserve registry v3 fields and public aliases with `registry.schema.json` and catalog checks.

Do not remove duplicated public registry fields or create compatibility aliases without a documented migration decision.

Do not edit deployment files from this repository.

## Source ownership

| Change | Authored owner |
| --- | --- |
| Static foundation primitives | `library/src/base.css`, outside its generated palette block |
| Solid and alpha palette recipe | `scripts/color-palette.mjs` |
| Semantic light and dark roles | `library/src/tokens.css` |
| Component contract, presentation, or behavior | `library/components/{category}/{slug}/{slug}.{md,css,js}` |
| Shared controller and automatic enhancement lifecycle | `library/runtime/` |
| Optional framework integration | `library/adapters/` |
| Component selection, dependencies, assets, and token purposes | `registry.json` |
| Visual rules, selection, composition, shells, and shared accessibility | The relevant authored section in `library/system/` |
| Human overview or machine routing | `README.md` or `llms.txt`, respectively |
| Source markup fixtures | `docs/specimens.json`; these are not selectable playground examples |
| Supported public documentation attributes | `docs/catalog.mjs` |
| Anatomy, explicit defaults, content slots, and nested-part ownership | `docs/component-model.mjs` |
| Shared live-playground and static-export property changes | `docs/model-operations.mjs` |

Keep `library/` as the only authored implementation tree.

Generate distribution copies only under ignored `dist/`; do not hand-edit them.

## Generation and distribution

Generate both HTML pages and documentation bundles with `bun run docs:write` after their sources or component stylesheets change.

Do not hand-edit generated documentation.

`bun run palette:write` updates only the marked palette block in `library/src/base.css` after recipe changes.

Keep Material Color Utilities build-only.

`bun run catalog:write` updates only `TOKEN-REFERENCE` in foundations and `REGISTRY-FIELDS` in components after registry or generator changes.

The rest of `library/system/components.md` is authored selection and implementation guidance, not generated output.

Do not hand-edit either generated catalog block.

The build uses `registry.json` to generate manifests and dependency-aware entries.

Keep dependencies explicit and preserve registry dependency order in flat component CSS.

Run `bun run build` to generate `dist/mewa-ui`, `dist/mewa-icons`, and `dist/mewa-svelte`.

Keep core runtime dependencies absent and fonts/icons optional.

Ship optional framework adapters in separate packages with peer dependencies.

Keep Bun as the only repository JavaScript toolchain.

Compile client-side Svelte and rune modules directly with `svelte/compiler` through the Bun plugin.

Do not add Node, npm, Vite, SvelteKit, or another JavaScript build tool.

Keep release packages usable without npm.

Publish release archives from a version tag through GitHub Actions, not to the npm registry.

## Document roles and writing

Keep `README.md` descriptive and written for people.

Keep `library/DESIGN.md`, `library/system/`, and component Markdown instructional.

Keep `AGENTS.md` and `llms.txt` concise and action-oriented.

Keep machine-readable descriptions in `registry.json`.

Do not turn the README into an agent checklist or copy implementation instructions into descriptive documentation.

Use ASD-STE100 style, active voice, and present tense.

Write one instruction per sentence and keep each rule self-contained.

Use exact class, attribute, token, and path names.

Avoid unclear pronouns, idioms, rhetorical language, deep heading nesting, and long examples.

Do not copy the complete design contract into another file.

## Documentation views

`docs/preview.html` contains one interactive playground per component anchor and a static rendered Markdown presentation for Typography.

`docs/figma.html` contains an inert grid of isolated visual properties and variants for Figma import.

Keep its theme picker outside specimens and exclude behavior-only properties.

Generate both views from shared definitions, not from playground DOM.

Keep documentation modules separate from library implementation and use one selected theme in each view.

Use registry categories in both page groupings.

Keep component navigation only in the playground; do not link the two views from their page chrome.

Expose only implemented attributes with lowercase property labels.

Keep native hover and focus in the live preview; never add a generic hover/focus state selector.

Model persistent conditions as boolean properties.

Never infer a container's state from its first button or offer placeholder/single-option controls.

Property controls must describe the rendered component, not merely emit attributes.

Test required visual combinations independently of the model inventory; iterating declared controls cannot detect an omitted property.

Verify simultaneous nested changes, native interaction readback, and draft preservation.

## Change and verification

1. Identify the authoritative owner and read current sources plus the relevant system sections.
2. For component changes, read its contract, stylesheet/module, and matching `docs/preview.html#preview-{slug}` section.
3. Use `library/system/components.md#new-component-gate` before adding a component.
4. Inspect actual consumers when a change can break a current hook.
5. Make the smallest complete change and update affected contracts and meaningful regression coverage.
6. Run the applicable checks and inspect changed markup or CSS in a browser.
7. Record executed commands, failures, and unverified behavior in the handoff.

Run `bun run test`, `bun run package:check`, `bun run palette:check`, and `bun run catalog:check` before handoff.

Run `bun run lint`, `bun run format:check`, and `bun run typecheck` alongside contract checks.

Run `bun run test:browser` when Chromium is available.

Use `library/system/accessibility.md#test-procedure` for changed HTML acceptance, including keyboard, zoom, width, contrast modes, and native fallback.

Check light/dark themes and the browser console; reject preview/implementation disagreement.

For runtime changes, read `library/runtime/README.md` and `library/system/components.md#enhancement-implementation`.

Verify reset with trusted native button activation and a later canceling listener.

Run `bun run measure` after building for separately compressed complete CSS, flat entries, controller, automatic, and runtime responses.

Run `bun tests/docs-visual-review.mjs` with `PUPPETEER_EXECUTABLE_PATH` for catalog-wide captures under ignored `screenshots/review/`.

Inspect the images; a completed capture is not a visual review.

Use `tests/agent-evaluation.md` for fresh consumer guidance evaluation and record only tasks actually run.
