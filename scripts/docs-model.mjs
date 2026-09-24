import {
  canonicalHtml,
  rootProfile,
  partDefinitions,
  partProfile,
  propertiesFor,
  slots,
  standaloneParts,
  initialValue,
  propertyLabel,
  optionLabel
} from '../docs/component-model.mjs';
import { nonVisualProps } from '../docs/catalog.mjs';
import {
  propertyOperations,
  contentOperations,
  slotOperations,
  companionSelectors
} from '../docs/model-operations.mjs';

export async function rewrite(html, rules) {
  const r = new HTMLRewriter();
  for (const [selector, element] of rules) r.on(selector, { element });
  return r.transform(new Response(html)).text();
}

// Read the rendered text of the first match. HTMLRewriter exposes text through
// its own handler rather than the element object.
export async function readText(html, selector) {
  let out = '';
  const rewriter = new HTMLRewriter().on(selector, {
    text(chunk) {
      out += chunk.text;
    }
  });
  await rewriter.transform(new Response(html)).text();
  return out.trim();
}

export async function operate(html, operations) {
  // Sequential: multiple handlers on the same element must see prior mutations.
  for (const op of operations) {
    if (op.popover !== undefined) {
      const owner = (await inspect(html, op.selector)).matches[op.index || 0];
      if (!owner) continue;
      html = await operate(html, [
        {
          selector: `${owner.path} .combobox-content`,
          attr: 'data-static-overlay',
          value: op.popover ? '' : null
        },
        {
          selector: `${owner.path} .combobox-content`,
          attr: 'hidden',
          value: op.popover ? null : ''
        },
        ...['.combobox-trigger', '.combobox-search-input'].map((selector) => ({
          selector: `${owner.path} ${selector}`,
          attr: 'aria-expanded',
          value: String(op.popover)
        }))
      ]);
      continue;
    }
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
          if (op.variant !== undefined) {
            // Local Remix classes swap their line/fill suffix in place.
            const cls = (el.getAttribute('class') || '').replace(/-?(?:line|fill)$/, '');
            el.setAttribute('class', `${cls}-${op.variant}`);
            el.setAttribute('data-icon-variant', op.variant);
          }
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

async function scopeFor(html, type, label, profile, id) {
  const inspected = await inspect(html, profile.target);
  const matches = inspected.matches.map((n) => n.attrs);
  if (!matches.length) return null;
  // Record local availability before a composed owner applies inherited state.
  // These paths are compiled separately for live and static anatomy.
  const authoredDisabled = inspected.matches.map((owner) =>
    inspected.nodes.flatMap((node) => {
      if (
        !['input', 'select', 'textarea', 'button', 'fieldset'].includes(node.tag) ||
        node.attrs.disabled === undefined
      )
        return [];
      // These hidden fallback values are controller-owned, not targets of the
      // group's visible-control disabled propagation.
      if (['time-field', 'input-otp'].includes(type) && node.attrs.type === 'hidden') return [];
      for (let parent = node.parent; parent; parent = parent.parent)
        if (parent === owner)
          return [
            {
              selector: node.path,
              value: node.attrs.disabled,
              ...(type === 'tag-input' && node.classes.includes('tag-input-fallback')
                ? { mirrors: '.tag-input-control,.tag-input-remove' }
                : type === 'color-picker' && node.attrs.type === 'color'
                  ? { mirrors: '.color-picker-hex' }
                  : {})
            }
          ];
      return [];
    })
  );
  const props = (profile.resolved ? profile.props : propertiesFor(profile)).map((property) => {
    const initialValues = matches.map((attrs, index) => {
      // A Field represents its actual native controls. Preserve authored native
      // constraints when introducing the documentation readback marker; never
      // infer a group's state from its first incidental action.
      if (
        ['field', 'form-field'].includes(type) &&
        property.attr === `data-${property.name}` &&
        attrs[property.attr] === undefined
      ) {
        const owner = inspected.matches[index];
        const controls = inspected.nodes.filter((node) => {
          if (!['input', 'select', 'textarea'].includes(node.tag) || node.attrs.type === 'hidden')
            return false;
          for (let parent = node.parent; parent; parent = parent.parent)
            if (parent === owner) return true;
          return false;
        });
        const nativeAttr = property.name === 'invalid' ? 'aria-invalid' : property.name;
        if (
          controls.length &&
          controls.every((node) =>
            property.name === 'invalid'
              ? node.attrs[nativeAttr] === 'true'
              : node.attrs[nativeAttr] !== undefined
          )
        )
          return property.on;
      }
      return initialValue({ ...profile, instances: matches }, property, index);
    });
    return { ...property, default: initialValues[0], initialValues };
  });
  let companions;
  if (companionSelectors[type]) {
    const owners = inspected.matches.map((node) => {
      if (!['number-field', 'text-field'].includes(type)) return node;
      for (let parent = node.parent; parent; parent = parent.parent)
        if (parent.classes.includes(type)) return parent;
      return node;
    });
    companions = matches.map(() =>
      Object.fromEntries(companionSelectors[type].map((selector) => [selector, []]))
    );
    for (const selector of companionSelectors[type]) {
      for (const [childIndex, child] of (await inspect(html, selector)).matches.entries()) {
        if (type === 'label') {
          const index = owners.findIndex(
            (owner) => owner.attrs.for && owner.attrs.for === child.attrs.id
          );
          if (index >= 0) companions[index][selector].push(childIndex);
          continue;
        }
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
  return {
    ...profile,
    matrix: profile.matrix,
    content: profile.content,
    props,
    selector: profile.target,
    instanceSelectors: inspected.matches.map((n) => n.path),
    authoredDisabled,
    ...(companions ? { companionIndices: companions } : {}),
    type,
    label: label.toLowerCase(),
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
  if (root?.textFields) {
    const initial = {};
    for (const field of root.textFields) initial[field.name] = await readText(html, field.selector);
    root.textFields = root.textFields.map((field) => ({
      ...field,
      initial: initial[field.name] ?? ''
    }));
  }
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
    // A composed root owns constraints once. Keep independent selection and
    // nested field constraints where the outer form does not own that state.
    if (part) {
      const owned = new Set(
        root.props
          .filter((p) => ['disabled', 'invalid', 'readonly', 'required'].includes(p.name))
          .map((p) => p.name)
      );
      part.props = part.props.filter((p) => !owned.has(p.name));
      if (['date-picker', 'carousel'].includes(c.slug) && type === 'button') part.props = [];
    }
    if (part) scopes.push(part);
  }
  const fieldScope = scopes.find((s) => s.type === 'form-field');
  if (fieldScope) {
    for (const scope of scopes.filter((s) => s.id !== 'root' && s !== fieldScope)) {
      const nodes = (await inspect(html, scope.target)).matches;
      if (
        nodes.length &&
        nodes.every((node) => {
          for (let parent = node.parent; parent; parent = parent.parent)
            if (parent.classes.includes('form-field')) return true;
          return false;
        })
      )
        scope.props = scope.props.filter(
          (p) =>
            !fieldScope.props.some(
              (owner) =>
                owner.name === p.name && ['disabled', 'invalid', 'required'].includes(p.name)
            )
        );
    }
  }
  // Native leaf defaults preserve authored state; composed owners apply last,
  // including their off state, so the initial document agrees with its controls.
  const applyInitial = (scope, instance, property) => {
    const value = initialValue(scope, property, instance);
    if (
      property.kind === 'boolean' &&
      value === null &&
      !property.attr?.startsWith('data-') &&
      !['time-field', 'date-range-picker', 'input-otp'].includes(scope.type)
    )
      return [];
    return propertyOperations({ ...scope, index: instance }, property, value);
  };
  const operations = [...scopes]
    .reverse()
    .flatMap((s) =>
      s.instances.flatMap((_, index) => s.props.flatMap((p) => applyInitial(s, index, p)))
    );
  html = await operate(html, operations);
  // Static anatomy can differ from live overlay launchers. Never reuse a live
  // instance index or owner path against a separate fixture.
  const staticRoot = await scopeFor(staticHtml, c.slug, c.name, profile, 'root');
  const staticDisabledDefaults = {};
  if (staticRoot) {
    const staticScopes = [staticRoot];
    for (const scope of scopes.filter((s) => s.id !== 'root')) {
      const part = await scopeFor(
        staticHtml,
        scope.type,
        scope.label,
        partProfile(scope.type, scope.target),
        scope.id
      );
      if (!part) continue;
      part.props = part.props.filter((p) => scope.props.some((live) => live.name === p.name));
      staticScopes.push(part);
    }
    for (const scope of staticScopes) staticDisabledDefaults[scope.id] = scope.authoredDisabled;
    staticHtml = await operate(
      staticHtml,
      staticScopes
        .reverse()
        .flatMap((scope) =>
          scope.instances.flatMap((_, index) =>
            scope.props.flatMap((p) => applyInitial(scope, index, p))
          )
        )
    );
  }
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
    staticDisabledDefaults,
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

// The matrix crosses a bounded, per-component list of dimensions. A component
// without an explicit `matrix` crosses its visual enum properties; booleans are
// opt-in so a component can never explode into an accidental cross-product.
export async function matrixRows(model) {
  const root = model.scopes.find((s) => s.id === 'root');
  const rows = [];
  if (model.presentation)
    return [{ label: 'rendered markdown', html: model.staticHtml, scope: root, wide: true }];
  const visualEnums = (scope) =>
    (scope?.props || []).filter(
      (p) => (p.kind === 'enum' || p.presence) && !nonVisualProps.has(p.attr)
    );
  const byName = (scope, name) => (scope?.props || []).find((p) => p.name === name);
  function dimensionsFor(scope) {
    // An explicit matrix drives the export. `prop` and `bool` name properties;
    // `content` uses the shared action content set; `slot` is the structural slot.
    if (scope.matrix) {
      return scope.matrix.flatMap((d) => {
        if (d.prop) {
          const property = byName(scope, d.prop);
          return property ? [{ kind: 'prop', property }] : [];
        }
        if (d.bool) {
          const property = byName(scope, d.bool);
          return property ? [{ kind: 'bool', property, when: d.when }] : [];
        }
        if (d.content && scope.content) return [{ kind: 'content' }];
        if (d.slot && model.slot) return [{ kind: 'slot' }];
        return [];
      });
    }
    return visualEnums(scope).map((property) => ({ kind: 'prop', property }));
  }
  async function addRows(scope, base, slot, wide) {
    const dimensions = dimensionsFor(scope);
    if (scope?.exclusive)
      dimensions.push({
        kind: 'prop',
        property: {
          attr: scope.exclusive.attr,
          name: scope.exclusive.attr,
          values: [null, scope.exclusive.on],
          kind: 'enum'
        }
      });
    if (slot && !dimensions.some((d) => d.kind === 'slot')) dimensions.push({ kind: 'slot' });
    const choicesFor = (dimension) => {
      if (dimension.kind === 'content')
        return Object.entries(scope.content).map(([id, state]) => ({ content: id, state }));
      if (dimension.kind === 'slot') return slot.values.map((value) => ({ slot: value }));
      const property = dimension.property;
      return property.values.map((value) => ({ property, value }));
    };
    const combinations = dimensions.reduce(
      (all, dimension) => all.flatMap((prior) => choicesFor(dimension).map((c) => [...prior, c])),
      [[]]
    );
    // Uncrossed booleans get compact off/on representatives rather than a
    // Cartesian product. Content controls use their named combinations instead.
    const baseline = dimensions.map((d) => choicesFor(d)[0]);
    if (scope.content && !dimensions.some((d) => d.kind === 'content')) {
      for (const [content, state] of Object.entries(scope.content))
        combinations.push([...baseline, { content, state }]);
      const pressed = byName(scope, 'pressed');
      if (pressed && scope.content['icon only'])
        combinations.push([
          ...baseline.filter((choice) => choice.property !== pressed),
          { property: pressed, value: pressed.on },
          { content: 'icon only', state: scope.content['icon only'] }
        ]);
    }
    for (const property of scope.props.filter(
      (p) =>
        p.kind === 'boolean' &&
        p.attr &&
        !nonVisualProps.has(p.attr) &&
        !dimensions.some((d) => d.property === p)
    ))
      for (const value of property.values) combinations.push([...baseline, { property, value }]);
    const propertyValue = (combination, name) =>
      combination.find((c) => c.property?.name === name)?.value;
    const scopeValues = Object.fromEntries(scope.props.map((p) => [p.name, p.default]));
    for (const combination of combinations) {
      const values = { ...scopeValues };
      for (const choice of combination)
        if (choice.property) values[choice.property.name] = choice.value;
      // A gated dimension only applies when its `when` values hold.
      // A primitive that does not consume gap never crosses a gap value.
      if (
        model.slug === 'layout' &&
        ['center', 'container', 'split'].includes(combination.find((c) => c.slot)?.slot) &&
        combination.some((c) => c.property?.name === 'data-gap' && c.value !== 'md')
      )
        continue;
      const gatedOut = combination.some(
        (c) =>
          c.property &&
          c.value !== c.property.values[0] &&
          dimensions.find((d) => d.property === c.property)?.when &&
          !Object.entries(dimensions.find((d) => d.property === c.property).when).every(
            ([name, allowed]) => allowed.includes(propertyValue(combination, name))
          )
      );
      if (gatedOut) continue;
      let html =
        model.slug === 'toast' &&
        combination.find((c) => c.slot === 'action') &&
        model.toastActionHtml
          ? model.toastActionHtml
          : base;
      const contentChoice = combination.find((c) => c.content);
      if (slot)
        html = await operate(
          html,
          slotOperations(
            model.slug,
            contentChoice?.content ?? combination.find((c) => c.slot)?.slot,
            contentChoice?.state || {}
          )
        );
      const activeScope = scope
        ? await scopeFor(html, scope.type, scope.label, { ...scope, resolved: true }, scope.id)
        : null;
      // Do not mistake the inherited state in normalized markup for local
      // authored state when rendering the owner's off representative.
      if (activeScope)
        activeScope.authoredDisabled =
          model.staticDisabledDefaults?.[scope.id] || scope.authoredDisabled;
      for (const choice of combination) {
        if (!choice.property || !activeScope) continue;
        if (
          model.slug === 'tool-call' &&
          combination.some((c) => c.slot === 'status-only') &&
          choice.property.name === 'open'
        )
          continue;
        html = await operate(html, propertyOperations(activeScope, choice.property, choice.value));
      }
      if (scope.content)
        html = await operate(
          html,
          contentOperations(activeScope, {
            ...contentChoice?.state,
            loading: values.loading === 'true'
          })
        );
      const label =
        combination
          .map((c) =>
            c.content
              ? `content: ${c.content}`
              : c.slot
                ? `${slot.label}: ${c.slot}`
                : `${propertyLabel(c.property.name)}: ${optionLabel(scope.type, c.property.name, c.value, c.property.values, c.property.kind)}`
          )
          .join(' · ') || 'default';
      rows.push({
        label:
          scope.type === 'avatar-badge'
            ? `${model.name.toLowerCase()} · ${label}`
            : scope?.id !== 'root'
              ? `${scope.label} · ${label}`
              : label,
        html,
        scope: activeScope || scope,
        wide
      });
    }
  }
  if (!(model.slug === 'avatar' && model.scopes.some((s) => s.type === 'avatar-badge')))
    await addRows(root, model.staticHtml, model.slot, model.wide);
  for (const scope of model.scopes.filter(
    (s) => s.id !== 'root' && !standaloneParts.has(s.type) && (s.props.length || s.exclusive)
  )) {
    const base = await isolatePart(model.staticHtml, scope);
    if (base) await addRows(scope, base, scope.type === 'avatar-badge' ? model.slot : null, false);
  }
  // Remove exact duplicates after normalization.
  const seen = new Set();
  return rows.filter((row) => {
    const key = JSON.stringify([row.html.replace(/>\s+</g, '><').trim()]);
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
