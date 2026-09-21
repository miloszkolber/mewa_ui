import fs from 'node:fs';
import path from 'node:path';
import { escapeHtml as esc, idReferences } from '../docs/catalog.mjs';
import {
  propertyLabel,
  optionLabel,
  encodeValue,
  booleanValues,
  initialValue
} from '../docs/component-model.mjs';
import { stateOperations } from '../docs/model-operations.mjs';
import { compileModel, matrixRows, operate, rewrite } from './docs-model.mjs';

export async function namespace(html, prefix) {
  const ids = new Map();
  await rewrite(html, [
    [
      '[id]',
      (el) => {
        const id = el.getAttribute('id');
        ids.set(id, `${prefix}-${id}`);
      }
    ]
  ]);
  const output = await rewrite(html, [
    [
      '*',
      (el) => {
        for (const attr of idReferences) {
          const value = el.getAttribute(attr);
          if (value !== null)
            el.setAttribute(
              attr,
              value
                .split(/\s+/)
                .map((id) => ids.get(id) || id)
                .join(' ')
            );
        }
        const href = el.getAttribute('href');
        if (href?.startsWith('#') && ids.has(href.slice(1)))
          el.setAttribute('href', `#${ids.get(href.slice(1))}`);
        const name = el.getAttribute('name');
        if (name !== null) el.setAttribute('name', `${prefix}-${name}`);
      }
    ]
  ]);
  return output.replace(/[ \t]+$/gm, '');
}

function select(label, name, values, initial, labels = values) {
  if (values.length < 2) return '';
  return `<label>${esc(label)}<select class="select" name="${name}">${values.map((v, i) => `<option value="${esc(encodeValue(v))}"${v === initial ? ' selected' : ''}>${esc(labels[i])}</option>`).join('')}</select></label>`;
}

function controlName(scopeId, attr, instance) {
  return scopeId === 'root' ? `prop:${attr}` : `prop:${scopeId}:${instance}:${attr}`;
}

function stateName(scopeId, instance) {
  return scopeId === 'root' ? 'state' : `state:${scopeId}:${instance}`;
}

// Each repeated part instance owns its own value. Fall back to the value that
// means "attribute absent" rather than to another instance's authored value.
function propertyControl(scope, property, instance) {
  const name = controlName(scope.id, property.attr, instance);
  const label = propertyLabel(property.attr);
  const initial = initialValue(scope, property, instance);
  const boolean = booleanValues(property.values);
  if (boolean) {
    return `<label class="control-switch"><span>${esc(label)}</span><input type="checkbox" role="switch" name="${esc(name)}" data-off="${esc(encodeValue(boolean[0]))}" data-on="${esc(encodeValue(boolean[1]))}"${initial === boolean[1] ? ' checked' : ''}></label>`;
  }
  return select(
    label,
    name,
    property.values,
    initial,
    property.values.map((v) => optionLabel(scope.type, property.attr, v, property.values))
  );
}

// Property controls that only apply in some states. The playground reads this
// attribute and hides the matching fieldset without re-rendering the form.
function hideWhen(slug, scopeId, kind) {
  if (scopeId !== 'root') return '';
  if (slug === 'button' && kind === 'slot')
    return ' data-hide-when="{&quot;control&quot;:&quot;prop:data-icon-only&quot;,&quot;in&quot;:[&quot;&quot;]}"';
  if (slug === 'layout' && kind === 'prop:data-gap')
    return ' data-hide-when="{&quot;control&quot;:&quot;slot&quot;,&quot;in&quot;:[&quot;container&quot;,&quot;center&quot;]}"';
  return '';
}

function scopeControls(model, scope) {
  const instances = scope.id === 'root' ? [0] : Array.from({ length: scope.count }, (_, i) => i);
  return instances
    .map((instance) => {
      const state =
        scope.states.length > 1
          ? select(
              scope.dynamic ? 'Active day visual state' : 'Visual state',
              stateName(scope.id, instance),
              scope.states,
              scope.initialStates?.[instance] || scope.states[0]
            )
          : '';
      const properties = scope.props
        .map(
          (property) =>
            `<span class="control-cell" data-property="${esc(property.attr)}"${hideWhen(model.slug, scope.id, `prop:${property.attr}`)}>${propertyControl(scope, property, instance)}</span>`
        )
        .join('');
      if (!state && !properties) return '';
      const legend =
        scope.id === 'root' || instances.length === 1
          ? scope.id === 'root'
            ? model.name
            : scope.label
          : `${scope.label} ${instance + 1}`;
      return `${instance === 0 && scope.exclusive ? exclusiveControls(scope) : ''}<fieldset class="property-scope" data-scope="${esc(scope.id)}" data-instance="${instance}"><legend>${esc(legend)}</legend>${properties}${state}</fieldset>`;
    })
    .join('');
}

