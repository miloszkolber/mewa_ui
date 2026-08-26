"use strict";

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const generatedFiles = [
  "penpot/source-contracts.generated.json",
  "penpot/foundations.generated.json",
  "penpot/sync-manifest.generated.json"
];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const json = (file) => JSON.parse(read(file));

let failures = 0;

function test(name, callback) {
  try {
    callback();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}\n  ${error.message}`);
  }
}

function extract() {
  for (const script of ["extract-contracts.mjs", "extract-foundations.mjs", "compile-plan.mjs"]) {
    execFileSync(process.execPath, [path.join("penpot", script)], { cwd: root, stdio: "pipe" });
  }
}

test("Penpot snapshots are deterministic", () => {
  const committed = Object.fromEntries(generatedFiles.map((file) => [file, read(file)]));
  extract();
  for (const file of generatedFiles) assert.equal(read(file), committed[file], `${file} was stale before extraction`);
  const first = Object.fromEntries(generatedFiles.map((file) => [file, read(file)]));
  extract();
  for (const file of generatedFiles) assert.equal(read(file), first[file], `${file} changed without a source change`);
  for (const file of generatedFiles) assert(!read(file).includes("generatedAt"), `${file} contains volatile generation time`);
});

test("foundation extraction retains whitespace-separated custom property values", () => {
  const foundations = json("penpot/foundations.generated.json");
  const core = new Map(foundations.sets["mewa-core"].map((record) => [record.cssName, record]));
  assert.equal(core.get("--space-100").value, "0.25rem");
  assert.equal(core.get("--space-01").value, "var(--space-100)");
  assert.equal(core.get("--font-body-small").value, "var(--font-size-350)");
  assert.equal(core.get("--border-width-01").value, "var(--border-width-025)");
  assert.equal(core.get("--font-sans").value, "geist, sans-serif");
  assert.equal(core.get("--space-100").px, 4);
});

test("contract extraction records native CSS states for variant coverage", () => {
  const contracts = json("penpot/source-contracts.generated.json");
  const checkbox = contracts.components.find((component) => component.id === "checkbox");
  assert(checkbox.states.includes("checked"));
  assert(checkbox.states.includes("indeterminate"));
  assert(checkbox.states.includes("disabled"));
});

test("sync manifest covers every registered component with axes, anatomy, and structure", () => {
  const manifest = json("penpot/sync-manifest.generated.json");
  const registry = json("registry.json");
  assert.equal(manifest.components.length, registry.components.length);
  assert.deepEqual(
    manifest.components.map((component) => component.id).sort(),
    registry.components.map((component) => component.slug).sort()
  );

  for (const component of manifest.components) {
    assert.equal(component.key, `component.${component.id}`);
    assert(component.composition.structures.length > 0, `${component.id}: missing canonical structure`);
    assert(component.anatomy.length > 0, `${component.id}: missing anatomy`);
    assert(component.axes.length > 0, `${component.id}: missing axes`);
    for (const axis of component.axes) {
      assert(axis.values.length > 0, `${component.id}: axis ${axis.name} has no values`);
      assert.equal(new Set(axis.values.map((value) => value.value)).size, axis.values.length, `${component.id}: duplicate axis values`);
    }
  }
});

test("image ratios remain whole values and shared references resolve", () => {
  const manifest = json("penpot/sync-manifest.generated.json");
  const image = manifest.components.find((component) => component.id === "image");
  const ratios = image.axes.find((axis) => axis.name === "ratio").values.map((value) => value.value);
  assert.deepEqual(ratios, ["1/1", "4/3", "3/2", "16/9", "21/9", "3/4"]);

  const shared = new Set(manifest.sharedComponents.map((component) => component.key));
  for (const component of manifest.components) {
    const anatomy = new Set(component.anatomy.map((part) => part.name));
    for (const reference of component.references) {
      assert(shared.has(reference.component), `${component.id}: unknown shared component ${reference.component}`);
      assert(anatomy.has(reference.part), `${component.id}: reference part ${reference.part} is absent`);
    }
  }
  const references = (id) => manifest.components.find((component) => component.id === id).references.map((reference) => reference.component);
  assert(references("button-group").includes("shared.action.button"));
  assert(references("icon").includes("shared.action.icon-button"));
  assert(references("field").includes("shared.form.field"));
  assert(references("accordion").includes("shared.disclosure.trigger"));
  assert(references("dialog").includes("shared.overlay.surface"));
  assert(references("navigation-menu").includes("shared.navigation.item"));
});

test("sync manifest preserves renderer-declared axis order and CSS states stay on the state axis", () => {
  const manifest = json("penpot/sync-manifest.generated.json");
  const component = (id) => manifest.components.find((entry) => entry.id === id);
  const axis = (id, name) => component(id).axes.find((entry) => entry.name === name);

  assert.equal(axis("button", "interaction").values[0].value, "rest");
  assert.equal(axis("button", "variant").values[0].value, "default");
  assert.equal(axis("toast", "interaction").values[0].value, "rest");
  assert.equal(axis("toast", "variant").values[0].value, "info");
  assert.equal(axis("sidebar", "interaction").values[0].value, "rest");
  for (const entry of manifest.components) {
    const interaction = entry.axes.find((axis) => axis.name === "interaction");
    if (interaction?.values.some((value) => value.value === "rest")) {
      assert.equal(interaction.values[0].value, "rest", `${entry.id}: non-rest interaction baseline`);
    }
  }
  assert(axis("checkbox", "state").values.some((value) => value.value === "indeterminate"));
  assert(!component("checkbox").axes.some((axis) => axis.name === "interaction"));
  assert(axis("text-field", "state").values.some((value) => value.value === "read-only"));
});

test("sync manifest contains every input required by the Penpot writer", () => {
  const manifest = json("penpot/sync-manifest.generated.json");
  assert(manifest.foundations.sets["mewa-core"].length > 0);
  assert(Object.keys(manifest.visualRoles).length > 0);
  for (const shared of manifest.sharedComponents) {
    assert(shared.anatomy.length > 0, `${shared.key}: missing anatomy`);
    for (const part of shared.anatomy) assert(manifest.visualRoles[part.role], `${shared.key}: unresolved role ${part.role}`);
  }
  for (const component of manifest.components) {
    for (const part of component.anatomy) assert(manifest.visualRoles[part.role], `${component.id}: unresolved role ${part.role}`);
  }
});

if (failures) process.exitCode = 1;
