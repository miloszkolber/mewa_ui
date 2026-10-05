// -- Todo List -------------------------------------------------

import { queryAll, createLifecycle } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const rootSelector = '.todo-list';
const lifecycle = createLifecycle('todo-list');

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
  root.dispatchEvent(
    new CustomEvent('todo-list:progress', {
      bubbles: true,
      detail: { completed, total: items.length }
    })
  );
}

export function enhance(root) {
  queryAll(root, rootSelector).forEach((todoList) => {
    if (lifecycle.has(todoList)) return;
    const list = todoList.querySelector('.todo-list-items');
    if (!list) return;

    todoList.dataset.init = '';
    todoList.dataset.mewaTodoListInit = '';
    let observer = null;
    lifecycle.add(todoList, () => {
      observer?.disconnect();
      if (todoList._todoListObserver === observer) delete todoList._todoListObserver;
    });
    if (typeof MutationObserver === 'function') {
      observer = new MutationObserver(() => updateProgress(todoList));
      observer.observe(list, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-status']
      });
      todoList._todoListObserver = observer;
    }
    updateProgress(todoList);
  });
}

export function destroy(root = typeof document === 'undefined' ? null : document) {
  lifecycle.destroy(root);
}

export const behavior = { name: 'todo-list', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
