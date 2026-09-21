// Run on a blank page against a fresh package. Fail on results with `error`.
export async function runRemainingCompletionTests(assetBase = '/mewa-ui') {
  const results = [];
  const files = ['css/all.css'];
  const links = await Promise.all(
    files.map(async (file) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${assetBase}/${file}`;
      await new Promise((resolve, reject) => {
        link.onload = resolve;
        link.onerror = reject;
        document.head.append(link);
      });
      return link;
    })
  );
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  async function test(name, html, callback) {
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.append(host);
    try {
      await callback(host);
      results.push({ name });
    } catch (error) {
      results.push({ name, error: error.message });
    } finally {
      host.remove();
    }
  }
  try {
    await test(
      'Selected tabs use a border, retain keyboard selection and vertical targets',
      `
      <div class="tab-list" role="tablist" aria-label="Views">
        <button type="button" class="tab-trigger" role="tab" aria-selected="true" aria-controls="remaining-one">One</button>
        <button type="button" class="tab-trigger" role="tab" aria-selected="false" aria-controls="remaining-two" tabindex="-1">Two</button>
      </div><div id="remaining-one">One</div><div id="remaining-two" hidden>Two</div>`,
      async (host) => {
        const tabs = await import(`${assetBase}/controllers/tabs.js`);
        tabs.enhance(host);
        try {
          const list = host.firstElementChild;
          const [first, second] = list.children;
          check(
            getComputedStyle(first).boxShadow === 'none',
            'Selected tabs must not cast a decorative shadow'
          );
          check(
            getComputedStyle(first).borderTopColor !== 'rgba(0, 0, 0, 0)',
            'Selected tab needs a visible boundary'
          );
          first.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
          );
          check(
            second.getAttribute('aria-selected') === 'true' &&
              !host.querySelector('#remaining-two').hidden,
            'ArrowRight selects the next panel'
          );
          list.setAttribute('aria-orientation', 'vertical');
          check(
            first.getBoundingClientRect().height >= 32,
            'Vertical tabs retain control-sized targets'
          );
        } finally {
          tabs.destroy(host);
        }
      }
    );
    await test(
      'Markdown renderer classes preserve fenced code and task-list layout',
      `
      <article class="typography-content"><pre><code>plain code</code></pre><pre class="language-js"><code class="language-js">renderer code</code></pre>
      <ul><li>Ordinary</li></ul><ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" disabled>Task</li></ul></article>`,
      (host) => {
        const [plain, classified] = host.querySelectorAll('code');
        check(
          getComputedStyle(plain).fontSize === getComputedStyle(classified).fontSize,
          'Fenced language classes must inherit the pre font size'
        );
        check(
          getComputedStyle(plain.parentElement).padding ===
            getComputedStyle(classified.parentElement).padding,
          'Renderer language classes on pre retain code-block padding'
        );
        const [list, taskList] = host.querySelectorAll('ul');
        check(
          getComputedStyle(list).paddingInlineStart ===
            getComputedStyle(taskList).paddingInlineStart,
          'Renderer task lists retain document indentation'
        );
        check(
          getComputedStyle(list).marginTop === getComputedStyle(taskList).marginTop,
          'Renderer task lists retain document rhythm'
        );
      }
    );
    await test(
      'Header composes Button links without overriding their size or variant',
      `
      <a class="btn" data-variant="primary" href="#">Action</a>
      <header class="header"><div class="header-actions"><a class="btn" data-variant="primary" href="#">Action</a></div></header>`,
      (host) => {
        const [standalone, nested] = host.querySelectorAll('a');
        check(
          nested.getBoundingClientRect().height === standalone.getBoundingClientRect().height,
          'Header action must keep the Button height'
        );
        check(
          getComputedStyle(nested).color === getComputedStyle(standalone).color,
          'Header action must keep the Button variant text'
        );
      }
    );
    await test(
      'Popover remains inside the viewport at every side and alignment',
      `
      <button type="button" popovertarget="remaining-popover">Options</button>
      <div class="popover" id="remaining-popover" popover>Contextual content</div>`,
      async (host) => {
        const popover = await import(`${assetBase}/controllers/popover.js`);
        popover.enhance(host);
        const tip = host.lastElementChild;
        try {
          for (const side of ['top', 'right', 'bottom', 'left']) {
            for (const align of ['start', 'center', 'end']) {
              tip.dataset.side = side;
              tip.dataset.align = align;
              tip.showPopover();
              const rect = tip.getBoundingClientRect();
              check(
                rect.left >= 0 && rect.right <= innerWidth,
                `Popover ${side}/${align} extends beyond viewport: ${rect.left}, ${rect.right}`
              );
              tip.hidePopover();
            }
          }
        } finally {
          tip.hidePopover();
          popover.destroy(host);
        }
      }
    );
    await test(
      'Tooltip subtree cleanup releases document ownership and instant-open state',
      `
      <button type="button" data-tooltip-trigger="remaining-tip" data-delay="0">Hint</button>
      <div class="tooltip" id="remaining-tip" role="tooltip" popover="hint">Help</div>`,
      async (host) => {
        const tooltip = await import(`${assetBase}/controllers/tooltip.js`);
        tooltip.enhance(host);
        const trigger = host.firstElementChild;
        const tip = host.lastElementChild;
        try {
          trigger.dispatchEvent(new MouseEvent('mouseenter'));
          await wait(30);
          check(tip.matches(':popover-open'), 'Immediate tooltip opens');
          tooltip.destroy(host);
          check(
            !document.__tooltipScrollInit,
            'Destroying last tooltip must release document scroll listener'
          );
          trigger.removeAttribute('data-delay');
          tooltip.enhance(host);
          trigger.dispatchEvent(new MouseEvent('mouseenter'));
          await wait(30);
          check(
            !tip.matches(':popover-open'),
            'A fresh mount must not inherit stale instant-open state'
          );
        } finally {
          tooltip.destroy(host);
        }
      }
    );
    await test(
      'Tooltip keeps a focused hint open when the pointer leaves',
      `
      <button type="button" data-tooltip-trigger="remaining-focus-tip" data-delay="0">Hint</button>
      <div class="tooltip" id="remaining-focus-tip" role="tooltip" popover="hint">Help</div>`,
      async (host) => {
        const tooltip = await import(`${assetBase}/controllers/tooltip.js`);
        tooltip.enhance(host);
        try {
          const trigger = host.firstElementChild;
          trigger.focus();
          trigger.dispatchEvent(new MouseEvent('mouseenter'));
          await wait(30);
          trigger.dispatchEvent(new MouseEvent('mouseleave'));
          await wait(160);
          check(
            host.lastElementChild.matches(':popover-open'),
            'Focus must retain the supplementary hint'
          );
          const escape = new KeyboardEvent('keydown', {
            key: 'Escape',
            bubbles: true,
            cancelable: true
          });
          trigger.dispatchEvent(escape);
          check(
            escape.defaultPrevented && !host.lastElementChild.matches(':popover-open'),
            'Escape dismisses only the hint'
          );
          check(document.activeElement === trigger, 'Escape retains trigger focus');
        } finally {
          tooltip.destroy(host);
        }
      }
    );
    await test(
      'Pagination reflows a compact first/current/last page range',
      `
      <nav class="pagination" aria-label="Pages"><ul class="pagination-list">${['Previous', '1', '2', '3', '4', '5', '6', 'Next'].map((label) => `<li><a class="pagination-link" href="#">${label}</a></li>`).join('')}</ul></nav>`,
      (host) => {
        const rect = host.querySelector('ul').getBoundingClientRect();
        check(
          rect.left >= 0 && rect.right <= innerWidth,
          'Pagination must wrap rather than overflow'
        );
      }
    );
    await test(
      'Resizable rejects disabled pointer alternatives and clears readiness on destroy',
      `
      <div class="resizable"><div class="resizable-group"><div class="resizable-panel">First</div>
      <div class="resizable-handle" role="separator" data-value-now="35"></div><div class="resizable-panel">Second</div></div></div>`,
      async (host) => {
        const resizable = await import(`${assetBase}/controllers/resizable.js`);
        resizable.enhance(host);
        const root = host.firstElementChild;
        const handle = host.querySelector('.resizable-handle');
        try {
          host.querySelector('[data-resizable-increase]').click();
          check(
            handle.getAttribute('aria-valuenow') === '45',
            'Pointer alternative changes the split'
          );
          handle.setAttribute('aria-disabled', 'true');
          host.querySelector('[data-resizable-increase]').click();
          check(
            handle.getAttribute('aria-valuenow') === '45',
            'Dynamically disabled handle blocks pointer alternative'
          );
          resizable.destroy(host);
          check(
            !root.hasAttribute('data-init'),
            'Destroyed split no longer advertises resize readiness'
          );
          check(!host.querySelector('[data-resizable-controls]'), 'Generated controls are removed');
          check(!handle.hasAttribute('tabindex'), 'Static separator leaves the tab sequence');
        } finally {
          resizable.destroy(host);
        }
      }
    );
    for (const slug of ['hover-card', 'context-menu']) {
      await test(
        `${slug} releases document listeners after the last subtree is destroyed`,
        '',
        async (host) => {
          const module = await import(`${assetBase}/controllers/${slug}.js`);
          const owned = new Set();
          const add = document.addEventListener;
          const remove = document.removeEventListener;
          document.addEventListener = function (type, listener, options) {
            owned.add(listener);
            return add.call(this, type, listener, options);
          };
          document.removeEventListener = function (type, listener, options) {
            owned.delete(listener);
            return remove.call(this, type, listener, options);
          };
          try {
            for (const suffix of ['a', 'b']) {
              const region = document.createElement('div');
              region.innerHTML = `<button type="button" data-${slug}-trigger="remaining-${slug}-${suffix}">Preview</button><div class="${slug === 'context-menu' ? 'context-menu-content' : slug}" id="remaining-${slug}-${suffix}" popover="manual">Content</div>`;
              host.append(region);
              module.enhance(region);
            }
            check(owned.size > 0, 'Document listeners installed');
            module.destroy(host.firstElementChild);
            check(owned.size > 0, 'A live sibling retains shared listeners');
            module.destroy(host.lastElementChild);
            check(owned.size === 0, 'Last subtree releases shared listeners');
          } finally {
            module.destroy(host);
            document.addEventListener = add;
            document.removeEventListener = remove;
          }
        }
      );
    }
    await test(
      'Tall context menu scrolls without closing and Escape restores focus',
      `
      <button type="button" data-context-menu-trigger="remaining-menu">Actions</button>
      <div class="context-menu-content" id="remaining-menu" popover="manual" role="menu" aria-label="Actions">${Array.from({ length: 30 }, (_, index) => `<button type="button" class="context-menu-item" role="menuitem" tabindex="-1">Action ${index}</button>`).join('')}</div>`,
      async (host) => {
        const menu = await import(`${assetBase}/controllers/context-menu.js`);
        menu.enhance(host);
        try {
          const trigger = host.firstElementChild;
          const surface = host.lastElementChild;
          trigger.dispatchEvent(
            new KeyboardEvent('keydown', {
              key: 'F10',
              shiftKey: true,
              bubbles: true,
              cancelable: true
            })
          );
          check(surface.matches(':popover-open'), 'Keyboard command opens menu');
          check(
            surface.getBoundingClientRect().bottom <= innerHeight,
            'Tall menu fits viewport height'
          );
          surface.scrollTop = 100;
          surface.dispatchEvent(new Event('scroll'));
          check(surface.matches(':popover-open'), 'Internal scrolling retains menu');
          surface
            .querySelector('button')
            .dispatchEvent(
              new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
            );
          check(
            !surface.matches(':popover-open') && document.activeElement === trigger,
            'Escape closes and restores focus'
          );
        } finally {
          menu.destroy(host);
        }
      }
    );
    await test(
      'Alert Dialog response actions wrap without horizontal content loss',
      `
      <dialog class="alert-dialog" open><div class="alert-dialog-content"><div class="alert-dialog-footer">
      <button class="btn" type="button" data-variant="secondary">Keep the account</button>
      <button class="btn" type="button" data-variant="destructive">Delete the account</button>
      </div></div></dialog>`,
      (host) => {
        const dialog = host.firstElementChild;
        check(
          dialog.scrollWidth <= dialog.clientWidth,
          'Response actions must fit or wrap at narrow width'
        );
      }
    );
    await test(
      'Forced colors preserve nav and icon text on highlighted controls',
      `
      <nav class="nav"><a class="nav-item-link" aria-current="page" href="#"><svg class="ri-home-line" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M0 0h24v24H0z"/></svg>Current page</a></nav>`,
      (host) => {
        if (!matchMedia('(forced-colors: active)').matches) return;
        const link = host.querySelector('a');
        const pseudo = getComputedStyle(link, '::before');
        check(
          getComputedStyle(link).color === pseudo.color,
          'Highlighted text must use HighlightText as its surface does'
        );
        check(
          getComputedStyle(host.querySelector('svg')).color === getComputedStyle(link).color,
          'Icon inherits the highlighted control text color'
        );
      }
    );
  } finally {
    links.forEach((link) => link.remove());
  }
  return results;
}
