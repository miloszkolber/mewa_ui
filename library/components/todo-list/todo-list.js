// -- Todo List -------------------------------------------------

const rootSelector = '.todo-list:not([data-init])';

function directItems(root) {
  const list = root.querySelector('.todo-list-items');
  if (!list) return [];
  return Array.from(list.children).filter((item) => item.matches('[data-todo-item], .todo-item'));
}

function updateProgress(root) {
  const items = directItems(root);
  const completed = items.filter((item) => item.dataset.status === 'done').length;
  const output = root.querySelector('[data-todo-progress]');
  if (output) output.textContent = `${completed} of ${items.length} complete`;
  root.dispatchEvent(new CustomEvent('todo-list:progress', {
    bubbles: true,
    detail: { completed, total: items.length }
  }));
}

function init() {
  document.querySelectorAll(rootSelector).forEach((root) => {
    root.dataset.init = '';
    updateProgress(root);

    const list = root.querySelector('.todo-list-items');
    if (!list || typeof MutationObserver !== 'function') return;

    const observer = new MutationObserver(() => updateProgress(root));
    observer.observe(list, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-status']
    });
  });
}

init();
new MutationObserver(init).observe(document, { childList: true, subtree: true });
