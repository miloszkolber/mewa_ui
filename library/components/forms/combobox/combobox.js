// -- Combobox -------------------------------------------------

import { queryAll, createLifecycle, attributeSnapshot } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const lifecycle = createLifecycle('combobox');

export function enhance(root) {
  lifecycle.refresh(root);
  queryAll(root, '.combobox').forEach((wrapper) => {
    wrapper.dataset.init = '';
    if (lifecycle.has(wrapper)) return;
    wrapper.dataset.mewaComboboxInit = '';

    const trigger = wrapper.querySelector('.combobox-trigger');
    const valueElement = wrapper.querySelector('.combobox-value');
    const popover = wrapper.querySelector('.combobox-content');
    const searchRow = wrapper.querySelector('.combobox-search');
    const searchInput = wrapper.querySelector('.combobox-search-input');
    const listbox = wrapper.querySelector('[role="listbox"]');
    const hiddenInput = wrapper.querySelector('[data-combobox-input]');
    const emptyState = wrapper.querySelector('.combobox-empty');

    if (!trigger || !popover || !searchInput || !listbox) {
      wrapper.removeAttribute('data-mewa-combobox-init');
      return;
    }

    // Cloned enhanced markup contains DOM, but does not own the original instance.
    popover.querySelectorAll('.combobox-status').forEach((status) => status.remove());
    const status = wrapper.ownerDocument.createElement('p');
    status.className = 'combobox-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-atomic', 'true');
    popover.append(status);
    lifecycle.add(wrapper, () => status.remove());

    let resetValue = hiddenInput?.defaultValue;
    let writtenValue = hiddenInput?.value;
    // Hidden value writes also replace the native default attribute. Keep the
    // reset value separate and adopt a later application default before writing.
    const initialLabel = valueElement?.textContent || '';
    const initialPlaceholder = valueElement?.hasAttribute('data-placeholder');
    const allItems = () => Array.from(listbox.querySelectorAll('[role="option"]'));
    let highlightedItem = null;
    const attributes = attributeSnapshot();

    if (!searchInput.hasAttribute('aria-label') && !searchInput.hasAttribute('aria-labelledby')) {
      const triggerLabel = trigger.getAttribute('aria-label');
      if (triggerLabel) attributes.set(searchInput, 'aria-label', `Search ${triggerLabel}`);
    }

    const anchorId = `--combobox-${popover.id}`;
    const originalTriggerAnchor = trigger.style.anchorName;
    const originalPopoverAnchor = popover.style.positionAnchor;
    trigger.style.anchorName = anchorId;
    popover.style.positionAnchor = anchorId;
    lifecycle.add(wrapper, () => {
      if (popover.matches(':popover-open')) popover.hidePopover();
      attributes.restore();
      if (trigger.style.anchorName === anchorId) trigger.style.anchorName = originalTriggerAnchor;
      if (popover.style.positionAnchor === anchorId)
        popover.style.positionAnchor = originalPopoverAnchor;
    });

    const getVisibleItems = () =>
      allItems().filter(
        (item) =>
          !item.hidden &&
          !item.matches(':disabled') &&
          item.getAttribute('aria-disabled') !== 'true'
      );

    const setExpanded = (expanded) => {
      const value = String(expanded);
      attributes.set(trigger, 'aria-expanded', value);
      attributes.set(searchInput, 'aria-expanded', value);
    };

    const clearHighlight = () => {
      if (highlightedItem) attributes.set(highlightedItem, 'data-highlighted', null);
      highlightedItem = null;
      attributes.set(searchInput, 'aria-activedescendant', '');
    };

    const reconcileHighlight = (items = getVisibleItems()) => {
      if (!highlightedItem) return -1;
      const index = items.indexOf(highlightedItem);
      if (index < 0) clearHighlight();
      else if (searchInput.getAttribute('aria-activedescendant') !== highlightedItem.id)
        attributes.set(searchInput, 'aria-activedescendant', highlightedItem.id);
      return index;
    };

    const highlight = (index) => {
      const items = getVisibleItems();
      clearHighlight();
      if (index < 0 || index >= items.length) return;

      const item = items[index];
      highlightedItem = item;
      attributes.set(item, 'data-highlighted', '');
      item.scrollIntoView({ block: 'nearest' });
      attributes.set(searchInput, 'aria-activedescendant', item.id);
    };

    const updateGroupVisibility = () => {
      listbox.querySelectorAll('.combobox-group-label').forEach((label) => {
        let next = label.nextElementSibling;
        let groupHasVisibleItem = false;

        while (
          next &&
          !next.classList.contains('combobox-group-label') &&
          !next.classList.contains('combobox-separator')
        ) {
          if (next.getAttribute('role') === 'option' && !next.hidden) {
            groupHasVisibleItem = true;
          }
          next = next.nextElementSibling;
        }

        attributes.set(label, 'hidden', groupHasVisibleItem ? null : '');
      });

      listbox.querySelectorAll('.combobox-separator').forEach((separator) => {
        const previous = separator.previousElementSibling;
        const next = separator.nextElementSibling;
        attributes.set(separator, 'hidden', previous?.hidden || next?.hidden ? '' : null);
      });
    };

    const filter = (query, announce = false) => {
      const normalizedQuery = query.trim().toLocaleLowerCase();
      let hasVisibleItem = false;

      allItems().forEach((item) => {
        const label = item.textContent.trim().toLocaleLowerCase();
        const match = !normalizedQuery || label.includes(normalizedQuery);
        attributes.set(item, 'hidden', match ? null : '');
        if (match) hasVisibleItem = true;
      });

      updateGroupVisibility();
      if (emptyState) attributes.set(emptyState, 'hidden', hasVisibleItem ? '' : null);
      const count = getVisibleItems().length;
      status.textContent = announce
        ? `${count} ${count === 1 ? 'option' : 'options'} available.`
        : '';
    };

    const writeSelection = (item, { announce = true } = {}) => {
      if (!allItems().includes(item)) return false;

      allItems().forEach((option) => {
        option.setAttribute('aria-selected', String(option === item));
      });

      if (valueElement) {
        valueElement.textContent = item.textContent.trim();
        valueElement.removeAttribute('data-placeholder');
      }

      if (hiddenInput) {
        if (hiddenInput.defaultValue !== writtenValue) resetValue = hiddenInput.defaultValue;
        hiddenInput.value = item.dataset.value ?? item.textContent.trim();
        writtenValue = hiddenInput.value;
        if (announce) {
          hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
          hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      return true;
    };

    const close = ({ restoreFocus = true } = {}) => {
      if (popover.matches(':popover-open')) popover.hidePopover();
      setExpanded(false);
      clearHighlight();
      if (restoreFocus) trigger.focus();
    };

    const open = () => {
      if (trigger.matches(':disabled') || hiddenInput?.matches(':disabled')) return;
      popover.showPopover();
      if (!popover.matches(':popover-open')) {
        setExpanded(false);
        return;
      }
      setExpanded(true);
      searchInput.value = '';
      filter('');
      clearHighlight();
      searchInput.focus();
    };

    lifecycle.reset(wrapper, hiddenInput?.form, () => {
      if (hiddenInput.defaultValue !== writtenValue) resetValue = hiddenInput.value;
      searchInput.value = '';
      filter('');
      const selected = allItems().find(
        (item) => (item.dataset.value ?? item.textContent.trim()) === resetValue
      );
      if (selected) writeSelection(selected, { announce: false });
      else {
        allItems().forEach((item) => item.setAttribute('aria-selected', 'false'));
        if (hiddenInput) {
          hiddenInput.value = resetValue || '';
          writtenValue = hiddenInput.value;
        }
        if (valueElement) {
          valueElement.textContent = initialLabel;
          valueElement.toggleAttribute('data-placeholder', Boolean(initialPlaceholder));
        }
      }
      close({ restoreFocus: false });
    });

    const selectItem = (item) => {
      if (
        trigger.matches(':disabled') ||
        hiddenInput?.matches(':disabled') ||
        !getVisibleItems().includes(item)
      )
        return;
      if (writeSelection(item)) close();
    };

    const selectedItem = allItems().find((item) => item.getAttribute('aria-selected') === 'true');
    if (selectedItem) writeSelection(selectedItem, { announce: false });

    lifecycle.listen(wrapper, trigger, 'click', () => {
      if (popover.matches(':popover-open')) close();
      else open();
    });

    lifecycle.listen(wrapper, searchInput, 'input', () => {
      filter(searchInput.value, true);
      highlight(0);
    });

    lifecycle.listen(wrapper, searchRow, 'click', () => {
      searchInput.focus();
    });

    lifecycle.listen(wrapper, searchInput, 'keydown', (event) => {
      if (event.isComposing) return;
      const items = getVisibleItems();
      const highlightedIndex = reconcileHighlight(items);

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          highlight(Math.min(highlightedIndex + 1, items.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          highlight(highlightedIndex < 0 ? items.length - 1 : Math.max(highlightedIndex - 1, 0));
          break;
        case 'Home':
          event.preventDefault();
          highlight(0);
          break;
        case 'End':
          event.preventDefault();
          highlight(items.length - 1);
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedItem) selectItem(highlightedItem);
          break;
        case 'Escape':
          event.preventDefault();
          close();
          break;
        case 'Tab':
          close({ restoreFocus: false });
          break;
      }
    });

    lifecycle.listen(wrapper, listbox, 'click', (event) => {
      const item = event.target.closest('[role="option"]');
      if (item && !item.hidden) selectItem(item);
    });

    lifecycle.listen(wrapper, listbox, 'mousemove', (event) => {
      const item = event.target.closest('[role="option"]');
      if (!item || item.hidden || item.getAttribute('aria-disabled') === 'true') return;

      const items = getVisibleItems();
      highlight(items.indexOf(item));
    });

    lifecycle.listen(wrapper, popover, 'toggle', (event) => {
      const expanded = event.newState === 'open';
      setExpanded(expanded);
      if (!expanded) clearHighlight();
    });
    const observer = new MutationObserver(() => reconcileHighlight());
    observer.observe(listbox, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['aria-disabled', 'disabled', 'hidden', 'id']
    });
    lifecycle.add(wrapper, () => observer.disconnect());
    lifecycle.onUpdate(wrapper, () => reconcileHighlight());
  });
}

export function destroy(root) {
  lifecycle.destroy(root);
}

export const behavior = { name: 'combobox', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
