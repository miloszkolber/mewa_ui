// -- Avatar ---------------------------------------------------

function init() {
  document.querySelectorAll('.avatar-image:not([data-init])').forEach((img) => {
  img.dataset.init = '';
  img.addEventListener('error', () => {
    img.setAttribute('data-error', '');
    img.style.display = 'none';
  });
});
}

init();
new MutationObserver(init).observe(document, { childList: true, subtree: true });
