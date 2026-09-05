const describe = (value) => value?.outerHTML || JSON.stringify(value);
const assert = {
  equal(actual, expected, message = 'Values differ') {
    if (!Object.is(actual, expected))
      throw new Error(`${message}: expected ${describe(expected)}, received ${describe(actual)}`);
  },
  arrayEqual(actual, expected) {
    this.equal(actual.length, expected.length, 'Array length');
    actual.forEach((value, index) => this.equal(value, expected[index], `Array item ${index}`));
  }
};
const { createEnhancer } = await import('/mewa-ui/index.js');

const listenerRecords = new WeakMap();
const add = EventTarget.prototype.addEventListener;
const remove = EventTarget.prototype.removeEventListener;
EventTarget.prototype.addEventListener = function (type, callback, options) {
  const records = listenerRecords.get(this) || [];
  records.push({ type, callback });
  listenerRecords.set(this, records);
  return add.call(this, type, callback, options);
};
EventTarget.prototype.removeEventListener = function (type, callback, options) {
  const records = listenerRecords.get(this) || [];
  const index = records.findIndex((record) => record.type === type && record.callback === callback);
  if (index >= 0) records.splice(index, 1);
  return remove.call(this, type, callback, options);
};
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
function node(tag, attributes = {}, text) {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  if (text !== undefined) element.textContent = text;
  // Deterministic dimensions for the separator arithmetic case only.
  element.rect = {};
  const bounds = element.getBoundingClientRect.bind(element);
  element.getBoundingClientRect = () => Object.assign(bounds().toJSON(), element.rect);
  return element;
}
function fire(target, type, init = {}) {
  const event = new CustomEvent(type, {
    bubbles: init.bubbles ?? true,
    cancelable: true,
    detail: init.detail
  });
  for (const [name, value] of Object.entries(init)) {
    if (!['bubbles', 'detail', 'target'].includes(name))
      Object.defineProperty(event, name, { value });
  }
  (init.target || target).dispatchEvent(event);
  return event;
}
const key = (target, value, extra = {}) => fire(target, 'keydown', { key: value, ...extra });
const listeners = (target, type) =>
  (listenerRecords.get(target) || []).filter((record) => record.type === type).length;
let integration;
async function loadModule(slug, componentRoot) {
  document.body.append(componentRoot);
  const { behavior } = await import(`/mewa-ui/controllers/${slug}.js`);
  integration = createEnhancer([behavior]);
  integration.enhance(document);
  integration.observe(document);
  await settle();
  return {
    document,
    window,
    root: componentRoot,
    flushTimers: () => new Promise((resolve) => setTimeout(resolve, 10))
  };
}
const results = [];
async function test(name, callback) {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  window.runtimeProgress = name;
  try {
    await callback();
    results.push({ name });
  } catch (error) {
    results.push({ name, error: `${error.message}\n${error.stack || ''}` });
  } finally {
    integration?.disconnect();
    integration?.destroy(document);
    integration = null;
    document.body.replaceChildren();
    await settle();
  }
}
await test('todo lists derive completion from direct task items and inserted work', async () => {
  const root = node('details', { class: 'todo-list' });
  const summary = node('summary', { class: 'todo-list-summary' });
  const progress = node(
    'span',
    { class: 'todo-list-progress', 'data-todo-progress': '' },
    'Authored progress'
  );
  const content = node('div', { class: 'todo-list-content' });
  const list = node('ol', { class: 'todo-list-items' });
  const complete = node(
    'li',
    { class: 'todo-item', 'data-todo-item': '', 'data-status': 'done' },
    'Read the test'
  );
  const active = node(
    'li',
    { class: 'todo-item', 'data-todo-item': '', 'data-status': 'active' },
    'Trace the failure'
  );
  summary.append(progress);
  list.append(complete, active);
  content.append(list);
  root.append(summary, content);

  await loadModule('todo-list', root);
  await settle();
  assert.equal(progress.textContent, '1 of 2 complete');

  let detail;
  root.addEventListener('todo-list:progress', (event) => {
    detail = event.detail;
  });
  list.append(
    node(
      'li',
      { class: 'todo-item', 'data-todo-item': '', 'data-status': 'done' },
      'Run the checks'
    )
  );
  await settle();
  assert.equal(progress.textContent, '2 of 3 complete');
  await settle();
  assert.equal(detail.completed, 2);
  await settle();
  assert.equal(detail.total, 3);
});

await test('checkbox groups coordinate select-all state and disabled items', async () => {
  const group = node('fieldset', { class: 'checkbox-group', 'data-checkbox-group': '' });
  const selectAll = node('input', { class: 'checkbox', type: 'checkbox', 'data-checkbox-all': '' });
  const email = node('input', {
    class: 'checkbox',
    type: 'checkbox',
    'data-checkbox-item': '',
    value: 'email'
  });
  const push = node('input', {
    class: 'checkbox',
    type: 'checkbox',
    'data-checkbox-item': '',
    value: 'push'
  });
  const disabled = node('input', {
    class: 'checkbox',
    type: 'checkbox',
    'data-checkbox-item': '',
    value: 'sms',
    disabled: ''
  });
  const status = node('output', { class: 'checkbox-group-status', 'data-checkbox-status': '' });
  email.checked = true;
  push.checked = false;
  disabled.checked = false;
  group.append(selectAll, email, push, disabled, status);
  const runtime = await loadModule('checkbox', group);
  const changes = [];
  group.addEventListener('checkbox-group:change', (event) => changes.push(event.detail));

  await settle();

  assert.equal(group.dataset.state, 'partial');
  await settle();
  assert.equal(selectAll.indeterminate, true);
  await settle();
  assert.equal(status.textContent, '1 of 2 options selected.');
  selectAll.checked = true;
  fire(selectAll, 'change');
  await settle();
  assert.equal(email.checked, true);
  await settle();
  assert.equal(push.checked, true);
  await settle();
  assert.equal(disabled.checked, false);
  await settle();
  assert.equal(group.dataset.state, 'complete');
  await settle();
  assert.equal(status.textContent, '2 of 2 options selected.');
  await settle();
  assert.arrayEqual(Array.from(changes[0].values), ['email', 'push']);
  await settle();
  assert.equal(changes[0].selected, 2);
  await settle();
  assert.equal(changes[0].total, 2);
  await settle();
  assert.equal(changes[0].source, 'select-all');
  await settle();
  assert.equal(runtime.document.activeElement, runtime.document.body);
});

