// -- Sidebar --------------------------------------------------

function triggerMatchesSidebar(trigger, sidebar) {
  const targetId = trigger.dataset.sidebarTrigger;
  return targetId ? targetId === sidebar.id : !sidebar.id;
}

function syncTriggers(sidebar) {
  const collapsed = sidebar.dataset.state === 'collapsed';
  document.querySelectorAll('.sidebar-trigger, .sidebar-rail').forEach((trigger) => {
    if (!triggerMatchesSidebar(trigger, sidebar)) return;
    trigger.setAttribute('aria-expanded', String(!collapsed));
    trigger.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
  });
}

function toggleSidebar(sidebar) {
  sidebar.dataset.state = sidebar.dataset.state === 'collapsed' ? 'expanded' : 'collapsed';
  syncTriggers(sidebar);
}

function init() {
  document.querySelectorAll('.app-sidebar:not([data-init])').forEach((sidebar) => {
    sidebar.dataset.init = '';

    document.querySelectorAll('.sidebar-trigger:not([data-init]), .sidebar-rail:not([data-init])').forEach((trigger) => {
      if (!triggerMatchesSidebar(trigger, sidebar)) return;
      trigger.dataset.init = '';
      trigger.addEventListener('click', () => toggleSidebar(sidebar));
    });

    syncTriggers(sidebar);
  });

  // -- Mobile dialog triggers --------------------------------
  document.querySelectorAll('[data-sidebar-mobile]:not([data-init])').forEach((trigger) => {
    trigger.dataset.init = '';
    const dialog = document.getElementById(trigger.dataset.sidebarMobile);
    if (!dialog) return;

    trigger.addEventListener('click', () => {
      dialog.showModal();
    });

    dialog.querySelectorAll('.sidebar-mobile-close:not([data-init])').forEach((button) => {
      button.dataset.init = '';
      button.addEventListener('click', () => dialog.close());
    });
  });
}

init();
new MutationObserver(init).observe(document, { childList: true, subtree: true });

// -- Keyboard shortcut: Cmd+B / Ctrl+B ----------------------
if (!document.__sidebarKbInit) {
  document.__sidebarKbInit = true;
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
      event.preventDefault();
      const sidebar = document.querySelector('.app-sidebar');
      if (sidebar) toggleSidebar(sidebar);
    }
  });
}
