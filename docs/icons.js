// Resolve local Remix `ri-*` class hooks to inline SVG from library/src/icons.
// The class stays in the authored markup; only the rendered glyph is injected.
(() => {
  const base = new URL('../library/src/icons/', location.href);
  const glyphs = new Map();
  const pending = new WeakMap();
  const owned = new WeakMap();
  const marker = 'data-docs-icon-loaded';

  function iconName(el) {
    const cls = [...el.classList].find((name) => name.startsWith('ri-'));
    const name = cls?.slice(3);
    // Local filenames only: no paths, URL escapes, queries, or fragments.
    return name && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) ? name : null;
  }

  function isHost(el) {
    return el.namespaceURI === 'http://www.w3.org/1999/xhtml' && !el.closest('svg');
  }

  function canWrite(el) {
    const previous = owned.get(el);
    if (previous && el.childNodes.length === 1 && el.firstChild === previous.node) return true;
    if (previous) {
      owned.delete(el);
      el.removeAttribute(marker);
    }
    return el.childNodes.length === 0;
  }

  function glyph(name) {
    if (!glyphs.has(name)) {
      const request = (async () => {
        const response = await fetch(new URL(`${name}.svg`, base));
        if (!response.ok) throw new Error('Icon request failed');
        const template = document.createElement('template');
        template.innerHTML = (await response.text()).trim();
        const svg = template.content.firstChild;
        if (
          template.content.childNodes.length !== 1 ||
          svg?.namespaceURI !== 'http://www.w3.org/2000/svg' ||
          svg.localName !== 'svg'
        )
          throw new Error('Invalid icon response');
        return svg;
      })().catch(() => {
        // A later enhancement can retry a failed network or invalid SVG response.
        glyphs.delete(name);
        return null;
      });
      glyphs.set(name, request);
    }
    return glyphs.get(name);
  }

  function load(el) {
    if (!el.isConnected || !isHost(el) || !canWrite(el)) return;
    const name = iconName(el);
    if (!name) {
      pending.delete(el);
      if (owned.has(el)) {
        el.replaceChildren();
        el.removeAttribute(marker);
        owned.delete(el);
      }
      return;
    }
    // Supersede in-flight work even when reverting to the currently rendered glyph.
    if (pending.get(el)?.name !== name) pending.delete(el);
    if (owned.get(el)?.name === name) return;
    if (pending.has(el)) return pending.get(el).promise;
    const request = { name };
    request.promise = glyph(name).then((svg) => {
      if (pending.get(el) !== request) return;
      pending.delete(el);
      if (!svg || !el.isConnected || !isHost(el) || iconName(el) !== name || !canWrite(el)) return;
      const node = svg.cloneNode(true);
      el.replaceChildren(node);
      owned.set(el, { name, node });
      el.setAttribute(marker, name);
    });
    pending.set(el, request);
    return request.promise;
  }

  function enhance(root = document) {
    // Include the root AND descendants; classList handles every HTML space character.
    const nodes = [...root.querySelectorAll(`[class], [${marker}]`)];
    if (root.nodeType === 1) nodes.unshift(root);
    return Promise.all(nodes.map(load));
  }

  window.mewaDocsIcons = { enhance };
  const start = () => {
    enhance();
    new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes) if (node.nodeType === 1) enhance(node);
    }).observe(document.documentElement, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