await test('tabs activate programmatically through the tabs:activate event', async () => {
  const tablist = node('div', { class: 'tab-list', role: 'tablist', 'aria-label': 'Demo' });
  const summary = node('button', {
    type: 'button',
    class: 'tab-trigger',
    role: 'tab',
    'aria-selected': 'true',
    'aria-controls': 'panel-summary',
    id: 'tab-summary'
  });
  const detail = node('button', {
    type: 'button',
    class: 'tab-trigger',
    role: 'tab',
    'aria-selected': 'false',
    'aria-controls': 'panel-detail',
    id: 'tab-detail',
    tabindex: '-1'
  });
  const disabled = node('button', {
    type: 'button',
    class: 'tab-trigger',
    role: 'tab',
    'aria-selected': 'false',
    'aria-controls': 'panel-disabled',
    id: 'tab-disabled',
    tabindex: '-1',
    disabled: ''
  });
  const panelSummary = node('div', {
    class: 'tab-content',
    role: 'tabpanel',
    id: 'panel-summary',
    'aria-labelledby': 'tab-summary',
    tabindex: '0'
  });
  const panelDetail = node('div', {
    class: 'tab-content',
    role: 'tabpanel',
    id: 'panel-detail',
    'aria-labelledby': 'tab-detail',
    tabindex: '0',
    hidden: ''
  });
  const panelDisabled = node('div', {
    class: 'tab-content',
    role: 'tabpanel',
    id: 'panel-disabled',
    'aria-labelledby': 'tab-disabled',
    tabindex: '0',
    hidden: ''
  });
  tablist.append(summary, detail, disabled);
  const root = node('div');
  root.append(tablist, panelSummary, panelDetail, panelDisabled);
  await loadModule('tabs', root);

  const dispatch = (id) => fire(tablist, 'tabs:activate', { detail: { id } });

  dispatch('tab-detail');
  await settle();
  assert.equal(detail.getAttribute('aria-selected'), 'true');
  await settle();
  assert.equal(detail.hasAttribute('tabindex'), false);
  await settle();
  assert.equal(summary.getAttribute('aria-selected'), 'false');
  await settle();
  assert.equal(summary.getAttribute('tabindex'), '-1');
  await settle();
  assert.equal(panelDetail.hidden, false);
  await settle();
  assert.equal(panelSummary.hidden, true);

  dispatch('panel-summary');
  await settle();
  assert.equal(summary.getAttribute('aria-selected'), 'true');
  await settle();
  assert.equal(panelSummary.hidden, false);
  await settle();
  assert.equal(panelDetail.hidden, true);

  dispatch('tab-disabled');
  await settle();
  assert.equal(summary.getAttribute('aria-selected'), 'true');
  await settle();
  assert.equal(disabled.getAttribute('aria-selected'), 'false');
  await settle();
  assert.equal(panelDisabled.hidden, true);

  dispatch('tab-missing');
  await settle();
  assert.equal(summary.getAttribute('aria-selected'), 'true');
});

await test('app shell theme toggles persist state and initialize inserted controls', async () => {
  const toggle = node('button', { type: 'button', 'data-theme-toggle': '' }, 'Theme');
  const runtime = await loadModule('app-shell', toggle);

  await settle();

  assert.equal(toggle.hasAttribute('data-init'), true);
  await settle();
  assert.equal(toggle.dataset.theme, 'light');
  await settle();
  assert.equal(toggle.getAttribute('aria-label'), 'Switch to dark theme');
  fire(toggle, 'click');
  await settle();
  assert.equal(runtime.document.documentElement.classList.contains('dark'), true);
  await settle();
  assert.equal(runtime.window.localStorage.getItem('mewa-ui-theme'), 'dark');
  await settle();
  assert.equal(toggle.dataset.theme, 'dark');
  await settle();
  assert.equal(toggle.getAttribute('aria-label'), 'Switch to light theme');

  const inserted = node('button', { type: 'button', 'data-theme-toggle': '' }, 'Theme');
  runtime.document.body.append(inserted);
  await settle();
  assert.equal(inserted.hasAttribute('data-init'), true);
  await settle();
  assert.equal(inserted.dataset.theme, 'dark');
  await settle();
  assert.equal(listeners(inserted, 'click'), 1);
});

