// -- Toast -----------------------------------------------------

import { queryAll, createLifecycle, attributeSnapshot } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const lifecycle = createLifecycle('toast');
const DURATION = 4000;
const MAX_VISIBLE = 3;

const isMounted = (el, doc = el?.ownerDocument) =>
  Boolean(el?.isConnected && el.ownerDocument === doc);
const toastStates = new WeakMap();
// Adoption changes ownerDocument, not the document acquired by a mounted root.
const rootDocuments = new WeakMap();
const containerDocuments = new WeakMap();

function releaseContainer(state) {
  state.container.querySelectorAll('.toast').forEach((element) => toastDismiss(element));
  state.attributes.restore();
  containerDocuments.delete(state.container);
  if (state.createdContainer) state.container.remove();
}

function ensureToastState(doc, root = doc) {
  const current = toastStates.get(doc);
  if (isMounted(current?.container, doc)) return current;
  if (current) releaseContainer(current);

  const resolveContainer = () =>
    queryAll(root, '#toast-container').find((element) => isMounted(element, doc)) ||
    doc.getElementById('toast-container');
  let toastContainer = resolveContainer();
  const previousDocument = containerDocuments.get(toastContainer);
  if (previousDocument && previousDocument !== doc) {
    // Another region can enhance this document before the adopted owner updates.
    // End the previous document's container ownership before the destination binds.
    ensureToastState(previousDocument);
    toastContainer = resolveContainer();
  }
  const createdContainer = !toastContainer;
  if (!toastContainer) {
    toastContainer = doc.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('role', 'region');
    toastContainer.setAttribute('aria-label', 'Notifications');
    toastContainer.setAttribute('data-position', 'bottom-right');
    doc.body.appendChild(toastContainer);
  }

  const state = {
    container: toastContainer,
    createdContainer,
    attributes: attributeSnapshot(),
    adapterInstalled: current?.adapterInstalled || false,
    api: current?.api || null,
    roots: current?.roots || new Set(),
    previousApi: current?.previousApi
  };
  toastStates.set(doc, state);
  containerDocuments.set(toastContainer, doc);
  return state;
}

function createToastApi(doc) {
  const show = (options) => toastCreate(doc, options);
  return {
    show,
    success: (o) =>
      show(Object.assign({}, typeof o === 'string' ? { title: o } : o, { variant: 'success' })),
    warning: (o) =>
      show(Object.assign({}, typeof o === 'string' ? { title: o } : o, { variant: 'warning' })),
    info: (o) =>
      show(Object.assign({}, typeof o === 'string' ? { title: o } : o, { variant: 'info' })),
    error: (o) =>
      show(Object.assign({}, typeof o === 'string' ? { title: o } : o, { variant: 'destructive' })),
    dismiss: () => {
      ensureToastState(doc)
        .container.querySelectorAll('.toast')
        .forEach((el) => toastDismiss(el));
    }
  };
}

function installToastAdapter(doc, root) {
  const state = ensureToastState(doc, root);
  if (!state.api) state.api = createToastApi(doc);

  // A Window-less document cannot acquire an unrelated ambient window.
  const view = doc.defaultView;
  if (view && !state.adapterInstalled) {
    state.previousApi = view.toast;
    view.toast = state.api;
    state.adapterInstalled = true;
  }
  return state;
}

const toastDismiss = (el, callback) => {
  if (!el) return;
  if (typeof el._toastCancelTimer === 'function') el._toastCancelTimer();
  lifecycle.destroy(el);
  const container = el.parentElement;
  el.remove();
  if (container?.matches(':popover-open') && !container.querySelector('.toast'))
    container.hidePopover();
  if (callback) callback();
};

