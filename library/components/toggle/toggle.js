// -- Toggle ---------------------------------------------------

function init() {
  document.querySelectorAll('.toggle:not([data-init]):not(.toggle-group .toggle)').forEach((toggle) => {
  toggle.dataset.init = '';
  toggle.addEventListener('click', () => {
    const pressed = toggle.getAttribute('aria-pressed') === 'true';
    toggle.setAttribute('aria-pressed', !pressed);
  });
});
}

init();
new MutationObserver(init).observe(document, { childList: true, subtree: true });
