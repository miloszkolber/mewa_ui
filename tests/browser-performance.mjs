import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { launchOptions } from './browser-support.mjs';
const root = path.resolve(import.meta.dirname, '..');
const directory = path.resolve(
  process.env.MEWA_PERFORMANCE_DIST || path.join(root, 'dist/mewa-ui')
);
const reportPath =
  process.env.MEWA_PERFORMANCE_REPORT || path.join(root, 'dist/performance-report.json');
const server = Bun.serve({
  hostname: '127.0.0.1',
  port: 0,
  fetch(request) {
    const pathname = new URL(request.url).pathname;
    if (pathname === '/')
      return new Response('<!doctype html><html lang="en"><body></body></html>', {
        headers: { 'content-type': 'text/html' }
      });
    const filename = path.resolve(directory, '.' + pathname);
    if (!filename.startsWith(directory + path.sep) || !fs.existsSync(filename))
      return new Response('', { status: 404 });
    return new Response(Bun.file(filename));
  }
});
const browser = await puppeteer.launch(launchOptions());
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.port}/`);
  const runs = [];
  for (let run = 0; run < 7; run++) {
    const workloads = await page.evaluate(async () => {
      const { createController, createEnhancer } = await import('/index.js');
      const { behavior: tableBehavior } = await import('/components/data-table.js');
      const { behavior: toggleBehavior } = await import('/controllers/toggle.js');
      const { behavior: codeBehavior } = await import('/components/code-block.js');
      const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
      const measurements = [];
      const table = document.createElement('div');
      table.className = 'data-table';
      table.innerHTML =
        '<input data-table-filter><table><tbody>' +
        Array.from(
          { length: 1000 },
          (_, index) => `<tr><td>Row ${index} ${index % 10 === 0 ? 'needle' : ''}</td></tr>`
        ).join('') +
        '</tbody></table>';
      document.body.append(table);
      const tableController = createController(tableBehavior, table);
      let start = performance.now();
      table.querySelector('input').value = 'needle';
      table.querySelector('input').dispatchEvent(new Event('input', { bubbles: true }));
      measurements.push({
        name: 'filter-1000-rows',
        milliseconds: performance.now() - start,
        visible: [...table.querySelectorAll('tbody tr')].filter((row) => !row.hidden).length
      });
      tableController.destroy();
      table.remove();

      const region = document.createElement('div');
      document.body.append(region);
      const enhancer = createEnhancer([toggleBehavior]);
      enhancer.observe(region);
      const fragment = document.createDocumentFragment();
      for (let index = 0; index < 2000; index++) {
        const button = document.createElement('button');
        button.className = 'toggle';
        button.type = 'button';
        button.setAttribute('aria-pressed', 'false');
        fragment.append(button);
      }
      start = performance.now();
      region.append(fragment);
      await new Promise((resolve) => setTimeout(resolve, 0));
      const initialized = region.querySelectorAll('[data-mewa-toggle-init]').length;
      measurements.push({
        name: 'enhance-2000-inserted-toggles',
        milliseconds: performance.now() - start,
        initialized
      });
      enhancer.disconnect();
      enhancer.destroy(region);
      region.remove();

      const code = document.createElement('div');
      code.className = 'code-block';
      code.setAttribute('data-streaming', '');
      code.innerHTML =
        '<div class="code-block-viewport" style="height:100px;overflow:auto"><pre class="code-block-code"></pre></div>';
      document.body.append(code);
      const codeController = createController(codeBehavior, code);
      start = performance.now();
      code.querySelector('pre').textContent = Array.from(
        { length: 2000 },
        (_, index) => `Line ${index}`
      ).join('\n');
      await nextFrame();
      await nextFrame();
      const viewport = code.querySelector('.code-block-viewport');
      measurements.push({
        name: 'stream-2000-code-lines',
        milliseconds: performance.now() - start,
        bottomDistance: viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop
      });
      codeController.destroy();
      code.remove();
      return measurements;
    });
    assert.equal(workloads[0].visible, 100);
    assert.equal(workloads[1].initialized, 2000);
    assert(workloads[2].bottomDistance <= 2);
    runs.push(workloads);
  }
  const workloads = runs[0].map((workload, index) => {
    const samples = runs.map((run) => run[index].milliseconds).sort((a, b) => a - b);
    return {
      name: workload.name,
      samples,
      medianMs: samples[Math.floor(samples.length / 2)],
      p95Ms: samples[Math.ceil(samples.length * 0.95) - 1]
    };
  });
  const report = {
    browser: await browser.version(),
    bun: Bun.version,
    platform: process.platform,
    architecture: process.arch,
    distribution: directory,
    note: 'Diagnostic timings, not portable pass/fail budgets. Compare on the same machine and browser.',
    workloads,
    runs
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
  server.stop(true);
}
