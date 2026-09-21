import assert from 'node:assert/strict';
import source from '../docs/specimens.json';
import { compileModel, matrixRows, operate, rewrite } from '../scripts/docs-model.mjs';
import {
  booleanValues,
  initialValue,
  rootProfile,
  statesFor,
  propertyConstraints,
  propertyLabel,
  optionLabel
} from '../docs/component-model.mjs';
import {
  propertyOperations,
  stateOperations,
  slotOperations,
  exclusiveOperations
} from '../docs/model-operations.mjs';

const model = async (slug) => compileModel(source.find((c) => c.slug === slug));
const fixture = (slug, html) => ({ slug, name: slug, samples: [{ html }], specimens: [{ html }] });
async function attrs(html, selector) {
  const found = [];
  await rewrite(html, [[selector, (el) => found.push(Object.fromEntries(el.attributes))]]);
  return found;
}
async function has(html, selector) {
  return (await attrs(html, selector)).length > 0;
}

assert.deepEqual(booleanValues([null, '']), [null, '']);
assert.deepEqual(booleanValues(['true', 'false']), ['false', 'true']);
assert.equal(booleanValues(['outline', 'solid']), null);

// Expected combinations come from the public visual contract, not snapshots
// of the generator: five button variants cross four distinct content forms.
const buttons = await matrixRows(await model('button'));
assert.equal(buttons.length, 20);
assert(
  buttons.some(
    (r) =>
      r.html.includes('data-variant="destructive"') &&
      r.html.includes('data-icon-only=""') &&
      r.html.includes('aria-label="Button"')
  )
);
assert(
  buttons.some(
    (r) =>
      r.html.includes('data-variant="secondary"') &&
      r.html.includes('class="spinner"') &&
      r.html.includes('aria-busy="true"')
  )
);
const toggles = await matrixRows(await model('toggle'));
assert(
  toggles.some(
    (r) => r.html.includes('data-variant="outline"') && r.html.includes('aria-pressed="true"')
  )
);
const groups = await matrixRows(await model('toggle-group'));
assert.equal(groups.length, 16, 'Orientation × outline × spacing × disabled');
const disabledGroup = await compileModel(
  fixture(
    'toggle-group',
    '<div class="toggle-group" data-disabled><button class="toggle" type="button" aria-pressed="false">First</button><button class="toggle" type="button" aria-pressed="true">Second</button></div>'
  )
);
assert.equal(
  (await attrs(disabledGroup.html, '.toggle[disabled]')).length,
  2,
  'Child normalization must not re-enable a disabled group'
);
assert(
  groups.some(
    (r) =>
      r.html.includes('data-orientation="vertical"') &&
      r.html.includes('data-variant="outline"') &&
      r.html.includes('data-spacing=""') &&
      r.html.includes('data-disabled=""')
  )
);
const tabs = (await matrixRows(await model('tabs'))).filter((r) => r.scope?.type === 'tab');
assert(
  tabs.some(
    (r) =>
      r.html.includes('data-variant="underline"') &&
      r.html.includes('aria-orientation="vertical"') &&
      r.html.includes('aria-selected="true"') &&
      r.states.includes('Focus')
  ),
  'Contextual tab state crosses parent appearance and selection'
);
const toasts = await matrixRows(await model('toast'));
for (const variant of ['', 'success', 'warning', 'destructive', 'info'])
  assert(
    toasts.some(
      (r) => r.html.includes('toast-action') && r.html.includes(`data-variant="${variant}"`)
    ),
    `Toast action ${variant}`
  );

const cards = await matrixRows(await model('card'));
assert.equal(cards.length, 1, 'Do not clone the complete Card for standalone Button states');
for (const slug of ['popover', 'hover-card']) {
  const m = await compileModel(fixture(slug, `<div class="${slug}" popover>Content</div>`));
  const root = m.scopes[0];
  assert.equal(
    initialValue(
      root,
      root.props.find((p) => p.attr === 'data-side')
    ),
    'bottom'
  );
  assert.equal(
    initialValue(
      root,
      root.props.find((p) => p.attr === 'data-align')
    ),
    'center'
  );
  assert.equal((await matrixRows(m)).length, 1, `${slug} has no isolated placement visuals`);
}

// Repeated instances retain their own authored absence, checked, disabled and
// disclosure state. Compile and browser consume exactly the same arrays.
const form = await compileModel(
  fixture(
    'form',
    '<form class="form"><input class="checkbox" type="checkbox" checked disabled><input class="checkbox" type="checkbox"><button class="btn" data-variant="secondary" disabled>A</button><button class="btn">B</button><input class="text-field-input" readonly><input class="text-field-input"></form>'
  )
);
const checks = form.scopes.find((s) => s.type === 'checkbox');
assert.deepEqual(checks.initialStates, ['Checked disabled', 'Default']);
assert(await has(form.html, '.checkbox[checked][disabled]'));
assert.equal((await attrs(form.html, '.checkbox[checked]')).length, 1);
const inputs = form.scopes.find((s) => s.type === 'text-field');
assert.deepEqual(inputs.props.find((p) => p.attr === 'readonly').initialValues, ['', null]);
const actions = form.scopes.find((s) => s.type === 'button');
assert.deepEqual(actions.initialStates, ['Disabled', 'Default']);
assert.deepEqual(actions.props.find((p) => p.attr === 'data-variant').initialValues, [
  'secondary',
  'default'
]);
const disclosure = await compileModel(
  fixture(
    'accordion',
    '<div class="accordion"><details class="accordion-item" open><summary>A</summary></details><details class="accordion-item"><summary>B</summary></details></div>'
  )
);
assert.deepEqual(disclosure.scopes.find((s) => s.type === 'accordion-item').initialStates, [
  'Open',
  'Closed'
]);
assert.equal((await attrs(disclosure.html, '.accordion-item[open]')).length, 1);

