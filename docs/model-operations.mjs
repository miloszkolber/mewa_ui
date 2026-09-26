import { demoIcon, demoIconEnd, demoSpinner } from './component-model.mjs';
import { escapeHtml } from './catalog.mjs';

// Exact owner paths are compiled before controls are rendered. A missing label
// in one item must never shift an update onto the following item's label.
export const companionSelectors = {
  label: ['input,select,textarea'],
  'tool-call': ['.tool-call-state', '.tool-call-mark'],
  'activity-item': ['.agent-activity-status', '.agent-activity-marker'],
  'todo-item': ['.todo-item-status', '.todo-item-mark'],
  composer: ['.composer-hint', '.composer-status'],
  message: ['.message-name', '.message-content', '.message-avatar'],
  'code-block': ['.code-block-state'],
  reasoning: ['.reasoning-status'],
  'file-diff': ['.file-diff-state'],
  'toggle-group': ['.toggle'],
  'number-field': ['.number-field button'],
  resizable: ['.resizable-group', '.resizable-handle'],
  toolbar: ['.separator'],
  'date-picker': ['.date-picker-nav', '.date-picker-day'],
  'file-input': ['.file-input'],
  'text-field': ['.text-field'],
  field: ['.field'],
  'tag-input': [
    '.tag-input-field',
    '.tag-input-fallback',
    '.tag-input-remove',
    '.tag-input-control'
  ],
  'file-upload': ['.file-upload']
};

function owned(scope, child) {
  return (scope.instanceSelectors?.[scope.index || 0] || scope.target)
    .split(',')
    .flatMap((selector) => child.split(',').map((part) => `${selector.trim()} ${part.trim()}`))
    .join(',');
}

function companionOperations(scope, selector, operation) {
  const indices = scope.companionIndices?.[scope.index || 0]?.[selector];
  if (indices) return indices.map((index) => ({ selector, index, ...operation }));
  return [{ selector: owned(scope, selector), ...operation }];
}

