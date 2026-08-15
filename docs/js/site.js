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

  // -- Move the component-skill <details> out of the sticky
  // page header so the header stays compact and the details
  // scrolls with the page content.
  function moveSpecDetails() {
    var main = document.querySelector('main');
    if (!main) return;
    var pageHeader = main.querySelector('.page-header');
    var details = pageHeader ? pageHeader.querySelector('details') : main.querySelector('details');
    if (details && pageHeader && pageHeader.contains(details)) {
      pageHeader.insertAdjacentElement('afterend', details);
    }
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

    // Component skill details out of the sticky page header
    moveSpecDetails();
  }

  // Register content initializer with SPA router
  // (runs on initial load AND after each SPA navigation)
  window.onPageReady(initPageContent);

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

    // Handle hash-link clicks (TOC links, etc.)
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
