// -- site.js -------------------------------------------------
// Doc-site-only script for the mewa_ui documentation site.
// Component behavior lives in components/*.js.
// No ES modules — works with file:// protocol.
// Include via <script src="js/site.js" defer></script>

(function () {
  'use strict';

  function toggleDark() {
    var isDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', !isDark);
    document.documentElement.style.colorScheme = isDark ? 'light' : 'dark';
    document.getElementById('icon-sun').style.display  = isDark ? 'block' : 'none';
    document.getElementById('icon-moon').style.display = isDark ? 'none'  : 'block';
    localStorage.setItem('mewa-theme', isDark ? 'light' : 'dark');
  }

  // -- Local icons ------------------------------------------
  // Replaces <i data-lucide="name"> with the matching inline SVG
  // from ../../src/icons/{name}.svg (relative to the page at docs/).
  var iconCache = {};

  function initLocalIcons() {
    document.querySelectorAll('[data-lucide]:not([data-icon-loaded])').forEach(function (el) {
      var name = el.getAttribute('data-lucide');
      if (!name) return;
      el.dataset.iconLoaded = '';
      var apply = function (svgText) {
        var wrapper = document.createElement('div');
        wrapper.innerHTML = svgText.trim();
        var svg = wrapper.firstElementChild;
        if (!svg || svg.tagName.toLowerCase() !== 'svg') return;
        for (var i = 0; i < el.attributes.length; i++) {
          var attr = el.attributes[i];
          if (attr.name === 'data-icon-loaded') continue;
          svg.setAttribute(attr.name, attr.value);
        }
        el.replaceWith(svg);
      };
      if (iconCache[name]) { apply(iconCache[name]); return; }
      fetch('../src/icons/' + name + '.svg')
        .then(function (r) { return r.text(); })
        .then(function (text) { iconCache[name] = text; apply(text); })
        .catch(function () { /* icon missing — leave the placeholder */ });
    });
  }

  // -- Code collapse/expand ---------------------------------
  var CODE_ICON = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>';

  function initCodeCollapse() {
    // Guard against duplicate init (SPA replaces main innerHTML, so this is a safety net)
    if (document.querySelector('.code-collapse-toolbar')) return;

    var previews = document.querySelectorAll('.preview');
    if (!previews.length) return;

    var pairs = [];

    previews.forEach(function (preview) {
      var wrapper = preview.nextElementSibling;
      if (!wrapper || wrapper.tagName !== 'DIV' || !wrapper.querySelector('pre')) return;

      wrapper.classList.add('code-block-wrapper');

      var toggle = document.createElement('button');
      toggle.className = 'code-toggle-btn';
      toggle.setAttribute('aria-expanded', 'true');
      toggle.innerHTML = CODE_ICON + ' Hide code';

      preview.parentNode.insertBefore(toggle, wrapper);

      toggle.addEventListener('click', function () {
        var collapsed = wrapper.classList.toggle('code-collapsed');
        toggle.setAttribute('aria-expanded', String(!collapsed));
        toggle.innerHTML = CODE_ICON + (collapsed ? ' Show code' : ' Hide code');
        syncAllBtn();
      });

      pairs.push({ toggle: toggle, wrapper: wrapper });
    });

    if (!pairs.length) return;

    // Collapse-all / Expand-all toolbar
    var toolbar = document.createElement('div');
    toolbar.className = 'code-collapse-toolbar';
    var allBtn = document.createElement('button');
    allBtn.className = 'code-collapse-all-btn';
    allBtn.innerHTML = CODE_ICON + ' Collapse all code';
    toolbar.appendChild(allBtn);

    var main = document.querySelector('main');
    if (!main) return;

    // Move spec <details> out of sticky page-header into scrollable area
    var pageHeader = main.querySelector('.page-header');
    var details = pageHeader ? pageHeader.querySelector('details') : main.querySelector('details');
    if (details && pageHeader && pageHeader.contains(details)) {
      pageHeader.insertAdjacentElement('afterend', details);
    }

    // Place toolbar inside the sticky header (after the last child)
    if (pageHeader) {
      pageHeader.appendChild(toolbar);
    } else if (details) {
      details.insertAdjacentElement('afterend', toolbar);
    } else {
      previews[0].insertAdjacentElement('beforebegin', toolbar);
    }

    function syncAllBtn() {
      var allCollapsed = pairs.every(function (p) { return p.wrapper.classList.contains('code-collapsed'); });
      allBtn.innerHTML = CODE_ICON + (allCollapsed ? ' Expand all code' : ' Collapse all code');
    }

    allBtn.addEventListener('click', function () {
      var allCollapsed = pairs.every(function (p) { return p.wrapper.classList.contains('code-collapsed'); });
      pairs.forEach(function (p) {
        if (allCollapsed) {
          p.wrapper.classList.remove('code-collapsed');
          p.toggle.setAttribute('aria-expanded', 'true');
          p.toggle.innerHTML = CODE_ICON + ' Hide code';
        } else {
          p.wrapper.classList.add('code-collapsed');
          p.toggle.setAttribute('aria-expanded', 'false');
          p.toggle.innerHTML = CODE_ICON + ' Show code';
        }
      });
      syncAllBtn();
    });
  }

  // -- Reusable page content initializer -------------------
  // Called on initial load AND after each SPA navigation.
  function initPageContent() {
    // Syntax highlighting handled by shiki-highlight.js module

    // Copy buttons
    document.querySelectorAll('.copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pre = btn.nextElementSibling;
        if (!pre) return;
        navigator.clipboard.writeText(pre.innerText).then(function () {
          btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Copied';
          setTimeout(function () {
            btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> Copy';
          }, 2000);
        });
      });
    });

    // Local icons (<i data-lucide="name"> → inline SVG from src/icons)
    initLocalIcons();

    // Code collapse/expand toggles
    initCodeCollapse();
  }

  // Register content initializer with SPA router
  // (runs on initial load AND after each SPA navigation)
  window.onPageReady(initPageContent);

  // -- Spec modal viewer (runs once, uses delegation) ------
  function initSpecModal() {
    var specDialog = document.createElement('dialog');
    specDialog.className = 'dialog spec-modal';
    specDialog.setAttribute('role', 'dialog');
    specDialog.setAttribute('aria-modal', 'true');
    specDialog.setAttribute('aria-label', 'Component skill');
    specDialog.innerHTML =
      '<div class="dialog-content spec-modal-content">' +
        '<div class="dialog-header" style="display:flex;justify-content:space-between;align-items:center;">' +
          '<h2 class="dialog-title" id="spec-modal-title">Component Skill</h2>' +
          '<button class="btn" data-variant="ghost" data-size="sm" data-dialog-close aria-label="Close" style="padding:0.25rem;">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
          '</button>' +
        '</div>' +
        '<div id="spec-modal-body" class="spec-modal-body" style="margin-top:1rem;overflow-y:auto;max-height:calc(80vh - 5rem);"></div>' +
      '</div>';
    document.body.appendChild(specDialog);

    specDialog.addEventListener('click', function (e) {
      if (e.target === specDialog) specDialog.close();
    });
    specDialog.querySelector('[data-dialog-close]').addEventListener('click', function () {
      specDialog.close();
    });

    // Uses document-level delegation — works automatically with SPA
    document.addEventListener('click', function (e) {
      var link = e.target.closest('[data-spec-href]');
      if (!link) return;
      e.preventDefault();
      e.stopPropagation();

      var body = document.getElementById('spec-modal-body');
      var title = document.getElementById('spec-modal-title');
      var href = link.getAttribute('data-spec-href');
      title.textContent = href.split('/').pop();

      var embedded = document.getElementById('spec-md-content');
      if (embedded) {
        renderSpec(embedded.textContent, body);
        specDialog.showModal();
        return;
      }

      body.innerHTML = '<p class="text-muted-foreground text-sm">Loading…</p>';
      specDialog.showModal();
      fetch(href)
        .then(function (r) { return r.text(); })
        .then(function (md) { renderSpec(md, body); })
        .catch(function () {
          body.innerHTML = '<p class="text-muted-foreground text-sm">Failed to load component skill.</p>';
        });
    });

    function renderSpec(md, body) {
      if (window.marked) {
        body.innerHTML = marked.parse(md);
        // Shiki highlighting for spec modal code blocks
        if (window.__shikiHighlightAll) window.__shikiHighlightAll();
      } else {
        var pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.fontSize = '0.8125rem';
        pre.textContent = md;
        body.innerHTML = '';
        body.appendChild(pre);
      }
    }
  }

  // -- On DOM ready (one-time setup + initial content init) -
  document.addEventListener('DOMContentLoaded', function () {
    // Sync dark mode icon state
    var isDark = document.documentElement.classList.contains('dark');
    var sun = document.getElementById('icon-sun');
    var moon = document.getElementById('icon-moon');
    if (sun) sun.style.display = isDark ? 'none' : 'block';
    if (moon) moon.style.display = isDark ? 'block' : 'none';

    // Bind theme toggle (once — header persists across SPA navs)
    var themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleDark);

    // Create spec modal (once — persists across SPA navs)
    initSpecModal();

    // Handle hash-link clicks (built-with pills, etc.)
    // Default anchor scroll doesn't always work after SPA navigation
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + id);
      }
    });
  });
})();
