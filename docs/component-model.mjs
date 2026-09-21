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
  const p = { matrixExcludedProps: [], ...profiles[slug] };
  if (parentOnly.has(slug)) p.states = ['Default'];
  return p;
}

// Each selector identifies a documented atom/part, not an arbitrary descendant.
export const partDefinitions = [
  ['button', 'Button', '.btn:not(.combobox-trigger)'],
  ['toggle', 'Toggle', '.toggle'],
  ['text-field', 'Text input', '.text-field-input'],
  ['textarea', 'Textarea', '.textarea'],
  ['composer-input', 'Composer input', '.composer-input'],
  ['form-field', 'Form field', '.form-field'],
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
  ['time', 'Time segment', '[data-time-part="hour"], [data-time-part="minute"]'],
  ['time-period', 'Time period', '[data-time-part="period"]'],
  ['otp', 'OTP digit', '.input-otp input:not([type="hidden"])'],
  ['number', 'Number input', '.number-field input'],
  ['color', 'Color input', '.color-picker input[type="color"]'],
  ['color-hex', 'Color hex input', '.color-picker-hex'],
  ['day', 'Calendar day', '.date-picker-day button[tabindex="0"]'],
  ['resize', 'Resize handle', '.resizable-handle'],
  ['dismiss', 'Dismiss button', '.toast-close'],
  ['suggestion-item', 'Suggestion button', '.suggestion button'],
  ['message-bubble', 'Message bubble', '.message-bubble'],
  ['activity-item', 'Activity item', '.agent-activity-item'],
  ['todo-item', 'Task item', '.todo-item'],
  ['avatar-badge', 'Avatar badge', '.avatar-badge'],
  ['statistic-trend', 'Statistic trend', '.statistic-trend'],
  ['timeline-marker', 'Timeline marker', '.timeline-dot'],
  ['tree-connector', 'Tree connector', '.tree-indicator'],
  ['source-link', 'Source link', '.source-link']
];

// These atoms have their complete matrices in their own component sections.
// They remain independently editable in composed playgrounds.
export const standaloneParts = new Set([
  'button',
  'toggle',
  'text-field',
  'textarea',
  'checkbox',
  'switch',
  'select',
  'date',
  'number'
]);

const visualParts = {
  'form-field': { props: { 'data-orientation': [null, 'horizontal'] } },
  'activity-item': { props: { 'data-status': ['pending', 'running', 'complete', 'error'] } },
  'todo-item': { props: { 'data-status': ['pending', 'active', 'done', 'error'] } },
  'avatar-badge': { props: { hidden: [null, ''] } },
  'statistic-trend': { props: { 'data-trend': [null, 'up', 'down'] } },
  'timeline-marker': { props: { 'data-variant': [null, 'active'] } },
  'tree-connector': {
    props: {
      'data-variant': [
        'default',
        'first',
        'last',
        'overflowTop',
        'overflowBottom',
        'line',
        'branch',
        'overflow'
      ]
    }
  },
  'source-link': { states: ['Default', 'Hover', 'Focus'] },
  'composer-input': {
    states: ['Default', 'Focus', 'Disabled'],
    props: { readonly: [null, ''] },
    focusWithin: '.composer'
  },
  day: { states: ['Default', 'Hover', 'Focus', 'Disabled'], dynamic: true },
  dismiss: { states: ['Default', 'Hover', 'Focus'] },
  'nav-trigger': { states: ['Default', 'Hover', 'Focus'] },
  tab: {
    states: ['Default', 'Hover', 'Focus', 'Disabled'],
    exclusive: { attr: 'aria-selected', on: 'true' }
  },
  page: {
    states: ['Default', 'Hover', 'Focus', 'Disabled'],
    exclusive: { attr: 'aria-current', on: 'page' }
  }
};

export function partProfile(type, selector) {
  if (visualParts[type]) return { ...visualParts[type], target: selector };
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
      exclusive: { attr: 'aria-selected', on: 'true' }
    };
  if (type === 'treecontrol') return { target: selector, states: ['Default', 'Hover', 'Focus'] };
  if (type === 'accordion-item')
    return { target: selector, disclosure: true, states: ['Closed', 'Open'] };
  if (type === 'message-bubble')
    return {
      target: selector,
      states: ['Default'],
      props: { 'data-tone': ['', 'muted', 'negative', 'selected'] }
    };
  if (type === 'summary')
    return {
      target: selector,
      states: [
        'Default',
        ...(/\.(?:collapsible|tree|agent-activity|reasoning|file-diff)\b/.test(selector)
          ? ['Hover']
          : []),
        'Focus',
        ...(/\.accordion\b/.test(selector) ? ['Disabled'] : [])
      ]
    };
  if (type === 'nav-link')
    return {
      target: selector,
      states: ['Default', 'Hover', 'Focus'],
      exclusive: { attr: 'aria-current', on: 'page' }
    };
  if (profiles[type]) return { ...profiles[type], target: selector, focus: selector };
  const input = [
    'radio',
    'date',
    'range-date',
    'time',
    'time-period',
    'otp',
    'number',
    'color',
    'color-hex',
    'combobox-trigger'
  ].includes(type);
  return {
    target: selector,
    input,
    interactive: !input,
    checkable: type === 'radio',
    ...(['color', 'color-hex', 'otp', 'combobox-trigger'].includes(type)
      ? { hover: selector }
      : {}),
    ...(['range-date', 'time'].includes(type) ? { hover: false } : {}),
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
      'data-submit-on': 'Submit shortcut',
      value: 'Completion'
    }[attr] ||
    attr
      .replace(/^data-/, '')
      .replaceAll('-', ' ')
      .replace(/^./, (s) => s.toUpperCase())
  );
}