await test('time fields normalize segments, serialize canonical time, and step minutes', async () => {
  const field = node('fieldset', { class: 'time-field' });
  const hour = node('input', { class: 'time-field-input', 'data-time-part': 'hour' });
  const minute = node('input', { class: 'time-field-input', 'data-time-part': 'minute' });
  const period = node('select', { class: 'time-field-select', 'data-time-part': 'period' });
  const submitted = node('input', { type: 'hidden', 'data-time-part': 'value', disabled: '' });
  const status = node('output', { class: 'time-field-status', 'data-time-part': 'status' });
  hour.value = '11';
  minute.value = '59';
  period.append(node('option', { value: 'AM' }, 'AM'), node('option', { value: 'PM' }, 'PM'));
  period.value = 'PM';
  field.append(hour, minute, period, submitted, status);
  const runtime = await loadModule('time-field', field);

  await settle();

  assert.equal(submitted.disabled, false);
  await settle();
  assert.equal(submitted.value, '23:59');
  await settle();
  assert.equal(status.textContent, '11:59 PM');
  const event = key(minute, 'ArrowUp');
  await settle();
  assert.equal(event.defaultPrevented, true);
  await settle();
  assert.equal(minute.value, '00');
  await settle();
  assert.equal(submitted.value, '23:00');
  await settle();
  assert.equal(status.textContent, '11:00 PM');
  minute.value = 'x4';
  fire(minute, 'input');
  await settle();
  assert.equal(minute.value, '4');
  await settle();
  assert.equal(runtime.document.activeElement, runtime.document.body);
});
await test('data tables filter, sort, announce counts, and clear through native controls', async () => {
  const tableRoot = node('section', { class: 'data-table' });
  const filter = node('input', { class: 'data-table-filter', 'data-table-filter': '' });
  const status = node('p', {
    class: 'data-table-summary',
    'data-table-status': '',
    'data-singular': 'project',
    'data-plural': 'projects',
    role: 'status'
  });
  const range = node('p', {
    class: 'data-table-range',
    'data-table-range': '',
    'data-range-label': 'projects'
  });
  const clear = node('button', { type: 'button', 'data-table-clear': '' });
  const table = node('table');
  const head = node('thead');
  const headingRow = node('tr');
  const heading = node('th', { 'aria-sort': 'none' });
  const sort = node(
    'button',
    { type: 'button', class: 'data-table-sort', 'data-table-sort': '' },
    'Project'
  );
  const body = node('tbody');
  const bravo = node('tr');
  const alpha = node('tr');
  bravo.append(node('td', {}, 'Bravo'));
  alpha.append(node('td', {}, 'Alpha'));
  heading.append(sort);
  headingRow.append(heading);
  head.append(headingRow);
  body.append(bravo, alpha);
  table.append(head, body);
  const empty = node('p', { class: 'data-table-empty', 'data-table-empty': '' });
  empty.hidden = true;
  tableRoot.append(filter, status, range, clear, table, empty);
  const runtime = await loadModule('data-table', tableRoot);

  fire(sort, 'click');
  await settle();
  assert.equal(body.children[0], alpha);
  await settle();
  assert.equal(heading.getAttribute('aria-sort'), 'ascending');
  await settle();
  assert.equal(status.textContent, '2 projects');
  await settle();
  assert.equal(range.textContent, 'Showing 1–2 of 2 projects');
  filter.value = 'bravo';
  fire(filter, 'input');
  await settle();
  assert.equal(alpha.hidden, true);
  await settle();
  assert.equal(bravo.hidden, false);
  await settle();
  assert.equal(empty.hidden, true);
  await settle();
  assert.equal(status.textContent, '1 project');
  await settle();
  assert.equal(range.textContent, 'Showing 1–1 of 1 projects');
  filter.value = 'missing';
  fire(filter, 'input');
  await settle();
  assert.equal(empty.hidden, false);
  await settle();
  assert.equal(range.textContent, 'Showing 0 of 0 projects');
  fire(clear, 'click');
  await settle();
  assert.equal(filter.value, '');
  await settle();
  assert.equal(alpha.hidden, false);
  await settle();
  assert.equal(bravo.hidden, false);
  await settle();
  assert.equal(runtime.document.activeElement, filter);
});

await test('date range pickers keep chronological validation dormant until interaction and recover after reset', async () => {
  const form = node('form');
  const picker = node('fieldset', { class: 'date-range-picker' });
  const start = node('input', { type: 'date', 'data-range-start': '', value: '2026-06-01' });
  const end = node('input', { type: 'date', 'data-range-end': '', value: '2026-06-10' });
  const error = node('p', { 'data-range-error': '', id: 'range-error' });
  error.hidden = true;
  const status = node('output', { 'data-range-status': '' });
  picker.append(start, end, error, status);
  form.append(picker);

  const runtime = await loadModule('date-range-picker', form);
  const invalidEvents = [];
  const changeEvents = [];
  picker.addEventListener('date-range:invalid', (event) => invalidEvents.push(event.detail));
  picker.addEventListener('date-range:change', (event) => changeEvents.push(event.detail));

  end.value = '2026-05-01';
  fire(end, 'input');
  await settle();
  assert.equal(invalidEvents.length, 1);
  await settle();
  assert.equal(invalidEvents[0].valid, false);
  await settle();
  assert.equal(end.getAttribute('aria-invalid'), 'true');
  await settle();
  assert.equal(start.getAttribute('aria-errormessage'), null);
  await settle();
  assert.equal(end.getAttribute('aria-errormessage'), 'range-error');
  await settle();
  assert.equal(error.hidden, false);
  await settle();
  assert.equal(status.textContent, 'End date must be on or after the start date.');

  end.value = '2026-06-10';
  fire(end, 'input');
  await settle();
  assert.equal(invalidEvents.length, 2);
  await settle();
  assert.equal(invalidEvents[1].valid, true);
  await settle();
  assert.equal(end.getAttribute('aria-invalid'), null);
  await settle();
  assert.equal(end.getAttribute('aria-errormessage'), null);
  await settle();
  assert.equal(error.hidden, true);

  end.value = '2026-05-01';
  fire(end, 'change');
  await settle();
  assert.equal(changeEvents.length, 1);
  await settle();
  assert.equal(changeEvents[0].start, '2026-06-01');
  await settle();
  assert.equal(changeEvents[0].end, '2026-05-01');
  await settle();
  assert.equal(changeEvents[0].complete, true);
  await settle();
  assert.equal(changeEvents[0].valid, false);

  end.value = '2026-06-10';
  fire(form, 'reset');
  await settle();
  assert.equal(end.getAttribute('aria-invalid'), null);
  await settle();
  assert.equal(error.hidden, true);

  end.value = '2026-05-01';
  fire(end, 'input');
  await settle();
  assert.equal(invalidEvents.length, 4, 'invalid transitions continue after form reset');
  await settle();
  assert.equal(runtime.document.activeElement, runtime.document.body);
});

