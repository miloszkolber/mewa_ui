import { queryAll, createLifecycle } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const lifecycle = createLifecycle('composer');

function initComposer(root) {
  if (lifecycle.has(root)) return;
  const input = root.querySelector('.composer-input');
  if (!input || input.tagName !== 'TEXTAREA') return;

  root.dataset.init = '';
  root.dataset.mewaComposerInit = '';

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

  lifecycle.listen(root, input, 'keydown', onKeyDown);
}

export function enhance(root) {
  queryAll(root, '.composer').forEach(initComposer);
}

export function destroy(root = typeof document === 'undefined' ? null : document) {
  lifecycle.destroy(root);
}

export const behavior = { name: 'composer', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