// Operations are consumed by both HTMLRewriter (export) and DOM (playground).
// Keeping mutations here prevents the two surfaces from inventing different APIs.
export function propertyOperations(scope, property, value) {
  const name = property.name;
  const attr = property.attr;
  const index = scope.index || 0;
  const ops = [];
  if (!attr) return ops;
  if (name === 'data-icon-variant') {
    ops.push({ selector: scope.target, index, variant: value });
    return ops;
  }
  ops.push({ selector: scope.target, index, attr, value });

  const nativeTargets = {
    field: 'input,select,textarea',
    'form-field': 'input,select,textarea',
    form: 'input,select,textarea',
    'button-group': 'button',
    'color-picker': 'input',
    'file-upload': 'input[type="file"]',
    combobox: '.combobox-trigger,[data-combobox-input]',
    'tag-input': '.tag-input-fallback,.tag-input-control',
    'time-field': '[data-time-part="hour"],[data-time-part="minute"],[data-time-part="period"]',
    'date-range-picker': '.date-range-input',
    'input-otp': 'input:not([type="hidden"])'
  };
  if (['disabled', 'invalid', 'required', 'readonly'].includes(name) && nativeTargets[scope.type]) {
    let selector = nativeTargets[scope.type];
    if (name === 'readonly' && scope.type === 'time-field')
      selector = '[data-time-part="hour"],[data-time-part="minute"]';
    ops.push({
      selector: owned(scope, selector),
      attr: name === 'invalid' ? 'aria-invalid' : name,
      value: value === null ? null : name === 'invalid' ? 'true' : ''
    });
    if (name === 'readonly' && scope.type === 'time-field')
      ops.push({ selector: owned(scope, '[data-time-part="period"]'), attr: 'disabled', value });
    if (name === 'readonly' && scope.type === 'tag-input')
      ops.push({ selector: owned(scope, '.tag-input-remove'), attr: 'disabled', value });
  }
  if (name === 'disabled') {
    if (scope.type === 'label')
      ops.push(...companionOperations(scope, 'input,select,textarea', { attr: 'disabled', value }));
    if (scope.type === 'toggle-group')
      ops.push(...companionOperations(scope, '.toggle', { attr: 'disabled', value }));
    if (scope.type === 'number-field')
      ops.push(...companionOperations(scope, '.number-field button', { attr: 'disabled', value }));
    if (scope.type === 'date-picker')
      ops.push(
        ...['.date-picker-nav', '.date-picker-day'].flatMap((selector) =>
          companionOperations(scope, selector, {
            attr: 'disabled',
            value
          })
        )
      );
    if (scope.type === 'tag-input') {
      ops.push({
        selector: owned(scope, '.tag-input-fallback'),
        attr: 'disabled',
        value
      });
      ops.push({
        selector: `${owned(scope, '.tag-input-remove')},${owned(scope, '.tag-input-control')}`,
        attr: 'disabled',
        value
      });
    }
    if (scope.type === 'text-field')
      ops.push(...companionOperations(scope, '.text-field', { attr: 'data-disabled', value }));
  }
  if (name === 'invalid') {
    if (scope.type === 'text-field')
      ops.push(
        ...companionOperations(scope, '.text-field', {
          attr: 'data-invalid',
          value: value === null ? null : ''
        })
      );
  }
  if (name === 'open' && scope.type === 'combobox')
    ops.push({ selector: scope.target, index, popover: value !== null });
  if (name === 'loading')
    ops.push({
      selector: scope.target,
      index,
      attr: 'aria-busy',
      value: value === null ? null : 'true'
    });
  if (name === 'indeterminate') {
    ops.push({ selector: scope.target, index, attr: 'data-demo-mixed', value });
  }
  if (attr === 'data-orientation' && scope.type === 'slider')
    ops.push({
      selector: scope.target,
      index,
      attr: 'aria-orientation',
      value: value || 'horizontal'
    });
  if (scope.type === 'nav-link' && attr === 'aria-current' && value === 'page')
    for (let i = 0; i < scope.count; i++)
      if (i !== index) ops.push({ selector: scope.target, index: i, attr, value: null });
  if (attr === 'data-orientation' && scope.type === 'resizable') {
    ops.push(...companionOperations(scope, '.resizable-group', { attr, value }));
    ops.push(
      ...companionOperations(scope, '.resizable-handle', { attr: 'aria-orientation', value })
    );
  }
  if (attr === 'aria-orientation' && scope.type === 'toolbar') {
    ops.push(...companionOperations(scope, '.toggle-group', { attr: 'data-orientation', value }));
    ops.push(
      ...companionOperations(scope, '.separator', {
        attr: 'data-orientation',
        value: value === 'vertical' ? 'horizontal' : 'vertical'
      })
    );
  }
  if (attr === 'data-variant' && scope.type === 'badge')
    ops.push({
      selector: scope.target,
      index,
      text: value === 'count' ? '8' : 'Badge'
    });
  if (attr === 'data-state' && scope.type === 'badge' && value) {
    ops.push({ selector: scope.target, index, attr: 'data-variant', value: null });
    ops.push({
      selector: scope.target,
      index,
      text: { positive: 'Ready', caution: 'Delayed', negative: 'Failed', running: 'Running' }[value]
    });
  }
  if (attr === 'data-author' && value) {
    const author = value === 'user' ? 'You' : value[0].toUpperCase() + value.slice(1);
    ops.push(
      ...companionOperations(scope, '.message-name', { text: author }),
      ...companionOperations(scope, '.message-content', { attr: 'aria-label', value: author }),
      ...companionOperations(scope, '.message-avatar', { text: author[0] }),
      ...companionOperations(scope, '.message-avatar', { attr: 'aria-hidden', value: 'true' })
    );
  }
  if (attr === 'data-streaming' && ['code-block', 'reasoning', 'file-diff'].includes(scope.type)) {
    const streaming = value !== null;
    ops.push({
      selector: scope.target,
      index,
      attr: 'aria-busy',
      value: streaming ? 'true' : null
    });
    ops.push(
      ...companionOperations(scope, companionSelectors[scope.type][0], {
        text: streaming
          ? { 'code-block': 'Streaming', reasoning: 'In progress', 'file-diff': 'Updating' }[
              scope.type
            ]
          : 'Complete'
      })
    );
  }
  if (attr === 'data-status') {
    const labels = { pending: 'To do', active: 'In progress', done: 'Done', error: 'Error' };
    const status =
      scope.type === 'todo-item' ? labels[value] : value[0].toUpperCase() + value.slice(1);
    const selectors = {
      'tool-call': ['.tool-call-state', '.tool-call-mark'],
      'activity-item': ['.agent-activity-status', '.agent-activity-marker'],
      'todo-item': ['.todo-item-status', '.todo-item-mark']
    }[scope.type];
    if (selectors) {
      ops.push(...companionOperations(scope, selectors[0], { text: status }));
      if (scope.type !== 'activity-item')
        ops.push(
          ...companionOperations(scope, selectors[1], {
            text: { pending: '·', running: '›', active: '›', complete: '✓', done: '✓', error: '!' }[
              value
            ]
          })
        );
    }
  }
  if (attr === 'data-state' && scope.type === 'composer') {
    ops.push({
      selector: scope.target,
      index,
      attr: 'aria-busy',
      value: value === 'thinking' ? 'true' : null
    });
    ops.push(
      ...companionOperations(scope, '.composer-status', {
        text: value === 'thinking' ? 'Thinking…' : 'Ready'
      })
    );
  }
  if (attr === 'data-trend')
    ops.push({
      selector: scope.target,
      index,
      text: value === 'up' ? '↑ +20.1%' : value === 'down' ? '↓ −4.5%' : 'No change'
    });
  if (attr === 'data-submit-on')
    ops.push(
      ...companionOperations(scope, '.composer-hint', {
        text:
          value === 'enter'
            ? 'Enter to send · Shift + Enter for a new line'
            : value === 'mod-enter'
              ? '⌘ or Ctrl + Enter'
              : 'Use Send to submit'
      })
    );
  // Shared constraints can coexist. Clearing readonly must not re-enable a
  // removal action or period select while the owner remains disabled.
  if (['disabled', 'readonly'].includes(name) && ['tag-input', 'time-field'].includes(scope.type)) {
    const child = scope.type === 'tag-input' ? '.tag-input-remove' : '[data-time-part="period"]';
    ops.push({ selector: owned(scope, child), attr: 'disabled', value: null });
    for (const marker of ['[disabled]', '[data-disabled]', '[data-readonly]'])
      ops.push({
        selector: (scope.instanceSelectors?.[index] || scope.target)
          .split(',')
          .map((selector) => `${selector.trim()}${marker} ${child}`)
          .join(','),
        attr: 'disabled',
        value: ''
      });
  }
  // Off removes the owner's inherited constraint, not a native child's local
  // authored availability. Restoration uses ordinary attribute operations so
  // both consumers keep the same operation API.
  if (
    value === null &&
    (name === 'disabled' ||
      (name === 'readonly' && ['tag-input', 'time-field'].includes(scope.type)))
  )
    for (const baseline of scope.authoredDisabled?.[index] || []) {
      ops.push({ selector: baseline.selector, attr: 'disabled', value: baseline.value });
      // Controller-owned counterparts mirror their authoritative native input,
      // including generated controls absent when the baseline was compiled.
      if (baseline.mirrors)
        ops.push({
          selector: owned(scope, baseline.mirrors),
          attr: 'disabled',
          value: baseline.value
        });
    }
  return ops;
}

