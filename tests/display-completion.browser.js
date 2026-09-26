// Run against a freshly built package served at assetBase. The owning browser
// runner can import this module and fail on any result with an `error` field.
export async function runDisplayCompletionTests(assetBase = '/mewa-ui') {
  const results = [];
  const styles = document.createElement('link');
  styles.rel = 'stylesheet';
  styles.href = `${assetBase}/css/all.css`;
  await new Promise((resolve, reject) => {
    styles.onload = resolve;
    styles.onerror = () => reject(new Error(`Could not load ${styles.href}`));
    document.head.append(styles);
  });
  const equal = (actual, expected, message) => {
    if (!Object.is(actual, expected)) {
      throw new Error(
        `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    }
  };
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
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
  async function test(name, html, slugs, callback) {
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.append(host);
    const modules = [];
    try {
      for (const slug of slugs) {
        const module = await import(`${assetBase}/controllers/${slug}.js`);
        modules.push(module);
        module.enhance(host);
      }
      await callback(host, modules);
      results.push({ name });
    } catch (error) {
      results.push({ name, error: error.stack || error.message });
    } finally {
      modules.reverse().forEach((module) => module.destroy(host));
      host.remove();
    }
  }
  try {
    await test(
      'Avatar preserves identity through failure, recovery and teardown',
      `
      <span class="avatar"><img class="avatar-image" alt="Casey Nguyen">
        <span class="avatar-fallback" aria-hidden="true">CN</span></span>
      <span class="avatar"><img class="avatar-image" alt="">
        <span class="avatar-fallback" aria-hidden="true">CN</span></span>
      <span class="avatar"><img class="avatar-image" alt="No fallback"></span>
    `,
      ['avatar'],
      async (host, [avatar]) => {
        const [image, decorative, bare] = host.querySelectorAll('img');
        const [fallback, decorativeFallback] = host.querySelectorAll('.avatar-fallback');
        equal(fallback.getAttribute('role'), 'img', 'Failed identity has image semantics');
        equal(
          fallback.getAttribute('aria-label'),
          'Casey Nguyen',
          'Failed identity keeps full name'
        );
        equal(fallback.getAttribute('aria-hidden'), 'false', 'Named fallback is exposed');
        equal(
          decorativeFallback.getAttribute('aria-hidden'),
          'true',
          'Decorative fallback stays hidden'
        );
        equal(
          bare.style.display,
          '',
          'An image without a fallback retains native alternative text'
        );
        await new Promise((resolve, reject) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', reject, { once: true });
          image.src =
            'data:image/svg+xml,' +
            encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'
            );
        });
        equal(fallback.getAttribute('aria-hidden'), 'true', 'Recovery restores hidden fallback');
        equal(fallback.hasAttribute('aria-label'), false, 'Recovery removes generated label');
        equal(image.style.display, '', 'Recovery restores image display');
        equal(decorative.hasAttribute('data-error'), true, 'Other failed images are unaffected');
        avatar.destroy(host);
        equal(
          fallback.hasAttribute('role'),
          false,
          'Teardown preserves authored fallback semantics'
        );
        avatar.enhance(host);
        avatar.enhance(host);
        equal(
          fallback.getAttribute('aria-hidden'),
          'true',
          'Repeated enhancement preserves recovery'
        );
      }
    );

    await test(
      'Carousel reacts to data-loop on a live instance and restores its baseline',
      `
      <div class="carousel">
        <button class="carousel-prev" type="button">Previous</button>
        <div class="carousel-viewport">
          <div class="carousel-slide">One</div>
          <div class="carousel-slide">Two</div>
        </div>
        <button class="carousel-next" type="button">Next</button>
      </div>
    `,
      ['carousel'],
      async (host, [carousel]) => {
        const root = host.querySelector('.carousel');
        const next = host.querySelector('.carousel-next');
        const prev = host.querySelector('.carousel-prev');
        // Walk to the last slide, where a non-loop carousel must stop.
        while (!next.disabled) {
          next.click();
          await new Promise(requestAnimationFrame);
        }
        equal(next.disabled, true, 'A non-loop carousel disables Next at the last slide');
        equal(prev.disabled, false, 'A non-loop carousel enables Previous away from the first');

        // The public property has to reach an already-enhanced carousel.
        root.setAttribute('data-loop', '');
        carousel.enhance(host);
        equal(next.disabled, false, 'Enabling data-loop re-enables Next at the last slide');
        equal(prev.disabled, false, 'A loop enables Previous at the last slide');

        root.removeAttribute('data-loop');
        carousel.enhance(host);
        equal(
          next.disabled,
          true,
          'Removing data-loop restores the non-loop end state without a scroll'
        );

        carousel.destroy(host);
        equal(root.hasAttribute('role'), false, 'Destroy removes the generated region role');
        equal(
          root.hasAttribute('aria-roledescription'),
          false,
          'Destroy removes the generated roledescription'
        );
        equal(root.hasAttribute('tabindex'), false, 'Destroy removes the generated tab stop');
        equal(
          host.querySelector('.carousel-slide').hasAttribute('role'),
          false,
          'Destroy removes the generated slide role'
        );

        // A carousel without a viewport cannot work and must not claim to.
        const broken = document.createElement('div');
        broken.innerHTML = '<div class="carousel"><div class="carousel-slides"></div></div>';
        host.append(broken);
        carousel.enhance(broken);
        equal(
          broken.querySelector('.carousel').hasAttribute('data-mewa-carousel-init'),
          false,
          'A carousel without a viewport is not marked ready'
        );
        broken.remove();
      }
    );

    await test(
      'Carousel keeps authored slide names and owns only generated dots',
      `
      <div class="carousel" aria-labelledby="display-carousel-name">
        <h2 id="display-carousel-name">Projects</h2>
        <div class="carousel-viewport">
          <div class="carousel-slide" aria-label="Atlas project">Atlas</div>
          <div class="carousel-slide" aria-labelledby="display-slide-name"><h3 id="display-slide-name">Beacon</h3></div>
          <div class="carousel-slide">Third</div>
        </div>
        <div class="carousel-dots"></div><p class="carousel-counter"></p>
      </div>
    `,
      ['carousel'],
      async (host, [carousel]) => {
        const root = host.querySelector('.carousel');
        const [first, second, third] = host.querySelectorAll('.carousel-slide');
        equal(
          first.getAttribute('aria-label'),
          'Atlas project',
          'Authored label survives initial update'
        );
        equal(
          second.hasAttribute('aria-label'),
          false,
          'Labelledby does not receive redundant label'
        );
        equal(root.hasAttribute('aria-label'), false, 'Root labelledby stays authoritative');
        equal(third.getAttribute('aria-label'), '3 of 3', 'Unnamed slide receives position');
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        equal(first.getAttribute('aria-label'), 'Atlas project', 'Observer update preserves label');
        third.setAttribute('aria-label', 'Application label');
        carousel.destroy(host);
        equal(
          third.getAttribute('aria-label'),
          'Application label',
          'Teardown keeps later application label'
        );
        equal(host.querySelectorAll('.carousel-dot').length, 0, 'Generated dots are removed');
        carousel.enhance(host);
        equal(
          host.querySelectorAll('.carousel-dot').length,
          3,
          'Remount creates one dot per slide'
        );
      }
    );

    await test(
      'Tree navigation skips disabled nodes and collapse repairs its tab stop',
      `
      <ul class="tree" role="tree" aria-label="Files">
        <li class="tree-item" aria-disabled="true"><span class="tree-leaf" id="display-disabled">Unavailable</span></li>
        <li class="tree-item" aria-selected="true"><details class="tree-branch" open>
          <summary class="tree-branch-trigger" id="display-branch">Folder</summary>
          <ul class="tree-group" role="group">
            <li class="tree-item" aria-disabled="true"><span class="tree-leaf">Disabled child</span></li>
            <li class="tree-item"><span class="tree-leaf" id="display-child">Available child</span></li>
          </ul>
        </details></li>
        <li class="tree-item" aria-disabled="true"><details class="tree-branch">
          <summary class="tree-branch-trigger" id="display-disabled-branch">Unavailable folder</summary>
        </details></li>
        <li class="tree-item"><span class="tree-leaf" id="display-last">Last</span></li>
      </ul>
    `,
      ['tree-view'],
      async (host, [tree]) => {
        const branch = host.querySelector('#display-branch');
        const child = host.querySelector('#display-child');
        const last = host.querySelector('#display-last');
        equal(branch.tabIndex, 0, 'Initial tab stop skips disabled first item');
        equal(
          host.querySelector('#display-disabled').tabIndex,
          -1,
          'Disabled item is not tabbable'
        );
        equal(
          getComputedStyle(branch).borderTopColor,
          getComputedStyle(branch).color,
          'Selected branch receives the inverted boundary'
        );
        branch.focus();
        key(branch, 'ArrowRight');
        equal(document.activeElement, child, 'Right skips disabled first child');
        key(child, 'ArrowDown');
        equal(document.activeElement, last, 'Down skips disabled branch');
        key(last, 'Home');
        equal(document.activeElement, branch, 'Home skips disabled first item');
        const disabledBranch = host.querySelector('#display-disabled-branch');
        disabledBranch.click();
        equal(disabledBranch.parentElement.open, false, 'Disabled summary cannot toggle');
        equal(
          key(disabledBranch, 'Enter').defaultPrevented,
          true,
          'Disabled summary keyboard activation is prevented'
        );
        child.focus();
        branch.parentElement.open = false;
        await settle();
        equal(document.activeElement, branch, 'Collapse returns child focus to parent');
        equal(child.tabIndex, -1, 'Collapsed child is no longer a tab stop');
        host.querySelector('.tree-item').removeAttribute('aria-disabled');
        tree.enhance(host);
        key(branch, 'Home');
        equal(document.activeElement.id, 'display-disabled', 'Re-enabled items rejoin navigation');
      }
    );

    await test(
      'Composer shortcuts are opt-in and preserve validation, Shift and composition',
      `
      <form class="composer"><textarea class="composer-input" required>Message</textarea>
        <button type="submit">Send</button></form>
    `,
      ['composer'],
      (host) => {
        const form = host.querySelector('form');
        const input = host.querySelector('textarea');
        const button = host.querySelector('button');
        let submissions = 0;
        let submitter;
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          submissions += 1;
          submitter = event.submitter;
        });
        equal(
          key(input, 'Enter', { ctrlKey: true }).defaultPrevented,
          false,
          'Omitted mode keeps editing native'
        );
        equal(submissions, 0, 'Omitted mode does not submit');
        form.dataset.submitOn = 'mod-enter';
        key(input, 'Enter', { ctrlKey: true });
        equal(submissions, 1, 'Explicit modifier mode submits');
        equal(submitter, button, 'Shortcut preserves the native submitter');
        button.disabled = true;
        key(input, 'Enter', { ctrlKey: true });
        equal(submissions, 1, 'Shortcut cannot bypass a disabled send action');
        button.disabled = false;
        key(input, 'Enter', { ctrlKey: true, shiftKey: true });
        key(input, 'Enter', { ctrlKey: true, isComposing: true });
        equal(submissions, 1, 'Shift and composition do not submit');
        input.value = '';
        key(input, 'Enter', { metaKey: true });
        equal(submissions, 1, 'Native validation still blocks empty required input');
        input.value = 'Message';
        form.dataset.submitOn = 'enter';
        key(input, 'Enter');
        equal(submissions, 2, 'Explicit Enter mode submits');
        delete form.dataset.submitOn;
        key(input, 'Enter', { metaKey: true });
        equal(submissions, 2, 'Removing the mode disables shortcuts immediately');
      }
    );

    await test(
      'Data Table reset, composition and inactive sort labels stay synchronized',
      `
      <section class="data-table">
        <form><input class="data-table-filter" value="Alpha"></form>
        <p data-table-status></p>
        <table><thead><tr>
          <th aria-sort="none"><button type="button" data-table-sort>Name</button></th>
          <th aria-sort="none"><button type="button" data-table-sort>Value</button></th>
        </tr></thead><tbody>
          <tr><td>Alpha</td><td>2</td></tr><tr><td>Beta</td><td>1</td></tr>
        </tbody></table>
      </section>
    `,
      ['data-table'],
      async (host) => {
        const input = host.querySelector('input');
        const form = host.querySelector('form');
        const status = host.querySelector('[data-table-status]');
        const [name, value] = host.querySelectorAll('button');
        name.click();
        value.click();
        equal(
          name.getAttribute('aria-label'),
          'Sort by Name. Activate to sort ascending.',
          'Inactive sort label drops stale direction'
        );
        input.value = 'Missing';
        input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
        equal(status.textContent, '1 result', 'Composition does not filter partial input');
        input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
        equal(status.textContent, '0 results', 'Composition end filters final input');
        const cancel = (event) => event.preventDefault();
        form.addEventListener('reset', cancel);
        form.reset();
        await settle();
        equal(status.textContent, '0 results', 'Canceled reset leaves filtering unchanged');
        form.removeEventListener('reset', cancel);
        form.reset();
        await settle();
        equal(input.value, 'Alpha', 'Native reset restores the authored value');
        equal(status.textContent, '1 result', 'Result count follows native reset');
      }
    );

    await test(
      'Sortable boundary moves retain focus and nested editing keeps its keys',
      `
      <ul class="sortable"><li class="sortable-item">First</li>
        <li class="sortable-item">Second <input aria-label="Note" value="Editable"></li></ul>
    `,
      ['sortable'],
      (host) => {
        const item = host.querySelector('.sortable-item');
        const next = item.querySelector('[data-sortable-increase]');
        next.focus();
        next.click();
        equal(next.disabled, true, 'Move reaches the last boundary');
        equal(document.activeElement, item, 'Focus leaves the newly disabled move control');
        const input = host.querySelector('input');
        input.focus();
        equal(key(input, 'Home').defaultPrevented, false, 'Editing Home is not intercepted');
        equal(key(input, 'ArrowDown').defaultPrevented, false, 'Editing arrow is not intercepted');
      }
    );

    await test(
      'Code Block copy preserves authored labels and reports rejected clipboard writes',
      `
      <figure class="code-block"><figcaption>
        <button type="button" data-code-block-copy aria-label="Copy sample" hidden>Copy sample</button>
        <span class="code-block-status" role="status"></span>
      </figcaption><div class="code-block-viewport"><pre><code class="code-block-code"><span class="code-block-line"><span class="code-block-line-number" aria-hidden="true">1</span><span class="code-block-line-text">first</span></span><span class="code-block-line"><span class="code-block-line-number" aria-hidden="true">2</span><span class="code-block-line-text">second</span></span></code></pre></div></figure>
    `,
      ['code-block'],
      async (host, [codeBlock]) => {
        const descriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
        let copied;
        let reject = false;
        // Controlled Clipboard API outcomes test feedback, not OS clipboard access.
        codeBlock.destroy(host);
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: {
            async writeText(text) {
              if (reject) throw new Error('Permission denied');
              copied = text;
            }
          }
        });
        try {
          codeBlock.enhance(host);
          const button = host.querySelector('button');
          const status = host.querySelector('.code-block-status');
          equal(button.getAttribute('aria-label'), 'Copy sample', 'Authored label survives setup');
          button.click();
          await settle();
          equal(copied, 'first\nsecond', 'Copy omits the line-number gutter');
          equal(status.textContent, 'Copied to clipboard.', 'Successful write is announced');
          reject = true;
          button.click();
          await settle();
          equal(
            status.textContent,
            'Copy failed. Select and copy the code manually.',
            'Denied write offers manual recovery'
          );
          equal(button.textContent, 'Copy sample', 'Failure clears stale success feedback');
          codeBlock.destroy(host);
          equal(button.textContent, 'Copy sample', 'Teardown restores authored visible label');
          equal(button.getAttribute('aria-label'), 'Copy sample', 'Teardown restores name');
          equal(button.hidden, true, 'Teardown restores authored hidden state');
          Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
          codeBlock.enhance(host);
          equal(button.hidden, true, 'Unavailable clipboard does not expose a dead action');
        } finally {
          codeBlock.destroy(host);
          if (descriptor) Object.defineProperty(navigator, 'clipboard', descriptor);
          else delete navigator.clipboard;
        }
      }
    );

    await test(
      'Display states remain visible in both themes without enhancement',
      `
      <progress class="progress" aria-label="Unknown completion"></progress>
      <progress class="progress" value="0" max="100" aria-label="Zero completion"></progress>
      <button class="btn" data-variant="primary" type="button"><svg class="spinner" aria-hidden="true"></svg>Saving</button>
      <details class="todo-list" open><summary>Plan</summary><ol class="todo-list-items">
        <li class="todo-item" data-status="active"><span class="todo-item-mark">›</span><span class="todo-item-copy">Work</span><span class="todo-item-status">In progress</span></li>
      </ol></details>
      <figure class="image" data-ratio="16/9"><img alt="Missing image" data-error>
        <span class="image-fallback" aria-hidden="true">Unavailable</span><figcaption class="image-caption">Persistent caption</figcaption></figure>
      <details class="collapsible"><summary class="collapsible-trigger">A long disclosure label that must wrap without clipping at narrow widths and increased text sizes</summary><div class="collapsible-content">Details</div></details>
    `,
      [],
      (host) => {
        host.style.width = '280px';
        for (const dark of [false, true]) {
          host.classList.toggle('dark', dark);
          const [unknown, zero] = host.querySelectorAll('progress');
          equal(unknown.position, -1, 'Unknown progress keeps native indeterminate semantics');
          equal(zero.position, 0, 'Zero progress remains determinate');
          equal(
            getComputedStyle(unknown).backgroundImage.includes('linear-gradient'),
            true,
            'Unknown progress has a visible static segment'
          );
          equal(
            getComputedStyle(zero).backgroundImage,
            'none',
            'Zero is not drawn as indeterminate'
          );
          equal(
            getComputedStyle(host.querySelector('.spinner')).color,
            getComputedStyle(host.querySelector('button')).color,
            'Spinner inherits inverted action color'
          );
          equal(
            getComputedStyle(host.querySelector('.todo-item-status')).position,
            'static',
            'Task status is visible text'
          );
          const fallback = host.querySelector('.image-fallback').getBoundingClientRect();
          const caption = host.querySelector('figcaption').getBoundingClientRect();
          equal(
            caption.top + 0.5 >= fallback.bottom,
            true,
            'Failed media does not cover its caption'
          );
          const summary = host.querySelector('.collapsible-trigger');
          equal(
            summary.clientHeight >= summary.scrollHeight,
            true,
            'Wrapped disclosure text is not clipped'
          );
        }
      }
    );
  } finally {
    styles.remove();
  }
  return results;
}
