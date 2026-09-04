# Maintainer guide

Use this file for repository maintenance.

Read `library/DESIGN.md` before you change the library.

Read the relevant file in `library/system/` before you change appearance, composition, or behavior.

## Repository scope

Change only this repository unless the task names a consumer repository.

Treat live-mount consumers as immediately affected.

Keep changes additive when a current consumer can still use the old contract.

Document a breaking change before you remove a current hook.

Do not edit deployment files from this repository.

## Source ownership

Edit `library/src/base.css` for static foundation primitives.

Edit `scripts/color-palette.mjs` for solid and alpha palette primitives.

Edit `library/src/tokens.css` for semantic light and dark roles.

Edit `library/components/{slug}/{slug}.md` for component implementation guidance.

Edit `library/components/{slug}/{slug}.css` for component presentation.

Edit `library/components/{slug}/{slug}.js` for component enhancement behavior.

Edit `library/runtime/` for the shared controller and automatic enhancement lifecycle.

Edit `library/adapters/` for optional framework integration.

Edit `docs/{slug}.html` for the rendered component reference.

Edit `registry.json` for component selection metadata and token purposes.

Edit `library/system/` for selection and composition rules.

Edit `README.md` for the human repository overview.

Edit `llms.txt` for machine routing.

Keep `library/` as the only authored implementation tree.

Keep optional framework adapters in separate generated packages.

Generate distribution copies only under ignored `dist/`.

Do not hand-edit generated distribution files.

Do not add complete shell templates.

## Palette workflow

Treat `scripts/color-palette.mjs` as the source of the build-time HCT palette recipe.

Treat the marked color-palette block in `library/src/base.css` as generated output.

Keep Material Color Utilities build-only and ship every authored CSS color as modern space-separated `rgb()`.

Run `bun run palette:write` after palette recipe changes.

Run `bun run palette:check` before handoff.

Do not hand-edit the generated palette block.

## Catalog workflow

Treat `registry.json` as the source of component selection metadata.

Treat `library/system/components.md` as generated output.

Treat the semantic token reference in `library/system/foundations.md` as generated output.

Run `bun run catalog:write` after registry selection metadata changes.

Run `bun run catalog:check` before handoff.

Do not hand-edit generated sections.

## Distribution workflow

Treat `registry.json` as the distribution manifest source.

Keep component dependencies explicit in the registry.

Run `bun run docs:write` after component stylesheet changes.

Run `bun run build` to generate `dist/mewa-ui`, `dist/mewa-icons`, and `dist/mewa-svelte`.

Keep fonts and icons optional in the core package.

Keep the core package free of runtime dependencies.

Keep framework packages as optional adapters with peer dependencies.

Keep Bun as the only repository JavaScript toolchain.

Compile the Svelte adapter directly with `svelte/compiler`.

Do not add Vite, SvelteKit, or another JavaScript build tool.

Keep release packages usable without npm.

Publish release archives from a version tag through GitHub Actions.

Do not publish this repository to the npm registry.

## Document roles

Keep `README.md` descriptive and written for people.

Keep `docs/` descriptive and example-focused.

Keep `library/DESIGN.md`, `library/system/`, and component Markdown instructional.

Keep `AGENTS.md` and `llms.txt` concise and action-oriented.

Keep machine-readable descriptions in `registry.json`.

Do not turn `README.md` into an agent checklist.

Do not copy implementation instructions into descriptive documentation.

## Change sequence

1. Identify the authoritative file.
2. Read the current component skill.
3. Read the current stylesheet and module.
4. Read the matching static documentation page.
5. Read the relevant system specification.
6. Inspect consumers when the change can break a current hook.
7. Make the smallest complete change.
8. Update every affected contract.
9. Add or update a regression test.
10. Run the validation commands.
11. Inspect the result in a browser when markup or CSS changes.
12. Record any unverified behavior in the handoff.

## Component changes

Keep each component in `library/components/{slug}/`.

Keep one Markdown skill in each component folder.

