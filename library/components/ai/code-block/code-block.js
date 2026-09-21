import { queryAll } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const codeBlockInstances = new WeakMap();

function codeBlockAtBottom(viewport) {
  return viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= 24;
}

function codeBlockText(root, code) {
  const lines = Array.from(root.querySelectorAll('.code-block-line-text'));
  if (lines.length) return lines.map((line) => line.textContent || '').join('\n');
  return code.textContent || '';
}

function initCodeBlock(root) {
  if (codeBlockInstances.has(root)) return;
  root.dataset.init = '';
  root.dataset.mewaCodeBlockInit = '';

  const viewport = root.querySelector('.code-block-viewport');
  const code = root.querySelector('.code-block-code');
  if (!viewport || !code) {
    root.removeAttribute('data-mewa-code-block-init');
    return;
  }

  const copyButton = root.querySelector('[data-code-block-copy]');
  const status = root.querySelector('.code-block-status');
  const copyContents = copyButton ? Array.from(copyButton.childNodes) : [];
  const copyLabel = copyButton?.getAttribute('aria-label');
  const copyHidden = copyButton?.hidden;
  const statusText = status?.textContent;
  const restoreCopy = () => {
    if (!copyButton) return;
    copyButton.replaceChildren(...copyContents);
    if (copyLabel === null) copyButton.removeAttribute('aria-label');
    else copyButton.setAttribute('aria-label', copyLabel);
  };
  let copyTimer = null;
  let active = true;
  let streaming = root.hasAttribute('data-streaming');
  let pinned = streaming || codeBlockAtBottom(viewport);

  const scrollToBottom = () => {
    viewport.scrollTop = viewport.scrollHeight;
  };

  const onScroll = () => {
    pinned = codeBlockAtBottom(viewport);
  };

  const onCopy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return;
    if (copyTimer !== null) clearTimeout(copyTimer);
    copyTimer = null;
    restoreCopy();
    if (status) status.textContent = statusText;
    try {
      await navigator.clipboard.writeText(codeBlockText(root, code));
    } catch {
      if (active && status) status.textContent = 'Copy failed. Select and copy the code manually.';
      return;
    }

    if (!active) return;
    copyButton.textContent = 'Copied';
    copyButton.setAttribute('aria-label', 'Copied');
    if (status) status.textContent = 'Copied to clipboard.';
    copyTimer = setTimeout(() => {
      restoreCopy();
      if (status) status.textContent = statusText;
      copyTimer = null;
    }, 2000);
  };

  viewport.addEventListener('scroll', onScroll, { passive: true });

  if (copyButton) {
    copyButton.hidden = typeof navigator === 'undefined' || !navigator.clipboard?.writeText;
    copyButton.addEventListener('click', onCopy);
  }

  const contentObserver = new MutationObserver(() => {
    if (streaming && pinned) scrollToBottom();
  });
  contentObserver.observe(code, { childList: true, subtree: true, characterData: true });

  const attributeObserver = new MutationObserver(() => {
    const next = root.hasAttribute('data-streaming');
    if (next && !streaming) {
      pinned = true;
      scrollToBottom();
    }
    streaming = next;
  });
  attributeObserver.observe(root, { attributes: true, attributeFilter: ['data-streaming'] });

  const resizeObserver =
    typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => {
          if (streaming && pinned) scrollToBottom();
        })
      : null;
  resizeObserver?.observe(code);

  if (streaming) scrollToBottom();

  codeBlockInstances.set(root, {
    destroy() {
      active = false;
      viewport.removeEventListener('scroll', onScroll);
      copyButton?.removeEventListener('click', onCopy);
      contentObserver.disconnect();
      attributeObserver.disconnect();
      resizeObserver?.disconnect();
      if (copyTimer !== null) clearTimeout(copyTimer);
      if (copyButton) {
        copyButton.hidden = copyHidden;
        restoreCopy();
      }
      if (status) status.textContent = statusText;
      root.removeAttribute('data-mewa-code-block-init');
      codeBlockInstances.delete(root);
    }
  });
}

export function enhance(root) {
  queryAll(root, '.code-block').forEach(initCodeBlock);
}

export function destroy(root) {
  queryAll(root, '.code-block').forEach((codeBlock) => {
    codeBlockInstances.get(codeBlock)?.destroy();
  });
}

export const behavior = { name: 'code-block', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
