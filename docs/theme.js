(() => {
  const button = document.querySelector('[data-docs-theme-toggle]');
  const update = () => {
    const dark = document.documentElement.classList.contains('dark');
    button?.setAttribute('aria-pressed', String(dark));
    button?.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  };
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-docs-theme-toggle]')) return;
    const dark = document.documentElement.classList.toggle('dark');
    const theme = dark ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem('mewa-docs-theme', theme);
    } catch {
      /* Storage may be disabled. */
    }
    update();
  });
  update();
  document.getElementById('component-search')?.addEventListener('input', (event) => {
    const query = event.target.value.trim().toLowerCase();
    const links = [...document.querySelectorAll('.docs-nav a')];
    links.forEach((link) => {
      link.hidden = !link.textContent.toLowerCase().includes(query);
    });
    document.querySelector('.docs-no-results').hidden = links.some((link) => !link.hidden);
  });
})();
