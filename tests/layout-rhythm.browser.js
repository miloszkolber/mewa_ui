// Measured layout rhythm for the rendered playgrounds.
//
// Two documented tokens govern repeated geometry, and a third value per role
// is a rhythm defect rather than a design choice:
//   - `--space-300` is the compact control group gap, so every fieldset legend
//     that names a group of controls must separate its content by that value.
//   - `--size-1000` is the navigation and menu row height, so a menu row must
//     land on it instead of an arbitrary padded line box.
//
// Assert the rendered result. A source grep cannot tell whether a legend is
// followed by content, and a fractional row height is invisible in CSS source.
import assert from 'node:assert/strict';

// Activating a playground mounts its demo; a hidden section has no boxes.
async function activate(page, slug) {
  await page.evaluate((component) => {
    location.hash = `preview-${component}`;
  }, slug);
  await page.waitForFunction(
    (component) =>
      document.querySelector(`.component-playground[data-component="${component}"]`)?.hidden ===
      false,
    {},
    slug
  );
}

// State changes transition, so a computed style read immediately after an edit
// samples the animation rather than the resolved value.
const settle = (page) => page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 450)));

export async function inspectLayoutRhythm(page, baseUrl) {
  const results = [];

  // -- Legend to control-group spacing ---------------------------
  const groupComponents = ['input-otp', 'radio-group', 'time-field', 'date-range-picker'];
  const legendGaps = [];
  for (const slug of groupComponents) {
    await page.goto(`${baseUrl}/docs/preview.html#preview-${slug}`, { waitUntil: 'load' });
    await page.waitForSelector('body.enhanced');
    await activate(page, slug);
    const gaps = await page.evaluate(() => {
      const section = document.querySelector('.component-playground:not([hidden])');
      const demo = section.querySelector('.playground-demo,.presentation-surface');
      return [...demo.querySelectorAll('fieldset > legend')]
        .filter((legend) => legend.nextElementSibling)
        .map((legend) => {
          const next = legend.nextElementSibling;
          return {
            text: legend.textContent.trim().slice(0, 24),
            gap:
              Math.round(
                (next.getBoundingClientRect().top - legend.getBoundingClientRect().bottom) * 100
              ) / 100,
            token: getComputedStyle(legend).marginBlockEnd
          };
        });
    });
    // A group that renders no legend is not evidence of a rhythm problem.
    for (const { text, gap, token } of gaps)
      legendGaps.push({ slug, text, gap, token, expected: 12 });
  }
  assert(
    legendGaps.length >= 4,
    `expected the group legends to render: ${JSON.stringify(legendGaps)}`
  );
  for (const entry of legendGaps)
    assert.equal(
      entry.token,
      '12px',
      `${entry.slug}: legend "${entry.text}" uses ${entry.token}, not the 12px compact control group token`
    );
  const distinct = new Set(legendGaps.map((entry) => entry.gap));
  assert.equal(
    distinct.size,
    1,
    `group legends separate content inconsistently: ${JSON.stringify(legendGaps)}`
  );
  results.push({ name: 'group legend rhythm', passed: true, detail: legendGaps });

  // -- Navigation and menu row height ---------------------------
  const menuComponents = ['navigation-menu', 'nav', 'sidebar', 'collapsible'];
  const rows = [];
  for (const slug of menuComponents) {
    await activate(page, slug);
    const heights = await page.evaluate(() => {
      const section = document.querySelector('.component-playground:not([hidden])');
      const demo = section.querySelector('.playground-demo,.presentation-surface');
      const selector =
        '.nav-menu-link, .nav-menu-trigger, .nav-item-link, .sidebar-link, .collapsible-trigger';
      return [...demo.querySelectorAll(selector)]
        .filter((el) => el.getBoundingClientRect().height)
        .map((el) => ({
          cls: el.className.split(' ')[0],
          height: Math.round(el.getBoundingClientRect().height * 100) / 100
        }));
    });
    for (const { cls, height } of heights) rows.push({ slug, cls, height, expected: 40 });
  }
  assert(rows.length >= 4, `expected navigation rows to render: ${JSON.stringify(rows)}`);
  for (const { slug, cls, height } of rows)
    assert.equal(
      height,
      40,
      `${slug}: ${cls} renders ${height}px, not the 40px navigation and menu row height`
    );
  results.push({ name: 'navigation row height', passed: true, detail: rows });

  // -- A property has to change the rendering ---------------------
  // data-readonly reached three wrapper components as an attribute that no
  // stylesheet matched, so the state was enforceable but invisible.
  const readonlyComponents = ['time-field', 'date-range-picker', 'tag-input'];
  for (const slug of readonlyComponents) {
    await activate(page, slug);
    const control = await page.evaluate(() =>
      [...document.querySelectorAll('.component-playground:not([hidden]) [name]')]
        .map((el) => el.name)
        .find((name) => name.endsWith(':readonly'))
    );
    assert(control, `${slug}: a readonly property is offered`);
    const read = () =>
      page.evaluate(() => {
        const demo = document.querySelector('.component-playground:not([hidden]) .playground-demo');
        const target = demo.querySelector(
          '.time-field-input, .date-range-input, .tag-input-control, .tag-input-fallback, .tag-input-field'
        );
        const style = getComputedStyle(target);
        return `${style.backgroundColor}|${style.color}|${style.cursor}`;
      });
    await settle(page);
    const before = await read();
    await page.evaluate((name) => {
      const el = document.querySelector(`.component-playground:not([hidden]) [name="${name}"]`);
      el.checked = true;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, control);
    await settle(page);
    const after = await read();
    assert.notEqual(
      after,
      before,
      `${slug}: the readonly property leaves the rendered control unchanged`
    );
    // The native attribute has to reach the real control, not only the marker.
    const native = await page.evaluate(() => {
      const demo = document.querySelector('.component-playground:not([hidden]) .playground-demo');
      return [...demo.querySelectorAll('input')].some((input) => input.readOnly === true);
    });
    assert(native, `${slug}: readonly does not reach a native control`);
  }

  // -- Minimum pointer target ----------------------------------
  // Sweep every focusable node in every playground. A control that is only as
  // tall as its line box, or a native input whose label is too small, falls
  // under the 24px minimum, and no single component review catches that class.
  const MINIMUM = 24;
  const sweep = await page.evaluate((minimum) => {
    // Typography presents rendered Markdown prose rather than interface
    // controls, and the toolbar separator is a drawn rule.
    const selector =
      'a[href], button, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="separator"], summary, input:not([type="hidden"]), select, textarea';
    const report = [];
    for (const section of document.querySelectorAll('.component-playground')) {
      if (section.hidden || section.classList.contains('component-presentation')) continue;
      const demo = section.querySelector('.playground-demo,.presentation-surface');
      if (!demo) continue;
      for (const el of demo.querySelectorAll(selector)) {
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        const style = getComputedStyle(el);
        if (style.visibility === 'hidden' || style.display === 'none') continue;
        if (el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true') continue;
        if (el.getAttribute('role') === 'separator' && rect.width <= 2) continue;
        // A native input may be smaller than the minimum when its label
        // extends the union of activating boxes.
        let width = rect.width;
        let height = rect.height;
        if (el.matches('input') && el.id) {
          const label = demo.querySelector(`label[for="${CSS.escape(el.id)}"]`);
          const labelRect = label?.getBoundingClientRect();
          if (labelRect?.height) height = Math.max(height, labelRect.height);
        }
        if (width >= minimum && height >= minimum) continue;
        report.push({
          slug: section.dataset.component,
          cls: `${el.localName}.${(el.className || '').toString().split(' ')[0]}`,
          width: Math.round(width * 100) / 100,
          height: Math.round(height * 100) / 100
        });
      }
    }
    return report;
  }, MINIMUM);
  assert.deepEqual(
    sweep,
    [],
    `focusable targets below the ${MINIMUM}px minimum: ${JSON.stringify(sweep)}`
  );
  results.push({ name: 'minimum pointer target', passed: true, detail: sweep });

  for (const result of results)
    console.log(
      `PASS docs layout rhythm: ${result.name}`,
      result.detail.length ? result.detail : 'catalog clean'
    );
}