await test('date range pickers keep reversed server values dormant until interaction', async () => {
  const picker = node('fieldset', { class: 'date-range-picker' });
  const start = node('input', { type: 'date', 'data-range-start': '', value: '2026-06-10' });
  const end = node('input', { type: 'date', 'data-range-end': '', value: '2026-06-01' });
  const error = node('p', { 'data-range-error': '', id: 'dormant-error' });
  error.hidden = true;
  const status = node('output', { 'data-range-status': '' }, 'Initial status');
  picker.append(start, end, error, status);

  await loadModule('date-range-picker', picker);

  await settle();

  assert.equal(start.getAttribute('aria-invalid'), null);
  await settle();
  assert.equal(end.getAttribute('aria-invalid'), null);
  await settle();
  assert.equal(start.getAttribute('aria-errormessage'), null);
  await settle();
  assert.equal(end.getAttribute('aria-errormessage'), null);
  await settle();
  assert.equal(end.validationMessage, '');
  await settle();
  assert.equal(error.hidden, true);
  await settle();
  assert.equal(status.textContent, 'Initial status');
});

await test('date range pickers preserve server-owned invalid state', async () => {
  const picker = node('fieldset', {
    class: 'date-range-picker',
    'data-invalid': '',
    'data-range-order-invalid': ''
  });
  const start = node('input', {
    type: 'date',
    'data-range-start': '',
    value: '2026-06-10'
  });
  const end = node('input', {
    type: 'date',
    'data-range-end': '',
    value: '2026-06-01',
    'aria-invalid': 'true'
  });
  const error = node('p', { 'data-range-error': '' }, 'Choose an end date after the start date.');
  const status = node('output', { 'data-range-status': '' });
  picker.append(start, end, error, status);
  end.setCustomValidity('Server validation failed.');

  await loadModule('date-range-picker', picker);
  end.value = '2026-06-12';
  fire(end, 'input');

  await settle();

  assert.equal(picker.hasAttribute('data-invalid'), true);
  await settle();
  assert.equal(picker.hasAttribute('data-range-order-invalid'), true);
  await settle();
  assert.equal(start.getAttribute('aria-invalid'), null);
  await settle();
  assert.equal(end.getAttribute('aria-invalid'), 'true');
  await settle();
  assert.equal(error.hidden, false);
  await settle();
  assert.equal(error.textContent, 'Choose an end date after the start date.');
  await settle();
  assert.equal(end.validationMessage, 'Server validation failed.');
});

await test('resizable panels respond to keyboard and pointer separator changes', async () => {
  const resizable = node('section', { class: 'resizable' });
  const group = node('div', { class: 'resizable-group', 'data-orientation': 'vertical' });
  const first = node('aside', { class: 'resizable-panel', id: 'files-panel' });
  const handle = node('div', {
    class: 'resizable-handle',
    role: 'separator',
    'data-value-min': '20',
    'data-value-max': '80',
    'data-value-now': '50',
    'data-value-label': 'Files'
  });
  const second = node('article', { class: 'resizable-panel', id: 'preview-panel' });
  const output = node('output', {});
  group.rect.width = 200;
  first.rect.width = 100;
  group.append(first);
  resizable.append(group, output);
  await settle();
  assert.equal(
    handle.getAttribute('aria-valuenow'),
    null,
    'static separators do not expose an unavailable value'
  );
  const runtime = await loadModule('resizable', resizable);
  group.append(handle, second);
  const changes = [];
  resizable.addEventListener('resizable-change', (event) => changes.push(event.detail));

  await settle();

  assert.equal(handle.tagName, 'DIV');
  await settle();
  assert.equal(handle.getAttribute('tabindex'), '0');
  await settle();
  assert.equal(handle.getAttribute('aria-orientation'), 'vertical');
  await settle();
  assert.equal(handle.getAttribute('aria-valuemin'), '20');
  await settle();
  assert.equal(handle.getAttribute('aria-valuemax'), '80');
  await settle();
  assert.equal(handle.getAttribute('aria-valuenow'), '50');
  await settle();
  assert.equal(handle.getAttribute('aria-label'), 'Resize Files');
  await settle();
  assert.equal(handle.getAttribute('aria-controls'), 'files-panel preview-panel');
  await settle();
  assert.equal(first.style.flexBasis, '100px');
  await settle();
  assert.equal(output.textContent, 'Files: 50 percent');
  key(handle, 'ArrowRight');
  await settle();
  assert.equal(handle.getAttribute('aria-valuenow'), '51');
  await settle();
  assert.equal(first.style.flexBasis, '102px');
  await settle();
  assert.equal(changes[0].source, 'keyboard');
  key(handle, 'Home');
  await settle();
  assert.equal(handle.getAttribute('aria-valuenow'), '20');
  await settle();
  assert.equal(first.style.flexBasis, '40px');

  fire(handle, 'pointerdown', { button: 0, clientX: 10, pointerId: 1, isPrimary: true });
  await settle();
  assert.equal(resizable.hasAttribute('data-resizing'), true);
  fire(handle, 'pointermove', { clientX: 30, pointerId: 1 });
  await settle();
  assert.equal(first.style.flexBasis, '120px');
  fire(handle, 'pointercancel', { pointerId: 1 });
  await settle();
  assert.equal(resizable.hasAttribute('data-resizing'), false);
  await settle();
  assert.equal(listeners(handle, 'pointermove'), 0);
  await settle();
  assert.equal(listeners(handle, 'pointerup'), 0);
  await settle();
  assert.equal(listeners(handle, 'pointercancel'), 0);

  resizable.remove();
  await settle();
  assert.equal(
    handle.getAttribute('tabindex'),
    null,
    'removal cleanup restores static separator semantics'
  );
  await settle();
  assert.equal(handle.getAttribute('aria-valuenow'), null);
  await settle();
  assert.equal(listeners(handle, 'keydown'), 0);
  await settle();
  assert.equal(output.getAttribute('class'), null);

  runtime.document.body.append(resizable);
  await settle();
  assert.equal(handle.getAttribute('tabindex'), '0', 'reinserted split panes initialize again');
  await settle();
  assert.equal(listeners(handle, 'keydown'), 1);
  await settle();
  assert.equal(runtime.document.activeElement, runtime.document.body);
});

