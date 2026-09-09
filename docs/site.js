// -- site.js -------------------------------------------------
// Doc-site-only script for the mewa_ui documentation site.
// Component behavior lives in library/components/*.js.
// Serve the preview over HTTP so local icons can be fetched.
// Include via <script src="site.js" defer></script>

(function () {
  'use strict';

  // -- Local icons ------------------------------------------
  // Replaces <i class="ri-name-line|fill"> with the matching inline SVG
  // from ../library/src/icons/{name}-{line|fill}.svg.
  var iconCache = {};

  function initLocalIcons() {
    document.querySelectorAll('i[class^="ri-"], i[class*=" ri-"]').forEach(function (el) {
      if (el.dataset.remixIconLoaded !== undefined) return;
      var className = Array.from(el.classList).find(function (name) {
        return /^ri-[a-z0-9-]+$/.test(name) && name !== 'ri-fw';
      });
      if (!className) return;
      var name = className.slice(3);
      el.dataset.remixIconLoaded = '';
      var apply = function (svgText) {
        var wrapper = document.createElement('div');
        wrapper.innerHTML = svgText.trim();
        var svg = wrapper.firstElementChild;
        if (!svg || svg.tagName.toLowerCase() !== 'svg') return;
        for (var i = 0; i < el.attributes.length; i++) {
          var attr = el.attributes[i];
          if (attr.name === 'data-remix-icon-loaded') continue;
          svg.setAttribute(attr.name, attr.value);
        }
        el.replaceWith(svg);
      };
      if (!iconCache[name]) {
        iconCache[name] = fetch('../library/src/icons/' + encodeURIComponent(name) + '.svg')
          .then(function (response) {
            if (!response.ok) {
              delete iconCache[name];
              return null;
            }
            return response.text();
          })
          .catch(function () {
            delete iconCache[name];
            return null;
          });
      }
      iconCache[name].then(function (text) {
        if (text && el.isConnected) apply(text);
        else if (!text) delete el.dataset.remixIconLoaded;
      });
    });
  }

  // -- Preview initializer ---------------------------------
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
        navigator.clipboard
          .writeText(pre.innerText)
          .then(function () {
            showStatus(
              '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M9.9997 15.1709L19.1921 5.97852L20.6063 7.39273L9.9997 17.9993L3.63574 11.6354L5.04996 10.2212L9.9997 15.1709Z"/></svg> Copied'
            );
          })
          .catch(function () {
            showStatus('Copy failed');
          });
      });
    });

    // Local icons (<i class="ri-name-line|fill"> → inline SVG from library/src/icons)
    initLocalIcons();
  }

  document.addEventListener('DOMContentLoaded', initPageContent);
})();
