import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blueprintFor, componentRenderers } from './blueprints.mjs';
import { rendererInventory, sharedComponents, sharedComponentReferences } from './renderers.mjs';
import { visualRoles } from './visual-roles.mjs';
import { layoutPresets } from './layout-presets.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const contracts = JSON.parse(await readFile(path.join(here, 'source-contracts.generated.json'), 'utf8'));
const foundations = JSON.parse(await readFile(path.join(here, 'foundations.generated.json'), 'utf8'));
const registry = JSON.parse(await readFile(path.join(repo, 'registry.json'), 'utf8'));
const blueprints = contracts.components.map(blueprintFor);

const sort = (values) => [...new Set(values)].sort((left, right) => left.localeCompare(right));
const unique = (values) => [...new Set(values)];
const componentKey = (id) => `component.${id}`;
const keySegment = (value) => encodeURIComponent(value).replaceAll('%', '~');

function runtimeAxis(name) {
  return /^(?:lucide|theme|placeholder|action|sort-type|plural|singular|range-label|time-part|value(?:-.+)?|(?:[a-z]+-)?page(?:-.+)?|(?:[a-z]+-)?trigger)$/.test(name);
}

function matchingAxis(axes, name, values, allowExact = false) {
  const exact = axes.find((axis) => axis.name === name);
  if (exact && (allowExact || values.every((value) => exact.values.includes(value)))) return exact;
  return axes.find((axis) => values.every((value) => axis.values.includes(value)));
}

function normalizeAxes(blueprint, contract) {
  const axes = blueprint.axes.map((axis) => ({
    name: axis.name,
    values: unique(axis.values),
    source: axis.source,
  }));
  const sourceAxes = [];

  for (const [name, values] of Object.entries(contract.axes).sort(([left], [right]) => left.localeCompare(right))) {
    if (runtimeAxis(name)) {
      sourceAxes.push({ name, values: sort(values), handling: 'runtime' });
      continue;
    }

    let target = matchingAxis(axes, name, values, true);
    if (!target) {
      target = { name, values: [], source: 'contract' };
      axes.push(target);
    }
    target.values = unique([...target.values, ...sort(values)]);
    sourceAxes.push({ name, values: sort(values), handling: 'variant', axis: target.name });
  }

  for (const state of sort(contract.states)) {
    let target = matchingAxis(axes, 'interaction', [state])
      ?? matchingAxis(axes, 'state', [state]);
    if (!target) {
      target = axes.find((axis) => axis.name === 'state')
        ?? axes.find((axis) => axis.name === 'interaction');
      if (!target) {
        target = { name: 'interaction', values: [], source: 'css' };
        axes.push(target);
      }
      target.values = unique([...target.values, state]);
    }
    sourceAxes.push({ name: `css:${state}`, values: [state], handling: 'variant', axis: target.name });
  }

  return {
    axes: axes.map((axis) => ({ ...axis, values: unique(axis.values) })),
    sourceAxes,
  };
}

// A baseline tuple plus one change per declared value makes each value inspectable
// without producing a Cartesian matrix that would be impractical in Penpot.
function variantTuples(key, axes) {
  const baseline = Object.fromEntries(axes.map((axis) => [axis.name, axis.values[0]]));
  const tuples = new Map();
  const add = (tuple) => {
    const ordered = Object.fromEntries(Object.entries(tuple).sort(([left], [right]) => left.localeCompare(right)));
    const identity = Object.entries(ordered).map(([name, value]) => `${name}=${keySegment(value)}`).join('&') || 'default';
    tuples.set(identity, ordered);
  };

  add(baseline);
  for (const axis of axes) {
    for (const value of axis.values) add({ ...baseline, [axis.name]: value });
  }

  return [...tuples.entries()].map(([identity, tuple]) => ({
    key: `${key}.variant.${identity}`,
    tuple,
  }));
}

