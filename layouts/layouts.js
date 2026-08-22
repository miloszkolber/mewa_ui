// Layout-only progressive enhancements ------------------------------------

const ICON_ROOT = new URL('../src/icons/', import.meta.url);
const THEME_KEY = 'mewa-ui-theme';
const LEGACY_THEME_KEY = 'mewa-theme';

function loadIcons() {
  document.querySelectorAll('i[data-lucide]:not([data-icon-init])').forEach((placeholder) => {
    placeholder.dataset.iconInit = '';
    const name = placeholder.dataset.lucide;
    if (!name || !/^[a-z0-9-]+$/.test(name)) return;

    fetch(new URL(`${name}.svg`, ICON_ROOT))
      .then((response) => {
        if (!response.ok) throw new Error(`Icon not found: ${name}`);
        return response.text();
      })
      .then((source) => {
        const documentFragment = new DOMParser().parseFromString(source, 'image/svg+xml');
        const svg = documentFragment.documentElement;
        if (!svg || svg.nodeName.toLowerCase() !== 'svg') return;

        svg.setAttribute('data-lucide', name);
        for (const attribute of placeholder.attributes) {
          if (attribute.name !== 'data-lucide') svg.setAttribute(attribute.name, attribute.value);
        }
        svg.setAttribute('data-icon-loaded', '');
        placeholder.replaceWith(svg);
      })
      .catch(() => {
        // Leave the placeholder in place when a local optional icon is absent.
      });
  });
}

function readStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || localStorage.getItem(LEGACY_THEME_KEY);
  } catch {
    return null;
  }
}

function writeStoredTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Private browsing and restricted storage still get an in-page toggle.
  }
}

function applyTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  document.querySelectorAll('[data-layout-theme-toggle]').forEach((toggle) => {
    toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    toggle.dataset.theme = dark ? 'dark' : 'light';
  });
}

function initThemeToggles() {
  document.querySelectorAll('[data-layout-theme-toggle]:not([data-init])').forEach((toggle) => {
    toggle.dataset.init = '';
    toggle.addEventListener('click', () => {
      const nextTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
      writeStoredTheme(nextTheme);
      applyTheme(nextTheme);
    });
  });

  const storedTheme = readStoredTheme();
  if (storedTheme === 'light' || storedTheme === 'dark') {
    applyTheme(storedTheme);
  } else if (document.documentElement.classList.contains('dark')) {
    applyTheme('dark');
  } else {
    applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
}

function init() {
  loadIcons();
  initThemeToggles();
}

init();
new MutationObserver(init).observe(document, { childList: true, subtree: true });

if (!document.__layoutThemeSystemInit) {
  document.__layoutThemeSystemInit = true;
  const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
  colorScheme.addEventListener('change', (event) => {
    if (!readStoredTheme()) applyTheme(event.matches ? 'dark' : 'light');
  });
}
