import assert from 'node:assert/strict';

const active = '.component-playground:not([hidden])';
const demo = `${active} .playground-demo`;

// Reuse the caller's browser/server. Optional capture receives (name, selector)
// after the measured state has settled; this helper writes no shared artifacts.
export async function inspectVisualCorrections(page, baseUrl, options = {}) {
  const { capture, emulateMedia } = options;
  // Firefox BiDi has no CDP media emulation. Its normal path is still required;
  // callers can supply native launch preferences and an explicit media hook.
  const firefox = (await page.browser().version()).toLowerCase().includes('firefox');
  const modes = options.modes || (firefox ? ['normal'] : ['normal', 'contrast', 'forced']);
  const cdp = !emulateMedia && !firefox ? await page.createCDPSession() : null;
  const media =
    emulateMedia || ((features) => cdp?.send('Emulation.setEmulatedMedia', { features }));
  const results = [];
  const settle = () =>
    page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await Promise.all(
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
          .map((animation) => animation.finished.catch(() => {}))
      );
    });
  const inspect = (selector) =>
    page.$$eval(selector, (elements) =>
      elements.map((el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const probe = document.createElement('span');
        el.append(probe);
        const roles = {};
        for (const [name, value] of Object.entries({
          disabled: 'var(--text-disabled)',
          invalid: 'var(--border-invalid)',
          gray: 'GrayText',
          highlight: 'Highlight',
          link: 'LinkText'
        })) {
          probe.style.color = value;
          roles[name] = getComputedStyle(probe).color;
        }
        probe.remove();
        return {
          color: style.color,
          background: style.backgroundColor,
          image: style.backgroundImage,
          border: style.borderColor,
          borderStyle: style.borderStyle,
          weight: Number(style.fontWeight),
          shadow: style.boxShadow,
          outline: style.outlineStyle,
          outlineColor: style.outlineColor,
          outlineWidth: parseFloat(style.outlineWidth),
          width: rect.width,
          height: rect.height,
          current: el.getAttribute('aria-current'),
          classCurrent: el.classList.contains('pagination-active'),
          pressed: el.getAttribute('aria-pressed'),
          nativeDisabled: el.matches(':disabled'),
          iconColors: [
            ...el.querySelectorAll('svg,[class^="ri-"],[class*=" ri-"],.command-palette-shortcut')
          ].map((icon) => getComputedStyle(icon).color),
          roles
        };
      })
    );
  const record = async (name, selector, extra = {}) => {
    await settle();
    results.push({ name, ...extra, styles: await inspect(selector) });
    await capture?.(name, selector);
    return results.at(-1).styles;
  };
  const boundaryGeometry = async (selector) => {
    const controls = await page.$$eval(selector, (elements) =>
      elements.map((el) => {
        const rect = el.getBoundingClientRect();
        const svg = el.querySelector('svg');
        const icon = svg?.getBoundingClientRect();
        return {
          name: el.getAttribute('aria-label'),
          text: el.textContent.trim(),
          width: rect.width,
          height: rect.height,
          iconWidth: icon?.width,
          iconHeight: icon?.height,
          contained: Boolean(
            icon &&
            icon.x >= rect.x &&
            icon.y >= rect.y &&
            icon.right <= rect.right &&
            icon.bottom <= rect.bottom
          ),
          decorative: svg?.getAttribute('aria-hidden') === 'true'
        };
      })
    );
    assert.equal(controls.length, 2, 'Previous and Next both render');
    for (const control of controls) {
      assert(control.name, 'Icon-only boundary retains its accessible name');
      assert.equal(control.text, '', 'Boundary has no overflowing Previous/Next text');
      assert.equal(control.width, 36);
      assert.equal(control.height, 36);
      assert.equal(control.iconWidth, 16);
      assert.equal(control.iconHeight, 16);
      assert(control.contained && control.decorative, 'Decorative vector fits the square control');
    }
    return controls;
  };
  const disabledStyles = (styles, forced) => {
    for (const style of styles) {
      assert.equal(style.color, forced ? style.roles.gray : style.roles.disabled);
      assert(style.width > 0 && style.height >= 36, 'Unavailable control stays legible and sized');
      for (const iconColor of style.iconColors) assert.equal(iconColor, style.color);
    }
  };

  try {
    for (const theme of ['light', 'dark'])
      for (const mode of modes) {
        const forced = mode === 'forced';
        await media([
          { name: 'prefers-reduced-motion', value: 'reduce' },
          { name: 'prefers-contrast', value: mode === 'contrast' ? 'more' : 'no-preference' },
          { name: 'forced-colors', value: forced ? 'active' : 'none' }
        ]);
        const name = (state) => `${theme}-${mode}-${state}`;
        const navigate = async (slug, matrix = false) => {
          await page.goto(
            `${baseUrl}/docs/${matrix ? 'figma' : 'preview'}.html?visual-corrections=${theme}-${mode}-${slug}#preview-${slug}`,
            { waitUntil: 'domcontentloaded' }
          );
          if (!matrix) {
            await page.waitForSelector('body.enhanced');
            await page.waitForSelector(`${active} .playground-demo`);
          }
          const dark = await page.$eval('html', (el) => el.classList.contains('dark'));
          if (dark !== (theme === 'dark')) await page.click('[data-docs-theme-toggle]');
          await settle();
          assert.deepEqual(
            await page.$eval('html', (el) => ({
              theme: el.dataset.theme,
              scheme: el.style.colorScheme
            })),
            { theme, scheme: theme },
            'The actual theme controller agrees with rendered and native control presentation'
          );
          assert.equal(
            await page.evaluate(() => matchMedia('(forced-colors: active)').matches),
            forced,
            'The browser actually applies the requested contrast mode'
          );
          if (mode === 'contrast')
            assert(
              await page.evaluate(() => matchMedia('(prefers-contrast: more)').matches),
              'Increased contrast is active, not only requested'
            );
        };

        await navigate('pagination');
        const pageLinks = `${demo} .pagination-link`;
        for (const chosen of [1, 0, 2, 1]) {
          await page.select(`${active} select[name="exclusive:part-page"]`, String(chosen));
          const styles = await record(name(`pagination-current-${chosen + 1}`), pageLinks);
          assert.equal(styles.filter((style) => style.current === 'page').length, 1);
          assert.equal(styles.filter((style) => style.classCurrent).length, 1);
          assert.equal(styles[chosen].current, 'page');
          assert(styles[chosen].classCurrent, 'Public class follows the current page and back');
          assert.equal(
            styles.filter((style) => style.weight > styles.find((s) => s.current === null).weight)
              .length,
            1
          );
        }
        await page.$$eval(pageLinks, (links) =>
          links.forEach((link) => link.classList.remove('pagination-active'))
        );
        const native = await record(name('pagination-aria-only'), pageLinks);
        assert(
          native[1].weight > native[0].weight,
          'ARIA-only current page has the native authoritative presentation'
        );
        await page.$$eval(pageLinks, (links) => {
          links[1].removeAttribute('aria-current');
          links[1].classList.add('pagination-active');
        });
        const legacy = await inspect(pageLinks);
        assert(legacy[1].weight > legacy[0].weight, 'Class-only public hook remains compatible');
        results.push({
          name: name('pagination-boundaries'),
          controls: await boundaryGeometry(`${demo} .pagination-prev,${demo} .pagination-next`)
        });

        await navigate('data-table');
        results.push({
          name: name('data-table-boundaries'),
          controls: await boundaryGeometry(`${demo} .pagination-prev,${demo} .pagination-next`)
        });
        await capture?.(name('data-table-boundaries'), `${demo} .data-table-pagination`);
        const [tableCurrent] = await inspect(
          `${demo} .data-table-pagination-link[aria-current="page"]`
        );
        assert.notEqual(
          tableCurrent.color,
          tableCurrent.background,
          'Shared current-page CSS preserves Data Table current-page legibility'
        );
        // A default snapshot cannot catch a stale legacy class after paging.
        for (const [action, currentPage] of [
          ['next', '2'],
          ['previous', '1'],
          ['2', '2']
        ]) {
          await page.click(`${demo} [data-table-page="${action}"]`);
          await settle();
          const pages = await record(
            name(`data-table-current-${action}`),
            `${demo} .pagination-link[data-table-page]`
          );
          const current = pages.filter((style) => style.current === 'page');
          assert.equal(current.length, 1);
          assert.equal(
            await page.$eval(
              `${demo} [aria-current="page"][data-table-page]`,
              (el) => el.dataset.tablePage
            ),
            currentPage
          );
          assert.equal(
            pages.filter((style) => style.weight === current[0].weight).length,
            1,
            'Exactly one visual current page agrees with ARIA after native activation'
          );
        }
        await page.type(`${demo} [data-table-filter]`, 'Delta');
        await settle();
        const filteredPages = await record(
          name('data-table-current-filter'),
          `${demo} .pagination-link[data-table-page]`
        );
        assert.equal(filteredPages.filter((style) => style.current === 'page').length, 1);
        assert.equal(
          await page.$eval(
            `${demo} [aria-current="page"][data-table-page]`,
            (el) => el.dataset.tablePage
          ),
          '1',
          'Filtering clamps the current page and its rendered indicator together'
        );
        const filteredCurrent = filteredPages.find((style) => style.current === 'page');
        assert.equal(
          filteredPages.filter((style) => style.weight === filteredCurrent.weight).length,
          1
        );

        await navigate('combobox');
        const trigger = `${demo} .combobox-trigger`;
        const [normal] = await record(name('combobox-normal'), trigger);
        await page.click(`${active} input[name="prop:invalid"]`);
        const [invalid] = await record(name('combobox-invalid'), trigger);
        assert.equal(invalid.border, forced ? invalid.roles.link : invalid.roles.invalid);
        assert.notEqual(
          invalid.border,
          normal.border,
          'Invalid state changes the visible control boundary'
        );
        if (forced)
          assert.equal(
            invalid.borderStyle,
            'dashed',
            'Invalid meaning does not depend only on color'
          );
        await page.focus(trigger);
        await page.keyboard.press('Tab');
        await page.keyboard.down('Shift');
        await page.keyboard.press('Tab');
        await page.keyboard.up('Shift');
        assert(
          await page.$eval(trigger, (el) => el.matches(':focus-visible')),
          'Combobox focus check uses the actual keyboard path'
        );
        const [focused] = await record(name('combobox-invalid-focused'), trigger);
        if (forced) {
          assert.equal(focused.outline, 'solid');
          assert.equal(focused.outlineColor, focused.roles.highlight);
          assert(focused.outlineWidth >= 2);
        } else
          assert.notEqual(
            focused.shadow,
            'none',
            'Invalid keyboard focus retains a visible perimeter'
          );
        await page.click(`${active} input[name="prop:invalid"]`);
        const [cleared] = await record(name('combobox-cleared'), trigger);
        assert.equal(cleared.border, normal.border);
        assert.equal(cleared.borderStyle, normal.borderStyle);
        assert.equal(cleared.shadow, normal.shadow);
        for (const owner of ['root', 'trigger']) {
          await page.$eval(
            trigger,
            (el, owner) => {
              el.closest('.combobox').toggleAttribute('data-invalid', owner === 'root');
              if (owner === 'trigger') el.setAttribute('aria-invalid', 'true');
              else el.removeAttribute('aria-invalid');
            },
            owner
          );
          const [state] = await record(name(`combobox-${owner}-invalid`), trigger);
          assert.equal(state.border, forced ? state.roles.link : state.roles.invalid);
        }

        await navigate('toggle-group');
        await page.select(`${active} select[name="prop:data-variant"]`, 'outline');
        const toggles = `${demo} .toggle-group > .toggle`;
        await settle();
        const enabled = await inspect(toggles);
        await page.click(`${active} input[name="prop:disabled"]`);
        const disabled = await record(name('toggle-group-disabled-pressed'), toggles);
        disabledStyles(disabled, forced);
        assert(disabled.every((style) => style.nativeDisabled));
        assert.equal(disabled[0].pressed, 'true');
        assert.equal(
          disabled[0].outline,
          'solid',
          'Unavailable pressed state stays distinguishable'
        );
        assert(disabled[0].outlineWidth > 0);
        assert.equal(
          disabled[1].outline,
          'none',
          'Unpressed unavailable state has no pressed indicator'
        );
        assert.notEqual(
          disabled[0].color,
          enabled[0].color,
          'Disabled role wins over outline pressed color'
        );
        assert.deepEqual(
          disabled.map((s) => [s.width, s.height]),
          enabled.map((s) => [s.width, s.height])
        );
        await page.click(`${active} input[name="prop:disabled"]`);
        await settle();
        const restored = await inspect(toggles);
        assert.equal(
          restored[0].color,
          enabled[0].color,
          'Re-enabling restores the pressed enabled role'
        );
        await page.$eval(`${demo} .toggle-group`, (group) => {
          const fieldset = document.createElement('fieldset');
          fieldset.disabled = true;
          group.before(fieldset);
          fieldset.append(group);
        });
        disabledStyles(await record(name('toggle-group-fieldset-disabled'), toggles), forced);

        await navigate('command-palette');
        const palette = `${demo} dialog.command-palette`;
        await page.$eval(palette, (dialog) => {
          const items = [...dialog.querySelectorAll('.command-palette-item')];
          const icon = dialog.querySelector('.command-palette-input-wrapper svg');
          for (const item of items.slice(0, 4)) item.prepend(icon.cloneNode(true));
          items[0].disabled = true;
          items[1].setAttribute('aria-disabled', 'true');
          const fieldset = document.createElement('fieldset');
          fieldset.disabled = true;
          items[2].before(fieldset);
          fieldset.append(items[2]);
          items[3].disabled = true;
          dialog.showModal();
        });
        const commands = await record(
          name('command-palette-disabled'),
          `${palette} .command-palette-item`
        );
        disabledStyles(commands.slice(0, 4), forced);
        assert(
          commands[0].nativeDisabled && commands[2].nativeDisabled,
          'Direct and inherited native states are exercised'
        );
        assert(!commands[1].nativeDisabled, 'ARIA availability is exercised independently');
        assert.notEqual(
          commands[0].color,
          commands[4].color,
          'Unavailable commands differ from available commands'
        );
        await page.keyboard.press('End');
        const selected = await page.$eval(`${palette} .command-palette-input`, (input) =>
          document
            .getElementById(input.getAttribute('aria-activedescendant'))
            ?.matches(':disabled,[aria-disabled="true"]')
        );
        assert.equal(
          selected,
          false,
          'Keyboard navigation does not highlight an unavailable command'
        );
        await page.keyboard.press('Escape');
        await page.waitForFunction(
          (selector) => !document.querySelector(selector).open,
          {},
          palette
        );

        await navigate('resizable');
        const liveHandle = `${demo} .resizable-handle`;
        for (const orientation of ['vertical', 'horizontal']) {
          await page.select(`${active} select[name="prop:data-orientation"]`, orientation);
          await page.$eval(liveHandle, (handle) => handle.setAttribute('aria-disabled', 'true'));
          await page.hover(liveHandle);
          const [unavailable] = await record(
            name(`resizable-live-disabled-${orientation}`),
            liveHandle
          );
          assert.equal(
            unavailable.color,
            forced ? unavailable.roles.gray : unavailable.roles.disabled
          );
          assert.equal(
            unavailable.image,
            'none',
            'Disabled readiness/hover does not restore the enabled divider'
          );
          assert.equal(
            await page.$eval(liveHandle, (handle) => getComputedStyle(handle).cursor),
            'not-allowed'
          );
          await page.$eval(liveHandle, (handle) => handle.removeAttribute('aria-disabled'));
        }

        await navigate('todo-list', true);
        for (const status of ['pending', 'active', 'done', 'error']) {
          const cell = `[data-component="todo-list"] .matrix-cell[data-state-name="task item · status: ${status}"]`;
          const anatomy = await page.$eval(cell, (el) => {
            const details = el.querySelector('details.todo-list');
            const summaries = details.querySelectorAll(':scope > summary');
            return {
              count: summaries.length,
              text: summaries[0]?.textContent,
              height: summaries[0]?.getBoundingClientRect().height,
              items: details.querySelectorAll('.todo-item').length,
              status: details.querySelector('.todo-item')?.getAttribute('data-status')
            };
          });
          assert.equal(
            anatomy.count,
            1,
            'Isolated task keeps one authored summary, never browser Details'
          );
          assert(anatomy.text.includes('Fix the failing motion check'));
          assert(anatomy.height > 0 && anatomy.items === 1);
          assert.equal(anatomy.status, status);
          await capture?.(name(`todo-list-${status}`), cell);
          results.push({ name: name(`todo-list-${status}`), anatomy });
        }
        const tree = await page.$$eval('[data-component="tree-view"] details', (branches) =>
          branches.map((branch) => ({
            summaries: branch.querySelectorAll(':scope > summary').length,
            text: branch.querySelector(':scope > summary')?.textContent.trim()
          }))
        );
        assert(
          tree.length > 0 && tree.every((branch) => branch.summaries === 1 && branch.text),
          'Every retained tree ancestor keeps its own summary'
        );
        const handle =
          '[data-component="resizable"] .matrix-cell[data-state-name="resize handle · disabled: on"] .resizable-handle';
        const [staticDisabled] = await record(name('resizable-static-disabled'), handle);
        assert.equal(
          staticDisabled.color,
          forced ? staticDisabled.roles.gray : staticDisabled.roles.disabled
        );
        assert.equal(
          staticDisabled.image,
          'none',
          'Static disabled divider uses disabled surface, not enabled gradient'
        );
        assert(staticDisabled.width > 0 && staticDisabled.height > 0);
        assert.equal(
          await page.$eval(handle, (el) => el.closest('.resizable').hasAttribute('data-init')),
          false,
          'Inert markup does not invent readiness'
        );
        assert.equal(
          await page.$eval(handle, (el) => getComputedStyle(el, '::after').borderBlockStartColor),
          staticDisabled.color,
          'Divider grip uses the disabled icon role'
        );
      }
  } finally {
    await media([]);
    await cdp?.detach();
  }
  return results;
}
