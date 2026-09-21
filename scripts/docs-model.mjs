import {
  canonicalHtml,
  rootProfile,
  partDefinitions,
  partProfile,
  statesFor,
  slots,
  standaloneParts,
  initialValue,
  propertyConstraints,
  propertyLabel,
  optionLabel
} from '../docs/component-model.mjs';
import { nonVisualProps } from '../docs/catalog.mjs';
import {
  propertyOperations,
  stateOperations,
  slotOperations,
  companionSelectors
} from '../docs/model-operations.mjs';

export async function rewrite(html, rules) {
  const r = new HTMLRewriter();
  for (const [selector, element] of rules) r.on(selector, { element });
  return r.transform(new Response(html)).text();
}

export async function operate(html, operations) {
  // Sequential: multiple handlers on the same element must see prior mutations.
  for (const op of operations) {
    let index = 0;
    html = await rewrite(html, [
      [
        op.selector,
        (el) => {
          if (op.index !== undefined && index++ !== op.index) return;
          if (op.remove) {
            el.remove();
            return;
          }
          if (op.unwrap) {
            el.removeAndKeepContent();
            return;
          }
          if (op.tagName) el.tagName = op.tagName;
          if (op.attr) {
            let attr = op.attr;
            let value = op.value;
            if (
              attr === 'disabled' &&
              !['input', 'select', 'textarea', 'button', 'fieldset'].includes(el.tagName)
            ) {
              attr = 'aria-disabled';
              if (value !== null) value = 'true';
            }
            if (value === null) el.removeAttribute(attr);
            else el.setAttribute(attr, value);
          }
          if (op.html !== undefined) el.setInnerContent(op.html, { html: true });
          if (op.text !== undefined) el.setInnerContent(op.text);
        }
      ]
    ]);
  }
  return html;
}

const voidTags = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
]);

// Record element ownership, not descendant match offsets. Paths use classes
// and structural positions, so ID namespacing does not invalidate them.
async function inspect(html, selector) {
  const nodes = [],
    matches = [],
    stack = [];
  let current;
  const r = new HTMLRewriter()
    .on('*', {
      element(el) {
        const parent = stack.at(-1);
        const siblings = parent?.children || nodes.filter((n) => !n.parent);
        const position = siblings.filter((n) => n.tag === el.tagName).length + 1;
        const attrs = Object.fromEntries(el.attributes);
        const classes = (attrs.class || '').split(/\s+/).filter((c) => /^[\w-]+$/.test(c));
        const segment = `${el.tagName}${classes.map((c) => `.${c}`).join('')}`;
        current = {
          attrs,
          tag: el.tagName,
          parent,
          children: [],
          number: nodes.length,
          classes,
          segment: `${segment}:nth-of-type(${position})`,
          path: parent
            ? `${parent.path} > ${segment}:nth-of-type(${position})`
            : `${segment}:nth-of-type(${position})`
        };
        nodes.push(current);
        parent?.children.push(current);
        if (!voidTags.has(el.tagName) && el.canHaveContent) {
          stack.push(current);
          el.onEndTag(() => stack.pop());
        }
      }
    })
    .on(selector, {
      element() {
        matches.push(current);
      }
    });
  await r.transform(new Response(html)).text();
  const classCounts = new Map();
  for (const node of nodes)
    for (const name of node.classes) classCounts.set(name, (classCounts.get(name) || 0) + 1);
  for (const node of nodes) {
    const anchor = node.classes.find((name) => classCounts.get(name) === 1);
    node.path = anchor
      ? `.${anchor}`
      : node.parent
        ? `${node.parent.path} > ${node.segment}`
        : node.segment;
  }
  return { nodes, matches };
}

function authoredState(profile, attrs, states) {
  if (!states.length) return undefined;
  if (profile.disclosure) return Object.hasOwn(attrs, 'open') ? 'Open' : 'Closed';
  const disabled = Object.hasOwn(attrs, 'disabled') || attrs['aria-disabled'] === 'true';
  const invalid = attrs['aria-invalid'] === 'true';
  const checked = profile.checkable && Object.hasOwn(attrs, 'checked');
  const mixed =
    profile.checkable &&
    (Object.hasOwn(attrs, 'data-demo-mixed') || attrs['aria-checked'] === 'mixed');
  const focus = Object.hasOwn(attrs, 'data-demo-focus');
  const candidate = [
    mixed ? 'Mixed' : checked ? 'Checked' : '',
    invalid ? 'invalid' : '',
    disabled ? 'disabled' : focus ? 'focus' : ''
  ]
    .filter(Boolean)
    .join(' ');
  return (
    states.find((s) => s.toLowerCase() === candidate.toLowerCase()) ||
    (checked && disabled && states.includes('Checked disabled')
      ? 'Checked disabled'
      : disabled && states.includes('Disabled')
        ? 'Disabled'
        : invalid && states.includes('Invalid')
          ? 'Invalid'
          : states[0])
  );
}