Keep one stylesheet in each component folder.

Keep one same-name module only when the component needs JavaScript.

Do not add extra reference files inside a component folder.

Keep component selection metadata in `registry.json`.

State the native basis in each component skill.

State the native Web APIs in each component skill.

State the supported structure or provide a complete HTML example.

State accessibility requirements.

State keyboard or event behavior when the component manages interaction.

State the no-JavaScript behavior for an enhanced component.

Keep canonical examples complete.

Use explicit button types.

Use stable IDs in examples.

Do not use inline styles in canonical examples.

Do not document an unimplemented variant.

## New component gate

Confirm that two real tasks need the same responsibility.

Confirm that composition cannot solve the task cleanly.

Confirm that the component has a stable semantic basis.

Confirm that the component has one clear responsibility.

Confirm that the keyboard model is documented.

Confirm that the fallback is documented.

Add the component files.

Add the registry entry.

Add the static documentation page.

Run `bun run catalog:write`.

Add the page to the documentation router.

Add tests for source parity and behavior.

Do not add a proposal to the shipped inventory.

## CSS changes

Use the current cascade layers.

Use semantic color roles.

Use current spacing and size tokens.

Use the canonical scale where `100` equals 4px.

Use zero-padded color step labels from `000` through `950` and the four-digit endpoint `1000`.

Use square geometry.

Use borders instead of shadows.

Use blur only on approved sticky shell chrome.

Use the fast motion primitives for subtle visual state feedback.

Transition only color, background color, border color, opacity, and small state indicators.

Use the spatial motion duration for Dialog, Alert Dialog, Command Palette, Sheet, and Sidebar geometry.

Use only subtle opacity, offset, scale, slide, or width changes for spatial motion.

Keep direct manipulation, scrolling, and other layout changes immediate.

Respect `prefers-reduced-motion`.

Keep Spinner rotation as the only continuous animation exception.

Support increased contrast.

Support forced colors.

Use rem units for shared responsive breakpoints.

Keep media-query literals aligned with the named breakpoint tokens.

Do not add a raw color to a component.

Do not add a general utility framework.

Do not style a consumer-specific selector in a component stylesheet.

Do not add an unapproved global canvas width.

## JavaScript changes

Use a native API before a custom replacement.

Keep the module as an ES module.

Keep initialization idempotent.

Support markup inserted after navigation.

Export `enhance` and `behavior` from every component module.

Use `library/runtime/enhancer.js` for document-wide insertion handling.

Keep component observers scoped to their own changing content.

Keep component imports safe when no DOM exists.

Synchronize ARIA state with visual state.

Restore focus when the component contract requires it.

Dispatch only documented events.

Keep native form and navigation behavior.

Do not add a core runtime dependency.

Do not add a polling loop.

Do not couple core controllers to a framework lifecycle.

## Shell changes

Keep shell recipes in `library/system/layouts.md`.

Compose shells from App Shell, Sidebar, Layout, navigation components, and native landmarks.

Keep page-specific shell CSS in consumers.

Keep route navigation as native links.

Keep the current route on `aria-current="page"`.

Keep one main landmark.

Keep the skip link first.

Do not duplicate the product brand in adjacent shell regions.

Do not add a complete shell template to the library.

## Documentation changes

Use ASD-STE100 style.

Use active voice.

Use present tense.

Write one instruction in each sentence.

Keep each rule self-contained.

Use the exact API names.

Keep examples short.

Avoid deep heading nesting.

Keep `library/system/components.md` generated from `registry.json`.

Keep `llms.txt` short.

Do not copy the complete design contract into another file.

## Required validation

Run `bun run test`.

Run `bun run package:check`.

Run `bun run palette:check`.

Run `bun run catalog:check`.

Run `bun run test:browser` when Chromium is available.

Check changed HTML with the keyboard.

Check changed HTML at 200 percent zoom.

Check changed HTML at 320px width.

Check light and dark themes.

Check increased contrast.

Check forced colors.

Check the no-JavaScript path.

Check the browser console.
