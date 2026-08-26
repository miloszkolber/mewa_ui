const list = (value) => value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];

const anatomy = (value) => list(value).map((item) => {
  const [name, role, repeat] = item.split(':');
  return { name, role, ...(repeat ? { repeat: Number(repeat) } : {}) };
});

const axis = (name, values, source = 'blueprint') => ({
  name,
  values: [...new Set(values.map((value) => String(value).trim()).filter(Boolean))],
  source,
});

// Existing definitions use compact strings for simple axes. Structured entries
// preserve values that contain the compact separator, such as image aspect ratios.
const axes = (value) => Array.isArray(value)
  ? value.map(({ name, values, source = 'blueprint' }) => axis(name, values, source))
  : list(value).map((item) => {
    const [name, rawValues] = item.split('=');
    return axis(name, rawValues.split('/'));
  });

const define = (intent, sourceAnatomy, sourceAxes) => ({
  intent,
  anatomy: anatomy(sourceAnatomy),
  axes: axes(sourceAxes),
});

/**
 * Visual contracts, not a generic component template. Every key has distinct
 * anatomy and variant axes derived from the implementation contract.
 */
export const rendererDefinitions = {
  accordion: define(
    'Native details disclosures with connected rows; an open item owns its content.',
    'items:details-stack:3,trigger:summary-row,chevron:disclosure-icon,content:supporting-copy',
    'mode=multi-open/exclusive/required-one-open,interaction=closed/open/hover',
  ),
  alertDialog: define(
    'Destructive confirmation top-layer surface with a clear cancel and final action.',
    'backdrop:overlay-strong,dialog:top-layer-surface,heading:heading,description:supporting-copy,actions:action-row',
    'variant=destructive/outline,state=closed/open',
  ),
  appShell: define(
    'Application chrome, not a route template: header, route navigation, content width, and dense status rows.',
    'skip-link:skip-link,header:sticky-chrome,brand:brand,navigation:route-nav,header-actions:action-group,content:continuous-canvas,status-row:status-row',
    'region=header/toolbar/status-list,status=positive/caution/negative/running,interaction=rest/hover/focus',
  ),
  avatar: define(
    'Image or initials inside a circular identity mark.',
    'visual:circular-image,fallback:initials',
    'size=sm/default/lg,content=image/initials',
  ),
  badge: define(
    'Compact inline status or count label; never a button substitute.',
    'label:inline-label,count:tabular-count',
    'variant=default/secondary/outline/count,state=positive/caution/negative/running',
  ),
  breadcrumbs: define(
    'Ordered route trail with links before one current item.',
    'nav:navigation-landmark,list:ordered-list,item:breadcrumb-item:3,separator:separator-glyph,current:current-page',
    'interaction=rest/hover/focus,depth=two/three/truncated',
  ),
  button: define(
    'Native action or anchor with explicit hierarchy and focus treatment.',
    'label:button-label,leading-icon:icon,trailing-icon:icon,spinner:loading-indicator',
    'variant=default/secondary/outline/ghost/destructive/link,size=sm/default/icon-sm/icon,interaction=rest/hover/focus/disabled/loading',
  ),
  buttonGroup: define(
    'Connected actions that preserve one outer boundary and compact seams.',
    'group:connected-control-group,button:button:3,seam:separator',
    'variant=default/outline,orientation=horizontal/vertical,interaction=rest/hover/focus/disabled',
  ),
  callout: define(
    'Bounded status message with visible label, copy, and optional action.',
    'icon:status-icon,copy:callout-copy,title:strong-label,description:supporting-copy,action:compact-action',
    'variant=outline/destructive,size=sm/default',
  ),
  card: define(
    'One bordered content surface with heading, supporting copy, and optional action.',
    'surface:bordered-section,heading:heading,description:supporting-copy,footer:action-row',
    'variant=default/outline,interaction=rest/hover/focus',
  ),
  carousel: define(
    'Scrollable slide track with labelled previous and next controls.',
    'viewport:clipped-viewport,track:horizontal-track,slide:slide:3,previous:icon-button,next:icon-button,pagination:position-label',
    'position=start/middle/end,interaction=rest/hover/focus',
  ),
  checkbox: define(
    'Native checkbox group with labels, descriptions, and group validation.',
    'fieldset:fieldset,legend:label,option:checkbox-option:2,control:native-checkbox,label:label,description:supporting-copy,message:validation-message',
    'state=unchecked/checked/focus/invalid/disabled',
  ),
  collapsible: define(
    'One native disclosure with summary, chevron, and optional open content.',
    'details:details,summary:summary-row,chevron:disclosure-icon,content:supporting-copy',
    'state=closed/open/hover/focus',
  ),
  combobox: define(
    'Searchable selection control with input, results, and selected option treatment.',
    'label:label,input:text-control,clear:icon-button,listbox:option-list,option:option-row:4,message:validation-message',
    'variant=outline,state=empty/results/selected/hover/focus/disabled',
  ),
  commandPalette: define(
    'Modal command surface with query input, grouped results, shortcuts, and empty state.',
    'backdrop:overlay-strong,dialog:top-layer-surface,search:search-input,group:command-group,command:command-row:5,shortcut:keyboard-key,empty:empty-state',
    'state=closed/open/results/empty/hover/focus/disabled',
  ),
  dataTable: define(
    'Data-table composition with caption, filtering, sortable headers, rows, and pagination.',
    'section:data-section,toolbar:filter-toolbar,table:data-table,header:sortable-header:4,row:table-row:3,pagination:pagination,empty:empty-state',
    'state=default/sorted/filtered/empty/hover/focus/invalid/disabled',
  ),
  dateField: define(
    'Single date text input with native label and validation state.',
    'label:label,input:text-control,message:validation-message',
    'state=empty/filled/hover/focus/invalid/disabled',
  ),
  datePicker: define(
    'Calendar grid with month controls, selected day, and keyboard focus.',
    'header:calendar-header,previous:icon-button,next:icon-button,weekday-row:weekday-labels,grid:calendar-grid,day:calendar-day:35',
    'state=default/selected/range-start/range-end/focus/hover',
  ),
  dateRangePicker: define(
    'Two date fields with grouped range semantics and one validation message.',
    'fieldset:fieldset,legend:label,start:date-input,separator:range-separator,end:date-input,message:validation-message',
    'state=empty/range-selected/focus/invalid/disabled',
  ),
  dialog: define(
    'Modal dialog with heading, form content, and resolved action hierarchy.',
    'backdrop:overlay-strong,dialog:top-layer-surface,heading:heading,description:supporting-copy,form:form-stack,actions:action-row',
    'variant=default/outline,state=closed/open',
  ),
  dropdownMenu: define(
    'Trigger plus compact menu surface with ordinary and destructive actions.',
    'trigger:button,menu:top-layer-surface,item:menu-item:4,separator:separator,destructive-item:destructive-menu-item',
    'variant=outline/destructive,state=closed/open/hover',
  ),
  field: define(
    'Field wrapper that composes label, native control, description, and validation.',
    'fieldset:fieldset,legend:label,control:native-control,description:supporting-copy,message:validation-message',
    'orientation=vertical/horizontal,state=default/focus/invalid/disabled',
  ),
  fileInput: define(
    'Native file chooser with selected-file and invalid treatments.',
    'label:label,input:file-control,selected-file:supporting-copy,message:validation-message',
    'state=empty/selected/hover/focus/invalid/disabled',
  ),
  form: define(
    'Native form composition with related controls, group legend, and one action hierarchy.',
    'form:form-stack,fieldset:fieldset,legend:label,field:field:2,actions:action-row',
    'orientation=vertical/horizontal,variant=default/outline',
  ),
  icon: define(
    'Lucide glyph on its own or inside a labelled icon action.',
    'glyph:icon,button:icon-button,accessible-name:sr-only-label',
    'variant=default/outline,size=icon/default/lg/xl',
  ),
  image: define(
    'Responsive figure with ratio, fit, radius, caption, and fallback.',
    'figure:figure,image:responsive-image,fallback:image-fallback,caption:figcaption',
    [
      axis('ratio', ['1/1', '4/3', '3/2', '16/9', '21/9', '3/4']),
      axis('fit', ['cover', 'contain', 'fill', 'none']),
      axis('radius', ['square', 'full']),
      axis('state', ['default', 'hover', 'focus', 'open', 'fallback']),
    ],
  ),
  label: define(
    'Visible text label associated with one native control.',
    'label:label,required-marker:required-marker,control:reference-control',
    'state=default/required/disabled',
  ),
  layout: define(
    'Local flex and grid composition primitives, not a page template.',
    'container:layout-container,region:layout-region:3,aside:layout-aside,main:layout-main',
    'pattern=stack/cluster/grid/split,gap=none/xs/sm/md/lg/xl',
  ),
  navigationMenu: define(
    'Primary navigation with current route, disclosure item, and focus treatment.',
    'nav:navigation-landmark,list:navigation-list,link:nav-link:3,current:current-nav-link,disclosure:nav-disclosure,submenu:submenu',
    'state=default/current/hover/focus/expanded',
  ),
  numberField: define(
    'Numeric input with increment/decrement actions and validation.',
    'label:label,input:number-input,decrement:icon-button,increment:icon-button,message:validation-message',
    'state=default/filled/hover/focus/invalid/disabled',
  ),
  pagination: define(
    'Page navigation with previous, next, current page, and truncation.',
    'nav:navigation-landmark,previous:icon-button,page:page-link:5,ellipsis:ellipsis,next:icon-button',
    'state=first/middle/last/hover/focus/disabled',
  ),
  popover: define(
    'Non-modal anchored surface with a trigger and supporting content.',
    'trigger:button,surface:top-layer-surface,heading:heading,content:supporting-copy',
    'side=top/right/bottom/left,align=start/center/end,variant=outline',
  ),
  progress: define(
    'Native progress bar with visible label and determinate value.',
    'label:label,progress:native-progress,value:progress-value',
    'value=25/50/100',
  ),
  radioGroup: define(
    'Native radio group with one selected option and group-level validation.',
    'fieldset:fieldset,legend:label,option:radio-option:3,control:native-radio,label:label,message:validation-message',
    'state=unchecked/checked/hover/focus/invalid/disabled',
  ),
  resizable: define(
    'Two content regions separated by a keyboard-operable resize handle.',
    'region-a:resizable-region,handle:resize-handle,region-b:resizable-region,value:resize-value-label',
    'orientation=horizontal/vertical,state=default/hover/focus/disabled',
  ),
  scrollArea: define(
    'Overflow region with visible viewport and compact custom track treatment.',
    'viewport:scroll-viewport,content:overflow-content,track:scroll-track,thumb:scroll-thumb',
    'axis=vertical/horizontal/both,state=rest/hover',
  ),
  select: define(
    'Native select with label, option groups, and validation message.',
    'label:label,select:native-select,option-group:option-group,message:validation-message',
    'state=default/selected/focus/invalid/disabled',
  ),
  separator: define(
    'Low-emphasis separator for connected content regions.',
    'rule:separator,label:separator-label',
    'orientation=horizontal/vertical,content=plain/labelled',
  ),
  sheet: define(
    'Modal edge surface with close control, heading, description, and actions.',
    'backdrop:overlay-strong,sheet:edge-surface,close:icon-button,heading:heading,description:supporting-copy,content:sheet-content',
    'side=right/left/bottom,state=closed/open/hover,variant=default/outline',
  ),
  sidebar: define(
    'Collapsible route navigation shell with persistent and mobile modes.',
    'sidebar:sidebar-surface,trigger:icon-button,brand:brand,navigation:route-nav,link:nav-link:4,mobile-dialog:mobile-sheet',
    'state=expanded/collapsed/mobile-open/open,side=left/right,interaction=rest/hover/focus',
  ),
  skeleton: define(
    'Neutral placeholder blocks that preserve intended content geometry.',
    'block:skeleton-block,line:skeleton-line:3,circle:skeleton-circle',
    'shape=line/avatar/panel',
  ),
  slider: define(
    'Native range control with visible value and orientation-specific rail.',
    'label:label,input:native-range,output:output-value',
    'orientation=horizontal/vertical,state=default/focus/disabled',
  ),
  sortable: define(
    'Reorderable list with visible handle, selected item, and drop indicator.',
    'list:sortable-list,item:sortable-item:3,handle:drag-handle,drop-indicator:drop-indicator',
    'orientation=vertical/horizontal,over=before/after,state=default/hover/focus/disabled',
  ),
  spinner: define(
    'Only continuous-motion primitive; show it inside a named loading context.',
    'glyph:spinner,label:loading-label',
    'size=sm/md/lg/xl',
  ),
  statistic: define(
    'Compact metric with technical label, primary value, and directional trend.',
    'label:technical-label,value:primary-value,trend:trend-row,trend-icon:trend-icon',
    'trend=up/down,status=neutral/positive/negative',
  ),
  switch: define(
    'Native checkbox switch with clear on/off state and validation treatment.',
    'control:native-switch,track:switch-track,thumb:switch-thumb,label:label,message:validation-message',
    'state=off/on/focus/invalid/disabled',
  ),
  table: define(
    'Semantic data table with caption, row hierarchy, and keyboard focus affordance.',
    'table:data-table,caption:caption,header-row:table-header,row:table-row:3,footer:table-footer',
    'density=standard/dense,content=body/footer,state=default/focus',
  ),
  tabs: define(
    'Tab list with one selected tab and a matching panel.',
    'tablist:tab-list,tab:tab:3,selected-tab:selected-tab,panel:tab-panel',
    'variant=default/line,state=rest/hover/focus/selected',
  ),
  textField: define(
    'Text input with label, description, action, and validation state.',
    'label:label,input:text-control,action:inline-action,description:supporting-copy,message:validation-message',
    'orientation=vertical/horizontal,variant=default,state=empty/filled/focus/invalid/disabled',
  ),
  textarea: define(
    'Multi-line native text input with supporting text and validation.',
    'label:label,textarea:textarea,description:supporting-copy,message:validation-message',
    'state=empty/filled/focus/invalid/disabled',
  ),
  timeField: define(
    'Grouped time parts with native select/input controls and one shared message.',
    'fieldset:fieldset,legend:label,hour:time-part,minute:time-part,period:time-part,separator:time-separator,message:validation-message',
    'state=empty/filled/focus/invalid/disabled',
  ),
  timeline: define(
    'Ordered events with temporal marker, content, and active step treatment.',
    'list:ordered-list,event:timeline-event:3,marker:timeline-marker,connector:timeline-connector,time:time-label,content:event-copy',
    'variant=default/active,state=complete/active/upcoming',
  ),
  toast: define(
    'Transient status announcement with title, description, and optional dismissal.',
    'region:toast-region,toast:toast-surface,title:strong-label,description:supporting-copy,dismiss:icon-button',
    'variant=info/success/warning/destructive,position=top-left/top-center/top-right/bottom-left/bottom-center/bottom-right,interaction=rest/hover',
  ),
  toggle: define(
    'Pressable binary action with pressed and unpressed visual states.',
    'button:toggle-button,icon:icon,label:button-label',
    'variant=outline,state=off/on/hover/focus/disabled',
  ),
  toggleGroup: define(
    'Connected single or multiple pressed controls with orientation variants.',
    'group:connected-control-group,toggle:toggle-button:3,icon:icon',
    'type=single/multiple,orientation=horizontal/vertical,variant=outline,state=off/on/hover/focus/disabled',
  ),
  toolbar: define(
    'Compact action strip for local text or content operations.',
    'toolbar:toolbar,group:toolbar-group,button:icon-button:3,separator:separator',
    'orientation=horizontal/vertical,variant=ghost',
  ),
  tooltip: define(
    'Short non-interactive explanation anchored to a labelled icon action.',
    'trigger:icon-button,surface:tooltip-surface,copy:tooltip-copy,arrow:tooltip-arrow',
    'side=top/right/bottom/left,align=start/center/end',
  ),
  treeView: define(
    'Hierarchical native disclosures with folders, files, and an active row.',
    'tree:tree-list,folder:details-node:2,summary:tree-row,file:tree-row,chevron:disclosure-icon,icon:file-icon',
    'state=collapsed/expanded/open/active/hover/focus',
  ),
  typography: define(
    'Penpot-only composed text styles across heading, body, code, quote, and keyboard text.',
    'heading:heading:3,body:body-copy,list:list,quote:blockquote,code:inline-code,kbd:keyboard-key',
    'style=heading/body/code/quote/keyboard',
  ),
};

