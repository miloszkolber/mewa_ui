// -- layout.js ------------------------------------------------
// Web Components for the shared site header and sidebar nav.
// SPA client-side router for flash-free navigation.
// Loaded synchronously in <head> so elements render without FOUC.

(function () {
  'use strict';

  /* -- Dark mode (must run before first paint) ----------------- */
  var saved = localStorage.getItem('mewa-theme');
  var darkMQ = window.matchMedia('(prefers-color-scheme: dark)');
  var prefersDark = darkMQ.matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }

  /* React to OS theme changes in real time (only if user hasn't set a manual preference) */
  darkMQ.addEventListener('change', function (e) {
    if (localStorage.getItem('mewa-theme')) return;   // user chose manually — respect it
    document.documentElement.classList.toggle('dark', e.matches);
    document.documentElement.style.colorScheme = e.matches ? 'dark' : 'light';
    var sun = document.getElementById('icon-sun');
    var moon = document.getElementById('icon-moon');
    if (sun) sun.style.display = e.matches ? 'none' : 'block';
    if (moon) moon.style.display = e.matches ? 'block' : 'none';
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
  var NAV = [
    { heading: 'Primitives', items: [
      { label: 'Typography', href: 'typography.html' },
      { label: 'Layout', href: 'layout.html' },
      { label: 'Separator', href: 'separator.html' },
      { label: 'Icon', href: 'icon.html' },
    ]},
    { heading: 'Actions', items: [
      { label: 'Button', href: 'button.html' },
      { label: 'Toggle', href: 'toggle.html' },
      { label: 'Toggle group', href: 'toggle-group.html' },
      { label: 'Button group', href: 'button-group.html' },
      { label: 'Toolbar', href: 'toolbar.html' },
    ]},
    { heading: 'Forms &amp; inputs', items: [
      { label: 'Label', href: 'label.html' },
      { label: 'Input', href: 'input.html' },
      { label: 'Textarea', href: 'textarea.html' },
      { label: 'Checkbox', href: 'checkbox.html' },
      { label: 'Radio group', href: 'radio.html' },
      { label: 'Switch', href: 'switch.html' },
      { label: 'Slider', href: 'slider.html' },
      { label: 'Select', href: 'select.html' },
      { label: 'Number input', href: 'number-input.html' },
      { label: 'File input', href: 'file-input.html' },
      { label: 'Color picker', href: 'color-picker.html' },
      { label: 'Date picker', href: 'date-picker.html' },
      { label: 'Combobox', href: 'combobox.html' },
      { label: 'Form', href: 'form.html' },
    ]},
    { heading: 'Data display', items: [
      { label: 'Badge', href: 'badge.html' },
      { label: 'Avatar', href: 'avatar.html' },
      { label: 'Card', href: 'card.html' },
      { label: 'Image', href: 'image.html' },
      { label: 'Statistic', href: 'statistic.html' },
      { label: 'Table', href: 'table.html' },
      { label: 'Collapsible', href: 'collapsible.html' },
      { label: 'Timeline', href: 'timeline.html' },
      { label: 'Tree view', href: 'tree-view.html' },
      { label: 'Calendar', href: 'calendar.html' },
      { label: 'Carousel', href: 'carousel.html' },
      { label: 'Scroll area', href: 'scroll-area.html' },
      { label: 'Sortable', href: 'sortable.html' },
    ]},
    { heading: 'Feedback &amp; status', items: [
      { label: 'Spinner', href: 'spinner.html' },
      { label: 'Skeleton', href: 'skeleton.html' },
      { label: 'Progress', href: 'progress.html' },
      { label: 'Alert', href: 'alert.html' },
      { label: 'Alert dialog', href: 'alert-dialog.html' },
      { label: 'Toast', href: 'toast.html' },
    ]},
    { heading: 'Overlays', items: [
      { label: 'Popover', href: 'popover.html' },
      { label: 'Tooltip', href: 'tooltip.html' },
      { label: 'Context menu', href: 'context-menu.html' },
      { label: 'Dialog', href: 'dialog.html' },
      { label: 'Sheet', href: 'sheet.html' },
      { label: 'Accordion', href: 'accordion.html' },
      { label: 'Command', href: 'command.html' },
    ]},
    { heading: 'Navigation', items: [
      { label: 'Breadcrumb', href: 'breadcrumb.html' },
      { label: 'Pagination', href: 'pagination.html' },
      { label: 'Steps', href: 'steps.html' },
      { label: 'Tabs', href: 'tabs.html' },
      { label: 'Dropdown menu', href: 'dropdown.html' },
      { label: 'Navigation menu', href: 'navigation-menu.html' },
    ]},
    { heading: 'Application', items: [
      { label: 'Sidebar', href: 'sidebar.html' },
    ]},
  ];

  /* Pages that have been built (have a real doc page) */
  var BUILT = new Set([
    'typography.html', 'layout.html', 'separator.html', 'icon.html', 'label.html',
    'button.html', 'toggle.html', 'toggle-group.html', 'button-group.html', 'toolbar.html',
    'input.html', 'textarea.html', 'checkbox.html', 'radio.html', 'switch.html',
    'slider.html', 'select.html', 'number-input.html', 'file-input.html',
    'color-picker.html', 'date-picker.html', 'combobox.html', 'form.html',
    'badge.html', 'avatar.html', 'card.html', 'image.html',
    'statistic.html', 'table.html',
    'collapsible.html', 'timeline.html', 'tree-view.html', 'calendar.html',
    'spinner.html', 'skeleton.html', 'progress.html', 'alert.html', 'alert-dialog.html',
    'toast.html',
    'popover.html', 'tooltip.html', 'context-menu.html',
    'dialog.html', 'sheet.html', 'accordion.html', 'command.html',
    'breadcrumb.html', 'pagination.html', 'steps.html',
    'tabs.html', 'dropdown.html', 'navigation-menu.html',
    'scroll-area.html',
    'carousel.html', 'sidebar.html', 'sortable.html',
  ]);

  /* Detect current filename */
  var currentPage = location.pathname.split('/').pop() || 'typography.html';

  /* -- <site-header> ------------------------------------------ */
  class SiteHeader extends HTMLElement {
    connectedCallback() {
      this.style.display = 'contents';
      this.innerHTML =
        '<header class="site-header">' +
          '<button class="sidebar-toggle" id="sidebar-toggle" aria-label="Toggle navigation menu">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>' +
          '</button>' +
          '<a href="typography.html" class="header-brand">' +
            '<span class="header-brand-name">mewa_ui</span>' +
          '</a>' +
          '<div style="flex:1;"></div>' +
          '<nav style="display:flex;align-items:center;gap:0.25rem;">' +
            '<button id="theme-toggle" class="header-action theme-toggle-btn" aria-label="Toggle dark mode">' +
              '<svg id="icon-sun" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>' +
              '<svg id="icon-moon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>' +
            '</button>' +
          '</nav>' +
        '</header>';

    }
  }

  /* -- <site-nav> --------------------------------------------- */
  class SiteNav extends HTMLElement {
    connectedCallback() {
      this.style.display = 'contents';
      var html = '<aside class="site-sidebar">';
      html += '<div class="nav-filter-wrap">' +
        '<input type="text" class="input nav-filter-input" data-size="sm" ' +
          'placeholder="Filter components..." aria-label="Filter components" ' +
          'autocomplete="off" spellcheck="false">' +
      '</div>';
      html += '<div class="sidebar-scroll">';
      NAV.forEach(function (section, i) {
        html += '<div class="nav-section" style="margin-bottom:1.25rem;">';
        html += '<p class="nav-heading">' + section.heading + '</p>';
        section.items.forEach(function (item) {
          var cls = 'nav-link';
          if (item.href === currentPage) cls += ' active';
          else if (!BUILT.has(item.href)) cls += ' disabled';
          html += '<a class="' + cls + '" href="' + item.href + '" style="display:flex;align-items:center;gap:0.375rem;">' + item.label + '</a>';
        });
        html += '</div>';
      });
      html += '</div>';
      html += '</aside>';
      this.innerHTML = html;

      /* -- Filter logic --------------------------------------- */
      var input = this.querySelector('.nav-filter-input');
      var sections = this.querySelectorAll('.nav-section');
      if (input && sections.length) {
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
        /* Focus shortcut: Cmd/Ctrl+K focuses the filter */
        document.addEventListener('keydown', function (e) {
          if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            input.focus();
            input.select();
          }
        });
      }
    }
  }

  customElements.define('site-header', SiteHeader);
  customElements.define('site-nav', SiteNav);

  /* -- Mobile sidebar toggle ---------------------------------- */
  function initMobileSidebar() {
    var toggle = document.getElementById('sidebar-toggle');
    var sidebar = document.querySelector('.site-sidebar');
    if (!toggle || !sidebar) return;

    /* Create backdrop element if not already present */
    var backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      sidebar.parentElement.appendChild(backdrop);
    }

    function closeSidebar() {
      sidebar.classList.remove('open');
      backdrop.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    function openSidebar() {
      sidebar.classList.add('open');
      backdrop.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
    }

    toggle.addEventListener('click', function () {
      if (sidebar.classList.contains('open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    backdrop.addEventListener('click', closeSidebar);

    /* Close sidebar when a nav link is clicked (mobile) */
    sidebar.addEventListener('click', function (e) {
      if (e.target.closest('a.nav-link')) {
        closeSidebar();
      }
    });

    /* Close sidebar on Escape key */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        closeSidebar();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initMobileSidebar);

  /* -- Sidebar scroll persistence ----------------------------- */
  /* Save scroll position before navigating, restore on load.   */
  /* (With SPA router, sidebar persists — this handles fallback */
  /* cases: first load, hard refresh, external navigation.)     */
  var SCROLL_KEY = 'mewa-nav-scroll';

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a.nav-link, .site-header a[href="typography.html"]');
    if (!link) return;
    var sidebar = document.querySelector('.sidebar-scroll');
    if (sidebar) sessionStorage.setItem(SCROLL_KEY, sidebar.scrollTop);
  });

  /* Restore sidebar scroll & scroll active link into view */
  document.addEventListener('DOMContentLoaded', function () {
    var sidebar = document.querySelector('.sidebar-scroll');
    if (!sidebar) return;
    var saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      sidebar.scrollTop = parseInt(saved, 10);
      sessionStorage.removeItem(SCROLL_KEY);
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

  var navigating = false;

  function navigateTo(href, pushState) {
    if (navigating) return;
    if (href === currentPage && pushState !== false) return;
    navigating = true;

    fetch(href)
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var newMain = doc.querySelector('main');
        var oldMain = document.querySelector('main');

        if (!newMain || !oldMain) {
          location.href = href;
          return;
        }

        var swap = function () {
          /* Swap main content */
          oldMain.innerHTML = newMain.innerHTML;

          /* Sync body-level component dialogs — the wiring convention
             places them as direct children of <body>, so the innerHTML
             swap above does not cover them. Keep the persistent spec
             modal, replace the previous page's dialogs, and let the
             component modules' MutationObservers wire the new ones. */
          document.querySelectorAll('body > dialog:not(.spec-modal)').forEach(function (d) { d.remove(); });
          doc.querySelectorAll('body > dialog:not(.spec-modal)').forEach(function (d) { document.body.appendChild(d); });

          /* Update document title */
          document.title = doc.title;

          /* Update current page tracker */
          currentPage = href;

          /* Update active nav link */
          document.querySelectorAll('.nav-link').forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === currentPage);
          });

          /* Push browser history */
          if (pushState !== false) {
            history.pushState({ page: href }, '', href);
          }

          /* Scroll main to top */
          window.scrollTo(0, 0);

          /* Re-initialize all page-ready handlers */
          /* (doc tabs, hljs, copy buttons, lucide, etc.) */
          (window.__spaInits || []).forEach(function (fn) { fn(); });

          /* Component ES modules auto-reinitialize via MutationObserver */
          /* when the DOM changes — no script re-import needed.         */

          navigating = false;
        };

        /* Use View Transitions API if available */
        if (document.startViewTransition) {
          document.startViewTransition(swap);
        } else {
          swap();
        }
      })
      .catch(function () {
        location.href = href;
        navigating = false;
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
      tocContent.innerHTML = '';
      tocContent.parentElement.style.display = 'none';
      return;
    }

    tocContent.parentElement.style.display = '';
    var html = '<p class="toc-title">On this page</p>';
    headings.forEach(function (item) {
      var id = item.el.id || 'toc-' + item.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (!item.el.id) item.el.id = id;
      html += '<a class="toc-link" href="#' + id + '">' + item.text + '</a>';
    });
    tocContent.innerHTML = html;

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
    buildToc();
  });

  /* Per-page init (runs on initial load + after each SPA navigation) */
  window.onPageReady(function () {
    buildToc();
  });
})();
