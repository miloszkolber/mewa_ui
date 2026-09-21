// Documentation metadata. Selectors and options refer to the public component contracts.

// Properties that change behavior or data, not appearance. The preview may
// still expose them, but the Figma state matrix must not render them.
export const nonVisualProps = new Set([
  'required',
  'multiple',
  'data-loop',
  'data-submit-on',
  'data-preview',
  'data-type'
]);

export const profiles = {
  // Typography documents rendered Markdown. It has no property controls and no
  // visual states; the documentation renders one complete article.
  typography: { target: '.typography-content', wide: true, presentation: true },
  layout: {
    target:
      '.layout-container,.layout-stack,.layout-grid,.layout-sidebar,.layout-center,.layout-split',
    wide: true,
    defaults: { 'data-gap': 'md' },
    props: { 'data-gap': ['none', 'xs', 'sm', 'md', 'lg', 'xl'] }
  },
  separator: { target: '.separator', props: { 'data-orientation': ['horizontal', 'vertical'] } },
  icon: {
    target: '[data-remix-icon], [class^="ri-"], [class*=" ri-"]',
    props: { 'data-size': ['xs', '', 'md', 'lg', 'xl'] }
  },
  button: {
    target: '.btn',
    interactive: true,
    props: {
      'data-variant': ['default', 'secondary', 'ghost', 'destructive', 'link'],
      'data-icon-only': [null, '']
    }
  },
  toggle: {
    target: '.toggle',
    interactive: true,
    props: { 'aria-pressed': ['false', 'true'], 'data-variant': ['', 'outline'] }
  },
  'toggle-group': {
    target: '.toggle-group',
    interactive: true,
    focus: '.toggle',
    defaults: { 'data-type': 'single', 'data-orientation': 'horizontal' },
    props: {
      'data-type': ['single', 'multiple'],
      'data-orientation': ['horizontal', 'vertical'],
      'data-variant': ['', 'outline'],
      'data-spacing': [null, ''],
      'data-disabled': [null, '']
    }
  },
  'button-group': {
    target: '.btn-group',
    interactive: true,
    focus: '.btn',
    props: { 'data-orientation': ['horizontal', 'vertical'] }
  },
  toolbar: {
    target: '.toolbar',
    interactive: true,
    focus: 'button',
    wide: true,
    props: { 'aria-orientation': ['horizontal', 'vertical'] }
  },
  label: { target: '.label' },
  field: {
    target: '.field',
    input: true,
    focus: 'input,select,textarea',
    props: { 'data-orientation': [null, 'horizontal'] }
  },
  'text-field': {
    target: '.text-field-input',
    input: true,
    props: { readonly: [null, ''], required: [null, ''] }
  },
  textarea: {
    target: '.textarea',
    input: true,
    props: { readonly: [null, ''], required: [null, ''] }
  },
  checkbox: { target: '.checkbox', input: true, checkable: true, mixed: true },
  'radio-group': { target: '.radio-group', input: true, focus: '.radio', checkable: true },
  switch: { target: '.switch', input: true, checkable: true },
  slider: {
    target: '.slider',
    input: true,
    states: ['Default', 'Focus', 'Disabled'],
    props: { 'data-orientation': ['horizontal', 'vertical'] }
  },
  select: { target: '.select', input: true },
  'number-field': { target: '.number-field input', input: true, value: 'number' },
  'file-input': {
    target: '.file-input',
    input: true,
    hover: '.file-input',
    props: { multiple: [null, ''] }
  },
  'date-field': { target: '.date-input', input: true, value: 'date' },
  'date-picker': {
    target: '.date-picker',
    focus: '.date-picker-day button:not([disabled])',
    interactive: true,
    wide: true
  },
  'date-range-picker': { target: '.date-range-picker', input: true, focus: 'input', wide: true },
  combobox: { target: '.combobox', interactive: true, input: true, focus: '.combobox-trigger' },
  'time-field': {
    target: '.time-field',
    input: true,
    focus: 'input:not([type="hidden"]),select',
    wide: true
  },
  form: { target: '.form', input: true, focus: 'input', wide: true },
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
  collapsible: { target: '.collapsible', disclosure: true, focus: 'summary' },
  timeline: { target: '.timeline' },
  'tree-view': { target: '.tree', focus: '.tree-leaf', interactive: true },
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
  progress: { target: '.progress', value: 'range', props: { value: [null, '0', '50', '100'] } },
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
    matrixExcludedProps: ['data-side', 'data-align'],
    props: {
      'data-side': ['top', 'right', 'bottom', 'left'],
      'data-align': ['start', 'center', 'end']
    }
  },
  tooltip: {
    target: '.tooltip',
    overlay: true,
    defaults: { 'data-side': 'top', 'data-align': 'center' },
    matrixExcludedProps: ['data-align'],
    props: {
      'data-side': ['top', 'right', 'bottom', 'left'],
      'data-align': ['start', 'center', 'end']
    }
  },
  dialog: { target: '.dialog', overlay: true },
  sheet: { target: '.sheet', overlay: true, props: { 'data-side': ['right', 'left', 'bottom'] } },
  accordion: { target: '.accordion', wide: true, props: { 'data-type': [null, 'single'] } },
  'command-palette': { target: '.command-palette', overlay: true },
  breadcrumbs: { target: '.breadcrumb' },
  pagination: { target: '.pagination', interactive: true, focus: '.pagination-link', wide: true },
  tabs: {
    target: '.tab-list',
    interactive: true,
    focus: '.tab-trigger',
    wide: true,
    props: { 'data-variant': ['', 'underline'], 'aria-orientation': ['horizontal', 'vertical'] }
  },
  'dropdown-menu': { target: '.dropdown-menu-content', overlay: true, focus: '[role="menuitem"]' },
  'navigation-menu': {
    target: '.nav-menu',
    focus: '.nav-menu-link,.nav-menu-trigger,.nav-menu-content-link',
    wide: true
  },
  'app-shell': { target: '.app-header', wide: true },
  sidebar: { target: '.app-sidebar', props: { 'data-state': ['expanded', 'collapsed'] } },
  resizable: {
    target: '.resizable',
    wide: true,
    props: { 'data-orientation': ['horizontal', 'vertical'] }
  },
  'color-picker': { target: '.color-picker', input: true, focus: 'input', value: 'color' },
  'file-upload': {
    target: '.file-upload',
    input: true,
    focus: 'input',
    hover: '.file-upload-dropzone',
    wide: true
  },
  'input-otp': { target: '.input-otp', input: true, focus: 'input', wide: true },
  'tag-input': {
    target: '.tag-input',
    input: true,
    focus: 'input:not([type="hidden"])',
    hover: '.tag-input-field',
    wide: true
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
    matrixExcludedProps: ['data-side', 'data-align'],
    props: {
      'data-side': ['top', 'right', 'bottom', 'left'],
      'data-align': ['start', 'center', 'end']
    }
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
    disclosure: true,
    props: { 'data-streaming': [null, ''] }
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
    disclosure: true,
    props: { 'data-streaming': [null, ''] }
  },
  sources: { target: '.sources', wide: true },
  suggestion: { target: '.suggestion', interactive: true, focus: 'button' },
  'thinking-indicator': { target: '.thinking-indicator' },
  'todo-list': { target: '.todo-list', wide: true, disclosure: true },
  'tool-call': {
    target: '.tool-call',
    wide: true,
    disclosure: true,
    props: { 'data-status': ['pending', 'running', 'complete', 'error'] }
  }
};

export const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

export function statesFor(profile) {
  if (profile.presentation) return [];
  if (profile.states) return profile.states;
  if (profile.disclosure) return ['Closed', 'Open'];
  if (profile.input)
    return [
      'Default',
      ...(profile.hover ? ['Hover'] : []),
      'Focus',
      'Disabled',
      'Invalid',
      'Invalid focus',
      ...(profile.checkable
        ? [
            'Checked',
            'Checked focus',
            'Checked disabled',
            'Checked invalid',
            'Checked invalid focus',
            ...(profile.mixed
              ? ['Mixed', 'Mixed focus', 'Mixed disabled', 'Mixed invalid', 'Mixed invalid focus']
              : [])
          ]
        : [])
    ];
  if (profile.interactive) return ['Default', 'Hover', 'Focus', 'Disabled'];
  return ['Default'];
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
