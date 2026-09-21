import { queryAll } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const composerInstances = new WeakMap();

function initComposer(root) {
  if (composerInstances.has(root)) return;
  root.dataset.init = '';
  root.dataset.mewaComposerInit = '';

  const input = root.querySelector('.composer-input');
  if (!input || input.tagName !== 'TEXTAREA') {
    root.removeAttribute('data-mewa-composer-init');
    return;
  }

  const requestSubmit = () => {
    const submitter = root.querySelector('button[type="submit"], input[type="submit"]');
    if (submitter?.matches(':disabled, [aria-disabled="true"]')) return;
    if (typeof root.requestSubmit === 'function') {
      root.requestSubmit(submitter || undefined);
      return;
    }
    submitter?.click();
  };

  const onKeyDown = (event) => {
    if (event.defaultPrevented || event.isComposing || event.key !== 'Enter') return;
    const submitOn = root.dataset.submitOn;
    if (submitOn !== 'enter' && submitOn !== 'mod-enter') return;
    const modifier = event.metaKey || event.ctrlKey;
    const shouldSubmit = submitOn === 'enter' ? !event.shiftKey : modifier && !event.shiftKey;
    if (!shouldSubmit) return;
    event.preventDefault();
    requestSubmit();
  };

  input.addEventListener('keydown', onKeyDown);

  composerInstances.set(root, {
    destroy() {
      input.removeEventListener('keydown', onKeyDown);
      root.removeAttribute('data-mewa-composer-init');
      composerInstances.delete(root);
    }
  });
}

export function enhance(root) {
  queryAll(root, '.composer').forEach(initComposer);
}

export function destroy(root) {
  queryAll(root, '.composer').forEach((composer) => {
    composerInstances.get(composer)?.destroy();
  });
}

export const behavior = { name: 'composer', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
