function defaultDocument() {
  return typeof document === 'undefined' ? null : document;
}

export function queryAll(root, selector) {
  const scope = root || defaultDocument();
  if (!scope) return [];

  const matches = [];
  if (scope.nodeType === 1 && scope.matches?.(selector)) matches.push(scope);
  if (typeof scope.querySelectorAll === 'function')
    matches.push(...scope.querySelectorAll(selector));
  return matches;
}

// Records the authored value of every attribute a module writes, so teardown
// can restore the baseline and leave an application edit alone. One owner per
// generated attribute, shared by every behavior that writes one.
export function attributeSnapshot() {
  const saved = new Map();
  const set = (element, name, value) => {
    if (!saved.has(element)) saved.set(element, new Map());
    const attributes = saved.get(element);
    if (!attributes.has(name)) attributes.set(name, { original: element.getAttribute(name) });
    attributes.get(name).current = value;
    if (value === null) element.removeAttribute(name);
    else element.setAttribute(name, value);
  };
  const restore = () => {
    for (const [element, attributes] of saved) {
      for (const [name, { original, current }] of attributes) {
        if (element.getAttribute(name) !== current) continue;
        if (original === null) element.removeAttribute(name);
        else element.setAttribute(name, original);
      }
    }
  };
  return { set, restore };
}

const tabIndexWriter = Symbol.for('mewa.tabindex-owner');
let acquisition = null;

// Nested composites transfer roving tab stops before capturing a new baseline.
// Later application writes become the next restoration baseline.
export function createTabIndexOwner() {
  const saved = new Map();
  const release = (element) => {
    const state = saved.get(element);
    if (!state) return;
    if (element.getAttribute('tabindex') === state.current) {
      if (state.original === null) element.removeAttribute('tabindex');
      else element.setAttribute('tabindex', state.original);
    }
    saved.delete(element);
    if (element[tabIndexWriter] === release) delete element[tabIndexWriter];
  };
  return {
    set(element, value) {
      if (element[tabIndexWriter] !== release) {
        element[tabIndexWriter]?.(element);
        saved.set(element, { original: element.getAttribute('tabindex') });
        element[tabIndexWriter] = release;
      }
      const state = saved.get(element);
      if (state.current !== undefined && element.getAttribute('tabindex') !== state.current)
        state.original = element.getAttribute('tabindex');
      state.current = value;
      element.setAttribute('tabindex', value);
    },
    releaseExcept(elements) {
      const retained = new Set(elements);
      for (const element of saved.keys()) if (!retained.has(element)) release(element);
    },
    restore() {
      for (const element of saved.keys()) release(element);
    }
  };
}

