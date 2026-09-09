/* -- Image component ----------------------------------------- */

import { queryAll, createLifecycle } from '../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../runtime/enhancer.js';
/* mewa:auto:end */

const lifecycle = createLifecycle('image');

const initializedDocuments = new WeakSet();

export function enhance(root) {
  const ownerDocument =
    root?.nodeType === 9
      ? root
      : root?.ownerDocument || (typeof document === 'undefined' ? null : document);
  if (!ownerDocument) return;
  installPreviewListener(ownerDocument);
  /* -- Fallback: mark images that fail to load ----------------- */
  queryAll(root, '.image > img').forEach((img) => {
    img.closest('.image').dataset.init = '';
    const figure = img.closest('.image');
    if (lifecycle.has(figure)) return;
    figure.dataset.mewaImageInit = '';
    lifecycle.add(figure, () => delete img.dataset.error);

    if (img.complete && img.naturalWidth === 0) {
      img.dataset.error = '';
    }

    lifecycle.listen(figure, img, 'error', () => {
      img.dataset.error = '';
    });

    lifecycle.listen(figure, img, 'load', () => {
      delete img.dataset.error;
    });

    if (!figure.hasAttribute('data-preview')) return;

    figure.setAttribute('tabindex', '0');
    if (!figure.hasAttribute('role')) figure.setAttribute('role', 'button');
    if (!figure.hasAttribute('aria-label') && !figure.hasAttribute('aria-labelledby')) {
      figure.setAttribute(
        'aria-label',
        img.alt ? `Open image preview: ${img.alt}` : 'Open image preview'
      );
    }

    lifecycle.listen(figure, figure, 'keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (img.dataset.error !== undefined) return;
      event.preventDefault();
      openLightbox(img.ownerDocument, img.src, img.alt);
    });
  });
}

/* -- Lightbox ------------------------------------------------ */
let lightbox = null;
let lightboxImg = null;
let zoom = 1;
let rotation = 0;

function getLightbox(ownerDocument) {
  if (lightbox && lightbox.isConnected && lightbox.ownerDocument === ownerDocument) return lightbox;

  // SPA navigation can remove the shared dialog from the document. Do not
  // retain the detached node or its image reference when recreating it.
  lightbox = null;
  lightboxImg = null;

  lightbox = ownerDocument.createElement('dialog');
  lightbox.className = 'image-lightbox';
  lightbox.setAttribute('aria-label', 'Image preview');

  lightbox.innerHTML = `
    <div class="image-lightbox-content">
      <img src="" alt="" />
    </div>
    <div class="image-lightbox-toolbar">
      <button class="image-lightbox-btn" type="button" data-action="zoom-in" aria-label="Zoom in">
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748ZM10 10V7H12V10H15V12H12V15H10V12H7V10H10Z"/></svg>
      </button>
      <button class="image-lightbox-btn" type="button" data-action="zoom-out" aria-label="Zoom out">
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748ZM7 10H15V12H7V10Z"/></svg>
      </button>
      <button class="image-lightbox-btn" type="button" data-action="rotate-left" aria-label="Rotate left">
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11 9H21C21.5522 9 22 9.44772 22 10V20C22 20.5523 21.5522 21 21 21H11C10.4477 21 9.99996 20.5523 9.99996 20V10C9.99996 9.44772 10.4477 9 11 9ZM12 11V19H20V11H12ZM5.99996 10.5858L7.82839 8.75736L9.24261 10.1716L4.99996 14.4142L0.757324 10.1716L2.17154 8.75736L3.99996 10.5858V8C3.99996 5.23858 6.23854 3 8.99996 3H13V5H8.99996C7.34311 5 5.99996 6.34315 5.99996 8V10.5858Z"/></svg>
      </button>
      <button class="image-lightbox-btn" type="button" data-action="rotate-right" aria-label="Rotate right">
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20 10.5858L21.8284 8.75736L23.2426 10.1716L19 14.4142L14.7574 10.1716L16.1716 8.75736L18 10.5858V8C18 6.34315 16.6569 5 15 5H11V3H15C17.7614 3 20 5.23858 20 8V10.5858ZM13 9C13.5523 9 14 9.44772 14 10V20C14 20.5523 13.5523 21 13 21H3C2.44772 21 2 20.5523 2 20V10C2 9.44772 2.44772 9 3 9H13ZM12 11H4V19H12V11Z"/></svg>
      </button>
      <button class="image-lightbox-btn" type="button" data-action="reset" aria-label="Reset">
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M5.46257 4.43262C7.21556 2.91688 9.5007 2 12 2C17.5228 2 22 6.47715 22 12C22 14.1361 21.3302 16.1158 20.1892 17.7406L17 12H20C20 7.58172 16.4183 4 12 4C9.84982 4 7.89777 4.84827 6.46023 6.22842L5.46257 4.43262ZM18.5374 19.5674C16.7844 21.0831 14.4993 22 12 22C6.47715 22 2 17.5228 2 12C2 9.86386 2.66979 7.88416 3.8108 6.25944L7 12H4C4 16.4183 7.58172 20 12 20C14.1502 20 16.1022 19.1517 17.5398 17.7716L18.5374 19.5674Z"/></svg>
      </button>
      <button class="image-lightbox-btn" type="button" data-action="close" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"/></svg>
      </button>
    </div>`;

  lightboxImg = lightbox.querySelector('.image-lightbox-content > img');

  lifecycle.listen(lightbox, lightbox.querySelector('.image-lightbox-toolbar'), 'click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    if (action === 'zoom-in') zoom = Math.min(zoom + 0.25, 5);
    else if (action === 'zoom-out') zoom = Math.max(zoom - 0.25, 0.25);
    else if (action === 'rotate-left') rotation -= 90;
    else if (action === 'rotate-right') rotation += 90;
    else if (action === 'reset') {
      zoom = 1;
      rotation = 0;
    } else if (action === 'close') {
      lightbox.close();
      return;
    }

    applyTransform();
  });

  lifecycle.listen(lightbox, lightbox, 'click', (e) => {
    if (e.target === lightbox) lightbox.close();
  });

  ownerDocument.body.appendChild(lightbox);
  return lightbox;
}

function applyTransform() {
  if (lightboxImg) {
    lightboxImg.style.transform = `scale(${zoom}) rotate(${rotation}deg)`;
  }
}

function openLightbox(ownerDocument, src, alt) {
  const lb = getLightbox(ownerDocument);
  zoom = 1;
  rotation = 0;
  lightboxImg.src = src;
  lightboxImg.alt = alt || '';
  lightboxImg.style.transform = '';
  if (!lb.open && typeof lb.showModal === 'function') lb.showModal();
}

/* -- Attach preview click handlers --------------------------- */
function installPreviewListener(ownerDocument) {
  if (initializedDocuments.has(ownerDocument)) return;
  initializedDocuments.add(ownerDocument);
  lifecycle.add(ownerDocument, () => initializedDocuments.delete(ownerDocument));

  lifecycle.listen(ownerDocument, ownerDocument, 'click', (e) => {
    const figure = e.target.closest('.image[data-preview][data-mewa-image-init]');
    if (!figure) return;

    const img = figure.querySelector('img');
    if (!img || img.dataset.error !== undefined) return;

    openLightbox(ownerDocument, img.src, img.alt);
  });
}

export function destroy(root) {
  lifecycle.destroy(root);
  if (root?.nodeType === 9 && lightbox?.ownerDocument === root) {
    lightbox.remove();
    lightbox = null;
    lightboxImg = null;
  }
}

export const behavior = { name: 'image', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */
