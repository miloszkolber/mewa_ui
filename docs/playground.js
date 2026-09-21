import 'mewa-docs-behaviors';
import models from 'mewa-docs-models';
import { idReferences, valueComponents, textTargets } from './catalog.mjs';
import { decodeValue } from './component-model.mjs';
import { propertyOperations, stateOperations, slotOperations } from './model-operations.mjs';
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
  });
  return t.content;
}

function operate(root, operations) {
  for (const op of operations)
    [...root.querySelectorAll(op.selector)].forEach((el, index) => {
      if (op.index !== undefined && index !== op.index) return;
      if (op.remove) {
        el.remove();
        return;
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
  section.querySelector('.playground-code').textContent =
    section.dataset.component === 'toast'
      ? `window.toast.show(${JSON.stringify(toastOptions(section), null, 2)});`
      : copy.innerHTML.trim();
}

function valueFields(content, slug) {
  if (!valueComponents.has(slug)) return [];
  return [...content.querySelectorAll(nativeValues)].filter(
    (el) => slug !== 'color-picker' || el.type === 'color'
  );
}
function configureContent(section, content) {
  const form = section.querySelector('.playground-controls');
  const container = form.querySelector('.playground-values');
  if (container.dataset.ready) return;
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
  const width = section.querySelector('.playground-controls').elements.width.value;
  const demo = section.querySelector('.playground-demo');
  if (width === 'auto') demo.style.removeProperty('width');
  else demo.style.width = width;
}

function render(section) {
  const model = modelFor(section),
    form = section.querySelector('.playground-controls'),
    demo = section.querySelector('.playground-demo');
  const content = namespace(model.html, `live-${model.slug}`);
  if (model.slug === 'layout') {
    const gap = form.elements['prop:data-gap'];
    gap.closest('fieldset').hidden = ['container', 'center'].includes(form.elements.slot.value);
  }
  const iconOnly = form.elements['prop:data-icon-only']?.value === '';
  if (model.slug === 'button') form.elements.slot.closest('fieldset').hidden = iconOnly;
  configureContent(section, content);
  const operations = [],
    stateOps = [];
  for (const scope of model.scopes) {
    const selected = { ...scope, index: Number(form.elements[`instance:${scope.id}`]?.value || 0) };
    for (const prop of scope.props)
      operations.push(
        ...propertyOperations(
          selected,
          prop.attr,
          decodeValue(
            form.elements[
              scope.id === 'root' ? `prop:${prop.attr}` : `prop:${scope.id}:${prop.attr}`
            ].value
          )
        )
      );
    const state =
      form.elements[scope.id === 'root' ? 'state' : `state:${scope.id}`]?.value || scope.states[0];
    stateOps.push(...stateOperations(selected, state));
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
  operate(demo, stateOps);
  updateCode(section);
}

function route() {
  const section =
    sections.find((el) => `#preview-${el.dataset.component}` === location.hash) || sections[0];
  if (active === section) return;
  if (active) {
    if (active.dataset.component === 'toast') window.toast?.dismiss();
    active.querySelectorAll('dialog[open]').forEach((el) => el.close());
    active.querySelector('.playground-demo').replaceChildren();
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
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('input', (e) => {
    if (e.target.name === 'width') {
      resizeDemo(section);
      return;
    }
    if (e.target.name.startsWith('instance:')) {
      const scope = modelFor(section).scopes.find((s) => s.id === e.target.name.slice(9));
      const instance = scope.instances[Number(e.target.value)];
      for (const prop of scope.props) {
        const value = instance?.[prop.attr];
        form.elements[`prop:${scope.id}:${prop.attr}`].value = prop.values.includes(value)
          ? value
          : prop.values.includes(null)
            ? '__remove'
            : prop.values.includes('')
              ? ''
              : prop.default;
      }
      const state = form.elements[`state:${scope.id}`];
      if (state) state.value = scope.states[0];
    }
    render(section);
  });
  form.addEventListener('reset', () => queueMicrotask(() => render(section)));
  function report(event) {
    queueMicrotask(() => updateCode(section));
    const target = event.target;
    const name =
      target.getAttribute?.('aria-label') ||
      target.name ||
      target.textContent?.trim().slice(0, 60) ||
      section.dataset.component;
    const value = ['checkbox', 'radio'].includes(target.type) ? target.checked : target.value;
    section.querySelector('.playground-feedback').textContent =
      `${event.type}: ${name}${value !== undefined ? ` → ${value}` : ''}`;
  }
  for (const event of [
    'input',
    'change',
    'click',
    'toggle',
    'combobox:change',
    'number-field:change',
    'date-picker:change',
    'date-range-picker:change',
    'color-picker:change',
    'tag-input:change',
    'input-otp:complete',
    'sortable:change',
    'resizable-change',
    'time-field:change',
    'todo-list:change'
  ])
    demo.addEventListener(event, report, true);
  demo.addEventListener('click', (e) => {
    if (e.target.closest('a[href]')) e.preventDefault();
  });
  demo.addEventListener('submit', (e) => {
    e.preventDefault();
    section.querySelector('.playground-feedback').textContent =
      `Submitted: ${JSON.stringify([...new FormData(e.target)])}`;
  });
  section.querySelector('[data-copy]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(section.querySelector('.playground-code').textContent);
      section.querySelector('.playground-feedback').textContent = 'Copied to clipboard.';
    } catch {
      section.querySelector('.playground-feedback').textContent =
        'Clipboard unavailable. Select and copy the code above.';
    }
  });
  demo.replaceChildren();
}
window.addEventListener('hashchange', route);
document.body.classList.add('enhanced');
route();
document.documentElement.classList.remove('playground-loading');
