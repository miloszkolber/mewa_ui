import assert from 'node:assert/strict';

export async function checkReactiveAttachments(page) {
  await page.click('[data-keyed="1"]');
  await page.evaluate(() => {
    window.keyedToggle = document.querySelector('[data-keyed="1"]');
  });
  await page.click('[data-reorder]');
  await page.waitForFunction(() => document.querySelector('[data-keyed]')?.dataset.keyed === '2');
  assert.equal(
    await page.evaluate(() => window.keyedToggle === document.querySelector('[data-keyed="1"]')),
    true
  );
  assert.equal(
    await page.$eval('[data-keyed="1"]', (button) => button.getAttribute('aria-pressed')),
    'true'
  );
  await page.click('[data-keyed="1"]');
  assert.equal(
    await page.$eval('[data-keyed="1"]', (button) => button.getAttribute('aria-pressed')),
    'false'
  );
  await page.click('[data-parameters]');
  await page.click('[data-step]');
  await page.waitForFunction(
    () => document.querySelector('[data-parameters]')?.dataset.step === '2'
  );
  await page.click('[data-parameters]');
  assert.equal(
    await page.$eval('[data-parameters]', (button) => button.dataset.total),
    '3',
    'reactive attachment options must dispose the old listener'
  );
  await page.click('[data-native-binding]');
  await page.waitForFunction(
    () => document.querySelector('[data-native-state]')?.textContent === 'checked'
  );
  await page.click('[data-native-set]');
  await page.waitForFunction(() => !document.querySelector('[data-native-binding]')?.checked);
}
