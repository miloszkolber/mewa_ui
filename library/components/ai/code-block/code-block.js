import { queryAll, createLifecycle, attributeSnapshot } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const lifecycle = createLifecycle('code-block');

function codeBlockAtBottom(viewport) {
  return viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= 24;
}

function codeBlockText(root, code) {
  const lines = Array.from(root.querySelectorAll('.code-block-line-text'));
  if (lines.length) return lines.map((line) => line.textContent || '').join('\n');
  return code.textContent || '';
}

function initCodeBlock(root) {
  if (lifecycle.has(root)) return;
  const viewport = root.querySelector('.code-block-viewport');
  const code = root.querySelector('.code-block-code');
  if (!viewport || !code) return;

  root.dataset.init = '';
  root.dataset.mewaCodeBlockInit = '';

  const copyButton = root.querySelector('[data-code-block-copy]');
  const status = root.querySelector('.code-block-status');
  const attributes = attributeSnapshot();
  let restoreFeedback = null;
  let copyTimer = null;
  let copyAttempt = 0;
  let active = true;
  let streaming = root.hasAttribute('data-streaming');
  let pinned = streaming || codeBlockAtBottom(viewport);

  const clearFeedback = () => {
    if (copyTimer !== null) clearTimeout(copyTimer);
    copyTimer = null;
    restoreFeedback?.();
    restoreFeedback = null;
  };

  const showFeedback = (copied) => {
    const feedbackAttributes = attributeSnapshot();
    const restoreContents = [];
    const writeText = (element, text) => {
      if (!element) return;
      const contents = Array.from(element.childNodes);
      const feedback = element.ownerDocument.createTextNode(text);
      element.replaceChildren(feedback);
      restoreContents.push(() => {
        if (feedback.parentNode !== element || feedback.data !== text) return;
        // Restore only this feedback node. Keep application insertions and do
        // not reclaim baseline nodes that the application moved elsewhere.
        feedback.replaceWith(...contents.filter((node) => !node.parentNode));
      });
    };
    if (copied) {
      writeText(copyButton, 'Copied');
      feedbackAttributes.set(copyButton, 'aria-label', 'Copied');
    }
    writeText(
      status,
      copied ? 'Copied to clipboard.' : 'Copy failed. Select and copy the code manually.'
    );
    restoreFeedback = () => {
      restoreContents.forEach((restore) => restore());
      feedbackAttributes.restore();
    };
    if (copied) copyTimer = setTimeout(clearFeedback, 2000);
  };

  lifecycle.add(root, () => {
    active = false;
    clearFeedback();
    attributes.restore();
  });

  const scrollToBottom = () => {
    viewport.scrollTop = viewport.scrollHeight;
  };

  const onScroll = () => {
    pinned = codeBlockAtBottom(viewport);
  };

  const onCopy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return;
    const attempt = ++copyAttempt;
    clearFeedback();
    try {
      await navigator.clipboard.writeText(codeBlockText(root, code));
    } catch {
      if (active && attempt === copyAttempt) showFeedback(false);
      return;
    }

    if (active && attempt === copyAttempt) showFeedback(true);
  };

  lifecycle.listen(root, viewport, 'scroll', onScroll, { passive: true });

  if (copyButton) {
    attributes.set(
      copyButton,
      'hidden',
      typeof navigator === 'undefined' || !navigator.clipboard?.writeText ? '' : null
    );
    lifecycle.listen(root, copyButton, 'click', onCopy);
  }

  const contentObserver = new MutationObserver(() => {
    if (streaming && pinned) scrollToBottom();
  });
  lifecycle.add(root, () => contentObserver.disconnect());
  contentObserver.observe(code, { childList: true, subtree: true, characterData: true });

  const attributeObserver = new MutationObserver(() => {
    const next = root.hasAttribute('data-streaming');
    if (next && !streaming) {
      pinned = true;
      scrollToBottom();
    }
    streaming = next;
  });
  lifecycle.add(root, () => attributeObserver.disconnect());
  attributeObserver.observe(root, { attributes: true, attributeFilter: ['data-streaming'] });

  const resizeObserver =
    typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => {
          if (streaming && pinned) scrollToBottom();
        })
      : null;
  lifecycle.add(root, () => resizeObserver?.disconnect());
  resizeObserver?.observe(code);

  if (streaming) scrollToBottom();
}

export function enhance(root) {
  queryAll(root, '.code-block').forEach(initCodeBlock);
}

export function destroy(root = typeof document === 'undefined' ? null : document) {
  lifecycle.destroy(root);
}

export const behavior = { name: 'code-block', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
