# Tree View

## Purpose

Tree View presents hierarchical data with expandable branches and managed keyboard navigation.

Use Tree View when parent and child relationships must remain visible while users browse the hierarchy.

Use Collapsible for one disclosure.

Use a normal nested list when managed tree keyboard behavior is unnecessary.

Do not use Tree View for flat application routes.

## Visual states

Tree items expose selected, disabled, hover, and focus treatment through native ARIA state and the shared control, border, and ring roles.

Tree View also includes the structural `.tree-indicator` subprimitive. Use `data-variant="line"`, `branch`, `first`, `last`, or `overflow` for connector and continuation geometry. It is not a separate registry component.

## Native basis

Tree View uses nested lists with `role="tree"`, `role="treeitem"`, and `role="group"`.

Native `<details>` and `<summary>` elements provide branch disclosure.

The module normalizes ARIA state and manages tree focus movement.

## Native Web APIs

- [`<ul>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul) provides nested list structure.
- [`<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) provides native branch disclosure.
- [`<summary>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary) provides the branch trigger.
- [WAI-ARIA Tree View pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) defines tree roles and keyboard movement.

## Structure

```html
<ul class="tree" role="tree" aria-label="Files">
  <li class="tree-item" role="treeitem" aria-expanded="true">
    <details class="tree-branch" open>
      <summary class="tree-branch-trigger">
        <i class="ri-arrow-down-s-line" aria-hidden="true"></i>
        <i class="ri-folder-line" aria-hidden="true"></i>
        <span>src</span>
      </summary>
      <ul class="tree-group" role="group">
        <li class="tree-item" role="treeitem">
          <span class="tree-leaf">
            <i class="ri-file-line" aria-hidden="true"></i>
            <span>index.js</span>
          </span>
        </li>
      </ul>
    </details>
  </li>

  <li class="tree-item" role="treeitem">
    <span class="tree-leaf">
      <i class="ri-file-line" aria-hidden="true"></i>
      <span>package.json</span>
    </span>
  </li>
</ul>
```

Keep `role="treeitem"` on the list item.

Keep nested child lists at `role="group"`.

The module removes redundant treeitem roles from branch controls when legacy markup includes them.

## Behavior

The module creates one roving tab stop among visible branch and leaf controls.

Opening or closing a native branch synchronizes `aria-expanded` on its tree item.

Closing a branch moves focus back to its branch trigger when focus was inside the closing branch.

Arrow Down moves to the next visible item.

Arrow Up moves to the previous visible item.

Home moves to the first visible item.

End moves to the last visible item.

Arrow Right opens a closed branch.

Arrow Right moves to the first visible child when the branch is already open.

Arrow Left closes an open branch.

Arrow Left moves to the parent item when the branch is already closed or the item is a leaf.

Selection feedback uses the shared fast motion primitives. Expansion and collapse remain immediate.

## Activation

Native Summary activation toggles a branch with Enter or Space.

Tree View does not define a custom activation action for a leaf.

Add application-owned leaf activation only when the product requires it.

Do not make a leaf look actionable when it has no action.

## Accessibility

Give the root tree an accessible name.

Keep branch state synchronized with `aria-expanded` on the tree item.

Do not put `aria-expanded` on leaf items.

Keep nested groups inside their owning branch.

Hide decorative folder, file, and chevron icons from assistive technology.

Keep one visible tree control in the normal Tab sequence.

Do not combine tree navigation and route-navigation semantics without a documented application contract.

## Runtime

Load `tree-view.js` whenever Tree View appears.

Native disclosure remains available without the module, but the documented tree keyboard model and roving focus require JavaScript.
