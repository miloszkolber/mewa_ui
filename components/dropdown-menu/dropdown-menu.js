// -- Dropdown Menu --------------------------------------------

function init() {
  document.querySelectorAll('[data-dropdown-menu-trigger]:not([data-init])').forEach((trigger) => {
    trigger.dataset.init = '';
    const menuId = trigger.dataset.dropdownMenuTrigger;
    const menu = document.getElementById(menuId);
    if (!menu) {
      // Keep the trigger eligible for a later SPA insertion of its target.
      delete trigger.dataset.init;
      return;
    }

    const anchorId = `--dropdown-menu-${menu.id}`;
    trigger.style.anchorName = anchorId;
    menu.style.positionAnchor = anchorId;

    const isDisabled = (item) => item.disabled || item.getAttribute('aria-disabled') === 'true';
    const getItems = () => {
      return Array.from(menu.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'))
        .filter((item) => !isDisabled(item));
    };
    const activateCheckable = (item) => {
      if (!item || isDisabled(item)) return;
      const role = item.getAttribute('role');
      if (role === 'menuitemcheckbox') {
        const checked = item.getAttribute('aria-checked') === 'true';
        item.setAttribute('aria-checked', String(!checked));
      } else if (role === 'menuitemradio') {
        const group = item.closest('[role="group"]');
        const radios = group ? group.querySelectorAll('[role="menuitemradio"]') : menu.querySelectorAll('[role="menuitemradio"]');
        radios.forEach((radio) => { radio.setAttribute('aria-checked', 'false'); });
        item.setAttribute('aria-checked', 'true');
      }
    };
    const highlight = (item) => {
      getItems().forEach((i) => { i.removeAttribute('data-highlighted'); });
      if (item) { item.setAttribute('data-highlighted', ''); item.focus(); }
    };
    trigger.addEventListener('click', () => {
      const currentMenu = document.getElementById(menuId);
      if (!currentMenu || !currentMenu.isConnected || typeof currentMenu.togglePopover !== 'function') return;
      currentMenu.togglePopover();
    });
    menu.addEventListener('toggle', (e) => {
      const open = e.newState === 'open';
      trigger.setAttribute('aria-expanded', open);
      if (open) { const first = getItems()[0]; if (first) highlight(first); }
      else { getItems().forEach((i) => { i.removeAttribute('data-highlighted'); }); trigger.focus(); }
    });
    menu.addEventListener('mousemove', (e) => {
      const item = e.target.closest('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]');
      if (item && !isDisabled(item)) highlight(item);
    });
    menu.addEventListener('mouseleave', () => {
      getItems().forEach((i) => { i.removeAttribute('data-highlighted'); });
    });
    menu.addEventListener('click', (e) => {
      const item = e.target.closest('[role="menuitemcheckbox"], [role="menuitemradio"]');
      if (item) activateCheckable(item);
    });
    menu.addEventListener('keydown', (e) => {
      const items = getItems();
      const current = items.indexOf(document.activeElement);
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); highlight(items[(current + 1) % items.length]); break;
        case 'ArrowUp': e.preventDefault(); highlight(items[(current - 1 + items.length) % items.length]); break;
        case 'Home': e.preventDefault(); highlight(items[0]); break;
        case 'End': e.preventDefault(); highlight(items[items.length - 1]); break;
        case 'Escape': menu.hidePopover(); break;
        case 'Enter': case ' ':
          e.preventDefault();
          if (document.activeElement) {
            const role = document.activeElement.getAttribute('role');
            if (role === 'menuitemcheckbox') {
              activateCheckable(document.activeElement);
            } else if (role === 'menuitemradio') {
              activateCheckable(document.activeElement);
            } else { document.activeElement.click(); menu.hidePopover(); }
          }
          break;
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            const match = items.find((item) => item.textContent.trim().toLowerCase().startsWith(e.key.toLowerCase()));
            if (match) highlight(match);
          }
      }
    });
});
}

init();
new MutationObserver(init).observe(document, { childList: true, subtree: true });
