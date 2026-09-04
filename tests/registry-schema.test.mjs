import assert from 'node:assert/strict';
import Ajv from 'ajv';
const schema = await Bun.file(new URL('../registry.schema.json', import.meta.url)).json();
const registry = await Bun.file(new URL('../registry.json', import.meta.url)).json();
const validate = new Ajv({ allErrors: true }).compile(schema);
assert(validate(registry), JSON.stringify(validate.errors, null, 2));
for (const component of registry.components) {
  assert.equal(component.requiresJs, component.jsMode === 'required');
  assert.equal(component.enhancementJs, component.jsMode === 'optional');
  assert.equal(component.description, component.purpose);
}
const invalid = structuredClone(registry);
invalid.components[0].files.unrecognized = 'no';
assert.equal(validate(invalid), false);
console.log('PASS versioned registry schema and compatibility aliases');
