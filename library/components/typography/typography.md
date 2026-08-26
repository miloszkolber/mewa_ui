# Typography

## Purpose

Typography defines the shared text hierarchy for interface copy, prose, code, quotations, keyboard notation, and lists.

Use native text elements that match the content meaning.

Use Typography classes only to apply an existing visual role without changing semantics.

Do not choose a heading level from its visual size.

Do not use Typography classes to imitate controls, status, or navigation state.

## Native basis

Typography uses native headings, paragraphs, lists, quotations, code, keyboard notation, and small-print elements.

Typography adds no JavaScript behavior.

## Native Web APIs

- [`<h1>` through `<h6>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements) provide section hierarchy.
- [`<p>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p) provides paragraph structure.
- [`<blockquote>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote) identifies block quotations.
- [`<code>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/code) identifies code fragments.
- [`<kbd>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd) identifies user keyboard input.
- [`<ul>` and `<ol>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul) provide list semantics.
- [`<small>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/small) identifies side comments and small print.
- [`text-wrap`](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap) improves line distribution without changing semantics.

## Headings

Use one `h1` for the primary page task or document topic when the page structure calls for it.

Use subsequent heading levels to represent section nesting.

```html
<h1 class="h1">Worker control</h1>
<h2 class="h2">Current jobs</h2>
<h3 class="h3">Failed jobs</h3>
```

Keep heading text concise.

Use sentence case.

Do not use a heading only to make text large or bold.

## Paragraphs

Use `.p` for normal prose that needs the shared paragraph rhythm.

```html
<p class="p">Inspect current workers and retry failed jobs.</p>
```

Use `.lead` for one short introductory paragraph that needs more emphasis than normal supporting text.

```html
<p class="lead">Review the current execution state before changing worker settings.</p>
```

Do not use Lead for every section description.

## Supporting text

Use `.small` for secondary text that remains normal content.

Use `.muted` for low-emphasis supporting information.

Use `--text-disabled` through the owning component for disabled content instead of Muted.

Do not use muted styling to hide important instructions.

## Strong text

Use semantic `<strong>` when importance is part of the content meaning.

Use `.large` only when an existing design composition needs stronger text without creating a heading.

Do not replace semantic headings with `.large`.

## Quotations

Use `<blockquote class="blockquote">` for a block quotation.

```html
<blockquote class="blockquote">
  <p>Use the native platform before adding a replacement runtime.</p>
</blockquote>
```

Keep quotation marks in the quoted content only when they belong to the source text.

Do not use Blockquote only to create an indented callout.

## Code

Use `<code class="code">` for inline code, paths, identifiers, and short commands.

```html
<code class="code">registry.json</code>
```

Use a semantic `<pre><code>` region for multi-line code.

Do not use inline Code as a badge.

## Keyboard notation

Use `<kbd class="kbd">` for a key or key combination that the user can press.

```html
Press <kbd class="kbd">Ctrl+B</kbd> to toggle the sidebar.
```

Do not use Kbd for application labels or arbitrary monospace text.

## Lists

Use `<ul>` for unordered items.

Use `<ol>` when order has meaning.

```html
<ol>
  <li>Choose the source.</li>
  <li>Review the files.</li>
  <li>Start the download.</li>
</ol>
```

Keep component-owned lists on their component classes so Typography does not override their layout.

Use Table for data with stable row and column relationships.

## Visual classes

`.h1` uses the shared first-level heading treatment.

`.h2` uses the shared second-level heading treatment.

`.h3` uses the shared third-level heading treatment.

`.h4` uses the shared compact heading treatment.

`.p` uses normal prose rhythm.

`.lead` uses emphasized introductory prose.

`.large` uses strong larger text without adding heading semantics.

`.small` uses the small body scale.

`.muted` uses the muted text role.

`.blockquote` uses the shared quotation border and spacing.

`.code` uses Geist Mono with a quiet surface treatment.

`.kbd` uses Geist Mono with a compact key treatment.

Use the semantic element first and the class second.

## Behavior

Typography is static document content.

Typography does not create interaction.

Typography does not create live regions.

Typography does not add JavaScript.

## Accessibility

Keep heading levels aligned with the actual document hierarchy.

Keep important instructions at normal readable contrast.

Use native quotation, code, keyboard, and list elements when their semantics apply.

Keep text readable at 200 percent zoom.

Keep line wrapping usable at narrow widths.

Do not communicate status through typography style alone.

Do not use visually smaller text for content that is necessary to complete the task when normal body text fits.

## Runtime

Typography requires no component module.

The complete text system works without JavaScript.