function explicitLayout(key, mode) {
  const preset = layoutPresets[mode];
  const matrixWidth = (preset.master.width * preset.matrix.columns)
    + (preset.matrix.columnGap * (preset.matrix.columns - 1))
    + (preset.matrix.padding * 2);
  return {
    mode,
    master: {
      key: `${key}.container.master`,
      ...preset.master.container,
    },
    matrix: {
      key: `${key}.container.matrix`,
      ...preset.matrix.container,
      sizing: {
        ...preset.matrix.container.sizing,
        width: matrixWidth,
      },
      cell: {
        width: preset.master.width,
        height: preset.master.height,
      },
      columns: preset.matrix.columns,
      columnGap: preset.matrix.columnGap,
      rowGap: preset.matrix.rowGap,
      labelHeight: preset.matrix.labelHeight,
    },
  };
}

function normalizeComponent(blueprint, contract) {
  const key = componentKey(blueprint.id);
  const normalized = normalizeAxes(blueprint, contract);
  const references = (sharedComponentReferences[blueprint.id] ?? []).map((reference) => ({
    key: `${key}.reference.${reference.part}.${keySegment(reference.key)}`,
    part: reference.part,
    component: reference.key,
  }));

  return {
    key,
    id: blueprint.id,
    title: blueprint.title,
    renderer: blueprint.renderer,
    composition: {
      intent: blueprint.layout.intent,
      structures: blueprint.canonicalStructure,
    },
    source: blueprint.source,
    layout: explicitLayout(key, blueprint.layout.mode),
    masters: blueprint.masters.map((master) => ({
      key: `${key}.master.${keySegment(master.id)}`,
      id: master.id,
      label: master.label,
    })),
    anatomy: blueprint.anatomy.map((part) => ({
      key: `${key}.part.${keySegment(part.name)}`,
      ...part,
    })),
    axes: normalized.axes.map((axis) => ({
      key: `${key}.axis.${keySegment(axis.name)}`,
      name: axis.name,
      source: axis.source,
      values: axis.values.map((value) => ({
        key: `${key}.axis.${keySegment(axis.name)}.value.${keySegment(value)}`,
        value,
      })),
    })),
    sourceAxes: normalized.sourceAxes,
    variants: variantTuples(key, normalized.axes),
    references,
  };
}

function validateContainer(component, name, container, failures) {
  const id = component.id ?? component.key;
  if (!['flex', 'grid'].includes(container.type)) failures.push(`${id}: ${name} container has an invalid type`);
  if (!container.direction) failures.push(`${id}: ${name} container has no direction`);
  if (container.gap === undefined) failures.push(`${id}: ${name} container has no gap`);
  if (!container.padding || ['top', 'right', 'bottom', 'left'].some((side) => !Number.isFinite(container.padding[side]))) {
    failures.push(`${id}: ${name} container has incomplete padding`);
  }
  if (!container.sizing || !container.sizing.horizontal || !container.sizing.vertical || !Number.isFinite(container.sizing.width) || !Number.isFinite(container.sizing.height)) {
    failures.push(`${id}: ${name} container has incomplete sizing`);
  }
}

