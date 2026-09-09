import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Start safaridriver separately with remote automation enabled in Safari Settings.
const root = path.resolve(import.meta.dirname, '..');
const endpoint = process.env.SAFARI_WEBDRIVER_URL || 'http://127.0.0.1:4447';
const report = {
  engine: 'Safari',
  runtime: [],
  pages: [],
  limitations: [
    'Screen readers, real Safari zoom, and OS contrast modes require separate manual validation.'
  ]
};
const server = Bun.serve({
  hostname: '127.0.0.1',
  port: 0,
  fetch(request) {
    let pathname = new URL(request.url).pathname;
    if (pathname === '/')
      return new Response(
        '<!doctype html><html lang="en"><title>Mewa acceptance</title><body></body></html>',
        { headers: { 'content-type': 'text/html' } }
      );
    if (pathname.startsWith('/mewa-ui/')) pathname = '/dist' + pathname;
    const filename = path.resolve(root, '.' + pathname);
    if (!filename.startsWith(root + path.sep) || !fs.existsSync(filename))
      return new Response('', { status: 404 });
    return new Response(Bun.file(filename));
  }
});
async function command(route, body, method = 'POST') {
  const response = await fetch(endpoint + route, {
    method,
    ...(body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  });
  const result = await response.json();
  if (!response.ok || result.value?.error) throw new Error(JSON.stringify(result.value));
  return result.value;
}
let session = process.env.SAFARI_SESSION;
try {
  if (!session) {
    const started = await command('/session', {
      capabilities: { alwaysMatch: { browserName: 'safari' } }
    });
    session = started.sessionId;
    report.capabilities = started.capabilities;
  }
  const prefix = `/session/${session}`;
  const execute = (script, args = []) => command(prefix + '/execute/sync', { script, args });
  await command(prefix + '/timeouts', { script: 60000, pageLoad: 60000 });
  const built = await Bun.build({
    entrypoints: [path.join(root, 'tests/runtime-contract.browser.js')],
    outdir: path.join(root, 'dist'),
    target: 'browser',
    external: ['/mewa-ui/*']
  });
  assert(built.success);
  await command(prefix + '/url', { url: `http://127.0.0.1:${server.port}/` });
  report.browser = await execute('return navigator.userAgent');
  await execute(
    "const script = document.createElement('script'); script.type = 'module'; script.src = '/dist/runtime-contract.browser.js'; script.onerror = () => window.runtimeLoadError = true; document.head.append(script);"
  );
  let runtime;
  for (let attempt = 0; attempt < 120; attempt++) {
    const state = await execute(
      'return {results:window.runtimeResults || null,progress:window.runtimeProgress || null,error:window.runtimeLoadError || false}'
    );
    if (state.results) {
      runtime = state.results;
      break;
    }
    if (state.error) throw new Error('Runtime module failed to load');
    if (attempt % 10 === 0) console.log('Safari runtime progress:', state.progress);
    await Bun.sleep(500);
  }
  assert(Array.isArray(runtime), 'Safari runtime timed out');
  report.runtime = runtime;
  for (const width of [390, 1440]) {
    await command(prefix + '/window/rect', { width, height: 900 });
    await command(prefix + '/url', { url: `http://127.0.0.1:${server.port}/docs/preview.html` });
    const result = await execute(
      `return {width:innerWidth,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,main:!!document.querySelector('main'),buttons:[...document.querySelectorAll('button')].filter(b=>!['button','reset','submit'].includes(b.getAttribute('type'))).length}`
    );
    report.pages.push({ slug: 'preview', requestedWidth: width, ...result });
    assert(result.main && !result.buttons && result.overflow <= 2, JSON.stringify(result));
  }
  assert.equal(
    runtime.filter((item) => item.error).length,
    0,
    JSON.stringify(runtime.filter((item) => item.error))
  );
  console.log(
    `PASS Safari: ${runtime.length} native runtime cases and ${report.pages.length} documentation renders`
  );
} finally {
  fs.writeFileSync(
    path.join(root, 'dist/safari-acceptance.json'),
    JSON.stringify(report, null, 2) + '\n'
  );
  if (session) await command(`/session/${session}`, undefined, 'DELETE');
  server.stop(true);
}
