// Standalone Puppeteer check. The server only needs docs/icons.js and library/src/icons/.
export async function inspectDocsIcons(page, baseUrl) {
  // Establish the site's origin without booting either documentation application.
  await page.goto(`${baseUrl}/docs/icons.js`);
  const result = await page.evaluate(async (scriptUrl) => {
    document.body.replaceChildren();
    const assert = (condition, message) => {
      if (!condition) throw new Error(message);
    };
    const fixture = document.createElement('div');
    fixture.innerHTML = `<svg id="authored" class="ri-heart-line" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g class="ri-search-line"><path d="M1 2 L3 4Z"></path></g><foreignObject><i xmlns="http://www.w3.org/1999/xhtml" class="ri-star-line"></i></foreignObject></svg>
      <span id="text" class="ri-heart-line">Authored label</span>
      <span id="space" class="ri-heart-line"> </span>
      <span id="comment" class="ri-heart-line"><!-- authored --></span>
      <i id="hook" class="ri-heart-line" aria-hidden="true"></i>
      <span id="duplicate" class="other\tri-heart-line"></span>`;
    document.body.append(fixture);
    const authored = fixture.querySelector('#authored');
    const original = authored.outerHTML;
    const preserved = ['text', 'space', 'comment'].map((id) => fixture.querySelector(`#${id}`));
    const before = preserved.map((el) => el.outerHTML);
    const requests = [];
    const waiting = new Map();
    const nativeFetch = window.fetch;
    const mockSvg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L1 1"/></svg>';
    window.fetch = (url, options) => {
      const name = new URL(url).pathname
        .split('/')
        .pop()
        .replace(/\.svg$/, '');
      requests.push(name);
      if (name.startsWith('docs-wait-'))
        return new Promise((resolve) => waiting.set(name, () => resolve(new Response(mockSvg))));
      if (name.startsWith('docs-fail-')) {
        if (requests.filter((value) => value === name).length === 1) {
          if (name.endsWith('network')) return Promise.reject(new TypeError('Offline'));
          if (name.endsWith('http')) return Promise.resolve(new Response('', { status: 503 }));
          return Promise.resolve(new Response('<html>Not an SVG</html>'));
        }
        return Promise.resolve(new Response(mockSvg));
      }
      return nativeFetch(url, options);
    };
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Unable to load docs/icons.js'));
        document.head.append(script);
      });
      const { enhance } = window.mewaDocsIcons;
      await enhance(fixture);
      assert(authored.outerHTML === original, 'Authored SVG bytes and path must stay intact');
      assert(
        preserved.every((el, i) => el.outerHTML === before[i]),
        'Nonempty HTML stays intact'
      );
      assert(requests.length === 1 && requests[0] === 'heart-line', 'Cache fetches by glyph');
      const hook = fixture.querySelector('#hook');
      const injected = hook.firstChild;
      assert(
        injected?.localName === 'svg' && injected.querySelector('path'),
        'Real local SVG loads'
      );
      assert(hook.dataset.docsIconLoaded === 'heart-line', 'Successful owned host carries glyph');
      await enhance(hook);
      await enhance(fixture);
      assert(hook.firstChild === injected && hook.childNodes.length === 1, 'Render exactly once');
      assert(!fixture.querySelector('svg svg'), 'Never nest SVGs');
      assert(
        fixture.querySelectorAll('[data-docs-icon-loaded]').length === 2,
        'Stamp owned hosts only'
      );

      const clone = fixture.cloneNode(true);
      for (const el of clone.querySelectorAll('[data-docs-icon-loaded]')) {
        el.replaceChildren();
        el.removeAttribute('data-docs-icon-loaded');
      }
      assert(
        clone.querySelector('#authored').outerHTML === original,
        'Cleanup preserves authored SVG'
      );
      assert(clone.querySelector('#hook').innerHTML === '', 'Cleanup emits the empty class hook');
      assert(!clone.querySelector('[data-docs-icon-loaded]'), 'Cleanup removes runtime markers');

      const add = (name) => {
        const el = document.createElement('span');
        el.className = `ri-${name}`;
        fixture.append(el);
        return el;
      };
      const scope = add('heart-line');
      scope.innerHTML = '<i class="ri-heart-line"></i>';
      await enhance(scope);
      assert(!scope.hasAttribute('data-docs-icon-loaded'), 'Nonempty root is not an icon host');
      assert(
        scope.firstChild.firstChild?.localName === 'svg',
        'Matching root does not exclude descendants'
      );

      const invalidCount = requests.length;
      for (const name of [
        '../heart-line',
        'a/../../heart-line',
        '%2e%2e%2fheart-line',
        'heart-line?x',
        'heart-line#x',
        'heart_line',
        ''
      ]) {
        const el = add(name);
        await enhance(el);
        assert(
          !el.hasChildNodes() && !el.hasAttribute('data-docs-icon-loaded'),
          'Reject unsafe glyph name'
        );
      }
      assert(requests.length === invalidCount, 'Unsafe glyphs never reach fetch');

      const variant = add('docs-wait-line');
      const oldLoad = enhance(variant);
      variant.className = 'ri-docs-wait-fill';
      const newLoad = enhance(variant);
      waiting.get('docs-wait-fill')();
      await newLoad;
      const latest = variant.firstChild;
      waiting.get('docs-wait-line')();
      await oldLoad;
      assert(
        variant.dataset.docsIconLoaded === 'docs-wait-fill' && variant.firstChild === latest,
        'Latest variant wins out-of-order responses'
      );
      variant.className = 'ri-heart-line';
      await enhance(variant);
      assert(
        variant.dataset.docsIconLoaded === 'heart-line',
        'Explicit enhancement updates loaded hosts'
      );
      variant.className = 'ri-docs-wait-revert';
      const revertLoad = enhance(variant);
      variant.className = 'ri-heart-line';
      await enhance(variant);
      waiting.get('docs-wait-revert')();
      await revertLoad;
      assert(
        variant.dataset.docsIconLoaded === 'heart-line',
        'Reverting to rendered glyph cancels stale work'
      );
      variant.removeAttribute('class');
      await enhance(fixture);
      assert(
        !variant.hasChildNodes() && !variant.hasAttribute('data-docs-icon-loaded'),
        'Removing the class releases only the injected glyph'
      );

      const detached = add('docs-wait-detached');
      const detachedLoad = enhance(detached);
      detached.remove();
      waiting.get('docs-wait-detached')();
      await detachedLoad;
      assert(!detached.hasChildNodes(), 'Detached hosts are not mutated by late responses');
      fixture.append(detached);
      await enhance(detached);
      assert(
        detached.dataset.docsIconLoaded === 'docs-wait-detached',
        'Reinserted host can load from cache'
      );

      const changed = add('docs-wait-changed');
      const changedLoad = enhance(changed);
      changed.className = 'ri-heart-fill';
      waiting.get('docs-wait-changed')();
      await changedLoad;
      assert(!changed.hasChildNodes(), 'Class change without enhancement rejects stale response');
      await enhance(changed);
      assert(
        changed.dataset.docsIconLoaded === 'heart-fill',
        'Subsequent explicit call loads current class'
      );

      const content = add('docs-wait-content');
      const contentLoad = enhance(content);
      content.textContent = 'Authored while loading';
      waiting.get('docs-wait-content')();
      await contentLoad;
      assert(
        content.textContent === 'Authored while loading' &&
          !content.hasAttribute('data-docs-icon-loaded'),
        'Late response preserves new authored content'
      );
      hook.textContent = 'Replaced owned glyph';
      await enhance(hook);
      assert(
        hook.textContent === 'Replaced owned glyph' && !hook.hasAttribute('data-docs-icon-loaded'),
        'Release ownership after authored replacement'
      );

      for (const failure of ['http', 'network', 'invalid']) {
        const name = `docs-fail-${failure}`;
        const el = add(name);
        await enhance(el);
        assert(
          !el.hasChildNodes() && !el.hasAttribute('data-docs-icon-loaded'),
          `${failure}: failure stays empty and unmarked`
        );
        await enhance(el);
        assert(el.dataset.docsIconLoaded === name, `${failure}: failed load can retry`);
        assert(
          requests.filter((value) => value === name).length === 2,
          `${failure}: failed cache entry is evicted`
        );
      }
      // Insertion-only lifecycle check: no explicit enhance call for this host.
      const inserted = add('heart-line');
      await new Promise((resolve) => {
        const observer = new MutationObserver(() => {
          if (!inserted.hasAttribute('data-docs-icon-loaded')) return;
          observer.disconnect();
          resolve();
        });
        observer.observe(inserted, { childList: true, attributes: true });
      });
      assert(inserted.childNodes.length === 1, 'Observer enhances inserted HTML once');
      assert(
        authored.outerHTML === original && !fixture.querySelector('svg svg'),
        'Authored SVG remains unchanged after observer work'
      );
      return { requests: requests.length, realGlyphs: ['heart-line', 'heart-fill'] };
    } finally {
      window.fetch = nativeFetch;
    }
  }, `${baseUrl}/docs/icons.js`);
  console.log('PASS docs icon ownership, cache, variants, retry and cleanup contract', result);
}