await test('dropdown menus restore keyboard focus without stealing external focus and rebind targets', async () => {
  const root = node('section');
  const trigger = node('button', {
    'data-dropdown-menu-trigger': 'actions',
    'aria-expanded': 'false'
  });
  let triggerClicks = 0;
  trigger.click = () => {
    triggerClicks += 1;
    fire(trigger, 'click');
  };
  const firstMenu = node('div', { id: 'actions', style: 'display:block' });
  const firstItem = node(
    'button',
    { type: 'button', role: 'menuitemcheckbox', 'aria-checked': 'false' },
    'First'
  );
  firstMenu.append(firstItem);
  let firstToggles = 0;
  firstMenu.togglePopover = () => {
    firstToggles += 1;
  };
  root.append(trigger, firstMenu);
  const runtime = await loadModule('dropdown-menu', root);

  await settle();

  assert.equal(trigger.style.anchorName, '--dropdown-menu-actions');
  await settle();
  assert.equal(firstMenu.style.positionAnchor, '--dropdown-menu-actions');
  await settle();
  assert.equal(listeners(firstMenu, 'keydown'), 1);

  firstMenu.remove();
  const replacement = node('div', { id: 'actions', style: 'display:block' });
  const replacementItem = node(
    'button',
    { type: 'button', role: 'menuitemcheckbox', 'aria-checked': 'false' },
    'Replacement'
  );
  const replacementAction = node('button', { type: 'button', role: 'menuitem' }, 'Action');
  replacement.append(replacementItem, replacementAction);
  let replacementToggles = 0;
  let focusAtToggle = null;
  let closeRequested = false;
  replacement.togglePopover = () => {
    replacementToggles += 1;
    focusAtToggle = runtime.document.activeElement;
  };
  replacement.hidePopover = () => {
    closeRequested = true;
    if (replacement.contains(runtime.document.activeElement)) trigger.focus();
  };
  const flushClose = () => {
    if (!closeRequested) return;
    closeRequested = false;
    fire(replacement, 'toggle', { newState: 'closed' });
  };
  const outside = node('button', { type: 'button' }, 'Outside');
  let actionClicks = 0;
  replacementAction.click = () => {
    actionClicks += 1;
    outside.focus();
    replacement.hidePopover();
  };
  root.append(replacement);
  root.append(outside);

  await settle();

  assert.equal(replacement.style.positionAnchor, '--dropdown-menu-actions');
  await settle();
  assert.equal(listeners(trigger, 'click'), 1, 'persistent trigger keeps one listener');
  await settle();
  assert.equal(listeners(replacement, 'toggle'), 1);
  await settle();
  assert.equal(listeners(replacement, 'mousemove'), 1);
  await settle();
  assert.equal(listeners(replacement, 'mouseleave'), 1);
  await settle();
  assert.equal(listeners(replacement, 'click'), 1);
  await settle();
  assert.equal(listeners(replacement, 'keydown'), 1, 'replacement receives one keyboard listener');
  outside.focus();
  fire(trigger, 'click');
  await settle();
  assert.equal(firstToggles, 0);
  await settle();
  assert.equal(replacementToggles, 1);
  await settle();
  assert.equal(
    focusAtToggle,
    trigger,
    'programmatic activation establishes the trigger as the native focus source'
  );

  fire(replacement, 'toggle', { newState: 'open' });
  await settle();
  assert.equal(runtime.document.activeElement, replacementItem);
  key(replacementItem, 'Escape');
  flushClose();
  await settle();
  assert.equal(
    runtime.document.activeElement,
    trigger,
    'Escape after external programmatic activation returns to the trigger'
  );

  const closeFromTarget = () => replacement.hidePopover();
  replacementItem.addEventListener('keydown', closeFromTarget);
  replacementAction.addEventListener('keydown', closeFromTarget);
  for (const keyValue of ['Enter', ' ']) {
    fire(replacement, 'toggle', { newState: 'open' });
    await settle();
    assert.equal(runtime.document.activeElement, replacementItem);
    const beforeTriggerClicks = triggerClicks;
    const checked = replacementItem.getAttribute('aria-checked');
    key(replacementItem, keyValue);
    await settle();
    assert.equal(closeRequested, true, `${keyValue} target handler requests close before bubbling`);
    await settle();
    assert.equal(
      runtime.document.activeElement,
      trigger,
      'native close restoration can move focus before bubbling'
    );
    flushClose();
    await settle();
    assert.equal(
      trigger.getAttribute('aria-expanded'),
      'false',
      `${keyValue} checkable close remains closed`
    );
    await settle();
    assert.equal(
      runtime.document.activeElement,
      trigger,
      `${keyValue} close restores focus to the trigger`
    );
    await settle();
    assert.equal(
      replacementItem.getAttribute('aria-checked'),
      checked === 'true' ? 'false' : 'true',
      `${keyValue} toggles the target item once`
    );
    await settle();
    assert.equal(
      triggerClicks,
      beforeTriggerClicks,
      `${keyValue} does not re-click the trigger after native focus restoration`
    );
  }

  for (const keyValue of ['Enter', ' ']) {
    fire(replacement, 'toggle', { newState: 'open' });
    replacementAction.focus();
    const beforeActionClicks = actionClicks;
    const beforeTriggerClicks = triggerClicks;
    key(replacementAction, keyValue);
    await settle();
    assert.equal(
      actionClicks,
      beforeActionClicks + 1,
      `${keyValue} activates the target action once`
    );
    await settle();
    assert.equal(
      triggerClicks,
      beforeTriggerClicks,
      `${keyValue} does not re-click the trigger after native focus restoration`
    );
    await settle();
    assert.equal(
      runtime.document.activeElement,
      outside,
      `${keyValue} action keeps its deliberate external focus`
    );
    flushClose();
    await settle();
    assert.equal(
      trigger.getAttribute('aria-expanded'),
      'false',
      `${keyValue} action close remains closed`
    );
    await settle();
    assert.equal(
      runtime.document.activeElement,
      outside,
      `${keyValue} action close remains externally focused`
    );
  }

  replacementItem.removeEventListener('keydown', closeFromTarget);
  replacementAction.removeEventListener('keydown', closeFromTarget);

  fire(replacement, 'toggle', { newState: 'open' });
  await settle();
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  await settle();
  assert.equal(runtime.document.activeElement, replacementItem);
  outside.focus();
  fire(replacement, 'toggle', { newState: 'closed' });
  await settle();
  assert.equal(
    runtime.document.activeElement,
    outside,
    'light-dismiss must not steal focus from an outside control'
  );

  fire(replacement, 'toggle', { newState: 'open' });
  replacementAction.focus();
  key(replacementAction, 'Enter');
  flushClose();
  await settle();
  assert.equal(
    runtime.document.activeElement,
    outside,
    'actions that move focus externally must not restore the trigger'
  );

  fire(replacement, 'toggle', { newState: 'open' });
  await settle();
  assert.equal(runtime.document.activeElement, replacementItem);
  fire(firstMenu, 'toggle', { newState: 'closed' });
  await settle();
  assert.equal(
    trigger.getAttribute('aria-expanded'),
    'true',
    'superseded target cannot overwrite trigger state'
  );
  await settle();
  assert.equal(
    runtime.document.activeElement,
    replacementItem,
    'superseded target cannot move focus'
  );
  fire(replacementItem, 'click');
  await settle();
  assert.equal(replacementItem.getAttribute('aria-checked'), 'true');
  fire(replacement, 'mousemove', { clientX: 1, clientY: 1 });
  await settle();
  assert.equal(replacementItem.hasAttribute('data-highlighted'), true);
  key(replacementItem, 'Escape');
  flushClose();
  await settle();
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  await settle();
  assert.equal(runtime.document.activeElement, trigger, 'Escape returns focus to the trigger');

  replacement.remove();
  const secondMenu = node('div', { id: 'actions', style: 'display:block' });
  secondMenu.togglePopover = () => {};
  root.append(secondMenu);
  secondMenu.remove();
  root.append(firstMenu);
  await settle();
  assert.equal(listeners(firstMenu, 'keydown'), 1, 'A to B to A rebind stays idempotent');
  fire(trigger, 'click');
  await settle();
  assert.equal(firstToggles, 1);

  trigger.remove();
  await settle();
  assert.equal(
    trigger.hasAttribute('data-mewa-dropdown-menu-init'),
    false,
    'disconnected trigger releases its initialization marker'
  );
  const lateMenu = node('div', { id: 'actions', style: 'display:block' });
  root.append(lateMenu);
  await settle();
  assert.equal(
    listeners(lateMenu, 'keydown'),
    0,
    'disconnected trigger cannot bind a later target'
  );
  root.append(trigger);
  await settle();
  assert.equal(listeners(trigger, 'click'), 1, 'reinserted trigger is initialized exactly once');
  await settle();
  assert.equal(
    listeners(firstMenu, 'keydown'),
    1,
    'reinserted trigger restores one menu listener set'
  );
});