// Action content is a computed set of booleans, not an attribute. Both surfaces
// call this once with the resolved content state.
export function contentOperations(scope, state = {}) {
  if (!['button', 'toggle'].includes(scope.type)) return [];
  const label = state.label?.trim() || (scope.type === 'toggle' ? 'Bookmark' : 'Button');
  const showIconStart = Boolean(state.showIconStart);
  const showLabel = state.showLabel !== false || (!showIconStart && !state.showIconEnd);
  const showIconEnd = Boolean(state.showIconEnd) && (showLabel || !showIconStart);
  const loading = Boolean(state.loading);
  const html =
    (loading ? demoSpinner : '') +
    (showIconStart && (showLabel || !loading) ? demoIcon : '') +
    (showLabel ? escapeHtml(label) : '') +
    (showIconEnd && (showLabel || !loading) ? demoIconEnd : '');
  return [
    { selector: scope.target, index: scope.index || 0, html },
    {
      selector: scope.target,
      index: scope.index || 0,
      attr: 'aria-label',
      value: showLabel ? null : label
    },
    {
      selector: scope.target,
      index: scope.index || 0,
      attr: 'data-icon-only',
      value: showLabel ? null : ''
    },
    {
      selector: scope.target,
      index: scope.index || 0,
      attr: 'aria-busy',
      value: loading ? 'true' : null
    }
  ];
}

