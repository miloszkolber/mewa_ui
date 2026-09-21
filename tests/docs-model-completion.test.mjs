import assert from 'node:assert/strict';
import source from '../docs/specimens.json';
import { compileModel, matrixRows, operate, rewrite } from '../scripts/docs-model.mjs';
import {
  booleanValues,
  initialValue,
  propertyLabel,
  optionLabel,
  rootProfile,
  slots,
  demoIcon,
  demoSpinner
} from '../docs/component-model.mjs';
import {
  propertyOperations,
  contentOperations,
  slotOperations,
  exclusiveOperations
} from '../docs/model-operations.mjs';
import { profiles, nonVisualProps } from '../docs/catalog.mjs';

const model = async (slug) => compileModel(source.find((c) => c.slug === slug));
const fixture = (slug, html) => ({ slug, name: slug, samples: [{ html }], specimens: [{ html }] });
const prop = (scope, name) => scope.props.find((p) => p.name === name);
async function attrs(html, selector) {
  const found = [];
  await rewrite(html, [[selector, (el) => found.push(Object.fromEntries(el.attributes))]]);
  return found;
}
async function has(html, selector) {
  return (await attrs(html, selector)).length > 0;
}

// Booleans are explicit properties now, never a second "visual state" array.
assert.deepEqual(booleanValues({ kind: 'boolean', on: '' }), [null, '']);
assert.deepEqual(booleanValues({ kind: 'boolean', on: 'true' }), [null, 'true']);
assert.equal(booleanValues({ kind: 'enum', on: '' }), null);

// Property and option labels read like a lowercase code inspector.
assert.equal(propertyLabel('showIconStart'), 'show icon start');
assert.equal(propertyLabel('value'), 'completion');
assert.equal(optionLabel('progress', 'value', null, [null, '50']), 'indeterminate');
assert.equal(optionLabel('toggle-group', 'data-spacing', null, [null, '']), 'off');
assert.equal(optionLabel('toggle-group', 'data-spacing', '', [null, '']), 'on');
assert.equal(optionLabel('image', 'data-ratio', null, [null, '1/1']), 'default');

// No profile declares the removed visual-state axis.
for (const [slug, profile] of Object.entries(profiles))
  assert(!('states' in profile), `${slug} must not declare a visual state axis`);

// Independent row inventory. A matrix-driven profile must cross every declared
// dimension; composed components list their documented anatomy explicitly.
const expectedRows = {
  button: 20,
  layout: 21,
  'toggle-group': 16,
  image: 56,
  'tree-view': 12,
  toast: 11,
  message: 10,
  'tool-call': 9,
  badge: 8,
  avatar: 6,
  tabs: 6,
  'agent-activity': 6,
  'todo-list': 6,
  icon: 5
};
for (const [slug, expected] of Object.entries(expectedRows))
  assert.equal((await matrixRows(await model(slug))).length, expected, `${slug} matrix rows`);

// A declared matrix must cross to the documented count.
function declaredCount(slug) {
  return (profiles[slug].matrix || []).reduce((count, dimension) => {
    if (dimension.prop) return count * profiles[slug].props[dimension.prop].length;
    if (dimension.bool) return count * booleanValues({ kind: 'boolean', on: '' }).length;
    if (dimension.content) return count * Object.keys(profiles[slug].content).length;
    if (dimension.slot) return count * slots[slug].values.length;
    return count;
  }, 1);
}
assert.equal(declaredCount('button'), expectedRows.button);
assert.equal(declaredCount('toggle-group'), expectedRows['toggle-group']);
assert.equal(declaredCount('icon'), expectedRows.icon);
const layoutGap = profiles.layout.props['data-gap'].length;
assert.equal(
  slots.layout.values.reduce(
    (count, primitive) => count + (profiles.layout.gapFor.includes(primitive) ? layoutGap : 1),
    0
  ),
  expectedRows.layout,
  'Gap only separates children in the declared primitives'
);
const imageEnums = Object.entries(profiles.image.props).filter(
  ([attr]) => !nonVisualProps.has(attr)
);
assert.equal(
  imageEnums.reduce((count, [, values]) => count * values.length, 1),
  expectedRows.image,
  'Image crosses its three visual enum properties, not data-preview'
);

