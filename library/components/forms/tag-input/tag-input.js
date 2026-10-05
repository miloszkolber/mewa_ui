// -- Tag Input --------------------------------------------------

import { queryAll, createLifecycle, attributeSnapshot } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const lifecycle = createLifecycle('tag-input');
const retainedDrafts = new WeakMap();

function escapeCharacterClass(value) {
  return value.replace(/[\\\]\-^]/g, '\\$&');
}

export function enhance(root) {
  lifecycle.refresh(root);
  queryAll(root, '[data-tag-input]').forEach((tagInput) => {
    tagInput.dataset.init = '';
    if (lifecycle.has(tagInput)) return;
    tagInput.dataset.mewaTagInputInit = '';
    const doc = tagInput.ownerDocument;

    const field = tagInput.querySelector('[data-tag-input-field]');
    const valueInput = tagInput.querySelector('.tag-input-fallback[type="text"]');
    const status = tagInput.querySelector('[data-tag-input-status]');
    if (!field || !valueInput || !status || !valueInput.id) {
      tagInput.removeAttribute('data-mewa-tag-input-init');
      return;
    }

    const inputId = valueInput.id;
    let resetValue = valueInput.defaultValue;
    let writtenValue = valueInput.value;
    // Hidden value writes also replace the native default attribute. Preserve
    // the reset value unless a later application write replaces that default.
    const attributes = attributeSnapshot();
    const initialStatus = status.textContent;
    let writtenStatus = initialStatus;
    const describedBy = valueInput.getAttribute('aria-describedby');
    const invalid = valueInput.getAttribute('aria-invalid');
    const placeholder = valueInput.getAttribute('placeholder') || '';
    const autocomplete = valueInput.getAttribute('autocomplete') || 'off';
    const delimiters = Array.from(tagInput.dataset.delimiters || ',');
    const delimiterPattern = `[${escapeCharacterClass(delimiters.join(''))}]`;
    const delimiterRegex = new RegExp(delimiterPattern);
    const splitRegex = new RegExp(`${delimiterPattern}|\\r\\n|[\\r\\n]`, 'g');
    const tokenRegex = new RegExp(`(${delimiterPattern}|\\r\\n|[\\r\\n])`, 'g');
    const maxTags = Number.parseInt(tagInput.dataset.maxTags || '', 10);
    const allowDuplicates = tagInput.hasAttribute('data-allow-duplicates');

    const parseTags = (value) =>
      value
        .split(splitRegex)
        .map((tag) => tag.trim())
        .filter((tag, index, all) => tag && (allowDuplicates || all.indexOf(tag) === index));
    let tags = parseTags(valueInput.value);

    attributes.set(valueInput, 'type', 'hidden');
    for (const name of ['id', 'aria-describedby', 'aria-invalid', 'placeholder'])
      attributes.set(valueInput, name, null);

    const list = doc.createElement('div');
    list.className = 'tag-input-list';
    list.setAttribute('role', 'list');

    const entry = doc.createElement('span');
    entry.className = 'tag-input-entry';
    entry.setAttribute('role', 'listitem');

    const retained = retainedDrafts.get(valueInput);
    const draft = retained?.draft || doc.createElement('input');
    retainedDrafts.delete(valueInput);
    draft.className = 'tag-input-control';
    draft.id = inputId;
    draft.type = 'text';
    draft.placeholder = placeholder;
    draft.autocomplete = autocomplete;
    draft.spellcheck = valueInput.spellcheck;
    draft.disabled = valueInput.disabled;
    draft.readOnly = valueInput.readOnly;
    if (valueInput.hasAttribute('form'))
      draft.setAttribute('form', valueInput.getAttribute('form'));
    if (describedBy) draft.setAttribute('aria-describedby', describedBy);
    if (invalid) draft.setAttribute('aria-invalid', invalid);

    entry.append(draft);
    retained?.label.remove();
    list.append(entry);
    field.append(list);

    const announce = (message, isError = false) => {
      status.textContent = message;
      writtenStatus = status.textContent;
      if (isError) attributes.set(tagInput, 'data-state', 'error');
      else if (tagInput.dataset.state === 'error') attributes.set(tagInput, 'data-state', null);
    };

    const adoptValue = () => {
      if (valueInput.defaultValue !== writtenValue) resetValue = valueInput.defaultValue;
      if (valueInput.value === writtenValue) return false;
      tags = parseTags(valueInput.value);
      writtenValue = valueInput.value;
      render();
      return true;
    };

    const writeValue = (source, emit = true) => {
      valueInput.value = tags.join(', ');
      writtenValue = valueInput.value;
      draft.required = valueInput.required && tags.length === 0;
      if (!emit) return;

      valueInput.dispatchEvent(new Event('input', { bubbles: true }));
      valueInput.dispatchEvent(new Event('change', { bubbles: true }));
      tagInput.dispatchEvent(
        new CustomEvent('tag-input:change', {
          bubbles: true,
          detail: { tags: tags.slice(), source }
        })
      );
    };

    const removeTag = (index, source) => {
      if (draft.matches(':disabled') || draft.readOnly) return;
      // A stale Remove button must not remove a different application value.
      if (adoptValue()) return;
      const removed = tags[index];
      if (removed === undefined) return;
      tags = tags.filter((_tag, tagIndex) => tagIndex !== index);
      render();
      writeValue(source);
      announce(`Removed ${removed}.`);
      draft.focus();
    };

    const render = () => {
      list.querySelectorAll('.tag-input-tag').forEach((tag) => tag.remove());

      tags.forEach((tag, index) => {
        const item = doc.createElement('span');
        item.className = 'tag-input-tag';
        item.setAttribute('role', 'listitem');

        const label = doc.createElement('span');
        label.className = 'tag-input-tag-label';
        label.textContent = tag;
        label.title = tag;

        const remove = doc.createElement('button');
        remove.type = 'button';
        remove.className = 'tag-input-remove';
        remove.setAttribute('aria-label', `Remove ${tag}`);
        remove.disabled = valueInput.matches(':disabled') || valueInput.readOnly;
        remove.dataset.tagIndex = String(index);

        const icon = doc.createElement('template');
        icon.innerHTML =
          '<svg width="12" height="12" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"/></svg>';
        remove.append(icon.content.cloneNode(true));

        item.append(label, remove);
        list.insertBefore(item, entry);
      });
    };

    const addParts = (parts, source) => {
      const accepted = new Set();
      if (draft.matches(':disabled') || draft.readOnly) return accepted;
      adoptValue();
      let added = 0;
      let lastError = '';

      parts.forEach((part, index) => {
        const tag = part.trim();
        if (!tag) return;

        if (!allowDuplicates && tags.includes(tag)) {
          lastError = `${tag} is already added.`;
          return;
        }

        if (Number.isFinite(maxTags) && tags.length >= maxTags) {
          lastError = `Add no more than ${maxTags} tags.`;
          return;
        }

        tags.push(tag);
        accepted.add(index);
        added += 1;
      });

      if (added > 0) {
        render();
        writeValue(source);
      }

      if (lastError) announce(lastError, true);
      else if (added > 0) announce(`${added} ${added === 1 ? 'tag' : 'tags'} added.`);

      return accepted;
    };

    const commitDraft = (text, source, keepTrailing = false) => {
      const tokens = text.split(tokenRegex);
      const parts = tokens.filter((_token, index) => index % 2 === 0);
      const completed = keepTrailing ? parts.slice(0, -1) : parts;
      const accepted = addParts(completed, source);
      // Retain original whitespace and separators when nothing can be added.
      // After partial acceptance, remove only accepted parts and their separators.
      if (!accepted.size) {
        draft.value = text;
        return;
      }
      const remaining = parts
        .map((part, index) => ({ part, index }))
        .filter(
          ({ part, index }) =>
            !accepted.has(index) && (part.trim() || (keepTrailing && index === parts.length - 1))
        );
      draft.value = remaining
        .map(
          ({ part, index }, position) =>
            part + (position < remaining.length - 1 ? tokens[index * 2 + 1] || delimiters[0] : '')
        )
        .join('');
    };

    lifecycle.listen(tagInput, draft, 'keydown', (event) => {
      if (event.isComposing || draft.matches(':disabled') || draft.readOnly) return;
      if (event.key === 'Backspace' && draft.value === '' && tags.length > 0) {
        event.preventDefault();
        removeTag(tags.length - 1, 'backspace');
        return;
      }

      if (event.key !== 'Enter' && !delimiters.includes(event.key)) return;
      event.preventDefault();
      if (!draft.value.trim()) draft.value = '';
      else commitDraft(draft.value, 'keyboard');
    });

    lifecycle.listen(tagInput, draft, 'input', (event) => {
      if (event.isComposing || draft.matches(':disabled') || draft.readOnly) return;
      if (!delimiterRegex.test(draft.value)) return;
      commitDraft(draft.value, 'delimiter', true);
    });

    lifecycle.listen(tagInput, draft, 'paste', (event) => {
      if (draft.matches(':disabled') || draft.readOnly) return;
      const text =
        event.clipboardData?.getData('text/plain') || event.clipboardData?.getData('text') || '';
      if (!delimiterRegex.test(text) && !/[\r\n]/.test(text)) return;

      event.preventDefault();
      const start = draft.selectionStart ?? draft.value.length;
      const end = draft.selectionEnd ?? start;
      commitDraft(`${draft.value.slice(0, start)}${text}${draft.value.slice(end)}`, 'paste');
    });

    lifecycle.listen(tagInput, list, 'click', (event) => {
      const button = event.target.closest('.tag-input-remove');
      if (!button || button.disabled) return;
      const index = Number.parseInt(button.dataset.tagIndex || '', 10);
      if (Number.isInteger(index)) removeTag(index, 'remove');
    });

    lifecycle.listen(tagInput, field, 'click', (event) => {
      if (event.target === field || event.target === list || event.target === entry) draft.focus();
    });

    lifecycle.listen(tagInput, valueInput.form, 'submit', (event) => {
      if (!draft.value.trim()) return;
      commitDraft(draft.value, 'submit');
      if (draft.value.trim()) event.preventDefault();
    });

    lifecycle.reset(tagInput, valueInput.form, () => {
      if (valueInput.defaultValue !== writtenValue) resetValue = valueInput.value;
      tags = parseTags(resetValue);
      draft.value = '';
      render();
      writeValue('reset', false);
      announce('');
    });
    lifecycle.add(tagInput, () => {
      const currentValue = valueInput.value;
      const ownsDefault = valueInput.defaultValue === writtenValue;
      attributes.restore();
      if (ownsDefault) valueInput.defaultValue = resetValue;
      valueInput.value = currentValue;
      if (draft.value) {
        draft.remove();
        if (draft.id === inputId) draft.removeAttribute('id');
        draft.className = 'tag-input-fallback';
        draft.required = false;
        const label = doc.createElement('label');
        label.textContent = 'Uncommitted tags';
        label.append(draft);
        field.append(label);
        retainedDrafts.set(valueInput, { draft, label });
      }
      list.remove();
      if (status.textContent === writtenStatus) status.textContent = initialStatus;
    });

    lifecycle.onUpdate(tagInput, () => {
      adoptValue();
      draft.disabled = valueInput.disabled;
      draft.readOnly = valueInput.readOnly;
      draft.required = valueInput.required && tags.length === 0;
      list.querySelectorAll('.tag-input-remove').forEach((button) => {
        button.disabled = valueInput.matches(':disabled') || valueInput.readOnly;
      });
    });
    render();
    writeValue('initial', false);
    attributes.set(tagInput, 'data-enhanced', '');
  });
}

export function destroy(root) {
  lifecycle.destroy(root);
}

export const behavior = { name: 'tag-input', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