for (const slug of [
  'text-field',
  'textarea',
  'select',
  'checkbox',
  'switch',
  'date-field',
  'number-field'
])
  assert(!statesFor(rootProfile(slug)).includes('Hover'), `${slug} has no hover rule`);

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
  propertyOperations({ ...activityScope, index: 1 }, 'data-status', 'error')
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
  propertyOperations({ ...sparseScope, index: 0 }, 'data-status', 'error')
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
  propertyOperations(nestedCalls.scopes[0], 'data-status', 'error')
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
  propertyOperations({ ...todoScope, index: 1 }, 'data-status', 'error')
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
  propertyOperations(composer.scopes[0], 'data-state', 'thinking')
);
assert(await has(thinking, '.composer[data-state="thinking"][aria-busy="true"]'));
assert.match(thinking, /composer-status[^>]*>Thinking…</);

const calendar = await model('date-picker');
const day = calendar.scopes.find((s) => s.type === 'day');
assert.equal(day.count, 1);
assert.equal(day.dynamic, true);
assert(day.selector.includes('[tabindex="0"]'));
assert.equal((await attrs(calendar.staticHtml, day.selector)).length, 1);
const dayRows = (await matrixRows(calendar)).filter((r) => r.scope?.type === 'day');
assert.equal(dayRows.length, 1);
assert.equal((await attrs(dayRows[0].html, '.date-picker-day button')).length, 1);

const navigation = await model('nav');
const links = navigation.scopes.find((s) => s.type === 'nav-link');
assert(links.exclusive);
const selected = await operate(navigation.html, exclusiveOperations(links, 1));
assert.equal((await attrs(selected, '.nav-item-link[aria-current="page"]')).length, 1);
const focusFirst = await operate(selected, stateOperations({ ...links, index: 0 }, 'Focus'));
assert.equal((await attrs(focusFirst, '.nav-item-link[data-demo-focus]')).length, 1);

const typography = await model('typography');
assert.equal(typography.presentation, true);
assert.deepEqual(typography.scopes[0].states, []);
for (let level = 1; level <= 6; level++) assert(await has(typography.html, `h${level}`));
for (const reference of await attrs(typography.html, '[role="doc-noteref"], [role="doc-backlink"]'))
  assert(await has(typography.html, `[id="${reference.href.slice(1)}"]`));

// Exercise the complete catalog and state operations without writing outputs.
assert.equal(
  rootProfile('time-field').target,
  '.time-field',
  'Native time input is not the structured Time Field root'
);
const slider = await model('slider');
const verticalSlider = await operate(
  slider.html,
  propertyOperations(slider.scopes[0], 'data-orientation', 'vertical')
);
assert(
  await has(verticalSlider, '.slider[data-orientation="vertical"][aria-orientation="vertical"]')
);
const horizontalSlider = await operate(
  verticalSlider,
  propertyOperations(slider.scopes[0], 'data-orientation', 'horizontal')
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
  assert(m.scopes[0].props.some((p) => p.attr === 'data-streaming'));
  const busy = await operate(m.html, propertyOperations(m.scopes[0], 'data-streaming', ''));
  assert(await has(busy, `.${slug}[data-streaming][aria-busy="true"]`));
  assert(busy.includes(`>${streamingText}</`), slug);
  const completed = await operate(busy, propertyOperations(m.scopes[0], 'data-streaming', null));
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
  propertyOperations({ ...streamingPair.scopes[0], index: 1 }, 'data-streaming', '')
);
assert.equal((await attrs(secondStreaming, '.code-block[aria-busy="true"]')).length, 1);
assert.match(secondStreaming, /code-block-state[^>]*>Complete</);
assert.match(secondStreaming, /code-block-state[^>]*>Streaming</);