// Five button variants cross four content forms. Icon-only content owns its
// accessible name and icon; loading stays a boolean, not a matrix axis.
const buttons = await matrixRows(await model('button'));
assert(
  buttons.some(
    (row) =>
      row.html.includes('data-variant="destructive"') &&
      row.html.includes('aria-label="Button"') &&
      row.html.includes(demoIcon)
  )
);
const buttonModel = await model('button');
const loadingButton = await operate(
  buttonModel.html,
  contentOperations(buttonModel.scopes[0], { showLabel: true, loading: true })
);
assert(await has(loadingButton, '.btn[aria-busy="true"]'));
assert(loadingButton.includes(demoSpinner));

const toggles = await matrixRows(await model('toggle'));
assert(
  toggles.some(
    (row) => row.html.includes('data-variant="outline"') && row.html.includes('aria-pressed="true"')
  )
);

const groups = await matrixRows(await model('toggle-group'));
const disabledGroup = await compileModel(
  fixture(
    'toggle-group',
    '<div class="toggle-group" data-disabled><button class="toggle" type="button" aria-pressed="false">First</button><button class="toggle" type="button" aria-pressed="true">Second</button></div>'
  )
);
const disabledRows = (await matrixRows(disabledGroup)).filter((row) =>
  row.html.includes('data-disabled=""')
);
assert.equal(disabledRows.length, 8, 'Disabled group crosses the other dimensions');
for (const row of disabledRows)
  assert.equal(
    (await attrs(row.html, '.toggle[disabled]')).length,
    2,
    'Disabled group disables its native Toggle children'
  );
assert(
  groups.some(
    (row) =>
      row.html.includes('data-orientation="vertical"') &&
      row.html.includes('data-variant="outline"') &&
      row.html.includes('data-spacing=""') &&
      row.html.includes('data-disabled=""')
  )
);

// Parent appearance is a root dimension; selection is a tab-trigger property.
const tabs = await matrixRows(await model('tabs'));
assert(
  tabs.some(
    (row) =>
      row.html.includes('data-variant="underline"') &&
      row.html.includes('aria-orientation="vertical"') &&
      row.html.includes('aria-selected="true"')
  ),
  'Contextual tab appearance crosses parent selection'
);
assert.equal(
  tabs.filter((row) => row.scope?.type === 'tab' && row.html.includes('aria-selected="true"'))
    .length,
  1,
  'Selection is an exclusive tab-trigger property'
);

const toasts = await matrixRows(await model('toast'));
for (const variant of ['', 'success', 'warning', 'destructive', 'info'])
  assert(
    toasts.some(
      (row) => row.html.includes('toast-action') && row.html.includes(`data-variant="${variant}"`)
    ),
    `Toast action ${variant}`
  );

const cards = await matrixRows(await model('card'));
assert.equal(cards.length, 1, 'Do not clone the complete Card for standalone Button states');
for (const slug of ['popover', 'hover-card']) {
  const m = await compileModel(fixture(slug, `<div class="${slug}" popover>Content</div>`));
  const root = m.scopes[0];
  assert.equal(initialValue(root, prop(root, 'data-side')), 'bottom');
  assert.equal(initialValue(root, prop(root, 'data-align')), 'center');
  const placement = await matrixRows(m);
  assert.equal(placement.length, 4, `${slug} crosses its four placement sides`);
  for (const side of ['top', 'right', 'bottom', 'left'])
    assert(
      placement.some((row) => row.html.includes(`data-side="${side}"`)),
      `${slug}: ${side}`
    );
}

// Repeated instances retain their own authored checked, disabled, readonly and
// open values. Compile and browser consume exactly the same property arrays.
const form = await compileModel(
  fixture(
    'form',
    '<form class="form"><input class="checkbox" type="checkbox" checked disabled><input class="checkbox" type="checkbox"><button class="btn" data-variant="secondary" disabled>A</button><button class="btn">B</button><input class="text-field-input" readonly><input class="text-field-input"></form>'
  )
);
const checks = form.scopes.find((s) => s.type === 'checkbox');
assert.deepEqual(prop(checks, 'checked').initialValues, ['', null]);
assert.deepEqual(prop(checks, 'disabled').initialValues, ['', null]);
assert.deepEqual(prop(checks, 'invalid').initialValues, [null, null]);
assert(await has(form.html, '.checkbox[checked][disabled]'));
assert.equal((await attrs(form.html, '.checkbox[checked]')).length, 1);
const inputs = form.scopes.find((s) => s.type === 'text-field');
assert.deepEqual(prop(inputs, 'readonly').initialValues, ['', null]);
const actions = form.scopes.find((s) => s.type === 'button');
// A grouped button never owns its variant; the owning group or form sets it.
assert.equal(prop(actions, 'data-variant'), undefined);
assert.deepEqual(prop(actions, 'disabled').initialValues, ['', null]);
assert.equal((await attrs(form.html, '.btn[disabled]')).length, 1);

