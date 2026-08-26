const list = (value) => value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];

const masters = (value) => list(value).map((item) => {
  const [id, label = id] = item.split('|');
  return { id, label };
});

const anatomy = (value) => list(value).map((item) => {
  const [name, role, repeat] = item.split(':');
  return { name, role, ...(repeat ? { repeat: Number(repeat) } : {}) };
});

const axes = (value) => list(value).map((item) => {
  const [name, rawValues] = item.split('=');
  return { name, values: rawValues.split('/').map((entry) => entry.trim()), source: 'blueprint' };
});

const define = (intent, sourceMasters, sourceAnatomy, sourceAxes, layout = 'intrinsic') => ({
  intent,
  masters: masters(sourceMasters),
  anatomy: anatomy(sourceAnatomy),
  matrix: axes(sourceAxes),
  layout,
});

/**
 * Visual contracts, not a generic component template. Every key has distinct
 * masters, anatomy, and matrix axes derived from the implementation contract.
 */
export const rendererDefinitions = {
  accordion: define(
    'Native details disclosures with connected rows; an open item owns its content.',
    'multi-open-open|Multi-open / open,exclusive-open|Exclusive / open,single-open|Required one open',
    'items:details-stack:3,trigger:summary-row,chevron:disclosure-icon,content:supporting-copy',
    'mode=multi-open/exclusive/required-one-open,interaction=closed/open/hover',
    'vertical-connected',
  ),
  alertDialog: define(
    'Destructive confirmation top-layer surface with a clear cancel and final action.',
    'destructive-open|Destructive / open,outline-open|Outline / open',
    'backdrop:overlay-strong,dialog:top-layer-surface,heading:heading,description:supporting-copy,actions:action-row',
    'variant=destructive/outline,state=closed/open',
    'overlay-centered',
  ),
  appShell: define(
    'Application chrome, not a route template: header, route navigation, content width, and dense status rows.',
    'header|Header / active route,toolbar|Toolbar / breadcrumbs,status-list|Status list / running',
    'skip-link:skip-link,header:sticky-chrome,brand:brand,navigation:route-nav,header-actions:action-group,content:continuous-canvas,status-row:status-row',
    'region=header/toolbar/status-list,status=positive/caution/negative/running,interaction=rest/hover/focus',
    'shell',
  ),
  avatar: define(
    'Image or initials inside a circular identity mark.',
    'image-sm|Image / small,initials-lg|Initials / large',
    'visual:circular-image,fallback:initials',
    'size=sm/default/lg,content=image/initials',
  ),
  badge: define(
    'Compact inline status or count label; never a button substitute.',
    'default|Default,outline|Outline,count|Count',
    'label:inline-label,count:tabular-count',
    'variant=default/secondary/outline/count,state=positive/caution/negative/running',
  ),
  breadcrumbs: define(
    'Ordered route trail with links before one current item.',
    'standard|Standard',
    'nav:navigation-landmark,list:ordered-list,item:breadcrumb-item:3,separator:separator-glyph,current:current-page',
    'interaction=rest/hover/focus,depth=two/three/truncated',
    'inline',
  ),
  button: define(
    'Native action or anchor with explicit hierarchy and focus treatment.',
    'default|Default,secondary|Secondary,outline|Outline,ghost|Ghost,destructive|Destructive,link|Link',
    'label:button-label,leading-icon:icon,trailing-icon:icon,spinner:loading-indicator',
    'variant=default/secondary/outline/ghost/destructive/link,size=sm/default/icon-sm/icon,interaction=rest/hover/focus/disabled/loading',
  ),
  buttonGroup: define(
    'Connected actions that preserve one outer boundary and compact seams.',
    'default-horizontal|Default / horizontal,outline-vertical|Outline / vertical',
    'group:connected-control-group,button:button:3,seam:separator',
    'variant=default/outline,orientation=horizontal/vertical,interaction=rest/hover/focus/disabled',
    'connected-row',
  ),
  callout: define(
    'Bounded status message with visible label, copy, and optional action.',
    'outline|Outline,destructive|Destructive',
    'icon:status-icon,copy:callout-copy,title:strong-label,description:supporting-copy,action:compact-action',
    'variant=outline/destructive,size=sm/default',
    'horizontal',
  ),
  card: define(
    'One bordered content surface with heading, supporting copy, and optional action.',
    'default|Default,outline-link|Outline / linked',
    'surface:bordered-section,heading:heading,description:supporting-copy,footer:action-row',
    'variant=default/outline,interaction=rest/hover/focus',
    'vertical',
  ),
  carousel: define(
    'Scrollable slide track with labelled previous and next controls.',
    'start|Start,middle|Middle',
    'viewport:clipped-viewport,track:horizontal-track,slide:slide:3,previous:icon-button,next:icon-button,pagination:position-label',
    'position=start/middle/end,interaction=rest/hover/focus',
    'horizontal',
  ),
  checkbox: define(
    'Native checkbox group with labels, descriptions, and group validation.',
    'unchecked|Unchecked,checked|Checked,invalid|Invalid',
    'fieldset:fieldset,legend:label,option:checkbox-option:2,control:native-checkbox,label:label,description:supporting-copy,message:validation-message',
    'state=unchecked/checked/focus/invalid/disabled',
    'vertical',
  ),
  collapsible: define(
    'One native disclosure with summary, chevron, and optional open content.',
    'closed|Closed,open|Open',
    'details:details,summary:summary-row,chevron:disclosure-icon,content:supporting-copy',
    'state=closed/open/hover/focus',
    'vertical-connected',
  ),
  combobox: define(
    'Searchable selection control with input, results, and selected option treatment.',
    'empty|Empty,results|Results / selected,disabled|Disabled',
    'label:label,input:text-control,clear:icon-button,listbox:option-list,option:option-row:4,message:validation-message',
    'variant=outline,state=empty/results/selected/hover/focus/disabled',
    'vertical',
  ),
  commandPalette: define(
    'Modal command surface with query input, grouped results, shortcuts, and empty state.',
    'open-results|Open / results,open-empty|Open / empty',
    'backdrop:overlay-strong,dialog:top-layer-surface,search:search-input,group:command-group,command:command-row:5,shortcut:keyboard-key,empty:empty-state',
    'state=closed/open/results/empty/hover/focus/disabled',
    'overlay-centered',
  ),
  dataTable: define(
    'Data-table composition with caption, filtering, sortable headers, rows, and pagination.',
    'default|Default,filtered|Filtered,empty|Empty',
    'section:data-section,toolbar:filter-toolbar,table:data-table,header:sortable-header:4,row:table-row:3,pagination:pagination,empty:empty-state',
    'state=default/sorted/filtered/empty/hover/focus/invalid/disabled',
    'table',
  ),
  dateField: define(
    'Single date text input with native label and validation state.',
    'empty|Empty,filled|Filled,invalid|Invalid',
    'label:label,input:text-control,message:validation-message',
    'state=empty/filled/hover/focus/invalid/disabled',
    'vertical',
  ),
  datePicker: define(
    'Calendar grid with month controls, selected day, and keyboard focus.',
    'default|Default,range-start|Range start,range-end|Range end',
    'header:calendar-header,previous:icon-button,next:icon-button,weekday-row:weekday-labels,grid:calendar-grid,day:calendar-day:35',
    'state=default/selected/range-start/range-end/focus/hover',
    'calendar',
  ),
  dateRangePicker: define(
    'Two date fields with grouped range semantics and one validation message.',
    'empty|Empty,range|Range selected,invalid|Invalid',
    'fieldset:fieldset,legend:label,start:date-input,separator:range-separator,end:date-input,message:validation-message',
    'state=empty/range-selected/focus/invalid/disabled',
    'horizontal',
  ),
  dialog: define(
    'Modal dialog with heading, form content, and resolved action hierarchy.',
    'default-open|Default / open,outline-open|Outline / open',
    'backdrop:overlay-strong,dialog:top-layer-surface,heading:heading,description:supporting-copy,form:form-stack,actions:action-row',
    'variant=default/outline,state=closed/open',
    'overlay-centered',
  ),
  dropdownMenu: define(
    'Trigger plus compact menu surface with ordinary and destructive actions.',
    'outline-open|Outline / open,destructive-open|Destructive / open',
    'trigger:button,menu:top-layer-surface,item:menu-item:4,separator:separator,destructive-item:destructive-menu-item',
    'variant=outline/destructive,state=closed/open/hover',
    'anchored-overlay',
  ),
  field: define(
    'Field wrapper that composes label, native control, description, and validation.',
    'vertical|Vertical,horizontal|Horizontal,invalid|Invalid',
    'fieldset:fieldset,legend:label,control:native-control,description:supporting-copy,message:validation-message',
    'orientation=vertical/horizontal,state=default/focus/invalid/disabled',
    'form-field',
  ),
  fileInput: define(
    'Native file chooser with selected-file and invalid treatments.',
    'empty|Empty,selected|Selected file,invalid|Invalid',
    'label:label,input:file-control,selected-file:supporting-copy,message:validation-message',
    'state=empty/selected/hover/focus/invalid/disabled',
    'vertical',
  ),
  form: define(
    'Native form composition with related controls, group legend, and one action hierarchy.',
    'stacked|Stacked,horizontal|Horizontal',
    'form:form-stack,fieldset:fieldset,legend:label,field:field:2,actions:action-row',
    'orientation=vertical/horizontal,variant=default/outline',
    'form',
  ),
  icon: define(
    'Lucide glyph on its own or inside a labelled icon action.',
    'default|Default,outline-button|Outline button',
    'glyph:icon,button:icon-button,accessible-name:sr-only-label',
    'variant=default/outline,size=icon/default/lg/xl',
    'inline',
  ),
  image: define(
    'Responsive figure with ratio, fit, radius, caption, and fallback.',
    'photo|Photo / 4:3,contain|Contain / 1:1,fallback|Fallback',
    'figure:figure,image:responsive-image,fallback:image-fallback,caption:figcaption',
    'ratio=1/1/4/3/3/2/16/9/21/9/3/4,fit=cover/contain/fill/none,radius=square/full,state=default/hover/focus/open/fallback',
    'media',
  ),
  label: define(
    'Visible text label associated with one native control.',
    'default|Default,required|Required',
    'label:label,required-marker:required-marker,control:reference-control',
    'state=default/required/disabled',
    'inline',
  ),
  layout: define(
    'Local flex and grid composition primitives, not a page template.',
    'stack|Stack,cluster|Cluster,grid|Grid,split|Split',
    'container:layout-container,region:layout-region:3,aside:layout-aside,main:layout-main',
    'pattern=stack/cluster/grid/split,gap=none/xs/sm/md/lg/xl',
    'layout',
  ),
  navigationMenu: define(
    'Primary navigation with current route, disclosure item, and focus treatment.',
    'inline|Inline,expanded|Expanded disclosure',
    'nav:navigation-landmark,list:navigation-list,link:nav-link:3,current:current-nav-link,disclosure:nav-disclosure,submenu:submenu',
    'state=default/current/hover/focus/expanded',
    'navigation',
  ),
  numberField: define(
    'Numeric input with increment/decrement actions and validation.',
    'default|Default,filled|Filled,invalid|Invalid',
    'label:label,input:number-input,decrement:icon-button,increment:icon-button,message:validation-message',
    'state=default/filled/hover/focus/invalid/disabled',
    'vertical',
  ),
  pagination: define(
    'Page navigation with previous, next, current page, and truncation.',
    'first-page|First page,middle-page|Middle page,last-page|Last page',
    'nav:navigation-landmark,previous:icon-button,page:page-link:5,ellipsis:ellipsis,next:icon-button',
    'state=first/middle/last/hover/focus/disabled',
    'inline',
  ),
  popover: define(
    'Non-modal anchored surface with a trigger and supporting content.',
    'top-start|Top / start,right-end|Right / end',
    'trigger:button,surface:top-layer-surface,heading:heading,content:supporting-copy',
    'side=top/right/bottom/left,align=start/center/end,variant=outline',
    'anchored-overlay',
  ),
  progress: define(
    'Native progress bar with visible label and determinate value.',
    'quarter|25%,half|50%,complete|100%',
    'label:label,progress:native-progress,value:progress-value',
    'value=25/50/100',
    'vertical',
  ),
  radioGroup: define(
    'Native radio group with one selected option and group-level validation.',
    'unchecked|No selection,checked|Selected,invalid|Invalid',
    'fieldset:fieldset,legend:label,option:radio-option:3,control:native-radio,label:label,message:validation-message',
    'state=unchecked/checked/hover/focus/invalid/disabled',
    'vertical',
  ),
  resizable: define(
    'Two content regions separated by a keyboard-operable resize handle.',
    'horizontal|Horizontal,vertical|Vertical',
    'region-a:resizable-region,handle:resize-handle,region-b:resizable-region,value:resize-value-label',
    'orientation=horizontal/vertical,state=default/hover/focus/disabled',
    'split',
  ),
  scrollArea: define(
    'Overflow region with visible viewport and compact custom track treatment.',
    'vertical|Vertical scroll,both|Both axes',
    'viewport:scroll-viewport,content:overflow-content,track:scroll-track,thumb:scroll-thumb',
    'axis=vertical/horizontal/both,state=rest/hover',
    'overflow',
  ),
  select: define(
    'Native select with label, option groups, and validation message.',
    'default|Default,selected|Selected,invalid|Invalid',
    'label:label,select:native-select,option-group:option-group,message:validation-message',
    'state=default/selected/focus/invalid/disabled',
    'vertical',
  ),
  separator: define(
    'Low-emphasis separator for connected content regions.',
    'horizontal|Horizontal,vertical|Vertical,labelled|Labelled',
    'rule:separator,label:separator-label',
    'orientation=horizontal/vertical,content=plain/labelled',
    'separator',
  ),
  sheet: define(
    'Modal edge surface with close control, heading, description, and actions.',
    'right-open|Right / open,left-open|Left / open,bottom-open|Bottom / open',
    'backdrop:overlay-strong,sheet:edge-surface,close:icon-button,heading:heading,description:supporting-copy,content:sheet-content',
    'side=right/left/bottom,state=closed/open/hover,variant=default/outline',
    'overlay-edge',
  ),
  sidebar: define(
    'Collapsible route navigation shell with persistent and mobile modes.',
    'expanded|Expanded,collapsed|Collapsed,mobile-open|Mobile / open',
    'sidebar:sidebar-surface,trigger:icon-button,brand:brand,navigation:route-nav,link:nav-link:4,mobile-dialog:mobile-sheet',
    'state=expanded/collapsed/mobile-open/open,side=left/right,interaction=hover/focus',
    'shell',
  ),
  skeleton: define(
    'Neutral placeholder blocks that preserve intended content geometry.',
    'text|Text,avatar|Avatar,panel|Panel',
    'block:skeleton-block,line:skeleton-line:3,circle:skeleton-circle',
    'shape=line/avatar/panel',
    'vertical',
  ),
  slider: define(
    'Native range control with visible value and orientation-specific rail.',
    'horizontal|Horizontal,vertical|Vertical',
    'label:label,input:native-range,output:output-value',
    'orientation=horizontal/vertical,state=default/focus/disabled',
    'control',
  ),
  sortable: define(
    'Reorderable list with visible handle, selected item, and drop indicator.',
    'vertical-before|Vertical / before,horizontal-after|Horizontal / after',
    'list:sortable-list,item:sortable-item:3,handle:drag-handle,drop-indicator:drop-indicator',
    'orientation=vertical/horizontal,over=before/after,state=default/hover/focus/disabled',
    'sortable',
  ),
  spinner: define(
    'Only continuous-motion primitive; show it inside a named loading context.',
    'sm|Small,md|Medium,lg|Large,xl|Extra large',
    'glyph:spinner,label:loading-label',
    'size=sm/md/lg/xl',
    'inline',
  ),
  statistic: define(
    'Compact metric with technical label, primary value, and directional trend.',
    'up|Trend / up,down|Trend / down',
    'label:technical-label,value:primary-value,trend:trend-row,trend-icon:trend-icon',
    'trend=up/down,status=neutral/positive/negative',
    'data',
  ),
  switch: define(
    'Native checkbox switch with clear on/off state and validation treatment.',
    'off|Off,on|On,invalid|Invalid',
    'control:native-switch,track:switch-track,thumb:switch-thumb,label:label,message:validation-message',
    'state=off/on/focus/invalid/disabled',
    'inline',
  ),
  table: define(
    'Semantic data table with caption, row hierarchy, and keyboard focus affordance.',
    'standard|Standard,dense|Dense,footer|With footer',
    'table:data-table,caption:caption,header-row:table-header,row:table-row:3,footer:table-footer',
    'density=standard/dense,content=body/footer,state=default/focus',
    'table',
  ),
  tabs: define(
    'Tab list with one selected tab and a matching panel.',
    'default|Default,line|Line',
    'tablist:tab-list,tab:tab:3,selected-tab:selected-tab,panel:tab-panel',
    'variant=default/line,state=rest/hover/focus/selected',
    'vertical',
  ),
  textField: define(
    'Text input with label, description, action, and validation state.',
    'vertical|Vertical,horizontal|Horizontal,invalid|Invalid',
    'label:label,input:text-control,action:inline-action,description:supporting-copy,message:validation-message',
    'orientation=vertical/horizontal,variant=default,state=empty/filled/focus/invalid/disabled',
    'form-field',
  ),
  textarea: define(
    'Multi-line native text input with supporting text and validation.',
    'empty|Empty,filled|Filled,invalid|Invalid',
    'label:label,textarea:textarea,description:supporting-copy,message:validation-message',
    'state=empty/filled/focus/invalid/disabled',
    'vertical',
  ),
  timeField: define(
    'Grouped time parts with native select/input controls and one shared message.',
    'empty|Empty,filled|Filled,invalid|Invalid',
    'fieldset:fieldset,legend:label,hour:time-part,minute:time-part,period:time-part,separator:time-separator,message:validation-message',
    'state=empty/filled/focus/invalid/disabled',
    'horizontal',
  ),
  timeline: define(
    'Ordered events with temporal marker, content, and active step treatment.',
    'default|Default,active|Active',
    'list:ordered-list,event:timeline-event:3,marker:timeline-marker,connector:timeline-connector,time:time-label,content:event-copy',
    'variant=default/active,state=complete/active/upcoming',
    'vertical',
  ),
  toast: define(
    'Transient status announcement with title, description, and optional dismissal.',
    'info|Info,success|Success,warning|Warning,destructive|Destructive',
    'region:toast-region,toast:toast-surface,title:strong-label,description:supporting-copy,dismiss:icon-button',
    'variant=info/success/warning/destructive,position=top-left/top-center/top-right/bottom-left/bottom-center/bottom-right,interaction=rest/hover',
    'overlay-corner',
  ),
  toggle: define(
    'Pressable binary action with pressed and unpressed visual states.',
    'outline-off|Outline / off,outline-on|Outline / on',
    'button:toggle-button,icon:icon,label:button-label',
    'variant=outline,state=off/on/hover/focus/disabled',
    'inline',
  ),
  toggleGroup: define(
    'Connected single or multiple pressed controls with orientation variants.',
    'single-horizontal|Single / horizontal,multiple-vertical|Multiple / vertical',
    'group:connected-control-group,toggle:toggle-button:3,icon:icon',
    'type=single/multiple,orientation=horizontal/vertical,variant=outline,state=off/on/hover/focus/disabled',
    'connected-row',
  ),
  toolbar: define(
    'Compact action strip for local text or content operations.',
    'horizontal|Horizontal,vertical|Vertical',
    'toolbar:toolbar,group:toolbar-group,button:icon-button:3,separator:separator',
    'orientation=horizontal/vertical,variant=ghost',
    'toolbar',
  ),
  tooltip: define(
    'Short non-interactive explanation anchored to a labelled icon action.',
    'top|Top,right-end|Right / end',
    'trigger:icon-button,surface:tooltip-surface,copy:tooltip-copy,arrow:tooltip-arrow',
    'side=top/right/bottom/left,align=start/center/end',
    'anchored-overlay',
  ),
  treeView: define(
    'Hierarchical native disclosures with folders, files, and an active row.',
    'collapsed|Collapsed,expanded|Expanded,active|Active item',
    'tree:tree-list,folder:details-node:2,summary:tree-row,file:tree-row,chevron:disclosure-icon,icon:file-icon',
    'state=collapsed/expanded/open/active/hover/focus',
    'tree',
  ),
  typography: define(
    'Penpot-only composed text styles across heading, body, code, quote, and keyboard text.',
    'type-ramp|Type ramp,rich-text|Rich text',
    'heading:heading:3,body:body-copy,list:list,quote:blockquote,code:inline-code,kbd:keyboard-key',
    'style=heading/body/code/quote/keyboard',
    'typography',
  ),
};

export const rendererInventory = new Set(Object.keys(rendererDefinitions));

export const sharedAtoms = {
  control: ['label', 'focus-ring', 'disabled-treatment'],
  field: ['label', 'control', 'description', 'message'],
  overlay: ['backdrop', 'surface', 'heading', 'description', 'actions'],
  navigation: ['items', 'current-item', 'focus-ring'],
  data: ['heading', 'value', 'supporting-copy'],
};