await test('tooltips rebind a persistent trigger when its target is replaced', async () => {
  const root = node('section');
  const trigger = node(
    'button',
    {
      type: 'button',
      'data-tooltip-trigger': 'format-help',
      'data-delay': '0',
      'aria-describedby': 'persistent-help'
    },
    'Format'
  );
  const first = node(
    'div',
    { class: 'tooltip', id: 'format-help', popover: 'manual' },
    'First help'
  );
  let firstOpens = 0;
  first.showPopover = () => {
    firstOpens += 1;
  };
  first.hidePopover = () => {};
  root.append(trigger, first);

  const runtime = await loadModule('tooltip', root);
  await settle();
  assert.equal(trigger.getAttribute('aria-describedby'), 'persistent-help format-help');
  await settle();
  assert.equal(listeners(trigger, 'focus'), 1);
  await settle();
  assert.equal(listeners(first, 'toggle'), 1);
  fire(trigger, 'focus');
  await runtime.flushTimers();
  await settle();
  assert.equal(firstOpens, 1);

  first.remove();
  await settle();
  assert.equal(listeners(first, 'toggle'), 0, 'the detached tooltip releases its target listener');
  const replacement = node(
    'div',
    { class: 'tooltip', id: 'format-help', popover: 'manual' },
    'Replacement help'
  );
  let replacementOpens = 0;
  replacement.showPopover = () => {
    replacementOpens += 1;
  };
  replacement.hidePopover = () => {};
  root.append(replacement);

  await settle();

  assert.equal(listeners(trigger, 'focus'), 1, 'the persistent trigger keeps one listener set');
  await settle();
  assert.equal(
    listeners(replacement, 'toggle'),
    1,
    'the replacement tooltip receives its target listener'
  );
  await settle();
  assert.equal(trigger.getAttribute('aria-describedby'), 'persistent-help format-help');
  fire(trigger, 'focus');
  await runtime.flushTimers();
  await settle();
  assert.equal(firstOpens, 1, 'the detached tooltip is never reopened');
  await settle();
  assert.equal(replacementOpens, 1, 'the persistent trigger opens the replacement tooltip');

  replacement.remove();
  root.append(first);
  await settle();
  assert.equal(listeners(first, 'toggle'), 1, 'A to B to A replacement remains idempotent');
  fire(trigger, 'focus');
  await runtime.flushTimers();
  await settle();
  assert.equal(firstOpens, 2);

  trigger.remove();
  await settle();
  assert.equal(
    trigger.hasAttribute('data-mewa-tooltip-init'),
    false,
    'a disconnected trigger releases its marker'
  );
  await settle();
  assert.equal(listeners(trigger, 'focus'), 0);
  await settle();
  assert.equal(listeners(first, 'toggle'), 0);
  await settle();
  assert.equal(trigger.getAttribute('aria-describedby'), 'persistent-help');
});

