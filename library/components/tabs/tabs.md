# Tabs

## Purpose

Tabs switches between peer panels inside one route.

Use Tabs when only one related panel should be visible at a time.

Use route links for application navigation.

Do not use Tabs for sequential steps.

## Native basis

No native HTML element provides the complete tabs pattern.

Use `role="tablist"`, `role="tab"`, and `role="tabpanel"`.

The module manages selection, panel visibility, and roving focus.

Tabs uses automatic activation because panel content is already available without noticeable latency.

## Native Web APIs

- [WAI-ARIA Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) defines tab roles and keyboard behavior.
- [`hidden`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden) removes inactive panels from rendering and the accessibility tree.
- [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) provides keyboard focus treatment.
- [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) supports documented programmatic activation.

## Structure

Keep one selected tab.

Keep only the selected tab in the normal tab sequence.

Give every tab and panel a stable ID relationship.

```html
<div class="tabs">
  <div class="tab-list" role="tablist" aria-label="Account settings">
    <button class="tab-trigger"
            type="button"
            role="tab"
            id="tab-account"
            aria-selected="true"
            aria-controls="panel-account">
      Account
    </button>
    <button class="tab-trigger"
            type="button"
            role="tab"
            id="tab-password"
            aria-selected="false"
            aria-controls="panel-password"
            tabindex="-1">
      Password
    </button>
  </div>

  <div class="tab-content"
       role="tabpanel"
       id="panel-account"
       aria-labelledby="tab-account"
       tabindex="0">
    Account settings content.
  </div>

  <div class="tab-content"
       role="tabpanel"
       id="panel-password"
       aria-labelledby="tab-password"
       tabindex="0"
       hidden>
    Password settings content.
  </div>
</div>
```

## Orientation

Omit `aria-orientation` for horizontal Tabs.

Set `aria-orientation="vertical"` on the tablist for vertical Tabs.

The stylesheet changes layout automatically from the ARIA orientation.

Do not add inline orientation styles.

## Keyboard

| Key | Horizontal | Vertical |
| --- | --- | --- |
| `ArrowRight` | Focus and activate the next tab. | No managed action. |
| `ArrowLeft` | Focus and activate the previous tab. | No managed action. |
| `ArrowDown` | No managed action. | Focus and activate the next tab. |
| `ArrowUp` | No managed action. | Focus and activate the previous tab. |
| `Home` | Focus and activate the first enabled tab. | Focus and activate the first enabled tab. |
| `End` | Focus and activate the last enabled tab. | Focus and activate the last enabled tab. |
| `Tab` | Continue normal document focus order. | Continue normal document focus order. |

Arrow-key movement wraps through enabled tabs.

A disabled tab is skipped.

Native button activation also selects a clicked or keyboard-activated tab.

Space and Enter use the native button activation that selects the tab.

## Programmatic activation

Dispatch `tabs:activate` on the tablist when application code must select a tab.

Pass the tab ID or controlled panel ID in `detail.id`.

```js
tablist.dispatchEvent(new CustomEvent('tabs:activate', {
  detail: { id: 'tab-password' }
}));
```

The module ignores an unknown ID.

The module ignores a disabled tab.

## Variants

Use the default grouped track for a compact control-like tab set.

Use `data-variant="underline"` for an underline treatment. `line` remains a
compatibility alias for existing markup.

Both variants use the shared 36px control rhythm.

Tab labels use 14px regular tight text with `MONO:0`. Selected, hovered, focused, and disabled states use the explicit control and interactive roles.

Both variants remain square and use fast selection feedback.

## Accessibility

Give every tablist an accessible name.

Keep `aria-selected` synchronized with visible panel state.

Keep `aria-controls` and `aria-labelledby` relationships valid.

Use `tabindex="0"` on a panel only when panel content needs a focus stop.

Do not use Tabs for route navigation.

Do not lazy-load panel content when automatic activation would introduce noticeable latency.

## Runtime

Load `tabs.js` whenever Tabs appears.

Without the module, the ARIA roles do not provide panel switching behavior.