const disclosure = await compileModel(
  fixture(
    'accordion',
    '<div class="accordion"><details class="accordion-item" open><summary>A</summary></details><details class="accordion-item"><summary>B</summary></details></div>'
  )
);
const disclosureItems = disclosure.scopes.find((s) => s.type === 'accordion-item');
const openProp = prop(disclosureItems, 'open');
assert.deepEqual(openProp.initialValues, ['', null]);
assert.equal((await attrs(disclosure.html, '.accordion-item[open]')).length, 1);

// Reset reapplies each instance's authored value, not the first option.
const booleanProperties = (scope) => scope.props.filter((p) => p.kind === 'boolean');
let changedChecks = await operate(
  form.html,
  checks.instances.flatMap((_, index) =>
    booleanProperties(checks).flatMap((p) => propertyOperations({ ...checks, index }, p, null))
  )
);
changedChecks = await operate(
  changedChecks,
  checks.instances.flatMap((_, index) =>
    booleanProperties(checks).flatMap((p) =>
      propertyOperations({ ...checks, index }, p, initialValue(checks, p, index))
    )
  )
);
assert.deepEqual(await attrs(changedChecks, '.checkbox'), await attrs(form.html, '.checkbox'));
let changedDisclosure = await operate(
  disclosure.html,
  disclosureItems.instances.flatMap((_, index) =>
    propertyOperations({ ...disclosureItems, index }, openProp, null)
  )
);
changedDisclosure = await operate(
  changedDisclosure,
  disclosureItems.instances.flatMap((_, index) =>
    propertyOperations(
      { ...disclosureItems, index },
      openProp,
      initialValue(disclosureItems, openProp, index)
    )
  )
);
assert.deepEqual(
  await attrs(changedDisclosure, '.accordion-item'),
  await attrs(disclosure.html, '.accordion-item')
);

const expectedInventory = {
  'toggle-group': { root: ['data-orientation', 'data-variant', 'data-spacing', 'data-disabled'] },
  avatar: { 'part-avatar-badge': ['hidden'] },
  image: { root: ['data-ratio', 'data-fit', 'data-radius'] },
  'agent-activity': { 'part-activity-item': ['data-status'] },
  'todo-list': { 'part-todo-item': ['data-status'] },
  composer: { root: ['data-state'], 'part-composer-input': ['readonly'] },
  progress: { root: ['value'] },
  statistic: { 'part-statistic-trend': ['data-trend'] },
  timeline: { 'part-timeline-marker': ['data-variant'] },
  'tree-view': { 'part-tree-connector': ['data-variant'] },
  sources: { 'part-source-link': [] }
};
for (const [slug, required] of Object.entries(expectedInventory)) {
  const m = await model(slug);
  for (const [id, properties] of Object.entries(required)) {
    const scope = m.scopes.find((s) => s.id === id);
    assert(scope, `${slug}: ${id}`);
    assert(await has(m.html, scope.selector), `${slug}: usable selector ${scope.selector}`);
    for (const attr of properties)
      assert(
        scope.props.some((p) => p.attr === attr),
        `${slug}: ${attr}`
      );
  }
}
const activity = await model('agent-activity');
const activityScope = activity.scopes.find((s) => s.type === 'activity-item');
const updatedActivity = await operate(
  activity.html,
  propertyOperations({ ...activityScope, index: 1 }, prop(activityScope, 'data-status'), 'error')
);
assert(await has(updatedActivity, '.agent-activity-item:nth-child(2)[data-status="error"]'));
assert.match(updatedActivity, /agent-activity-status[^>]*>Error</);
assert.equal(
  (await attrs(updatedActivity, '.agent-activity-item[data-status="complete"]')).length,
  1
);
// Missing status text in one owner must not mutate the next owner's text.
const sparse = await compileModel(
  fixture(
    'agent-activity',
    '<ol class="agent-activity"><li class="agent-activity-item" data-status="pending"></li><li class="agent-activity-item" data-status="complete"><span class="agent-activity-status">Complete</span></li></ol>'
  )
);
const sparseScope = sparse.scopes.find((s) => s.type === 'activity-item');
const sparseChanged = await operate(
  sparse.html,
  propertyOperations({ ...sparseScope, index: 0 }, prop(sparseScope, 'data-status'), 'error')
);
assert.match(sparseChanged, /agent-activity-status[^>]*>Complete</);
const nestedCalls = await compileModel(
  fixture(
    'tool-call',
    '<details class="tool-call" data-status="pending"><summary><span class="tool-call-state">Pending</span></summary><details class="tool-call" data-status="complete"><summary><span class="tool-call-state">Complete</span></summary></details></details>'
  )
);
const nestedChanged = await operate(
  nestedCalls.html,
  propertyOperations(nestedCalls.scopes[0], prop(nestedCalls.scopes[0], 'data-status'), 'error')
);
assert.match(nestedChanged, /tool-call-state[^>]*>Error</);
assert.match(
  nestedChanged,
  /tool-call-state[^>]*>Complete</,
  'Nested owners retain their own status'
);

