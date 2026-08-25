// -- Sheet ----------------------------------------------------

function openSheet(sheet, trigger) {
  if (!sheet || !sheet.isConnected || typeof sheet.showModal !== 'function') return;
  if (sheet.open) return;
  sheet._trigger = trigger;
  try {
    sheet.showModal();
    // Keep initial focus on the surface. showModal() would otherwise focus
    // the first control and select its text.
    if (!sheet.hasAttribute('tabindex')) sheet.setAttribute('tabindex', '-1');
    sheet.focus();
  } catch {
    // A target can be replaced between the click and showModal() in an SPA.
  }
}

function init() {
document.querySelectorAll('[data-sheet-trigger]:not([data-init])').forEach((trigger) => {
  trigger.dataset.init = '';
  const sheetId = trigger.dataset.sheetTrigger;
  if (!document.getElementById(sheetId)) {
    delete trigger.dataset.init;
    return;
  }
  trigger.addEventListener('click', () => {
    openSheet(document.getElementById(sheetId), trigger);
  });
});
document.querySelectorAll('dialog.sheet:not([data-init])').forEach((sheet) => {
  sheet.dataset.init = '';
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet) sheet.close();
  });
  sheet.querySelectorAll('[data-sheet-close]').forEach((btn) => {
    btn.addEventListener('click', () => { sheet.close(); });
  });
  sheet.addEventListener('close', () => {
    if (sheet._trigger?.isConnected) sheet._trigger.focus();
  });
});
}

init();
new MutationObserver(init).observe(document, { childList: true, subtree: true });