export const rendererInventory = new Set(Object.keys(rendererDefinitions));

const shared = (key, title, sourceAnatomy) => ({
  key,
  title,
  anatomy: anatomy(sourceAnatomy),
  parts: anatomy(sourceAnatomy).map((part) => part.name),
});

export const sharedComponents = [
  shared('shared.action.button', 'Button atom', 'label:button-label,leading-icon:icon,trailing-icon:icon,loading:loading-indicator'),
  shared('shared.action.icon-button', 'Icon button atom', 'glyph:icon,accessible-name:sr-only-label'),
  shared('shared.atom.icon', 'Icon atom', 'glyph:icon'),
  shared('shared.form.label', 'Label atom', 'label:label,required-marker:required-marker'),
  shared('shared.form.field', 'Field atom', 'label:label,control:text-control,description:supporting-copy,message:validation-message'),
  shared('shared.disclosure.trigger', 'Disclosure atom', 'trigger:summary-row,indicator:disclosure-icon,content:supporting-copy'),
  shared('shared.overlay.backdrop', 'Overlay backdrop atom', 'backdrop:overlay-strong'),
  shared('shared.overlay.surface', 'Overlay surface atom', 'surface:top-layer-surface,heading:heading,description:supporting-copy,actions:action-row'),
  shared('shared.navigation.item', 'Navigation item atom', 'items:nav-link,current-item:current-nav-link,focus-ring:focus-ring'),
];

