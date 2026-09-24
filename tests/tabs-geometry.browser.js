// Import from the browser regression runner after building the package. Re-run
// under prefers-contrast: more and forced-colors: active in the owning runner.
export async function runTabsGeometryTests(assetBase = '/mewa-ui') {
  const results = [];
  const styles = document.createElement('link');
  styles.rel = 'stylesheet';
  styles.href = `${assetBase}/css/all.css`;
  const previousFocus = document.activeElement;
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const check = async (name, callback) => {
    try {
      await callback();
      results.push({ name });
    } catch (error) {
      results.push({ name, error: error.stack || error.message });
    }
  };
  const frame = () => new Promise(requestAnimationFrame);
  try {
    await new Promise((resolve, reject) => {
      styles.onload = resolve;
      styles.onerror = () => reject(new Error(`Could not load ${styles.href}`));
      document.head.append(styles);
    });
    const controller = await import(`${assetBase}/controllers/tabs.js`);
    for (const variant of ['', 'underline', 'line']) {
      for (const vertical of [false, true]) {
        for (const dark of [false, true]) {
          for (const { width, zoom } of [
            { width: 800, zoom: 1 },
            { width: 320, zoom: 1 },
            { width: 800, zoom: 2 }
          ]) {
            const name = `Tabs ${variant || 'default'} ${vertical ? 'vertical' : 'horizontal'} ${dark ? 'dark' : 'light'} ${width}px ${zoom * 100}%`;
            const host = document.createElement('div');
            host.classList.toggle('dark', dark);
            host.style.cssText = `width:${width / zoom}px;max-width:${100 / zoom}%;padding:16px;zoom:${zoom};background:var(--background);color:var(--text-primary)`;
            host.innerHTML = `
              <input aria-label="Keyboard focus entry" type="text">
              <div class="tabs">
                <div class="tab-list" role="tablist" aria-label="Job details"
                     data-variant="${variant}" aria-orientation="${vertical ? 'vertical' : 'horizontal'}">
                  ${['Summary', 'Output', 'Disabled', 'Configuration', 'History']
                    .map(
                      (label, index) => `
                    <button type="button" class="tab-trigger" role="tab"
                            id="geometry-tab-${index}" aria-controls="geometry-panel-${index}"
                            aria-selected="${index === 0}" ${index ? 'tabindex="-1"' : ''}
                            ${index === 2 ? 'disabled' : ''}>${label}</button>`
                    )
                    .join('')}
                </div>
                ${['Summary', 'Output', 'Disabled', 'Configuration', 'History']
                  .map(
                    (_, index) => `
                  <div class="tab-content" role="tabpanel" id="geometry-panel-${index}"
                       aria-labelledby="geometry-tab-${index}" ${index ? 'hidden' : ''}>Panel</div>`
                  )
                  .join('')}
              </div>`;
            document.body.append(host);
            try {
              await document.fonts.ready;
              controller.enhance(host);
              const list = host.querySelector('.tab-list');
              const tabs = [...list.querySelectorAll('.tab-trigger')];
              await check(`${name}: target geometry and local overflow`, () => {
                const boxes = tabs.map((tab) => tab.getBoundingClientRect());
                boxes.forEach((box, index) => {
                  assert(
                    Math.abs(box.height / zoom - 36) < 0.5,
                    `Target ${index} must remain 36px, got ${box.height / zoom}px`
                  );
                  if (index) {
                    const previous = boxes[index - 1];
                    assert(
                      (vertical ? box.top - previous.bottom : box.left - previous.right) >= -0.5,
                      'Adjacent targets must not overlap'
                    );
                  }
                });
                assert(list.scrollHeight <= list.clientHeight, 'No vertical scroll in the track');
                assert(
                  list.getBoundingClientRect().right <= host.getBoundingClientRect().right + 0.5,
                  'Overflow stays inside the tablist'
                );
                if (!vertical && width === 320) {
                  assert(
                    list.scrollWidth > list.clientWidth,
                    'Narrow horizontal tabs scroll locally'
                  );
                }
                assert(
                  getComputedStyle(tabs[2]).boxShadow === 'none',
                  'Disabled tabs do not draw a focus ring'
                );
              });
              await check(`${name}: selected and unselected focus perimeters`, async () => {
                // A text field supplies keyboard-visible focus even if an earlier
                // harness case used a pointer. The tabs themselves receive real focus.
                host.querySelector('input').focus();
                for (const tab of [tabs[0], tabs[1], tabs[3], tabs.at(-1), tabs[0]]) {
                  if (tab === tabs[3] || tab === tabs.at(-1)) {
                    const key = tab === tabs[3] ? (vertical ? 'ArrowDown' : 'ArrowRight') : 'End';
                    document.activeElement.dispatchEvent(
                      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
                    );
                    assert(
                      document.activeElement === tab,
                      'Keyboard navigation reaches the enabled tab'
                    );
                  } else {
                    tab.focus();
                  }
                  await frame();
                  assert(tab.matches(':focus-visible'), 'The tab has real keyboard-visible focus');
                  const style = getComputedStyle(tab);
                  const forced = matchMedia('(forced-colors: active)').matches;
                  let extent = 2;
                  if (forced) {
                    assert(style.outlineStyle === 'solid', 'Forced colors keeps a solid outline');
                    assert(parseFloat(style.outlineWidth) >= 2, 'Forced focus is at least 2px');
                    extent = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
                  } else {
                    const probe = document.createElement('span');
                    probe.style.boxShadow = 'var(--ring-default)';
                    host.append(probe);
                    const expected = getComputedStyle(probe).boxShadow;
                    probe.remove();
                    assert(expected !== 'none', 'The shared focus ring is available');
                    assert(
                      style.boxShadow === expected,
                      'Selection must not suppress the shared ring'
                    );
                  }
                  const box = tab.getBoundingClientRect();
                  const track = list.getBoundingClientRect();
                  const trackStyle = getComputedStyle(list);
                  // DOMRect retains fractional widths; clientWidth rounds them
                  // before zoom and can falsely report a clipped perimeter.
                  const left = track.left + parseFloat(trackStyle.borderLeftWidth) * zoom;
                  const top = track.top + parseFloat(trackStyle.borderTopWidth) * zoom;
                  const right = track.right - parseFloat(trackStyle.borderRightWidth) * zoom;
                  const bottom = track.bottom - parseFloat(trackStyle.borderBottomWidth) * zoom;
                  for (const [side, clearance] of [
                    ['top', box.top - top],
                    ['bottom', bottom - box.bottom],
                    ['left', box.left - left],
                    ['right', right - box.right]
                  ]) {
                    assert(
                      clearance + 0.75 >= extent * zoom,
                      `${side} focus perimeter is clipped: ${clearance / zoom}px clearance for ${extent}px`
                    );
                  }
                }
              });
            } finally {
              controller.destroy(host);
              host.remove();
            }
          }
        }
      }
    }
  } finally {
    styles.remove();
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  }
  return results;
}