// Selection cardinality and hover/focus/availability are independent axes.
function exclusiveControls(scope) {
  const authored = scope.instances.findIndex(
    (instance) => instance[scope.exclusive.attr] === scope.exclusive.on
  );
  const initial = scope.type === 'tab' ? Math.max(authored, 0) : authored;
  const options = scope.instances
    .map(
      (_, index) =>
        `<option value="${index}"${index === initial ? ' selected' : ''}>${esc(`${scope.label} ${index + 1}`)}</option>`
    )
    .join('');
  return `<fieldset class="property-scope" data-exclusive="true"><legend>${esc(scope.label)} selection</legend><label>${scope.exclusive.attr === 'aria-current' ? 'Current item' : 'Selected item'}<select class="select" name="exclusive:${esc(scope.id)}">${scope.type === 'tab' ? '' : `<option value="-1"${initial < 0 ? ' selected' : ''}>None</option>`}${options}</select></label></fieldset>`;
}

function controls(model) {
  const scopes = model.scopes.map((scope) => scopeControls(model, scope)).join('');
  const slot = model.slot
    ? `<fieldset class="property-scope" data-scope="slot"${hideWhen(model.slug, 'root', 'slot')}><legend>${esc(model.slot.label)}</legend>${select(model.slot.label, 'slot', model.slot.values, model.slot.default)}</fieldset>`
    : '';
  return `${scopes}${slot}<fieldset class="property-scope playground-values" hidden><legend>Values</legend></fieldset><fieldset class="property-scope"><legend>Viewport</legend>${select('Width', 'width', ['auto', '320px', '480px', '768px'], 'auto', ['Fill available space', '320px', '480px', '768px'])}<button class="btn" data-variant="secondary" type="reset">Reset</button></fieldset>`;
}

const themeIcon =
  '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20V2Zm0 2v16a8 8 0 0 1 0-16Z"/></svg>';
function grouped(models) {
  return [...Map.groupBy(models, (m) => m.category)];
}
function shell(models, matrix, content) {
  const brand = `<div class="docs-brand-row"><span class="docs-brand">mewa_ui</span><button class="toggle" type="button" data-docs-theme-toggle aria-pressed="false" aria-label="Switch to dark theme">${themeIcon}</button></div>`;
  const chrome = matrix
    ? `<header class="matrix-toolbar">${brand}</header>`
    : `<aside class="docs-sidebar" aria-label="Component navigation">${brand}<label class="docs-search-label" for="component-search">Components <span>${models.length}</span></label><input class="text-field-input" type="search" id="component-search" placeholder="Find a component" autocomplete="off"><nav class="docs-nav" aria-label="Components">${grouped(
        models
      )
        .map(
          ([category, items]) =>
            `<section class="docs-nav-group" data-category="${esc(category)}"><h2>${esc(category)}</h2>${items.map((c) => `<a href="#preview-${c.slug}">${esc(c.name)}</a>`).join('')}</section>`
        )
        .join('')}</nav><p class="docs-no-results" hidden>No matching components.</p></aside>`;
  const themeScript = `try{let t=localStorage.getItem('mewa-docs-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}catch{}`;
  return `<!DOCTYPE html>
<!-- Generated from component models. Run bun run docs:write. -->
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex, nofollow"><meta name="color-scheme" content="light dark"><title>mewa_ui | ${matrix ? 'State matrix' : 'Component playgrounds'}</title><link rel="icon" href="favicon.svg" type="image/svg+xml"><script>${themeScript}${matrix ? '' : "document.documentElement.classList.add('playground-loading');"}</script><link rel="stylesheet" href="../library/src/base.css"><link rel="stylesheet" href="../library/src/tokens.css"><link rel="stylesheet" href="components.generated.css"><link rel="stylesheet" href="states.generated.css"><link rel="stylesheet" href="docs-utilities.css"><link rel="stylesheet" href="workbench.css"></head><body class="${matrix ? 'matrix-page' : 'playground-page'}"><a class="skip-link" href="#content">Skip to content</a><div class="docs-layout">${chrome}<main id="content" tabindex="-1" data-export-surface="${matrix ? 'figma' : 'playground'}">${content}</main></div><script src="theme.js" defer></script>${matrix ? '' : '<script src="playground.generated.js" defer></script>'}</body></html>\n`;
}

