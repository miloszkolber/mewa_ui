// -- Dialog ---------------------------------------------------

function openDialog(dialog, trigger) {
  if (!dialog || !dialog.isConnected || typeof dialog.showModal !== 'function') return;
  if (dialog.open) return;
  dialog._trigger = trigger;
  try {
    dialog.showModal();
  } catch {
    // A detached or already-open dialog can race SPA updates. Leave it closed
    // rather than surfacing a native InvalidStateError to the caller.
  }
}

function init() {
document.querySelectorAll('[data-dialog-trigger]:not([data-init])').forEach((trigger) => {
  trigger.dataset.init = '';
  const dialogId = trigger.dataset.dialogTrigger;
  if (!document.getElementById(dialogId)) {
    // Retry when a SPA inserts the target after the trigger.
    delete trigger.dataset.init;
    return;
  }
  trigger.addEventListener('click', () => {
    openDialog(document.getElementById(dialogId), trigger);
  });
});
document.querySelectorAll('dialog:not(.alert-dialog):not(.sheet):not([data-init])').forEach((dialog) => {
  dialog.dataset.init = '';
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.querySelectorAll('[data-dialog-close]').forEach((btn) => {
    btn.addEventListener('click', () => { dialog.close(); });
  });
  dialog.addEventListener('close', () => {
    if (dialog._trigger?.isConnected) dialog._trigger.focus();
  });
});
}

init();
new MutationObserver(init).observe(document, { childList: true, subtree: true });
