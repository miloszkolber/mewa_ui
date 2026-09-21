import fs from 'node:fs';
import path from 'node:path';
import { escapeHtml as esc, idReferences } from '../docs/catalog.mjs';
import { propertyLabel, optionLabel, encodeValue } from '../docs/component-model.mjs';
import { stateOperations } from '../docs/model-operations.mjs';
import { compileModel, matrixRows, operate, rewrite } from './docs-model.mjs';

export function namespace(html, prefix) {
  const ids = new Map(
    [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => [m[1], `${prefix}-${m[1]}`])
  );
  return html
    .replace(
      new RegExp(`\\b(${idReferences.join('|')})="([^"]+)"`, 'g'),
      (_, attr, value) =>
        `${attr}="${value
          .split(' ')
          .map((id) => ids.get(id) || id)
          .join(' ')}"`
    )
    .replace(/\bname="([^"]+)"/g, `name="${prefix}-$1"`)
    .replace(/[ \t]+$/gm, '');
}

function select(label, name, values, initial, labels = values) {
  if (values.length < 2) return '';
  return `<label>${esc(label)}<select class="select" name="${name}">${values.map((v, i) => `<option value="${esc(encodeValue(v))}"${v === initial ? ' selected' : ''}>${esc(labels[i])}</option>`).join('')}</select></label>`;
}

function controls(model) {
  const scopes = model.scopes
    .map((s) => {
      const state = select(
        'Visual state',
        s.id === 'root' ? 'state' : `state:${s.id}`,
        s.states,
        s.states[0]
      );
      const props = s.props
        .map((p) =>
          select(
            propertyLabel(p.attr),
            s.id === 'root' ? `prop:${p.attr}` : `prop:${s.id}:${p.attr}`,
            p.values,
            p.default,
            p.values.map((v) => optionLabel(s.type, p.attr, v, p.values))
          )
        )
        .join('');
      if (!state && !props) return '';
      const instance =
        s.id !== 'root' && s.count > 1
          ? select(
              'Instance',
              `instance:${s.id}`,
              Array.from({ length: s.count }, (_, i) => String(i)),
              '0',
              Array.from({ length: s.count }, (_, i) => `${s.label} ${i + 1}`)
            )
          : '';
      return `<fieldset class="property-scope" data-scope="${s.id}"><legend>${esc(s.id === 'root' ? model.name : `Nested · ${s.label}`)}</legend>${instance}${props}${state}</fieldset>`;
    })
    .join('');
  const slot = model.slot
    ? `<fieldset class="property-scope"><legend>Content</legend>${select(model.slot.label, 'slot', model.slot.values, model.slot.default)}</fieldset>`
    : '';
  return `${scopes}${slot}<fieldset class="property-scope playground-values" hidden><legend>Content</legend></fieldset><fieldset class="property-scope"><legend>Viewport</legend>${select('Width', 'width', ['auto', '320px', '480px', '768px'], 'auto', ['Fill available space', '320px', '480px', '768px'])}<button class="btn" data-variant="secondary" type="reset">Reset</button></fieldset>`;
}

const themeIcon =
  '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20V2Zm0 2v16a8 8 0 0 1 0-16Z"/></svg>';
function shell(models, matrix, content) {
  const brand = `<div class="docs-brand-row"><span class="docs-brand">mewa_ui</span><button class="toggle" type="button" data-docs-theme-toggle aria-pressed="false" aria-label="Switch to dark theme">${themeIcon}</button></div>`;
  const chrome = matrix
    ? `<header class="matrix-toolbar">${brand}</header>`
    : `<aside class="docs-sidebar" aria-label="Component navigation">${brand}<label class="docs-search-label" for="component-search">Components <span>${models.length}</span></label><input class="text-field-input" type="search" id="component-search" placeholder="Find a component" autocomplete="off"><nav class="docs-nav" aria-label="Components">${models.map((c) => `<a href="#preview-${c.slug}">${esc(c.name)}</a>`).join('')}</nav><p class="docs-no-results" hidden>No matching components.</p></aside>`;
  const themeScript = `try{let t=localStorage.getItem('mewa-docs-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}catch{}`;
  return `<!DOCTYPE html>
<!-- Generated from component models. Run bun run docs:write. -->
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex, nofollow"><meta name="color-scheme" content="light dark"><title>mewa_ui | ${matrix ? 'State matrix' : 'Component playgrounds'}</title><link rel="icon" href="favicon.svg" type="image/svg+xml"><script>${themeScript}${matrix ? '' : "document.documentElement.classList.add('playground-loading');"}</script><link rel="stylesheet" href="../library/src/base.css"><link rel="stylesheet" href="../library/src/tokens.css"><link rel="stylesheet" href="components.generated.css"><link rel="stylesheet" href="states.generated.css"><link rel="stylesheet" href="docs-utilities.css"><link rel="stylesheet" href="workbench.css"></head><body class="${matrix ? 'matrix-page' : 'playground-page'}"><a class="skip-link" href="#content">Skip to content</a><div class="docs-layout">${chrome}<main id="content" tabindex="-1" data-export-surface="${matrix ? 'figma' : 'playground'}">${content}</main></div><script src="theme.js" defer></script>${matrix ? '' : '<script src="playground.generated.js" defer></script>'}</body></html>\n`;
}

export async function renderDocumentation(root, registry) {
  const source = JSON.parse(fs.readFileSync(path.join(root, 'docs/specimens.json'), 'utf8'));
  if (source.length !== registry.components.length)
    throw new Error('Incomplete documentation catalog');
  const models = await Promise.all(source.map(compileModel));
  const preview = [],
    matrix = [];
  for (const model of models) {
    const meta = registry.components.find((c) => c.slug === model.slug);
    const label = `preview-${model.slug}`;
    const html = namespace(model.html, `live-${model.slug}`);
    preview.push(
      `<section class="component-playground" data-component="${model.slug}" aria-labelledby="${label}"><header class="component-heading"><h1 id="${label}">${esc(model.name)}</h1></header><p class="component-purpose">${esc(meta.purpose)}</p><div class="workbench"><div class="preview playground-viewport" data-state-surface><div class="playground-demo${model.wide ? ' demo-wide' : ''}">${html}</div></div><form class="playground-controls" aria-label="${esc(model.name)} controls">${controls(model)}</form></div><div class="playground-feedback" role="status" aria-live="polite">Interact with the component to inspect its state.</div><details class="usage" open><summary>${model.slug === 'toast' ? 'JavaScript' : 'HTML'}</summary><pre tabindex="0"><code class="playground-code">${esc(html)}</code></pre><button class="btn" data-variant="secondary" type="button" data-copy>Copy ${model.slug === 'toast' ? 'JavaScript' : 'HTML'}</button></details><p class="contract-link"><a href="../library/components/${model.slug}/${model.slug}.md">Component contract</a></p></section>`
    );
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
        const cell = namespace(
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
  const outputs = new Map([
    ['docs/preview.html', shell(models, false, preview.join('\n'))],
    ['docs/figma.html', shell(models, true, matrix.join('\n'))]
  ]);
  outputs.models = models;
  return outputs;
}
