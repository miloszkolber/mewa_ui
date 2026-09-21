import { demoIcon } from './component-model.mjs';

// Exact owner paths are compiled before controls are rendered. A missing label
// in one item must never shift an update onto the following item's label.
export const companionSelectors = {
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
  toolbar: ['.separator']
};

function owned(scope, child) {
  return (scope.instanceSelectors?.[scope.index || 0] || scope.target)
    .split(',')
    .map((selector) => `${selector.trim()} ${child}`)
    .join(',');
}

function companionOperations(scope, selector, operation) {
  const indices = scope.companionIndices?.[scope.index || 0]?.[selector];
  if (indices) return indices.map((index) => ({ selector, index, ...operation }));
  return [{ selector: owned(scope, selector), ...operation }];
}

// Operations are consumed by both HTMLRewriter (export) and DOM (playground).
// Keeping mutations here prevents the two surfaces from inventing different APIs.
export function propertyOperations(scope, attr, value) {
  const ops = [
    {
      selector: scope.target,
      index: scope.index || 0,
      attr,
      value: scope.type === 'badge' && attr === 'data-state' && !value ? null : value
    }
  ];
  if (attr === 'data-orientation' && scope.type === 'slider')
    ops.push({
      selector: scope.target,
      index: scope.index || 0,
      attr: 'aria-orientation',
      value: value || 'horizontal'
    });
  if (scope.type === 'nav-link' && attr === 'aria-current' && value === 'page')
    for (let i = 0; i < scope.count; i++)
      if (i !== (scope.index || 0))
        ops.push({ selector: scope.target, index: i, attr, value: null });
  if (
    attr === 'data-icon-only' &&
    scope.id !== 'root' &&
    value !== null &&
    !Object.hasOwn(scope.instances?.[scope.index || 0] || {}, 'data-icon-only')
  ) {
    ops.push({ selector: scope.target, index: scope.index || 0, html: demoIcon });
    ops.push({
      selector: scope.target,
      index: scope.index || 0,
      attr: 'aria-label',
      value: 'Action'
    });
  }
  if (attr === 'data-orientation' && scope.type === 'resizable') {
    ops.push(...companionOperations(scope, '.resizable-group', { attr, value }));
    ops.push(
      ...companionOperations(scope, '.resizable-handle', { attr: 'aria-orientation', value })
    );
  }
  if (attr === 'aria-orientation' && scope.type === 'toolbar')
    ops.push(
      ...companionOperations(scope, '.separator', {
        attr: 'data-orientation',
        value: value === 'vertical' ? 'horizontal' : 'vertical'
      })
    );
  if (attr === 'data-variant' && scope.type === 'badge')
    ops.push({
      selector: scope.target,
      index: scope.index || 0,
      text: value === 'count' ? '8' : 'Badge'
    });
  if (attr === 'data-state' && scope.type === 'badge' && value) {
    ops.push({
      selector: scope.target,
      index: scope.index || 0,
      attr: 'data-variant',
      value: null
    });
    ops.push({
      selector: scope.target,
      index: scope.index || 0,
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
      index: scope.index || 0,
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
      index: scope.index || 0,
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
      index: scope.index || 0,
      text: value === 'up' ? '↑ +20.1%' : value === 'down' ? '↓ −4.5%' : 'No change'
    });
  if (attr === 'data-disabled' && scope.type === 'toggle-group')
    ops.push(...companionOperations(scope, '.toggle', { attr: 'disabled', value }));
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
  return ops;
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

export function stateOperations(scope, state) {
  if (!scope.states || scope.states.length < 2) return [];
  const selector = scope.focus || scope.target;
  const index = scope.index || 0;
  if (scope.disclosure)
    return [{ selector: scope.target, index, attr: 'open', value: state === 'Open' ? '' : null }];
  const flags = {
    'data-demo-hover': state === 'Hover',
    'data-demo-focus': /focus/i.test(state),
    ...(scope.states.some((s) => /disabled/i.test(s))
      ? { disabled: /disabled/i.test(state), 'aria-disabled': /disabled/i.test(state) }
      : {}),
    ...(scope.states.some((s) => /invalid/i.test(s))
      ? { 'aria-invalid': /invalid/i.test(state) }
      : {}),
    ...(scope.checkable
      ? { checked: /Checked/.test(state), 'data-demo-mixed': /Mixed/.test(state) }
      : {})
  };
  const ops = Object.entries(flags).map(([attr, on]) => ({
    selector,
    index,
    attr,
    value: on ? (attr.startsWith('aria-') ? 'true' : '') : null
  }));
  if (scope.hover)
    ops.push({
      selector: scope.hover,
      index,
      attr: 'data-demo-hover',
      value: state === 'Hover' ? '' : null
    });
  if (scope.focusWithin)
    ops.push({
      selector: scope.focusWithin,
      index,
      attr: 'data-demo-focus-within',
      value: /focus/i.test(state) ? '' : null
    });
  if (scope.type === 'number-field')
    ops.push(
      ...companionOperations(scope, '.number-field button', {
        attr: 'disabled',
        value: /disabled/i.test(state) ? '' : null
      })
    );
  if (['tag-input', 'file-upload'].includes(scope.type))
    ops.push({
      selector: scope.target,
      index,
      attr: 'data-invalid',
      value: /invalid/i.test(state) ? '' : null
    });
  if (scope.type === 'tag-input') {
    ops.push({
      selector: owned(scope, '.tag-input-fallback'),
      attr: 'disabled',
      value: /disabled/i.test(state) ? '' : null
    });
    ops.push({
      selector: `${owned(scope, '.tag-input-remove')},${owned(scope, '.tag-input-control')}`,
      attr: 'disabled',
      value: /disabled/i.test(state) ? '' : null
    });
  }
  // Group availability wins over an individual visual-state selector. The
  // compiler and the browser post-enhancement pass use the same constraint.
  if (scope.type === 'toggle')
    ops.push({ selector: '.toggle-group[data-disabled] > .toggle', attr: 'disabled', value: '' });
  return ops;
}

export function slotOperations(slug, value, iconOnly = false) {
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
  if (slug === 'button')
    return [
      {
        selector: '.btn',
        index: 0,
        html: iconOnly
          ? demoIcon
          : `${value === 'loading' ? '<svg class="spinner" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7z"/></svg>' : value === 'leading-icon' ? demoIcon : ''}Button`
      },
      { selector: '.btn', index: 0, attr: 'aria-label', value: iconOnly ? 'Button' : null },
      { selector: '.btn', index: 0, attr: 'aria-busy', value: value === 'loading' ? 'true' : null }
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