export function optionLabel(slug, attr, value, values) {
  if (slug === 'progress' && attr === 'value')
    return value === null ? 'Indeterminate' : `${value}%`;
  if (values.includes(null) && values.includes('')) return value === null ? 'Off' : 'On';
  if (value === null) return 'Default';
  if (attr === 'data-size') {
    const sizes =
      slug === 'icon'
        ? { xs: 12, '': 16, md: 20, lg: 24, xl: 32 }
        : { xs: 12, sm: 16, md: 20, lg: 24, xl: 32 };
    return sizes[value] ? `${sizes[value]}px` : value;
  }
  return value === '' ? 'Default' : value.replace(/^./, (s) => s.toUpperCase());
}

export const encodeValue = (value) => (value === null ? '__remove' : value);
export const decodeValue = (value) => (value === '__remove' ? null : value);
export function booleanValues(values) {
  if (values.length !== 2) return null;
  if (values.includes(null) && values.includes('')) return [null, ''];
  if (values.includes('false') && values.includes('true')) return ['false', 'true'];
  return null;
}

export function initialValue(scope, property, index = 0) {
  if (property.initialValues && index < property.initialValues.length)
    return property.initialValues[index];
  const authored = scope.instances?.[index]?.[property.attr];
  if (authored !== undefined) return authored;
  if (Object.hasOwn(scope.defaults || {}, property.attr)) return scope.defaults[property.attr];
  if (property.values.includes(null)) return null;
  if (property.values.includes('')) return '';
  return property.default;
}

// Badge status and neutral emphasis are separate documented forms, not axes.
// The playground can hide ignored controls without discarding their choice.
export function propertyConstraints(scope, values = {}) {
  const ignoredProps = scope.type === 'badge' && values['data-state'] ? ['data-variant'] : [];
  return { hiddenProps: ignoredProps, ignoredProps };
}
export { statesFor };

// Canonical anatomy, not a selectable collection of application examples.
export function canonicalHtml(c, matrix = false) {
  if (c.slug === 'button')
    return '<button class="btn" type="button" data-variant="default">Button</button>';
  if (c.slug === 'badge') return '<span class="badge" data-variant="default">Badge</span>';
  if (c.slug === 'avatar')
    return '<span class="avatar"><img class="avatar-image" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=faces" width="36" height="36" alt="Portrait"><span class="avatar-fallback" aria-hidden="true">MK</span><span class="avatar-badge" role="img" aria-label="Available"></span></span>';
  if (c.slug === 'button-group')
    return '<div class="btn-group" role="group" aria-label="Actions"><button class="btn" type="button" data-variant="secondary">First</button><button class="btn" type="button" data-variant="secondary">Second</button><button class="btn" type="button" data-variant="secondary">Third</button></div>';
  if (c.slug === 'message') return c.specimens[0].html;
  if (c.slug === 'composer') {
    const html = c.samples[0].html;
    return html.includes('class="composer-status"')
      ? html
      : html.replace(
          '<div class="composer-actions-leading">',
          '<div class="composer-actions-leading"><span class="composer-status" role="status">Ready</span>'
        );
  }
  if (c.slug === 'tool-call') return c.specimens[0].html;
  if (c.slug === 'spinner') return c.specimens[0].html;
  if (c.slug === 'progress')
    return '<progress class="progress" value="50" max="100" aria-label="Completion">Completion</progress>';
  if (c.slug === 'skeleton')
    return '<div class="skeleton" style="height:var(--size-900)" aria-hidden="true"></div>';
  if (c.slug === 'typography') return typographyDocument;
  if (c.slug === 'separator') return '<hr class="separator" data-orientation="horizontal">';
  if (c.slug === 'navigation-menu') return c.samples[1].html;
  if (c.slug === 'image') return c.samples[1].html;
  if (c.slug === 'carousel') return c.samples[2].html;
  if (c.slug === 'layout')
    return '<div class="layout-stack" data-gap="md"><div class="layout-region">First region</div><div class="layout-region">Second region</div></div>';
  if (c.slug === 'label')
    return '<div><label class="label" for="label-example">Name</label><input class="text-field-input" id="label-example" type="text"></div>';
  if (c.slug === 'card')
    return '<article class="card"><header class="card-header"><h3 class="card-title">Card title</h3><p class="card-description">Supporting description.</p></header><div class="card-content"><p>Card content.</p></div><footer class="card-footer"><button class="btn" data-variant="secondary" type="button">Action</button></footer></article>';
  if (c.slug === 'tree-view')
    return '<ul class="tree" role="tree" aria-label="Files"><li class="tree-item" role="treeitem" aria-expanded="true"><details class="tree-branch" open><summary class="tree-branch-trigger">Source</summary><ul class="tree-group" role="group"><li class="tree-item" role="treeitem" aria-selected="true"><span class="tree-leaf" tabindex="0"><span class="tree-indicator" data-variant="default" aria-hidden="true"></span>index.js</span></li><li class="tree-item" role="treeitem"><span class="tree-leaf" tabindex="-1">styles.css</span></li></ul></details></li></ul>';
  if (c.slug === 'statistic')
    return c.specimens.find((s) => s.html.includes('statistic-trend'))?.html || c.specimens[0].html;
  if (['toggle', 'thinking-indicator'].includes(c.slug)) return c.specimens[0].html;
  if (matrix) return c.specimens[0].html;
  return c.samples[0].html;
}

