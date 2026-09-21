import 'mewa-docs-behaviors';
import models from 'mewa-docs-models';
import { idReferences, valueComponents, textTargets } from './catalog.mjs';
import { decodeValue, propertyConstraints } from './component-model.mjs';
import {
  propertyOperations,
  stateOperations,
  slotOperations,
  exclusiveOperations
} from './model-operations.mjs';
import { enhance } from '../library/runtime/enhancer.js';

const sections = [...document.querySelectorAll('.component-playground')];
const nativeValues =
  'input:not([type="hidden"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]),textarea,select,progress';
let active;
function modelFor(section) {
  return models.find((m) => m.slug === section.dataset.component);
}
function namespace(html, prefix) {
  const t = document.createElement('template');
  t.innerHTML = html;
  const ids = new Map(
    [...t.content.querySelectorAll('[id]')].map((el) => [el.id, `${prefix}-${el.id}`])
  );
  t.content.querySelectorAll('*').forEach((el) => {
    for (const attr of idReferences)
      if (el.hasAttribute(attr))
        el.setAttribute(
          attr,
          el
            .getAttribute(attr)
            .split(' ')
            .map((id) => ids.get(id) || id)
            .join(' ')
        );
    if (el.hasAttribute('name')) el.setAttribute('name', `${prefix}-${el.getAttribute('name')}`);
    const href = el.getAttribute('href');
    if (href?.startsWith('#') && ids.has(href.slice(1)))
      el.setAttribute('href', `#${ids.get(href.slice(1))}`);
  });
  return t.content;
}

function controlValue(control) {
  if (!control) return undefined;
  return control.type === 'checkbox'
    ? decodeValue(control.checked ? control.dataset.on : control.dataset.off)
    : decodeValue(control.value);
}

function applyVisibility(form) {
  for (const el of form.querySelectorAll('[data-hide-when]')) {
    const rule = JSON.parse(el.dataset.hideWhen);
    const control = form.elements[rule.control];
    if (!control) continue;
    el.hidden = rule.in.includes(controlValue(control));
  }
}

function operate(root, operations) {
  for (const op of operations)
    [...root.querySelectorAll(op.selector)].forEach((el, index) => {
      if (op.index !== undefined && index !== op.index) return;
      if (op.remove) {
        el.remove();
        return;
      }
      if (op.unwrap) {
        el.replaceWith(...el.childNodes);
        return;
      }
      if (op.tagName && op.tagName !== el.localName) {
        const replacement = document.createElement(op.tagName);
        for (const a of el.attributes) replacement.setAttribute(a.name, a.value);
        replacement.append(...el.childNodes);
        el.replaceWith(replacement);
        el = replacement;
      }
      if (op.attr) {
        let attr = op.attr,
          value = op.value;
        if (attr === 'disabled' && !('disabled' in el)) {
          attr = 'aria-disabled';
          if (value !== null) value = 'true';
        }
        if (value === null) el.removeAttribute(attr);
        else el.setAttribute(attr, value);
        if (attr === 'checked') el.checked = value !== null;
        if (attr === 'data-demo-mixed') el.indeterminate = value !== null;
        if (attr === 'data-demo-focus' && value !== null)
          for (
            let parent = el.parentElement;
            parent && parent !== root;
            parent = parent.parentElement
          )
            parent.dataset.demoFocusWithin = '';
      }
      if (op.html !== undefined) el.innerHTML = op.html;
      if (op.text !== undefined) el.textContent = op.text;
    });
}

function toastOptions(section) {
  const controls = section.querySelector('form.playground-controls').elements;
  return {
    variant: controls['prop:data-variant'].value,
    title: controls.content?.value || 'Saved',
    description: 'Your changes have been saved.',
    ...(controls.slot?.value === 'action' ? { action: { label: 'Undo' } } : {})
  };
}

