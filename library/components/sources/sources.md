# Sources

## Purpose

Sources connects inline citations with a readable list of external references.

Use Sources for grounded answers and research summaries that cite navigable material.

Use a normal link list when the content does not need numbered inline citations.

Do not use Sources to present unrelated bookmarks or actions.

## Native basis

Sources uses a labelled section, an ordered list, and real links.

Inline citations use anchors that point to the matching list entries or directly to the source.

## Native Web APIs

- [`<section>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section) groups the reference list.
- [`<ol>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol) preserves citation order.
- [`<a>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a) preserves navigation, copying, and browser context actions.
- [`aria-labelledby`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-labelledby) names the section.

## Structure

```html
<p>
  Transformers scale with data and compute
  <a class="citation" href="#source-1" aria-label="Source 1">1</a>.
</p>

<section class="sources" aria-labelledby="sources-title">
  <h2 class="sources-heading" id="sources-title">Sources</h2>
  <ol class="sources-list">
    <li class="source" id="source-1">
      <a class="source-link" href="https://example.com/paper">
        <span class="source-index" aria-hidden="true">1</span>
        <span class="source-copy">
          <span class="source-title">Attention Is All You Need</span>
          <span class="source-host">example.com</span>
        </span>
      </a>
    </li>
  </ol>
</section>
```

Keep each citation number synchronized with its matching source entry.

Use a visible heading when the list needs orientation.

Use `target="_blank"` only when opening a new tab is necessary.

Add `rel="noopener noreferrer"` to a link that uses `target="_blank"`.

## Accessibility

Give each inline citation an accessible name that includes its number.

Keep the source title as link text.

Treat the displayed host as supporting information.

Do not replace a descriptive link with an unlabeled numeric control.

## Runtime

Sources requires no component JavaScript.

Links, fragment destinations, and ordered-list semantics remain usable in every runtime mode.
