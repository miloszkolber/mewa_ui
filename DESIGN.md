# mewa_ui design contract

This contract applies only to this standalone repository. External products may guide its visual direction, but they are not dependencies and must not be modified as part of library work.

## Foundations

- `src/base.css` owns the compact palette, semantic roles, requested typography, focus treatment, reset, and shared browser primitives.
- `src/components.css` owns component-specific layout, spacing, structure, variants, and responsive rules.
- Body sizes are 12, 14, and 16 px. Heading sizes are 16, 20, 24, and 32 px.
- Line heights are 1.2, 1.4, and 1.6. Weights are 400 and 500.
- Interface text uses the system monospace stack. Individual components must not introduce web fonts or a proportional sans-serif stack.
- The palette has monochrome, red, yellow, and green scales. Status colors never decorate neutral actions.
- Geometry is square. Shadows are forbidden. Circular geometry is limited to objects whose meaning depends on it, such as radio controls, avatars, and status dots.
- Backdrop blur belongs only to overlapping surfaces: dialogs, sheets, drawers, menus, popovers, tooltips, toasts, and sticky glass headers.
- Component-local dimensions and spacing are explicit. Do not rebuild a large semantic spacing-token taxonomy.

## Markup and behavior

Start from semantic HTML and native controls. A component must remain understandable without JavaScript wherever the platform provides a native path. Use `data-ui-*` only as stable behavior hooks; use classes for styling; use `data-state` only for `ok`, `warning`, `error`, `running`, or `progress`.

`src/components.js` exposes `MewaUI.enhance(root)` and `MewaUI.destroy(root)`. Enhancement must be idempotent, clean up listeners, and preserve native submission and navigation. Custom events use the `mewa-ui:*` prefix.

Interactive patterns follow their platform and ARIA keyboard models:

- Disclosure controls synchronize `aria-expanded`, `aria-controls`, and `hidden`.
- Tabs, menus, listboxes, toolbars, and composite choices use roving focus and the expected arrow, Home, End, Escape, and activation keys.
- Modal surfaces label their purpose, trap focus, inert background content, close with Escape, and restore focus.
- Forms keep explicit labels, descriptions, native validation, and live status announcements.
- Tables retain captions, scopes, and sorting state even when their narrow-screen presentation changes.
- Reduced-motion and forced-colors modes remain usable.

## Components

Every manifest entry has exactly one complete document in `snippets/`. Its reusable fragment is delimited by `<!-- mewa-ui-snippet:start -->` and `<!-- mewa-ui-snippet:end -->`. A component is not considered implemented until markup, styles, behavior where needed, focus treatment, narrow-screen behavior, local icons, and contract coverage agree.

The catalog loads exactly `src/base.css`, `src/components.css`, and its own catalog script. It renders only the marked fragment inside the preview, followed by that component's name, description, and copyable source. Snippets load the two stylesheets plus `src/components.js`. Do not create per-component stylesheets or scripts.

Alert owns both inline and blocking-dialog variants; do not split presentation modes that express the same feedback concept into separate manifest entries. Ghost buttons are the default low-emphasis action inside calendars, date pickers, toolbars, and similar compound controls.

## Icons

Lucide is the primary icon source. Symbols live in `src/lucide.svg`, inherit `currentColor`, and use the shared stroke treatment. Decorative icons use `aria-hidden="true"`; icon-only controls have an `aria-label` or equivalent accessible name. Product marks and content illustration belong to consuming services.

## Layouts

Two service shells are supported:

- `.ui-shell.ui-shell--rail` contains `.ui-frame`, `.ui-rail`, and `.ui-shell-main`; its full vertical navigation becomes a compact sticky bottom row on narrow screens.
- `.ui-shell.ui-shell--top` contains `.ui-frame`, `.ui-topbar`, `.ui-topnav`, and `.ui-shell-main`; route links scroll inside the horizontal bar rather than widening the page.

Both layout documents are complete application templates with identity, navigation, account/actions, headings, status content, and responsive behavior. They are not empty shell diagrams.

## Contribution checklist

1. Add or update the manifest entry and matching marked snippet together.
2. Use existing semantic roles and the four color scales; add a foundation token only when multiple unrelated components need it.
3. Add required Lucide symbols locally.
4. Cover runtime behavior in `tests/runtime-contract.test.js` and repository contracts in `tests/catalog-contract.test.js`.
5. Inspect desktop, 200% zoom, keyboard-only operation, and a 320–390 px viewport in a real browser.
6. Run both Node contract suites before handoff.
