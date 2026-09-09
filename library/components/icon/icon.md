# Icon

## Purpose

Icon presents a local Remix Icon glyph as supporting visual information.

Use Icon beside a visible label or inside a familiar icon-only control.

Do not use Icon as the only explanation for an unfamiliar action or status.

Do not load remote icon assets.

## Native basis

Inline SVG copied from `library/src/icons/` is the complete no-JavaScript path.

Remix assets use `name-line.svg` for outlined icons and `name-fill.svg` for filled icons.

The `ri-*` class naming follows the official Remix Icon convention.

Icon has no component JavaScript module.

## Native Web APIs

- [`<svg>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg) provides scalable local vector graphics.
- [`currentColor`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#currentcolor_keyword) lets the icon inherit the surrounding text color.
- [`aria-hidden`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden) removes decorative icons from the accessibility tree.
- [`role="img"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/img_role) can expose a standalone meaningful icon when visible text cannot do so.

## Inline SVG

Copy the matching `-line` or `-fill` file from `library/src/icons/`.

Keep decorative state explicit.

```html
<svg aria-hidden="true"
     viewBox="0 0 24 24"
     fill="currentColor"
     xmlns="http://www.w3.org/2000/svg">
  <path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6147 17.2475 15.8748 16.0248L16.0247 15.8748Z"/>
</svg>
```

Do not copy an SVG from a remote CDN when the same icon exists in `library/src/icons/`.

## Local class hook

Use the official Remix class when a host provides a local SVG loader or the Remix stylesheet.

```html
<i class="ri-search-line" aria-hidden="true"></i>
```

Use the `-line` class for the normal outlined state and the `-fill` class for a selected or active state.

The loader belongs to the documentation site or consuming application.

The loader is not part of the Icon component runtime.

Do not make a component depend on a documentation-site loader.

## Sizes

Use `data-size="xs"` for 12px.

Omit `data-size` for the 16px default.

Use `data-size="md"` for 20px.

Use `data-size="lg"` for 24px.

Use `data-size="xl"` for 32px.

```html
<i class="ri-database-2-line" data-size="lg" aria-hidden="true"></i>
```

Use the size defined by the containing component when Icon sits inside a Button, Toolbar, or other control.

Do not add inline width and height styles to canonical examples.

Do not create arbitrary icon sizes when a documented size fits.

## Line and fill variants

Choose the variant from the component state instead of changing SVG attributes.

```html
<i class="ri-heart-line" aria-hidden="true"></i>
<i class="ri-heart-fill" aria-hidden="true"></i>
```

Use `-line` for the default presentation.

Use `-fill` when the component marks an item as selected, active, or saved.

Do not tune outline thickness with per-icon attributes.

Do not mix arbitrary icon families in one control group.

## Color

Let the icon inherit `currentColor` from its parent.

Set semantic text color on the containing element when a different color is required.

Use status color only when the icon communicates that status.

Do not put a raw color value on an icon.

Do not use palette primitive tokens in component markup.

## Inside controls

Hide decorative icons when visible text names the action.

```html
<button class="btn" type="button" data-variant="default">
  <i class="ri-save-line" aria-hidden="true"></i>
  Save
</button>
```

Give an icon-only control an accessible name on the control.

```html
<button class="btn"
        type="button"
        data-variant="secondary"
        data-size="icon"
        aria-label="Open settings">
  <i class="ri-settings-3-line" aria-hidden="true"></i>
</button>
```

Do not put the accessible name only on a decorative child icon.

## Standalone meaningful icon

Prefer visible adjacent text when the icon communicates information.

Use a standalone accessible icon only when visible text cannot fit the task.

```html
<i class="ri-error-warning-line" role="img" aria-label="Warning"></i>
```

Do not rely on icon shape alone for important status when visible text can accompany it.

## Behavior

Icon adds no interaction.

Icon does not capture pointer events.

The containing control owns focus and activation.

Icon color follows the containing text color.

## Accessibility

Mark decorative icons with `aria-hidden="true"`.

Keep icon-only control names on the parent control.

Use visible text for important status whenever possible.

Keep meaningful icon labels concise and specific.

Do not add duplicate accessible names to both the icon and its labelled parent.

## Runtime

Icon requires no component module.

Inline SVG works without JavaScript.

An `ri-*` class requires a consumer-owned local loader or locally loaded Remix stylesheet.
