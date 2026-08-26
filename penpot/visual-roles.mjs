const styles = {};

function assign(style, names) {
  for (const name of names) {
    if (styles[name]) throw new Error(`Duplicate visual role: ${name}`);
    styles[name] = { ...style };
  }
}

const text = { fill: 'text.primary', typography: 'body.base.default' };
const muted = { fill: 'text.muted', typography: 'body.small.default' };
const label = { fill: 'text.primary', typography: 'body.small.strong' };
const section = { fill: 'surface.primary', stroke: 'border.primary', radius: 'border.radius.000', padding: 'space.400' };
const quiet = { fill: 'surface.secondary', stroke: 'border.primary', radius: 'border.radius.000', padding: 'space.300' };
const control = { fill: 'surface.primary', stroke: 'border.primary', radius: 'border.radius.000', height: 'size.1000', padding: 'space.300' };
const strongControl = { fill: 'surface.inverted', text: 'text.inverted', stroke: 'surface.inverted', radius: 'border.radius.000', height: 'size.1000', padding: 'space.300' };
const overlay = { fill: 'surface.primary', stroke: 'border.primary', radius: 'border.radius.000', padding: 'space.600' };

assign(text, [
  'action-group', 'action-row', 'body-copy', 'callout-copy', 'caption', 'continuous-canvas',
  'event-copy', 'figcaption', 'inline-label', 'list', 'loading-label', 'ordered-list',
  'position-label', 'progress-value', 'resize-value-label', 'supporting-copy', 'time-label',
  'tooltip-copy',
]);
assign(muted, ['ellipsis', 'empty-state', 'output-value', 'range-separator', 'separator-glyph', 'time-separator']);
assign(label, [
  'button-label', 'current-page', 'label', 'primary-value', 'strong-label',
  'tabular-count', 'technical-label',
]);
assign(section, [
  'bordered-section', 'data-section', 'details', 'details-node', 'fieldset', 'figure',
  'layout-container', 'mobile-sheet', 'resizable-region', 'scroll-viewport', 'sheet-content',
  'sidebar-surface', 'tab-panel', 'top-layer-surface',
]);
assign(quiet, [
  'calendar-grid', 'command-group', 'data-table', 'form-stack', 'menu-item', 'option-list',
  'scroll-track', 'sortable-list', 'table-footer', 'table-header', 'toast-surface',
  'tooltip-surface',
]);
assign(control, [
  'button', 'compact-action', 'file-control', 'icon-button', 'inline-action', 'native-control',
  'native-select', 'number-input', 'page-link', 'search-input', 'tab', 'text-control',
  'textarea', 'toggle-button',
]);
assign(strongControl, ['selected-tab']);
assign(overlay, ['dialog', 'edge-surface']);

assign({ fill: 'overlay.strong' }, ['overlay-strong']);
assign({ fill: 'surface.inverted', text: 'text.inverted', radius: 'border.radius.000' }, ['brand', 'brand-mark']);
assign({ fill: 'surface.secondary', stroke: 'border.primary' }, ['details-stack', 'table-row', 'tree-list']);
assign({ fill: 'surface.secondary', stroke: 'border.primary', height: 'size.1000' }, ['summary-row', 'tree-row', 'option-row', 'sortable-item', 'status-row']);
assign({ fill: 'surface.primary', stroke: 'border.primary', height: 'size.1000' }, ['checkbox-option', 'radio-option', 'field']);
assign({ fill: 'surface.primary', stroke: 'border.primary', radius: 'border.radius.6400' }, ['circular-image', 'initials', 'native-radio', 'switch-thumb']);
assign({ fill: 'surface.secondary', radius: 'border.radius.6400' }, ['skeleton-circle', 'timeline-marker']);
assign({ fill: 'surface.secondary', radius: 'border.radius.000' }, ['skeleton-block', 'skeleton-line']);
assign({ fill: 'surface.primary', stroke: 'border.primary', height: 'size.1000' }, ['native-checkbox', 'native-switch', 'native-range', 'native-progress', 'date-input', 'time-part']);
assign({ fill: 'surface.primary', stroke: 'border.focus', strokeWidth: 'border.width.050' }, ['focus-ring']);
assign({ fill: 'border.primary' }, ['separator', 'timeline-connector', 'drop-indicator', 'weekday-labels']);
assign({ fill: 'text.muted' }, ['disclosure-icon', 'drag-handle', 'file-icon', 'icon', 'trend-icon', 'status-icon']);
assign({ fill: 'surface.hover', stroke: 'border.hover', height: 'size.1000' }, ['nav-link', 'nav-disclosure', 'breadcrumb-item', 'toolbar-group']);
assign({ fill: 'surface.selected', stroke: 'border.selected', height: 'size.1000' }, ['current-nav-link']);
assign({ fill: 'surface.positive', stroke: 'border.positive', text: 'text.positive' }, ['trend-row']);
assign({ fill: 'surface.negative', stroke: 'border.negative', text: 'text.negative' }, ['destructive-menu-item', 'validation-message']);
assign({ fill: 'surface.secondary', stroke: 'border.primary' }, ['calendar-day', 'calendar-header', 'clipped-viewport', 'horizontal-track', 'slide', 'timeline-event']);
assign({ fill: 'surface.selected', stroke: 'border.selected' }, ['calendar-day-selected']);
assign({ fill: 'surface.primary', stroke: 'border.primary' }, ['responsive-image', 'image-fallback', 'reference-control']);
assign({ fill: 'surface.secondary', stroke: 'border.primary' }, ['layout-aside', 'layout-main', 'layout-region']);
assign({ fill: 'surface.primary', stroke: 'border.primary' }, ['navigation-landmark', 'navigation-list', 'pagination', 'route-nav', 'submenu']);
assign({ fill: 'surface.primary', stroke: 'border.primary' }, ['toolbar']);
assign({ fill: 'surface.secondary' }, ['scroll-thumb', 'spinner', 'switch-track']);
assign({ fill: 'surface.primary', stroke: 'border.primary' }, ['toast-region']);
assign({ fill: 'text.primary', typography: 'body.base.strong' }, ['heading']);
assign({ fill: 'text.primary', typography: 'body.base.default' }, ['blockquote', 'inline-code', 'keyboard-key']);
assign({ fill: 'text.primary', typography: 'body.small.default' }, ['required-marker', 'sr-only-label']);
assign({ fill: 'surface.primary', stroke: 'border.primary' }, ['filter-toolbar']);
assign({ fill: 'surface.secondary', stroke: 'border.primary' }, ['command-row']);
assign({ fill: 'surface.primary', stroke: 'border.primary', padding: 'space.200' }, ['skip-link', 'sticky-chrome', 'connected-control-group', 'tab-list']);
assign({ fill: 'text.muted' }, ['loading-indicator', 'separator-label', 'tooltip-arrow']);
assign({ fill: 'surface.secondary', stroke: 'border.primary' }, ['sortable-header', 'resize-handle', 'overflow-content', 'option-group']);

export const visualRoles = Object.freeze(styles);
