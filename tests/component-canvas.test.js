const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const registry = JSON.parse(fs.readFileSync(path.join(root, "registry.json"), "utf8"));
const source = fs.readFileSync(path.join(root, "components.html"), "utf8");

test("component canvas includes every registry component in both themes", () => {
  for (const component of registry.components) {
    const matches = source.match(new RegExp(`data-component="${component.slug}"`, "g")) || [];
    assert.equal(matches.length, 2, `${component.slug} must appear once in each theme`);
  }
});

test("component canvas contains only invisible organizational metadata", () => {
  assert.doesNotMatch(source, /class="(?:page-header|copy-btn|docs-|site-)/i);
  assert.match(source, /data-theme="light"/);
  assert.match(source, /data-theme="dark"/);
});

test("component canvas exposes static and simulated states", () => {
  assert.match(source, /<dialog open\b/);
  assert.match(source, /\bpopover\b/);
  assert.match(source, /data-simulate-state="hover"/);
  assert.match(source, /data-simulate-state="focus"/);
  assert.match(source, /data-simulate-state="active"/);
});
