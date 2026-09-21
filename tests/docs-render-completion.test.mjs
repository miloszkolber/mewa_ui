import assert from 'node:assert/strict';
import fs from 'node:fs';
import { namespace } from '../scripts/docs-render.mjs';

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
const preview = read('../docs/preview.html');
const matrix = read('../docs/figma.html');
for (const category of new Set(registry.components.map((c) => c.category))) {
  assert(preview.includes(`data-category="${category}"`), `preview group ${category}`);
  assert(matrix.includes(`data-category="${category}"`), `matrix group ${category}`);
}
assert.doesNotMatch(
  preview,
  /Interact with the component to inspect its state|data-copy|Component contract|<details class="usage"/
);
assert.match(preview, /role="switch" name="prop:aria-pressed" data-off="false" data-on="true"/);
assert.match(preview, /name="state:part-nav-link:1"/);
assert.match(preview, /name="exclusive:part-nav-link"/);
assert.doesNotMatch(matrix, /<h3>[^<]*(?:Submit shortcut|Required|Multiple|Selection):/);
assert.doesNotMatch(matrix, /© 2026 Atlas/);
console.log(
  'PASS grouped documentation, exact ID references, semantic switches, concurrent parts and action removal'
);
