import assert from 'node:assert/strict';

// Computed foreground/background contrast missed Chromium's automatic text
// backplate hiding this label. Inspect actual pixels inside the text range.
export async function inspectSkipLinkPaint(page, baseUrl, { capture } = {}) {
  if ((await page.browser().version()).toLowerCase().includes('firefox')) {
    console.log('SKIP forced-color skip-link paint: Firefox CDP emulation is unavailable');
    return [];
  }
  const cdp = await page.createCDPSession();
  const viewport = page.viewport();
  const records = [];
  const settle = () =>
    page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
  const paintedLabel = async (name) => {
    await settle();
    const bounds = await page.$eval('body > .skip-link', (link) => {
      const range = document.createRange();
      range.selectNodeContents(link);
      const box = range.getBoundingClientRect();
      return {
        focused: link === document.activeElement,
        text: link.textContent.trim(),
        forced: matchMedia('(forced-colors: active)').matches,
        range: { x: box.x, y: box.y, width: box.width, height: box.height }
      };
    });
    assert(bounds.focused && bounds.forced && bounds.text === 'Skip to content');
    const image = await page.screenshot({ encoding: 'base64' });
    const pixels = await page.evaluate(
      async ({ image, range }) => {
        const bitmap = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${image}`)).blob()
        );
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const context = canvas.getContext('2d');
        context.drawImage(bitmap, 0, 0);
        const scale = bitmap.width / innerWidth;
        const x = Math.ceil(range.x * scale) + 2;
        const y = Math.ceil(range.y * scale) + 2;
        const width = Math.floor(range.width * scale) - 4;
        const height = Math.floor(range.height * scale) - 4;
        const data = context.getImageData(x, y, width, height).data;
        const colors = new Set();
        const minimum = [255, 255, 255];
        const maximum = [0, 0, 0];
        for (let i = 0; i < data.length; i += 4) {
          colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
          for (let channel = 0; channel < 3; channel++) {
            minimum[channel] = Math.min(minimum[channel], data[i + channel]);
            maximum[channel] = Math.max(maximum[channel], data[i + channel]);
          }
        }
        bitmap.close();
        return {
          colors: colors.size,
          spread: Math.max(...maximum.map((value, channel) => value - minimum[channel])),
          width,
          height
        };
      },
      { image, range: bounds.range }
    );
    const record = { name, ...bounds, pixels };
    records.push(record);
    // Capture precedes assertions so the failed-before paint remains inspectable.
    await capture?.(name, image, record);
    assert(
      pixels.colors > 4 && pixels.spread >= 32,
      `Skip-link glyphs paint inside the text range rather than a blank backplate: ${JSON.stringify(record)}`
    );
  };
  try {
    await page.setViewport({ width: 320, height: 800 });
    for (const theme of ['light', 'dark']) {
      await cdp.send('Emulation.setEmulatedMedia', {
        features: [
          { name: 'forced-colors', value: 'active' },
          { name: 'prefers-color-scheme', value: theme }
        ]
      });
      await page.goto(`${baseUrl}/docs/figma.html`, { waitUntil: 'load' });
      if (
        (await page.$eval('html', (root) => root.classList.contains('dark'))) !==
        (theme === 'dark')
      )
        await page.click('[data-docs-theme-toggle]');
      await page.reload({ waitUntil: 'load' });
      await page.keyboard.press('Tab');
      await paintedLabel(`${theme}-first-tab`);
      await page.keyboard.press('Enter');
      assert(await page.$eval('#content', (content) => content === document.activeElement));
      // The specimens are inert. Native reverse traversal from the main surface
      // returns through the header theme control to the preceding skip link.
      await page.keyboard.down('Shift');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.up('Shift');
      await paintedLabel(`${theme}-keyboard-return`);
    }
    console.log(`PASS ${records.length} actual forced-color skip-link paint states`);
    return records;
  } finally {
    await cdp.send('Emulation.setEmulatedMedia', { features: [] });
    await cdp.detach();
    if (viewport) await page.setViewport(viewport);
  }
}
