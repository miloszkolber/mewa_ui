import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  namespace,
  renderDocumentation,
  renderComponentStyles,
  inlineLocalIcons
} from '../scripts/docs-render.mjs';
import { rewrite } from '../scripts/docs-model.mjs';

const renamed = await namespace(
  '<button type="button" data-command-palette-trigger="cmd" aria-controls="cmd">Open</button><dialog id="cmd" aria-labelledby="heading"><h2 id="heading">Commands</h2><a href="#heading">Back</a></dialog>',
  'test'
);
assert.match(renamed, /data-command-palette-trigger="test-cmd"/);
assert.match(renamed, /aria-controls="test-cmd"/);
assert.match(renamed, /id="test-cmd"/);
assert.match(renamed, /href="#test-heading"/);
assert.match(renamed, /aria-labelledby="test-heading"/);
assert.match(
  await namespace(
    '<a aria-disabled="true" data-demo-href="#destination">Route</a><span id="destination">Destination</span>',
    'route'
  ),
  /data-demo-href="#route-destination"/,
  'A temporarily unavailable fragment route restores its namespaced destination'
);
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const registry = JSON.parse(read('../registry.json'));
// Exercise source renderers in memory; shared generated files belong to the
// integration owner and are neither refreshed nor treated as current evidence.
const root = new URL('..', import.meta.url).pathname;
const rendered = await renderDocumentation(root, registry);
const preview = rendered.get('docs/preview.html');
const matrix = rendered.get('docs/figma.html');
for (const html of [preview, matrix]) {
  assert.equal((html.match(/href="components\.generated\.css"/g) || []).length, 1);
  assert.doesNotMatch(html, /states\.generated\.css/);
}
// Undo only the inert mixed extension and compare the complete source bytes.
// This catches dropped/reordered declarations and preserves native hover/focus/progress.
const componentStyles = renderComponentStyles(root, registry);
const sourceStyles = registry.components
  .map((c) => `/* ${c.name} — ${c.files.css} */\n${read(`../${c.files.css}`).trim()}`)
  .join('\n\n');
assert.equal(
  componentStyles.replaceAll(':is(:indeterminate,[data-demo-mixed])', ':indeterminate'),
  `/* Generated from registry.json. Run bun run docs:write. */\n\n${sourceStyles}\n`
);
assert.match(componentStyles, /&:is\(:indeterminate,\[data-demo-mixed\]\)/);
assert.match(componentStyles, /\.progress:is\(:indeterminate,\[data-demo-mixed\]\)/);
assert.doesNotMatch(componentStyles, /data-demo-(?:hover|focus|active)/);
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
let fieldActions = 0;
await rewrite(preview, [
  [
    '[data-component="text-field"] [data-scope="part-button"]',
    (element) => {
      fieldActions++;
      assert.deepEqual(
        JSON.parse(element.getAttribute('data-hide-when').replaceAll('&quot;', '"')),
        {
          control: 'slot',
          in: ['plain', 'prefix', 'suffix', 'affixes']
        },
        'Absent compound-field actions have no visible inspector'
      );
    }
  ]
]);
assert.equal(fieldActions, 1, 'Compound-field sibling action has one independent inspector');
let independentDisabled = 0;
await rewrite(preview, [
  [
    '[data-component="text-field"] [name="prop:part-button:0:disabled"]',
    () => independentDisabled++
  ]
]);
assert.equal(independentDisabled, 1, 'Input disabled does not own the attached action');
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
assert.doesNotMatch(matrix, /<h3>[^<]*selection:/, 'Behavior-only selection is not a visual axis');
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
// Required additions are independent of the declared profile inventory. A loop
// over profile values alone would pass if an option vanished from both views.
for (const [slug, selector] of [
  ['card', '.card[data-density="compact"]'],
  ['statistic', '.statistic[data-density="compact"]'],
  ['callout', '.callout[data-variant="positive"]'],
  ['callout', '.callout[data-variant="caution"]'],
  ['text-field', '.text-field-affix[data-side="start"]'],
  ['text-field', '.text-field-affix[data-side="end"]'],
  ['text-field', '.text-field-action[type="submit"]'],
  ['dialog', '.dialog[data-scroll="body"]']
]) {
  let found = 0;
  await rewrite(matrix, [[`[data-component="${slug}"] ${selector}`, () => found++]]);
  assert(found > 0, `Generated ${slug} matrix includes ${selector}`);
}
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