function updateCode(section) {
  const demo = section.querySelector('.playground-demo');
  const code = section.querySelector('.playground-code');
  if (!demo || !code) return;
  const copy = demo.cloneNode(true);
  copy.querySelectorAll('input,textarea,select').forEach((el, i) => {
    const original = demo.querySelectorAll('input,textarea,select')[i];
    if (el.matches('input[type="checkbox"],input[type="radio"]'))
      el.toggleAttribute('checked', original.checked);
    else if (el.matches('textarea')) el.textContent = original.value;
    else if (el.matches('select'))
      [...el.options].forEach((o, i) =>
        o.toggleAttribute('selected', i === original.selectedIndex)
      );
    else if (el.type !== 'file') el.setAttribute('value', original.value);
  });
  copy.querySelectorAll('*').forEach((el) =>
    [...el.attributes].forEach((a) => {
      if (/^data-(?:demo-|init$|.*-init$)/.test(a.name)) el.removeAttribute(a.name);
    })
  );
  copy.querySelectorAll('.tag-input[data-enhanced]').forEach((root) => {
    const fallback = root.querySelector('.tag-input-fallback'),
      draft = root.querySelector('.tag-input-control');
    if (!fallback || !draft) return;
    fallback.type = 'text';
    for (const attr of ['id', 'aria-describedby', 'aria-invalid', 'placeholder'])
      if (draft.hasAttribute(attr)) fallback.setAttribute(attr, draft.getAttribute(attr));
    root.querySelector('.tag-input-list')?.remove();
    root.removeAttribute('data-enhanced');
  });
  code.textContent =
    section.dataset.component === 'toast'
      ? `window.toast.show(${JSON.stringify(toastOptions(section), null, 2)});`
      : copy.innerHTML.trim();
}

function valueFields(content, slug) {
  // The enhanced Tag Input draft is not the committed form value.
  if (slug === 'tag-input') return [...content.querySelectorAll('.tag-input-fallback')];
  if (!valueComponents.has(slug)) return [];
  return [...content.querySelectorAll(nativeValues)].filter(
    (el) => slug !== 'color-picker' || el.type === 'color'
  );
}
function configureContent(section, content) {
  const form = section.querySelector('.playground-controls');
  const container = form?.querySelector('.playground-values');
  if (!form || !container || container.dataset.ready) return;
  container.dataset.ready = 'true';
  const slug = section.dataset.component;
  const fields = valueFields(content, slug);
  for (const [index, field] of fields.entries()) {
    const label = document.createElement('label');
    const linked =
      field.id && [...content.querySelectorAll('label')].find((el) => el.htmlFor === field.id);
    label.append(
      `${linked?.textContent?.trim() || field.getAttribute('aria-label') || field.dataset.timePart || `Input ${index + 1}`} · value`
    );
    const editor = field.matches('select')
      ? field.cloneNode(true)
      : document.createElement('input');
    [...editor.attributes].forEach((a) => editor.removeAttribute(a.name));
    if (!field.matches('select')) {
      editor.type =
        field.matches('progress') || field.type === 'range'
          ? 'number'
          : field.matches('textarea')
            ? 'text'
            : field.type;
      for (const attr of ['min', 'max', 'step', 'maxlength'])
        if (field.hasAttribute(attr)) editor.setAttribute(attr, field.getAttribute(attr));
    }
    editor.className = field.matches('select') ? 'select' : 'text-field-input';
    editor.name = `value:${index}`;
    editor.value = field.matches('progress') && !field.hasAttribute('value') ? '' : field.value;
    if (field.matches('select'))
      [...editor.options].forEach((o) => (o.defaultSelected = o.selected));
    else editor.defaultValue = editor.value;
    label.append(editor);
    container.append(label);
  }
  const target = textTargets[slug] && content.querySelector(textTargets[slug]);
  container.hidden = !fields.length && !target;
  if (target) {
    const label = document.createElement('label');
    label.append('Text');
    const input = document.createElement('input');
    input.className = 'text-field-input';
    input.name = 'content';
    input.value = target.textContent.trim() || target.getAttribute('aria-label') || 'Label';
    input.defaultValue = input.value;
    label.append(input);
    container.append(label);
  }
}

