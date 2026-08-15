// -- Alert Dialog ----------------------------------------------

function init() {
document.querySelectorAll('[data-alert-dialog-trigger]:not([data-init])').forEach((trigger) => {
  trigger.dataset.init = '';
  const dialog = document.getElementById(trigger.dataset.alertDialogTrigger);
  if (!dialog) return;
  trigger.addEventListener('click', () => {
    dialog._trigger = trigger;
    dialog.showModal();
  });
});

document.querySelectorAll('dialog.alert-dialog:not([data-init])').forEach((dialog) => {
  dialog.dataset.init = '';
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
  });

  dialog.querySelectorAll('[data-alert-dialog-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      dialog.close();
    });
  });

  dialog.addEventListener('close', () => {
    if (dialog._trigger) dialog._trigger.focus();
  });
});
}

init();
new MutationObserver(init).observe(document, { childList: true, subtree: true });
