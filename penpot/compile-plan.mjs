import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rendererDefinitions, sharedComponents, sharedComponentReferences } from './renderers.mjs';
import { visualRoles } from './visual-roles.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const contracts = JSON.parse(await readFile(path.join(here, 'source-contracts.generated.json'), 'utf8'));
const foundations = JSON.parse(await readFile(path.join(here, 'foundations.generated.json'), 'utf8'));
const registry = JSON.parse(await readFile(path.join(repo, 'registry.json'), 'utf8'));

const sort = (values) => [...new Set(values)].sort((left, right) => left.localeCompare(right));
const unique = (values) => [...new Set(values)];
const keySegment = (value) => encodeURIComponent(value).replaceAll('%', '~');

// Renderer keys are the camel-case form of the contract id, for example
// `alert-dialog` maps to `alertDialog`. The mapping must stay derivable so a
// component can never silently fall back to a generic renderer.
const rendererKey = (id) => id
  .split('-')
  .map((part, index) => index === 0 ? part : part[0].toUpperCase() + part.slice(1))
  .join('');

function runtimeAxis(name) {
  return /^(?:lucide|theme|placeholder|action|sort-type|plural|singular|range-label|time-part|value(?:-.+)?|(?:[a-z]+-)?page(?:-.+)?|(?:[a-z]+-)?trigger)$/.test(name);
}

function normalizeAxes(definition, contract) {
  const axes = definition.axes.map((axis) => ({
    name: axis.name,
    values: unique(axis.values),
    source: axis.source,
  }));

  for (const [name, values] of Object.entries(contract.axes).sort(([left], [right]) => left.localeCompare(right))) {
    if (runtimeAxis(name)) continue;
    let target = axes.find((axis) => axis.name === name)
      ?? axes.find((axis) => values.every((value) => axis.values.includes(value)));
    if (!target) {
      target = { name, values: [], source: 'contract' };
      axes.push(target);
    }
    target.values = unique([...target.values, ...sort(values)]);
  }

  for (const state of sort(contract.states)) {
    let target = axes.find((axis) => axis.name === 'state' && axis.values.includes(state))
      ?? axes.find((axis) => axis.name === 'interaction' && axis.values.includes(state));
    if (!target) {
      target = axes.find((axis) => axis.name === 'state')
        ?? axes.find((axis) => axis.name === 'interaction');
      if (!target) {
        target = { name: 'interaction', values: [], source: 'css' };
        axes.push(target);
      }
      target.values = unique([...target.values, state]);
    }
  }

  return axes.map((axis) => ({ ...axis, values: unique(axis.values) }));
}

function normalizeComponent(contract) {
  const key = `component.${contract.id}`;
  const definition = rendererDefinitions[rendererKey(contract.id)];
  if (!definition) throw new Error(`Missing Penpot renderer definition for ${contract.id}.`);
  const references = (sharedComponentReferences[contract.id] ?? []).map((reference) => ({
    key: `${key}.reference.${reference.part}.${keySegment(reference.key)}`,
    part: reference.part,
    component: reference.key,
  }));

  return {
    key,
    id: contract.id,
    title: contract.title,
    renderer: rendererKey(contract.id),
    composition: {
      intent: definition.intent,
      structures: contract.canonicalStructure,
    },
    anatomy: definition.anatomy.map((part) => ({
      key: `${key}.part.${keySegment(part.name)}`,
      ...part,
    })),
    axes: normalizeAxes(definition, contract).map((axis) => ({
      key: `${key}.axis.${keySegment(axis.name)}`,
      name: axis.name,
      source: axis.source,
      values: axis.values.map((value) => ({
        key: `${key}.axis.${keySegment(axis.name)}.value.${keySegment(value)}`,
        value,
      })),
    })),
    references,
  };
}

function validateManifest(manifest) {
  const failures = [];
  const registryIds = registry.components.map((component) => component.slug).sort((left, right) => left.localeCompare(right));
  const contractIds = contracts.components.map((component) => component.id).sort((left, right) => left.localeCompare(right));
  if (JSON.stringify(contractIds) !== JSON.stringify(registryIds)) failures.push('component contracts do not match registry component IDs');
  if (manifest.components.length !== registryIds.length) failures.push(`expected ${registryIds.length} components, found ${manifest.components.length}`);

  const sharedKeys = new Set(manifest.sharedComponents.map((component) => component.key));
  if (sharedKeys.size !== manifest.sharedComponents.length) failures.push('shared component keys must be unique');
  for (const component of manifest.sharedComponents) {
    if (!component.anatomy.length) failures.push(`${component.key}: shared component anatomy is empty`);
    for (const part of component.anatomy) {
      if (!visualRoles[part.role]) failures.push(`${component.key}: shared anatomy role ${part.role} has no token style`);
    }
  }

  for (const component of manifest.components) {
    if (!component.anatomy.length) failures.push(`${component.id}: no visual anatomy is defined`);
    if (!component.composition.structures.length) failures.push(`${component.id}: no canonical composition structure is defined`);
    for (const part of component.anatomy) {
      if (!visualRoles[part.role]) failures.push(`${component.id}: anatomy role ${part.role} has no token style`);
    }

    const anatomy = new Set(component.anatomy.map((part) => part.name));
    const referenceKeys = new Set();
    for (const reference of component.references) {
      if (referenceKeys.has(reference.key)) failures.push(`${component.id}: duplicate shared reference ${reference.key}`);
      referenceKeys.add(reference.key);
      if (!sharedKeys.has(reference.component)) failures.push(`${component.id}: unknown shared component ${reference.component}`);
      if (!anatomy.has(reference.part)) failures.push(`${component.id}: shared reference part ${reference.part} is absent from anatomy`);
    }

    for (const axis of component.axes) {
      if (!axis.values.length) failures.push(`${component.id}: axis ${axis.name} has no values`);
    }
    for (const [name, values] of Object.entries(contracts.components.find((contract) => contract.id === component.id).axes)) {
      if (runtimeAxis(name)) continue;
      const axis = component.axes.find((entry) => entry.name === name)
        ?? component.axes.find((entry) => values.every((value) => entry.values.some((entryValue) => entryValue.value === value)));
      for (const value of values) {
        if (!axis?.values.some((entry) => entry.value === value)) {
          failures.push(`${component.id}: contract axis ${name}=${value} is not covered`);
        }
      }
    }
    for (const state of contracts.components.find((contract) => contract.id === component.id).states) {
      if (!component.axes.some((axis) => axis.values.some((value) => value.value === state))) {
        failures.push(`${component.id}: CSS state ${state} is not covered`);
      }
    }
  }

  if (failures.length) throw new Error(`Penpot sync manifest is incomplete:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
}

const manifest = {
  schemaVersion: 2,
  source: {
    contracts: 'penpot/source-contracts.generated.json',
    foundations: 'penpot/foundations.generated.json',
  },
  foundations,
  visualRoles,
  sharedComponents,
  components: contracts.components.map(normalizeComponent),
};

validateManifest(manifest);

await writeFile(path.join(here, 'sync-manifest.generated.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Compiled ${manifest.components.length} Penpot sync manifest entries.`);