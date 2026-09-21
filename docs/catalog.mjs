// Documentation metadata. Selectors and options refer to the public component contracts.

// Boolean properties replace the former "visual state" selector. Each one is a
// real, persistent attribute the component already supports.
export const booleanProps = {
  disabled: { attr: 'disabled', on: '', default: false },
  invalid: { attr: 'aria-invalid', on: 'true', default: false },
  readonly: { attr: 'readonly', on: '', default: false },
  required: { attr: 'required', on: '', default: false },
  checked: { attr: 'checked', on: '', default: false },
  indeterminate: { attr: 'data-demo-mixed', on: '', default: false },
  loading: { attr: 'aria-busy', on: 'true', default: false },
  open: { attr: 'open', on: '', default: false },
  optional: { attr: 'data-optional', on: '', default: false },
  showLabel: { attr: null, on: '', default: true },
  showIconStart: { attr: null, on: '', default: false },
  showIconEnd: { attr: null, on: '', default: false }
};

// Properties that change behavior or data, not appearance. The preview may
// still expose them, but the Figma state matrix must not render them.
export const nonVisualProps = new Set(['multiple', 'data-loop', 'data-submit-on', 'data-preview']);

// A shared content model for actions. The booleans above stay independently
// editable in the preview; the matrix crosses these named combinations instead.
export const actionContent = {
  label: { showLabel: true, showIconStart: false, showIconEnd: false },
  'leading icon': { showLabel: true, showIconStart: true, showIconEnd: false },
  'trailing icon': { showLabel: true, showIconStart: false, showIconEnd: true },
  'icon only': { showLabel: false, showIconStart: true, showIconEnd: false }
};

