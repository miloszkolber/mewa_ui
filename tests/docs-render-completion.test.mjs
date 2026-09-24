import assert from 'node:assert/strict';
import fs from 'node:fs';
import { namespace, renderDocumentation, inlineLocalIcons } from '../scripts/docs-render.mjs';
import { rewrite } from '../scripts/docs-model.mjs';

const renamed = await namespace(
  '<button type="button" data-command-trigger="cmd" aria-controls="cmd">Open</button><dialog id="cmd" aria-labelledby="heading"><h2 id="heading">Commands</h2><a href="#heading">Back</a></dialog>',
  'test'
);
assert.match(renamed, /data-command-trigger="test-cmd"/);
assert.match(renamed, /aria-controls="test-cmd"/);
assert.match(renamed, /id="test-cmd"/);
assert.match(renamed, /href="#test-heading"/);
assert.match(renamed, /aria-labelledby="test-heading"/);
assert.match(
  await namespace(
    '<button data-command-palette-trigger="commands"></button><dialog id="commands"></dialog>',
    'scope'
  ),
  /data-command-palette-trigger="scope-commands"/
);
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const registry = JSON.parse(read('../registry.json'));
// Exercise source renderers in memory; shared generated files belong to the
// integration owner and are neither refreshed nor treated as current evidence.
const root = new URL('..', import.meta.url).pathname;
const rendered = await renderDocumentation(root, registry);
const preview = rendered.get('docs/preview.html');
const matrix = rendered.get('docs/figma.html');
for (const category of new Set(registry.components.map((c) => c.category))) {
  assert(preview.includes(`data-category="${category}"`), `preview group ${category}`);
  assert(matrix.includes(`data-category="${category}"`), `matrix group ${category}`);
}
assert.doesNotMatch(
  preview,
  /Interact with the component to inspect its state|data-copy|Component contract|<details class="usage"/
);
// Persistent conditions are boolean properties, never a second state dropdown.
assert.doesNotMatch(preview, /Visual state|name="state(?::|")/);
assert.doesNotMatch(preview, /playground-feedback/);
assert.doesNotMatch(matrix, /data-state-name="(?:Focus|Hover|Disabled|Invalid)"/);
assert.match(preview, /role="switch" name="prop:pressed" data-off="false" data-on="true"/);
assert.match(preview, /name="prop:disabled"/);
assert.match(preview, /name="prop:part-nav-link:1:disabled"/);
assert.match(preview, /name="exclusive:part-nav-link"/);
assert.match(preview, /class="control-label">variant</);
// Every option needs a visible label, and controller-owned children stay hidden.
assert.doesNotMatch(preview, /<option[^>]*>\s*<\/option>/, 'no blank option labels');
assert.doesNotMatch(
  preview,
  /name="prop:part-color(?:-hex)?:\d+:(?:invalid|disabled)"/,
  'Color Picker children are controller-owned'
);
assert.doesNotMatch(matrix, /<h3>[^<]*(?:Submit shortcut|Required|Multiple|Selection):/);
assert.doesNotMatch(matrix, /© 2026 Atlas/);
for (const name of ['data-spacing', 'data-streaming', 'multiple'])
  assert.match(
    preview,
    new RegExp(`role="switch" name="prop:${name}" data-off="__remove" data-on=""`)
  );
assert.doesNotMatch(preview, /name="prop:part-(?:summary|carousel-control|day):/);
assert.doesNotMatch(preview, /name="prop:part-combobox-trigger:\d+:open"/);
assert.doesNotMatch(matrix, /<script src="icons.js"/);
assert.match(matrix, /pressed: off/);
assert.match(matrix, /pressed: on/);
assert.match(matrix, /loading: on/);
let closedComboboxes = 0;
await rewrite(matrix, [
  [
    '.combobox-content[hidden]',
    (el) => {
      closedComboboxes++;
      assert.equal(
        el.getAttribute('data-static-overlay'),
        null,
        'Static overlay display must not override closed hidden state'
      );
    }
  ]
]);
assert(closedComboboxes > 0);
const labels = [];
const textReader = new HTMLRewriter().on('.control-label, .property-scope legend', {
  text(chunk) {
    labels.push(chunk.text);
  }
});
await textReader.transform(new Response(preview)).text();
for (const label of labels)
  assert.equal(label, label.toLowerCase(), 'Actual inspector labels are lowercase strings');
for (const variant of ['line', 'fill']) {
  const local = await inlineLocalIcons(
    `<i class="ri-home-${variant}" aria-hidden="true"></i>`,
    root
  );
  assert.match(local, /<svg[^>]*><path d="[^"]+"/);
  assert.match(local, new RegExp(`class="ri-home-${variant}"`));
  let inline = 0;
  await rewrite(matrix, [[`.ri-home-${variant} svg path`, () => inline++]]);
  assert(inline >= 5, `Five offline ${variant} sizes contain real paths`);
}
console.log(
  'PASS grouped documentation, lowercase properties, boolean conditions, exact ID references and action removal'
);
