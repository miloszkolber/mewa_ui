// -- File Upload -----------------------------------------------

const cleanupByUpload = new WeakMap();

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 1024) return `${bytes} B`;

  const units = ['KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  do {
    value /= 1024;
    unit += 1;
  } while (value >= 1024 && unit < units.length);

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unit - 1]}`;
}

function matchesAccept(file, accept) {
  if (!accept) return true;

  const name = file.name.toLocaleLowerCase();
  const type = file.type.toLocaleLowerCase();
  return accept.split(',').some((entry) => {
    const rule = entry.trim().toLocaleLowerCase();
    if (!rule) return false;
    if (rule.startsWith('.')) return name.endsWith(rule);
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

function droppedDirectory(dataTransfer) {
  return Array.from(dataTransfer.items || []).some((item) => {
    if (item.kind !== 'file' || typeof item.webkitGetAsEntry !== 'function') return false;
    return Boolean(item.webkitGetAsEntry()?.isDirectory);
  });
}

function init() {
  document.querySelectorAll('[data-file-upload]:not([data-init])').forEach((root) => {
    root.dataset.init = '';

    const dropzone = root.querySelector('.file-upload-dropzone');
    const input = root.querySelector('.file-upload-input[type="file"]');
    const list = root.querySelector('[data-file-upload-list]');
    const status = root.querySelector('[data-file-upload-status]');
    const error = root.querySelector('[data-file-upload-error]');

    if (!dropzone || !input || !list || !status || !error) {
      root.removeAttribute('data-init');
      return;
    }

    let files = Array.from(input.files || []);
    let previewUrls = [];
    let dragDepth = 0;
    let synchronizing = false;

    const maxFiles = Number.parseInt(root.dataset.maxFiles || '', 10);
    const maxSize = Number.parseInt(root.dataset.maxSize || '', 10);

    const clearPreviews = () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      previewUrls = [];
    };

    const setError = (message) => {
      error.textContent = message;
      error.hidden = false;
      root.dataset.state = 'error';
    };

    const clearError = () => {
      error.textContent = '';
      error.hidden = true;
      if (root.dataset.state === 'error') delete root.dataset.state;
    };

    const validate = (incoming, existingCount = 0) => {
      if (incoming.some((file) => !matchesAccept(file, input.accept))) {
        return 'One or more files do not match the accepted file types.';
      }

      if (Number.isFinite(maxSize) && incoming.some((file) => file.size > maxSize)) {
        return `Each file must be ${formatBytes(maxSize)} or smaller.`;
      }

      if (Number.isFinite(maxFiles) && existingCount + incoming.length > maxFiles) {
        return `Choose no more than ${maxFiles} files.`;
      }

      return '';
    };

    const render = () => {
      clearPreviews();
      list.replaceChildren();

      files.forEach((file, index) => {
        const item = document.createElement('li');
        item.className = 'file-upload-item';

        if (root.hasAttribute('data-preview') && file.type.startsWith('image/')) {
          const image = document.createElement('img');
          const url = URL.createObjectURL(file);
          previewUrls.push(url);
          image.className = 'file-upload-preview';
          image.src = url;
          image.alt = '';
          item.append(image);
        } else {
          const marker = document.createElement('span');
          marker.className = 'file-upload-preview';
          marker.setAttribute('aria-hidden', 'true');
          marker.textContent = 'FILE';
          item.append(marker);
        }

        const details = document.createElement('span');
        details.className = 'file-upload-file';

        const name = document.createElement('span');
        name.className = 'file-upload-name';
        name.textContent = file.name;
        name.title = file.name;

        const meta = document.createElement('span');
        meta.className = 'file-upload-meta';
        meta.textContent = `${file.type || 'File'} · ${formatBytes(file.size)}`;

        details.append(name, meta);

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'file-upload-remove';
        remove.textContent = 'Remove';
        remove.setAttribute('aria-label', `Remove ${file.name}`);
        remove.disabled = input.disabled;
        remove.dataset.fileIndex = String(index);

        item.append(details, remove);
        list.append(item);
      });

      status.textContent = files.length === 0
        ? ''
        : `${files.length} ${files.length === 1 ? 'file' : 'files'} selected.`;
    };

    const assignNativeFiles = (next) => {
      if (typeof DataTransfer !== 'function') return false;
      try {
        const transfer = new DataTransfer();
        next.forEach((file) => transfer.items.add(file));
        input.files = transfer.files;
        return true;
      } catch (_error) {
        return false;
      }
    };

    const emitChange = (source) => {
      root.dispatchEvent(new CustomEvent('file-upload:change', {
        bubbles: true,
        detail: { files: files.slice(), source }
      }));
    };

    const commit = (next, source, dispatchNative = false) => {
      if (!assignNativeFiles(next)) {
        setError('This browser cannot add dropped files to the form control. Use the file picker.');
        return false;
      }

      files = next;
      clearError();
      render();

      if (dispatchNative) {
        synchronizing = true;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        synchronizing = false;
      }

      emitChange(source);
      return true;
    };

    input.addEventListener('change', () => {
      if (synchronizing) return;

      const incoming = Array.from(input.files || []);
      const validationError = validate(incoming);
      if (validationError) {
        input.value = '';
        files = [];
        render();
        setError(validationError);
        return;
      }

      files = incoming;
      clearError();
      render();
      emitChange('picker');
    });

    dropzone.addEventListener('dragenter', (event) => {
      if (input.disabled || !Array.from(event.dataTransfer?.types || []).includes('Files')) return;
      event.preventDefault();
      dragDepth += 1;
      root.dataset.dragging = '';
    });

    dropzone.addEventListener('dragover', (event) => {
      if (input.disabled || !event.dataTransfer) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      root.dataset.dragging = '';
    });

    dropzone.addEventListener('dragleave', () => {
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) delete root.dataset.dragging;
    });

    dropzone.addEventListener('drop', (event) => {
      if (input.disabled || !event.dataTransfer) return;
      event.preventDefault();
      dragDepth = 0;
      delete root.dataset.dragging;

      if (droppedDirectory(event.dataTransfer)) {
        setError('Choose files instead of a folder.');
        return;
      }

      const dropped = Array.from(event.dataTransfer.files || []);
      const incoming = input.multiple ? dropped : dropped.slice(0, 1);
      const existingCount = input.multiple ? files.length : 0;
      const validationError = validate(incoming, existingCount);
      if (validationError) {
        setError(validationError);
        return;
      }

      const next = input.multiple ? [...files, ...incoming] : incoming;
      commit(next, 'drop', true);
    });

    list.addEventListener('click', (event) => {
      const button = event.target.closest('.file-upload-remove');
      if (!button || button.disabled) return;

      const index = Number.parseInt(button.dataset.fileIndex || '', 10);
      if (!Number.isInteger(index) || !files[index]) return;
      commit(files.filter((_file, fileIndex) => fileIndex !== index), 'remove', true);
    });

    render();
    root.dataset.enhanced = '';
    cleanupByUpload.set(root, clearPreviews);
  });
}

function cleanupRemoved(node) {
  if (!(node instanceof Element)) return;
  const uploads = [
    ...(node.matches('[data-file-upload]') ? [node] : []),
    ...node.querySelectorAll('[data-file-upload]')
  ];
  uploads.forEach((upload) => cleanupByUpload.get(upload)?.());
}

init();
new MutationObserver((records) => {
  records.forEach((record) => record.removedNodes.forEach(cleanupRemoved));
  init();
}).observe(document, { childList: true, subtree: true });