export const profiles = {
  // Typography documents rendered Markdown. It has no property controls and no
  // visual states; the documentation renders one complete article.
  typography: { target: '.typography-content', wide: true, presentation: true },
  layout: {
    target:
      '.layout-container,.layout-stack,.layout-grid,.layout-sidebar,.layout-center,.layout-split',
    wide: true,
    defaults: { 'data-gap': 'md' },
    props: { 'data-gap': ['none', 'xs', 'sm', 'md', 'lg', 'xl'] },
    // Gap only separates children in these primitives.
    gapFor: ['stack', 'grid', 'sidebar'],
    matrix: [{ slot: true }, { prop: 'data-gap' }]
  },
  separator: { target: '.separator', props: { 'data-orientation': ['horizontal', 'vertical'] } },
  icon: {
    target: '[data-remix-icon], [class^="ri-"], [class*=" ri-"]',
    props: {
      'data-size': ['xs', '', 'md', 'lg', 'xl'],
      'data-icon-variant': ['line', 'fill']
    },
    matrix: [{ prop: 'data-size' }]
  },
  button: {
    target: '.btn',
    props: { 'data-variant': ['primary', 'secondary', 'ghost', 'destructive', 'link'] },
    booleans: ['disabled', 'loading', 'showLabel', 'showIconStart', 'showIconEnd'],
    content: actionContent,
    matrix: [{ prop: 'data-variant' }, { content: true }]
  },
  toggle: {
    target: '.toggle',
    props: { 'data-variant': ['', 'outline'] },
    booleans: ['checked', 'disabled', 'showLabel', 'showIconStart', 'showIconEnd'],
    // `aria-pressed` is always present on a toggle, so its boolean has no absent form.
    booleanOverrides: { checked: { attr: 'aria-pressed', on: 'true', values: ['false', 'true'] } },
    content: actionContent,
    matrix: [{ prop: 'data-variant' }, { bool: 'checked' }]
  },
  'toggle-group': {
    target: '.toggle-group',
    interactive: true,
    defaults: { 'data-type': 'single', 'data-orientation': 'horizontal' },
    props: {
      'data-type': ['single', 'multiple'],
      'data-orientation': ['horizontal', 'vertical'],
      'data-variant': ['', 'outline'],
      'data-spacing': [null, '']
    },
    booleans: ['disabled'],
    booleanOverrides: { disabled: { attr: 'data-disabled', on: '' } },
    matrix: [
      { prop: 'data-orientation' },
      { prop: 'data-variant' },
      { prop: 'data-spacing' },
      { bool: 'disabled' }
    ]
  },
  'button-group': {
    target: '.btn-group',
    interactive: true,
    props: { 'data-orientation': ['horizontal', 'vertical'] },
    booleans: ['disabled']
  },
  toolbar: {
    target: '.toolbar',
    interactive: true,
    wide: true,
    props: { 'aria-orientation': ['horizontal', 'vertical'] },
    matrix: [{ prop: 'aria-orientation' }]
  },
  label: {
    target: '.label',
    booleans: ['disabled', 'optional'],
    matrix: [{ bool: 'optional' }]
  },
  field: {
    target: '.field',
    input: true,
    props: { 'data-orientation': [null, 'horizontal'] },
    booleans: ['disabled', 'invalid', 'required'],
    textFields: [
      { name: 'label', selector: '.field > label' },
      { name: 'description', selector: '.field-description' }
    ],
    matrix: [{ prop: 'data-orientation' }, { bool: 'required' }]
  },
  'text-field': {
    target: '.text-field-input',
    input: true,
    booleans: ['disabled', 'invalid', 'readonly', 'required'],
    textFields: [
      { name: 'label', selector: '.text-field > label' },
      { name: 'description', selector: '.text-field-description' }
    ],
    matrix: [{ bool: 'required' }, { bool: 'invalid' }]
  },
  textarea: {
    target: '.textarea',
    input: true,
    booleans: ['disabled', 'invalid', 'readonly', 'required'],
    textFields: [{ name: 'label', selector: '.label' }],
    matrix: [{ bool: 'required' }, { bool: 'invalid' }]
  },
  checkbox: {
    target: '.checkbox',
    input: true,
    booleans: ['checked', 'indeterminate', 'disabled', 'invalid'],
    matrix: [
      { bool: 'checked' },
      { bool: 'indeterminate', when: { checked: [null] } },
      { bool: 'invalid' }
    ]
  },
  'radio-group': { target: '.radio-group', input: true },
  switch: {
    target: '.switch',
    input: true,
    booleans: ['checked', 'disabled', 'invalid'],
    matrix: [{ bool: 'checked' }, { bool: 'invalid' }]
  },
  slider: {
    target: '.slider',
    input: true,
    props: { 'data-orientation': ['horizontal', 'vertical'], step: ['1', '5', '10'] },
    booleans: ['disabled'],
    matrix: [{ prop: 'data-orientation' }, { bool: 'disabled' }]
  },
  select: {
    target: '.select',
    input: true,
    booleans: ['disabled', 'invalid'],
    matrix: [{ bool: 'invalid' }]
  },
  'number-field': {
    target: '.number-field input',
    input: true,
    props: { step: ['1', '5', '10'] },
    booleans: ['disabled', 'invalid', 'readonly'],
    matrix: [{ bool: 'readonly' }, { bool: 'invalid' }]
  },
  'file-input': {
    target: '.file-input',
    input: true,
    props: { multiple: [null, ''] },
    booleans: ['disabled', 'invalid']
  },
  'date-field': {
    target: '.date-input',
    input: true,
    booleans: ['disabled', 'invalid', 'readonly'],
    matrix: [{ bool: 'readonly' }, { bool: 'invalid' }]
  },
  'date-picker': {
    target: '.date-picker',
    interactive: true,
    wide: true,
    booleans: ['disabled', 'invalid']
  },
  'date-range-picker': {
    target: '.date-range-picker',
    input: true,
    wide: true,
    booleans: ['disabled', 'invalid', 'readonly']
  },
  combobox: {
    target: '.combobox',
    interactive: true,
    input: true,
    booleans: ['disabled', 'invalid', 'open']
  },
  'time-field': {
    target: '.time-field',
    input: true,
    wide: true,
    booleans: ['disabled', 'invalid', 'readonly']
  },
  form: { target: '.form', input: true, wide: true, booleans: ['invalid'] },
  badge: {
    target: '.badge',
    props: {
      'data-variant': ['default', 'secondary', 'outline', 'count'],
      'data-state': ['', 'positive', 'caution', 'negative', 'running']
    }
  },
  avatar: { target: '.avatar' },
  card: { target: '.card' },
  image: {
    target: '.image',
    defaults: { 'data-fit': 'cover' },
    props: {
      'data-ratio': [null, '1/1', '4/3', '3/2', '16/9', '21/9', '3/4'],
      'data-fit': ['cover', 'contain', 'fill', 'none'],
      'data-radius': [null, 'full'],
      'data-preview': [null, '']
    }
  },
  statistic: { target: '.statistic' },
  table: { target: '.table-container', wide: true },
  'data-table': { target: '.data-table', wide: true },
  collapsible: { target: '.collapsible', booleans: ['open'] },
  timeline: { target: '.timeline' },
  'tree-view': { target: '.tree', interactive: true },
  carousel: {
    target: '.carousel',
    wide: true,
    props: { 'data-loop': [null, ''] }
  },
  'scroll-area': { target: '.scroll-area' },
  sortable: {
    target: '.sortable',
    wide: true,
    props: { 'data-orientation': ['vertical', 'horizontal'] }
  },
  spinner: {
    target: '.spinner',
    defaults: { 'data-size': 'sm' },
    props: { 'data-size': ['xs', 'sm', 'md', 'lg', 'xl'] }
  },
  skeleton: { target: '.skeleton' },
  progress: { target: '.progress', props: { value: [null, '0', '50', '100'] } },
  callout: { target: '.callout', props: { 'data-variant': ['default', 'destructive'] } },
  'alert-dialog': { target: '.alert-dialog', overlay: true },
  toast: {
    target: '.toast',
    props: { 'data-variant': ['', 'success', 'warning', 'destructive', 'info'] }
  },
  popover: {
    target: '.popover',
    overlay: true,
    defaults: { 'data-side': 'bottom', 'data-align': 'center' },
    props: {
      'data-side': ['top', 'right', 'bottom', 'left'],
      'data-align': ['start', 'center', 'end']
    },
    matrix: [{ prop: 'data-side' }]
  },
  tooltip: {
    target: '.tooltip',
    overlay: true,
    defaults: { 'data-side': 'top', 'data-align': 'center' },
    props: {
      'data-side': ['top', 'right', 'bottom', 'left'],
      'data-align': ['start', 'center', 'end']
    },
    matrix: [{ prop: 'data-side' }]
  },
  dialog: { target: '.dialog', overlay: true },
  sheet: { target: '.sheet', overlay: true, props: { 'data-side': ['right', 'left', 'bottom'] } },
  accordion: { target: '.accordion', wide: true, props: { 'data-type': [null, 'single'] } },
  'command-palette': { target: '.command-palette', overlay: true },
  breadcrumbs: { target: '.breadcrumb' },
  pagination: { target: '.pagination', interactive: true, wide: true },
  tabs: {
    target: '.tab-list',
    interactive: true,
    wide: true,
    props: { 'data-variant': ['', 'underline'], 'aria-orientation': ['horizontal', 'vertical'] }
  },
  'dropdown-menu': { target: '.dropdown-menu-content', overlay: true },
  'navigation-menu': { target: '.nav-menu', wide: true },
  'app-shell': { target: '.app-header', wide: true },
  sidebar: { target: '.app-sidebar', props: { 'data-state': ['expanded', 'collapsed'] } },
  resizable: {
    target: '.resizable',
    wide: true,
    props: { 'data-orientation': ['horizontal', 'vertical'] }
  },
  'color-picker': { target: '.color-picker', input: true, booleans: ['disabled', 'invalid'] },
  'file-upload': {
    target: '.file-upload',
    input: true,
    wide: true,
    booleans: ['disabled', 'invalid']
  },
  'input-otp': { target: '.input-otp', input: true, wide: true, booleans: ['disabled', 'invalid'] },
  'tag-input': {
    target: '.tag-input',
    input: true,
    wide: true,
    booleans: ['disabled', 'invalid', 'readonly']
  },
  header: { target: '.header', wide: true, props: { 'data-sticky': [null, ''] } },
  nav: {
    target: '.nav',
    wide: true,
    props: {
      'data-orientation': ['horizontal', 'vertical']
    }
  },
  footer: { target: '.footer', wide: true },
  'context-menu': { target: '.context-menu-content', overlay: true },
  'hover-card': {
    target: '.hover-card',
    overlay: true,
    defaults: { 'data-side': 'bottom', 'data-align': 'center' },
    props: {
      'data-side': ['top', 'right', 'bottom', 'left'],
      'data-align': ['start', 'center', 'end']
    },
    matrix: [{ prop: 'data-side' }]
  },
  'agent-activity': { target: '.agent-activity', wide: true },
  'code-block': { target: '.code-block', wide: true, props: { 'data-streaming': [null, ''] } },
  composer: {
    target: '.composer',
    wide: true,
    props: { 'data-submit-on': [null, 'mod-enter', 'enter'], 'data-state': [null, 'thinking'] }
  },
  'file-diff': {
    target: '.file-diff',
    wide: true,
    props: { 'data-streaming': [null, ''] },
    booleans: ['open']
  },
  message: {
    target: '.message',
    wide: true,
    props: {
      'data-author': ['user', 'assistant', 'system'],
      'data-grouped': [null, '']
    }
  },
  'message-scroller': { target: '.message-scroller', wide: true },
  reasoning: {
    target: '.reasoning',
    wide: true,
    props: { 'data-streaming': [null, ''] },
    booleans: ['open']
  },
  sources: { target: '.sources', wide: true },
  suggestion: { target: '.suggestion', interactive: true },
  'thinking-indicator': { target: '.thinking-indicator' },
  'todo-list': { target: '.todo-list', wide: true, booleans: ['open'] },
  'tool-call': {
    target: '.tool-call',
    wide: true,
    booleans: ['open'],
    props: { 'data-status': ['pending', 'running', 'complete', 'error'] }
  }
};

