// -- Popover --------------------------------------------------

function init() {
  document.querySelectorAll('[popovertarget]:not([data-init])').forEach((trigger) => {
    trigger.dataset.init = '';
    const id = trigger.getAttribute('popovertarget');
    const popover = document.getElementById(id);
    if (!popover || !popover.classList.contains('popover')) {
      delete trigger.dataset.init;
      return;
    }

    const anchorId = `--popover-${id}`;
    trigger.style.anchorName = anchorId;
    popover.style.positionAnchor = anchorId;
  });
}

init();
new MutationObserver(init).observe(document, { childList: true, subtree: true });
