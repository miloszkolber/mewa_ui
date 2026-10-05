import assert from 'node:assert/strict';

// Reuse the caller's server/browser; exercise native pointer and keyboard activation.
export async function inspectTablePagination(page, baseUrl, options = {}) {
  const { source = false, capture } = options;
  const results = [];
  for (const theme of options.themes || ['light', 'dark']) {
    await page.goto(`${baseUrl}/blank`);
    await page.evaluate(
      async ({ theme, source }) => {
        const { createController } = await import(
          source ? '/library/runtime/core.js' : '/dist/mewa-ui/index.js'
        );
        const { behavior } = await import(
          source
            ? '/library/components/data-display/data-table/data-table.js'
            : '/dist/mewa-ui/components/data-table.js'
        );
        document.documentElement.classList.toggle('dark', theme === 'dark');
        await Promise.all(
          [
            '/library/src/base.css',
            '/library/src/tokens.css',
            // Match the generated documentation's component cascade order.
            '/library/components/data-display/data-table/data-table.css',
            '/library/components/navigation/pagination/pagination.css'
          ].map(
            (href) =>
              new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.onload = resolve;
                link.onerror = () => reject(new Error(`Could not load ${href}`));
                document.head.append(link);
              })
          )
        );
        document.body.innerHTML = `<section class="data-table" data-page-size="3">
          <form><label for="pagination-filter">Filter projects</label><input id="pagination-filter" data-table-filter></form>
          <p data-table-status data-plural="projects" data-singular="project">5 projects</p>
          <table><caption>Projects</caption><tbody>
            <tr><td>Atlas</td></tr><tr><td>Beacon</td></tr><tr><td>Cinder</td></tr>
            <tr><td>Delta</td></tr><tr><td>Ember</td></tr>
          </tbody></table><p data-table-range data-range-label="projects">Authored range</p>
          <nav class="pagination data-table-pagination" data-table-pagination aria-label="Project pages">
            <ul class="pagination-list">
              <li><a class="pagination-prev data-table-pagination-link" data-table-page="previous" href="?page=1" aria-label="Previous page">Previous</a></li>
              <li><a class="pagination-link data-table-pagination-link authored-page pagination-active" data-table-page="1" href="?page=1" aria-current="page">1</a></li>
              <li><a class="pagination-link data-table-pagination-link" data-table-page="2" href="?page=2">2</a></li>
              <li><a class="pagination-next data-table-pagination-link" data-table-page="next" href="?page=2" aria-label="Next page">Next</a></li>
            </ul>
          </nav></section>`;
        const root = document.querySelector('.data-table');
        window.__pagination = { controller: createController(behavior, root), root, events: [] };
        root.addEventListener('data-table:page', (event) =>
          window.__pagination.events.push(event.detail.page)
        );
        await document.fonts.ready;
      },
      { theme, source }
    );
    const record = async (name, pageNumber, rows, range) => {
      const state = await page.evaluate(() => {
        const root = window.__pagination.root;
        const controls = [...root.querySelectorAll('[data-table-page]')].filter((control) =>
          /^\d+$/.test(control.dataset.tablePage)
        );
        return {
          controls: controls.map((control) => {
            const style = getComputedStyle(control);
            return {
              page: control.dataset.tablePage,
              current: control.getAttribute('aria-current'),
              legacy: control.classList.contains('pagination-active'),
              visible: control.checkVisibility(),
              weight: Number(style.fontWeight),
              border: style.borderColor,
              background: style.backgroundColor
            };
          }),
          rows: [...root.querySelector('tbody').rows]
            .filter((row) => !row.hidden)
            .map((row) => row.textContent.trim()),
          range: root.querySelector('[data-table-range]').textContent,
          events: window.__pagination.events.slice()
        };
      });
      await capture?.(`${source ? 'source' : 'packaged'}-${theme}-${name}`, '.data-table');
      const ariaCurrent = state.controls.filter((control) => control.current === 'page');
      // Current-page weight is independent of hover, focus and either theme's colors.
      const visualCurrent = state.controls.filter((control) => control.weight === 525);
      assert.deepEqual(
        ariaCurrent.map((control) => control.page),
        [pageNumber],
        `${name}: ARIA`
      );
      assert.deepEqual(
        visualCurrent.map((control) => control.page),
        [pageNumber],
        `${name}: exactly one visual current page agrees with ARIA`
      );
      assert.equal(ariaCurrent[0].visible, true, `${name}: current control is visible`);
      assert.deepEqual(state.rows, rows, `${name}: visible rows`);
      assert.equal(state.range, range, `${name}: range`);
      results.push({ theme, source, name, ...state });
    };
    try {
      await record('initial', '1', ['Atlas', 'Beacon', 'Cinder'], 'Showing 1–3 of 5 projects');
      await page.click('[data-table-page="next"]');
      await record('next', '2', ['Delta', 'Ember'], 'Showing 4–5 of 5 projects');
      await page.click('[data-table-page="previous"]');
      await record('previous', '1', ['Atlas', 'Beacon', 'Cinder'], 'Showing 1–3 of 5 projects');
      await page.focus('[data-table-page="2"]');
      await page.keyboard.press('Enter');
      await record('numbered-keyboard', '2', ['Delta', 'Ember'], 'Showing 4–5 of 5 projects');
      await page.type('#pagination-filter', 'Delta');
      await record('filter', '1', ['Delta'], 'Showing 1–1 of 1 projects');
      assert.equal(
        await page.$eval('[data-table-page="2"]', (control) => control.checkVisibility()),
        false,
        'filter hides the now-unavailable numbered page'
      );
      await page.evaluate(() => {
        const state = window.__pagination;
        state.root.querySelector('[data-table-filter]').value = '';
        state.root
          .querySelector('[data-table-filter]')
          .dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.click('[data-table-page="2"]');
      await record('numbered-pointer', '2', ['Delta', 'Ember'], 'Showing 4–5 of 5 projects');
      await page.evaluate(() => {
        const state = window.__pagination;
        [...state.root.querySelector('tbody').rows].slice(3).forEach((row) => row.remove());
        state.controller.update();
      });
      await record('clamp', '1', ['Atlas', 'Beacon', 'Cinder'], 'Showing 1–3 of 3 projects');
      assert.deepEqual(results.at(-1).events, [2, 1, 2, 2], 'one page event per activation');
    } finally {
      await page.evaluate(() => {
        window.__pagination.controller.destroy();
        delete window.__pagination;
      });
    }
  }
  return results;
}
