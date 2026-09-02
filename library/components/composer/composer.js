const composerInstances = new WeakMap();

function initComposer(root) {
  if (root.hasAttribute('data-init')) return;
  root.dataset.init = '';

  const input = root.querySelector('.composer-input');
  if (!input || input.tagName !== 'TEXTAREA') {
    root.removeAttribute('data-init');
    return;
  }

  const requestSubmit = () => {
    if (typeof root.requestSubmit === 'function') {
      root.requestSubmit();
      return;
    }
    root.querySelector('button[type="submit"], input[type="submit"]')?.click();
  };

  const onKeyDown = (event) => {
    if (event.defaultPrevented || event.isComposing || event.key !== 'Enter') return;
    const submitOn = root.dataset.submitOn === 'enter' ? 'enter' : 'mod-enter';
    const modifier = event.metaKey || event.ctrlKey;
    const shouldSubmit = submitOn === 'enter'
      ? !event.shiftKey
      : modifier && !event.shiftKey;
    if (!shouldSubmit) return;
    event.preventDefault();
    requestSubmit();
  };

  input.addEventListener('keydown', onKeyDown);

  composerInstances.set(root, {
    destroy() {
      input.removeEventListener('keydown', onKeyDown);
      root.removeAttribute('data-init');
      composerInstances.delete(root);
    }
  });
}

function initComposers(scope = document) {
  if (scope.matches?.('.composer')) initComposer(scope);
  scope.querySelectorAll?.('.composer').forEach(initComposer);
}

function destroyComposers(scope) {
  if (scope.nodeType !== 1) return;
  if (scope.matches?.('.composer')) composerInstances.get(scope)?.destroy();
  scope.querySelectorAll?.('.composer').forEach((root) => {
    composerInstances.get(root)?.destroy();
  });
}

initComposers();

new MutationObserver((records) => {
  records.forEach((record) => {
    record.removedNodes.forEach(destroyComposers);
    record.addedNodes.forEach((node) => {
      if (node.nodeType === 1) initComposers(node);
    });
  });
}).observe(document, { childList: true, subtree: true });