// A mutually exclusive part property (for example `aria-current` on navigation
// links) selects one instance. Every other instance drops the attribute.
export function exclusiveOperations(scope, chosen) {
  const ops = [];
  for (let index = 0; index < scope.count; index += 1)
    ops.push({
      selector: scope.target,
      index,
      attr: scope.exclusive.attr,
      value: index === chosen ? scope.exclusive.on : null
    });
  return ops;
}

export function slotOperations(slug, value) {
  if (slug === 'table')
    return [
      {
        selector: '.table',
        attr: 'class',
        value: value === 'dense' ? 'table table--dense' : 'table'
      }
    ];
  if (slug === 'tool-call' && value === 'status-only')
    return [
      { selector: '.tool-call-content', remove: true },
      { selector: '.tool-call-summary', unwrap: true },
      { selector: '.tool-call', tagName: 'div' },
      { selector: '.tool-call', attr: 'class', value: 'tool-call tool-call-static' },
      { selector: '.tool-call', attr: 'open', value: null },
      { selector: '.tool-call', attr: 'role', value: 'status' }
    ];
  if (slug === 'layout')
    return [
      {
        selector:
          '.layout-container,.layout-stack,.layout-grid,.layout-sidebar,.layout-center,.layout-split',
        attr: 'class',
        value: `layout-${value || 'stack'}`
      }
    ];
  if (slug === 'skeleton')
    return [
      {
        selector: '.skeleton',
        attr: 'class',
        value: value === 'round' ? 'skeleton skeleton-round' : 'skeleton'
      },
      {
        selector: '.skeleton',
        attr: 'style',
        value: value === 'round' ? null : 'height:var(--size-900)'
      }
    ];
  if (slug === 'avatar')
    return [
      ...(value !== 'image' ? [{ selector: '.avatar-image', remove: true }] : []),
      { selector: '.avatar-image', attr: 'data-error', value: value === 'image' ? null : '' },
      { selector: '.avatar-image', attr: 'hidden', value: value === 'image' ? null : '' },
      {
        selector: '.avatar-fallback',
        attr: 'aria-hidden',
        value: value === 'image' ? 'true' : null
      },
      { selector: '.avatar-fallback', attr: 'role', value: value === 'icon' ? 'img' : null },
      {
        selector: '.avatar-fallback',
        attr: 'aria-label',
        value: value === 'icon' ? 'Avatar' : null
      },
      { selector: '.avatar-fallback', html: value === 'icon' ? demoIcon : 'MK' }
    ];
  return [];
}
