// -- layout.js ------------------------------------------------
// Web Components for the shared site header and sidebar nav.
// SPA client-side router for flash-free navigation.
// Loaded synchronously in <head> so elements render without FOUC.

(function () {
  'use strict';

  /* -- Dark mode (must run before first paint) ----------------- */
  var THEME_KEY = 'mewa-ui-theme';
  var LEGACY_THEME_KEY = 'mewa-theme';

  function storedTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || localStorage.getItem(LEGACY_THEME_KEY);
    }
    catch { return null; } /* storage unavailable (privacy mode) */
  }

  var saved = storedTheme();
  var darkMQ = window.matchMedia('(prefers-color-scheme: dark)');
  var prefersDark = darkMQ.matches;
  var initialDark = saved === 'dark' || (!saved && prefersDark);

  function syncThemeState(isDark) {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }

  syncThemeState(initialDark);

  /* React to OS theme changes in real time (only if user hasn't set a manual preference) */
  darkMQ.addEventListener('change', function (e) {
    if (storedTheme()) return;   // user chose manually — respect it
    syncThemeState(e.matches);
  });

  /* -- SPA page-ready helper ----------------------------------- */
  /* Doc-site scripts (site.js) call window.onPageReady(fn)      */
  /* to register functions that run on initial load AND after     */
  /* each SPA navigation. Component modules auto-reinitialize    */
  /* via MutationObserver when the DOM changes.                  */
  var domReady = false;
  document.addEventListener('DOMContentLoaded', function () { domReady = true; });

  window.onPageReady = function (fn) {
    if (domReady) {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
    (window.__spaInits = window.__spaInits || []).push(fn);
  };

  /* -- Navigation data ---------------------------------------- */
  /* CATALOG-NAV:START */
  var NAV = [{"heading":"Primitives","items":[{"label":"Typography","href":"typography.html"},{"label":"Layout","href":"layout.html"},{"label":"Separator","href":"separator.html"},{"label":"Icon","href":"icon.html"}]},{"heading":"Actions","items":[{"label":"Button","href":"button.html"},{"label":"Toggle","href":"toggle.html"},{"label":"Toggle Group","href":"toggle-group.html"},{"label":"Button Group","href":"button-group.html"},{"label":"Toolbar","href":"toolbar.html"}]},{"heading":"Forms and inputs","items":[{"label":"Label","href":"label.html"},{"label":"Field","href":"field.html"},{"label":"Text Field","href":"text-field.html"},{"label":"Textarea","href":"textarea.html"},{"label":"Checkbox","href":"checkbox.html"},{"label":"Radio Group","href":"radio-group.html"},{"label":"Switch","href":"switch.html"},{"label":"Slider","href":"slider.html"},{"label":"Select","href":"select.html"},{"label":"Number Field","href":"number-field.html"},{"label":"File Input","href":"file-input.html"},{"label":"Date Field","href":"date-field.html"},{"label":"Date Picker","href":"date-picker.html"},{"label":"Date Range Picker","href":"date-range-picker.html"},{"label":"Combobox","href":"combobox.html"},{"label":"Time Field","href":"time-field.html"},{"label":"Form","href":"form.html"},{"label":"Color Picker","href":"color-picker.html"},{"label":"File Upload","href":"file-upload.html"},{"label":"Input OTP","href":"input-otp.html"},{"label":"Tag Input","href":"tag-input.html"}]},{"heading":"Data display","items":[{"label":"Badge","href":"badge.html"},{"label":"Avatar","href":"avatar.html"},{"label":"Card","href":"card.html"},{"label":"Image","href":"image.html"},{"label":"Statistic","href":"statistic.html"},{"label":"Table","href":"table.html"},{"label":"Data Table","href":"data-table.html"},{"label":"Collapsible","href":"collapsible.html"},{"label":"Timeline","href":"timeline.html"},{"label":"Tree View","href":"tree-view.html"},{"label":"Carousel","href":"carousel.html"},{"label":"Scroll Area","href":"scroll-area.html"},{"label":"Sortable","href":"sortable.html"}]},{"heading":"Feedback and status","items":[{"label":"Spinner","href":"spinner.html"},{"label":"Skeleton","href":"skeleton.html"},{"label":"Progress","href":"progress.html"},{"label":"Callout","href":"callout.html"},{"label":"Alert Dialog","href":"alert-dialog.html"},{"label":"Toast","href":"toast.html"}]},{"heading":"Overlays","items":[{"label":"Popover","href":"popover.html"},{"label":"Tooltip","href":"tooltip.html"},{"label":"Dialog","href":"dialog.html"},{"label":"Sheet","href":"sheet.html"},{"label":"Accordion","href":"accordion.html"},{"label":"Command Palette","href":"command-palette.html"},{"label":"Context Menu","href":"context-menu.html"},{"label":"Hover Card","href":"hover-card.html"}]},{"heading":"Navigation","items":[{"label":"Breadcrumbs","href":"breadcrumbs.html"},{"label":"Pagination","href":"pagination.html"},{"label":"Tabs","href":"tabs.html"},{"label":"Dropdown Menu","href":"dropdown-menu.html"},{"label":"Navigation Menu","href":"navigation-menu.html"}]},{"heading":"Application","items":[{"label":"App Shell","href":"app-shell.html"},{"label":"Sidebar","href":"sidebar.html"},{"label":"Resizable","href":"resizable.html"},{"label":"Header","href":"header.html"},{"label":"Nav","href":"nav.html"},{"label":"Footer","href":"footer.html"}]},{"heading":"AI","items":[{"label":"Agent Activity","href":"agent-activity.html"},{"label":"Code Block","href":"code-block.html"},{"label":"Composer","href":"composer.html"},{"label":"File Diff","href":"file-diff.html"},{"label":"Message","href":"message.html"},{"label":"Message Scroller","href":"message-scroller.html"},{"label":"Reasoning","href":"reasoning.html"},{"label":"Sources","href":"sources.html"},{"label":"Suggestion","href":"suggestion.html"},{"label":"Thinking Indicator","href":"thinking-indicator.html"},{"label":"Todo List","href":"todo-list.html"},{"label":"Tool Call","href":"tool-call.html"}]}];
  var BUILT = new Set(NAV.flatMap(section => section.items.map(item => item.href)));
  /* CATALOG-NAV:END */

  /* Detect current filename */
  var currentPage = location.pathname.split('/').pop() || 'typography.html';

  /* Component modules are loaded by the destination page's markup. The SPA
     swap keeps the document head, so import any destination modules that were
     not present on the entry page before replacing <main>. */
  var loadedModules = new Set(
    Array.from(document.querySelectorAll('script[type="module"][src]'))
      .map(function (script) { return new URL(script.getAttribute('src'), location.href).href; })
  );

  function loadPageModules(doc, href) {
    var pageUrl = new URL(href, location.href);
    var imports = Array.from(doc.querySelectorAll('script[type="module"][src]'))
      .map(function (script) { return new URL(script.getAttribute('src'), pageUrl).href; })
      .filter(function (url) {
        return new URL(url).origin === location.origin && !loadedModules.has(url);
      });

    return Promise.all(imports.map(function (url) {
      return import(url).then(function () {
        loadedModules.add(url);
      });
    }));
  }

  /* -- <site-header> ------------------------------------------ */
  class SiteHeader extends HTMLElement {
    connectedCallback() {
      this.innerHTML =
        '<header class="site-header">' +
          '<button class="sidebar-toggle" id="sidebar-toggle" type="button" aria-controls="site-nav-dialog" aria-expanded="false" aria-haspopup="dialog" aria-label="Open navigation menu">' +
            '<svg class="ri-menu-line" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 4H21V6H3V4ZM3 11H21V13H3V11ZM3 18H21V20H3V18Z"/></svg>' +
          '</button>' +
          '<a href="typography.html" class="header-brand">' +
            '<span class="header-brand-name">mewa_ui</span>' +
          '</a>' +
          '<div class="site-header-spacer"></div>' +
          '<nav class="site-header-actions">' +
            '<button id="theme-toggle" class="header-action theme-toggle-btn" type="button" aria-label="Toggle dark mode">' +
              '<svg id="icon-sun" class="ri-sun-line" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z"/></svg>' +
              '<svg id="icon-moon" class="ri-moon-line" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M10 7C10 10.866 13.134 14 17 14C18.9584 14 20.729 13.1957 21.9995 11.8995C22 11.933 22 11.9665 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C12.0335 2 12.067 2 12.1005 2.00049C10.8043 3.27098 10 5.04157 10 7ZM4 12C4 16.4183 7.58172 20 12 20C15.0583 20 17.7158 18.2839 19.062 15.7621C18.3945 15.9187 17.7035 16 17 16C12.0294 16 8 11.9706 8 7C8 6.29648 8.08133 5.60547 8.2379 4.938C5.71611 6.28423 4 8.9417 4 12Z"/></svg>' +
            '</button>' +
          '</nav>' +
        '</header>';

    }
  }

  /* -- <site-nav> --------------------------------------------- */
  class SiteNav extends HTMLElement {
    connectedCallback() {
      if (this.dataset.navInit !== undefined) return;
      this.dataset.navInit = '';
      function sidebarMarkup(surface) {
        var html = '<aside class="site-sidebar" data-nav-surface="' + surface + '">';
        html += '<div class="nav-filter-wrap">' +
          '<input type="text" class="text-field-input nav-filter-input" data-size="sm" ' +
            'placeholder="Filter components..." aria-label="Filter components" ' +
            'autocomplete="off" spellcheck="false">' +
        '</div>';
        html += '<div class="sidebar-scroll">';
        NAV.forEach(function (section) {
          html += '<div class="nav-section">';
          html += '<p class="nav-heading">' + section.heading + '</p>';
          section.items.forEach(function (item) {
            var cls = 'nav-link';
            if (item.href === currentPage) cls += ' active';
            else if (!BUILT.has(item.href)) cls += ' disabled';
            html += '<a class="' + cls + '" href="' + item.href + '"' + (item.href === currentPage ? ' aria-current="page"' : '') + '>' + item.label + '</a>';
          });
          html += '</div>';
        });
        html += '</div></aside>';
        return html;
      }

      var html = sidebarMarkup('desktop');
      html += '<dialog class="site-nav-dialog" id="site-nav-dialog" aria-label="Component navigation">';
      html += sidebarMarkup('mobile');
      html += '</dialog>';
      this.innerHTML = html;

      /* -- Filter logic --------------------------------------- */
      this.querySelectorAll('[data-nav-surface]').forEach(function (surface) {
        var input = surface.querySelector('.nav-filter-input');
        var sections = surface.querySelectorAll('.nav-section');
        if (!input || !sections.length) return;
        input.addEventListener('input', function () {
          var q = input.value.toLowerCase().trim();
          for (var s = 0; s < sections.length; s++) {
            var sec = sections[s];
            var links = sec.querySelectorAll('.nav-link');
            var anyVisible = false;
            for (var l = 0; l < links.length; l++) {
              var match = !q || links[l].textContent.toLowerCase().indexOf(q) !== -1;
              links[l].style.display = match ? '' : 'none';
              if (match) anyVisible = true;
            }
            sec.style.display = anyVisible ? '' : 'none';
          }
        });
      });
    }
  }

  customElements.define('site-header', SiteHeader);
  customElements.define('site-nav', SiteNav);

  /* -- Mobile sidebar toggle ---------------------------------- */
  function initMobileSidebar() {
    var toggle = document.getElementById('sidebar-toggle');
    var dialog = document.getElementById('site-nav-dialog');
    if (!toggle || !dialog) return;
    var desktopSidebar = document.querySelector('[data-nav-surface="desktop"]');
    var desktopInput = desktopSidebar && desktopSidebar.querySelector('.nav-filter-input');
    var mobileInput = dialog.querySelector('.nav-filter-input');
    var restoreTarget = toggle;

    function isMobile() {
      return window.matchMedia('(max-width: 48rem)').matches;
    }

    function syncTrigger(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    }

    function closeSidebar(target) {
      restoreTarget = target || toggle;
      if (dialog.open) dialog.close();
      else syncTrigger(false);
    }

    function openSidebar(focusFilter) {
      if (!dialog.open) dialog.showModal();
      syncTrigger(true);
      var target = focusFilter ? mobileInput : mobileInput;
      if (target) target.focus();
    }

    toggle.addEventListener('click', function () {
      if (dialog.open) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) closeSidebar();
    });

    /* Close sidebar when a nav link is clicked (mobile) */
    dialog.addEventListener('click', function (event) {
      if (event.target.closest('a.nav-link')) {
        closeSidebar();
      }
    });

    dialog.addEventListener('close', function () {
      syncTrigger(false);
      var target = restoreTarget;
      restoreTarget = toggle;
      if (target && target.getClientRects().length) target.focus();
    });

    /* Focus shortcut: Cmd/Ctrl+K opens the mobile nav before focusing the filter. */
    document.addEventListener('keydown', function (event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (isMobile()) {
          if (!dialog.open) openSidebar(true);
          else if (mobileInput) { mobileInput.focus(); mobileInput.select(); }
        } else if (desktopInput) {
          desktopInput.focus();
          desktopInput.select();
        }
      }
    });

    window.matchMedia('(max-width: 48rem)').addEventListener('change', function (event) {
      if (!event.matches && dialog.open) closeSidebar(desktopInput);
    });
  }

  document.addEventListener('DOMContentLoaded', initMobileSidebar);

  /* -- Sidebar scroll persistence ----------------------------- */
  /* Save scroll position before navigating, restore on load.   */
  /* (With SPA router, sidebar persists — this handles fallback */
  /* cases: first load, hard refresh, external navigation.)     */
  var SCROLL_KEY = 'mewa-nav-scroll';

  function readScroll() {
    try { return sessionStorage.getItem(SCROLL_KEY); }
    catch { return null; }
  }

  function writeScroll(value) {
    try { sessionStorage.setItem(SCROLL_KEY, value); } catch { /* ignore */ }
  }

  function dropScroll() {
    try { sessionStorage.removeItem(SCROLL_KEY); } catch { /* ignore */ }
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a.nav-link, .site-header a[href="typography.html"]');
    if (!link) return;
    var sidebar = document.querySelector('.sidebar-scroll');
    if (sidebar) writeScroll(sidebar.scrollTop);
  });

  /* Restore sidebar scroll & scroll active link into view */
  document.addEventListener('DOMContentLoaded', function () {
    var sidebar = document.querySelector('.sidebar-scroll');
    if (!sidebar) return;
    var saved = readScroll();
    if (saved) {
      sidebar.scrollTop = parseInt(saved, 10);
      dropScroll();
    } else {
      /* First visit — scroll active link into view */
      var active = sidebar.querySelector('.nav-link.active');
      if (active) active.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
  });

  /* -- Hover prefetch ----------------------------------------- */
  var prefetched = {};
  document.addEventListener('mouseover', function (e) {
    var link = e.target.closest('a.nav-link:not(.disabled)');
    if (!link) return;
    var href = link.getAttribute('href');
    if (href && !prefetched[href] && href !== currentPage && !href.startsWith('http')) {
      prefetched[href] = true;
      var l = document.createElement('link');
      l.rel = 'prefetch';
      l.href = href;
      document.head.appendChild(l);
    }
  });

  /* -- SPA Client-Side Router --------------------------------- */
  /* Intercepts nav link clicks and swaps <main> content         */
  /* without full-page reloads. Sidebar & header persist.        */

  var navigationId = 0;
  var navigationRequest = null;

  function announceNavigation(title) {
    var status = document.getElementById('spa-route-status');
    if (!status) {
      status = document.createElement('p');
      status.id = 'spa-route-status';
      status.className = 'sr-only';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.setAttribute('aria-atomic', 'true');
      document.body.appendChild(status);
    }
    status.textContent = title;
  }

  function focusPageStart(main) {
    var target = main.querySelector('h1') || main;
    var hadTabIndex = target.hasAttribute('tabindex');
    if (!hadTabIndex) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (!hadTabIndex) {
      target.addEventListener('blur', function () {
        target.removeAttribute('tabindex');
      }, { once: true });
    }
  }

  function navigateTo(href, pushState) {
    var requestId = ++navigationId;
    navigationRequest?.abort();
    if (href === currentPage && pushState !== false) return;
    navigationRequest = new AbortController();

    fetch(href, { signal: navigationRequest.signal })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      })
      .then(async function (html) {
        if (requestId !== navigationId) return;
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var newMain = doc.querySelector('main');
        var oldMain = document.querySelector('main');

        if (!newMain || !oldMain) {
          location.href = href;
          return;
        }

        var swap = function () {
          if (requestId !== navigationId) return;
          /* Swap main content */
          oldMain.innerHTML = newMain.innerHTML;

          /* Sync body-level component dialogs — the wiring convention
             places them as direct children of <body>, so the innerHTML
             swap above does not cover them. Replace the previous page's
             dialogs and let the component modules' MutationObservers
             wire the new ones. */
          document.querySelectorAll('body > dialog').forEach(function (d) { d.remove(); });
          doc.querySelectorAll('body > dialog').forEach(function (d) { document.body.appendChild(d); });

          /* Update document title */
          document.title = doc.title;

          /* Update current page tracker */
          currentPage = href;

          /* Update active nav link */
          document.querySelectorAll('.nav-link').forEach(function (link) {
            var active = link.getAttribute('href') === currentPage;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
          });

          /* Push browser history */
          if (pushState !== false) {
            history.pushState({ page: href }, '', href);
          }

          /* Scroll main to top */
          window.scrollTo(0, 0);

          /* Move focus and announce the new route for keyboard and screen
             reader users. The temporary tabindex keeps native headings
             useful without changing the authored page markup. */
          focusPageStart(oldMain);
          announceNavigation(doc.title);

          /* Re-initialize all page-ready handlers */
          /* (doc tabs, hljs, copy buttons, Remix icons, etc.) */
          (window.__spaInits || []).forEach(function (fn) { fn(); });

          /* Component ES modules auto-reinitialize via MutationObserver */
          /* when the DOM changes — no script re-import needed.         */


        };

        await loadPageModules(doc, href);

        /* Instant page swap — no transition */
        swap();
      })
      .catch(function (error) {
        if (error.name === 'AbortError' || requestId !== navigationId) return;
        location.href = href;

      });
  }

  /* Intercept nav clicks (sidebar links, header logo) */
  document.addEventListener('click', function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.defaultPrevented) return;
    var link = e.target.closest('a.nav-link:not(.disabled), .site-header a[href="typography.html"]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;
    e.preventDefault();
    navigateTo(href, true);
  });

  /* Handle browser back/forward */
  window.addEventListener('popstate', function () {
    var page = location.pathname.split('/').pop() || 'typography.html';
    navigateTo(page, false);
  });

  /* -- Page extras: TOC ------------------------------------ */

  var tocObserver = null;

  function getHeadingText(el) {
    var clone = el.cloneNode(true);
    clone.querySelectorAll('a, span.badge, svg').forEach(function (c) { c.remove(); });
    return clone.textContent.trim();
  }

  function buildToc() {
    var tocContent = document.querySelector('.site-toc-content');
    if (!tocContent) return;
    var main = document.querySelector('main');
    if (!main) return;
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }

    /* Collect heading-like elements in document order */
    var candidates = main.querySelectorAll('h2, p.text-sm.font-medium');
    var headings = [];
    candidates.forEach(function (el) {
      /* Skip headings inside collapsed details/page-header and
         anything inside demo previews or code blocks */
      if (el.closest('.page-header details, .preview, pre, code')) return;
      var text = getHeadingText(el);
      if (text) headings.push({ el: el, text: text });
    });

    if (headings.length < 2) {
      tocContent.replaceChildren();
      tocContent.parentElement.style.display = 'none';
      return;
    }

    tocContent.parentElement.style.display = '';
    tocContent.replaceChildren();
    var title = document.createElement('p');
    title.className = 'toc-title';
    title.textContent = 'On this page';
    tocContent.appendChild(title);

    var usedIds = new Set(Array.from(main.querySelectorAll('[id]'), function (el) { return el.id; }));
    headings.forEach(function (item) {
      var id = item.el.id;
      if (!id) {
        var slug = item.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'heading';
        var baseId = 'toc-' + slug;
        id = baseId;
        var suffix = 2;
        while (usedIds.has(id)) id = baseId + '-' + suffix++;
        item.el.id = id;
      }
      usedIds.add(id);

      var link = document.createElement('a');
      link.className = 'toc-link';
      link.href = '#' + id;
      link.textContent = item.text;
      tocContent.appendChild(link);
    });

    /* Active tracking via IntersectionObserver */
    var tocLinks = tocContent.querySelectorAll('.toc-link');
    tocObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          tocLinks.forEach(function (l) {
            l.classList.remove('active');
            l.removeAttribute('aria-current');
          });
          var active = tocContent.querySelector('.toc-link[href="#' + entry.target.id + '"]');
          if (active) {
            active.classList.add('active');
            active.setAttribute('aria-current', 'true');
          }
        }
      });
    }, { rootMargin: '-80px 0px -60% 0px' });
    headings.forEach(function (item) { tocObserver.observe(item.el); });

    /* On initial load (and after SPA navigation, which scrolls to
       top) the first heading often sits below the scroll-spy band,
       so no link would be active. Highlight the first entry until
       the user scrolls; the observer overrides it once a heading
       actually enters the band. */
    if (window.scrollY === 0 && tocLinks.length) {
      tocLinks[0].classList.add('active');
      tocLinks[0].setAttribute('aria-current', 'true');
    }
  }

  /* One-time setup on DOMContentLoaded */
  document.addEventListener('DOMContentLoaded', function () {
    /* Inject TOC sidebar before building it (listener order matters) */
    var layoutWrap = document.querySelector('main') && document.querySelector('main').parentElement;
    if (layoutWrap) {
      layoutWrap.insertAdjacentHTML('beforeend',
        '<aside class="site-toc"><div class="site-toc-content"></div></aside>'
      );
    }
  });

  /* Per-page init (runs on initial load + after each SPA navigation) */
  window.onPageReady(function () {
    buildToc();
  });
})();