function validateManifest(manifest) {
  const failures = [];
  const registryIds = registry.components.map((component) => component.slug).sort((left, right) => left.localeCompare(right));
  const contractIds = contracts.components.map((component) => component.id).sort((left, right) => left.localeCompare(right));
  const rendererIds = Object.keys(componentRenderers).sort((left, right) => left.localeCompare(right));
  if (JSON.stringify(contractIds) !== JSON.stringify(registryIds)) failures.push('component contracts do not match registry component IDs');
  if (JSON.stringify(rendererIds) !== JSON.stringify(contractIds)) failures.push('renderer mappings do not match component contracts');
  if (manifest.components.length !== registryIds.length) failures.push(`expected ${registryIds.length} components, found ${manifest.components.length}`);

  const sharedKeys = new Set(manifest.sharedComponents.map((component) => component.key));
  if (sharedKeys.size !== manifest.sharedComponents.length) failures.push('shared component keys must be unique');
  for (const component of manifest.sharedComponents) {
    validateContainer(component, 'shared', component.layout, failures);
    if (!component.anatomy.length) failures.push(`${component.key}: shared component anatomy is empty`);
    for (const part of component.anatomy) {
      if (!visualRoles[part.role]) failures.push(`${component.key}: shared anatomy role ${part.role} has no token style`);
    }
  }
  const componentKeys = new Set();
  for (const component of manifest.components) {
    if (componentKeys.has(component.key)) failures.push(`${component.id}: duplicate component key ${component.key}`);
    componentKeys.add(component.key);
    if (!component.masters.length) failures.push(`${component.id}: no master specimens are defined`);
    if (!component.anatomy.length) failures.push(`${component.id}: no visual anatomy is defined`);
    if (!component.composition.structures.length) failures.push(`${component.id}: no canonical composition structure is defined`);
    validateContainer(component, 'master', component.layout.master, failures);
    validateContainer(component, 'matrix', component.layout.matrix, failures);

    const anatomy = new Set(component.anatomy.map((part) => part.name));
    const referenceKeys = new Set();
    for (const reference of component.references) {
      if (referenceKeys.has(reference.key)) failures.push(`${component.id}: duplicate shared reference ${reference.key}`);
      referenceKeys.add(reference.key);
      if (!sharedKeys.has(reference.component)) failures.push(`${component.id}: unknown shared component ${reference.component}`);
      if (!anatomy.has(reference.part)) failures.push(`${component.id}: shared reference part ${reference.part} is absent from anatomy`);
    }

    const tupleKeys = new Set();
    for (const variant of component.variants) {
      if (tupleKeys.has(variant.key)) failures.push(`${component.id}: duplicate variant tuple ${variant.key}`);
      tupleKeys.add(variant.key);
    }
    for (const axis of component.axes) {
      for (const value of axis.values) {
        if (!component.variants.some((variant) => variant.tuple[axis.name] === value.value)) {
          failures.push(`${component.id}: variant tuples do not cover ${axis.name}=${value.value}`);
        }
      }
    }
    for (const sourceAxis of component.sourceAxes.filter((axis) => axis.handling === 'variant')) {
      for (const value of sourceAxis.values) {
        if (!component.variants.some((variant) => variant.tuple[sourceAxis.axis] === value)) {
          failures.push(`${component.id}: source axis ${sourceAxis.name} value ${value} is not covered`);
        }
      }
    }
  }

  if (failures.length) throw new Error(`Penpot sync manifest is incomplete:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
}

const failures = [];
for (const contract of contracts.components) {
  const renderer = componentRenderers[contract.id];
  if (!renderer) failures.push(`${contract.id}: no renderer mapping`);
  if (renderer && !rendererInventory.has(renderer)) failures.push(`${contract.id}: renderer ${renderer} is not implemented`);
  const blueprint = blueprints.find((entry) => entry.id === contract.id);
  if (!blueprint.masters.length) failures.push(`${contract.id}: no master specimens are defined`);
  if (!blueprint.anatomy.length) failures.push(`${contract.id}: no visual anatomy is defined`);
  if (!layoutPresets[blueprint.layout.mode]) failures.push(`${contract.id}: missing geometry for layout mode ${blueprint.layout.mode}`);
  for (const part of blueprint.anatomy) {
    if (!visualRoles[part.role]) failures.push(`${contract.id}: anatomy role ${part.role} has no token style`);
  }
}

if (failures.length) throw new Error(`Penpot plan is incomplete:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);

const normalizedSharedComponents = sharedComponents.map((component) => ({
  ...component,
  layout: explicitLayout(component.key, component.layout).master,
}));

const manifest = {
  schemaVersion: 1,
  source: {
    contracts: 'penpot/source-contracts.generated.json',
    foundations: 'penpot/foundations.generated.json',
  },
  foundations,
  visualRoles,
  sharedComponents: normalizedSharedComponents,
  components: blueprints.map((blueprint) => normalizeComponent(
    blueprint,
    contracts.components.find((contract) => contract.id === blueprint.id),
  )),
};

validateManifest(manifest);

const plan = {
  schemaVersion: 1,
  sourceContracts: 'penpot/source-contracts.generated.json',
  foundations: 'penpot/foundations.generated.json',
  syncManifest: 'penpot/sync-manifest.generated.json',
  visualRoles,
  layoutPresets,
  sharedComponents,
  components: blueprints,
};

await writeFile(path.join(here, 'plan.generated.json'), `${JSON.stringify(plan, null, 2)}\n`);
await writeFile(path.join(here, 'sync-manifest.generated.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Compiled ${blueprints.length} Penpot blueprints and sync manifest.`);
