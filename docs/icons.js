// Resolve local Remix `ri-*` class hooks to inline SVG from library/src/icons.
// The class stays in the authored markup; only the rendered glyph is injected.
(() => {
  const base = new URL('../library/src/icons/', location.href);
  const seen = new WeakSet();

  function iconName(el) {
    const cls = [...el.classList].find((name) => name.startsWith('ri-'));
    return cls ? cls.slice(3) : null;
  }

  async function load(el) {
    const name = iconName(el);
    if (!name) return;
    try {
      const response = await fetch(new URL(`${name}.svg`, base));
      if (!response.ok) return;
      el.innerHTML = await response.text();
    } catch {
      // Keep the empty local hook when the asset cannot be fetched.
    }
  }

  function enhance(root = document) {
    const scope = root.nodeType === 1 ? root : document;
    const nodes = scope.matches?.('[class^="ri-"], [class*=" ri-"]')
      ? [scope]
      : [...scope.querySelectorAll('[class^="ri-"], [class*=" ri-"]')];
    for (const el of nodes) {
      if (seen.has(el)) continue;
      seen.add(el);
      load(el);
    }
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