export const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

// A flat property list replaces the former state dropdown. Enum properties come
// from `props`; boolean properties come from `booleans`. The order is stable so
// the control panel and the matrix agree.
export function propertiesFor(profile) {
  const props = Object.entries(profile.props || {}).map(([attr, values]) => ({
    name: attr === 'step' ? 'step' : attr,
    attr,
    kind: 'enum',
    values,
    default: values[0]
  }));
  const booleans = (profile.booleans || []).map((name) => {
    const base = booleanProps[name];
    if (!base) throw new Error(`Unknown boolean property: ${name}`);
    const merged = { ...base, ...profile.booleanOverrides?.[name] };
    return { ...merged, name, kind: 'boolean', values: merged.values ?? [null, merged.on] };
  });
  return [...props, ...booleans];
}

// Text content is not an attribute. Expose only an explicitly identified text
// node, never the first incidental launcher or paragraph in an example.
export const textTargets = {
  button: '.btn',
  toggle: '.toggle',
  label: '.label',
  badge: '.badge',
  'radio-group': 'legend',
  card: '.card-title',
  toast: '.toast-title',
  dialog: '.dialog-title',
  'alert-dialog': '.alert-dialog-title',
  sheet: '.sheet-title',
  popover: '.popover-title',
  tooltip: '.tooltip',
  callout: '.callout-title',
  collapsible: 'summary',
  accordion: '.accordion-trigger'
};

export const valueComponents = new Set([
  'field',
  'text-field',
  'textarea',
  'slider',
  'select',
  'number-field',
  'date-field',
  'date-range-picker',
  'time-field',
  'form',
  'color-picker',
  'input-otp',
  'tag-input',
  'composer'
]);

// These reference hooks must follow IDs when examples are mounted more than once.
export const idReferences = [
  'id',
  'for',
  'form',
  'list',
  'headers',
  'aria-labelledby',
  'aria-describedby',
  'aria-errormessage',
  'aria-controls',
  'data-controls',
  'aria-activedescendant',
  'popovertarget',
  'data-dialog-trigger',
  'data-alert-dialog-trigger',
  'data-sheet-trigger',
  'data-command-trigger',
  'data-command-palette-trigger',
  'data-tooltip-trigger',
  'data-hover-card-trigger',
  'data-context-menu-trigger',
  'data-sidebar-trigger',
  'data-sidebar-mobile'
];
