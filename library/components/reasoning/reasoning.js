const reasoningInstances = new WeakMap();

function initReasoning(root) {
  if (root.hasAttribute('data-init')) return;
  root.dataset.init = '';

  const summary = root.querySelector(':scope > .reasoning-trigger');
  if (!summary || root.tagName !== 'DETAILS') {
    root.removeAttribute('data-init');
    return;
  }

  let streaming = root.hasAttribute('data-streaming');
  let manual = false;

  const onSummaryClick = () => {
    manual = true;
  };

  const syncStreaming = () => {
    const next = root.hasAttribute('data-streaming');
    if (next === streaming) return;
    streaming = next;
    if (streaming) {
      manual = false;
      root.open = true;
    } else if (root.hasAttribute('data-collapse-on-complete') && !manual) {
      root.open = false;
    }
  };

  summary.addEventListener('click', onSummaryClick);

  const observer = new MutationObserver(syncStreaming);
  observer.observe(root, { attributes: true, attributeFilter: ['data-streaming'] });

  if (streaming) root.open = true;

  reasoningInstances.set(root, {
    destroy() {
      summary.removeEventListener('click', onSummaryClick);
      observer.disconnect();
      root.removeAttribute('data-init');
      reasoningInstances.delete(root);
    }
  });
}

function initReasoningDisclosures(scope = document) {
  if (scope.matches?.('.reasoning')) initReasoning(scope);
  scope.querySelectorAll?.('.reasoning').forEach(initReasoning);
}

function destroyReasoningDisclosures(scope) {
  if (scope.nodeType !== 1) return;
  if (scope.matches?.('.reasoning')) reasoningInstances.get(scope)?.destroy();
  scope.querySelectorAll?.('.reasoning').forEach((root) => {
    reasoningInstances.get(root)?.destroy();
  });
}

initReasoningDisclosures();

new MutationObserver((records) => {
  records.forEach((record) => {
    record.removedNodes.forEach(destroyReasoningDisclosures);
    record.addedNodes.forEach((node) => {
      if (node.nodeType === 1) initReasoningDisclosures(node);
    });
  });
}).observe(document, { childList: true, subtree: true });
