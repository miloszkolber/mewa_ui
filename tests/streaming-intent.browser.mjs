import assert from 'node:assert/strict';

// The reader must be able to leave a live transcript through native input while
// text-node updates and new blocks continue. This helper owns no browser/server.
export async function inspectStreamingIntent(page, baseUrl, assetRoot = '/dist/mewa-ui') {
  const checks = [];
  const state = () =>
    page.evaluate(() => {
      const { root, viewport, content, jump, ticks, events } = window.__streamingIntent;
      return {
        top: viewport.scrollTop,
        height: viewport.scrollHeight,
        end: viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop,
        pinned: root.dataset.pinned,
        jumpHidden: jump.hidden,
        focus: document.activeElement.id,
        length: content.textContent.length,
        ticks,
        fonts: document.fonts.status,
        events: events.slice()
      };
    });
  const fresh = async ({
    enhanced = true,
    defaultPinned = true,
    threshold = null,
    zoom = 1
  } = {}) => {
    await page.goto(`${baseUrl}/blank`);
    await page.evaluate(
      async ({ assetRoot, enhanced, defaultPinned, threshold, zoom }) => {
        await Promise.all(
          ['base', 'tokens', 'message-scroller'].map(
            (name) =>
              new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = `${assetRoot}/css/${name}.css`;
                link.onload = resolve;
                link.onerror = reject;
                document.head.append(link);
              })
          )
        );
        document.body.innerHTML = `<main style="max-width:640px;margin:24px auto;zoom:${zoom}">
          <h1>Streamed conversation</h1><section id="streaming-owner">
          <section class="message-scroller" id="streaming-log" data-default-pinned="${defaultPinned}" data-conversation-key="one">
          <h2 class="message-scroller-label" id="streaming-heading">Conversation</h2>
           <div class="message-scroller-viewport" id="streaming-viewport" style="max-height:${zoom > 1 ? 256 : 384}px" tabindex="0" role="log" aria-live="off" aria-labelledby="streaming-heading">
          <ol class="message-scroller-content"></ol></div>
          <button class="message-scroller-jump" data-message-scroller-jump type="button" aria-controls="streaming-viewport" hidden>Jump to latest</button>
          </section></section><button id="outside-stream" type="button">Outside transcript</button></main>`;
        const root = document.querySelector('.message-scroller');
        if (threshold !== null) root.dataset.threshold = threshold;
        const viewport = root.querySelector('.message-scroller-viewport');
        const content = root.querySelector('.message-scroller-content');
        const jump = root.querySelector('button');
        const sentence =
          'The release owner records the observation window. The reader can inspect earlier decisions while new text arrives. ';
        for (let i = 0; i < 16; i++) {
          const row = document.createElement('li');
          row.className = 'message-scroller-entry';
          const paragraph = document.createElement('p');
          paragraph.textContent = `${i + 1}. ${sentence.repeat(2)}`;
          row.append(paragraph);
          content.append(row);
        }
        // Start font/layout resolution for this fixture before mounting or
        // measuring native scrolling; an empty /blank page does not use fonts.
        viewport.getBoundingClientRect();
        await document.fonts.ready;
        const events = [];
        const record = (kind, extra = {}) => {
          if (events.length < 1000)
            events.push({
              kind,
              at: performance.now(),
              top: viewport.scrollTop,
              end: viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop,
              pinned: root.dataset.pinned,
              ...extra
            });
        };
        const value = {
          root,
          viewport,
          content,
          jump,
          events,
          ticks: 0,
          timer: null,
          stop() {
            clearInterval(value.timer);
            value.timer = null;
          },
          start() {
            value.stop();
            let paragraph = content.lastElementChild.firstElementChild;
            value.timer = setInterval(() => {
              value.ticks++;
              paragraph.firstChild.appendData(sentence);
              if (value.ticks % 4 === 0) {
                paragraph = document.createElement('p');
                paragraph.textContent = 'New observation. ';
                content.lastElementChild.append(paragraph);
              }
            }, 16);
          }
        };
        window.__streamingIntent = value;
        if (enhanced) {
          const { createController } = await import(`${assetRoot}/index.js`);
          const { behavior } = await import(`${assetRoot}/components/message-scroller.js`);
          value.createController = createController;
          value.behavior = behavior;
          value.controller = createController(behavior, document.querySelector('#streaming-owner'));
        }
        viewport.addEventListener('wheel', (event) =>
          record('wheel', {
            trusted: event.isTrusted,
            deltaY: event.deltaY,
            deltaX: event.deltaX,
            ctrl: event.ctrlKey,
            shift: event.shiftKey
          })
        );
        viewport.addEventListener('keydown', (event) =>
          record('keydown', { trusted: event.isTrusted, key: event.key, target: event.target.id })
        );
        viewport.addEventListener('scroll', () => record('scroll'));
        viewport.addEventListener('scrollend', () => record('scrollend'));
        for (const kind of ['pointerdown', 'pointerup', 'pointercancel'])
          viewport.addEventListener(kind, (event) =>
            record(kind, {
              trusted: event.isTrusted,
              target: event.target.id,
              pointerId: event.pointerId,
              pointerType: event.pointerType,
              button: event.button,
              x: event.clientX,
              y: event.clientY
            })
          );
        root.addEventListener('message-scroller:pinned-change', (event) =>
          record('pin', { pinned: event.detail.pinned })
        );
      },
      { assetRoot, enhanced, defaultPinned, threshold, zoom }
    );
  };
  const start = () => page.evaluate(() => window.__streamingIntent.start());
  const stop = () => page.evaluate(() => window.__streamingIntent.stop());
  const point = async (selector = '#streaming-viewport') => {
    const bounds = await page.$eval(selector, (el) => {
      const r = el.getBoundingClientRect();
      return { x: Math.floor(r.x + r.width / 2), y: Math.floor(r.y + r.height / 2) };
    });
    await page.mouse.move(bounds.x, bounds.y);
  };
  const away = () =>
    page.waitForFunction(() => {
      const { root, viewport } = window.__streamingIntent;
      return (
        root.dataset.pinned === 'false' &&
        viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop > 24
      );
    });
  const end = () =>
    page.waitForFunction(() => {
      const { root, viewport } = window.__streamingIntent;
      return (
        root.dataset.pinned === 'true' &&
        viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= 24
      );
    });
  const stablePosition = async () => {
    await page.evaluate(() => {
      const s = window.__streamingIntent;
      s.stability = { top: s.viewport.scrollTop, frames: 0 };
    });
    // BiDi wheel actions in Firefox can move the viewport without scrollend.
    // Observe unchanged rendered positions after confirmed native progress.
    await page.waitForFunction(() => {
      const s = window.__streamingIntent;
      const top = s.viewport.scrollTop;
      s.stability.frames = top === s.stability.top ? s.stability.frames + 1 : 0;
      s.stability.top = top;
      return s.stability.frames >= 3;
    });
  };
  const scrollbarPoint = () =>
    page.$eval('#streaming-viewport', (viewport) => {
      const r = viewport.getBoundingClientRect();
      const gutter = viewport.offsetWidth - viewport.clientWidth;
      return {
        x: Math.floor(r.right - gutter / 2),
        trackY: Math.floor(r.top + 70),
        thumbY: Math.floor(r.bottom - 20),
        dragY: Math.floor(r.top + 120),
        outsideX: Math.floor(r.left + r.width / 2),
        gutter,
        bounds: { left: r.left, top: r.top, width: r.width, height: r.height }
      };
    });
  const nativeBarAction = async (action, bounds) => {
    const drag = action.startsWith('drag');
    await page.mouse.move(bounds.x, drag ? bounds.thumbY : bounds.trackY);
    await page.mouse.down();
    if (drag) await page.mouse.move(bounds.x, bounds.dragY, { steps: 10 });
    if (action === 'drag-outside')
      await page.mouse.move(bounds.outsideX, bounds.bounds.top - 20, { steps: 3 });
    await page.mouse.up();
  };
  const expectGrowthAway = async (before, name) => {
    await page.waitForFunction(
      (ticks) => window.__streamingIntent.ticks >= ticks + 12,
      {},
      before.ticks
    );
    const after = await state();
    assert.equal(after.pinned, 'false', `${name}: growing text does not repin the reader`);
    assert.ok(after.top < before.top - 24, `${name}: native input makes upward progress`);
    assert.ok(
      after.length > before.length && after.height > before.height,
      `${name}: real content grows`
    );
    assert.equal(after.jumpHidden, false);
    return after;
  };
  const inspectDeparture = async () => {
    await fresh();
    await point();
    await start();
    const initial = await state();
    assert.equal(initial.fonts, 'loaded');
    await page.waitForFunction(
      (ticks) => window.__streamingIntent.ticks >= ticks + 12,
      {},
      initial.ticks
    );
    assert.equal((await state()).pinned, 'true');
    assert.ok((await state()).end <= 24, 'rapid growth stays at the live edge without user input');
    assert.equal((await state()).focus, initial.focus, 'streaming does not move focus');
    const beforeWheel = await state();
    await page.mouse.wheel({ deltaY: -580 });
    await away();
    const afterWheel = await expectGrowthAway(beforeWheel, 'trusted wheel during a 16 ms stream');
    assert.ok(afterWheel.events.some((event) => event.kind === 'wheel' && event.trusted));
    await stop();
    checks.push('trusted upward wheel yields while text nodes and new blocks keep growing');

    for (const key of ['PageUp', 'Home', 'ArrowUp', 'Shift+Space']) {
      await fresh();
      await page.focus('#streaming-viewport');
      await start();
      const beforeKey = await state();
      // Repeated native ArrowUp crosses the documented near-edge tolerance.
      if (key === 'Shift+Space') {
        await page.keyboard.down('Shift');
        await page.keyboard.press(' ');
        await page.keyboard.up('Shift');
      } else await page.keyboard.press(key);
      if (key === 'ArrowUp') {
        await page.keyboard.press(key);
        await page.keyboard.press(key);
      }
      await away();
      const afterKey = await expectGrowthAway(beforeKey, key);
      assert.ok(
        afterKey.events.some(
          (event) =>
            event.kind === 'keydown' &&
            event.trusted &&
            event.key === (key === 'Shift+Space' ? ' ' : key)
        )
      );
      await stop();
      await page.keyboard.press('End');
      await end();
      const atEnd = await state();
      await start();
      await page.waitForFunction(
        (ticks) => window.__streamingIntent.ticks >= ticks + 8,
        {},
        atEnd.ticks
      );
      assert.equal((await state()).pinned, 'true', 'native End re-arms following');
      await stop();
    }
    checks.push(
      'native PageUp, Home, ArrowUp, Shift+Space and End preserve scroll progress and return'
    );
  };

  const inspectNativeBars = async () => {
    // Judge bar availability from the measured gutter rather than the launch
    // flag, because a profile can ask for visible bars and still render overlay
    // scrollbars that no reader can operate.
    if (!(await page.$eval('#streaming-viewport', (el) => el.offsetWidth - el.clientWidth > 0))) {
      console.info(
        'Native scrollbar checks not executed: this profile renders no native scrollbar gutter.'
      );
      return;
    }
    // A track click must also move a scroller that this module does not touch.
    // Without that control, a failed track case cannot be told apart from an
    // engine or environment that performs no native scrollbar gesture at all.
    await fresh({ enhanced: false });
    await page.evaluate(() => {
      const { viewport } = window.__streamingIntent;
      viewport.scrollTop = viewport.scrollHeight;
    });
    await stablePosition();
    const controlBounds = await scrollbarPoint();
    const controlTop = (await state()).top;
    await nativeBarAction('track', controlBounds);
    const controlMoved = await page
      .waitForFunction(
        (top) => window.__streamingIntent.viewport.scrollTop < top - 24,
        { timeout: 5000 },
        controlTop
      )
      .then(() => true)
      .catch(() => false);
    if (!controlMoved) {
      console.info(
        'Native scrollbar checks not executed: a controller-free scroller does not move on a native track action here.'
      );
      return;
    }
    {
      for (const action of ['track', 'drag', 'drag-outside']) {
        let controlBounds;
        for (const mode of ['paused', 'released-stream', 'enhanced-stream']) {
          await fresh();
          await end();
          const bounds = await scrollbarPoint();
          assert.ok(bounds.gutter > 0, 'native bar control has an actual gutter');
          if (controlBounds) assert.deepEqual(bounds.bounds, controlBounds);
          else controlBounds = bounds.bounds;
          if (mode === 'released-stream')
            await page.evaluate(() => window.__streamingIntent.controller.destroy());
          if (mode !== 'paused') await start();
          const before = await state();
          await nativeBarAction(action, bounds);
          await page.waitForFunction(
            (top) => window.__streamingIntent.viewport.scrollTop < top - 24,
            {},
            before.top
          );
          if (mode === 'enhanced-stream') {
            await away();
            await expectGrowthAway(before, `native ${action} during a 16 ms stream`);
          } else if (mode === 'released-stream') {
            await page.waitForFunction(() => window.__streamingIntent.ticks >= 12);
            assert.equal((await state()).pinned, undefined);
            assert.ok((await state()).height > before.height, 'released control keeps growing');
          }
          const after = await state();
          assert.ok(
            after.events.some(
              (event) =>
                event.kind === 'pointerdown' &&
                event.trusted &&
                event.target === 'streaming-viewport' &&
                event.pointerType === 'mouse'
            ),
            `${action}/${mode}: actual native bar receives trusted input`
          );
          await stop();
        }
      }
      checks.push(
        'native track and thumb drag depart during 16 ms growth with progressing controls'
      );

      // Hover is not input, and a stationary thumb press is not departure.
      await fresh();
      const hover = await scrollbarPoint();
      await page.mouse.move(hover.x, hover.trackY);
      await start();
      await page.waitForFunction(() => window.__streamingIntent.ticks >= 8);
      assert.ok((await state()).end <= 24, 'gutter hover does not suspend following');
      await stop();
      await fresh();
      const stationary = await scrollbarPoint();
      await page.mouse.move(stationary.x, stationary.thumbY);
      await page.mouse.down();
      const held = await state();
      await page.evaluate(() => {
        const s = window.__streamingIntent;
        const owner = s.events.findLast((event) => event.kind === 'pointerdown').pointerId;
        // Deliberately untrusted negative checks, not multi-device acceptance.
        for (const kind of ['pointerdown', 'pointerup', 'pointercancel'])
          s.viewport.dispatchEvent(
            new PointerEvent(kind, {
              bubbles: true,
              pointerId: owner + 10,
              pointerType: 'touch',
              isPrimary: false,
              button: 0
            })
          );
      });
      await start();
      await page.waitForFunction(() => window.__streamingIntent.ticks >= 8);
      // A held press with no native movement expresses no scroll. Pin state stays
      // position-derived, so following keeps the live edge instead of freezing an
      // absolute position. A rejected gutter lease asserted the frozen position
      // here; genuine native actions own departure and are asserted above.
      const heldGrowth = await state();
      assert.equal(heldGrowth.pinned, 'true', 'a press without native movement keeps following');
      assert.ok(heldGrowth.end <= 24, 'a press without native movement keeps the live edge');
      assert.ok(heldGrowth.height > held.height, 'the held press still observes real growth');
      await page.mouse.up();
      await page.waitForFunction(() => window.__streamingIntent.ticks >= 20);
      assert.equal((await state()).pinned, 'true');
      assert.ok((await state()).end <= 24, 'a motionless thumb release keeps following');
      assert.equal((await state()).jumpHidden, true);
      await stop();

      await fresh();
      await page.evaluate(() => {
        window.__streamingIntent.viewport.addEventListener(
          'pointerdown',
          (event) => event.preventDefault(),
          { once: true }
        );
      });
      const canceledBar = await scrollbarPoint();
      await nativeBarAction('track', canceledBar);
      await stablePosition();
      const canceledPosition = await state();
      await start();
      await page.waitForFunction(() => window.__streamingIntent.ticks >= 12);
      const canceledGrowth = await state();
      assert.equal(
        canceledGrowth.pinned,
        canceledPosition.end <= 24 ? 'true' : 'false',
        'late-canceled bar input retains actual native position authority'
      );
      if (canceledPosition.end <= 24)
        assert.ok(canceledGrowth.end <= 24, 'canceled no-motion bar input releases suspension');
      else assert.equal(canceledGrowth.top, canceledPosition.top);
      await stop();
      checks.push(
        'native bar hover, no-progress thumb release and late cancellation restore ownership'
      );

      for (const kind of ['pointercancel', 'lostpointercapture', 'blur']) {
        await fresh();
        const bounds = await scrollbarPoint();
        await page.mouse.move(bounds.x, bounds.thumbY);
        await page.mouse.down();
        await start();
        await page.waitForFunction(() => window.__streamingIntent.ticks >= 4);
        await page.evaluate((kind) => {
          const s = window.__streamingIntent;
          const owner = s.events.findLast((event) => event.kind === 'pointerdown').pointerId;
          // Exercise cleanup delivery explicitly. These interruption events are
          // synthetic; the initial bar press and eventual release are native.
          if (kind === 'blur') window.dispatchEvent(new Event('blur'));
          else
            s.viewport.dispatchEvent(
              new PointerEvent(kind, { bubbles: true, pointerId: owner, pointerType: 'mouse' })
            );
        }, kind);
        await page.mouse.up();
        await page.waitForFunction(() => window.__streamingIntent.ticks >= 16);
        assert.equal((await state()).pinned, 'true', `${kind}: following re-arms`);
        assert.ok(
          (await state()).end <= 24,
          `${kind}: interruption does not leak a bar suspension`
        );
        await stop();
      }

      await fresh();
      const releasedBounds = await scrollbarPoint();
      await page.mouse.move(releasedBounds.x, releasedBounds.thumbY);
      await page.mouse.down();
      await page.evaluate(() => {
        const s = window.__streamingIntent;
        s.root.remove();
        s.controller.destroy();
        s.controller.destroy();
        document.querySelector('#streaming-owner').append(s.root);
        s.root.dataset.pinned = 'application';
      });
      await page.mouse.up();
      await stablePosition();
      const disposedBar = await state();
      await start();
      await page.waitForFunction(() => window.__streamingIntent.ticks >= 12);
      assert.equal(
        (await state()).pinned,
        'application',
        'pending bar cleanup releases document listeners'
      );
      assert.equal(
        (await state()).top,
        disposedBar.top,
        'disposed bar frame does not resume following'
      );
      assert.equal((await state()).jumpHidden, true);
      await stop();
      await page.evaluate(() => {
        const s = window.__streamingIntent;
        s.root.dataset.defaultPinned = 'false';
        s.remount = s.createController(s.behavior, s.root);
        s.controller.destroy();
        s.events.length = 0;
      });
      await page.focus('.message-scroller-jump');
      await page.keyboard.press('Enter');
      await end();
      assert.equal((await state()).events.filter((event) => event.kind === 'pin').length, 1);
      await page.evaluate(() => window.__streamingIntent.remount.destroy());
      checks.push(
        'bar owner ignores other pointers; interruption handlers and pending detached cleanup release'
      );
    }
  };

  try {
    await inspectDeparture();
    for (const zoom of [1, 2]) {
      for (const deltaY of [-1, -8]) {
        await fresh({ zoom });
        await point();
        const beforeTiny = await state();
        await page.mouse.wheel({ deltaY });
        await page.waitForFunction(
          (top) => window.__streamingIntent.viewport.scrollTop < top,
          {},
          beforeTiny.top
        );
        await stablePosition();
        const tiny = await state();
        assert.ok(tiny.events.some((event) => event.kind === 'wheel' && event.trusted));
        assert.ok(tiny.end > 0 && tiny.end <= 24);
        assert.equal(
          tiny.pinned,
          'true',
          `CSS zoom ${zoom}/${deltaY}: native movement stays pinned`
        );
        await start();
        await page.waitForFunction(() => window.__streamingIntent.ticks >= 12);
        const growing = await state();
        assert.ok(growing.height > tiny.height && growing.length > tiny.length);
        assert.equal(growing.pinned, 'true', `CSS zoom ${zoom}/${deltaY}: following resumes`);
        assert.ok(growing.end <= 24, `CSS zoom ${zoom}/${deltaY}: no silent follow suspension`);
        assert.equal(growing.jumpHidden, true);
        await stop();
      }
    }
    await fresh();
    await point();
    await page.mouse.wheel({ deltaY: -580 });
    await away();
    await page.focus('.message-scroller-jump');
    await page.keyboard.press('Enter');
    await end();
    assert.equal(
      (await state()).focus,
      'streaming-viewport',
      'native jump returns focus before hiding'
    );
    checks.push('trusted -1/-8 wheel resumes at CSS zoom 1/2 and jump returns focus');

    for (const [threshold, pinned] of [
      ['64', 'true'],
      ['24', 'false'],
      ['0', 'false']
    ]) {
      await fresh({ threshold });
      await point();
      const before = await state();
      await page.mouse.wheel({ deltaY: -32 });
      await page.waitForFunction(
        (top) => window.__streamingIntent.viewport.scrollTop < top - 24,
        {},
        before.top
      );
      assert.equal(
        (await state()).pinned,
        pinned,
        `${threshold}: positive thresholds configure tolerance; zero retains the 24 px default`
      );
      await stablePosition();
      const thresholdPosition = await state();
      await start();
      await page.waitForFunction(() => window.__streamingIntent.ticks >= 12);
      const thresholdGrowth = await state();
      assert.equal(thresholdGrowth.pinned, pinned);
      assert.equal(thresholdGrowth.jumpHidden, pinned === 'true');
      if (pinned === 'true')
        assert.ok(thresholdGrowth.end <= 64, 'configured tolerance resumes following');
      else
        assert.equal(
          thresholdGrowth.top,
          thresholdPosition.top,
          'default tolerance preserves departure'
        );
      await stop();
    }
    checks.push('configured near-edge tolerance and invalid-threshold default');

    await fresh();
    const beforeResize = await state();
    await page.evaluate(() => {
      window.__streamingIntent.content.lastElementChild.style.minHeight = '600px';
    });
    await page.waitForFunction(
      (height) => {
        const { viewport } = window.__streamingIntent;
        return (
          viewport.scrollHeight > height &&
          viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= 24
        );
      },
      {},
      beforeResize.height
    );
    await point();
    await page.mouse.wheel({ deltaY: -580 });
    await away();
    await stablePosition();
    const detachedResize = await state();
    await page.evaluate(() => {
      window.__streamingIntent.content.lastElementChild.style.minHeight = '800px';
    });
    await page.waitForFunction(
      (height) => window.__streamingIntent.viewport.scrollHeight > height,
      {},
      detachedResize.height
    );
    assert.equal(
      (await state()).top,
      detachedResize.top,
      'resize-only growth preserves an unpinned reading position'
    );
    assert.equal((await state()).pinned, 'false');
    checks.push('resize-only growth follows pinned content and leaves older content in place');

    await fresh();
    await page.evaluate(() => {
      const { content } = window.__streamingIntent;
      const nested = document.createElement('div');
      nested.id = 'nested-transcript';
      nested.tabIndex = 0;
      nested.style.cssText = 'height:80px;overflow:auto';
      const text = document.createElement('p');
      text.style.height = '600px';
      text.textContent = 'A nested independently scrollable excerpt.';
      nested.append(text);
      content.lastElementChild.append(nested);
      nested.scrollTop = nested.scrollHeight;
    });
    await end();
    await point('#nested-transcript');
    const nestedTop = await page.$eval('#nested-transcript', (el) => el.scrollTop);
    await page.mouse.wheel({ deltaY: -100 });
    await page.waitForFunction(
      (top) => document.querySelector('#nested-transcript').scrollTop < top,
      {},
      nestedTop
    );
    assert.equal(
      (await state()).pinned,
      'true',
      'nested native scrolling does not take the outer pin'
    );
    await page.evaluate(() => document.querySelector('#nested-transcript').remove());
    await point();
    await page.mouse.wheel({ deltaX: -100 });
    await start();
    await page.waitForFunction(() => window.__streamingIntent.ticks >= 8);
    assert.equal((await state()).pinned, 'true', 'horizontal wheel does not suspend following');
    assert.ok(
      (await state()).end <= 24,
      'horizontal input does not leave a silent follow suspension'
    );
    await stop();
    await fresh();
    await point();
    const zoomEnvironment = () =>
      page.evaluate(() => ({
        dpr: devicePixelRatio,
        width: innerWidth,
        height: innerHeight,
        visualScale: visualViewport?.scale,
        rootZoom: getComputedStyle(document.documentElement).zoom
      }));
    const originalEnvironment = await zoomEnvironment();
    try {
      await page.keyboard.down('Control');
      try {
        await page.mouse.wheel({ deltaY: -100 });
      } finally {
        await page.keyboard.up('Control');
      }
      await stablePosition();
      await start();
      await page.waitForFunction(() => window.__streamingIntent.ticks >= 8);
      const modified = await state();
      assert.ok(
        modified.events.some((event) => event.kind === 'wheel' && event.trusted && event.ctrl)
      );
      // Check this action before restoration; native input can zoom or scroll.
      assert.equal(
        modified.pinned,
        modified.end <= 24 ? 'true' : 'false',
        'Ctrl+wheel does not override native position authority'
      );
    } finally {
      await stop();
      const changedEnvironment = await zoomEnvironment();
      if (JSON.stringify(changedEnvironment) !== JSON.stringify(originalEnvironment)) {
        // Opposite native input restores the existing zoom, not an assumed 100%.
        // Ctrl+0 is not reliable through Firefox's native input transport.
        await point();
        await page.keyboard.down('Control');
        try {
          await page.mouse.wheel({ deltaY: 100 });
        } finally {
          await page.keyboard.up('Control');
        }
        await page.waitForFunction(
          (original) =>
            devicePixelRatio === original.dpr &&
            innerWidth === original.width &&
            innerHeight === original.height &&
            visualViewport?.scale === original.visualScale &&
            getComputedStyle(document.documentElement).zoom === original.rootZoom,
          {},
          originalEnvironment
        );
      }
      assert.deepEqual(await zoomEnvironment(), originalEnvironment, 'modifier test restores zoom');
    }
    await fresh();
    await point();
    await page.keyboard.down('Shift');
    await page.mouse.wheel({ deltaY: -100 });
    await page.keyboard.up('Shift');
    await start();
    await page.waitForFunction(() => window.__streamingIntent.ticks >= 8);
    const modified = await state();
    assert.ok(
      modified.events.some((event) => event.kind === 'wheel' && event.trusted && event.shift)
    );
    assert.equal(
      modified.pinned,
      modified.end <= 24 ? 'true' : 'false',
      'Shift+wheel does not override native position authority'
    );
    await stop();
    await fresh();
    await page.evaluate(() => {
      const input = document.createElement('input');
      input.id = 'transcript-input';
      input.setAttribute('aria-label', 'Example editing control');
      input.value = 'Keep this draft';
      window.__streamingIntent.content.lastElementChild.append(input);
    });
    await page.focus('#transcript-input');
    await page.keyboard.press('PageUp');
    await start();
    await page.waitForFunction(() => window.__streamingIntent.ticks >= 16);
    assert.equal((await state()).pinned, 'true', 'editing PageUp does not claim viewport intent');
    assert.ok((await state()).end <= 24, 'editing keys retain live-edge following');
    assert.equal(await page.$eval('#transcript-input', (input) => input.value), 'Keep this draft');
    await stop();
    checks.push(
      'nested scroll, horizontal/modified wheel and editing keys retain their native owner'
    );

    for (const input of ['wheel', 'keydown']) {
      await fresh();
      await page.evaluate((input) => {
        window.__streamingIntent.viewport.addEventListener(
          input,
          (event) => event.preventDefault(),
          { once: true }
        );
      }, input);
      await start();
      if (input === 'wheel') {
        await point();
        await page.mouse.wheel({ deltaY: -580 });
      } else {
        await page.focus('#streaming-viewport');
        await page.keyboard.press('PageUp');
      }
      await page.waitForFunction(() => window.__streamingIntent.ticks >= 12);
      const canceled = await state();
      assert.equal(canceled.pinned, 'true', 'later cancellation retains position-derived pinning');
      assert.ok(canceled.end <= 24, 'later cancellation releases pending input suspension');
      await stop();
    }
    checks.push('a later canceling input listener leaves following active');

    await fresh({ defaultPinned: false });
    const unpinned = await state();
    assert.equal(unpinned.top, 0);
    assert.equal(unpinned.pinned, 'false');
    await page.evaluate(() => window.__streamingIntent.controller.update());
    await start();
    await page.waitForFunction(() => window.__streamingIntent.ticks >= 8);
    assert.equal((await state()).top, 0, 'update preserves the initial reading position');
    await page.evaluate(() => {
      window.__streamingIntent.root.dataset.conversationKey = 'two';
    });
    await end();
    await stop();
    await page.evaluate(async () => {
      const s = window.__streamingIntent;
      s.root.remove();
      s.content.lastElementChild.firstElementChild.firstChild.appendData(
        'Pending growth before destroy.'
      );
      await Promise.resolve();
      s.controller.destroy();
      s.controller.destroy();
      document.querySelector('main').append(s.root);
      s.viewport.scrollTop = 120;
      s.root.dataset.pinned = 'application';
      s.root.dataset.conversationKey = 'three';
      s.content.lastElementChild.firstElementChild.firstChild.appendData('Growth after release.');
    });
    await page.focus('#streaming-viewport');
    await page.keyboard.press('End');
    await page.waitForFunction(() => {
      const { viewport, events } = window.__streamingIntent;
      const key = [...events]
        .reverse()
        .find((event) => event.kind === 'keydown' && event.key === 'End');
      return (
        viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= 24 &&
        events.some((event) => event.kind === 'scrollend' && event.at >= key.at)
      );
    });
    await point();
    await page.mouse.wheel({ deltaY: -580 });
    await page.waitForFunction(
      () =>
        window.__streamingIntent.viewport.scrollHeight -
          window.__streamingIntent.viewport.clientHeight -
          window.__streamingIntent.viewport.scrollTop >
        24
    );
    await stablePosition();
    assert.equal(
      (await state()).pinned,
      'application',
      'released input listeners do not rewrite application state outside the old root'
    );
    assert.equal((await state()).jumpHidden, true);
    await page.evaluate(() => {
      const s = window.__streamingIntent;
      s.root.dataset.defaultPinned = 'false';
      s.remount = s.createController(s.behavior, s.root);
      s.controller.destroy();
      s.events.length = 0;
    });
    await page.focus('.message-scroller-jump');
    await page.keyboard.press('Enter');
    await end();
    assert.equal(
      (await state()).events.filter((event) => event.kind === 'pin').length,
      1,
      'remount acquires one current generation'
    );
    await page.evaluate(() => window.__streamingIntent.remount.destroy());
    checks.push(
      'default-unpinned/update, conversation reset, detached cleanup and remount generation'
    );

    await fresh({ enhanced: false });
    await page.focus('#streaming-viewport');
    await page.keyboard.press('End');
    await page.waitForFunction(
      () =>
        window.__streamingIntent.viewport.scrollHeight -
          window.__streamingIntent.viewport.clientHeight -
          window.__streamingIntent.viewport.scrollTop <=
        24
    );
    await point();
    const native = await state();
    await page.mouse.wheel({ deltaY: -580 });
    await page.waitForFunction(
      (top) => window.__streamingIntent.viewport.scrollTop < top - 24,
      {},
      native.top
    );
    assert.equal((await state()).pinned, undefined);
    assert.equal((await state()).jumpHidden, true);
    checks.push('module-absent native log remains scrollable with no inactive jump action');
    await inspectNativeBars();
  } catch (error) {
    error.streamingChecks = checks.slice();
    throw error;
  } finally {
    await page.evaluate(() => {
      const s = window.__streamingIntent;
      s?.stop();
      s?.remount?.destroy();
      s?.controller?.destroy();
    });
  }
  return checks;
}