export async function renderDocumentation(root, registry) {
  const source = JSON.parse(fs.readFileSync(path.join(root, 'docs/specimens.json'), 'utf8'));
  if (source.length !== registry.components.length)
    throw new Error('Incomplete documentation catalog');
  const compiled = await Promise.all(
    source.map((c) =>
      compileModel(
        c,
        registry.components.find((m) => m.slug === c.slug)
      )
    )
  );
  const models = grouped(compiled).flatMap(([, items]) => items);
  const preview = [],
    matrix = [];
  let previousCategory;
  for (const model of models) {
    const meta = registry.components.find((c) => c.slug === model.slug);
    const label = `preview-${model.slug}`;
    const html = await namespace(model.html, `live-${model.slug}`);
    if (previousCategory !== model.category) {
      if (previousCategory) matrix.push('</section>');
      matrix.push(
        `<section class="matrix-category" data-category="${esc(model.category)}"><h1>${esc(model.category)}</h1>`
      );
      previousCategory = model.category;
    }
    if (model.presentation) {
      preview.push(
        `<section class="component-playground component-presentation" data-component="${model.slug}" aria-labelledby="${label}"><header class="component-heading"><h1 id="${label}">${esc(model.name)}</h1></header><p class="component-purpose">${esc(meta.purpose)}</p><div class="presentation-surface" data-state-surface>${html}</div></section>`
      );
    } else {
      preview.push(
        `<section class="component-playground" data-component="${model.slug}" aria-labelledby="${label}"><header class="component-heading"><h1 id="${label}">${esc(model.name)}</h1></header><p class="component-purpose">${esc(meta.purpose)}</p><div class="workbench"><div class="preview playground-viewport" data-state-surface><div class="playground-demo${model.wide ? ' demo-wide' : ''}">${html}</div></div><form class="playground-controls" aria-label="${esc(model.name)} controls">${controls(model)}</form></div><div class="playground-feedback" role="status" aria-live="polite"></div><div class="usage"><h2>HTML</h2><pre tabindex="0"><code class="playground-code">${esc(html)}</code></pre></div></section>`
      );
    }
    const rows = [];
    for (const [i, row] of (await matrixRows(model)).entries()) {
      const base = await rewrite(row.html, [
        [
          '[popover]',
          (el) => {
            el.removeAttribute('popover');
            el.setAttribute('data-static-overlay', '');
          }
        ],
        [
          'dialog',
          (el) => {
            el.setAttribute('open', '');
            el.setAttribute('data-static-overlay', '');
          }
        ],
        [
          '*',
          (el) => {
            el.removeAttribute('autofocus');
            el.removeAttribute('aria-live');
          }
        ]
      ]);
      const cells = [];
      for (const state of row.states) {
        const cell = await namespace(
          await operate(base, row.scope ? stateOperations(row.scope, state) : []),
          `matrix-${model.slug}-${i}-${state.replaceAll(' ', '-').toLowerCase()}`
        );
        cells.push(
          `<div class="matrix-cell" data-state-surface data-state-name="${state}"><div class="matrix-state-label">${state}</div><div class="preview specimen">${cell}</div></div>`
        );
      }
      rows.push(
        `<div class="matrix-row${(row.wide ?? model.wide) ? ' matrix-wide' : ''}" data-part="${row.scope?.id || 'root'}"${cells.length === 1 ? ' data-single-state' : ''}><h3>${esc(row.label)}</h3><div class="matrix-cells">${cells.join('')}</div></div>`
      );
    }
    matrix.push(
      `<section class="component-matrix" data-component="${model.slug}" aria-labelledby="${label}"><h2 id="${label}">${esc(model.name)}</h2><div class="matrix-specimens" inert>${rows.join('')}</div></section>`
    );
  }
  matrix.push('</section>');
  const outputs = new Map([
    ['docs/preview.html', shell(models, false, preview.join('\n'))],
    ['docs/figma.html', shell(models, true, matrix.join('\n'))]
  ]);
  outputs.models = models;
  return outputs;
}