// Explicit ownership keeps document/form listeners attached to their component,
// even when the listener target lives outside the enhanced subtree.
export function createLifecycle(name) {
  const instances = new Map();
  const updates = new WeakMap();
  const captures = new WeakMap();
  const marker = `data-mewa-${name}-init`;
  function add(owner, cleanup) {
    let cleanups = instances.get(owner);
    if (!cleanups) {
      instances.set(owner, (cleanups = []));
      const context = acquisition;
      if (context && (owner === context.root || context.root.contains?.(owner))) {
        const dispose = () => disposeOwner(owner, cleanups);
        context.disposers.add(dispose);
        captures.set(cleanups, () => context.disposers.delete(dispose));
      }
    }
    cleanups.push(cleanup);
    return cleanup;
  }
  function listen(owner, target, type, listener, options) {
    if (!target) return;
    target.addEventListener(type, listener, options);
    add(owner, () => target.removeEventListener(type, listener, options));
  }
  function disposeOwner(owner, cleanups) {
    if (instances.get(owner) !== cleanups) return;
    instances.delete(owner);
    captures.get(cleanups)?.();
    captures.delete(cleanups);
    const errors = [];
    for (const cleanup of cleanups.reverse()) {
      try {
        cleanup();
      } catch (error) {
        errors.push(error);
      }
    }
    // Cleanup may mount a replacement generation on the same node.
    if (!instances.has(owner)) {
      owner.removeAttribute?.(marker);
      const markers = owner.getAttributeNames?.() || [];
      if (
        !markers.some((attribute) =>
          /^data-(?:mewa-.+|hover-card|context-menu)-init$/.test(attribute)
        )
      ) {
        owner.removeAttribute?.('data-init');
      }
    }
    if (errors.length) throw new AggregateError(errors, `Failed to dispose ${name}`);
  }
  function destroy(root) {
    const errors = [];
    // A cleanup may mount a replacement; this disposal owns the prior batch.
    const batch = Array.from(instances);
    for (const [owner, cleanups] of batch) {
      if (owner !== root && !root?.contains?.(owner)) continue;
      try {
        disposeOwner(owner, cleanups);
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length) throw new AggregateError(errors, `Failed to dispose ${name}`);
  }
  function reset(owner, form, callback) {
    if (!form) return;
    const pending = new Set();
    listen(owner, form, 'reset', (event) => {
      // Trusted dispatch can run microtasks between listeners, before a later
      // cancellation or the native reset action. A task observes the result.
      const timer = setTimeout(() => {
        pending.delete(timer);
        if (!event.defaultPrevented && instances.has(owner)) callback();
      }, 0);
      pending.add(timer);
    });
    add(owner, () => {
      for (const timer of pending) clearTimeout(timer);
      pending.clear();
    });
  }
  function onUpdate(owner, callback) {
    const registration = { callback };
    updates.set(owner, registration);
    add(owner, () => {
      if (updates.get(owner) === registration) updates.delete(owner);
    });
  }
  function refresh(root = defaultDocument(), ancestors = true) {
    for (const owner of instances.keys()) {
      if (owner === root || root?.contains?.(owner) || (ancestors && owner.contains?.(root)))
        updates.get(owner)?.callback();
    }
  }
  return { add, listen, destroy, reset, onUpdate, refresh, has: (owner) => instances.has(owner) };
}

export function createController(behavior, root, options) {
  if (!behavior || typeof behavior.enhance !== 'function') {
    throw new TypeError('A Mewa behavior with an enhance function is required.');
  }
  if (!root) throw new TypeError('A root element is required.');

  const lease = acquireBehavior(behavior, root, options);
  let active = true;

  return {
    element: root,
    update(nextOptions) {
      if (!active) return;
      lease.update(nextOptions);
    },
    destroy() {
      if (!active) return;
      active = false;
      lease.destroy();
    }
  };
}

const leases = new WeakMap();

function enhanceLease(behavior, root, options, entry) {
  const previous = acquisition;
  // Dependency compositions acquire their own innermost leases. Never capture
  // their generations into an outer owner and bypass their reference counts.
  acquisition = { root, disposers: entry.disposers };
  try {
    return behavior.enhance(root, options);
  } finally {
    acquisition = previous;
  }
}

function disposeLease(behavior, root, entry) {
  const errors = [];
  try {
    behavior.destroy?.(root, entry.state);
  } catch (error) {
    errors.push(error);
  }
  // Live containment cannot find a child removed after acquisition. Dispose
  // only captured generations; normal cleanup disarms their records eagerly.
  for (const dispose of [...entry.disposers].reverse()) {
    try {
      dispose();
    } catch (error) {
      errors.push(error);
    }
  }
  entry.disposers.clear();
  if (errors.length === 1) throw errors[0];
  if (errors.length) throw new AggregateError(errors, 'Behavior cleanup failed');
}

// Generated dependency compositions share the raw behavior and its lifetime.
export function acquireBehavior(behavior, root, options) {
  let roots = leases.get(behavior);
  if (!roots) leases.set(behavior, (roots = new WeakMap()));
  let entry = roots.get(root);
  if (!entry) {
    entry = { count: 0, options, state: undefined, disposers: new Set() };
    try {
      entry.state = enhanceLease(behavior, root, options, entry);
    } catch (error) {
      try {
        disposeLease(behavior, root, entry);
      } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], 'Behavior setup and rollback failed');
      }
      throw error;
    }
    roots.set(root, entry);
  }
  entry.count += 1;
  let active = true;
  return {
    get state() {
      return entry.state;
    },
    update(nextOptions = entry.options) {
      if (!active) return;
      entry.state = enhanceLease(behavior, root, nextOptions, entry) ?? entry.state;
      entry.options = nextOptions;
    },
    destroy() {
      if (!active) return;
      active = false;
      if (--entry.count) return;
      roots.delete(root);
      disposeLease(behavior, root, entry);
    }
  };
}
