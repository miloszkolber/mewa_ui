// -- Command Palette -----------------------------------------

import { queryAll, createLifecycle } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const lifecycle = createLifecycle('command-palette');

let commandItemId = 0;

function isConnected(element) {
  return Boolean(element && element.isConnected);
}

function isDisabled(item) {
  return item.disabled || item.getAttribute('aria-disabled') === 'true';
}

function getVisibleItems(list) {
  return Array.from(list.querySelectorAll('.command-palette-item')).filter(
    (item) => !item.hidden && !isDisabled(item)
  );
}

function clearHighlight(list, input, setAttribute) {
  list.querySelectorAll('.command-palette-item').forEach((item) => {
    setAttribute(item, 'data-highlighted', null);
    setAttribute(item, 'aria-selected', 'false');
  });
  if (input) setAttribute(input, 'aria-activedescendant', null);
}

function highlightItem(list, index, input, setAttribute) {
  const visible = getVisibleItems(list);
  clearHighlight(list, input, setAttribute);
  if (visible.length === 0) return -1;

  const clamped = ((index % visible.length) + visible.length) % visible.length;
  const item = visible[clamped];
  setAttribute(item, 'data-highlighted', '');
  setAttribute(item, 'aria-selected', 'true');
  if (input && item.id) setAttribute(input, 'aria-activedescendant', item.id);
  if (typeof item.scrollIntoView === 'function') item.scrollIntoView({ block: 'nearest' });
  return clamped;
}

function showPalette(dialog, trigger) {
  if (!isConnected(dialog) || typeof dialog.showModal !== 'function') return false;
  if (!dialog.open) {
    dialog._trigger = trigger || dialog.ownerDocument.activeElement;
    try {
      dialog.showModal();
    } catch {
      return false;
    }
  }
  const input = dialog.querySelector('.command-palette-input');
  if (input) input.focus();
  return true;
}

function installDocumentListener(documentRoot) {
  if (documentRoot.__commandPaletteKeydownInit) return;
  documentRoot.__commandPaletteKeydownInit = true;
  lifecycle.add(documentRoot, () => delete documentRoot.__commandPaletteKeydownInit);
  lifecycle.listen(documentRoot, documentRoot, 'keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      const dialog = documentRoot.querySelector(
        'dialog.command-palette[data-mewa-command-palette-init]'
      );
      if (!isConnected(dialog)) return;
      e.preventDefault();
      if (dialog.open) dialog.close();
      else showPalette(dialog);
    }
  });
}

