import assert from 'node:assert/strict';

const active = '.component-playground:not([hidden])';
const demo = `${active} .playground-demo`;

// Exercise the rendered contracts, not just the options declared by the model.
// Optional captures are evidence for inspection, never golden-image baselines.
export async function inspectIndustryVariants(page, baseUrl, { capture } = {}) {
  const firefox = (await page.browser().version()).toLowerCase().includes('firefox');
  const cdp = firefox ? null : await page.createCDPSession();
  const results = [];
  const settle = () =>
    page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
          .map((animation) => animation.finished.catch(() => {}))
      );
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
  const geometry = (selector) =>
    page.$eval(selector, (el) => {
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return {
        width: box.width,
        height: box.height,
        fontSize: parseFloat(style.fontSize),
        padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
        color: style.color,
        border: style.borderColor,
        background: style.backgroundColor,
        text: el.textContent,
        overflow: document.documentElement.scrollWidth - innerWidth
      };
    });
  const scenarios = [
    { name: 'desktop', width: 1440 },
    { name: '320', width: 320 },
    { name: 'css-zoom-200', width: 1280, zoom: 2 },
    ...(!firefox
      ? [
          { name: 'contrast', width: 1280, media: 'prefers-contrast' },
          { name: 'forced', width: 1280, media: 'forced-colors' }
        ]
      : [])
  ];
  try {
    for (const theme of ['light', 'dark'])
      for (const scenario of scenarios) {
        await page.setViewport({ width: scenario.width, height: 1000 });
        await cdp?.send('Emulation.setEmulatedMedia', {
          features: [
            { name: 'prefers-reduced-motion', value: 'reduce' },
            {
              name: 'prefers-contrast',
              value: scenario.media === 'prefers-contrast' ? 'more' : 'no-preference'
            },
            { name: 'forced-colors', value: scenario.media === 'forced-colors' ? 'active' : 'none' }
          ]
        });
        const navigate = async (slug) => {
          await page.goto(`${baseUrl}/docs/preview.html#preview-${slug}`);
          await page.waitForSelector('body.enhanced');
          await page.waitForSelector(`${demo}`);
          await page.waitForSelector('[data-docs-theme-toggle][data-mewa-app-shell-init]');
          await settle();
          if (
            (await page.$eval('html', (el) => el.classList.contains('dark'))) !==
            (theme === 'dark')
          )
            await page.click('[data-docs-theme-toggle]');
          await page.evaluate((zoom) => {
            document.documentElement.style.zoom = String(zoom);
          }, scenario.zoom || 1);
          await settle();
          assert.deepEqual(
            await page.$eval('html', (el) => ({
              theme: el.dataset.theme,
              scheme: el.style.colorScheme
            })),
            { theme, scheme: theme }
          );
          if (!firefox)
            assert.equal(
              await page.evaluate(() => matchMedia('(forced-colors: active)').matches),
              scenario.media === 'forced-colors',
              'The requested forced-color mode is actually active'
            );
        };
        const record = async (slug, state, selector) => {
          await settle();
          const info = await geometry(selector);
          assert(info.width > 0 && info.height > 0, `${slug}/${state}: painted box`);
          assert(info.overflow <= 1, `${slug}/${state}/${scenario.name}: page overflow`);
          const name = `${theme}-${scenario.name}-${slug}-${state}`;
          results.push({ name, ...info });
          await capture?.(name, selector);
          return info;
        };

        await navigate('card');
        const card = await page.$(`${demo} .card`);
        const title = await page.$eval(`${demo} .card-title`, (el) => el.textContent);
        for (const density of ['__remove', 'compact']) {
          await page.select(`${active} [name="prop:data-density"]`, density);
          const info = await record('card', density, `${demo} .card`);
          const same = await page.$eval(`${demo} .card`, (el, original) => el === original, card);
          assert(same, 'Density preserves mounted Card identity');
          assert.equal(await page.$eval(`${demo} .card-title`, (el) => el.textContent), title);
          const content = await geometry(`${demo} .card-content`);
          const compact = density === 'compact' || info.width / (scenario.zoom || 1) <= 282;
          assert.deepEqual(content.padding, Array(4).fill(compact ? '16px' : '24px'));
          const button = await geometry(`${demo} .card .btn`);
          assert.equal(
            button.height / (scenario.zoom || 1),
            36,
            'Content density never shrinks actions'
          );
        }
        await card.dispose();

        await navigate('statistic');
        const content = await page.$eval(`${demo} .statistic`, (el) => el.textContent);
        for (const density of ['__remove', 'compact']) {
          await page.select(`${active} [name="prop:data-density"]`, density);
          const info = await record('statistic', density, `${demo} .statistic-value`);
          assert.equal(info.fontSize, density === 'compact' ? 24 : 36);
          assert.equal(await page.$eval(`${demo} .statistic`, (el) => el.textContent), content);
        }
        if (scenario.media === 'forced-colors') {
          await page.select(`${active} [name="prop:part-statistic-trend:0:data-trend"]`, 'down');
          assert.equal(
            await page.$eval(`${demo} .statistic-trend`, (el) => {
              const probe = document.createElement('span');
              probe.style.color = 'CanvasText';
              el.append(probe);
              const matches = getComputedStyle(el).color === getComputedStyle(probe).color;
              probe.remove();
              return matches;
            }),
            true,
            'A negative trend uses legible system text, not the yellow Mark background color'
          );
        }

        await navigate('text-field');
        for (const structure of [
          'plain',
          'prefix',
          'suffix',
          'affixes',
          'action',
          'affixes and action'
        ]) {
          await page.select(`${active} [name="slot"]`, structure);
          const input = await page.$(`${demo} .text-field-input`);
          const outer =
            structure === 'plain' ? `${demo} .text-field-input` : `${demo} .text-field-control`;
          await record('text-field', structure, `${demo} .text-field`);
          const inputBox = await geometry(`${demo} .text-field-input`);
          assert(
            inputBox.width / (scenario.zoom || 1) >= 35,
            'Compound field retains an editable input target'
          );
          assert(
            inputBox.height / (scenario.zoom || 1) >= 32,
            'Compound density retains native control height'
          );
          assert.equal(
            await page.$$eval(`${demo} .text-field-affix`, (els) => els.length),
            ['affixes', 'affixes and action'].includes(structure)
              ? 2
              : ['prefix', 'suffix'].includes(structure)
                ? 1
                : 0
          );
          assert.equal(
            await page.$$eval(`${demo} .text-field-action`, (els) => els.length),
            ['action', 'affixes and action'].includes(structure) ? 1 : 0
          );
          assert.equal(
            await page.$eval(`${active} [data-scope="part-button"]`, (el) => el.hidden),
            !['action', 'affixes and action'].includes(structure),
            'Action controls are absent when no action is rendered'
          );
          const context = await page.$eval(`${demo} .text-field-input`, (input) => {
            const references = input
              .getAttribute('aria-describedby')
              .split(/\s+/)
              .map((id) => document.getElementById(id));
            return {
              missing: references.filter((element) => !element).length,
              text: references.map((element) => element?.textContent).join(' '),
              hiddenAffixes: [
                ...input
                  .closest('.text-field')
                  .querySelectorAll('.text-field-affix[aria-hidden="true"]')
              ].length
            };
          });
          assert.equal(
            context.missing,
            0,
            'Structural changes retain no dangling context references'
          );
          assert.equal(context.hiddenAffixes, 0, 'Meaningful affix text remains exposed');
          assert.equal(
            context.text.includes('https://'),
            ['prefix', 'affixes', 'affixes and action'].includes(structure)
          );
          assert.equal(
            context.text.includes('.example.test'),
            ['suffix', 'affixes', 'affixes and action'].includes(structure)
          );
          await page.$eval(`${demo} .text-field-input`, (el) => {
            el.value = 'current-draft';
            el.focus();
            el.setSelectionRange(2, 8);
            el.dispatchEvent(new Event('input', { bubbles: true }));
          });
          // A presentation edit is not a remount or a reset-baseline edit. Keep
          // focus on the actual input while dispatching the inspector change.
          await page.$eval(`${active} [name="prop:invalid"]`, (control) => {
            control.checked = true;
            control.dispatchEvent(new Event('input', { bubbles: true }));
          });
          await settle();
          assert.deepEqual(
            await page.$eval(
              `${demo} .text-field-input`,
              (el, original) => ({
                same: el === original,
                value: el.value,
                baseline: el.defaultValue,
                selection: [el.selectionStart, el.selectionEnd],
                focused: el === document.activeElement,
                invalid: el.getAttribute('aria-invalid')
              }),
              input
            ),
            {
              same: true,
              value: 'current-draft',
              baseline: 'api',
              selection: [2, 8],
              focused: true,
              invalid: 'true'
            }
          );
          const boundary = await page.$eval(outer, (el) => {
            const style = getComputedStyle(el);
            return { shadow: style.boxShadow, outline: style.outlineStyle };
          });
          assert(
            boundary.shadow !== 'none' || boundary.outline !== 'none',
            'Invalid and keyboard focus both remain painted'
          );
          if (['action', 'affixes and action'].includes(structure)) {
            assert.equal(
              (await geometry(`${demo} .text-field-action`)).width / (scenario.zoom || 1),
              36
            );
            assert.equal(
              (await geometry(`${demo} .text-field-action`)).height / (scenario.zoom || 1),
              36
            );
            await page.$eval(`${demo} form`, (form) => {
              form.dataset.submits = '0';
              form.addEventListener('submit', () => {
                form.dataset.submits = String(Number(form.dataset.submits) + 1);
                form.dataset.submitted = JSON.stringify([...new FormData(form)]);
              });
            });
            await page.click(`${demo} .text-field-action`);
            assert.equal(await page.$eval(`${demo} form`, (form) => form.dataset.submits), '1');
            assert.deepEqual(
              JSON.parse(await page.$eval(`${demo} form`, (form) => form.dataset.submitted)),
              [['live-text-field-service', 'current-draft']],
              'Native submission contains the editable value, never the affix'
            );
            const setInspector = async (name, checked) =>
              page.$eval(
                `${active} [name="${name}"]`,
                (control, checked) => {
                  control.checked = checked;
                  control.dispatchEvent(new Event('input', { bubbles: true }));
                },
                checked
              );
            await setInspector('prop:disabled', true);
            assert(await page.$eval(`${demo} .text-field-input`, (el) => el.disabled));
            assert.equal(
              await page.$eval(`${demo} .text-field-action`, (el) => el.disabled),
              false,
              'Native input availability never silently disables its sibling action'
            );
            await setInspector('prop:part-button:0:disabled', true);
            await setInspector('prop:disabled', false);
            assert(
              await page.$eval(`${demo} .text-field-action`, (el) => el.disabled),
              'Removing input disabled preserves the action owner state'
            );
            await setInspector('prop:part-button:0:disabled', false);
            await setInspector('prop:readonly', true);
            assert.equal(
              await page.$eval(`${demo} .text-field-action`, (el) => el.disabled),
              false
            );
            assert(await page.$eval(`${demo} .text-field-input`, (el) => el.readOnly));
          }
          await input.dispose();
        }

        await navigate('dialog');
        for (const scroll of ['__remove', 'body']) {
          await page.select(`${active} [name="prop:data-scroll"]`, scroll);
          await page.click(`${demo} [data-dialog-trigger]`);
          await page.waitForSelector(`${demo} .dialog[open]`);
          await page.$eval(`${demo} .dialog-body`, (body) => {
            body.querySelectorAll('[data-review-paragraph]').forEach((el) => el.remove());
            for (let i = 0; i < 18; i++) {
              const paragraph = document.createElement('p');
              paragraph.dataset.reviewParagraph = '';
              paragraph.textContent = `Connection record ${i + 1}: review the service endpoint, permission scope, and recovery destination before saving this configuration.`;
              body.append(paragraph);
            }
          });
          await record('dialog', scroll, `${demo} .dialog`);
          const footerBefore = await page.$eval(
            `${demo} .dialog-footer`,
            (el) => el.getBoundingClientRect().y
          );
          const scrollState = await page.$eval(`${demo} .dialog`, (dialog) => {
            const body = dialog.querySelector('.dialog-body');
            const owner = dialog.dataset.scroll === 'body' ? body : dialog;
            owner.scrollTop = owner.scrollHeight;
            return {
              bodyOverflow: getComputedStyle(body).overflowY,
              top: owner.scrollTop,
              localHeight: body.clientHeight,
              bodyHeight: body.scrollHeight,
              dialogHeight: dialog.clientHeight
            };
          });
          assert(scrollState.top > 0, 'Long dialog content has a working scroll owner');
          if (scroll === 'body') {
            assert.equal(scrollState.bodyOverflow, 'auto');
            assert(scrollState.bodyHeight > scrollState.localHeight);
            assert.equal(await page.$eval(`${demo} .dialog`, (el) => el.scrollTop), 0);
            assert.equal(
              await page.$eval(`${demo} .dialog-footer`, (el) => el.getBoundingClientRect().y),
              footerBefore
            );
            assert(
              await page.$eval(`${demo} .dialog-footer`, (footer) => {
                const dialog = footer.closest('dialog').getBoundingClientRect();
                const box = footer.getBoundingClientRect();
                return box.top >= dialog.top && box.bottom <= dialog.bottom;
              }),
              'Footer stays inside its surface while only the body scrolls'
            );
          }
          await page.keyboard.press('Escape');
          await page.waitForSelector(`${demo} .dialog:not([open])`);
          assert(
            await page.$eval(`${demo} [data-dialog-trigger]`, (el) => el === document.activeElement)
          );
        }

        await navigate('callout');
        for (const [variant, title] of [
          ['default', 'Connection required'],
          ['positive', 'Connected'],
          ['caution', 'Connection interrupted'],
          ['destructive', 'Connection failed']
        ]) {
          await page.select(`${active} [name="prop:data-variant"]`, variant);
          const info = await record('callout', variant, `${demo} .callout`);
          assert.deepEqual(info.padding, Array(4).fill('16px'), 'Status variants share one inset');
          assert.equal(await page.$eval(`${demo} .callout-title`, (el) => el.textContent), title);
          assert.equal(
            await page.$$eval(
              `${demo} [role="alert"],${demo} [role="status"]`,
              (els) => els.length
            ),
            0
          );
          assert.match(
            await page.$eval(`${active} .playground-code`, (el) => el.textContent),
            new RegExp(title)
          );
        }
      }
    // A complete labelled row must remain visible at initial native autofocus.
    // This independently exercises the short-body Firefox failure reported by
    // source-fixture review; later Tab scrolling would conceal that failure.
    await page.setViewport({ width: 1440, height: 720 });
    await cdp?.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });
    await page.goto(`${baseUrl}/docs/preview.html#preview-dialog`);
    await page.waitForSelector(`${demo} .dialog`);
    await page.select(`${active} [name="prop:data-scroll"]`, 'body');
    await page.evaluate(() => (document.documentElement.style.zoom = '2'));
    await page.$eval(`${demo} .dialog`, (dialog) => {
      dialog.querySelector('.dialog-title').textContent =
        'Review the connection settings for background jobs';
      dialog.querySelector('.dialog-description').textContent =
        'Review the endpoint, retry limits, result retention, and failure notices before saving these settings for the workspace.';
      dialog.querySelector('.dialog-body').innerHTML =
        '<div class="form-group"><div class="field"><label for="review-focus-first">Service endpoint</label><input class="text-field-input" id="review-focus-first" name="endpoint" type="url" value="https://jobs.example.test" required autofocus><p class="field-description">Use the endpoint approved for this workspace.</p></div>' +
        Array.from(
          { length: 14 },
          (_, i) =>
            `<p>Connection record ${i + 1}: review the service endpoint and failure recovery before saving these settings.</p>`
        ).join('') +
        '<div class="field"><label for="review-focus-last">Result owner email</label><input class="text-field-input" id="review-focus-last" name="owner" type="email" value="jobs@example.test" required></div></div>';
      dialog.querySelector('[data-dialog-close]').textContent =
        'Cancel without saving these settings';
      dialog.querySelector('[type="submit"]').textContent =
        'Save the connection settings for background jobs';
      const reset = document.createElement('button');
      reset.className = 'btn';
      reset.type = 'reset';
      reset.dataset.variant = 'secondary';
      reset.textContent = 'Reset';
      dialog
        .querySelector('.dialog-footer')
        .insertBefore(reset, dialog.querySelector('[type="submit"]'));
    });
    await settle();
    await page.click(`${demo} [data-dialog-trigger]`);
    await settle();
    const initialFocusState = () =>
      page.$eval('#review-focus-first', (input) => {
        const scrollBody = input.closest('.dialog-body');
        const dialog = input.closest('dialog');
        const body = scrollBody.getBoundingClientRect();
        const box = input.getBoundingClientRect();
        return {
          focused: input === document.activeElement,
          height: box.height,
          bodyHeight: body.height,
          topClearance: box.top - body.top,
          bottomClearance: body.bottom - box.bottom,
          viewportTop: box.top,
          viewportBottom: box.bottom,
          viewportHeight: innerHeight,
          bodyScroll: [scrollBody.scrollLeft, scrollBody.scrollTop],
          dialogScroll: [dialog.scrollLeft, dialog.scrollTop],
          documentScroll: [scrollX, scrollY]
        };
      });
    const focusBounds = await initialFocusState();
    assert(focusBounds.focused, 'The first native input owns initial autofocus');
    assert(
      focusBounds.topClearance >= 2 && focusBounds.bottomClearance >= 2,
      `Initial focused input and perimeter fit its short scrolling body: ${JSON.stringify(focusBounds)}`
    );
    assert(
      focusBounds.viewportTop >= 0 && focusBounds.viewportBottom <= focusBounds.viewportHeight,
      'Initial autofocus is visible inside the viewport'
    );
    results.push({
      name: 'dialog-long-header-short-body-initial-focus-css-zoom-200',
      ...focusBounds
    });
    await capture?.('dialog-long-header-short-body-initial-focus-css-zoom-200', `${demo} .dialog`);
    assert.deepEqual(
      await initialFocusState(),
      focusBounds,
      'Initial-focus capture must not change native focus, scroll positions, or painted bounds'
    );
    await page.keyboard.press('Escape');
    assert(
      await page.$eval(
        `${demo} [data-dialog-trigger]`,
        (trigger) => trigger === document.activeElement
      )
    );
    console.log(
      `PASS ${results.length} painted industry-variant states (${firefox ? 'Firefox' : 'Chrome'})`
    );
    return results;
  } finally {
    await page.evaluate(() => document.documentElement.style.removeProperty('zoom'));
    await cdp?.send('Emulation.setEmulatedMedia', { features: [] });
    await cdp?.detach();
  }
}