await test('hover cards rebind a persistent trigger when a portal target is replaced', async () => {
  const root = node('section');
  const trigger = node(
    'button',
    {
      type: 'button',
      'data-hover-card-trigger': 'person-card',
      'aria-describedby': 'persistent-profile-help'
    },
    'Profile'
  );
  const first = node(
    'div',
    { class: 'hover-card', id: 'person-card', popover: 'manual' },
    'First profile'
  );
  let firstOpens = 0;
  first.showPopover = () => {
    firstOpens += 1;
  };
  first.hidePopover = () => {};
  root.append(trigger, first);

  await loadModule('hover-card', root);
  await settle();
  assert.equal(trigger.getAttribute('aria-describedby'), 'persistent-profile-help person-card');
  await settle();
  assert.equal(listeners(trigger, 'focus'), 1);
  await settle();
  assert.equal(listeners(first, 'focusin'), 1);
  trigger.focus();
  await settle();
  assert.equal(firstOpens, 1);

  first.remove();
  await settle();
  assert.equal(listeners(first, 'focusin'), 0, 'the detached card releases its target listeners');
  await settle();
  assert.equal(listeners(first, 'keydown'), 0);
  const replacement = node(
    'div',
    { class: 'hover-card', id: 'person-card', popover: 'manual' },
    'Replacement profile'
  );
  let replacementOpens = 0;
  replacement.showPopover = () => {
    replacementOpens += 1;
  };
  replacement.hidePopover = () => {};
  root.append(replacement);

  await settle();

  assert.equal(listeners(trigger, 'focus'), 1, 'the persistent trigger keeps one listener set');
  await settle();
  assert.equal(
    listeners(replacement, 'focusin'),
    1,
    'the replacement card receives its target listeners'
  );
  await settle();
  assert.equal(listeners(replacement, 'keydown'), 1);
  await settle();
  assert.equal(trigger.getAttribute('aria-describedby'), 'persistent-profile-help person-card');
  fire(trigger, 'focus');
  await settle();
  assert.equal(firstOpens, 1, 'the detached card is never reopened');
  await settle();
  assert.equal(replacementOpens, 1, 'the persistent trigger opens the replacement card');

  replacement.remove();
  root.append(first);
  await settle();
  assert.equal(listeners(first, 'focusin'), 1, 'A to B to A replacement remains idempotent');
  fire(trigger, 'focus');
  await settle();
  assert.equal(firstOpens, 2);

  trigger.remove();
  await settle();
  assert.equal(
    trigger.hasAttribute('data-hover-card-init'),
    false,
    'a disconnected trigger releases its marker'
  );
  await settle();
  assert.equal(listeners(trigger, 'focus'), 0);
  await settle();
  assert.equal(listeners(first, 'focusin'), 0);
  await settle();
  assert.equal(trigger.getAttribute('aria-describedby'), 'persistent-profile-help');
});

await test('dialogs wrap keyboard focus without including hidden or disabled controls', async () => {
  const dialog = node('dialog', { class: 'dialog' });
  dialog.open = true;
  const first = node('input');
  const hiddenGroup = node('div', { hidden: '' });
  const hiddenInput = node('input');
  hiddenGroup.append(hiddenInput);
  const disabled = node('button', { disabled: '', tabindex: '0' });
  const hiddenByType = node('input', { type: 'hidden', tabindex: '0' });
  const last = node('button');
  dialog.append(first, hiddenGroup, disabled, hiddenByType, last);

  const { document } = await loadModule('dialog', dialog);
  last.focus();
  const forward = key(last, 'Tab');
  await settle();
  assert.equal(forward.defaultPrevented, true);
  await settle();
  assert.equal(document.activeElement, first);

  first.focus();
  const backward = key(first, 'Tab', { shiftKey: true });
  await settle();
  assert.equal(backward.defaultPrevented, true);
  await settle();
  assert.equal(document.activeElement, last);
});

