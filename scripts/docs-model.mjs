import {
  canonicalHtml,
  rootProfile,
  partDefinitions,
  partProfile,
  statesFor,
  slots
} from '../docs/component-model.mjs';
import { propertyOperations, stateOperations, slotOperations } from '../docs/model-operations.mjs';

export async function rewrite(html, rules) {
  const r = new HTMLRewriter();
  for (const [selector, element] of rules) r.on(selector, { element });
  return r.transform(new Response(html)).text();
}

export async function operate(html, operations) {
  // Sequential: multiple handlers on the same element must see prior mutations.
  for (const op of operations) {
    let index = 0;
    html = await rewrite(html, [
      [
        op.selector,
        (el) => {
          if (op.index !== undefined && index++ !== op.index) return;
          if (op.remove) {
            el.remove();
            return;
          }
          if (op.attr) {
            let attr = op.attr;
            let value = op.value;
            if (
              attr === 'disabled' &&
              !['input', 'select', 'textarea', 'button', 'fieldset'].includes(el.tagName)
            ) {
              attr = 'aria-disabled';
              if (value !== null) value = 'true';
            }
            if (value === null) el.removeAttribute(attr);
            else el.setAttribute(attr, value);
          }
          if (op.html !== undefined) el.setInnerContent(op.html, { html: true });
          if (op.text !== undefined) el.setInnerContent(op.text);
        }
      ]
    ]);
  }
  return html;
}

async function inspect(html, selector) {
  const matches = [];
  await rewrite(html, [[selector, (el) => matches.push(Object.fromEntries(el.attributes))]]);
  return matches;
}

async function scopeFor(html, type, label, profile, id) {
  const matches = await inspect(html, profile.target);
  if (!matches.length) return null;
  const props = Object.entries(profile.props || {}).map(([attr, values]) => {
    const authored = matches[0][attr];
    const value =
      authored === undefined
        ? (profile.defaults?.[attr] ??
          (values.includes(null) ? null : values.includes('') ? '' : values[0]))
        : values.includes(authored)
          ? authored
          : values[0];
    return { attr, values, default: value };
  });
  return {
    ...profile,
    props,
    states: statesFor(profile),
    type,
    label,
    id,
    count: matches.length,
    instances: matches,
    index: 0
  };
}

export async function compileModel(c) {
  let html = canonicalHtml(c)
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n');
  let staticHtml = canonicalHtml(c, true)
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n');
  const scopes = [];
  const root = await scopeFor(html, c.slug, c.name, rootProfile(c.slug), 'root');
  if (root) scopes.push(root);
  for (const [type, label, selector] of partDefinitions) {
    if (type === c.slug || (c.slug === 'text-field' && type === 'text-field')) continue;
    // Only descendants of the component belong to it. Overlay launchers live
    // outside the component and must never become properties of its anatomy.
    if (!root) continue;
    const nested = root.target
      .split(',')
      .flatMap((parent) => selector.split(',').map((child) => `${parent.trim()} ${child.trim()}`))
      .join(',');
    const part = await scopeFor(html, type, label, partProfile(type, nested), `part-${type}`);
    if (part) scopes.push(part);
  }
  if (c.slug === 'date-picker') {
    const p = await scopeFor(
      staticHtml,
      'day',
      'Calendar day',
      partProfile('day', '.date-picker-day:not([data-disabled]) button'),
      'part-day'
    );
    if (p && !scopes.some((s) => s.id === p.id)) scopes.push(p);
  }
  const operations = scopes.flatMap((s) => [
    ...s.props.flatMap((p) => propertyOperations(s, p.attr, p.default)),
    ...stateOperations(s, s.states[0])
  ]);
  html = await operate(html, operations);
  staticHtml = await operate(staticHtml, operations);
  const slot = slots[c.slug];
  if (slot) {
    html = await operate(html, slotOperations(c.slug, slot.default));
    staticHtml = await operate(staticHtml, slotOperations(c.slug, slot.default));
  }
  return {
    slug: c.slug,
    name: c.name,
    html,
    staticHtml,
    scopes,
    slot,
    wide: rootProfile(c.slug).wide || rootProfile(c.slug).overlay,
    toastActionHtml:
      c.slug === 'toast'
        ? c.specimens.find((s) => s.html.includes('toast-action'))?.html
        : undefined
  };
}

