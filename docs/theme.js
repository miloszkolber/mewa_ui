(() => {
  const button = document.querySelector('[data-docs-theme-toggle]');
  const update = () => {
    const dark = document.documentElement.classList.contains('dark');
    button?.setAttribute('aria-pressed', String(dark));
    button?.setAttribute('data-theme', dark ? 'dark' : 'light');
  };
  // App Shell owns the preview header and live sample controls. The inert
  // matrix has only this toolbar controller; specimens receive no enhancement.
  if (document.body.classList.contains('matrix-page')) {
    button?.addEventListener('click', () => {
      const dark = document.documentElement.classList.toggle('dark');
      const theme = dark ? 'dark' : 'light';
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
      try {
        localStorage.setItem('mewa-ui-theme', theme);
      } catch {
        /* Storage may be disabled. */
      }
      update();
    });
    update();
  }
  document.getElementById('component-search')?.addEventListener('input', (event) => {
    const query = event.target.value.trim().toLowerCase();
    const links = [...document.querySelectorAll('.docs-nav a')];
    links.forEach((link) => {
      link.hidden =
        !`${link.closest('[data-category]')?.dataset.category || ''} ${link.textContent}`
          .toLowerCase()
          .includes(query);
    });
    document.querySelectorAll('.docs-nav-group').forEach((group) => {
      group.hidden = ![...group.querySelectorAll('a')].some((link) => !link.hidden);
    });
    document.querySelector('.docs-no-results').hidden = links.some((link) => !link.hidden);
  });
})();