EventTarget.prototype.addEventListener = add;
EventTarget.prototype.removeEventListener = remove;
await test('time fields preserve readonly, disabled, composition, and application validity', async () => {
  const field = node('fieldset', { class: 'time-field' });
  field.innerHTML =
    '<input data-time-part="hour" value="09"><input data-time-part="minute" value="30"><select data-time-part="period"><option>AM</option><option>PM</option></select><input type="hidden" data-time-part="value" disabled>';
  const hour = field.querySelector('[data-time-part="hour"]');
  const minute = field.querySelector('[data-time-part="minute"]');
  await loadModule('time-field', field);
  hour.readOnly = true;
  const readonlyKey = key(hour, 'ArrowUp');
  assert.equal(hour.value, '09', 'readonly hour');
  assert.equal(readonlyKey.defaultPrevented, false);
  hour.readOnly = false;
  field.disabled = true;
  key(minute, 'ArrowUp');
  assert.equal(minute.value, '30', 'disabled fieldset');
  field.disabled = false;
  hour.focus();
  hour.value = '1あ';
  fire(hour, 'input', { isComposing: true });
  assert.equal(hour.value, '1あ', 'composition text');
  assert.equal(document.activeElement, hour);
  hour.value = '10';
  fire(hour, 'input');
  assert.equal(document.activeElement, minute);
  minute.setCustomValidity('Application rejection');
  fire(minute, 'input');
  assert.equal(minute.validationMessage, 'Application rejection');
});

await test('file uploads respect disabled fieldsets and clear reset errors', async () => {
  const form = node('form');
  form.innerHTML =
    '<fieldset disabled><div data-file-upload data-max-size="1"><div class="file-upload-dropzone"><input type="file" class="file-upload-input" name="files" multiple></div><ul data-file-upload-list></ul><p data-file-upload-status></p><p data-file-upload-error hidden></p></div></fieldset>';
  const fieldset = form.querySelector('fieldset');
  const input = form.querySelector('input');
  const dropzone = form.querySelector('.file-upload-dropzone');
  const upload = form.querySelector('[data-file-upload]');
  await loadModule('file-upload', form);
  const transfer = new DataTransfer();
  transfer.items.add(new File(['x'], 'tiny.txt'));
  fire(dropzone, 'drop', { dataTransfer: transfer });
  assert.equal(input.files.length, 0, 'disabled drop');
  fieldset.disabled = false;
  fire(dropzone, 'drop', { dataTransfer: transfer });
  assert.equal(input.files.length, 1, 'enabled drop');
  fieldset.disabled = true;
  fire(upload.querySelector('button'), 'click');
  assert.equal(input.files.length, 1, 'disabled removal');
  fieldset.disabled = false;
  const oversized = new DataTransfer();
  oversized.items.add(new File(['large'], 'large.txt'));
  fire(dropzone, 'drop', { dataTransfer: oversized });
  assert.equal(upload.dataset.state, 'error');
  form.reset();
  await settle();
  assert.equal(input.files.length, 0);
  assert.equal(upload.querySelector('[data-file-upload-error]').hidden, true);
  assert.equal(upload.hasAttribute('data-state'), false);
});

await test('tag input refresh honors external forms, dynamic readonly and canceled reset', async () => {
  const form = node('form', { id: 'external-tags' });
  const region = node('div');
  region.innerHTML =
    '<div data-tag-input><div data-tag-input-field><input class="tag-input-fallback" type="text" id="tags" form="external-tags" name="tags" value="Initial"></div><p data-tag-input-status></p></div>';
  document.body.append(form);
  const input = region.querySelector('input');
  await loadModule('tag-input', region);
  const draft = region.querySelector('.tag-input-control');
  draft.value = 'Second';
  key(draft, 'Enter');
  assert.equal(new FormData(form).get('tags'), 'Initial, Second');
  const cancel = (event) => event.preventDefault();
  form.addEventListener('reset', cancel);
  form.reset();
  await settle();
  assert.equal(input.value, 'Initial, Second');
  form.removeEventListener('reset', cancel);
  input.readOnly = true;
  integration.enhance(region);
  assert.equal(draft.readOnly, true, 'refreshed readonly');
  draft.value = 'Uncommitted';
  key(draft, 'Enter');
  assert.equal(input.value, 'Initial, Second');
  input.readOnly = false;
  integration.enhance(region);
  assert.equal(draft.readOnly, false);
  form.reset();
  await settle();
  assert.equal(input.value, 'Initial');
  assert.equal(draft.value, '');
});

await test('combobox filters announce enabled counts and release the status region', async () => {
  const root = node('div', { class: 'combobox' });
  root.innerHTML =
    '<button type="button" class="combobox-trigger">Choose</button><div class="combobox-content" id="options" popover><input class="combobox-search-input" aria-label="Search" role="combobox" aria-controls="list"><div id="list" role="listbox"><div role="option" id="first">Paris</div><div role="option" id="second" aria-disabled="true">Prague</div></div><div class="combobox-empty" hidden>No results</div></div>';
  await loadModule('combobox', root);
  root.querySelector('button').click();
  const search = root.querySelector('input');
  const status = root.querySelector('[role="status"]');
  search.value = 'P';
  fire(search, 'input');
  assert.equal(status.textContent, '1 option available.');
  search.value = 'zzzz';
  fire(search, 'input');
  assert.equal(status.textContent, '0 options available.');
  const clone = root.cloneNode(true);
  document.body.append(clone);
  integration.enhance(clone);
  assert.equal(clone.querySelectorAll('[role="status"]').length, 1);
  integration.destroy(root);
  assert.equal(clone.querySelectorAll('[role="status"]').length, 1);
  assert.equal(root.querySelector('[role="status"]'), null);
});

await test('jump to latest retains keyboard focus in the reading viewport', async () => {
  const root = node('div', { class: 'message-scroller', 'data-default-pinned': 'false' });
  root.innerHTML =
    '<div class="message-scroller-viewport" tabindex="0" style="height:100px;overflow:auto"><div class="message-scroller-content" style="height:1000px">Messages</div></div><button type="button" data-message-scroller-jump>Jump to latest</button>';
  await loadModule('message-scroller', root);
  const button = root.querySelector('button');
  const viewport = root.querySelector('.message-scroller-viewport');
  button.focus();
  button.click();
  assert.equal(document.activeElement, viewport);
  assert.equal(button.hidden, true);
  assert.equal(viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop, 0);
});

window.runtimeResults = results;
