// -- Sidebar --------------------------------------------------

function triggerMatchesSidebar(trigger, sidebar) {
  const targetId = trigger.dataset.sidebarTrigger;
  return targetId ? targetId === sidebar.id : !sidebar.id;
}

function syncTriggers(sidebar) {
  const collapsed = sidebar.dataset.state === 'collapsed';
  const label = collapsed ? 'Show menu' : 'Hide menu';
  document.querySelectorAll('.sidebar-trigger').forEach((trigger) => {
    if (!triggerMatchesSidebar(trigger, sidebar)) return;
    trigger.setAttribute('aria-expanded', String(!collapsed));
    trigger.setAttribute('aria-label', label);
    const visibleLabel = trigger.querySelector('.sidebar-trigger-label');
    if (visibleLabel && visibleLabel.textContent !== label) visibleLabel.textContent = label;
  });
}

function toggleSidebar(sidebar) {
  sidebar.dataset.state = sidebar.dataset.state === 'collapsed' ? 'expanded' : 'collapsed';
  syncTriggers(sidebar);
}

function mobileTriggerFor(dialog) {
  return Array.from(document.querySelectorAll('[data-sidebar-mobile]')).find(
    (trigger) => trigger.dataset.sidebarMobile === dialog.id,
  );
}

function closeMobileDialog(dialog) {
  if (!dialog.open) return;
  const trigger = mobileTriggerFor(dialog);
  dialog.close();
  trigger?.setAttribute('aria-expanded', 'false');
  const desktopTrigger = document.querySelector('.app-sidebar .sidebar-trigger');
  const focusTarget = window.matchMedia('(min-width: 768px)').matches ? desktopTrigger : trigger;
  focusTarget?.focus({ preventScroll: true });
}

function sidebarForTrigger(trigger) {
  return Array.from(document.querySelectorAll('.app-sidebar')).find((sidebar) => triggerMatchesSidebar(trigger, sidebar));
}

function init() {
  document.querySelectorAll('.app-sidebar:not([data-init])').forEach((sidebar) => {
    sidebar.dataset.init = '';
  });

  document.querySelectorAll('.sidebar-trigger:not([data-init])').forEach((trigger) => {
    trigger.dataset.init = '';
    const sidebar = sidebarForTrigger(trigger);
    if (!sidebar) {
      delete trigger.dataset.init;
      return;
    }
    trigger.addEventListener('click', () => toggleSidebar(sidebar));
  });

  document.querySelectorAll('.app-sidebar').forEach((sidebar) => syncTriggers(sidebar));

  // -- Mobile dialog triggers --------------------------------
  document.querySelectorAll('[data-sidebar-mobile]:not([data-init])').forEach((trigger) => {
    trigger.dataset.init = '';
    const dialog = document.getElementById(trigger.dataset.sidebarMobile);
    if (!dialog) {
      delete trigger.dataset.init;
      return;
    }

    if (!trigger.hasAttribute('aria-expanded')) trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', () => {
      dialog.showModal();
      trigger.setAttribute('aria-expanded', 'true');
    });
  });

  document.querySelectorAll('.sidebar-mobile:not([data-init])').forEach((dialog) => {
    dialog.dataset.init = '';

    dialog.querySelectorAll('.sidebar-mobile-close:not([data-init])').forEach((button) => {
      button.dataset.init = '';
      button.addEventListener('click', () => closeMobileDialog(dialog));
    });

    dialog.querySelectorAll('.sidebar-link:not([data-init])').forEach((link) => {
      link.dataset.init = '';
      link.addEventListener('click', () => closeMobileDialog(dialog));
    });

    dialog.addEventListener('close', () => {
      const trigger = mobileTriggerFor(dialog);
      trigger?.setAttribute('aria-expanded', 'false');
      if (dialog.contains(document.activeElement) || document.activeElement === document.body) {
        trigger?.focus({ preventScroll: true });
      }
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

if (!document.__sidebarViewportInit) {
  document.__sidebarViewportInit = true;
  const desktopViewport = window.matchMedia('(min-width: 768px)');
  desktopViewport.addEventListener('change', (event) => {
    if (!event.matches) return;
    document.querySelectorAll('.sidebar-mobile[open]').forEach((dialog) => closeMobileDialog(dialog));
  });
}
