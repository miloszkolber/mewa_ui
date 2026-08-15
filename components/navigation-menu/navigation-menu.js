// -- Navigation Menu -----------------------------------------

function init() {
  document.querySelectorAll('.nav-menu:not([data-init])').forEach((nav) => {
  nav.dataset.init = '';
  nav.querySelectorAll('.nav-menu-trigger[popovertarget]').forEach((trigger) => {
    const id = trigger.getAttribute('popovertarget');
    const content = document.getElementById(id);
    if (!content) return;

    const anchorId = `--nav-menu-${id}`;
    trigger.style.anchorName = anchorId;
    content.style.positionAnchor = anchorId;
  });
});
}

init();
new MutationObserver(init).observe(document, { childList: true, subtree: true });