async function scopeFor(html, type, label, profile, id) {
  const inspected = await inspect(html, profile.target);
  const matches = inspected.matches.map((n) => n.attrs);
  if (!matches.length) return null;
  const props = Object.entries(profile.props || {}).map(([attr, values]) => {
    const property = { attr, values, default: values[0] };
    const initialValues = matches.map((_, index) =>
      initialValue({ ...profile, instances: matches }, property, index)
    );
    return { ...property, default: initialValues[0], initialValues };
  });
  const states = statesFor(profile);
  let companions;
  if (companionSelectors[type]) {
    const owners = inspected.matches.map((node) => {
      if (type !== 'number-field') return node;
      for (let parent = node.parent; parent; parent = parent.parent)
        if (parent.classes.includes('number-field')) return parent;
      return node;
    });
    companions = matches.map(() =>
      Object.fromEntries(companionSelectors[type].map((selector) => [selector, []]))
    );
    for (const selector of companionSelectors[type]) {
      for (const [childIndex, child] of (await inspect(html, selector)).matches.entries()) {
        // Stop at the closest owner; nested components never share status text.
        for (let parent = child; parent; parent = parent.parent) {
          const index = owners.findIndex((owner) => owner.path === parent.path);
          if (index < 0) continue;
          companions[index][selector].push(childIndex);
          break;
        }
      }
    }
  }
  const focusMatches = profile.focus
    ? (await inspect(html, profile.focus)).matches.map((n) => n.attrs)
    : matches;
  return {
    ...profile,
    props,
    states,
    initialStates: matches.map((attrs, i) =>
      authoredState(profile, profile.disclosure ? attrs : focusMatches[i] || attrs, states)
    ),
    selector: profile.target,
    instanceSelectors: inspected.matches.map((n) => n.path),
    ...(companions ? { companionIndices: companions } : {}),
    type,
    label,
    id,
    count: matches.length,
    instances: matches,
    index: 0
  };
}

export async function compileModel(c, component) {
  const profile = rootProfile(c.slug);
  let html = canonicalHtml(c)
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n');
  let staticHtml = canonicalHtml(c, true)
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n');
  // The export is inert. Expose enhanced number-field chrome without running
  // controllers or adding readiness markers to live/native fallback markup.
  staticHtml = await rewrite(staticHtml, [
    ['.number-field', (el) => el.setAttribute('data-mewa-number-field-init', '')],
    [
      '.slider',
      (el) => {
        const min = Number(el.getAttribute('min') || 0),
          max = Number(el.getAttribute('max') || 100);
        const authored = el.getAttribute('value');
        const value =
          authored === null || !Number.isFinite(Number(authored))
            ? (min + max) / 2
            : Math.min(max, Math.max(min, Number(authored)));
        const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
        const style = (el.getAttribute('style') || '').replace(
          /--slider-value\s*:[^;]*(?:;|$)/g,
          ''
        );
        el.setAttribute(
          'style',
          `${style}${style && !style.trimEnd().endsWith(';') ? ';' : ''}--slider-value:${percent}%`
        );
      }
    ]
  ]);
  if (c.slug === 'date-picker') {
    // One conceptual day target follows the selected/active date after runtime
    // regeneration. The static fixture never supplies browser day indices.
    async function activeDay(markup) {
      const selected = (await inspect(markup, '.date-picker-day[data-selected] button')).matches
        .length;
      return operate(markup, [
        {
          selector: selected
            ? '.date-picker-day[data-selected] button'
            : '.date-picker-day:not([data-disabled]) button',
          index: 0,
          attr: 'tabindex',
          value: '0'
        }
      ]);
    }
    html = await activeDay(html);
    staticHtml = await activeDay(staticHtml);
  }
  const scopes = [];
  const root = await scopeFor(html, c.slug, c.name, profile, 'root');
  if (root) scopes.push(root);
  for (const [type, label, selector] of profile.presentation ? [] : partDefinitions) {
    if (type === c.slug || (c.slug === 'text-field' && type === 'text-field')) continue;
    // Only descendants of the component belong to it. Overlay launchers live
    // outside the component and must never become properties of its anatomy.
    if (!root) continue;
    const nested = root.target
      .split(',')
      .flatMap((parent) =>
        selector.split(',').flatMap((child) => {
          parent = parent.trim();
          child = child.trim();
          // A selector can already carry the required component CSS context.
          // The root itself is not a second nested part of that same control.
          if (child === parent) return [];
          return [
            child.startsWith(`${parent} `) || child.startsWith(`${parent}>`)
              ? child
              : `${parent} ${child}`
          ];
        })
      )
      .join(',');
    if (!nested) continue;
    const part = await scopeFor(html, type, label, partProfile(type, nested), `part-${type}`);
    if (part) scopes.push(part);
  }
  if (c.slug === 'date-picker' && !scopes.some((s) => s.id === 'part-day')) {
    const profile = partProfile('day', '.date-picker-day button[tabindex="0"]');
    scopes.push({
      ...profile,
      selector: profile.target,
      type: 'day',
      label: 'Calendar day',
      id: 'part-day',
      count: 1,
      index: 0,
      props: [],
      instances: [{}],
      states: profile.states,
      initialStates: ['Default']
    });
  }
  const operations = scopes.flatMap((s) =>
    s.instances.flatMap((_, index) => {
      const instance = { ...s, index };
      return [
        ...s.props.flatMap((p) => propertyOperations(instance, p.attr, initialValue(s, p, index))),
        ...stateOperations(instance, s.initialStates[index])
      ];
    })
  );
  html = await operate(html, operations);
  // Static anatomy can differ from live overlay launchers. Never reuse a live
  // instance index or owner path against a separate fixture.
  const staticRoot = await scopeFor(staticHtml, c.slug, c.name, profile, 'root');
  if (staticRoot)
    staticHtml = await operate(
      staticHtml,
      staticRoot.instances.flatMap((_, index) =>
        staticRoot.props.flatMap((p) =>
          propertyOperations({ ...staticRoot, index }, p.attr, initialValue(staticRoot, p, index))
        )
      )
    );
  const slot = slots[c.slug];
  if (slot) {
    html = await operate(html, slotOperations(c.slug, slot.default));
    staticHtml = await operate(staticHtml, slotOperations(c.slug, slot.default));
  }
  return {
    slug: c.slug,
    name: c.name,
    ...(component?.category ? { category: component.category } : {}),
    html,
    staticHtml,
    scopes,
    slot,
    wide: profile.wide || profile.overlay,
    presentation: profile.presentation || false,
    toastActionHtml:
      c.slug === 'toast'
        ? c.specimens.find((s) => s.html.includes('toast-action'))?.html
        : undefined
  };
}

