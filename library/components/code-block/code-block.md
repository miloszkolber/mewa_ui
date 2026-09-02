# Code Block

## Purpose

Code Block presents source code, output, or a command with optional line numbers and copy support.

Use Code Block when whitespace, line boundaries, or code selection must remain intact.

Use inline `<code>` for a short token or command inside prose.

Do not use Code Block for a file change comparison.

## Native basis

Code Block uses `<figure>`, `<figcaption>`, `<pre>`, and `<code>`.

The source stays readable and selectable before the enhancement module runs.

The optional module adds copy feedback and live-edge following while `data-streaming` is present.

## Native Web APIs

- [`<figure>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure) groups the code with its label and actions.
- [`<pre>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre) preserves source whitespace.
- [`<code>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/code) identifies computer-readable source.
- [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) provides the optional copy action.
- [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) follows appended streaming lines without polling.

## Structure

```html
<figure class="code-block" data-streaming>
  <figcaption class="code-block-header">
    <span class="code-block-heading">example.js</span>
    <span class="code-block-state">Streaming</span>
    <button class="code-block-copy"
            type="button"
            data-code-block-copy
            aria-controls="code-block-example-source"
            hidden>
      Copy
    </button>
    <span class="code-block-status" id="code-block-example-status" role="status" aria-live="polite"></span>
  </figcaption>
  <div class="code-block-viewport" tabindex="0" aria-label="Example JavaScript source">
    <pre class="code-block-pre"><code class="code-block-code" id="code-block-example-source"><span class="code-block-line"><span class="code-block-line-number" aria-hidden="true">1</span><span class="code-block-line-text">const result = await runTask();</span></span>
<span class="code-block-line" data-highlight><span class="code-block-line-number" aria-hidden="true">2</span><span class="code-block-line-text">console.log(result);</span></span></code></pre>
  </div>
</figure>
```

Use `.code-block-line` only when line numbers or highlighted lines are required.

Use `.code-block-line-text` for the selectable source in each structured line.

Set `data-highlight` on a line that needs emphasis.

Omit `.code-block-line-number` when the gutter does not help the task.

Keep syntax highlighting in authored token spans or application output.

Do not add raw syntax colors to the component stylesheet.

## Behavior

Load `code-block.js` to enable `[data-code-block-copy]` controls.

The module copies only `.code-block-line-text` when structured lines exist.

The module announces a successful copy through `.code-block-status`.

The module follows appended content only while the reader remains at the live edge.

The module keeps all programmatic scrolling immediate.

Removing `data-streaming` stops automatic live-edge following.

## Accessibility

Keep the `<pre><code>` structure in the source document.

Give a constrained viewport an accessible name and `tabindex="0"` when keyboard scrolling is required.

Hide line numbers from assistive technology and text selection.

Keep the copy button label visible.

Use one polite status region for copy confirmation.

Do not put a live role on the complete code container.

## No-JavaScript

The code remains readable, selectable, and scrollable without JavaScript.

The copy button stays hidden when the enhancement module does not run.

Streaming applications can append normal source text without the module.

## Runtime

Code Block uses an optional component module.

Load `code-block.js` when copy or automatic live-edge following is required.
