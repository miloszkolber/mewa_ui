# Maintainer guide

Use this file for repository maintenance.

Read `DESIGN.md` before you change the library.

Read the relevant file in `system/` before you change appearance, composition, or behavior.

## Repository scope

Change only this repository unless the task names a consumer repository.

Treat live-mount consumers as immediately affected.

Keep changes additive when a current consumer can still use the old contract.

Document a breaking change before you remove a current hook.

Do not edit deployment files from this repository.

Read `CONSUMERS.md` before you plan a consumer migration.

## Source ownership

Edit `src/base.css` for static foundation primitives.

Edit `src/tokens.css` for semantic light and dark roles.

Edit `components/{slug}/{slug}.md` for the exact component contract.

Edit `components/{slug}/{slug}.css` for component presentation.

Edit `components/{slug}/{slug}.js` for component enhancement behavior.

Edit `docs/{slug}.html` for the rendered component reference.

Edit `registry.json` for machine inventory metadata.

Edit `system/` for selection and composition rules.

Edit `layouts/` for complete reference compositions.

Edit `README.md` for the human repository overview.

Edit `llms.txt` for machine routing.

Do not create a second source tree.

Do not add framework wrappers.

Do not add generated component copies.

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

Keep each component in `components/{slug}/`.

Keep one Markdown skill in each component folder.

Keep one stylesheet in each component folder.

Keep one module only when the component needs JavaScript.

Do not add extra reference files inside a component folder.

State the native basis in each component skill.

State the native Web APIs in each component skill.

State the supported structure.

State the supported attributes.

State the keyboard behavior for an interactive component.

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

Confirm that the no-JavaScript behavior is documented.

Add the skill.

Add the stylesheet.

Add the module only when required.

Add the static documentation page.

Add the registry entry.

Add the README inventory row.

Add the machine catalog entry in `system/components.md`.

Add the page to the documentation router.

Add tests for source parity and behavior.

Do not add a proposal to the shipped inventory.

## CSS changes

Use the current cascade layers.

Use semantic color roles.

Use current spacing and size tokens.

Use square geometry.

Use borders instead of shadows.

Use blur only on approved sticky shell chrome.

Keep state changes immediate.

Keep Spinner rotation as the only animation exception.

Support increased contrast.

Support forced colors.

Use rem units for media breakpoints.

Do not add a raw color to a component or layout.

Do not add a general utility framework.

Do not style a consumer-specific class in a component stylesheet.

## JavaScript changes

Use a native API before a custom replacement.

Keep the module as an ES module.

Keep initialization idempotent.

Support markup inserted after navigation.

Synchronize ARIA state with visual state.

Restore focus when the component contract requires it.

Dispatch only documented events.

Keep native form and navigation behavior.

Do not add a runtime dependency.

Do not add a polling loop.

Do not add a framework lifecycle.

## Layout changes

Treat App Shell and Sidebar as components.

Treat `layouts/` as complete reference compositions.

Maintain two shell families.

Keep `app-shell-sidebar.html` as a branded sidebar composition.

Keep layout classes under the `layout-` prefix.

Keep layout CSS limited to composition.

Keep route navigation as native links.

Keep the current route on `aria-current="page"`.

Keep one main landmark.

Keep the skip link first.

Do not duplicate the product brand in adjacent shell regions.

Do not create a third shell family for a style variant.

## Documentation changes

Use ASD-STE100 style.

Use active voice.

Use present tense.

Write one instruction in each sentence.

Keep each rule self-contained.

Use the exact API names.

Keep examples short.

Avoid deep heading nesting.

Keep `system/components.md` aligned with `registry.json`.

Keep `llms.txt` short.

Do not copy the complete design contract into another file.

## Required validation

Run `npm test`.

Run `npm run test:browser` when Chromium is available.

Check changed HTML with the keyboard.

Check changed HTML at 200% zoom.

Check changed HTML at 320px width.

Check light and dark themes.

Check increased contrast.

Check forced colors.

Check the no-JavaScript path.

Check the browser console.