function resizeDemo(section) {
  const controls = section.querySelector('.playground-controls');
  const demo = section.querySelector('.playground-demo');
  if (!controls || !demo) return;
  const width = controls.elements.width.value;
  if (width === 'auto') demo.style.removeProperty('width');
  else demo.style.width = width;
}

function instancesFor(scope) {
  return scope.id === 'root' ? [0] : Array.from({ length: scope.count }, (_, i) => i);
}

function reconcileSelection(section, content, changed) {
  const model = modelFor(section),
    form = section.querySelector('.playground-controls');
  const scope = model.scopes.find((s) => s.type === 'toggle');
  if (scope) {
    const toggles = [...content.querySelectorAll(scope.target)];
    const name = (i) =>
      scope.id === 'root' ? 'prop:aria-pressed' : `prop:${scope.id}:${i}:aria-pressed`;
    for (const group of content.querySelectorAll('.toggle-group:not([data-type="multiple"])')) {
      const items = toggles.filter((el) => el.closest('.toggle-group') === group);
      const selected = items.filter((el) => el.getAttribute('aria-pressed') === 'true');
      const winner =
        selected.find((el) => name(toggles.indexOf(el)) === changed?.name) || selected[0];
      for (const el of items) {
        const pressed = el === winner;
        el.setAttribute('aria-pressed', String(pressed));
        const control = form.elements[name(toggles.indexOf(el))];
        if (control) control.checked = pressed;
      }
    }
  }
  const radioScope = model.scopes.find((s) => s.type === 'radio');
  if (
    radioScope &&
    changed?.name.startsWith(`state:${radioScope.id}:`) &&
    changed.value.startsWith('Checked')
  ) {
    const index = Number(changed.name.split(':').at(-1));
    const radios = [...content.querySelectorAll(radioScope.target)];
    const winner = radios[index];
    if (winner) {
      for (const el of radios)
        if (
          el !== winner &&
          el.name === winner.name &&
          el.closest('form') === winner.closest('form')
        ) {
          el.checked = false;
          el.removeAttribute('checked');
        }
      winner.checked = true;
      winner.setAttribute('checked', '');
    }
  }
}

// Native interaction updates the inspectors too. Changing an unrelated property
// must not silently reset a draft, current tab, checked choice, or disclosure.
function syncControls(section) {
  if (active !== section) return;
  const model = modelFor(section),
    form = section.querySelector('.playground-controls');
  const demo = section.querySelector('.playground-demo');
  if (!form || !demo) return;
  if (model.slug === 'tag-input')
    section.tagDraft = demo.querySelector('.tag-input-control')?.value || '';
  for (const scope of model.scopes) {
    const targets = [...demo.querySelectorAll(scope.focus || scope.target)];
    if (scope.exclusive) {
      const selected = [...demo.querySelectorAll(scope.target)].findIndex(
        (el) => el.getAttribute(scope.exclusive.attr) === scope.exclusive.on
      );
      form.elements[`exclusive:${scope.id}`].value = String(selected);
    }
    for (const index of instancesFor(scope)) {
      const el = targets[index];
      if (!el || scope.dynamic) continue;
      for (const p of scope.props) {
        const name = scope.id === 'root' ? `prop:${p.attr}` : `prop:${scope.id}:${index}:${p.attr}`;
        const control = form.elements[name];
        if (!control || control.closest('[hidden]')) continue;
        const value = el.getAttribute(p.attr);
        if (!p.values.includes(value)) continue;
        if (control.type === 'checkbox')
          control.checked = value === decodeValue(control.dataset.on);
        else control.value = value === null ? '__remove' : value;
      }
      const control = form.elements[scope.id === 'root' ? 'state' : `state:${scope.id}:${index}`];
      if (!control) continue;
      if (scope.disclosure) control.value = el.open ? 'Open' : 'Closed';
      else if (scope.checkable) {
        el.toggleAttribute('data-demo-mixed', Boolean(el.indeterminate));
        const candidate =
          [
            el.indeterminate ? 'Mixed' : el.checked ? 'Checked' : '',
            el.getAttribute('aria-invalid') === 'true' ? 'invalid' : '',
            el.disabled ? 'disabled' : el.hasAttribute('data-demo-focus') ? 'focus' : ''
          ]
            .filter(Boolean)
            .join(' ') || 'Default';
        const match = scope.states.find((s) => s.toLowerCase() === candidate.toLowerCase());
        if (match) control.value = match;
      }
    }
  }
  valueFields(demo, model.slug).forEach((el, index) => {
    const control = form.elements[`value:${index}`];
    if (control) control.value = el.value;
  });
}

