# mewa_ui design contract

mewa_ui is a technical, restrained interface system with square geometry, monochrome surfaces, structural borders, and status color.

This contract applies to library changes and consumer interfaces.

## System boundaries

A component is a reusable control or content region.

A pattern composes components for a repeated task.

A shell composes application chrome.

Shell recipes are compositions, not complete shipped layout templates.

The library owns shared appearance, semantics, and interaction contracts.

The consumer owns routes, business rules, application state, and page-specific layout hooks.

The registry owns component selection metadata.

Generated archive metadata projects the same selection data and packaged asset paths.

The selected component Markdown owns exact markup, keyboard, focus, state, events, and fallback.

Stylesheets and modules define the executable contract.

Start with native controls and the documented simpler fallback.

Use only documented APIs; do not invent classes, `data-*` hooks, events, or framework bindings.

## Read for the task

Read only the sections needed for the task.

Follow another route only when the task crosses its responsibility.

| When the task changes | Read |
| --- | --- |
| Control selection or replacement | [Components: Selection order](system/components.md#selection-order), the relevant family section, then candidate metadata and the selected contract. |
| Component markup or state | The selected `library/components/{category}/{slug}/{slug}.md` and [Components: Implementation](system/components.md#implementation). |
| Visual rules or tokens | The relevant [Foundations](system/foundations.md) section and the selected component presentation contract. |
| A repeated region | The matching [Patterns](system/patterns.md) section and contracts for the components used. |
| Application chrome | [Layouts: Choose a shell](system/layouts.md#choose-a-shell), the selected recipe, and its component contracts. |
| Interaction or accessibility | The relevant [Accessibility](system/accessibility.md) sections and selected keyboard, focus, and fallback contract. |
| Enhanced markup mount, update, insertion, or removal | [Runtime: Application lifecycle](runtime/README.md#application-lifecycle) and the selected component contract. |
| A library component | Source-checkout `AGENTS.md`, [Components: Component contract](system/components.md#component-contract), and the relevant implementation sources. |
| Packaging or routing only | Source-checkout `AGENTS.md`, registry/schema, builder/catalog, and package/system tests; not every component contract. |

An isolated control does not require a shell or pattern selection.

Reusing an implemented variant does not require reading the complete foundations reference.

Read a nested component contract when writing its markup or extending its API.

An asset dependency alone does not require reading that dependency's entire contract.

## Resolve metadata and assets

Read paths are relative to the checkout or extracted core-package root; Markdown links are relative to their file.

In a source checkout, read selected `registry.json` entries for selection fields, `files.skill`, exact source assets, and dependencies.

Source registry v3 and `library/src/` instructions apply only to a source checkout.

In a generated core archive, find candidates in `components/index.md`.

Read only selected `components/{slug}.json` records and their `component.contractLocal` Markdown.

Use `manifest.json` for the full inventory or its `guidance` paths when needed.

Keep `useWhen`, `avoidWhen`, `fallback`, `nativeBasis`, and `jsMode` in the selection decision.

Load packaged foundations and executable entries from the selected metadata, not source CSS or JavaScript paths printed in source examples.

Preserve declared dependency order and the selected contract's no-JavaScript behavior.

SVG assets are optional in the separate `mewa-icons` archive, not under the core package's `library/src/icons/`.

Use [Icon: Inline SVG](components/primitives/icon/icon.md#inline-svg) when resolving icon assets.

Old archives without local contracts require a matching source checkout or the immutable `contract` URL when available.

Do not substitute contracts from another revision.

Ordinary Markdown/JSON readers and native file search are sufficient; no particular agent framework, context service, or transport is required.
