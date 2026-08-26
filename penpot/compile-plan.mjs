import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blueprintFor, componentRenderers } from './blueprints.mjs';
import { rendererInventory } from './renderers.mjs';
import { visualRoles } from './visual-roles.mjs';
import { layoutPresets } from './layout-presets.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const contracts = JSON.parse(await readFile(path.join(here, 'source-contracts.generated.json'), 'utf8'));
const blueprints = contracts.components.map(blueprintFor);

const failures = [];
for (const contract of contracts.components) {
  const renderer = componentRenderers[contract.id];
  if (!renderer) failures.push(`${contract.id}: no renderer mapping`);
  if (renderer && !rendererInventory.has(renderer)) failures.push(`${contract.id}: renderer ${renderer} is not implemented`);
  const blueprint = blueprints.find((entry) => entry.id === contract.id);
  for (const [axis, values] of Object.entries(contract.axes)) {
    if (values.length && !blueprint.axisHandling[axis]) {
      failures.push(`${contract.id}: source axis ${axis} is not represented`);
    }
  }
  const plannedStates = new Set(blueprint.axes.flatMap((axis) => axis.values));
  for (const state of contract.states) {
    if (!plannedStates.has(state)) {
      failures.push(`${contract.id}: CSS state ${state} is not represented in the blueprint matrix`);
    }
  }
  if (!blueprint.masters.length) failures.push(`${contract.id}: no master specimens are defined`);
  if (!blueprint.anatomy.length) failures.push(`${contract.id}: no visual anatomy is defined`);
  if (!layoutPresets[blueprint.layout.mode]) failures.push(`${contract.id}: missing geometry for layout mode ${blueprint.layout.mode}`);
  for (const part of blueprint.anatomy) {
    if (!visualRoles[part.role]) failures.push(`${contract.id}: anatomy role ${part.role} has no token style`);
  }
}

if (failures.length) {
  throw new Error(`Penpot plan is incomplete:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
}

const plan = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceContracts: 'penpot/source-contracts.generated.json',
  foundations: 'penpot/foundations.generated.json',
  visualRoles,
  layoutPresets,
  components: blueprints,
};

await writeFile(path.join(here, 'plan.generated.json'), `${JSON.stringify(plan, null, 2)}\n`);
console.log(`Compiled ${blueprints.length} Penpot blueprints.`);
