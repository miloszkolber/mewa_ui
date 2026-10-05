import * as image from '../library/components/data-display/image/image.js';
import * as table from '../library/components/data-display/data-table/data-table.js';
import * as tree from '../library/components/data-display/tree-view/tree-view.js';
import * as sortable from '../library/components/data-display/sortable/sortable.js';
import * as resizable from '../library/components/application/resizable/resizable.js';
import * as otp from '../library/components/forms/input-otp/input-otp.js';
import { createController } from '../library/runtime/core.js';

// Run against source controllers in a real browser; no distribution rebuild is required.
export async function runContentOwnership() {
  const results = [];
  const equal = (actual, expected, message) => {
    if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
  };
  const key = (target, value, extra = {}) => {
    const event = new KeyboardEvent('keydown', {
      key: value,
      bubbles: true,
      cancelable: true,
      ...extra
    });
    target.dispatchEvent(event);
    return event;
  };
  const input = (target) => target.dispatchEvent(new Event('input', { bubbles: true }));
  const task = () => new Promise((resolve) => setTimeout(resolve, 0));
  const test = async (name, html, module, check, prepare) => {
    const fixture = document.createElement('div');
    fixture.innerHTML = html;
    document.body.append(fixture);
    let controller;
    const mount = () => {
      controller = createController(module.behavior, fixture);
      controller.update();
    };
    try {
      const authored = prepare?.(fixture);
      mount();
      await check(
        fixture,
        {
          destroy: () => controller.destroy(),
          update: () => controller.update(),
          remount: mount
        },
        authored
      );
      results.push({ name, passed: true, error: null });
    } catch (error) {
      results.push({ name, passed: false, error: error.message });
    } finally {
      controller?.destroy();
      fixture.remove();
    }
  };
  const imageMarkup = `<figure class="image" data-preview><img alt="Topology" width="1" height="1"
    src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221%22 height=%221%22/%3E"></figure>`;
  await test(
    'image teardown removes generated preview semantics and remount works',
    imageMarkup,
    image,
    async (fixture, lifecycle) => {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = '/library/components/data-display/image/image.css';
      const loaded = new Promise((resolve, reject) => {
        stylesheet.onload = resolve;
        stylesheet.onerror = () => reject(new Error('Image stylesheet failed to load'));
      });
      document.head.append(stylesheet);
      try {
        await loaded;
        const figure = fixture.querySelector('figure');
        equal(getComputedStyle(figure).cursor, 'zoom-in', 'enhanced preview has a zoom affordance');
        await fixture.querySelector('img').decode();
        figure.focus();
        key(figure, 'Enter');
        const dialog = document.querySelector('.image-lightbox');
        equal(dialog.open, true, 'keyboard preview opens');
        dialog.close();
        lifecycle.destroy();
        equal(figure.getAttribute('role'), null, 'native figure role restored');
        equal(figure.getAttribute('tabindex'), null, 'dead preview tab stop removed');
        equal(figure.getAttribute('aria-label'), null, 'generated action name removed');
        equal(
          getComputedStyle(figure).cursor,
          'auto',
          'native fallback has no dead zoom affordance'
        );
        key(figure, 'Enter');
        equal(dialog.open, false, 'destroyed preview has no keyboard handler');
        lifecycle.remount();
        key(figure, ' ');
        equal(dialog.open, true, 'remount restores keyboard preview');
        dialog.close();
      } finally {
        stylesheet.remove();
      }
    }
  );
  await test(
    'image teardown preserves application semantics',
    imageMarkup.replace('<figure ', '<figure role="img" tabindex="-1" aria-label="Authored" '),
    image,
    async (fixture, lifecycle) => {
      const figure = fixture.querySelector('figure');
      lifecycle.destroy();
      equal(figure.getAttribute('role'), 'img', 'authored image role restored');
      equal(figure.getAttribute('tabindex'), '-1', 'authored image tab stop restored');
      equal(figure.getAttribute('aria-label'), 'Authored', 'authored image name retained');
      lifecycle.remount();
      figure.setAttribute('role', 'group');
      figure.setAttribute('tabindex', '-2');
      figure.setAttribute('aria-label', 'Application');
      lifecycle.destroy();
      equal(figure.getAttribute('role'), 'group', 'application role survives');
      equal(figure.getAttribute('tabindex'), '-2', 'application tab stop survives');
      equal(figure.getAttribute('aria-label'), 'Application', 'application name survives');
    }
  );

  const tableMarkup = `<section class="data-table" data-page-size="1">
    <form method="get"><label>Filter <input name="q" data-table-filter></label></form>
    <p data-table-status>Authored status</p><p data-table-range>Authored range</p>
    <p data-table-empty hidden>No matches</p>
    <table><thead><tr><th><button type="button" data-table-sort aria-label="Name">Name</button></th></tr></thead>
      <tbody><tr id="content-alpha"><td>Alpha <input name="selected" value="alpha" type="checkbox"></td></tr>
        <tr id="content-beta"><td>Beta</td></tr><tr id="content-private" hidden><td>Private</td></tr></tbody></table>
    <nav data-table-pagination><a href="?page=previous" data-table-page="previous">Previous</a>
      <a href="?page=1" data-table-page="1" aria-current="page">1</a>
      <a href="?page=2" data-table-page="2">2</a><a href="?page=3" data-table-page="3">3</a>
      <button type="button" data-table-page="next">Next</button></nav></section>`;
  await test(
    'data table teardown restores native unfiltered reading without undoing user state',
    tableMarkup,
    table,
    async (fixture, lifecycle, authored) => {
      const filter = fixture.querySelector('[data-table-filter]');
      const alpha = fixture.querySelector('#content-alpha');
      const beta = fixture.querySelector('#content-beta');
      const privateRow = fixture.querySelector('#content-private');
      const selected = alpha.querySelector('input');
      selected.checked = true;
      fixture.querySelector('[data-table-sort]').click();
      fixture.querySelector('[data-table-sort]').click();
      const order = [...fixture.querySelector('tbody').rows];
      filter.value = 'Alpha';
      input(filter);
      equal(beta.hidden, true, 'module filters Beta');
      lifecycle.destroy();
      filter.value = '';
      input(filter);
      equal(alpha.hidden, false, 'Alpha remains readable');
      equal(beta.hidden, false, 'Beta is readable after destroy');
      equal(beta.checkVisibility(), true, 'restored row is rendered');
      equal(privateRow.hidden, true, 'authored hidden row remains hidden');
      equal(
        fixture.querySelector('[data-table-status]').textContent,
        'Authored status',
        'status baseline restored'
      );
      equal(
        fixture.querySelector('[data-table-status]').firstChild,
        authored.status,
        'untouched authored status node identity restored'
      );
      equal(
        fixture.querySelector('[data-table-status]').getAttribute('role'),
        null,
        'generated live semantics removed'
      );
      equal(
        fixture.querySelector('[data-table-range]').textContent,
        'Authored range',
        'range baseline restored'
      );
      equal(
        fixture.querySelector('[data-table-range]').firstChild,
        authored.range,
        'untouched authored range node identity restored'
      );
      equal(fixture.querySelector('[data-table-empty]').hidden, true, 'empty fallback restored');
      equal(
        fixture.querySelector('[data-table-page="previous"]').hasAttribute('aria-disabled'),
        false,
        'server pagination link enabled'
      );
      equal(
        fixture.querySelector('[data-table-page="previous"]').hasAttribute('tabindex'),
        false,
        'native link tab stop restored'
      );
      equal(
        fixture.querySelector('[data-table-page="3"]').parentElement.hidden,
        false,
        'out-of-range fallback restored'
      );
      equal(selected.checked, true, 'user selection retained');
      equal(
        [...fixture.querySelector('tbody').rows].every((row, index) => row === order[index]),
        true,
        'current user row order retained'
      );
      equal(
        fixture.querySelector('th').getAttribute('aria-sort'),
        'descending',
        'current meaningful sort retained'
      );
      equal(
        fixture.querySelector('[data-table-sort]').getAttribute('aria-label'),
        'Name',
        'generated sort instructions removed'
      );
      let submitted = false;
      const form = fixture.querySelector('form');
      form.addEventListener('submit', (event) => {
        submitted = true;
        event.preventDefault();
      });
      form.requestSubmit();
      equal(submitted, true, 'native filter submission remains available');
      equal(new FormData(form).get('q'), '', 'native filter value submits');
      lifecycle.remount();
      filter.value = 'Beta';
      input(filter);
      equal(alpha.hidden, true, 'remounted filtering works');
      equal(beta.hidden, false, 'remounted result visible');
      equal(privateRow.hidden, true, 'remount keeps authored hidden state');
    },
    (fixture) => ({
      status: fixture.querySelector('[data-table-status]').firstChild,
      range: fixture.querySelector('[data-table-range]').firstChild
    })
  );
  await test(
    'data table respects authored and current application visibility and output',
    tableMarkup,
    table,
    async (fixture, lifecycle) => {
      const privateRow = fixture.querySelector('#content-private');
      equal(privateRow.hidden, true, 'enhancement does not expose authored hidden content');
      fixture.querySelector('#content-alpha').setAttribute('hidden', 'application');
      privateRow.removeAttribute('hidden');
      lifecycle.update();
      equal(
        fixture.querySelector('[data-table-status]').textContent,
        '2 results',
        'application visibility affects count'
      );
      const summary = fixture.querySelector('[data-table-status]');
      summary.textContent = 'Application status';
      summary.setAttribute('role', 'note');
      fixture.querySelector('[data-table-range]').textContent = 'Application range';
      fixture.querySelector('[data-table-page="previous"]').setAttribute('tabindex', '-2');
      lifecycle.destroy();
      equal(
        fixture.querySelector('#content-alpha').getAttribute('hidden'),
        'application',
        'application hidden value retained after update'
      );
      equal(privateRow.hidden, false, 'application unhide retained after update');
      equal(summary.textContent, 'Application status', 'application status survives');
      equal(summary.getAttribute('role'), 'note', 'application semantics survive');
      equal(
        fixture.querySelector('[data-table-range]').textContent,
        'Application range',
        'application range survives'
      );
      equal(
        fixture.querySelector('[data-table-page="previous"]').getAttribute('tabindex'),
        '-2',
        'application link semantics survive'
      );
    }
  );

  const legacyPaginationMarkup = tableMarkup
    .replace(
      '<a href="?page=1"',
      '<a class="pagination-link authored-one pagination-active" href="?page=1"'
    )
    .replace('<a href="?page=2"', '<a class="pagination-link authored-two" href="?page=2"');
  await test(
    'data table derives one current presentation from ARIA despite an authored legacy class',
    legacyPaginationMarkup,
    table,
    async (fixture, lifecycle) => {
      const current = (page) => {
        const presented = fixture.querySelectorAll(
          '[data-table-page][aria-current="page"], [data-table-page].pagination-active'
        );
        equal(presented.length, 1, 'one control has current presentation');
        equal(presented[0].dataset.tablePage, page, 'presentation follows the current page');
        equal(presented[0].getAttribute('aria-current'), 'page', 'visual state agrees with ARIA');
      };
      current('1');
      fixture.querySelector('[data-table-page="next"]').click();
      current('2');
      fixture.querySelector('[data-table-page="previous"]').click();
      current('1');
      fixture.querySelector('[data-table-page="2"]').click();
      current('2');
      const filter = fixture.querySelector('[data-table-filter]');
      filter.value = 'Beta';
      input(filter);
      current('1');
      equal(fixture.querySelector('[data-table-page="2"]').hidden, true, 'filter hides page two');
      filter.value = '';
      input(filter);
      fixture.querySelector('[data-table-page="2"]').click();
      fixture.querySelector('#content-beta').remove();
      lifecycle.update();
      current('1');
      equal(fixture.querySelector('[data-table-page="2"]').hidden, true, 'row removal clamps page');
    }
  );
  await test(
    'data table restores only the legacy pagination token across class edits and remount',
    legacyPaginationMarkup,
    table,
    async (fixture, lifecycle) => {
      const first = fixture.querySelector('[data-table-page="1"]');
      const second = fixture.querySelector('[data-table-page="2"]');
      equal(first.classList.contains('pagination-active'), false, 'managed state uses ARIA only');
      first.classList.remove('authored-one');
      first.classList.add('application-one');
      second.classList.add('application-two');
      fixture.querySelector('[data-table-page="next"]').click();
      lifecycle.update();
      lifecycle.destroy();
      lifecycle.destroy();
      equal(first.classList.contains('pagination-active'), true, 'authored token restored');
      equal(first.classList.contains('authored-one'), false, 'application token removal retained');
      equal(
        first.classList.contains('application-one'),
        true,
        'application token addition retained'
      );
      equal(first.classList.contains('pagination-link'), true, 'unrelated baseline token retained');
      equal(second.classList.contains('pagination-active'), false, 'no legacy token generated');
      equal(second.classList.contains('application-two'), true, 'other control tokens retained');
      equal(
        fixture.querySelector('[data-table-page="3"]').getAttribute('class'),
        null,
        'untouched controls acquire no class attribute'
      );
      lifecycle.remount();
      equal(
        first.classList.contains('pagination-active'),
        false,
        'remount releases legacy styling'
      );
      fixture.querySelector('[data-table-page="next"]').click();
      equal(second.getAttribute('aria-current'), 'page', 'remounted pagination still works');
      lifecycle.destroy();
      equal(first.classList.contains('pagination-active'), true, 'remount restores its token');
      equal(first.classList.contains('application-one'), true, 'remount keeps application classes');
    }
  );
  await test(
    'data table adopts an application legacy pagination token before its next render',
    tableMarkup,
    table,
    async (fixture, lifecycle) => {
      const first = fixture.querySelector('[data-table-page="1"]');
      first.className = 'application-page pagination-active';
      lifecycle.update();
      equal(
        first.classList.contains('pagination-active'),
        false,
        'update uses native current state'
      );
      first.classList.add('application-extra');
      lifecycle.destroy();
      equal(first.classList.contains('pagination-active'), true, 'application baseline restored');
      equal(first.classList.contains('application-page'), true, 'application class retained');
      equal(first.classList.contains('application-extra'), true, 'later unrelated class retained');
    }
  );
  for (const clear of ['remove attribute', 'empty attribute']) {
    for (const update of [false, true]) {
      await test(
        `data table preserves application pagination class ${clear} ${update ? 'through update' : 'at teardown'}`,
        legacyPaginationMarkup,
        table,
        async (fixture, lifecycle) => {
          const first = fixture.querySelector('[data-table-page="1"]');
          if (clear === 'remove attribute') first.removeAttribute('class');
          else first.className = '';
          const value = first.getAttribute('class');
          if (update) lifecycle.update();
          lifecycle.destroy();
          equal(
            first.getAttribute('class'),
            value,
            'application clear survives without resurrection'
          );
          lifecycle.remount();
          lifecycle.destroy();
          equal(first.getAttribute('class'), value, 'remount does not reclaim cleared classes');
        }
      );
    }
  }
  await test(
    'data table leaves native pagination classes alone without client page size',
    legacyPaginationMarkup.replace(' data-page-size="1"', ''),
    table,
    async (fixture, lifecycle) => {
      const first = fixture.querySelector('[data-table-page="1"]');
      const authored = first.getAttribute('class');
      lifecycle.update();
      equal(first.getAttribute('class'), authored, 'native legacy presentation remains intact');
      equal(first.getAttribute('aria-current'), 'page', 'native current page remains intact');
      lifecycle.destroy();
      equal(first.getAttribute('class'), authored, 'native classes are not owned at cleanup');
    }
  );
  await test(
    'data table restores a legacy pagination class when it was the only authored token',
    legacyPaginationMarkup.replace(
      'pagination-link authored-one pagination-active',
      'pagination-active'
    ),
    table,
    async (fixture, lifecycle) => {
      const first = fixture.querySelector('[data-table-page="1"]');
      equal(first.getAttribute('class'), '', 'managed removal can leave an empty class attribute');
      lifecycle.update();
      lifecycle.destroy();
      equal(
        first.getAttribute('class'),
        'pagination-active',
        'owned empty value restores baseline'
      );
    }
  );

  const resetMarkup = tableMarkup.replace(
    '<input name="q" data-table-filter></label></form>',
    `<input name="q" data-table-filter value="Alpha"></label>
      <label><input type="checkbox" name="include" checked>Include</label>
      <label>Scope <select name="scope"><option value="all" selected>All</option><option value="changed">Changed</option></select></label>
      <button type="reset" data-table-clear>Clear</button></form>`
  );
  await test(
    'data table native Clear honors canceled reset without changing draft, output or pagination',
    resetMarkup,
    table,
    async (fixture) => {
      const root = fixture.querySelector('.data-table');
      const filter = fixture.querySelector('[data-table-filter]');
      const checkbox = fixture.querySelector('[name="include"]');
      const select = fixture.querySelector('select');
      filter.value = 'a';
      checkbox.checked = false;
      select.value = 'changed';
      input(filter);
      fixture.querySelector('[data-table-page="2"]').click();
      const summary = fixture.querySelector('[data-table-status]');
      const output = summary.firstChild;
      const rows = [...fixture.querySelector('tbody').rows];
      const visibility = rows.map((row) => row.hidden);
      let resets = 0;
      let filterEvents = 0;
      let clickPrevented = null;
      let resetDraft = null;
      let resetOutput = null;
      root.addEventListener('data-table:filter', () => filterEvents++);
      // Register after enhancement on the same target to cover a later canceler.
      root.addEventListener('reset', (event) => {
        resets++;
        resetDraft = filter.value;
        resetOutput = summary.firstChild;
        event.preventDefault();
      });
      root.addEventListener('click', (event) => {
        if (event.target.matches('[data-table-clear]')) clickPrevented = event.defaultPrevented;
      });
      fixture.querySelector('[data-table-clear]').click();
      await task();
      equal(clickPrevented, false, 'module does not cancel native reset-button activation');
      equal(resets, 1, 'one cancelable native reset event reaches the application');
      equal(resetDraft, 'a', 'reset listener sees the unmodified draft');
      equal(resetOutput, output, 'reset listener runs before client output changes');
      equal(filter.value, 'a', 'canceled reset preserves the filter draft');
      equal(checkbox.checked, false, 'canceled reset preserves other checkbox state');
      equal(select.value, 'changed', 'canceled reset preserves other select state');
      equal(summary.firstChild, output, 'canceled reset preserves output node identity');
      equal(filterEvents, 0, 'canceled reset does not publish a filter update');
      equal(
        fixture.querySelector('[data-table-page="2"]').getAttribute('aria-current'),
        'page',
        'canceled reset preserves the current client page'
      );
      rows.forEach((row, index) =>
        equal(row.hidden, visibility[index], 'canceled reset preserves row visibility')
      );
    }
  );
  for (const resetDefault of ['Alpha', 'Beta']) {
    await test(
      `data table native Clear uses ${resetDefault === 'Alpha' ? 'authored' : 'application-updated'} defaults and refreshes after reset listeners`,
      resetMarkup,
      table,
      async (fixture, lifecycle) => {
        const root = fixture.querySelector('.data-table');
        const filter = fixture.querySelector('[data-table-filter]');
        const checkbox = fixture.querySelector('[name="include"]');
        const select = fixture.querySelector('select');
        const summary = fixture.querySelector('[data-table-status]');
        filter.value = 'a';
        filter.defaultValue = resetDefault;
        checkbox.checked = false;
        select.value = 'changed';
        input(filter);
        fixture.querySelector('[data-table-page="2"]').click();
        const output = summary.firstChild;
        const order = [];
        let resetDraft = null;
        let resetOutput = null;
        let resetCheckbox = null;
        let resetSelect = null;
        let query = null;
        root.addEventListener('reset', () => {
          order.push('reset');
          resetDraft = filter.value;
          resetOutput = summary.firstChild;
          resetCheckbox = checkbox.checked;
          resetSelect = select.value;
        });
        root.addEventListener('data-table:filter', (event) => {
          order.push('filter');
          query = event.detail.query;
        });
        fixture.querySelector('[data-table-clear]').click();
        await task();
        equal(resetDraft, 'a', 'native reset listener sees the draft before the default action');
        equal(resetOutput, output, 'reset listeners run before client output changes');
        equal(resetCheckbox, false, 'reset listeners see current native checkbox state');
        equal(resetSelect, 'changed', 'reset listeners see current native select state');
        equal(order.join(','), 'reset,filter', 'one client update follows the native reset event');
        equal(filter.value, resetDefault, 'browser restores the current native defaultValue');
        equal(checkbox.checked, true, 'browser resets non-filter checkbox controls too');
        equal(select.value, 'all', 'browser resets non-filter select controls too');
        equal(query, resetDefault, 'client filtering reads the post-default-action value');
        equal(summary.textContent, '1 result', 'client status matches the reset default');
        equal(
          fixture.querySelector('[data-table-page="1"]').getAttribute('aria-current'),
          'page',
          'successful reset returns to the first client page'
        );
        equal(
          fixture.querySelector('#content-alpha').hidden,
          resetDefault !== 'Alpha',
          'Alpha follows reset filter'
        );
        equal(
          fixture.querySelector('#content-beta').hidden,
          resetDefault !== 'Beta',
          'Beta follows reset filter'
        );
        equal(
          fixture.querySelector('#content-private').hidden,
          true,
          'application-hidden row stays hidden'
        );
        equal(
          fixture.querySelector('[data-table-filter]'),
          filter,
          'native filter node identity retained'
        );
        lifecycle.destroy();
        lifecycle.destroy();
        lifecycle.remount();
        filter.value = 'a';
        input(filter);
        order.length = 0;
        fixture.querySelector('[data-table-clear]').click();
        await task();
        equal(order.join(','), 'reset,filter', 'remount owns one post-reset update');
        equal(query, resetDefault, 'remount still uses current defaults');
      }
    );
  }

  const outputMarkup = `<section class="data-table"><form method="get"><label>Filter <input name="q" data-table-filter></label></form>
    <p data-table-status><span data-authored-status>Authored status</span></p><p data-table-range><span data-authored-range>Authored range</span></p>
    <table><tbody><tr><td>Alpha</td></tr></tbody></table></section>`;
  const outputNodes = (fixture) => [
    fixture.querySelector('[data-authored-status]'),
    fixture.querySelector('[data-authored-range]')
  ];
  for (const change of [
    'same-text span replacement',
    'same-markup text replacement',
    'output text edit'
  ]) {
    await test(
      `data table preserves application ${change} in status and range outputs`,
      outputMarkup,
      table,
      async (fixture, lifecycle) => {
        const replacements = [];
        for (const output of fixture.querySelectorAll('[data-table-status], [data-table-range]')) {
          const text = change === 'output text edit' ? 'Application output' : output.textContent;
          const replacement =
            change === 'output text edit'
              ? output.firstChild
              : change === 'same-markup text replacement'
                ? output.firstChild.cloneNode(true)
                : document.createElement('span');
          replacement.textContent = text;
          if (change !== 'output text edit') output.replaceChildren(replacement);
          replacements.push({ output, replacement, text });
        }
        if (change !== 'output text edit')
          equal(replacements[0].text, '1 result', 'one-row result-count boundary');
        lifecycle.destroy();
        lifecycle.destroy();
        for (const { output, replacement, text } of replacements) {
          equal(output.firstChild, replacement, 'same-content application node identity retained');
          equal(replacement.parentNode, output, 'application replacement parent retained');
          equal(output.textContent, text, 'application replacement text retained');
        }
      }
    );
  }
  for (const text of ['', 'Application sibling']) {
    await test(
      `data table restores only owned output beside ${text ? 'nonempty' : 'empty'} application siblings`,
      outputMarkup,
      table,
      async (fixture, lifecycle, authored) => {
        const outputs = [...fixture.querySelectorAll('[data-table-status], [data-table-range]')];
        const insertions = outputs.map((output) => {
          const before = document.createElement('span');
          const after = document.createElement('span');
          before.textContent = text;
          after.textContent = text;
          output.prepend(before);
          output.append(after);
          return { before, after };
        });
        lifecycle.destroy();
        lifecycle.destroy();
        outputs.forEach((output, index) => {
          const { before, after } = insertions[index];
          equal(output.childNodes.length, 3, 'only owned generated text is replaced');
          equal(output.childNodes[0], before, 'application prefix identity retained');
          equal(output.childNodes[1], authored[index], 'authored baseline identity restored');
          equal(output.childNodes[2], after, 'application suffix identity retained');
          equal(before.parentNode, output, 'application prefix parent retained');
          equal(after.parentNode, output, 'application suffix parent retained');
        });
      },
      outputNodes
    );
  }
  for (const destination of ['application region', 'document fragment']) {
    await test(
      `data table does not reclaim authored status or range nodes reused in ${destination}`,
      outputMarkup
        .replace(
          '</p><p data-table-range>',
          '<span data-detached-status>Detached status</span></p><p data-table-range>'
        )
        .replace(
          '</p>\n    <table>',
          '<span data-detached-range>Detached range</span></p>\n    <table>'
        ) + '<section data-application></section>',
      table,
      async (fixture, lifecycle, authored) => {
        const parent =
          destination === 'document fragment'
            ? document.createDocumentFragment()
            : fixture.querySelector('[data-application]');
        parent.append(...authored.reused);
        lifecycle.destroy();
        lifecycle.destroy();
        const assertReusedNodes = () => {
          for (const node of authored.reused) {
            equal(node.parentNode, parent, 'application keeps reused output parent');
            equal(parent.contains(node), true, 'same authored output node retained externally');
          }
        };
        assertReusedNodes();
        const outputs = [...fixture.querySelectorAll('[data-table-status], [data-table-range]')];
        outputs.forEach((output, index) => {
          equal(output.childNodes.length, 1, 'only detached output baseline returns');
          equal(output.firstChild, authored.detached[index], 'detached baseline identity restored');
        });
        lifecycle.remount();
        const filter = fixture.querySelector('[data-table-filter]');
        filter.value = 'missing';
        input(filter);
        equal(outputs[0].textContent, '0 results', 'remounted filtering still works');
        lifecycle.destroy();
        assertReusedNodes();
        outputs.forEach((output, index) =>
          equal(output.firstChild, authored.detached[index], 'remount restores remaining baseline')
        );
      },
      (fixture) => ({
        reused: outputNodes(fixture),
        detached: [
          fixture.querySelector('[data-detached-status]'),
          fixture.querySelector('[data-detached-range]')
        ]
      })
    );
  }

  const treeMarkup = `<ul class="tree" role="tree" aria-label="Files"><li class="tree-item">
    <details class="tree-branch" open><summary class="tree-branch-trigger" role="treeitem" aria-expanded="true">Source</summary>
      <ul role="group"><li class="tree-item" aria-selected="true"><span class="tree-leaf" role="treeitem">Leaf</span></li></ul></details></li>
    <li class="tree-item"><a class="tree-leaf" href="#native-leaf" role="treeitem" tabindex="0">Native link</a></li></ul>`;
  await test(
    'tree teardown restores authored roles and native focus without resetting selection',
    treeMarkup,
    tree,
    async (fixture, lifecycle) => {
      const summary = fixture.querySelector('summary');
      const leaf = fixture.querySelector('span.tree-leaf');
      const link = fixture.querySelector('a');
      summary.focus();
      key(summary, 'ArrowDown');
      equal(document.activeElement, leaf, 'tree keyboard movement works');
      lifecycle.destroy();
      equal(summary.getAttribute('role'), 'treeitem', 'authored control role restored');
      equal(summary.getAttribute('aria-expanded'), 'true', 'authored control state restored');
      equal(summary.getAttribute('tabindex'), null, 'native summary focus restored');
      equal(leaf.getAttribute('tabindex'), null, 'generated leaf tab stop removed');
      equal(leaf.getAttribute('role'), 'treeitem', 'authored leaf role restored');
      equal(
        fixture.querySelector('li').getAttribute('role'),
        null,
        'generated list-item role removed'
      );
      equal(leaf.parentElement.getAttribute('aria-selected'), 'true', 'current selection retained');
      equal(link.getAttribute('tabindex'), '0', 'authored link tab stop restored');
      fixture.querySelector('details').open = false;
      equal(fixture.querySelector('details').open, false, 'native disclosure still operates');
      lifecycle.remount();
      summary.focus();
      key(summary, 'ArrowDown');
      equal(document.activeElement, link, 'remounted navigation skips closed descendants');
    }
  );
  await test(
    'tree teardown preserves application role, state and tab stop edits',
    treeMarkup,
    tree,
    async (fixture, lifecycle) => {
      const summary = fixture.querySelector('summary');
      const leaf = fixture.querySelector('span.tree-leaf');
      const listItem = fixture.querySelector('li');
      listItem.setAttribute('role', 'none');
      listItem.setAttribute('aria-expanded', 'mixed');
      summary.setAttribute('role', 'button');
      summary.setAttribute('aria-expanded', 'false');
      leaf.setAttribute('tabindex', '-2');
      lifecycle.destroy();
      equal(listItem.getAttribute('role'), 'none', 'application list role survives');
      equal(listItem.getAttribute('aria-expanded'), 'mixed', 'application list state survives');
      equal(summary.getAttribute('role'), 'button', 'application control role survives');
      equal(summary.getAttribute('aria-expanded'), 'false', 'application control state survives');
      equal(leaf.getAttribute('tabindex'), '-2', 'application tab stop survives');
    }
  );
  await test(
    'tree teardown keeps authored expansion semantics aligned with current native disclosure',
    treeMarkup
      .replace('open><summary', '><summary')
      .replace('aria-expanded="true"', 'aria-expanded="false"'),
    tree,
    async (fixture, lifecycle) => {
      const details = fixture.querySelector('details');
      const summary = fixture.querySelector('summary');
      summary.focus();
      key(summary, 'ArrowRight');
      equal(details.open, true, 'keyboard opens native disclosure');
      lifecycle.destroy();
      equal(details.open, true, 'destroy keeps current native disclosure');
      equal(
        summary.getAttribute('aria-expanded'),
        'true',
        'authored expansion state follows current disclosure'
      );
      equal(
        summary.parentElement.parentElement.hasAttribute('aria-expanded'),
        false,
        'generated relocated state removed'
      );
    }
  );
  await test(
    'an initially empty tree can enhance inserted controls',
    '<ul class="tree" role="tree" aria-label="Files"></ul>',
    tree,
    async (fixture, lifecycle) => {
      const list = fixture.querySelector('ul');
      equal(
        list.hasAttribute('data-mewa-tree-view-init'),
        false,
        'empty tree is not reported ready'
      );
      list.innerHTML =
        '<li class="tree-item"><span class="tree-leaf">First</span></li><li class="tree-item"><span class="tree-leaf">Second</span></li>';
      lifecycle.update();
      const [first, second] = list.querySelectorAll('.tree-leaf');
      first.focus();
      key(first, 'ArrowDown');
      equal(document.activeElement, second, 'inserted controls receive keyboard behavior');
      lifecycle.destroy();
      equal(first.hasAttribute('tabindex'), false, 'inserted generated tab stop removed');
      equal(second.parentElement.hasAttribute('role'), false, 'inserted generated role removed');
    }
  );

  const sortableMarkup = `<ul class="sortable" aria-label="Priority"><li class="sortable-item">Alpha</li>
    <li class="sortable-item" tabindex="0">Beta</li><li class="sortable-item" aria-disabled="true">Fixed</li></ul>`;
  await test(
    'sortable teardown removes generated state but retains reordered data and authored controls',
    sortableMarkup,
    sortable,
    async (fixture, lifecycle) => {
      const list = fixture.querySelector('ul');
      const [alpha, beta] = list.children;
      alpha.focus();
      key(alpha, 'ArrowDown', { altKey: true });
      equal(list.firstElementChild, beta, 'keyboard reorder changes data order');
      lifecycle.destroy();
      equal(alpha.getAttribute('tabindex'), null, 'generated tabindex removed');
      equal(beta.getAttribute('tabindex'), '0', 'authored tabindex restored');
      equal(list.querySelector('[data-active]'), null, 'generated active state removed');
      equal(fixture.querySelector('.sortable-actions'), null, 'generated pointer controls removed');
      equal(fixture.querySelector('.sortable-live'), null, 'generated live region removed');
      equal(list.firstElementChild, beta, 'current meaningful order retained');
      lifecycle.remount();
      beta.focus();
      key(beta, 'ArrowDown', { altKey: true });
      equal(list.firstElementChild, alpha, 'remounted reorder works');
    }
  );
  await test(
    'sortable update reconciles newly disabled active focus and move controls',
    sortableMarkup,
    sortable,
    async (fixture, lifecycle) => {
      const [alpha, beta] = fixture.querySelector('ul').children;
      alpha.querySelector('[data-sortable-increase]').focus();
      alpha.setAttribute('aria-disabled', 'true');
      lifecycle.update();
      equal(alpha.tabIndex, -1, 'newly disabled item leaves tab order');
      equal(alpha.hasAttribute('data-active'), false, 'disabled item is not active');
      equal(beta.tabIndex, 0, 'enabled successor becomes reachable');
      equal(document.activeElement, beta, 'focus displaced from disabled controls');
      equal(
        [...alpha.querySelectorAll('button')].every((button) => button.disabled),
        true,
        'all disabled-item controls disabled'
      );
      const order = [...fixture.querySelector('ul').children];
      equal(
        key(alpha, 'ArrowDown', { altKey: true }).defaultPrevented,
        false,
        'disabled key target is not handled'
      );
      equal(
        [...fixture.querySelector('ul').children].every((item, index) => item === order[index]),
        true,
        'disabled key target cannot reorder a substitute'
      );
      alpha.setAttribute('tabindex', '-2');
      beta.setAttribute('data-active', 'application');
      lifecycle.destroy();
      equal(alpha.getAttribute('tabindex'), '-2', 'application tab stop survives');
      equal(beta.getAttribute('data-active'), 'application', 'application active state survives');
    }
  );
  await test(
    'sortable restores authored move controls and live status conditionally',
    `<ul class="sortable"><li class="sortable-item">Alpha
    <span class="sortable-actions"><button type="button" class="sortable-step" data-sortable-decrease aria-label="Earlier">Up</button>
      <button type="button" class="sortable-step" data-sortable-increase aria-label="Later">Down</button></span></li>
    <li class="sortable-item">Beta</li></ul><span class="sortable-live" role="status">Authored</span>`,
    sortable,
    async (fixture, lifecycle, authored) => {
      const previous = fixture.querySelector('[data-sortable-decrease]');
      const next = fixture.querySelector('[data-sortable-increase]');
      next.click();
      lifecycle.destroy();
      equal(previous.disabled, false, 'authored disabled baseline restored');
      equal(previous.getAttribute('aria-label'), 'Earlier', 'authored label restored');
      equal(next.getAttribute('aria-label'), 'Later', 'authored next label restored');
      equal(
        fixture.querySelector('.sortable-live').textContent,
        'Authored',
        'authored live text restored'
      );
      equal(
        fixture.querySelector('.sortable-live').firstChild,
        authored,
        'untouched authored live-node identity restored'
      );
      lifecycle.remount();
      previous.setAttribute('aria-label', 'Application move');
      fixture.querySelector('.sortable-live').textContent = 'Application announcement';
      lifecycle.destroy();
      equal(
        previous.getAttribute('aria-label'),
        'Application move',
        'application button name survives'
      );
      equal(
        fixture.querySelector('.sortable-live').textContent,
        'Application announcement',
        'application live text survives'
      );
    },
    (fixture) => fixture.querySelector('.sortable-live').firstChild
  );

  const liveMarkup = `${sortableMarkup}<span class="sortable-live" role="status"><span data-authored-live>Authored live content</span></span>`;
  for (const region of ['authored', 'generated']) {
    for (const change of [
      'same-text span replacement',
      'same-markup text replacement',
      'output text edit'
    ]) {
      await test(
        `sortable preserves application ${change} in its ${region} live region`,
        region === 'authored' ? liveMarkup : sortableMarkup,
        sortable,
        async (fixture, lifecycle) => {
          fixture.querySelector('[data-sortable-increase]').click();
          const live = fixture.querySelector('.sortable-live');
          equal(live.textContent.includes('moved to position 2'), true, 'a real reorder announces');
          const text =
            change === 'output text edit' ? 'Application announcement' : live.textContent;
          const replacement =
            change === 'output text edit'
              ? live.firstChild
              : change === 'same-markup text replacement'
                ? live.firstChild.cloneNode(true)
                : document.createElement('span');
          replacement.textContent = text;
          if (change !== 'output text edit') live.replaceChildren(replacement);
          lifecycle.destroy();
          lifecycle.destroy();
          equal(
            fixture.querySelector('.sortable-live'),
            live,
            'application-owned live region retained'
          );
          equal(live.firstChild, replacement, 'same-content application node identity retained');
          equal(replacement.parentNode, live, 'application replacement parent retained');
          equal(live.textContent, text, 'application replacement text retained');
        }
      );
    }
  }
  for (const region of ['authored', 'generated']) {
    for (const text of ['', 'Application sibling']) {
      await test(
        `sortable restores only owned announcement beside ${text ? 'nonempty' : 'empty'} application siblings in its ${region} live region`,
        region === 'authored' ? liveMarkup : sortableMarkup,
        sortable,
        async (fixture, lifecycle, authored) => {
          fixture.querySelector('[data-sortable-increase]').click();
          const live = fixture.querySelector('.sortable-live');
          const before = document.createElement('span');
          const after = document.createElement('span');
          before.textContent = text;
          after.textContent = text;
          live.prepend(before);
          live.append(after);
          const order = [...fixture.querySelector('ul').children];
          lifecycle.destroy();
          lifecycle.destroy();
          equal(
            fixture.querySelector('.sortable-live'),
            live,
            'application-owned live region retained'
          );
          equal(
            live.childNodes.length,
            region === 'authored' ? 3 : 2,
            'only owned announcement replaced'
          );
          equal(live.childNodes[0], before, 'application prefix identity retained');
          if (region === 'authored')
            equal(live.childNodes[1], authored, 'authored live baseline identity restored');
          equal(live.lastChild, after, 'application suffix identity retained');
          equal(before.parentNode, live, 'application prefix parent retained');
          equal(after.parentNode, live, 'application suffix parent retained');
          equal(
            [...fixture.querySelector('ul').children].every((item, index) => item === order[index]),
            true,
            'current meaningful order retained'
          );
        },
        (fixture) => fixture.querySelector('[data-authored-live]')
      );
    }
  }
  await test(
    'sortable preserves application content inserted into a generated region before any announcement',
    sortableMarkup,
    sortable,
    async (fixture, lifecycle) => {
      const live = fixture.querySelector('.sortable-live');
      const child = document.createElement('span');
      live.append(child);
      lifecycle.destroy();
      equal(
        fixture.querySelector('.sortable-live'),
        live,
        'application-owned live region retained'
      );
      equal(live.firstChild, child, 'application child identity retained');
      equal(child.parentNode, live, 'application child parent retained');
    }
  );
  for (const destination of ['application region', 'document fragment']) {
    await test(
      `sortable does not reclaim authored live nodes reused in ${destination}`,
      liveMarkup.replace(
        'Authored live content</span></span>',
        'Authored live content</span><span data-detached-live>Detached live content</span></span>'
      ) + '<section data-application></section>',
      sortable,
      async (fixture, lifecycle, authored) => {
        fixture.querySelector('[data-sortable-increase]').click();
        const live = fixture.querySelector('.sortable-live');
        const parent =
          destination === 'document fragment'
            ? document.createDocumentFragment()
            : fixture.querySelector('[data-application]');
        parent.append(authored.reused);
        lifecycle.destroy();
        lifecycle.destroy();
        const assertReusedNode = () => {
          equal(authored.reused.parentNode, parent, 'application keeps authored live-node parent');
          equal(
            parent.contains(authored.reused),
            true,
            'same authored live node retained externally'
          );
        };
        assertReusedNode();
        equal(live.childNodes.length, 1, 'only detached live baseline returns');
        equal(live.firstChild, authored.detached, 'detached live baseline identity restored');
        lifecycle.remount();
        const first = fixture.querySelector('.sortable-item');
        key(first, 'ArrowDown', { altKey: true });
        equal(
          live.textContent.includes('moved to position 2'),
          true,
          'remounted reorder announces'
        );
        lifecycle.destroy();
        assertReusedNode();
        equal(live.firstChild, authored.detached, 'remount restores remaining live baseline');
      },
      (fixture) => ({
        reused: fixture.querySelector('[data-authored-live]'),
        detached: fixture.querySelector('[data-detached-live]')
      })
    );
  }

  const resizeMarkup = `<section class="resizable"><div class="resizable-group" style="width:400px;display:flex">
    <div class="resizable-panel" style="flex-basis:100px;flex-grow:1;flex-shrink:1">Alpha</div>
    <div class="resizable-handle" role="separator" data-value-now="35"></div><div class="resizable-panel">Beta</div>
    </div><output class="authored-output">Authored</output></section>`;
  await test(
    'resizable teardown restores only owned semantics, styles and output',
    resizeMarkup,
    resizable,
    async (fixture, lifecycle) => {
      const handle = fixture.querySelector('.resizable-handle');
      const panel = fixture.querySelector('.resizable-panel');
      const output = fixture.querySelector('output');
      key(handle, 'ArrowRight');
      equal(handle.getAttribute('aria-valuenow'), '36', 'keyboard resize works');
      lifecycle.destroy();
      equal(handle.getAttribute('tabindex'), null, 'generated resize tab stop removed');
      equal(handle.getAttribute('aria-label'), null, 'generated resize name removed');
      equal(handle.getAttribute('aria-valuenow'), null, 'generated resize state removed');
      equal(panel.style.flexBasis, '100px', 'authored panel basis restored');
      equal(panel.style.flexGrow, '1', 'authored growth restored');
      equal(output.textContent, 'Authored', 'authored output restored');
      equal(output.className, 'authored-output', 'authored output attributes restored');
      key(handle, 'ArrowRight');
      equal(panel.style.flexBasis, '100px', 'destroyed separator is inert');
      lifecycle.remount();
      key(handle, 'ArrowRight');
      equal(handle.getAttribute('aria-valuenow'), '36', 'remounted keyboard resize works');
      handle.setAttribute('aria-label', 'Application splitter');
      handle.setAttribute('aria-valuenow', '77');
      handle.setAttribute('tabindex', '-2');
      fixture.querySelector('.resizable-group').setAttribute('data-orientation', 'application');
      panel.style.flexBasis = '123px';
      panel.style.flexGrow = '2';
      output.value = 'Application output';
      output.className = 'application-output';
      output.setAttribute('aria-live', 'off');
      lifecycle.destroy();
      equal(handle.getAttribute('aria-label'), 'Application splitter', 'application name survives');
      equal(handle.getAttribute('aria-valuenow'), '77', 'application value semantics survive');
      equal(handle.getAttribute('tabindex'), '-2', 'application focus semantics survive');
      equal(
        fixture.querySelector('.resizable-group').getAttribute('data-orientation'),
        'application',
        'application group orientation survives'
      );
      equal(panel.style.flexBasis, '123px', 'application panel basis survives');
      equal(panel.style.flexGrow, '2', 'application panel growth survives');
      equal(panel.style.flexShrink, '1', 'still-owned shrink restores');
      equal(output.value, 'Application output', 'application output survives');
      equal(output.className, 'application-output', 'application output class survives');
      equal(output.getAttribute('aria-live'), 'off', 'application output semantics survive');
      equal(
        fixture.querySelector('[data-resizable-controls]'),
        null,
        'generated resize controls removed'
      );
    }
  );
  await test(
    'resizable teardown preserves replacement output and style priority edits',
    resizeMarkup,
    resizable,
    async (fixture, lifecycle) => {
      const output = fixture.querySelector('output');
      const replacement = document.createElement('output');
      replacement.value = 'Replacement result';
      replacement.className = 'application-output';
      output.replaceWith(replacement);
      const panel = fixture.querySelector('.resizable-panel');
      const ownedBasis = panel.style.flexBasis;
      panel.style.setProperty('flex-basis', ownedBasis, 'important');
      lifecycle.destroy();
      equal(fixture.querySelector('output'), replacement, 'replacement node retained');
      equal(replacement.value, 'Replacement result', 'replacement value retained');
      equal(replacement.className, 'application-output', 'replacement attributes retained');
      equal(panel.style.flexBasis, ownedBasis, 'same-valued application priority edit retained');
      equal(
        panel.style.getPropertyPriority('flex-basis'),
        'important',
        'application priority retained'
      );
    }
  );

  const otpMarkup = `<form><fieldset data-input-otp><legend>Code</legend>
    <input name="code" class="input-otp-cell" aria-label="Digit 1" value="1">
    <input name="code" class="input-otp-cell" aria-label="Digit 2" value="7" disabled>
    <input name="code" class="input-otp-cell" aria-label="Digit 3" value="8" readonly>
    <input name="code" class="input-otp-cell" aria-label="Digit 4" value="2"></fieldset></form>`;
  await test(
    'OTP movement skips immutable cells and preserves native boundary keys',
    otpMarkup,
    otp,
    async (fixture, lifecycle) => {
      const [first, disabled, readonly, last] = fixture.querySelectorAll('input');
      first.focus();
      equal(key(first, 'ArrowRight').defaultPrevented, true, 'successful movement handled');
      equal(document.activeElement, last, 'forward arrow skips disabled and readonly cells');
      equal(key(last, 'ArrowLeft').defaultPrevented, true, 'successful reverse movement handled');
      equal(document.activeElement, first, 'reverse arrow skips immutable cells');
      equal(
        key(first, 'ArrowLeft').defaultPrevented,
        false,
        'first-cell boundary preserves native key'
      );
      last.focus();
      equal(
        key(last, 'ArrowRight').defaultPrevented,
        false,
        'last-cell boundary preserves native key'
      );
      last.disabled = true;
      first.focus();
      equal(
        key(first, 'ArrowRight').defaultPrevented,
        false,
        'no eligible destination preserves native key'
      );
      last.disabled = false;
      first.value = '3';
      input(first);
      equal(document.activeElement, last, 'typing advances to editable destination');
      equal(disabled.value, '7', 'disabled value remains unchanged');
      equal(readonly.value, '8', 'readonly value remains unchanged');
      lifecycle.destroy();
      first.value = 'x';
      input(first);
      equal(first.value, 'x', 'destroy restores native editing');
      equal(
        new FormData(fixture.querySelector('form')).getAll('code').join(','),
        'x,8,2',
        'native successful controls submit current values'
      );
      lifecycle.remount();
      first.value = '4';
      input(first);
      equal(document.activeElement, last, 'remounted focus movement works');
    }
  );
  await test(
    'OTP uses effective disabled state and honors handled or composing arrows',
    `<fieldset data-input-otp><legend>Code</legend>
    <input class="input-otp-cell" aria-label="Digit 1"><fieldset disabled><input class="input-otp-cell" aria-label="Digit 2"></fieldset>
    <input class="input-otp-cell" aria-label="Digit 3"></fieldset>`,
    otp,
    async (fixture) => {
      const [first, disabled, last] = fixture.querySelectorAll('input');
      equal(disabled.disabled, false, 'fieldset disability is inherited');
      first.focus();
      key(first, 'ArrowRight');
      equal(document.activeElement, last, 'effective disabled cell skipped');
      first.focus();
      first.addEventListener('keydown', (event) => event.preventDefault(), {
        capture: true,
        once: true
      });
      key(first, 'ArrowRight');
      equal(document.activeElement, first, 'application-handled key does not move focus');
      equal(
        key(first, 'ArrowRight', { isComposing: true }).defaultPrevented,
        false,
        'composing key remains native'
      );
      equal(document.activeElement, first, 'composition does not move focus');
    }
  );
  image.destroy(document);
  return results;
}
