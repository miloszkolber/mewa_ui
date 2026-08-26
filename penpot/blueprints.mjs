import { rendererDefinitions } from './renderers.mjs';

/**
 * Hand-maintained mapping from an implementation contract to a Penpot renderer.
 *
 * The renderer name is intentionally component-specific. A component can share
 * atoms with another renderer, but it must not silently fall back to a generic
 * card, form field, or placeholder structure.
 */
export const componentRenderers = {
  accordion: 'accordion',
  'alert-dialog': 'alertDialog',
  'app-shell': 'appShell',
  avatar: 'avatar',
  badge: 'badge',
  breadcrumbs: 'breadcrumbs',
  button: 'button',
  'button-group': 'buttonGroup',
  callout: 'callout',
  card: 'card',
  carousel: 'carousel',
  checkbox: 'checkbox',
  collapsible: 'collapsible',
  combobox: 'combobox',
  'command-palette': 'commandPalette',
  'data-table': 'dataTable',
  'date-field': 'dateField',
  'date-picker': 'datePicker',
  'date-range-picker': 'dateRangePicker',
  dialog: 'dialog',
  'dropdown-menu': 'dropdownMenu',
  field: 'field',
  'file-input': 'fileInput',
  form: 'form',
  icon: 'icon',
  image: 'image',
  label: 'label',
  layout: 'layout',
  'navigation-menu': 'navigationMenu',
  'number-field': 'numberField',
  pagination: 'pagination',
  popover: 'popover',
  progress: 'progress',
  'radio-group': 'radioGroup',
  resizable: 'resizable',
  'scroll-area': 'scrollArea',
  select: 'select',
  separator: 'separator',
  sheet: 'sheet',
  sidebar: 'sidebar',
  skeleton: 'skeleton',
  slider: 'slider',
  sortable: 'sortable',
  spinner: 'spinner',
  statistic: 'statistic',
  switch: 'switch',
  table: 'table',
  tabs: 'tabs',
  'text-field': 'textField',
  textarea: 'textarea',
  'time-field': 'timeField',
  timeline: 'timeline',
  toast: 'toast',
  toggle: 'toggle',
  'toggle-group': 'toggleGroup',
  toolbar: 'toolbar',
  tooltip: 'tooltip',
  'tree-view': 'treeView',
  typography: 'typography',
};

const matrixAxis = (name, values, source = 'contract') => ({ name, values, source });

const visualAxes = new Set([
  'variant', 'type', 'size', 'orientation', 'side', 'state', 'placement',
  'fit', 'ratio', 'radius', 'gap', 'align', 'active', 'over', 'trend', 'position',
]);

const runtimeAxes = /(?:^lucide$|trigger$|theme$|placeholder$|value$|value-|page|plural|singular|action$|label$|time-part)/;

const stateOrder = ['rest', 'hover', 'focus', 'open', 'selected', 'invalid', 'disabled'];

function orderedStates(states) {
  return stateOrder.filter((state) => states.includes(state));
}

function preferredAxes(contract) {
  const axes = [];
  const axisOrder = [
    'variant', 'type', 'size', 'orientation', 'side', 'state', 'placement',
    'fit', 'ratio', 'radius', 'gap', 'align', 'active', 'over', 'trend', 'position',
  ];
  for (const axis of axisOrder) {
    if (contract.axes[axis]?.length) axes.push(matrixAxis(axis, contract.axes[axis]));
  }
  const states = orderedStates(contract.states);
  if (states.length) axes.push(matrixAxis('interaction', states, 'css'));
  return axes;
}

function axisHandling(contract, matrixAxes) {
  const matrixNames = new Set(matrixAxes.map((axis) => axis.name));
  return Object.fromEntries(
    Object.keys(contract.axes).sort().map((axis) => {
      if (matrixNames.has(axis)) return [axis, 'matrix'];
      if (runtimeAxes.test(axis)) return [axis, 'runtime'];
      if (visualAxes.has(axis)) return [axis, 'anatomy'];
      return [axis, 'anatomy'];
    }),
  );
}

/**
 * Produces one inspectable blueprint per component. The definitions are data, not
 * Penpot API calls, so their anatomy and matrices can be reviewed before mutation.
 */
export function blueprintFor(contract) {
  const renderer = componentRenderers[contract.id];
  if (!renderer) throw new Error(`Missing Penpot renderer mapping for ${contract.id}.`);
  const definition = rendererDefinitions[renderer];
  if (!definition) throw new Error(`Missing Penpot renderer definition for ${contract.id}.`);
  const axes = definition.matrix.length ? definition.matrix : preferredAxes(contract);

  return {
    id: contract.id,
    title: contract.title,
    renderer,
    source: contract.source,
    sourceAnatomy: contract.anatomy,
    anatomy: definition.anatomy,
    masters: definition.masters,
    axes,
    axisHandling: axisHandling(contract, axes),
    canonicalMarkup: contract.canonicalMarkup,
    canonicalStructure: contract.canonicalStructure,
    layout: {
      page: 'component-sheet',
      sourceSection: 'component-masters',
      matrix: 'only-meaningful-axes',
      instancePolicy: 'linked-component-instance',
      tokenPolicy: 'semantic-only',
      flexGridPolicy: 'use-native-layout-where-it-represents-the-contract',
      intent: definition.intent,
      mode: definition.layout,
    },
  };
}
