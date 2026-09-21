// Shared, component-first presentation contract. A part owns its own state;
// focus on a nested button is never a state of its containing group or card.
import { profiles, statesFor } from './catalog.mjs';

const parentOnly = new Set([
  'button-group',
  'toggle-group',
  'toolbar',
  'field',
  'form',
  'radio-group',
  'date-picker',
  'date-range-picker',
  'time-field',
  'pagination',
  'tabs',
  'tree-view',
  'color-picker',
  'input-otp',
  'suggestion',
  'combobox',
  'accordion'
]);

export function rootProfile(slug) {
  const p = { ...profiles[slug] };
  if (parentOnly.has(slug)) p.states = ['Default'];
  return p;
}

// Each selector identifies a documented atom/part, not an arbitrary descendant.
export const partDefinitions = [
  ['button', 'Button', '.btn:not(.combobox-trigger)'],
  ['toggle', 'Toggle', '.toggle'],
  ['text-field', 'Text input', '.text-field-input'],
  ['textarea', 'Textarea', '.textarea, .composer-input'],
  ['checkbox', 'Checkbox', '.checkbox'],
  ['switch', 'Switch', '.switch'],
  ['select', 'Select', '.select'],
  ['radio', 'Radio', '.radio'],
  ['tab', 'Tab trigger', '.tab-trigger'],
  ['menuitem', 'Menu item', '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'],
  ['page', 'Page link', '.pagination-link'],
  ['treeitem', 'Tree item', '.tree-item'],
  ['treecontrol', 'Tree leaf control', '.tree-leaf'],
  ['date', 'Date segment', '.date-input'],
  ['range-date', 'Date input', '.date-range-input'],
  ['combobox-trigger', 'Combobox trigger', '.combobox-trigger'],
  ['accordion-item', 'Accordion item', '.accordion-item'],
  ['summary', 'Disclosure trigger', 'summary'],
  ['nav-link', 'Navigation link', '.nav-item-link, .nav-menu-link, .sidebar-link'],
  ['nav-trigger', 'Navigation trigger', '.nav-menu-trigger'],
  ['command-input', 'Command search', '.command-palette-input'],
  ['command-item', 'Command item', '.command-palette-item'],
  ['carousel-control', 'Carousel control', '.carousel-prev, .carousel-next, .carousel-dot'],
  [
    'time',
    'Time segment',
    '[data-time-part="hour"], [data-time-part="minute"], [data-time-part="period"]'
  ],
  ['otp', 'OTP digit', '.input-otp input:not([type="hidden"])'],
  ['number', 'Number input', '.number-field input'],
  ['color', 'Color input', '.color-picker input[type="color"]'],
  ['day', 'Calendar day', '.date-picker-day:not([data-disabled]) button'],
  ['resize', 'Resize handle', '.resizable-handle'],
  ['dismiss', 'Dismiss button', '.toast-close'],
  ['suggestion-item', 'Suggestion button', '.suggestion button']
];

export function partProfile(type, selector) {
  if (type === 'command-input')
    return {
      target: selector,
      focusWithin: '.command-palette-input-wrapper',
      states: ['Default', 'Focus']
    };
  if (type === 'treeitem')
    return {
      target: selector,
      states: ['Default', 'Disabled'],
      props: { 'aria-selected': ['false', 'true'] }
    };
  if (type === 'treecontrol') return { target: selector, states: ['Default', 'Hover', 'Focus'] };
  if (type === 'accordion-item')
    return { target: selector, disclosure: true, states: ['Closed', 'Open'] };
  if (type === 'summary') return { target: selector, states: ['Default', 'Hover', 'Focus'] };
  if (type === 'nav-link')
    return {
      target: selector,
      states: ['Default', 'Hover', 'Focus'],
      props: { 'aria-current': [null, 'page'] }
    };
  if (profiles[type]) return { ...profiles[type], target: selector, focus: selector };
  const input = [
    'radio',
    'date',
    'range-date',
    'time',
    'otp',
    'number',
    'color',
    'combobox-trigger'
  ].includes(type);
  return {
    target: selector,
    input,
    interactive: !input,
    checkable: type === 'radio',
    ...(type === 'resize' ? { states: ['Default', 'Focus'] } : {})
  };
}