export async function matrixRows(model) {
  const root = model.scopes.find((s) => s.id === 'root');
  let combinations = [{ label: 'Default', html: model.staticHtml }];
  for (const prop of root?.props || []) {
    if (['data-loop', 'data-submit-on', 'data-preview', 'data-type'].includes(prop.attr)) continue;
    const next = [];
    for (const row of combinations)
      for (const value of prop.values) {
        const html = await operate(row.html, propertyOperations(root, prop.attr, value));
        next.push({
          label: `${row.label === 'Default' ? '' : row.label + ' · '}${prop.attr.replace(/^data-|^aria-/, '')}: ${value === null ? 'off' : value || (prop.values.includes(null) ? 'on' : 'default')}`,
          html
        });
      }
    combinations = next;
  }
  if (model.slot) {
    const next = [];
    for (const row of combinations)
      for (const value of model.slot.values) {
        if (
          model.slug === 'layout' &&
          ['container', 'center'].includes(value) &&
          !row.html.includes('data-gap="md"')
        )
          continue;
        if (model.slug === 'button' && row.html.includes('data-icon-only') && value !== 'label')
          continue;
        let html =
          model.slug === 'toast' && value === 'action'
            ? await operate(
                model.toastActionHtml,
                (root?.props || []).flatMap((p) => {
                  const match = row.html.match(new RegExp(`${p.attr}="([^"]*)"`));
                  return propertyOperations(root, p.attr, match?.[1] ?? p.default);
                })
              )
            : row.html;
        html = await operate(
          html,
          slotOperations(model.slug, value, html.includes('data-icon-only'))
        );
        next.push({ label: `${row.label} · ${model.slot.label}: ${value}`, html });
      }
    combinations = next;
  }
  const rows = combinations.map((r) => ({
    ...r,
    scope: root,
    states: root?.states || ['Default']
  }));
  // A nested atom gets a separate, named row. Only that atom receives state;
  // surrounding siblings preserve their own defaults.
  for (const scope of model.scopes.filter((s) => s.id !== 'root')) {
    let base = model.staticHtml;
    let part = scope;
    let wide = model.wide;
    if (['button', 'toggle', 'dismiss', 'suggestion-item'].includes(scope.type)) {
      let first = true;
      const marked = await rewrite(base, [
        [
          scope.target,
          (el) => {
            if (!first) return;
            first = false;
            el.before('<!--part-start-->', { html: true });
            el.after('<!--part-end-->', { html: true });
          }
        ]
      ]);
      const extracted = marked.split('<!--part-start-->')[1]?.split('<!--part-end-->')[0];
      if (!extracted) continue;
      base = extracted;
      const selector = {
        button: '.btn',
        toggle: '.toggle',
        dismiss: '.toast-close',
        'suggestion-item': 'button'
      }[scope.type];
      // Preserve positioning context for the dismiss affordance.
      if (scope.type === 'dismiss') base = `<div class="toast">${base}</div>`;
      part = { ...scope, target: selector, focus: selector };
      wide = false;
    }
    rows.push({
      label: `Nested · ${scope.label}`,
      html: base,
      scope: part,
      states: scope.states,
      wide
    });
    for (const prop of scope.props)
      for (const value of prop.values) {
        if (value === prop.default) continue;
        rows.push({
          label: `Nested · ${scope.label} · ${prop.attr}: ${value ?? 'off'}`,
          html: await operate(base, propertyOperations(part, prop.attr, value)),
          scope: part,
          states: scope.states,
          wide
        });
      }
  }
  return rows;
}