const todos = await model('todo-list');
const todoScope = todos.scopes.find((s) => s.type === 'todo-item');
const changedTodo = await operate(
  todos.html,
  propertyOperations({ ...todoScope, index: 1 }, prop(todoScope, 'data-status'), 'error')
);
assert.match(changedTodo, /todo-item-status[^>]*>Error</);
assert.match(changedTodo, /todo-item-status[^>]*>Done</);
const todoRows = (await matrixRows(todos)).filter((r) => r.scope?.type === 'todo-item');
assert.equal(todoRows.length, 4);
for (const row of todoRows) {
  assert.equal(
    (await attrs(row.html, '.todo-item')).length,
    1,
    'A status atom does not repeat the full task list'
  );
  assert(!(await has(row.html, '.todo-list-summary')), 'No unrelated parent summary');
}

const progress = await matrixRows(await model('progress'));
assert(
  progress.some((r) => !r.html.includes('value=')),
  'Indeterminate progress'
);
for (const value of ['0', '50', '100'])
  assert(progress.some((r) => r.html.includes(`value="${value}"`)));
const composer = await model('composer');
const thinking = await operate(
  composer.html,
  propertyOperations(composer.scopes[0], prop(composer.scopes[0], 'data-state'), 'thinking')
);
assert(await has(thinking, '.composer[data-state="thinking"][aria-busy="true"]'));
assert.match(thinking, /composer-status[^>]*>Thinking…</);

// The live playground generates calendar days at runtime, so the inert export
// carries the single active day atom. `dynamic` is no longer a scope field.
const calendar = await model('date-picker');
assert(!calendar.scopes.some((s) => s.type === 'day'), 'No synthetic live day atom');
assert.equal((await attrs(calendar.staticHtml, '.date-picker-day button[tabindex="0"]')).length, 1);
assert((await attrs(calendar.staticHtml, '.date-picker-day button')).length > 1);
assert.equal((await matrixRows(calendar)).length, 1);

const navigation = await model('nav');
const links = navigation.scopes.find((s) => s.type === 'nav-link');
assert(links.exclusive);
const selected = await operate(navigation.html, exclusiveOperations(links, 1));
assert.equal((await attrs(selected, '.nav-item-link[aria-current="page"]')).length, 1);
const disabledLink = await operate(
  navigation.html,
  propertyOperations({ ...links, index: 0 }, prop(links, 'disabled'), '')
);
assert(await has(disabledLink, '.nav-item-link[aria-disabled="true"]'));

const typography = await model('typography');
assert.equal(typography.presentation, true);
assert.deepEqual(typography.scopes[0].props, []);
assert.equal((await matrixRows(typography)).length, 1);
for (let level = 1; level <= 6; level++) assert(await has(typography.html, `h${level}`));
for (const reference of await attrs(typography.html, '[role="doc-noteref"], [role="doc-backlink"]'))
  assert(await has(typography.html, `[id="${reference.href.slice(1)}"]`));