export function propertyLabel(attr) {
  return (
    {
      'aria-pressed': 'Pressed',
      'aria-orientation': 'Orientation',
      'data-icon-only': 'Icon only',
      'data-type': 'Selection',
      'data-state': 'Status',
      'data-submit-on': 'Submit shortcut'
    }[attr] ||
    attr
      .replace(/^data-/, '')
      .replaceAll('-', ' ')
      .replace(/^./, (s) => s.toUpperCase())
  );
}

export function optionLabel(slug, attr, value, values) {
  if (values.includes(null) && values.includes('')) return value === null ? 'Off' : 'On';
  if (value === null) return 'Default';
  if (attr === 'data-size') {
    const sizes =
      slug === 'icon'
        ? { xs: 12, '': 16, md: 20, lg: 24, xl: 32 }
        : slug === 'avatar'
          ? { '': 36, sm: 32, lg: 48 }
          : slug === 'button'
            ? { '': 36, sm: 32 }
            : { xs: 12, sm: 16, md: 20, lg: 24, xl: 32 };
    return sizes[value] ? `${sizes[value]}px` : value;
  }
  return value === '' ? 'Default' : value.replace(/^./, (s) => s.toUpperCase());
}

export const encodeValue = (value) => (value === null ? '__remove' : value);
export const decodeValue = (value) => (value === '__remove' ? null : value);
export { statesFor };

// Canonical anatomy, not a selectable collection of application examples.
export function canonicalHtml(c, matrix = false) {
  if (c.slug === 'button')
    return '<button class="btn" type="button" data-variant="default">Button</button>';
  if (c.slug === 'badge') return '<span class="badge" data-variant="default">Badge</span>';
  if (c.slug === 'avatar')
    return '<span class="avatar"><img class="avatar-image" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=faces" width="36" height="36" alt="Portrait"><span class="avatar-fallback" aria-hidden="true">MK</span></span>';
  if (c.slug === 'button-group')
    return '<div class="btn-group" role="group" aria-label="Actions"><button class="btn" type="button" data-variant="secondary">First</button><button class="btn" type="button" data-variant="secondary">Second</button><button class="btn" type="button" data-variant="secondary">Third</button></div>';
  if (c.slug === 'message') return c.specimens[0].html;
  if (c.slug === 'tool-call') return c.specimens[0].html;
  if (c.slug === 'spinner') return c.specimens[0].html;
  if (c.slug === 'skeleton')
    return '<div class="skeleton" style="height:var(--size-900)" aria-hidden="true"></div>';
  if (c.slug === 'typography')
    return `<div class="typography-samples">${c.specimens.map((s) => s.html).join('\n')}</div>`;
  if (c.slug === 'separator') return '<hr class="separator" data-orientation="horizontal">';
  if (c.slug === 'navigation-menu') return c.samples[1].html;
  if (c.slug === 'image') return c.samples[1].html;
  if (c.slug === 'carousel') return c.samples[2].html;
  if (c.slug === 'layout')
    return '<div class="layout-stack" data-gap="md"><div class="layout-region">First region</div><div class="layout-region">Second region</div></div>';
  if (c.slug === 'label') return '<label class="label">Label</label>';
  if (c.slug === 'card')
    return '<article class="card"><header class="card-header"><h3 class="card-title">Card title</h3><p class="card-description">Supporting description.</p></header><div class="card-content"><p>Card content.</p></div><footer class="card-footer"><button class="btn" data-variant="secondary" type="button">Action</button></footer></article>';
  if (['toggle', 'statistic', 'thinking-indicator'].includes(c.slug)) return c.specimens[0].html;
  if (matrix) return c.specimens[0].html;
  return c.samples[0].html;
}

// Structural slots have real markup semantics and explicit values, unlike an
// "example" selector. These are shared by the playground and export matrix.
export const slots = {
  layout: {
    label: 'Primitive',
    values: ['stack', 'grid', 'sidebar', 'center', 'split', 'container'],
    default: 'stack'
  },
  skeleton: { label: 'Shape', values: ['bar', 'round'], default: 'bar' },
  avatar: { label: 'Content', values: ['image', 'initials', 'icon'], default: 'image' },
  toast: { label: 'Action', values: ['dismiss', 'action'], default: 'dismiss' },
  button: { label: 'Content', values: ['label', 'leading-icon', 'loading'], default: 'label' }
};

export const demoIcon =
  '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>';
