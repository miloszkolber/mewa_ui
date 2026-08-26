# Icon

## Purpose

Icon presents a local Lucide glyph as supporting visual information.

Use Icon beside a visible label or inside a familiar icon-only control.

Do not use Icon as the only explanation for an unfamiliar action or status.

Do not load remote icon assets.

## Native basis

Inline SVG copied from `library/src/icons/` is the complete no-JavaScript path.

The optional `data-lucide` placeholder can be expanded by a consumer-owned local loader.

Icon has no component JavaScript module.

## Native Web APIs

- [`<svg>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg) provides scalable local vector graphics.
- [`currentColor`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#currentcolor_keyword) lets the icon inherit the surrounding text color.
- [`aria-hidden`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden) removes decorative icons from the accessibility tree.
- [`role="img"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/img_role) can expose a standalone meaningful icon when visible text cannot do so.

## Inline SVG

Copy the matching file from `library/src/icons/`.

Keep decorative state explicit.

```html
<svg aria-hidden="true"
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     stroke-width="2"
     stroke-linecap="round"
     stroke-linejoin="round">
  <circle cx="11" cy="11" r="8"></circle>
  <path d="m21 21-4.3-4.3"></path>
</svg>
```

Do not copy an SVG from a remote CDN when the same icon exists in `library/src/icons/`.

## Local loader hook

Use the placeholder only when the host already provides a local loader.

```html
<i data-lucide="search" aria-hidden="true"></i>
```

The loader belongs to the documentation site or consuming application.

The loader is not part of the Icon component runtime.

Do not make a component depend on a documentation-site loader.

## Sizes

Omit `data-size` for the 16px default.

Use `data-size="md"` for 20px.

Use `data-size="lg"` for 24px.

Use `data-size="xl"` for 32px.

```html
<i data-lucide="database" data-size="lg" aria-hidden="true"></i>
```

Use the size defined by the containing component when Icon sits inside a Button, Toolbar, or other control.

Do not add inline width and height styles to canonical examples.

Do not create arbitrary icon sizes when a documented size fits.

## Stroke and fill

Keep the local Lucide stroke treatment by default.

Change `stroke-width` only when the product meaning requires a deliberate visual distinction.

Use `fill="currentColor"` only for an icon whose filled state has documented meaning.

Do not mix arbitrary stroke weights across one control group.

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
  <i data-lucide="save" aria-hidden="true"></i>
  Save
</button>
```

Give an icon-only control an accessible name on the control.

```html
<button class="btn"
        type="button"
        data-variant="outline"
        data-size="icon"
        aria-label="Open settings">
  <i data-lucide="settings" aria-hidden="true"></i>
</button>
```

Do not put the accessible name only on a decorative child icon.

## Standalone meaningful icon

Prefer visible adjacent text when the icon communicates information.

Use a standalone accessible icon only when visible text cannot fit the task.

```html
<svg role="img" aria-label="Warning" viewBox="0 0 24 24">
  <!-- Copy the local warning icon paths. -->
</svg>
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

A `data-lucide` placeholder requires a consumer-owned local loader.