const message = await model('message');
assert(message.scopes[0].props.some((p) => p.attr === 'data-grouped'));
for (const [author, name, avatar] of [
  ['user', 'You', 'Y'],
  ['assistant', 'Assistant', 'A'],
  ['system', 'System', 'S']
]) {
  const changed = await operate(
    message.html,
    propertyOperations(message.scopes[0], 'data-author', author)
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
for (const row of badges) assert(!(await has(row.html, '.badge[data-state][data-variant]')));
for (const [status, text] of [
  ['positive', 'Ready'],
  ['caution', 'Delayed'],
  ['negative', 'Failed'],
  ['running', 'Running']
])
  assert(
    badges.some((r) => r.html.includes(`data-state="${status}"`) && r.html.includes(`>${text}<`))
  );
assert.deepEqual(propertyConstraints({ type: 'badge' }, { 'data-state': 'negative' }), {
  hiddenProps: ['data-variant'],
  ignoredProps: ['data-variant']
});
assert.deepEqual(propertyConstraints({ type: 'badge' }, { 'data-state': '' }).ignoredProps, []);

const avatarRows = await matrixRows(await model('avatar'));
assert.equal(avatarRows.length, 6, 'Three content forms each with and without badge');
for (const row of avatarRows) {
  assert.equal(
    row.scope.id,
    'root',
    'Badge absence is an Avatar composition, not an invisible standalone atom'
  );
  assert(await has(row.html, '.avatar .avatar-fallback'));
}
const field = await model('field');
assert.deepEqual(field.scopes[0].props.find((p) => p.attr === 'data-orientation').values, [
  null,
  'horizontal'
]);
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
  stateOperations(numberModel.scopes[0], 'Disabled')
);
assert.equal((await attrs(disabledNumber, '.number-field button[disabled]')).length, 2);
assert(!(await has(disabledNumber, '.outside[disabled]')));
assert.equal(propertyLabel('value'), 'Completion');
assert.equal(optionLabel('progress', 'value', null, [null, '50']), 'Indeterminate');
assert(
  await has(
    (await model('progress')).html,
    '.progress[max="100"][value="50"][aria-label="Completion"]'
  )
);

// Reset reapplies each instance's authored state, not the first option.
let changedChecks = await operate(
  form.html,
  checks.instances.flatMap((_, index) => stateOperations({ ...checks, index }, 'Default'))
);
changedChecks = await operate(
  changedChecks,
  checks.initialStates.flatMap((state, index) => stateOperations({ ...checks, index }, state))
);
assert.deepEqual(await attrs(changedChecks, '.checkbox'), await attrs(form.html, '.checkbox'));
const items = disclosure.scopes.find((s) => s.type === 'accordion-item');
let changedDisclosure = await operate(
  disclosure.html,
  items.instances.flatMap((_, index) => stateOperations({ ...items, index }, 'Closed'))
);
changedDisclosure = await operate(
  changedDisclosure,
  items.initialStates.flatMap((state, index) => stateOperations({ ...items, index }, state))
);
assert.deepEqual(
  await attrs(changedDisclosure, '.accordion-item'),
  await attrs(disclosure.html, '.accordion-item')
);

// These contextual controls do not share the standalone Text Field/Button
// presentation contract. Each needs its own real visual-state matrix.
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
    const parts = rows.filter((row) => row.scope.type === type);
    assert(parts.length, `${slug}: ${type} must not be suppressed as a standalone atom`);
    for (const state of ['Focus', 'Disabled']) {
      const row = parts.find((candidate) => candidate.states.includes(state));
      assert(row, `${slug}: ${type} ${state} matrix`);
      const html = await operate(row.html, stateOperations(row.scope, state));
      assert(
        await has(html, `${target}${state === 'Focus' ? '[data-demo-focus]' : '[disabled]'}`),
        `${slug}: ${type} ${state} targets its actual styled atom`
      );
    }
  }
}

const table = await model('table');
assert.deepEqual(table.slot, { label: 'Density', values: ['plain', 'dense'], default: 'plain' });
const tableRows = await matrixRows(table);
assert.equal(tableRows.filter((row) => row.scope.id === 'root').length, 2);
assert(tableRows.some((row) => row.html.includes('table--dense')));
assert(tableRows.some((row) => !row.html.includes('table--dense')));
const header = await model('header');
assert.deepEqual(header.scopes[0].props.find((p) => p.attr === 'data-sticky').values, [null, '']);
assert((await matrixRows(header)).some((row) => row.html.includes('data-sticky=""')));

const toolCall = await model('tool-call');
assert.deepEqual(toolCall.slot, {
  label: 'Structure',
  values: ['disclosure', 'status-only'],
  default: 'disclosure'
});
const callRows = await matrixRows(toolCall);
const statusRows = callRows.filter((row) => row.html.includes('tool-call-static'));
assert.equal(statusRows.length, 4, 'One status-only row per real status, not Closed/Open copies');
for (const row of statusRows) {
  assert.deepEqual(row.states, ['Default']);
  assert.equal(row.scope.disclosure, false);
  assert(await has(row.html, 'div.tool-call.tool-call-static'));
  assert(!(await has(row.html, 'details,summary,.tool-call-content,[open]')));
  assert.deepEqual(stateOperations(row.scope, 'Default'), []);
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
  propertyOperations(authoredModel.scopes[0], 'data-status', 'error')
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
  const unique = new Set();
  for (const row of rows) {
    const key = JSON.stringify([row.html, row.scope?.target, row.states]);
    assert(!unique.has(key), `${c.slug}: duplicate matrix row`);
    unique.add(key);
    for (const state of row.states) {
      await operate(row.html, stateOperations(row.scope, state));
      cells++;
    }
  }
}
console.log(
  `Documentation model completion passed (${source.length} components, ${cells} matrix cells).`
);