const toastCreate = (doc, options) => {
  const state = ensureToastState(doc);
  const toastContainer = state.container;
  const o = typeof options === 'string' ? { title: options } : options;
  const { title, description, variant, action, onDismiss } = o;
  const duration = o.duration != null ? o.duration : DURATION;
  const el = doc.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', variant === 'destructive' ? 'alert' : 'status');
  el.setAttribute('aria-live', variant === 'destructive' ? 'assertive' : 'polite');
  el.setAttribute('aria-atomic', 'true');
  if (variant) el.setAttribute('data-variant', variant);
  const icons = {
    success:
      '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="toast-icon"><path d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12ZM12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM17.4571 9.45711L16.0429 8.04289L11 13.0858L8.20711 10.2929L6.79289 11.7071L11 15.9142L17.4571 9.45711Z"/></svg>',
    warning:
      '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="toast-icon"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 15H13V17H11V15ZM11 7H13V13H11V7Z"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="toast-icon"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z"/></svg>',
    destructive:
      '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="toast-icon"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM12 10.5858L14.8284 7.75736L16.2426 9.17157L13.4142 12L16.2426 14.8284L14.8284 16.2426L12 13.4142L9.17157 16.2426L7.75736 14.8284L10.5858 12L7.75736 9.17157L9.17157 7.75736L12 10.5858Z"/></svg>'
  };
  const contentEl = doc.createElement('div');
  contentEl.className = 'toast-content';
  if (variant && icons[variant]) {
    const tmpl = doc.createElement('template');
    tmpl.innerHTML = icons[variant];
    tmpl.content.querySelector('svg').setAttribute('aria-hidden', 'true');
    contentEl.appendChild(tmpl.content);
  }
  const textDiv = doc.createElement('div');
  textDiv.className = 'toast-text';
  if (title) {
    const p = doc.createElement('p');
    p.className = 'toast-title';
    p.textContent = title;
    textDiv.appendChild(p);
  }
  if (description) {
    const p = doc.createElement('p');
    p.className = 'toast-description';
    p.textContent = description;
    textDiv.appendChild(p);
  }
  contentEl.appendChild(textDiv);
  const closeBtn = doc.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'toast-close';
  closeBtn.setAttribute('aria-label', 'Dismiss');
  closeBtn.dataset.toastClose = '';
  closeBtn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="14" height="14"><path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"/></svg>';
  contentEl.appendChild(closeBtn);
  el.appendChild(contentEl);
  if (action) {
    const actionsDiv = doc.createElement('div');
    actionsDiv.className = 'toast-actions';
    const actionBtn = doc.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = 'btn';
    actionBtn.setAttribute('data-variant', 'secondary');
    actionBtn.dataset.toastAction = '';
    actionBtn.textContent = action.label;
    actionsDiv.appendChild(actionBtn);
    el.appendChild(actionsDiv);
  }
  toastContainer.appendChild(el);
  // Keep the stack together in the top layer. Individual popovers leave flex
  // layout and receive the browser's centered fixed positioning.
  const focused = toastContainer.contains(doc.activeElement) ? doc.activeElement : null;
  if (toastContainer.matches(':popover-open')) toastContainer.hidePopover();
  state.attributes.set(toastContainer, 'popover', 'manual');
  toastContainer.showPopover();
  focused?.focus({ preventScroll: true });
  lifecycle.listen(el, closeBtn, 'click', () => {
    toastDismiss(el, onDismiss);
  });
  if (action) {
    lifecycle.listen(el, el.querySelector('[data-toast-action]'), 'click', () => {
      if (action.onClick) action.onClick();
      toastDismiss(el);
    });
  }

  if (duration !== Infinity) {
    let timer = null;
    let startedAt = 0;
    const numericDuration = Number(duration);
    let remaining = Number.isFinite(numericDuration) ? Math.max(0, numericDuration) : 0;
    let paused = false;
    let hovered = false;
    let focused = false;

    const cancelTimer = () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    };
    const schedule = () => {
      if (paused || timer !== null || !isMounted(el)) return;
      startedAt = Date.now();
      timer = setTimeout(() => {
        timer = null;
        remaining = 0;
        toastDismiss(el, onDismiss);
      }, remaining);
    };
    const pause = () => {
      if (paused) return;
      paused = true;
      if (timer !== null) {
        remaining = Math.max(0, remaining - (Date.now() - startedAt));
        cancelTimer();
      }
    };
    const resume = () => {
      if (!paused) return;
      paused = false;
      if (remaining <= 0) toastDismiss(el, onDismiss);
      else schedule();
    };
    const syncPause = () => {
      if (hovered || focused) pause();
      else resume();
    };

    el._toastCancelTimer = cancelTimer;
    lifecycle.add(el, () => {
      cancelTimer();
      delete el._toastCancelTimer;
    });
    lifecycle.listen(el, el, 'mouseenter', () => {
      hovered = true;
      syncPause();
    });
    lifecycle.listen(el, el, 'mouseleave', () => {
      hovered = false;
      syncPause();
    });
    lifecycle.listen(el, el, 'focusin', () => {
      focused = true;
      syncPause();
    });
    lifecycle.listen(el, el, 'focusout', (event) => {
      focused = Boolean(event.relatedTarget && el.contains(event.relatedTarget));
      syncPause();
    });
    schedule();
  }
  const toasts = toastContainer.querySelectorAll('.toast');
  if (toasts.length > MAX_VISIBLE) toastDismiss(toasts[0]);
  return el;
};

export function enhance(root) {
  const doc =
    root?.nodeType === 9
      ? root
      : root?.ownerDocument || (typeof document === 'undefined' ? null : document);
  if (!doc?.body) return;
  const owner = root || doc;
  const previousDocument = rootDocuments.get(owner);
  if (previousDocument && previousDocument !== doc) releaseRoots(previousDocument, owner);
  const state = installToastAdapter(doc, owner);
  if (!state.roots.has(doc)) {
    state.roots.add(owner);
    rootDocuments.set(owner, doc);
  }
  return state.api;
}

function releaseRoots(doc, root) {
  const state = toastStates.get(doc);
  if (!state) return;
  for (const owner of state.roots) {
    if (root !== doc && owner !== root && !root?.contains?.(owner)) continue;
    state.roots.delete(owner);
    if (rootDocuments.get(owner) === doc) rootDocuments.delete(owner);
  }
  if (state.roots.size) {
    // Another owner keeps this document's API. Release an adopted container
    // before a destination-document binding can take ownership of it.
    if (!isMounted(state.container, doc)) ensureToastState(doc);
    return;
  }
  releaseContainer(state);
  const view = doc.defaultView;
  if (state.adapterInstalled && view?.toast === state.api) {
    if (state.previousApi === undefined) delete view.toast;
    else view.toast = state.previousApi;
  }
  toastStates.delete(doc);
}

export function destroy(root) {
  if (!root) return;
  const documents = new Set();
  const collect = (owner) => {
    const doc = rootDocuments.get(owner);
    if (doc) documents.add(doc);
  };
  collect(root);
  queryAll(root, '*').forEach(collect);
  // A document-wide destroy also owns standalone API resources. A region's
  // current document alone does not establish a binding after adoption.
  if (root.nodeType === 9) documents.add(root);
  documents.forEach((doc) => releaseRoots(doc, root));
}

export const behavior = { name: 'toast', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
