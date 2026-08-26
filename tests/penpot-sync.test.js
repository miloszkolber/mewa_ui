"use strict";

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const generatedFiles = [
  "penpot/source-contracts.generated.json",
  "penpot/foundations.generated.json",
  "penpot/plan.generated.json",
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

test("normalized sync manifest covers components, layout, variants, and source states", () => {
  const manifest = json("penpot/sync-manifest.generated.json");
  const registry = json("registry.json");
  assert.equal(manifest.components.length, registry.components.length);
  assert.deepEqual(
    manifest.components.map((component) => component.id).sort(),
    registry.components.map((component) => component.slug).sort()
  );

  for (const component of manifest.components) {
    assert.equal(component.key, `component.${component.id}`);
    assert(component.masters.every((master) => master.key.startsWith(`${component.key}.master.`)));
    assert(component.composition.structures.length > 0, `${component.id}: missing canonical structure`);
    assert(component.variants.length > 0, `${component.id}: missing variants`);
    assert.equal(new Set(component.variants.map((variant) => variant.key)).size, component.variants.length, `${component.id}: duplicate variant keys`);

    for (const container of [component.layout.master, component.layout.matrix]) {
      assert(["flex", "grid"].includes(container.type), `${component.id}: invalid container type`);
      assert.equal(typeof container.direction, "string", `${component.id}: missing container direction`);
      assert.notEqual(container.gap, undefined, `${component.id}: missing container gap`);
      for (const side of ["top", "right", "bottom", "left"]) assert.equal(typeof container.padding[side], "number", `${component.id}: missing ${side} padding`);
      assert(["fixed", "hug", "fill"].includes(container.sizing.horizontal), `${component.id}: missing horizontal sizing`);
      assert(["fixed", "hug", "fill"].includes(container.sizing.vertical), `${component.id}: missing vertical sizing`);
      assert.equal(typeof container.sizing.width, "number", `${component.id}: missing layout width`);
      assert.equal(typeof container.sizing.height, "number", `${component.id}: missing layout height`);
    }
    assert.equal(
      component.layout.matrix.sizing.width,
      (component.layout.matrix.cell.width * component.layout.matrix.columns)
        + (component.layout.matrix.columnGap * (component.layout.matrix.columns - 1))
        + component.layout.matrix.padding.left
        + component.layout.matrix.padding.right,
      `${component.id}: matrix width does not fit its declared cells`
    );

    const axisValues = component.axes.map((axis) => axis.values.length);
    const compactVariantCount = 1 + axisValues.reduce((sum, count) => sum + count - 1, 0);
    assert.equal(component.variants.length, compactVariantCount, `${component.id}: variants must use baseline-plus-value coverage`);
    for (const axis of component.axes) {
      for (const value of axis.values) {
        assert(component.variants.some((variant) => variant.tuple[axis.name] === value.value), `${component.id}: ${axis.name}=${value.value} is uncovered`);
      }
    }
    for (const sourceAxis of component.sourceAxes.filter((axis) => axis.handling === "variant")) {
      for (const value of sourceAxis.values) {
        assert(component.variants.some((variant) => variant.tuple[sourceAxis.axis] === value), `${component.id}: source ${sourceAxis.name}=${value} is uncovered`);
      }
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

test("sync baselines preserve normal renderer states and CSS states stay on the state axis", () => {
  const manifest = json("penpot/sync-manifest.generated.json");
  const component = (id) => manifest.components.find((entry) => entry.id === id);
  const baseline = (id) => component(id).variants[0].tuple;

  assert.equal(baseline("button").interaction, "rest");
  assert.equal(baseline("button").variant, "default");
  assert.equal(baseline("toast").interaction, "rest");
  assert.equal(baseline("toast").variant, "info");
  assert.equal(baseline("sidebar").interaction, "rest");
  for (const entry of manifest.components) {
    const interaction = entry.axes.find((axis) => axis.name === "interaction");
    if (interaction?.values.some((value) => value.value === "rest")) {
      assert.equal(entry.variants[0].tuple.interaction, "rest", `${entry.id}: non-rest interaction baseline`);
    }
  }
  assert(component("checkbox").axes.find((axis) => axis.name === "state").values.some((value) => value.value === "indeterminate"));
  assert(!component("checkbox").axes.some((axis) => axis.name === "interaction"));
  assert(component("text-field").axes.find((axis) => axis.name === "state").values.some((value) => value.value === "read-only"));
});

test("sync manifest contains every input required by the MCP writer", () => {
  const manifest = json("penpot/sync-manifest.generated.json");
  assert(manifest.foundations.sets["mewa-core"].length > 0);
  assert(Object.keys(manifest.visualRoles).length > 0);
  for (const shared of manifest.sharedComponents) {
    assert(shared.anatomy.length > 0, `${shared.key}: missing anatomy`);
    assert(["flex", "grid"].includes(shared.layout.type), `${shared.key}: missing explicit layout`);
    for (const part of shared.anatomy) assert(manifest.visualRoles[part.role], `${shared.key}: unresolved role ${part.role}`);
  }
});

if (failures) process.exitCode = 1;
