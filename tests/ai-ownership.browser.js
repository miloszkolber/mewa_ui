import * as composer from '../library/components/ai/composer/composer.js';
import * as codeBlock from '../library/components/ai/code-block/code-block.js';
import * as messageScroller from '../library/components/ai/message-scroller/message-scroller.js';
import * as todoList from '../library/components/ai/todo-list/todo-list.js';
import { createController } from '../library/runtime/core.js';

// Exercise source controllers with real DOM and observers. Clipboard outcomes are
// controlled to test feedback ownership, not OS clipboard permissions.
export async function runAIOwnership() {
  const results = [];
  const equal = (actual, expected, message) => {
    if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
  };
  const nativeEnd = (viewport, message) => {
    // CSSOM scrollHeight/clientHeight are integers; scrollTop is a double.
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#determine_if_an_element_has_been_totally_scrolled
    const gap = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop;
    if (Math.abs(gap) > 1) throw new Error(`${message}: native end gap ${gap}`);
  };
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
  const frames = async () => {
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  };
  const key = (target, extra = {}) => {
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
      ...extra
    });
    target.dispatchEvent(event);
    return event;
  };
  const test = async (name, html, module, scope, check) => {
    const fixture = document.createElement('div');
    fixture.innerHTML = html;
    document.body.append(fixture);
    const owner = fixture.firstElementChild;
    const target = scope === 'root' ? owner : fixture;
    let controller;
    const mount = () => {
      controller = createController(module.behavior, target);
      controller.update();
      module.enhance(target);
    };
    const destroy = () => {
      controller.destroy();
      controller.destroy();
      module.destroy(target);
    };
    try {
      mount();
      await check(owner, { destroy, remount: mount, update: () => controller.update() });
      results.push({ name, passed: true, error: null });
    } catch (error) {
      results.push({ name, passed: false, error: error.message });
    } finally {
      controller?.destroy();
      // Failed cleanup must not leak into the next scenario in an unfixed module.
      owner.classList.add(module.behavior.name);
      module.destroy(fixture);
      fixture.remove();
    }
  };
  const released = (owner, name) => {
    equal(owner.hasAttribute(`data-mewa-${name}-init`), false, 'behavior marker released');
    equal(owner.hasAttribute('data-init'), false, 'last readiness marker released');
  };
  const composerMarkup = `<form class="composer" data-submit-on="mod-enter">
    <label>Message <textarea class="composer-input" name="message" required>Draft</textarea></label>
    <button type="submit" name="action" value="send">Send</button></form>`;
  const codeMarkup = `<figure class="code-block"><figcaption>
    <button data-code-block-copy type="button" aria-label="Copy original" hidden><span>Copy original</span></button>
    <span class="code-block-status" role="status">Original status</span></figcaption>
    <div class="code-block-viewport" tabindex="0" aria-label="Source" style="height:100px;overflow:auto;overflow-anchor:none">
      <pre><code class="code-block-code" style="display:block;height:1000px">Original source</code></pre>
    </div></figure>`;
  const messageMarkup = `<section class="message-scroller" data-default-pinned="false">
    <div class="message-scroller-viewport" tabindex="0" role="log" aria-label="Conversation" aria-live="off"
      style="height:100px;overflow:auto;overflow-anchor:none">
      <div class="message-scroller-content" style="height:1000px">Transcript</div></div>
    <button data-message-scroller-jump type="button" hidden>Jump to latest</button></section>`;
  const todoMarkup = `<details class="todo-list" open><summary>Plan <span data-todo-progress>0 of 2 complete</span></summary>
    <ol class="todo-list-items"><li class="todo-item" data-status="pending">A</li>
      <li class="todo-item" data-status="active">B</li></ol></details>`;

  for (const scope of ['root', 'region']) {
    await test(
      `composer ${scope} cleanup uses owner identity and preserves the current draft`,
      composerMarkup,
      composer,
      scope,
      (owner, lifecycle) => {
        const input = owner.querySelector('textarea');
        const button = owner.querySelector('button');
        let submissions = 0;
        let submitter;
        owner.addEventListener('submit', (event) => {
          event.preventDefault();
          submissions++;
          submitter = event.submitter;
        });
        key(input);
        equal(submissions, 1, 'one mounted shortcut submission');
        equal(submitter, button, 'native submitter preserved');
        input.value = 'Current application draft';
        input.setSelectionRange(2, 9, 'backward');
        owner.classList.remove('composer');
        lifecycle.destroy();
        equal(key(input).defaultPrevented, false, 'destroyed shortcut leaves editing native');
        equal(submissions, 1, 'no submission after destroy');
        released(owner, 'composer');
        equal(input.value, 'Current application draft', 'current draft retained');
        equal(input.selectionStart, 2, 'selection start retained');
        equal(input.selectionEnd, 9, 'selection end retained');
        equal(input.selectionDirection, 'backward', 'selection direction retained');
        button.click();
        equal(submissions, 2, 'native submit button remains usable');
        owner.classList.add('composer');
        lifecycle.remount();
        key(input);
        equal(submissions, 3, 'remount has one shortcut path');
        key(input, { isComposing: true });
        key(input, { shiftKey: true });
        equal(submissions, 3, 'composition and Shift remain native');
        button.disabled = true;
        key(input);
        equal(submissions, 3, 'disabled submitter is respected');
        button.disabled = false;
        input.value = '';
        key(input);
        equal(submissions, 3, 'required validation is respected');
      }
    );
    await test(
      `code block ${scope} cleanup disconnects content, attribute and resize observers`,
      codeMarkup,
      codeBlock,
      scope,
      async (owner, lifecycle) => {
        const viewport = owner.querySelector('.code-block-viewport');
        const code = owner.querySelector('code');
        await frames();
        viewport.scrollTop = 240;
        viewport.dispatchEvent(new Event('scroll'));
        const before = viewport.scrollTop;
        const selection = document.getSelection();
        const range = document.createRange();
        range.setStart(code.firstChild, 0);
        range.setEnd(code.firstChild, 8);
        selection.removeAllRanges();
        selection.addRange(range);
        owner.classList.remove('code-block');
        lifecycle.destroy();
        released(owner, 'code-block');
        equal(selection.toString(), 'Original', 'current code selection retained');
        selection.removeAllRanges();
        owner.dataset.streaming = '';
        code.textContent = 'Application source after cleanup';
        code.style.height = '1400px';
        await settle();
        await frames();
        equal(viewport.scrollTop, before, 'released observers do not move the reader');
        equal(code.textContent, 'Application source after cleanup', 'application code retained');
        owner.classList.add('code-block');
        lifecycle.remount();
        await frames();
        nativeEnd(viewport, 'remount follows streaming');
        // Count real scroll assignments, not observer construction or private
        // state, to catch duplicate observer callbacks after remount.
        const scrollTop = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop');
        let scrollWrites = 0;
        Object.defineProperty(viewport, 'scrollTop', {
          configurable: true,
          get() {
            return scrollTop.get.call(this);
          },
          set(value) {
            scrollWrites++;
            scrollTop.set.call(this, value);
          }
        });
        owner.removeAttribute('data-streaming');
        await frames();
        owner.dataset.streaming = '';
        await frames();
        equal(scrollWrites, 1, 'remount has one streaming attribute observer');
        scrollWrites = 0;
        code.append(' More source');
        await frames();
        equal(scrollWrites, 1, 'remount has one content observer for unchanged geometry');
        delete viewport.scrollTop;
        lifecycle.destroy();
        viewport.scrollTop = 120;
        viewport.dispatchEvent(new Event('scroll'));
        const releasedPosition = viewport.scrollTop;
        code.style.height = '1600px';
        code.append(' More');
        await frames();
        equal(viewport.scrollTop, releasedPosition, 'remounted observers are released again');
      }
    );
    await test(
      `message scroller ${scope} cleanup preserves transcript and reading position`,
      messageMarkup,
      messageScroller,
      scope,
      async (owner, lifecycle) => {
        const viewport = owner.querySelector('.message-scroller-viewport');
        const content = owner.querySelector('.message-scroller-content');
        const jump = owner.querySelector('button');
        let pinnedChanges = 0;
        owner.addEventListener('message-scroller:pinned-change', () => pinnedChanges++);
        viewport.scrollTop = 240;
        viewport.dispatchEvent(new Event('scroll'));
        await frames();
        const readingPosition = viewport.scrollTop;
        viewport.setAttribute('aria-label', 'Application log');
        viewport.setAttribute('aria-live', 'polite');
        owner.classList.remove('message-scroller');
        lifecycle.destroy();
        released(owner, 'message-scroller');
        equal(owner.hasAttribute('data-pinned'), false, 'derived pinned state released');
        equal(jump.hidden, true, 'dead jump action hidden');
        owner.dataset.conversationKey = 'changed-after-destroy';
        content.textContent = 'Application transcript';
        content.style.height = '1400px';
        jump.click();
        await frames();
        equal(
          viewport.scrollTop,
          readingPosition,
          'released listeners and observers leave reading position'
        );
        equal(pinnedChanges, 0, 'no post-destroy pinned events');
        equal(content.textContent, 'Application transcript', 'current transcript retained');
        equal(
          viewport.getAttribute('aria-label'),
          'Application log',
          'application log name retained'
        );
        equal(viewport.getAttribute('aria-live'), 'polite', 'application live setting retained');
        owner.classList.add('message-scroller');
        lifecycle.remount();
        jump.focus();
        jump.click();
        equal(pinnedChanges, 1, 'remount emits one pinned transition');
        equal(document.activeElement, viewport, 'jump transfers focus before hiding');
        nativeEnd(viewport, 'jump reaches live edge');
        viewport.scrollTop = 240;
        viewport.dispatchEvent(new Event('scroll'));
        equal(pinnedChanges, 2, 'one unpinned transition');
        owner.dataset.conversationKey = 'new-mounted-conversation';
        await frames();
        equal(pinnedChanges, 3, 'one conversation-key transition');
        lifecycle.destroy();
        viewport.scrollTop = 120;
        const releasedPosition = viewport.scrollTop;
        content.style.height = '1600px';
        content.append(' More');
        await frames();
        equal(
          viewport.scrollTop,
          releasedPosition,
          'remounted content and resize observers are released'
        );
      }
    );
    await test(
      `todo list ${scope} cleanup stops progress updates without rolling back tasks`,
      todoMarkup,
      todoList,
      scope,
      async (owner, lifecycle) => {
        const progress = owner.querySelector('[data-todo-progress]');
        const item = owner.querySelector('li');
        let events = 0;
        owner.addEventListener('todo-list:progress', () => events++);
        item.dataset.status = 'done';
        owner.open = false;
        await settle();
        equal(events, 1, 'one observer event for task mutation');
        equal(progress.textContent, '1 of 2 complete', 'derived count matches current task state');
        owner.classList.remove('todo-list');
        lifecycle.destroy();
        released(owner, 'todo-list');
        equal(Boolean(owner._todoListObserver), false, 'legacy observer property released');
        equal(progress.textContent, '1 of 2 complete', 'truthful current progress retained');
        equal(owner.open, false, 'native disclosure choice retained');
        equal(item.dataset.status, 'done', 'current task state retained');
        progress.textContent = 'Application progress after cleanup';
        item.dataset.status = 'active';
        owner
          .querySelector('ol')
          .insertAdjacentHTML('beforeend', '<li data-todo-item data-status="done">C</li>');
        await settle();
        equal(events, 1, 'no observer events after destroy');
        equal(
          progress.textContent,
          'Application progress after cleanup',
          'application progress not overwritten'
        );
        owner.classList.add('todo-list');
        lifecycle.remount();
        events = 0;
        item.dataset.status = 'done';
        await settle();
        equal(events, 1, 'remount installs one observer');
        equal(progress.textContent, '2 of 3 complete', 'remount derives current tasks');
        progress.textContent = 'Application final progress';
        lifecycle.destroy();
        equal(
          progress.textContent,
          'Application final progress',
          'teardown retains later application progress'
        );
      }
    );
  }

  for (const [module, markup] of [
    [composer, composerMarkup],
    [codeBlock, codeMarkup],
    [messageScroller, messageMarkup],
    [todoList, todoMarkup]
  ]) {
    const template = document.createElement('div');
    template.innerHTML = markup;
    const complete = template.firstElementChild;
    await test(
      `${module.behavior.name} incomplete markup can be completed and enhanced without stale markers`,
      `<${complete.localName} class="${module.behavior.name}"></${complete.localName}>`,
      module,
      'root',
      (owner, lifecycle) => {
        released(owner, module.behavior.name);
        owner.innerHTML = complete.innerHTML;
        lifecycle.update();
        equal(
          owner.hasAttribute(`data-mewa-${module.behavior.name}-init`),
          true,
          'completed component initializes'
        );
        lifecycle.destroy();
        released(owner, module.behavior.name);
      }
    );
  }

  const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  const setClipboard = (value) =>
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value });
  try {
    setClipboard({ writeText: async () => {} });
    await test(
      'code block no-copy cleanup does not replace application label or status nodes',
      codeMarkup,
      codeBlock,
      'root',
      (owner, lifecycle) => {
        const button = owner.querySelector('button');
        const status = owner.querySelector('.code-block-status');
        const label = document.createElement('span');
        label.textContent = 'Application copy label';
        button.replaceChildren(label);
        button.setAttribute('aria-label', 'Application copy name');
        const statusNode = document.createTextNode('Application status');
        status.replaceChildren(statusNode);
        lifecycle.destroy();
        equal(button.firstChild, label, 'application label identity retained');
        equal(
          button.getAttribute('aria-label'),
          'Application copy name',
          'application copy name retained'
        );
        equal(status.firstChild, statusNode, 'application status identity retained');
        equal(button.hidden, true, 'canonical unavailable copy action hidden');
      }
    );
    await test(
      'code block normal feedback timer restores current label and status node identities',
      codeMarkup,
      codeBlock,
      'root',
      async (owner) => {
        const button = owner.querySelector('button');
        const status = owner.querySelector('.code-block-status');
        const label = button.firstChild;
        const statusNode = status.firstChild;
        button.click();
        await settle();
        equal(button.textContent, 'Copied', 'copied label visible before timer');
        await new Promise((resolve) => setTimeout(resolve, 2100));
        equal(button.firstChild, label, 'timer restores baseline label identity');
        equal(button.getAttribute('aria-label'), 'Copy original', 'timer restores baseline name');
        equal(status.firstChild, statusNode, 'timer restores baseline status identity');
      }
    );
    await test(
      'code block cleanup preserves in-place feedback edits and application inserted siblings',
      codeMarkup,
      codeBlock,
      'root',
      async (owner, lifecycle) => {
        const button = owner.querySelector('button');
        const status = owner.querySelector('.code-block-status');
        const label = button.firstChild;
        button.click();
        await settle();
        const extraLabel = document.createElement('span');
        extraLabel.textContent = 'Application addition';
        button.append(extraLabel);
        const editedStatus = status.firstChild;
        editedStatus.data = 'Application edit in the same node';
        lifecycle.destroy();
        equal(button.firstChild, label, 'owned feedback alone replaced with its baseline');
        equal(button.lastChild, extraLabel, 'application inserted sibling retained');
        equal(status.firstChild, editedStatus, 'application-edited feedback node retained');
        equal(
          status.textContent,
          'Application edit in the same node',
          'in-place status edit retained'
        );
      }
    );
    await test(
      'code block feedback starts from the current application baseline and cancels its timer',
      codeMarkup,
      codeBlock,
      'root',
      async (owner, lifecycle) => {
        const button = owner.querySelector('button');
        const status = owner.querySelector('.code-block-status');
        const label = document.createElement('span');
        label.textContent = 'Current label';
        button.replaceChildren(label);
        button.removeAttribute('aria-label');
        const statusNode = document.createTextNode('Current status');
        status.replaceChildren(statusNode);
        button.click();
        await settle();
        equal(button.textContent, 'Copied', 'successful feedback shown');
        equal(status.textContent, 'Copied to clipboard.', 'successful feedback announced');
        lifecycle.destroy();
        equal(button.firstChild, label, 'feedback-start label baseline restored');
        equal(
          button.getAttribute('aria-label'),
          null,
          'feedback-start accessible-name baseline restored'
        );
        equal(status.firstChild, statusNode, 'feedback-start status baseline restored');
        const applicationLabel = document.createElement('span');
        applicationLabel.textContent = 'After destroy';
        button.replaceChildren(applicationLabel);
        status.textContent = 'After destroy status';
        await new Promise((resolve) => setTimeout(resolve, 2100));
        equal(button.firstChild, applicationLabel, 'canceled timer cannot replace new label');
        equal(
          status.textContent,
          'After destroy status',
          'canceled timer cannot replace new status'
        );
      }
    );
    await test(
      'code block pending copy captures late application edits only when feedback starts',
      codeMarkup,
      codeBlock,
      'root',
      async (owner, lifecycle) => {
        let resolve;
        setClipboard({
          writeText: () =>
            new Promise((done) => {
              resolve = done;
            })
        });
        const button = owner.querySelector('button');
        const status = owner.querySelector('.code-block-status');
        button.click();
        const label = document.createElement('span');
        label.textContent = 'Edited while pending';
        button.replaceChildren(label);
        button.setAttribute('aria-label', 'Pending application name');
        const statusNode = document.createTextNode('Pending application status');
        status.replaceChildren(statusNode);
        resolve();
        await settle();
        lifecycle.destroy();
        equal(button.firstChild, label, 'pending label baseline restored by identity');
        equal(
          button.getAttribute('aria-label'),
          'Pending application name',
          'pending application name retained'
        );
        equal(status.firstChild, statusNode, 'pending status baseline restored by identity');
      }
    );
    await test(
      'code block destroy during a pending clipboard write ignores its later completion',
      codeMarkup,
      codeBlock,
      'root',
      async (owner, lifecycle) => {
        let resolve;
        setClipboard({
          writeText: () =>
            new Promise((done) => {
              resolve = done;
            })
        });
        const button = owner.querySelector('button');
        const status = owner.querySelector('.code-block-status');
        button.click();
        const label = document.createElement('span');
        label.textContent = 'Application pending label';
        button.replaceChildren(label);
        button.setAttribute('aria-label', 'Application pending name');
        status.textContent = 'Application pending status';
        lifecycle.destroy();
        resolve();
        await settle();
        equal(button.firstChild, label, 'pending teardown does not restore a stale label');
        equal(
          button.getAttribute('aria-label'),
          'Application pending name',
          'pending teardown leaves name'
        );
        equal(status.textContent, 'Application pending status', 'stale completion cannot announce');
      }
    );
    for (const ending of ['timer', 'destroy']) {
      await test(
        `code block ${ending} preserves application replacements made during copied feedback`,
        codeMarkup,
        codeBlock,
        'root',
        async (owner, lifecycle) => {
          setClipboard({ writeText: async () => {} });
          const button = owner.querySelector('button');
          const status = owner.querySelector('.code-block-status');
          button.click();
          await settle();
          const label = document.createElement('span');
          label.textContent = 'Application feedback replacement';
          button.replaceChildren(label);
          button.setAttribute('aria-label', 'Application feedback name');
          const statusNode = document.createTextNode('Application feedback status');
          status.replaceChildren(statusNode);
          if (ending === 'timer') await new Promise((resolve) => setTimeout(resolve, 2100));
          else lifecycle.destroy();
          equal(button.firstChild, label, 'application replacement span remains attached');
          equal(
            button.getAttribute('aria-label'),
            'Application feedback name',
            'application name retained'
          );
          equal(status.firstChild, statusNode, 'application status node retained');
        }
      );
    }
    await test(
      'code block rejected clipboard writes restore only owned failure feedback',
      codeMarkup,
      codeBlock,
      'root',
      async (owner, lifecycle) => {
        setClipboard({
          writeText: async () => {
            throw new Error('Permission denied');
          }
        });
        const button = owner.querySelector('button');
        const status = owner.querySelector('.code-block-status');
        const label = document.createElement('span');
        label.textContent = 'Failure label';
        button.replaceChildren(label);
        status.textContent = 'Failure baseline';
        button.click();
        await settle();
        equal(
          status.textContent,
          'Copy failed. Select and copy the code manually.',
          'failure recovery announced'
        );
        equal(button.firstChild, label, 'failure does not replace visible label');
        lifecycle.destroy();
        equal(button.firstChild, label, 'failure cleanup keeps label identity');
        equal(
          status.textContent,
          'Failure baseline',
          'owned failure status restored to current baseline'
        );
        lifecycle.remount();
        button.click();
        await settle();
        status.textContent = 'Application failure replacement';
        lifecycle.destroy();
        equal(
          status.textContent,
          'Application failure replacement',
          'application failure status retained'
        );
      }
    );
    await test(
      'code block latest copy attempt owns feedback and structured copying omits gutters',
      codeMarkup,
      codeBlock,
      'root',
      async (owner, lifecycle) => {
        const pending = [];
        setClipboard({
          writeText: (text) =>
            new Promise((resolve, reject) => pending.push({ text, resolve, reject }))
        });
        const button = owner.querySelector('button');
        const status = owner.querySelector('.code-block-status');
        owner.querySelector('code').innerHTML =
          '<span class="code-block-line"><span class="code-block-line-number">1</span><span class="code-block-line-text">first</span></span><span class="code-block-line"><span class="code-block-line-number">2</span><span class="code-block-line-text">second</span></span>';
        button.click();
        button.click();
        equal(pending.length, 2, 'one clipboard write per activation');
        equal(pending[1].text, 'first\nsecond', 'copy includes source text without line numbers');
        pending[1].resolve();
        await settle();
        pending[0].reject(new Error('Older attempt denied'));
        await settle();
        equal(
          status.textContent,
          'Copied to clipboard.',
          'stale failed attempt cannot replace current success'
        );
        lifecycle.destroy();
      }
    );
    setClipboard(undefined);
    await test(
      'code block without Clipboard API keeps the copy control hidden and does not write feedback',
      codeMarkup,
      codeBlock,
      'root',
      (owner, lifecycle) => {
        const button = owner.querySelector('button');
        const label = button.firstChild;
        const status = owner.querySelector('.code-block-status');
        const statusNode = status.firstChild;
        equal(button.hidden, true, 'unavailable action stays hidden');
        button.click();
        lifecycle.destroy();
        equal(button.firstChild, label, 'unavailable copy leaves label node');
        equal(status.firstChild, statusNode, 'unavailable copy leaves status node');
      }
    );
  } finally {
    if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard);
    else delete navigator.clipboard;
  }
  return results;
}