// All independent visual dimensions cross. Exclusions describe dimensions
// whose effect is absent in isolation, not a sampling budget.
export async function matrixRows(model) {
  const root = model.scopes.find((s) => s.id === 'root');
  const rows = [];
  if (model.presentation)
    return [
      {
        label: 'Rendered Markdown',
        html: model.staticHtml,
        scope: root,
        states: ['Default'],
        wide: true
      }
    ];
  const visualProps = (scope) =>
    (scope?.props || []).filter(
      (p) => !nonVisualProps.has(p.attr) && !scope.matrixExcludedProps?.includes(p.attr)
    );
  async function addRows(scope, base, slot, wide) {
    const properties = visualProps(scope);
    if (scope?.exclusive)
      properties.push({ attr: scope.exclusive.attr, values: [null, scope.exclusive.on] });
    const contextProperties = scope?.id !== 'root' ? visualProps(root) : [];
    const dimensions = [
      ...properties.map((p) => p.values.map((value) => ({ property: p, value }))),
      ...contextProperties.map((p) =>
        p.values.map((value) => ({ property: p, value, context: true }))
      ),
      ...(slot ? [slot.values.map((value) => ({ slot: true, value }))] : [])
    ];
    const combinations = dimensions.reduce(
      (all, values) => all.flatMap((prior) => values.map((value) => [...prior, value])),
      [[]]
    );
    for (const combination of combinations) {
      const values = Object.fromEntries(
        combination.filter((v) => v.property && !v.context).map((v) => [v.property.attr, v.value])
      );
      const { ignoredProps } = propertyConstraints(scope, values);
      // Emit one status form, not one duplicate for every ignored neutral variant.
      if (
        ignoredProps.some(
          (attr) => values[attr] !== properties.find((p) => p.attr === attr)?.values[0]
        )
      )
        continue;
      const iconOnly = combination.some(
        (v) => v.property?.attr === 'data-icon-only' && v.value === ''
      );
      const content = combination.find((v) => v.slot)?.value;
      // Icon-only content owns its accessible name; loading/leading content is
      // not independently visible. Layout center/container do not consume gap.
      if (model.slug === 'button' && iconOnly && content !== 'label') continue;
      if (
        model.slug === 'layout' &&
        ['center', 'container'].includes(content) &&
        combination.some((v) => v.property?.attr === 'data-gap' && v.value !== 'md')
      )
        continue;
      let html =
        model.slug === 'toast' && content === 'action' && model.toastActionHtml
          ? model.toastActionHtml
          : base;
      if (slot) html = await operate(html, slotOperations(model.slug, content, iconOnly));
      const statusOnly = model.slug === 'tool-call' && content === 'status-only';
      const activeScope = scope
        ? await scopeFor(
            html,
            scope.type,
            scope.label,
            {
              ...scope,
              ...(statusOnly ? { disclosure: false, states: ['Default'] } : {}),
              props: Object.fromEntries(scope.props.map((p) => [p.attr, p.values]))
            },
            scope.id
          )
        : null;
      const contextScope = contextProperties.length
        ? await scopeFor(
            html,
            root.type,
            root.label,
            { ...root, props: Object.fromEntries(root.props.map((p) => [p.attr, p.values])) },
            root.id
          )
        : null;
      for (const choice of combination)
        if (
          choice.property &&
          activeScope &&
          (choice.context || !ignoredProps.includes(choice.property.attr))
        )
          html = await operate(
            html,
            propertyOperations(
              choice.context ? contextScope : activeScope,
              choice.property.attr,
              choice.value
            )
          );
      const label =
        combination
          .filter((v) => !v.property || v.context || !ignoredProps.includes(v.property.attr))
          .map((v) =>
            v.slot
              ? `${slot.label}: ${v.value}`
              : `${v.context ? `${root.label} ` : ''}${propertyLabel(v.property.attr)}: ${optionLabel(scope.type, v.property.attr, v.value, v.property.values)}`
          )
          .join(' · ') || 'Default';
      rows.push({
        label:
          scope.type === 'avatar-badge'
            ? `${model.name} · ${label}`
            : scope?.id !== 'root'
              ? `${scope.label} · ${label}`
              : label,
        html,
        scope: scope.type === 'avatar-badge' ? root : activeScope || scope,
        states: activeScope?.states?.length ? activeScope.states : ['Default'],
        wide
      });
    }
  }
  if (!(model.slug === 'avatar' && model.scopes.some((s) => s.type === 'avatar-badge')))
    await addRows(root, model.staticHtml, model.slot, model.wide);
  for (const scope of model.scopes.filter((s) => s.id !== 'root' && !standaloneParts.has(s.type))) {
    const base = await isolatePart(model.staticHtml, scope);
    if (base) await addRows(scope, base, scope.type === 'avatar-badge' ? model.slot : null, false);
  }
  // Remove exact duplicates after normalization. State targets are included in
  // the key so distinct interactive parts do not collapse into one another.
  const seen = new Set();
  return rows.filter((row) => {
    const key = JSON.stringify([
      row.html.replace(/>\s+</g, '><').trim(),
      row.states.length > 1 ? row.scope?.target : null,
      row.states
    ]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function isolatePart(html, scope) {
  const { nodes, matches } = await inspect(html, scope.target);
  let chosen = scope.type === 'treeitem' ? matches.at(-1) : matches[0];
  if (!chosen) return null;
  if (scope.type === 'avatar-badge') chosen = chosen.parent;
  const keep = new Set();
  for (let parent = chosen; parent; parent = parent.parent) keep.add(parent.number);
  function descendants(node) {
    keep.add(node.number);
    node.children.forEach(descendants);
  }
  descendants(chosen);
  // Keep accessible names/descriptions with the isolated part, but not the
  // complete controlled panel or the original component's unrelated siblings.
  const labels = ['aria-labelledby', 'aria-describedby', 'aria-errormessage'];
  const byId = new Map(nodes.filter((node) => node.attrs.id).map((node) => [node.attrs.id, node]));
  let previousSize;
  do {
    previousSize = keep.size;
    for (const node of nodes.filter((node) => keep.has(node.number))) {
      for (const attr of labels)
        for (const id of (node.attrs[attr] || '').split(/\s+/)) {
          const reference = byId.get(id);
          if (!reference || keep.has(reference.number)) continue;
          for (let parent = reference; parent; parent = parent.parent) keep.add(parent.number);
          descendants(reference);
        }
    }
  } while (keep.size !== previousSize);
  const retainedIds = new Set(
    nodes.filter((node) => keep.has(node.number)).map((node) => node.attrs.id)
  );
  let index = 0;
  return rewrite(html, [
    [
      '*',
      (el) => {
        if (!keep.has(nodes[index++].number)) {
          el.remove();
          return;
        }
        for (const attr of [
          ...labels,
          'aria-controls',
          'aria-activedescendant',
          'for',
          'headers'
        ]) {
          const value = el.getAttribute(attr);
          if (!value) continue;
          const retained = value
            .split(/\s+/)
            .filter((id) => retainedIds.has(id))
            .join(' ');
          if (retained) el.setAttribute(attr, retained);
          else el.removeAttribute(attr);
        }
      }
    ]
  ]);
}