// References are intentionally explicit. They tell an eventual Penpot writer to
// place an instance of a shared component rather than recreate a familiar atom.
export const sharedComponentReferences = {
  accordion: [{ part: 'trigger', key: 'shared.disclosure.trigger' }],
  'alert-dialog': [
    { part: 'backdrop', key: 'shared.overlay.backdrop' },
    { part: 'dialog', key: 'shared.overlay.surface' },
    { part: 'actions', key: 'shared.action.button' },
  ],
  'app-shell': [{ part: 'navigation', key: 'shared.navigation.item' }],
  breadcrumbs: [{ part: 'item', key: 'shared.navigation.item' }],
  button: [
    { part: 'leading-icon', key: 'shared.atom.icon' },
    { part: 'trailing-icon', key: 'shared.atom.icon' },
  ],
  'button-group': [{ part: 'button', key: 'shared.action.button' }],
  carousel: [
    { part: 'previous', key: 'shared.action.icon-button' },
    { part: 'next', key: 'shared.action.icon-button' },
  ],
  collapsible: [{ part: 'summary', key: 'shared.disclosure.trigger' }],
  combobox: [
    { part: 'label', key: 'shared.form.label' },
    { part: 'clear', key: 'shared.action.icon-button' },
  ],
  'command-palette': [
    { part: 'backdrop', key: 'shared.overlay.backdrop' },
    { part: 'dialog', key: 'shared.overlay.surface' },
  ],
  'data-table': [{ part: 'pagination', key: 'shared.navigation.item' }],
  'date-field': [{ part: 'label', key: 'shared.form.label' }],
  'date-picker': [
    { part: 'previous', key: 'shared.action.icon-button' },
    { part: 'next', key: 'shared.action.icon-button' },
  ],
  'date-range-picker': [{ part: 'legend', key: 'shared.form.label' }],
  dialog: [
    { part: 'backdrop', key: 'shared.overlay.backdrop' },
    { part: 'dialog', key: 'shared.overlay.surface' },
    { part: 'actions', key: 'shared.action.button' },
  ],
  'dropdown-menu': [
    { part: 'trigger', key: 'shared.action.button' },
    { part: 'menu', key: 'shared.overlay.surface' },
  ],
  field: [
    { part: 'legend', key: 'shared.form.label' },
    { part: 'control', key: 'shared.form.field' },
  ],
  'file-input': [{ part: 'label', key: 'shared.form.label' }],
  form: [
    { part: 'field', key: 'shared.form.field' },
    { part: 'actions', key: 'shared.action.button' },
  ],
  icon: [
    { part: 'glyph', key: 'shared.atom.icon' },
    { part: 'button', key: 'shared.action.icon-button' },
  ],
  label: [{ part: 'label', key: 'shared.form.label' }],
  'navigation-menu': [
    { part: 'link', key: 'shared.navigation.item' },
    { part: 'disclosure', key: 'shared.disclosure.trigger' },
  ],
  'number-field': [
    { part: 'label', key: 'shared.form.label' },
    { part: 'decrement', key: 'shared.action.icon-button' },
    { part: 'increment', key: 'shared.action.icon-button' },
  ],
  pagination: [
    { part: 'previous', key: 'shared.action.icon-button' },
    { part: 'page', key: 'shared.navigation.item' },
    { part: 'next', key: 'shared.action.icon-button' },
  ],
  popover: [
    { part: 'trigger', key: 'shared.action.button' },
    { part: 'surface', key: 'shared.overlay.surface' },
  ],
  'radio-group': [{ part: 'legend', key: 'shared.form.label' }],
  sheet: [
    { part: 'backdrop', key: 'shared.overlay.backdrop' },
    { part: 'sheet', key: 'shared.overlay.surface' },
    { part: 'close', key: 'shared.action.icon-button' },
  ],
  sidebar: [
    { part: 'trigger', key: 'shared.action.icon-button' },
    { part: 'navigation', key: 'shared.navigation.item' },
  ],
  select: [{ part: 'label', key: 'shared.form.label' }],
  tabs: [{ part: 'tab', key: 'shared.navigation.item' }],
  'text-field': [
    { part: 'label', key: 'shared.form.label' },
    { part: 'input', key: 'shared.form.field' },
  ],
  textarea: [{ part: 'label', key: 'shared.form.label' }],
  'time-field': [{ part: 'legend', key: 'shared.form.label' }],
  toast: [
    { part: 'toast', key: 'shared.overlay.surface' },
    { part: 'dismiss', key: 'shared.action.icon-button' },
  ],
  toggle: [
    { part: 'button', key: 'shared.action.button' },
    { part: 'icon', key: 'shared.atom.icon' },
  ],
  'toggle-group': [
    { part: 'toggle', key: 'shared.action.button' },
    { part: 'icon', key: 'shared.atom.icon' },
  ],
  toolbar: [{ part: 'button', key: 'shared.action.icon-button' }],
  tooltip: [
    { part: 'trigger', key: 'shared.action.icon-button' },
    { part: 'surface', key: 'shared.overlay.surface' },
  ],
  'tree-view': [{ part: 'summary', key: 'shared.disclosure.trigger' }],
};