// Exercise the complete catalog and property operations without writing outputs.
assert.equal(
  rootProfile('time-field').target,
  '.time-field',
  'Native time input is not the structured Time Field root'
);
const slider = await model('slider');
const sliderOrientation = prop(slider.scopes[0], 'data-orientation');
const verticalSlider = await operate(
  slider.html,
  propertyOperations(slider.scopes[0], sliderOrientation, 'vertical')
);
assert(
  await has(verticalSlider, '.slider[data-orientation="vertical"][aria-orientation="vertical"]')
);
const horizontalSlider = await operate(
  verticalSlider,
  propertyOperations(slider.scopes[0], sliderOrientation, 'horizontal')
);
assert(
  await has(
    horizontalSlider,
    '.slider[data-orientation="horizontal"][aria-orientation="horizontal"]'
  )
);
const boundedSlider = await compileModel(
  fixture('slider', '<input class="slider" type="range" min="10" max="30" value="15">')
);
assert.match(boundedSlider.staticHtml, /--slider-value:25%/);

for (const [slug, statusClass, streamingText] of [
  ['code-block', 'code-block-state', 'Streaming'],
  ['reasoning', 'reasoning-status', 'In progress'],
  ['file-diff', 'file-diff-state', 'Updating']
]) {
  const m = await model(slug);
  const streamingProp = prop(m.scopes[0], 'data-streaming');
  assert(streamingProp);
  const busy = await operate(m.html, propertyOperations(m.scopes[0], streamingProp, ''));
  assert(await has(busy, `.${slug}[data-streaming][aria-busy="true"]`));
  assert(busy.includes(`>${streamingText}</`), slug);
  const completed = await operate(busy, propertyOperations(m.scopes[0], streamingProp, null));
  assert(!(await has(completed, `.${slug}[data-streaming], .${slug}[aria-busy="true"]`)));
  assert.match(completed, new RegExp(`${statusClass}[^>]*>Complete<`));
}
const streamingPair = await compileModel(
  fixture(
    'code-block',
    '<figure class="code-block"><span class="code-block-state">Complete</span></figure><figure class="code-block"><span class="code-block-state">Complete</span></figure>'
  )
);
const secondStreaming = await operate(
  streamingPair.html,
  propertyOperations(
    { ...streamingPair.scopes[0], index: 1 },
    prop(streamingPair.scopes[0], 'data-streaming'),
    ''
  )
);
assert.equal((await attrs(secondStreaming, '.code-block[aria-busy="true"]')).length, 1);
assert.match(secondStreaming, /code-block-state[^>]*>Complete</);
assert.match(secondStreaming, /code-block-state[^>]*>Streaming</);

const message = await model('message');
assert(prop(message.scopes[0], 'data-grouped'), 'Message grouped property');
for (const [author, name, avatar] of [
  ['user', 'You', 'Y'],
  ['assistant', 'Assistant', 'A'],
  ['system', 'System', 'S']
]) {
  const changed = await operate(
    message.html,
    propertyOperations(message.scopes[0], prop(message.scopes[0], 'data-author'), author)
  );
  assert(await has(changed, `.message-content[aria-label="${name}"]`));
  assert.match(changed, new RegExp(`message-name[^>]*>${name}<`));
  assert.match(changed, new RegExp(`message-avatar[^>]*>${avatar}<`));
}
const badges = await matrixRows(await model('badge'));
assert.equal(
  badges.length,
  8,
  'Four neutral variants and four statuses, never their forbidden product'
);
for (const row of badges) {
  const [badge] = await attrs(row.html, '.badge');
  // An empty neutral state is not a status, so only a non-empty state forbids a variant.
  assert(
    !(badge['data-state'] && badge['data-variant']),
    'A real status never keeps a neutral variant'
  );
}
for (const [status, text] of [
  ['positive', 'Ready'],
  ['caution', 'Delayed'],
  ['negative', 'Failed'],
  ['running', 'Running']
])
  assert(
    badges.some((r) => r.html.includes(`data-state="${status}"`) && r.html.includes(`>${text}<`))
  );
const badgeModel = await model('badge');
const badgeState = prop(badgeModel.scopes[0], 'data-state');
const negativeBadge = await operate(
  badgeModel.html,
  propertyOperations(badgeModel.scopes[0], badgeState, 'negative')
);
assert(!(await has(negativeBadge, '.badge[data-variant]')), 'Status removes the neutral variant');
assert.match(negativeBadge, /badge[^>]*>Failed</);
const neutralBadge = await operate(
  badgeModel.html,
  propertyOperations(badgeModel.scopes[0], badgeState, '')
);
assert(
  await has(neutralBadge, '.badge[data-variant][data-state]'),
  'Neutral state keeps the variant'
);