// Structural slots have real markup semantics and explicit values, unlike an
// "example" selector. These are shared by the playground and export matrix.
export const slots = {
  table: { label: 'Density', values: ['plain', 'dense'], default: 'plain' },
  'tool-call': { label: 'Structure', values: ['disclosure', 'status-only'], default: 'disclosure' },
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

// One complete rendered Markdown document. Typography is a presentation
// component: it styles native Markdown output and has no properties or states.
export const typographyDocument = `<article class="typography-content">
  <h1>Taxing Laughter</h1>
  <p class="lead">A short history of the kingdom that taxed its own jokes.</p>
  <p>The king, seeing how much happier his subjects were, realized the error of his ways and repealed the joke tax. This paragraph shows the default reading rhythm, <strong>strong emphasis</strong>, <em>italic emphasis</em>, <a href="#preview-typography">a linked phrase</a>, inline <code>const ready = true</code>, and keyboard input such as <kbd>Ctrl</kbd> + <kbd>K</kbd>.</p>
  <h2>The People of the Kingdom</h2>
  <p>Headings keep a predictable hierarchy, and supporting text stays quieter than the body.</p>
  <ul>
    <li>An unordered item with a nested list
      <ul><li>A nested item</li></ul>
    </li>
    <li>Another plain item</li>
  </ul>
  <ol>
    <li>First ordered step</li>
    <li>Second ordered step</li>
  </ol>
  <blockquote>
    <p>"After all," he said, "everyone enjoys a good joke, so it's only fair that they should pay for the privilege."</p>
  </blockquote>
  <h3>The Joke Tax</h3>
  <p>Code blocks keep their own surface, while inline code stays within the sentence.</p>
  <pre><code>const message = 'Hello, markdown';
console.log(message);</code></pre>
  <table>
    <caption>Compact comparison</caption>
    <thead><tr><th scope="col">Format</th><th scope="col">Meaning</th></tr></thead>
    <tbody><tr><td>HTML</td><td>Semantic structure</td></tr><tr><td>CSS</td><td>Presentation</td></tr></tbody>
  </table>
  <hr>
  <h4>People stopped telling jokes</h4>
  <p>Text can be <del>removed</del>, <mark>highlighted</mark>, or annotated with H<sub>2</sub>O and x<sup>2</sup>.</p>
  <h5>A smaller detail</h5>
  <p>Minor sections keep the same reading rhythm.</p>
  <h6>The final note</h6>
  <p>The smallest heading still identifies a real section.</p>
  <ul class="task-list">
    <li class="task-list-item"><label><input type="checkbox" checked disabled> Completed task</label></li>
    <li class="task-list-item"><label><input type="checkbox" disabled> Remaining task</label></li>
  </ul>
  <details open>
    <summary>Disclosure</summary>
    <p>Additional details stay in the Markdown flow.</p>
  </details>
  <figure>
    <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=960&q=80" alt="Mountain landscape beneath a broad sky">
    <figcaption>Images and captions stay within the reading column.</figcaption>
  </figure>
  <p>Reference<sup id="typography-footnote-ref"><a href="#typography-footnote" role="doc-noteref">1</a></sup></p>
  <ol><li id="typography-footnote">A footnote with a <a href="#typography-footnote-ref" role="doc-backlink">return link</a>.</li></ol>
</article>`;
