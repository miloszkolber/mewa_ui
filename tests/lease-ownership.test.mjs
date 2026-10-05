import assert from 'node:assert/strict';

// A mutable containment tree, not a DOM/observer simulation. Listener assertions
// use real EventTarget dispatch; browser tests own actual component observers.
class OwnershipNode extends EventTarget {
  parentNode = null;
  children = [];
  attributes = new Map();

  append(...nodes) {
    for (const node of nodes) {
      node.remove();
      node.parentNode = this;
      this.children.push(node);
    }
  }

  remove() {
    if (!this.parentNode) return;
    const siblings = this.parentNode.children;
    siblings.splice(siblings.indexOf(this), 1);
    this.parentNode = null;
  }

  contains(node) {
    for (let current = node; current; current = current.parentNode) {
      if (current === this) return true;
    }
    return false;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  getAttributeNames() {
    return [...this.attributes.keys()];
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }
}

function ownListener(lifecycle, owner, target, label, events, cleaned) {
  lifecycle.listen(owner, target, 'lease-probe', () => events.push(label));
  lifecycle.add(owner, () => cleaned.push(label));
}

function dispatch(target, events) {
  events.length = 0;
  target.dispatchEvent(new Event('lease-probe'));
  return [...events];
}

function causes(error) {
  return error instanceof AggregateError ? error.errors.flatMap(causes) : [error];
}

// The package contract supplies the packaged runtime. An isolated runner can
// supply source or a regression baseline without writing shared build output.
export async function runLeaseOwnershipTests(runtime, test) {
  const { createController, createLifecycle, acquireBehavior } = runtime;

  await test('final root lease releases detached children without ending a sibling controller', () => {
    const lifecycle = createLifecycle('lease-siblings');
    const documentNode = new OwnershipNode();
    const firstRoot = new OwnershipNode();
    const secondRoot = new OwnershipNode();
    const firstChild = new OwnershipNode();
    const secondChild = new OwnershipNode();
    documentNode.append(firstRoot, secondRoot);
    firstRoot.append(firstChild);
    secondRoot.append(secondChild);
    const events = [];
    const cleaned = [];
    let mounts = 0;
    const behavior = {
      name: 'lease-siblings',
      enhance(scope) {
        mounts += 1;
        for (const child of scope.children)
          if (!lifecycle.has(child))
            ownListener(
              lifecycle,
              child,
              documentNode,
              child === firstChild ? 'first' : 'second',
              events,
              cleaned
            );
      },
      destroy: (scope) => lifecycle.destroy(scope)
    };
    const first = createController(behavior, firstRoot);
    const shared = createController(behavior, firstRoot);
    const sibling = createController(behavior, secondRoot);
    assert.equal(mounts, 2, 'same-root controllers share setup; sibling roots do not');
    firstChild.remove();
    firstRoot.remove();
    assert.equal(firstRoot.contains(firstChild), false, 'the removed child is truly detached');
    assert.deepEqual(dispatch(documentNode, events), ['first', 'second']);
    first.destroy();
    first.update();
    assert.equal(mounts, 2, 'a released controller cannot update its surviving lease');
    assert.deepEqual(cleaned, [], 'an intermediate release must retain the detached owner');
    assert.deepEqual(dispatch(documentNode, events), ['first', 'second']);
    shared.destroy();
    shared.destroy();
    assert.equal(lifecycle.has(firstChild), false);
    assert.equal(lifecycle.has(secondChild), true);
    assert.deepEqual(cleaned, ['first']);
    assert.deepEqual(dispatch(documentNode, events), ['second']);
    sibling.destroy();
    assert.deepEqual(cleaned, ['first', 'second']);
    assert.deepEqual(dispatch(documentNode, events), []);
  });

  await test('element acquisition does not capture a document-owned listener', () => {
    const lifecycle = createLifecycle('lease-document');
    const documentNode = new OwnershipNode();
    const root = new OwnershipNode();
    const child = new OwnershipNode();
    documentNode.append(root);
    root.append(child);
    const events = [];
    const cleaned = [];
    const controller = createController(
      {
        name: 'lease-document',
        enhance() {
          ownListener(lifecycle, documentNode, documentNode, 'document', events, cleaned);
          ownListener(lifecycle, child, documentNode, 'child', events, cleaned);
        }
      },
      root
    );
    child.remove();
    controller.destroy();
    assert.equal(lifecycle.has(child), false);
    assert.equal(lifecycle.has(documentNode), true);
    assert.deepEqual(cleaned, ['child']);
    assert.deepEqual(dispatch(documentNode, events), ['document']);
    lifecycle.destroy(documentNode);
    assert.deepEqual(cleaned, ['child', 'document']);
    assert.deepEqual(dispatch(documentNode, events), []);
  });

  await test('controller update acquires new generations after earlier children detach', () => {
    const lifecycle = createLifecycle('lease-update');
    const root = new OwnershipNode();
    const firstChild = new OwnershipNode();
    const secondChild = new OwnershipNode();
    const target = new EventTarget();
    const events = [];
    const cleaned = [];
    const optionsSeen = [];
    const behavior = {
      name: 'lease-update',
      enhance(scope, options) {
        optionsSeen.push(options);
        for (const child of scope.children)
          if (!lifecycle.has(child))
            ownListener(
              lifecycle,
              child,
              target,
              child === firstChild ? 'first' : 'second',
              events,
              cleaned
            );
      }
    };
    root.append(firstChild);
    const controller = createController(behavior, root, 'initial');
    firstChild.remove();
    root.append(secondChild);
    controller.update('updated');
    controller.update('idempotent');
    secondChild.remove();
    assert.deepEqual(optionsSeen, ['initial', 'updated', 'idempotent']);
    assert.deepEqual(dispatch(target, events), ['first', 'second']);
    controller.destroy();
    assert.deepEqual(cleaned, ['second', 'first']);
    assert.equal(lifecycle.has(firstChild), false);
    assert.equal(lifecycle.has(secondChild), false);
    assert.deepEqual(dispatch(target, events), []);
  });

  await test('nested dependency acquisition retains the raw lease until its final owner ends', () => {
    const dependencyLifecycle = createLifecycle('lease-dependency');
    const outerLifecycle = createLifecycle('lease-composition');
    const root = new OwnershipNode();
    const before = new OwnershipNode();
    const dependencyChild = new OwnershipNode();
    const after = new OwnershipNode();
    root.append(before, dependencyChild, after);
    const target = new EventTarget();
    const events = [];
    const cleaned = [];
    let dependencyLease;
    let dependencyMounts = 0;
    const dependency = {
      name: 'lease-dependency',
      enhance() {
        dependencyMounts += 1;
        ownListener(dependencyLifecycle, dependencyChild, target, 'raw', events, cleaned);
      },
      destroy: (scope) => dependencyLifecycle.destroy(scope)
    };
    const outer = createController(
      {
        name: 'lease-composition',
        enhance(scope) {
          ownListener(outerLifecycle, before, target, 'before', events, cleaned);
          dependencyLease = acquireBehavior(dependency, scope);
          ownListener(outerLifecycle, after, target, 'after', events, cleaned);
        },
        destroy: () => dependencyLease.destroy()
      },
      root
    );
    const raw = acquireBehavior(dependency, root);
    assert.equal(dependencyMounts, 1);
    before.remove();
    dependencyChild.remove();
    after.remove();
    outer.destroy();
    assert.deepEqual(cleaned, ['after', 'before']);
    assert.equal(dependencyLifecycle.has(dependencyChild), true);
    assert.deepEqual(dispatch(target, events), ['raw']);
    raw.destroy();
    raw.destroy();
    assert.deepEqual(cleaned, ['after', 'before', 'raw']);
    assert.equal(dependencyLifecycle.has(dependencyChild), false);
    assert.deepEqual(dispatch(target, events), []);
  });

  await test('normally released captures do not dispose a replacement or its unrelated nested owner', () => {
    const lifecycle = createLifecycle('lease-replacement');
    const root = new OwnershipNode();
    const owner = new OwnershipNode();
    const nested = new OwnershipNode();
    root.append(owner);
    owner.append(nested);
    const target = new EventTarget();
    const events = [];
    const cleaned = [];
    const controller = createController(
      {
        name: 'lease-replacement',
        enhance: () => ownListener(lifecycle, owner, target, 'old', events, cleaned)
      },
      root
    );
    lifecycle.destroy(owner);
    lifecycle.destroy(owner);
    ownListener(lifecycle, owner, target, 'replacement', events, cleaned);
    ownListener(lifecycle, nested, target, 'unrelated', events, cleaned);
    owner.remove();
    controller.destroy();
    assert.deepEqual(cleaned, ['old'], 'released generations are never cleaned twice');
    assert.equal(lifecycle.has(owner), true);
    assert.equal(lifecycle.has(nested), true);
    assert.deepEqual(dispatch(target, events), ['replacement', 'unrelated']);
    lifecycle.destroy(owner);
    assert.deepEqual(cleaned, ['old', 'replacement', 'unrelated']);
    assert.deepEqual(dispatch(target, events), []);
  });

  await test('a stale capture in the release snapshot cannot dispose a replacement generation', () => {
    const lifecycle = createLifecycle('lease-stale-capture');
    const root = new OwnershipNode();
    const owner = new OwnershipNode();
    const trigger = new OwnershipNode();
    const nested = new OwnershipNode();
    root.append(owner, trigger);
    owner.append(nested);
    const target = new EventTarget();
    const events = [];
    const cleaned = [];
    const controller = createController(
      {
        name: 'lease-stale-capture',
        enhance() {
          ownListener(lifecycle, owner, target, 'old', events, cleaned);
          ownListener(lifecycle, trigger, target, 'trigger', events, cleaned);
          lifecycle.add(trigger, () => {
            lifecycle.destroy(owner);
            ownListener(lifecycle, owner, target, 'replacement', events, cleaned);
            ownListener(lifecycle, nested, target, 'unrelated', events, cleaned);
          });
        }
      },
      root
    );
    owner.remove();
    trigger.remove();
    controller.destroy();
    assert.deepEqual(cleaned, ['old', 'trigger'], 'the stale snapshot must not rerun old cleanup');
    assert.equal(lifecycle.has(owner), true);
    assert.equal(lifecycle.has(nested), true);
    assert.deepEqual(dispatch(target, events), ['replacement', 'unrelated']);
    lifecycle.destroy(owner);
    assert.deepEqual(cleaned, ['old', 'trigger', 'replacement', 'unrelated']);
    assert.deepEqual(dispatch(target, events), []);
  });

  await test('capture cleanup preserves generations remounted by a cleanup callback', () => {
    const lifecycle = createLifecycle('lease-remount');
    const root = new OwnershipNode();
    const owner = new OwnershipNode();
    const nested = new OwnershipNode();
    root.append(owner);
    owner.append(nested);
    const target = new EventTarget();
    const events = [];
    const cleaned = [];
    const marker = 'data-mewa-lease-remount-init';
    const refreshed = { old: 0, replacement: 0 };
    const controller = createController(
      {
        name: 'lease-remount',
        enhance() {
          ownListener(lifecycle, owner, target, 'old', events, cleaned);
          lifecycle.onUpdate(owner, () => refreshed.old++);
          lifecycle.add(owner, () => {
            ownListener(lifecycle, owner, target, 'replacement', events, cleaned);
            lifecycle.onUpdate(owner, () => refreshed.replacement++);
            ownListener(lifecycle, nested, target, 'nested', events, cleaned);
            owner.setAttribute(marker, '');
            owner.setAttribute('data-init', '');
          });
        }
      },
      root
    );
    lifecycle.refresh(owner, false);
    assert.deepEqual(refreshed, { old: 1, replacement: 0 });
    owner.remove();
    controller.destroy();
    controller.destroy();
    assert.deepEqual(cleaned, ['old']);
    assert.equal(lifecycle.has(owner), true);
    assert.equal(lifecycle.has(nested), true);
    assert.equal(owner.getAttribute(marker), '', 'old cleanup must retain replacement readiness');
    assert.equal(owner.getAttribute('data-init'), '');
    lifecycle.refresh(owner, false);
    assert.deepEqual(
      refreshed,
      { old: 1, replacement: 1 },
      'old update cleanup must not erase the replacement callback'
    );
    assert.deepEqual(dispatch(target, events), ['replacement', 'nested']);
    lifecycle.destroy(owner);
    assert.deepEqual(cleaned, ['old', 'replacement', 'nested']);
    assert.equal(owner.getAttribute(marker), null);
    assert.equal(owner.getAttribute('data-init'), null);
    lifecycle.refresh(owner, false);
    assert.deepEqual(refreshed, { old: 1, replacement: 1 });
    assert.deepEqual(dispatch(target, events), []);
  });

  await test('controller capture leaves pre-existing and later unacquired owners alone', () => {
    const lifecycle = createLifecycle('lease-unacquired');
    const root = new OwnershipNode();
    const existing = new OwnershipNode();
    const acquired = new OwnershipNode();
    const later = new OwnershipNode();
    root.append(existing, acquired, later);
    const target = new EventTarget();
    const events = [];
    const cleaned = [];
    ownListener(lifecycle, existing, target, 'existing', events, cleaned);
    const controller = createController(
      {
        name: 'lease-unacquired',
        enhance() {
          if (!lifecycle.has(existing))
            ownListener(lifecycle, existing, target, 'existing', events, cleaned);
          ownListener(lifecycle, acquired, target, 'acquired', events, cleaned);
        }
      },
      root
    );
    ownListener(lifecycle, later, target, 'later', events, cleaned);
    controller.destroy();
    assert.deepEqual(cleaned, ['acquired']);
    assert.equal(lifecycle.has(existing), true);
    assert.equal(lifecycle.has(later), true);
    assert.deepEqual(dispatch(target, events), ['existing', 'later']);
    lifecycle.destroy(root);
    assert.deepEqual(cleaned, ['acquired', 'existing', 'later']);
    assert.deepEqual(dispatch(target, events), []);
  });

  await test('a replacement generation may reuse the previous update callback', () => {
    const lifecycle = createLifecycle('lease-stable-update');
    const root = new OwnershipNode();
    const owner = new OwnershipNode();
    root.append(owner);
    const marker = 'data-mewa-lease-stable-update-init';
    let refreshed = 0;
    const update = () => refreshed++;
    const controller = createController(
      {
        name: 'lease-stable-update',
        enhance() {
          lifecycle.onUpdate(owner, update);
          lifecycle.add(owner, () => {
            lifecycle.onUpdate(owner, update);
            owner.setAttribute(marker, '');
          });
        }
      },
      root
    );
    owner.remove();
    controller.destroy();
    assert.equal(lifecycle.has(owner), true);
    assert.equal(owner.getAttribute(marker), '');
    lifecycle.refresh(owner, false);
    assert.equal(
      refreshed,
      1,
      'callback identity must not conflate old and replacement generations'
    );
    lifecycle.destroy(owner);
    lifecycle.refresh(owner, false);
    assert.equal(refreshed, 1);
  });

  await test('failed cleanup attempts every hook and captured callback and aggregates their errors', () => {
    const lifecycle = createLifecycle('lease-errors');
    const root = new OwnershipNode();
    const first = new OwnershipNode();
    const second = new OwnershipNode();
    root.append(first, second);
    const target = new EventTarget();
    const events = [];
    const cleaned = [];
    const calls = [];
    const hookError = new Error('destroy hook');
    const firstError = new Error('first callback');
    const secondError = new Error('second callback');
    const lastError = new Error('last callback');
    let fail = true;
    const cleanup = (label, error) => () => {
      calls.push(label);
      if (fail) throw error;
    };
    const behavior = {
      name: 'lease-errors',
      enhance() {
        ownListener(lifecycle, first, target, 'first', events, cleaned);
        lifecycle.add(first, cleanup('first', firstError));
        lifecycle.add(first, cleanup('last', lastError));
        ownListener(lifecycle, second, target, 'second', events, cleaned);
        lifecycle.add(second, cleanup('second', secondError));
      },
      destroy: cleanup('hook', hookError)
    };
    const controller = createController(behavior, root);
    first.remove();
    second.remove();
    assert.throws(
      () => controller.destroy(),
      (error) => {
        assert(error instanceof AggregateError);
        assert.deepEqual(causes(error), [hookError, secondError, lastError, firstError]);
        return true;
      }
    );
    assert.deepEqual(calls, ['hook', 'second', 'last', 'first']);
    assert.deepEqual(cleaned, ['second', 'first']);
    assert.equal(lifecycle.has(first), false);
    assert.equal(lifecycle.has(second), false);
    assert.deepEqual(dispatch(target, events), []);
    controller.destroy();
    assert.deepEqual(calls, ['hook', 'second', 'last', 'first'], 'failed teardown is idempotent');
    fail = false;
    root.append(first, second);
    createController(behavior, root).destroy();
    assert.deepEqual(cleaned, ['second', 'first', 'second', 'first']);
    assert.deepEqual(dispatch(target, events), []);
  });

  await test('nested setup rollback restores parent acquisition and permits an independent retry', () => {
    const lifecycle = createLifecycle('lease-rollback');
    const root = new OwnershipNode();
    const before = new OwnershipNode();
    const innerRoot = new OwnershipNode();
    const innerChild = new OwnershipNode();
    const after = new OwnershipNode();
    root.append(before, innerRoot, after);
    innerRoot.append(innerChild);
    const target = new EventTarget();
    const events = [];
    const cleaned = [];
    const setupError = new Error('nested setup');
    const rollbackError = new Error('nested rollback hook');
    let fail = true;
    let innerMounts = 0;
    const inner = {
      name: 'lease-rollback-inner',
      enhance() {
        innerMounts += 1;
        ownListener(lifecycle, innerChild, target, 'inner', events, cleaned);
        innerChild.remove();
        if (fail) throw setupError;
      },
      destroy() {
        if (fail) throw rollbackError;
      }
    };
    const parent = createController(
      {
        name: 'lease-rollback-parent',
        enhance() {
          ownListener(lifecycle, before, target, 'before', events, cleaned);
          assert.throws(
            () => createController(inner, innerRoot),
            (error) => {
              assert(error instanceof AggregateError);
              assert.deepEqual(causes(error), [setupError, rollbackError]);
              return true;
            }
          );
          assert.equal(lifecycle.has(innerChild), false, 'rollback releases detached setup');
          ownListener(lifecycle, after, target, 'after', events, cleaned);
        }
      },
      root
    );
    assert.deepEqual(cleaned, ['inner']);
    assert.deepEqual(dispatch(target, events), ['before', 'after']);
    fail = false;
    innerRoot.append(innerChild);
    const retry = createController(inner, innerRoot);
    assert.equal(innerMounts, 2, 'failed setup did not publish a lease');
    before.remove();
    after.remove();
    parent.destroy();
    assert.deepEqual(cleaned, ['inner', 'after', 'before']);
    assert.equal(lifecycle.has(innerChild), true, 'parent teardown must leave the retry lease');
    assert.deepEqual(dispatch(target, events), ['inner']);
    retry.destroy();
    assert.deepEqual(cleaned, ['inner', 'after', 'before', 'inner']);
    assert.deepEqual(dispatch(target, events), []);
  });

  await test('failed updates keep acquired resources and last successful state until final release', () => {
    const lifecycle = createLifecycle('lease-update-failure');
    const root = new OwnershipNode();
    const initial = new OwnershipNode();
    const partial = new OwnershipNode();
    root.append(initial);
    const target = new EventTarget();
    const events = [];
    const cleaned = [];
    const initialOptions = { fail: false };
    const initialState = { ready: true };
    const updateError = new Error('partial update');
    const optionsSeen = [];
    const statesDestroyed = [];
    const behavior = {
      name: 'lease-update-failure',
      enhance(scope, options) {
        optionsSeen.push(options);
        if (!lifecycle.has(initial))
          ownListener(lifecycle, initial, target, 'initial', events, cleaned);
        if (!options.fail) return initialState;
        scope.append(partial);
        ownListener(lifecycle, partial, target, 'partial', events, cleaned);
        partial.remove();
        throw updateError;
      },
      destroy: (_scope, state) => statesDestroyed.push(state)
    };
    const lease = acquireBehavior(behavior, root, initialOptions);
    initial.remove();
    assert.throws(
      () => lease.update({ fail: true }),
      (error) => error === updateError
    );
    assert.equal(lease.state, initialState);
    assert.deepEqual(cleaned, [], 'update failure is not an implicit destroy');
    assert.equal(lifecycle.has(initial), true);
    assert.equal(lifecycle.has(partial), true);
    assert.deepEqual(dispatch(target, events), ['initial', 'partial']);
    lease.update();
    assert.equal(optionsSeen.at(-1), initialOptions, 'failed options do not replace defaults');
    lease.destroy();
    lease.destroy();
    lease.update({ fail: true });
    assert.equal(optionsSeen.length, 3, 'a released lease cannot update');
    assert.deepEqual(statesDestroyed, [initialState]);
    assert.deepEqual(cleaned, ['partial', 'initial']);
    assert.deepEqual(dispatch(target, events), []);
  });
}