const avatarRows = await matrixRows(await model('avatar'));
assert.equal(avatarRows.length, 6, 'Three content forms each with and without badge');
for (const row of avatarRows) {
  assert.equal(
    row.scope.id,
    'part-avatar-badge',
    'Badge presence composes the Avatar, not an invisible standalone atom'
  );
  assert(await has(row.html, '.avatar .avatar-fallback'));
}
assert.equal(
  avatarRows.filter((row) => row.label.includes('hidden: on')).length,
  3,
  'Badge presence crosses the three content forms'
);
for (const row of avatarRows.filter((row) => row.label.includes('hidden: on')))
  assert(await has(row.html, '.avatar-badge[hidden]'));
for (const row of avatarRows.filter((row) => row.label.includes('hidden: off')))
  assert(!(await has(row.html, '.avatar-badge[hidden]')));

const field = await model('field');
assert.deepEqual(prop(field.scopes[0], 'data-orientation').values, [null, 'horizontal']);
const formModel = await model('form');
assert(!formModel.scopes[0].props.some((p) => p.attr === 'data-orientation'));
assert(
  formModel.scopes.some(
    (s) => s.type === 'form-field' && s.props.some((p) => p.attr === 'data-orientation')
  )
);

const numberModel = await compileModel(
  fixture(
    'number-field',
    '<div class="number-field"><input class="quantity-control" type="number" value="2"><button type="button">−</button><button type="button">+</button></div>'
  )
);
assert(await has(numberModel.staticHtml, '.number-field[data-mewa-number-field-init]'));
assert(
  !(await has(numberModel.html, '.number-field[data-mewa-number-field-init]')),
  'Do not mark live native fallbacks as enhanced'
);
assert.equal(
  numberModel.scopes[0].instanceSelectors[0],
  '.quantity-control',
  'Prefer unique class anchors over top-level nth-of-type paths'
);
const wrappedNumber = `<div><div>Unrelated same-tag sibling</div><div class="playground-demo">${numberModel.html}</div><button class="outside" type="button">Outside</button></div>`;
const disabledNumber = await operate(
  wrappedNumber,
  propertyOperations(numberModel.scopes[0], prop(numberModel.scopes[0], 'disabled'), '')
);
assert.equal((await attrs(disabledNumber, '.number-field button[disabled]')).length, 2);
assert(!(await has(disabledNumber, '.outside[disabled]')));
assert.equal(propertyLabel('value'), 'completion');
assert.equal(optionLabel('progress', 'value', null, [null, '50']), 'indeterminate');
assert(
  await has(
    (await model('progress')).html,
    '.progress[max="100"][value="50"][aria-label="Completion"]'
  )
);

// These contextual controls do not share the standalone Text Field/Button
// contract. Each exposes its own atom, and a disabled boolean must target that
// atom rather than the composed root.
for (const [slug, expectedParts] of [
  ['input-otp', [['otp', '.input-otp input:not([type="hidden"])']]],
  [
    'color-picker',
    [
      ['color', '.color-picker-input'],
      ['color-hex', '.color-picker-hex']
    ]
  ],
  ['suggestion', [['suggestion-item', '.suggestion-button']]],
  [
    'time-field',
    [
      ['time', '.time-field-input'],
      ['time-period', '.time-field-select']
    ]
  ],
  ['date-range-picker', [['range-date', '.date-range-input']]]
]) {
  const m = await model(slug);
  const rows = await matrixRows(m);
  for (const [type, target] of expectedParts) {
    const scope = m.scopes.find((s) => s.type === type);
    assert(scope, `${slug} must expose ${type}`);
    assert.equal((await attrs(m.html, scope.selector)).length, scope.count);
    assert(!scope.selector.includes(`.${slug} .${slug} `), `${slug}: no duplicated root qualifier`);
    const parts = rows.filter((row) => row.scope?.type === type);
    assert(parts.length, `${slug}: ${type} must not be suppressed as a standalone atom`);
    const disabledProp = prop(scope, 'disabled');
    assert(disabledProp, `${slug}: ${type} disabled property`);
    const html = await operate(
      parts[0].html,
      propertyOperations({ ...parts[0].scope, index: 0 }, disabledProp, '')
    );
    assert(
      await has(html, `${target}[disabled]`),
      `${slug}: ${type} disabled targets its actual styled atom`
    );
  }
}