function render(section, changedControl) {
  const model = modelFor(section);
  if (model.presentation) return;
  const form = section.querySelector('.playground-controls'),
    demo = section.querySelector('.playground-demo');
  applyVisibility(form);
  const content = namespace(model.html, `live-${model.slug}`);
  const iconOnly = form.elements['prop:data-icon-only']?.checked ?? false;
  configureContent(section, content);
  const operations = [],
    stateOps = [];
  for (const scope of model.scopes) {
    if (scope.exclusive) {
      const control = form.elements[`exclusive:${scope.id}`];
      let chosen = Number(control?.value ?? -1);
      if (scope.type === 'tab') {
        const enabled = scope.instances
          .map((_, i) => i)
          .filter((i) => !/disabled/i.test(form.elements[`state:${scope.id}:${i}`]?.value));
        const prior = [...demo.querySelectorAll(scope.target)].findIndex(
          (el) => el.getAttribute('aria-selected') === 'true'
        );
        if (!enabled.includes(chosen))
          chosen = enabled.includes(prior) ? prior : (enabled[0] ?? Math.max(prior, 0));
        control.value = String(chosen);
        control.disabled = enabled.length === 0;
        for (const option of control.options)
          option.disabled = !enabled.includes(Number(option.value));
      }
      operations.push(...exclusiveOperations(scope, chosen));
    }
    for (const instance of instancesFor(scope)) {
      const selected = { ...scope, index: instance };
      const propName = (attr) =>
        scope.id === 'root' ? `prop:${attr}` : `prop:${scope.id}:${instance}:${attr}`;
      const values = Object.fromEntries(
        scope.props.map((p) => [p.attr, controlValue(form.elements[propName(p.attr)])])
      );
      const constraints = propertyConstraints(scope, values);
      for (const property of scope.props) {
        const name =
          scope.id === 'root'
            ? `prop:${property.attr}`
            : `prop:${scope.id}:${instance}:${property.attr}`;
        const value = controlValue(form.elements[name]);
        if (value === undefined) continue;
        const cell = form.elements[name]?.closest('.control-cell');
        if (cell && !cell.dataset.hideWhen)
          cell.hidden = constraints.hiddenProps.includes(property.attr);
        operations.push(
          ...propertyOperations(
            selected,
            property.attr,
            constraints.ignoredProps.includes(property.attr) ? null : value
          )
        );
      }
      const stateControl =
        form.elements[scope.id === 'root' ? 'state' : `state:${scope.id}:${instance}`];
      const state = stateControl?.value || scope.initialStates?.[instance] || scope.states[0];
      const irrelevant =
        model.slug === 'tool-call' &&
        form.elements.slot?.value === 'status-only' &&
        (scope.disclosure || scope.type === 'summary');
      if (stateControl) stateControl.closest('label').hidden = irrelevant;
      if (scope.type === 'summary' && model.slug === 'tool-call')
        stateControl?.closest('fieldset')?.toggleAttribute('hidden', irrelevant);
      if (!irrelevant) stateOps.push(...stateOperations(selected, state));
    }
  }
  operate(content, operations);
  operate(
    content,
    slotOperations(
      model.slug,
      model.slug === 'button' && iconOnly ? 'label' : form.elements.slot?.value,
      iconOnly
    )
  );
  operate(content, stateOps);
  reconcileSelection(section, content, changedControl);
  valueFields(content, model.slug).forEach((field, index) => {
    const value = form.elements[`value:${index}`]?.value;
    if (value === undefined) return;
    if (field.matches('progress') && !value) field.removeAttribute('value');
    else {
      field.value = value;
      if (field.matches('input,textarea')) field.defaultValue = value;
      if (field.matches('select'))
        [...field.options].forEach((o) => (o.defaultSelected = o.value === value));
    }
  });
  const text = form.elements.content;
  const editable = textTargets[model.slug] && content.querySelector(textTargets[model.slug]);
  if (text && editable) {
    if (editable.hasAttribute('data-icon-only')) editable.setAttribute('aria-label', text.value);
    else {
      const walker = document.createTreeWalker(editable, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) =>
          n.textContent.trim() && !n.parentElement.closest('svg')
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT
      });
      const node = walker.nextNode();
      if (node) node.textContent = text.value;
    }
  }
  section.calendarObserver?.disconnect();
  demo.replaceChildren(content);
  resizeDemo(section);
  if (model.slug === 'toast') {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'btn';
    trigger.dataset.variant = 'secondary';
    trigger.textContent = 'Show toast';
    const show = () => {
      const options = toastOptions(section);
      if (options.action)
        options.action.onClick = () =>
          (section.querySelector('.playground-feedback').textContent = 'Undo activated');
      section.liveToast = window.toast.show(options);
      section.liveToast.dataset.stateSurface = '';
      operate(section.liveToast, stateOps);
    };
    trigger.addEventListener('click', show);
    if (section.liveToast?.isConnected) {
      window.toast.dismiss();
      show();
    }
    demo.replaceChildren(trigger);
  }
  enhance(demo);
  if (model.slug === 'tag-input' && section.tagDraft !== undefined) {
    const draft = demo.querySelector('.tag-input-control');
    if (draft) draft.value = section.tagDraft;
  }
  operate(demo, stateOps);
  reconcileSelection(section, demo, changedControl);
  if (model.slug === 'tabs') {
    const chosen = demo.querySelector('[role="tab"][aria-selected="true"]');
    if (chosen)
      chosen
        .closest('[role="tablist"]')
        .dispatchEvent(new CustomEvent('tabs:activate', { detail: { id: chosen.id } }));
    // All-disabled is a presentation change, not activation of a disabled tab.
    // Keep the prior selected panel rather than the fixture's default panel.
    for (const tab of demo.querySelectorAll('[role="tab"]')) {
      const selected = tab === chosen;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected && !tab.disabled ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) panel.hidden = !selected;
    }
  }
  if (model.slug === 'date-picker') {
    const dynamic = model.scopes.find((s) => s.dynamic);
    const applyDay = () => {
      const target = demo.querySelector(dynamic.target);
      if (section.calendarTarget?.element !== target) {
        if (section.calendarTarget)
          for (const [attr, value] of section.calendarTarget.attributes) {
            if (value === null) section.calendarTarget.element.removeAttribute(attr);
            else section.calendarTarget.element.setAttribute(attr, value);
          }
        section.calendarTarget = target
          ? {
              element: target,
              attributes: ['disabled', 'aria-disabled', 'data-demo-focus', 'data-demo-hover'].map(
                (attr) => [attr, target.getAttribute(attr)]
              )
            }
          : null;
      }
      const state = form.elements[`state:${dynamic.id}:0`]?.value || 'Default';
      operate(demo, stateOperations(dynamic, state));
      updateCode(section);
    };
    if (dynamic) {
      section.applyCalendarState = applyDay;
      section.calendarObserver = new MutationObserver(applyDay);
      section.calendarObserver.observe(demo.querySelector('.date-picker-grid'), {
        childList: true,
        subtree: true
      });
      applyDay();
    }
  }
  syncControls(section);
  updateCode(section);
}

