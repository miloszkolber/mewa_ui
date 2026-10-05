import assert from 'node:assert/strict';

/** Exercise acquired children after they leave a packaged controller's region. */
export async function inspectControllerRemoval(page, baseUrl) {
  for (const phase of ['initial', 'update']) {
    await page.goto(`${baseUrl}/blank`);
    await page.evaluate(async (phase) => {
      const { createController } = await import('/dist/mewa-ui/index.js');
      const { behavior: composer } = await import('/dist/mewa-ui/components/composer.js');
      const { behavior: scroller } = await import('/dist/mewa-ui/components/message-scroller.js');
      document.body.innerHTML =
        '<section id="removal-owner"></section><section id="removal-other"></section><section id="removal-destination"></section>';
      const owner = document.querySelector('#removal-owner');
      const children = document.createElement('div');
      children.innerHTML =
        '<form class="composer" data-submit-on="mod-enter"><label for="removal-draft">Draft</label><textarea class="composer-input" id="removal-draft">Keep this draft</textarea><button type="submit">Send</button></form><section class="message-scroller" data-conversation-key="one"><div class="message-scroller-viewport" tabindex="0" style="height:80px;overflow:auto"><div class="message-scroller-content"><p style="height:600px">Keep this transcript</p></div></div><button type="button" data-message-scroller-jump>Jump</button></section>';
      if (phase === 'initial') owner.append(children);
      const formController = createController(composer, owner);
      const scrollController = createController(scroller, owner);
      if (phase === 'update') {
        owner.append(children);
        formController.update();
        scrollController.update();
      }
      window.__removal = {
        submissions: 0,
        siblingSubmissions: 0,
        createController,
        composer,
        children
      };
      children.querySelector('form').addEventListener('submit', (event) => {
        event.preventDefault();
        window.__removal.submissions++;
      });
      const other = document.querySelector('#removal-other');
      other.innerHTML =
        '<form class="composer" data-submit-on="mod-enter"><label for="removal-sibling">Other draft</label><textarea class="composer-input" id="removal-sibling">Other draft</textarea><button type="submit">Send</button></form>';
      other.querySelector('form').addEventListener('submit', (event) => {
        event.preventDefault();
        window.__removal.siblingSubmissions++;
      });
      window.__removal.sibling = createController(composer, other);
      children.remove();
      formController.destroy();
      scrollController.destroy();
      formController.destroy();
      document.querySelector('#removal-destination').append(children);
    }, phase);
    assert.equal(
      await page.$$eval(
        '#removal-destination [data-mewa-composer-init],#removal-destination [data-mewa-message-scroller-init]',
        (els) => els.length
      ),
      0,
      `${phase}: detached acquired generations release their markers`
    );
    await page.focus('#removal-draft');
    await page.keyboard.down('Control');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Control');
    assert.equal(
      await page.evaluate(() => window.__removal.submissions),
      0,
      `${phase}: disposed Composer no longer submits on trusted modifier Enter`
    );
    const scrolled = await page.evaluate(async () => {
      const root = document.querySelector('#removal-destination .message-scroller');
      const viewport = root.querySelector('.message-scroller-viewport');
      viewport.scrollTop = 20;
      root.dataset.pinned = 'application';
      root.dataset.conversationKey = 'two';
      root
        .querySelector('.message-scroller-content')
        .append(document.createTextNode('More application text'));
      root.querySelector('[data-message-scroller-jump]').click();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return {
        position: viewport.scrollTop,
        pinned: root.dataset.pinned,
        transcript: root.textContent
      };
    });
    assert.equal(
      scrolled.position,
      20,
      `${phase}: disposed scroll listeners and observers do not follow mutations or Jump`
    );
    assert.equal(
      scrolled.pinned,
      'application',
      `${phase}: disposed observers do not rewrite application state`
    );
    assert.match(scrolled.transcript, /Keep this transcript/);
    assert.equal(await page.$eval('#removal-draft', (el) => el.value), 'Keep this draft');
    await page.focus('#removal-sibling');
    await page.keyboard.down('Control');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Control');
    assert.equal(
      await page.evaluate(() => window.__removal.siblingSubmissions),
      1,
      `${phase}: a live sibling owner retains its behavior`
    );
    await page.evaluate(() => {
      const state = window.__removal;
      state.remount = state.createController(state.composer, state.children);
    });
    await page.focus('#removal-draft');
    await page.keyboard.down('Control');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Control');
    assert.equal(
      await page.evaluate(() => window.__removal.submissions),
      1,
      `${phase}: remount submits exactly once`
    );
    await page.evaluate(() => {
      window.__removal.remount.destroy();
      window.__removal.sibling.destroy();
      delete window.__removal;
    });
  }
  console.log(
    'PASS packaged initial/update controller removal, observer quiescence, sibling ownership and remount'
  );
}
