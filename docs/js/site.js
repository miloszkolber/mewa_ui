// -- site.js -------------------------------------------------
// Doc-site-only script for the mewa_ui documentation site.
// Component behavior lives in components/*.js.
// No ES modules — works with file:// protocol.
// Include via <script src="js/site.js" defer></script>

(function () {
  'use strict';

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { /* storage unavailable (privacy mode) — theme still toggles */ }
    return null;
  }

  function syncThemeIcons(isDark) {
    var sun = document.getElementById('icon-sun');
    var moon = document.getElementById('icon-moon');
    if (sun) sun.style.display  = isDark ? 'none'  : 'block';
    if (moon) moon.style.display = isDark ? 'block' : 'none';
  }

  function toggleDark() {
    var isDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', !isDark);
    document.documentElement.style.colorScheme = isDark ? 'light' : 'dark';
    syncThemeIcons(!isDark);
    store('mewa-theme', !isDark ? 'dark' : 'light');
  }

  // -- Local icons ------------------------------------------
  // Replaces <i data-lucide="name"> with the matching inline SVG
  // from ../src/icons/{name}.svg (relative to the page at docs/).
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
      /* Known-missing icons (null) are skipped so failed fetches
         are not repeated on every SPA navigation. */
      if (iconCache[name] !== undefined) {
        if (iconCache[name]) apply(iconCache[name]);
        return;
      }
      fetch('../src/icons/' + name + '.svg')
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          return r.text();
        })
        .then(function (text) { iconCache[name] = text; apply(text); })
        .catch(function () { iconCache[name] = null; });
    });
  }

  // -- Reusable page content initializer -------------------
  // Called on initial load AND after each SPA navigation.
  function initPageContent() {

    // Keep horizontally scrollable code blocks keyboard reachable.
    document.querySelectorAll('pre:not([tabindex])').forEach(function (pre) {
      pre.setAttribute('tabindex', '0');
    });

    // Copy buttons. The guard keeps repeated page-ready calls idempotent and
    // preserves focus while the fixed, trusted status label changes.
    document.querySelectorAll('.copy-btn:not([data-copy-init])').forEach(function (btn) {
      btn.dataset.copyInit = '';
      var originalMarkup = btn.innerHTML;
      var resetTimer = null;
      var reset = function () {
        btn.innerHTML = originalMarkup;
        resetTimer = null;
      };
      var showStatus = function (markup) {
        if (resetTimer) clearTimeout(resetTimer);
        btn.innerHTML = markup;
        resetTimer = setTimeout(reset, 2000);
      };

      btn.addEventListener('click', function () {
        var pre = btn.nextElementSibling;
        if (!pre) return;
        if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
          showStatus('Copy unavailable');
          return;
        }
        navigator.clipboard.writeText(pre.innerText).then(function () {
          showStatus('<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Copied');
        }).catch(function () {
          showStatus('Copy failed');
        });
      });
    });

    // Local icons (<i data-lucide="name"> → inline SVG from src/icons)
    initLocalIcons();
  }

  // Register content initializer with SPA router
  // (runs on initial load AND after each SPA navigation)
  (window.onPageReady || function (fn) { document.addEventListener('DOMContentLoaded', fn); })(initPageContent);

  // -- On DOM ready (one-time setup + initial content init) -
  document.addEventListener('DOMContentLoaded', function () {
    // Sync dark mode icon state
    syncThemeIcons(document.documentElement.classList.contains('dark'));

    // Bind theme toggle (once — header persists across SPA navs)
    var themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleDark);

    // Handle hash-link clicks (TOC links, etc.)
    // Default anchor scroll doesn't always work after SPA navigation
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        history.replaceState(null, '', '#' + id);
      }
    });
  });
})();