const table = await model('table');
assert.deepEqual(table.slot, { label: 'density', values: ['plain', 'dense'], default: 'plain' });
const tableRows = await matrixRows(table);
assert.equal(tableRows.filter((row) => row.scope.id === 'root').length, 2);
assert(tableRows.some((row) => row.html.includes('table--dense')));
assert(tableRows.some((row) => !row.html.includes('table--dense')));
const header = await model('header');
assert.deepEqual(prop(header.scopes[0], 'data-sticky').values, [null, '']);
assert((await matrixRows(header)).some((row) => row.html.includes('data-sticky=""')));

const toolCall = await model('tool-call');
assert.deepEqual(toolCall.slot, {
  label: 'structure',
  values: ['disclosure', 'status-only'],
  default: 'disclosure'
});
const callRows = await matrixRows(toolCall);
const statusRows = callRows.filter((row) => row.html.includes('tool-call-static'));
assert.equal(statusRows.length, 4, 'One status-only row per real status, not Closed/Open copies');
for (const row of statusRows) {
  assert(await has(row.html, 'div.tool-call.tool-call-static'));
  assert(!(await has(row.html, 'details,summary,.tool-call-content,[open]')));
}
for (const [status, text, mark] of [
  ['pending', 'Pending', '·'],
  ['running', 'Running', '›'],
  ['complete', 'Complete', '✓'],
  ['error', 'Error', '!']
]) {
  const row = statusRows.find((candidate) => candidate.html.includes(`data-status="${status}"`));
  assert(row, `Tool Call status-only ${status}`);
  assert.match(row.html, new RegExp(`tool-call-state[^>]*>${text}<`));
  assert.match(row.html, new RegExp(`tool-call-mark[^>]*>${mark}<`));
}
const authoredCall = fixture(
  'tool-call',
  '<details class="tool-call" data-status="pending" open><summary class="tool-call-summary"><span class="tool-call-mark" aria-hidden="true">·</span><span class="tool-call-label">Read unique-file.js</span><span class="tool-call-state">Pending</span></summary><div class="tool-call-content">Result</div></details>'
);
const authoredSnapshot = JSON.stringify(authoredCall);
const authoredModel = await compileModel(authoredCall);
const selectedError = await operate(
  authoredModel.html,
  propertyOperations(authoredModel.scopes[0], prop(authoredModel.scopes[0], 'data-status'), 'error')
);
const statusOnly = await operate(selectedError, slotOperations('tool-call', 'status-only'));
assert(
  statusOnly.includes('Read unique-file.js'),
  'Structural slot preserves the authored operation label'
);
assert.match(
  statusOnly,
  /tool-call-state[^>]*>Error</,
  'Structural slot preserves already-selected status'
);
assert(
  !statusOnly.includes('Pending'),
  'Do not copy stale baseline text into the selected structure'
);
assert.equal(
  JSON.stringify(authoredCall),
  authoredSnapshot,
  'Compilation never mutates shared authored fixtures'
);
assert(
  await has(authoredModel.html, 'details.tool-call[open]'),
  'Canonical reset remains the authored disclosure'
);

let cells = 0;
for (const c of source) {
  const m = await compileModel(c);
  const rows = await matrixRows(m);
  assert(rows.length, c.slug);
  for (const scope of m.scopes)
    for (const property of scope.props) {
      assert(
        !/focus|hover/i.test(property.name),
        `${c.slug}: ${property.name} is a pseudo-state, not a property`
      );
      if (property.attr)
        assert(
          !/focus|hover/i.test(property.attr),
          `${c.slug}: ${property.attr} is a pseudo-state, not an attribute`
        );
    }
  const unique = new Set();
  for (const row of rows) {
    const key = JSON.stringify([row.html, row.scope?.target]);
    assert(!unique.has(key), `${c.slug}: duplicate matrix row`);
    unique.add(key);
    if (row.scope)
      await operate(
        row.html,
        row.scope.props.flatMap((p) =>
          propertyOperations({ ...row.scope, index: 0 }, p, initialValue(row.scope, p, 0))
        )
      );
    cells++;
  }
}
console.log(
  `Documentation model completion passed (${source.length} components, ${cells} matrix cells).`
);
