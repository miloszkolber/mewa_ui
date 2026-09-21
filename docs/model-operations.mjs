import { demoIcon } from './component-model.mjs';

// Operations are consumed by both HTMLRewriter (export) and DOM (playground).
// Keeping mutations here prevents the two surfaces from inventing different APIs.
export function propertyOperations(scope, attr, value) {
  const ops = [{ selector: scope.target, index: scope.index || 0, attr, value }];
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
    ops.push({ selector: '.resizable-group', attr, value });
    ops.push({ selector: '.resizable-handle', attr: 'aria-orientation', value });
  }
  if (attr === 'aria-orientation' && scope.type === 'toolbar')
    ops.push({
      selector: '.separator',
      attr: 'data-orientation',
      value: value === 'vertical' ? 'horizontal' : 'vertical'
    });
  if (attr === 'data-variant' && scope.type === 'badge')
    ops.push({
      selector: scope.target,
      index: scope.index || 0,
      text: value === 'count' ? '8' : 'Badge'
    });
  if (attr === 'data-author')
    ops.push({ selector: '.message-name', text: value[0].toUpperCase() + value.slice(1) });
  if (attr === 'data-status') {
    ops.push({ selector: '.tool-call-state', text: value });
    ops.push({
      selector: '.tool-call-mark',
      text: { pending: '·', running: '›', complete: '✓', error: '!' }[value]
    });
  }
  if (attr === 'data-submit-on')
    ops.push({
      selector: '.composer-hint',
      text:
        value === 'enter'
          ? 'Enter to send · Shift + Enter for a new line'
          : value === 'mod-enter'
            ? '⌘ or Ctrl + Enter'
            : 'Use Send to submit'
    });
  return ops;
}

export function stateOperations(scope, state) {
  if (scope.states.length < 2) return [];
  const selector = scope.focus || scope.target;
  const index = scope.index || 0;
  if (scope.disclosure)
    return [{ selector: scope.target, index, attr: 'open', value: state === 'Open' ? '' : null }];
  const flags = {
    'data-demo-hover': state === 'Hover',
    'data-demo-focus': /focus/i.test(state),
    disabled: /disabled/i.test(state),
    'aria-disabled': /disabled/i.test(state),
    'aria-invalid': /invalid/i.test(state),
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
    ops.push({
      selector: '.number-field button',
      attr: 'disabled',
      value: /disabled/i.test(state) ? '' : null
    });
  if (['tag-input', 'file-upload'].includes(scope.type))
    ops.push({
      selector: scope.target,
      index,
      attr: 'data-invalid',
      value: /invalid/i.test(state) ? '' : null
    });
  if (scope.type === 'tag-input') {
    ops.push({
      selector: '.tag-input-fallback',
      attr: 'disabled',
      value: /disabled/i.test(state) ? '' : null
    });
    ops.push({
      selector: '.tag-input-remove,.tag-input-control',
      attr: 'disabled',
      value: /disabled/i.test(state) ? '' : null
    });
  }
  return ops;
}

export function slotOperations(slug, value, iconOnly = false) {
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
      { selector: '.avatar-fallback', html: value === 'icon' ? demoIcon : 'MK' }
    ];
  return [];
}