export function enhance(root) {
  lifecycle.refresh(root);
  const scope = root || (typeof document === 'undefined' ? null : document);
  const documentRoot = scope?.nodeType === 9 ? scope : scope?.ownerDocument;
  if (!documentRoot) return;
  installDocumentListener(documentRoot);

  const dialogs = queryAll(scope, 'dialog.command-palette');
  dialogs.forEach((dialog) => {
    dialog.dataset.init = '';
    if (lifecycle.has(dialog)) return;
    dialog.dataset.mewaCommandPaletteInit = '';
    const input = dialog.querySelector('.command-palette-input');
    const inputWrapper = dialog.querySelector('.command-palette-input-wrapper');
    const list = dialog.querySelector('.command-palette-list');
    const empty = dialog.querySelector('.command-palette-empty');
    if (!input || !list) {
      delete dialog.dataset.mewaCommandPaletteInit;
      return;
    }

    const attributes = new Map();
    const setAttribute = (element, name, value) => {
      if (!attributes.has(element)) attributes.set(element, new Map());
      const saved = attributes.get(element);
      if (!saved.has(name)) saved.set(name, { original: element.getAttribute(name) });
      saved.get(name).current = value;
      if (value === null) element.removeAttribute(name);
      else element.setAttribute(name, value);
    };
    lifecycle.add(dialog, () => {
      for (const [element, saved] of attributes) {
        for (const [name, { original, current }] of saved) {
          if (element.getAttribute(name) !== current) continue;
          if (original === null) element.removeAttribute(name);
          else element.setAttribute(name, original);
        }
      }
    });
    if (!list.id) setAttribute(list, 'id', `command-palette-list-${++commandItemId}`);
    setAttribute(list, 'role', 'listbox');
    if (!list.hasAttribute('aria-label') && !list.hasAttribute('aria-labelledby'))
      setAttribute(list, 'aria-label', 'Commands');
    setAttribute(input, 'role', 'combobox');
    setAttribute(input, 'aria-autocomplete', 'list');
    setAttribute(input, 'aria-expanded', String(dialog.open));
    setAttribute(input, 'aria-controls', list.id);
    lifecycle.listen(dialog, dialog, 'beforetoggle', (event) => {
      // Expose a closing state before the native close event. Opening is
      // cancelable, so read its final native result after all handlers finish.
      if (event.newState === 'closed') setAttribute(input, 'aria-expanded', 'false');
      queueMicrotask(() => {
        if (lifecycle.has(dialog)) setAttribute(input, 'aria-expanded', String(dialog.open));
      });
    });
    lifecycle.listen(dialog, dialog, 'toggle', () => {
      setAttribute(input, 'aria-expanded', String(dialog.open));
    });

    const items = () => Array.from(list.querySelectorAll('.command-palette-item'));
    const prepareItems = () => {
      list.querySelectorAll('.command-palette-group').forEach((group) => {
        const heading = group.querySelector('.command-palette-group-heading');
        setAttribute(group, 'role', 'group');
        if (
          heading &&
          !group.hasAttribute('aria-label') &&
          !group.hasAttribute('aria-labelledby')
        ) {
          if (!heading.id) setAttribute(heading, 'id', `${list.id}-heading-${++commandItemId}`);
          setAttribute(group, 'aria-labelledby', heading.id);
        }
      });
      items().forEach((item) => {
        if (!item.id) setAttribute(item, 'id', `${list.id}-item-${++commandItemId}`);
        setAttribute(item, 'role', 'option');
        setAttribute(item, 'tabindex', '-1');
      });
    };
    lifecycle.listen(
      dialog,
      list,
      'click',
      (event) => {
        const item = event.target.closest('.command-palette-item');
        if (!item || !isDisabled(item)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true
    );
    let highlightIndex = -1;

    const filter = (q) => {
      const query = q.toLowerCase();
      prepareItems();
      items().forEach((item) => {
        setAttribute(
          item,
          'hidden',
          query && !item.textContent.toLowerCase().includes(query) ? '' : null
        );
      });
      list.querySelectorAll('.command-palette-group').forEach((group) => {
        const visible = Array.from(group.querySelectorAll('.command-palette-item')).some(
          (item) => !item.hidden
        );
        setAttribute(group, 'hidden', visible ? null : '');
      });
      list.querySelectorAll('.command-palette-separator').forEach((separator) => {
        setAttribute(separator, 'hidden', query ? '' : null);
      });
      if (empty) setAttribute(empty, 'hidden', items().some((item) => !item.hidden) ? '' : null);
      highlightIndex = highlightItem(list, 0, input, setAttribute);
    };

    lifecycle.onUpdate(dialog, () => filter(input.value));
    lifecycle.listen(dialog, input, 'input', () => {
      filter(input.value);
    });
    if (inputWrapper)
      lifecycle.listen(dialog, inputWrapper, 'click', () => {
        input.focus();
      });

    lifecycle.listen(dialog, input, 'keydown', (e) => {
      if (e.isComposing) return;
      const visible = getVisibleItems(list);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlightIndex = highlightItem(list, highlightIndex + 1, input, setAttribute);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlightIndex = highlightItem(list, highlightIndex - 1, input, setAttribute);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = visible[highlightIndex];
        if (item && !isDisabled(item)) item.click();
      } else if (e.key === 'Home') {
        e.preventDefault();
        highlightIndex = highlightItem(list, 0, input, setAttribute);
      } else if (e.key === 'End') {
        e.preventDefault();
        highlightIndex = highlightItem(list, visible.length - 1, input, setAttribute);
      }
    });

    lifecycle.listen(dialog, dialog, 'click', (e) => {
      if (e.target === dialog) {
        if (dialog.open) dialog.close();
        return;
      }
      const item = e.target.closest('.command-palette-item');
      if (!item) return;
      if (isDisabled(item)) {
        e.preventDefault();
        return;
      }
      if (dialog.open) dialog.close();
    });
    lifecycle.listen(dialog, dialog, 'close', () => {
      setAttribute(input, 'aria-expanded', 'false');
      input.value = '';
      filter('');
      clearHighlight(list, input, setAttribute);
      highlightIndex = -1;
      if (dialog._trigger?.isConnected) dialog._trigger.focus();
    });

    filter('');
  });

  const triggerScope = dialogs.length ? documentRoot : scope;
  queryAll(triggerScope, '[data-command-palette-trigger]').forEach((trigger) => {
    trigger.dataset.init = '';
    if (lifecycle.has(trigger)) return;
    trigger.dataset.mewaCommandPaletteInit = '';
    const dialogId = trigger.dataset.commandPaletteTrigger;
    const triggerDocument = trigger.ownerDocument;
    const dialog = triggerDocument.getElementById(dialogId);
    if (!dialog) {
      // Leave the trigger eligible for a later SPA insertion of its dialog.
      delete trigger.dataset.mewaCommandPaletteInit;
      return;
    }
    lifecycle.listen(trigger, trigger, 'click', () => {
      const currentDialog = triggerDocument.getElementById(dialogId);
      showPalette(currentDialog, trigger);
    });
  });
}

export function destroy(root) {
  lifecycle.destroy(root);
}

export const behavior = { name: 'command-palette', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