function route() {
  const section =
    sections.find((el) => `#preview-${el.dataset.component}` === location.hash) || sections[0];
  if (active === section) return;
  if (active) {
    active.calendarObserver?.disconnect();
    if (active.dataset.component === 'toast') window.toast?.dismiss();
    active.querySelectorAll('dialog[open]').forEach((el) => el.close());
    active.querySelector('.playground-demo')?.replaceChildren();
  }
  active = section;
  sections.forEach((el) => (el.hidden = el !== section));
  document.querySelectorAll('.docs-nav a').forEach((a) => {
    if (a.hash === `#preview-${section.dataset.component}`) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  render(section);
  document.title = `${modelFor(section).name} playground | mewa_ui`;
  requestAnimationFrame(() => window.scrollTo(0, 0));
}

for (const section of sections) {
  const form = section.querySelector('.playground-controls'),
    demo = section.querySelector('.playground-demo');
  if (!form || !demo) continue;
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('input', (e) => {
    if (e.target.name === 'width') {
      resizeDemo(section);
      return;
    }
    if (section.dataset.component === 'date-picker' && e.target.name.startsWith('state')) {
      const scope = modelFor(section).scopes.find((s) =>
        e.target.name.startsWith(`state:${s.id}:`)
      );
      if (scope?.dynamic) section.applyCalendarState?.();
      else if (scope)
        operate(
          demo,
          stateOperations(
            { ...scope, index: Number(e.target.name.split(':').at(-1)) },
            e.target.value
          )
        );
      updateCode(section);
      return;
    }
    if (section.dataset.component === 'date-picker' && e.target.name.startsWith('prop:')) {
      const [, scopeId, index, attr] = e.target.name.split(':');
      const scope = modelFor(section).scopes.find((s) => s.id === scopeId);
      if (scope)
        operate(
          demo,
          propertyOperations({ ...scope, index: Number(index) }, attr, controlValue(e.target))
        );
      updateCode(section);
      return;
    }
    render(section, e.target);
  });
  form.addEventListener('reset', () =>
    queueMicrotask(() => {
      delete section.tagDraft;
      render(section);
    })
  );
  function report(event) {
    queueMicrotask(() => {
      section.applyCalendarState?.();
      syncControls(section);
      updateCode(section);
    });
    const target = event.target;
    const name =
      target.getAttribute?.('aria-label') ||
      target.name ||
      target.textContent?.trim().slice(0, 60) ||
      section.dataset.component;
    const value = ['checkbox', 'radio'].includes(target.type) ? target.checked : target.value;
    const feedback = section.querySelector('.playground-feedback');
    if (feedback)
      feedback.textContent = `${event.type}: ${name}${value !== undefined ? ` → ${value}` : ''}`;
  }
  for (const event of [
    'input',
    'change',
    'click',
    'keydown',
    'toggle',
    'combobox:change',
    'number-field:change',
    'date-picker:change',
    'date-range-picker:change',
    'color-picker:change',
    'tag-input:change',
    'input-otp:complete',
    'sortable-change',
    'resizable-change',
    'time-field:change',
    'todo-list:progress'
  ])
    demo.addEventListener(event, report, true);
  demo.addEventListener('click', (e) => {
    if (e.target.closest('a[href]')) e.preventDefault();
  });
  demo.addEventListener('submit', (e) => {
    e.preventDefault();
    const feedback = section.querySelector('.playground-feedback');
    if (feedback)
      feedback.textContent = `Submitted: ${JSON.stringify([...new FormData(e.target)])}`;
  });
  demo.replaceChildren();
}
window.addEventListener('hashchange', route);
document.body.classList.add('enhanced');
route();
document.documentElement.classList.remove('playground-loading');
