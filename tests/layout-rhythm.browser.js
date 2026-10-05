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
import registry from '../registry.json' with { type: 'json' };

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
    const timeContext =
      slug === 'time-field'
        ? await page.evaluate(() => {
            const root = document.querySelector('.component-playground:not([hidden]) .time-field');
            return [
              ...root.querySelectorAll('legend,.time-field-description,.time-field-status')
            ].map((el) => getComputedStyle(el).color);
          })
        : null;
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
    if (timeContext) {
      const readonly = await page.evaluate(() => {
        const root = document.querySelector('.component-playground:not([hidden]) .time-field');
        return {
          context: [
            ...root.querySelectorAll('legend,.time-field-description,.time-field-status')
          ].map((el) => getComputedStyle(el).color),
          input: getComputedStyle(root.querySelector('input')).color,
          period: getComputedStyle(root.querySelector('select')).color,
          periodOpacity: getComputedStyle(root.querySelector('select')).opacity,
          periodDisabled: root.querySelector('select').disabled
        };
      });
      assert.deepEqual(
        readonly.context,
        timeContext,
        'readonly must not dim the time group as disabled'
      );
      assert.equal(
        readonly.period,
        readonly.input,
        'readonly period and numeric values stay equally readable'
      );
      assert.equal(
        readonly.periodOpacity,
        '1',
        'readonly period is not dimmed by native disabled opacity'
      );
      assert(
        readonly.periodDisabled,
        'the native period select cannot be changed in a readonly group'
      );
    }
  }

  // Native disabled triggers and independently disabled tree controls must
  // render as unavailable, including inside an otherwise selected tree item.
  for (const [slug, selector] of [
    ['navigation-menu', '.nav-menu-trigger'],
    ['tree-view', '.tree-leaf']
  ]) {
    await activate(page, slug);
    const target = `.component-playground:not([hidden]) ${selector}`;
    await settle(page);
    const before = await page.$eval(target, (el) => getComputedStyle(el).color);
    await page.$eval(target, (el) => {
      if ('disabled' in el) el.disabled = true;
      else el.setAttribute('aria-disabled', 'true');
    });
    await settle(page);
    const disabledColor = await page.$eval(target, (el) => getComputedStyle(el).color);
    assert.notEqual(disabledColor, before, `${slug}: disabled control has visible treatment`);
    if (slug === 'tree-view') {
      const descendantColors = await page.evaluate(() => {
        const tree = document.querySelector('.component-playground:not([hidden]) .tree');
        tree.querySelector('.tree-leaf').removeAttribute('aria-disabled');
        const branch = tree.querySelector('.tree-item:has(> .tree-branch)');
        branch.setAttribute('aria-disabled', 'true');
        return [...branch.querySelectorAll('.tree-leaf,.tree-branch-trigger')].map(
          (el) => getComputedStyle(el).color
        );
      });
      assert(descendantColors.length >= 2, 'a disabled branch contains visible descendants');
      // Let the shared state transition settle before comparing descendants.
      await settle(page);
      assert(
        (
          await page.$$eval(
            '.component-playground:not([hidden]) .tree-item[aria-disabled="true"] :is(.tree-leaf,.tree-branch-trigger)',
            (els) => els.map((el) => getComputedStyle(el).color)
          )
        ).every((color) => color === disabledColor),
        'disabled branch descendants use the disabled text role'
      );
    }
    await page.$eval('.component-playground:not([hidden]) form', (form) => form.reset());
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
  }

  // -- Minimum pointer target ----------------------------------
  // Sweep visible targets in every mounted default playground. Closed overlays
  // need separate interaction coverage. A control that is only as
  // tall as its line box, or a native input whose label is too small, falls
  // under the 24px minimum, and no single component review catches that class.
  const MINIMUM = 24;
  const sweep = [];
  for (const { slug } of registry.components) {
    await activate(page, slug);
    const undersized = await page.evaluate((minimum) => {
      // Typography presents rendered Markdown prose rather than interface
      // controls, and the toolbar separator is a drawn rule.
      const selector =
        'a[href], button, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="separator"], [role="gridcell"][tabindex], summary, input:not([type="hidden"]), select, textarea';
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
            if (labelRect?.height) {
              width = Math.max(rect.right, labelRect.right) - Math.min(rect.left, labelRect.left);
              height = Math.max(rect.bottom, labelRect.bottom) - Math.min(rect.top, labelRect.top);
            }
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
    sweep.push(...undersized);
  }
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

  // Page-level overflow can pass while a component collapses or clips inside
  // the preview's scroll container. Check the actual component boundaries.
  await page.setViewport({ width: 320, height: 1000 });
  const initialDark = await page.$eval('html', (element) => element.classList.contains('dark'));
  const chooseTheme = async (dark) => {
    if ((await page.$eval('html', (element) => element.classList.contains('dark'))) !== dark)
      await page.click('[data-docs-theme-toggle]');
    await page.waitForFunction(
      (dark) => {
        const root = document.documentElement;
        const theme = dark ? 'dark' : 'light';
        return (
          root.classList.contains('dark') === dark &&
          root.dataset.theme === theme &&
          root.style.colorScheme === theme
        );
      },
      {},
      dark
    );
  };
  for (const dark of [false, true]) {
    await chooseTheme(dark);
    for (const slug of ['card', 'date-picker', 'navigation-menu']) {
      await activate(page, slug);
      await page.$eval('.component-playground:not([hidden]) form', (form) => form.reset());
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
      const bounds = await page.evaluate((slug) => {
        const demo = document.querySelector('.component-playground:not([hidden]) .playground-demo');
        const root = demo.querySelector(
          { card: '.card', 'date-picker': '.date-picker', 'navigation-menu': '.nav-menu' }[slug]
        );
        const rect = root.getBoundingClientRect();
        const targets = [
          ...root.querySelectorAll(
            {
              card: '.card-header,.card-content,.card-footer',
              'date-picker': '.date-picker-day',
              'navigation-menu': '.nav-menu-link,.nav-menu-trigger'
            }[slug]
          )
        ].map((el) => {
          const box = el.getBoundingClientRect();
          return { left: box.left, right: box.right, width: box.width, height: box.height };
        });
        return { width: rect.width, left: rect.left, right: rect.right, targets };
      }, slug);
      assert(bounds.width >= 24, `${slug}: the component must not collapse`);
      assert(bounds.targets.length > 0, `${slug}: component targets are rendered`);
      for (const target of bounds.targets) {
        assert(
          target.left >= bounds.left - 1 && target.right <= bounds.right + 1,
          `${slug}: content escapes the component at 320px`
        );
        assert(
          target.width >= 24 && target.height >= 24,
          `${slug}: visible content and targets retain usable dimensions`
        );
      }
    }
  }
  await chooseTheme(initialDark);
  await page.setViewport({ width: 1440, height: 1000 });
  console.log('PASS narrow Card, Date Picker and Navigation Menu containment in both themes');

  // Changing orientation cannot split a control from its help or replace a
  // mounted native draft. The exporter needs enough width for the same anatomy.
  await activate(page, 'form');
  const formDemo = '.component-playground:not([hidden]) .playground-demo';
  await page.$eval(`${formDemo} form`, (form) => {
    window.__orientationInputs = [...form.querySelectorAll('input,textarea')];
  });
  await page.click(`${formDemo} .text-field-input`);
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.type(`${formDemo} .text-field-input`, 'edited-name');
  await page.select(
    '.component-playground:not([hidden]) [name="prop:part-form-field:0:data-orientation"]',
    'horizontal'
  );
  const composed = await page.$eval(`${formDemo} .form-field`, (field) => {
    const input = field.querySelector('input');
    const help = field.querySelector('.field-description');
    const box = input.getBoundingClientRect();
    const note = help.getBoundingClientRect();
    const inputs = [...field.closest('form').querySelectorAll('input,textarea')];
    return {
      grouped:
        input.parentElement === help.parentElement && input.parentElement.parentElement === field,
      sameNodes: inputs.every((element, index) => element === window.__orientationInputs[index]),
      value: input.value,
      height: box.height,
      helpGap: note.top - box.bottom,
      helpAlignment: note.left - box.left,
      description: input
        .getAttribute('aria-describedby')
        ?.split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent.trim())
        .join(' '),
      visibleHelp: help.textContent.trim(),
      formData: [...new FormData(field.closest('form'))],
      requiredMark: getComputedStyle(field.querySelector('.label'), '::after').content
    };
  });
  assert(
    composed.grouped && composed.sameNodes,
    'Horizontal edits retain the native control/help group'
  );
  assert.equal(composed.value, 'edited-name');
  assert.equal(composed.description, composed.visibleHelp, 'Form help describes its native input');
  // Generated playgrounds namespace successful-control names along with IDs
  // (scripts/docs-render.mjs::namespace); the source fixture names stay plain.
  assert.deepEqual(composed.formData, [
    ['live-form-username', 'edited-name'],
    ['live-form-email', ''],
    ['live-form-bio', '']
  ]);
  assert.equal(composed.height, 36);
  assert(Math.abs(composed.helpGap - 4) <= 1 && Math.abs(composed.helpAlignment) <= 1);
  assert(
    composed.requiredMark.includes('*'),
    'Grouped native required state still marks its label'
  );
  await page.select(
    '.component-playground:not([hidden]) [name="prop:part-form-field:0:data-orientation"]',
    '__remove'
  );
  assert(
    await page.$eval(
      `${formDemo} .text-field-input`,
      (input) => input === window.__orientationInputs[0] && input.value === 'edited-name'
    )
  );
  await page.evaluate(() => delete window.__orientationInputs);

  await page.goto(`${baseUrl}/docs/figma.html`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const horizontalExport = await page.$$eval(
    '[data-component="form"] .form-field[data-orientation="horizontal"]',
    (fields) =>
      fields.map((field) => {
        const input = field.querySelector('input');
        const help = field.querySelector('.field-description');
        const style = getComputedStyle(input);
        const context = document.createElement('canvas').getContext('2d');
        context.font = style.font;
        const contentWidth = context.measureText(input.value || input.placeholder).width;
        return {
          grouped: input.parentElement === help.parentElement,
          wide: field.closest('.matrix-row').classList.contains('matrix-wide'),
          usableWidth:
            input.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
          contentWidth,
          height: input.getBoundingClientRect().height,
          helpGap: help.getBoundingClientRect().top - input.getBoundingClientRect().bottom
        };
      })
  );
  assert(horizontalExport.length > 0);
  for (const item of horizontalExport) {
    assert(item.grouped && item.wide, 'Horizontal export uses the complete wide composition');
    assert(item.usableWidth >= item.contentWidth, 'The authored input text fits without clipping');
    assert.equal(item.height, 36);
    assert(Math.abs(item.helpGap - 4) <= 1);
  }
  assert.equal(
    await page.$$eval(
      '[data-component="accordion"] .matrix-row h3',
      (labels) => labels.filter((label) => label.textContent.includes('selection:')).length
    ),
    0,
    'The inert Accordion exports open appearance, not behavior-only selection'
  );
  console.log('PASS grouped horizontal Form draft/geometry and inert Accordion export');
}
