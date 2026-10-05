'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

let failures = 0;

function test(name, callback) {
  try {
    callback();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}\n  ${error.message}`);
  }
}

const systemFiles = [
  'library/system/foundations.md',
  'library/system/components.md',
  'library/system/patterns.md',
  'library/system/layouts.md',
  'library/system/accessibility.md'
];

function sentenceWordCount(sentence) {
  return (
    sentence
      .replace(/`[^`]+`/g, 'term')
      .replace(/\[[^\]]+\]\([^)]+\)/g, 'link')
      .match(/\b[\w'-]+\b/g) || []
  ).length;
}

function checkCompactProse(filename) {
  const source = read(filename);
  assert(!/^####\s/m.test(source), `${filename}: headings must not nest below level three`);

  let fenced = false;
  source.split(/\r?\n/).forEach((line, index) => {
    if (line.startsWith('```')) {
      fenced = !fenced;
      return;
    }
    if (fenced || !line.trim() || /^#{1,3}\s/.test(line) || line.startsWith('|')) return;
    if (/^\s*(?:[-*]|\d+\.)\s/.test(line)) return;

    line.split(/(?<=[.!?])\s+/).forEach((sentence) => {
      const count = sentenceWordCount(sentence);
      assert(count <= 30, `${filename}:${index + 1}: sentence has ${count} words`);
    });
  });
}

function section(filename, heading) {
  const source = read(filename);
  const start = source.indexOf(`## ${heading}\n`);
  assert(start >= 0, `${filename}: missing ${heading} section`);
  const end = source.indexOf('\n## ', start + 1);
  return source.slice(start, end < 0 ? undefined : end);
}

function localLinks(filename) {
  return [...read(filename).matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1])
    .filter((target) => !/^[a-z]+:/i.test(target))
    .map((target) => {
      const [file, anchor] = target.split('#');
      return {
        file: file
          ? path.posix.normalize(path.posix.join(path.posix.dirname(filename), file))
          : filename,
        anchor
      };
    });
}

function assertTopics(filename, heading, topics) {
  const source = section(filename, heading);
  for (const topic of topics) {
    assert.match(source, topic, `${filename}#${heading}: missing ${topic}`);
  }
}

test('the system stays limited to five connected specification files', () => {
  systemFiles.forEach((file) => assert(exists(file), `missing ${file}`));
  const actual = fs
    .readdirSync(path.join(root, 'library', 'system'))
    .filter((name) => name.endsWith('.md'))
    .sort();
  assert.deepEqual(actual, systemFiles.map((file) => path.basename(file)).sort());
});

test('DESIGN conditionally routes tasks to the five existing owners', () => {
  const design = read('library/DESIGN.md');
  const routes = section('library/DESIGN.md', 'Read for the task');
  const linkedFiles = new Set(localLinks('library/DESIGN.md').map((link) => link.file));
  systemFiles.forEach((file) =>
    assert(linkedFiles.has(file), `library/DESIGN.md does not route to ${file}`)
  );
  for (const trigger of [
    /\|[^|]*selection[^|]*\|[^\n]*components\.md#selection-order/i,
    /\|[^|]*markup[^|]*\|[^\n]*library\/components\//i,
    /\|[^|]*visual[^|]*\|[^\n]*foundations\.md/i,
    /\|[^|]*repeated[^|]*\|[^\n]*patterns\.md/i,
    /\|[^|]*chrome[^|]*\|[^\n]*layouts\.md#choose-a-shell/i,
    /\|[^|]*accessibility[^|]*\|[^\n]*accessibility\.md/i,
    /\|[^|]*mount[^|]*\|[^\n]*runtime\/README\.md#application-lifecycle/i,
    /\|[^|]*packaging[^|]*\|[^\n]*AGENTS\.md/i
  ]) {
    assert.match(routes, trigger);
  }
  assert.match(design, /native controls/i);
  assert.match(design, /do not invent[^\n]*classes[^\n]*hooks[^\n]*events/i);
  assert.match(design, /isolated control[^\n]*(?:does not|without)[^\n]*shell/i);
  assert.match(design, /asset dependency[^\n]*does not require reading/i);
  assert.doesNotMatch(design, /(?:read|load) (?:all|every) (?:five|system|component)\b/i);
  assert.doesNotMatch(design, /## (?:Motion|Typography|Validation|Source ownership)\b/);
});

test('named guidance links resolve to local files and sections', () => {
  for (const filename of ['library/DESIGN.md', ...systemFiles]) {
    for (const { file, anchor } of localLinks(filename)) {
      assert(exists(file), `${filename}: missing ${file}`);
      if (!anchor) continue;
      const anchors = [...read(file).matchAll(/^#{1,3}\s+(.+)$/gm)].map((match) =>
        match[1]
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
      );
      assert(anchors.includes(anchor), `${filename}: missing ${file}#${anchor}`);
    }
  }
});

test('source and archive metadata routes remain distinct and scoped', () => {
  const design = section('library/DESIGN.md', 'Resolve metadata and assets');
  for (const entry of [
    'registry.json',
    'files.skill',
    'components/index.md',
    'components/{slug}.json',
    'component.contractLocal',
    'manifest.json',
    'nativeBasis',
    'mewa-icons'
  ]) {
    assert(design.includes(`\`${entry}\``), `DESIGN is missing ${entry}`);
  }
  assert.match(design, /source checkout/i);
  assert.match(design, /core archive/i);
  assert.match(design, /[Oo]ld archives[^\n]*matching source checkout/);
});

test('llms has one bounded repository-only projection and portable consumer routes', () => {
  const router = read('llms.txt');
  const start = '<!-- REPOSITORY-ONLY:START -->';
  const end = '<!-- REPOSITORY-ONLY:END -->';
  assert.equal(router.split(start).length - 1, 1);
  assert.equal(router.split(end).length - 1, 1);
  assert(router.indexOf(start) < router.indexOf(end));
  const sourceOnly = router.slice(router.indexOf(start), router.indexOf(end) + end.length);
  const portable = router.replace(sourceOnly, '');
  for (const entry of [
    'AGENTS.md',
    'registry.json',
    'registry.schema.json',
    'docs/preview.html',
    'docs/figma.html',
    'library/adapters/svelte/README.md'
  ]) {
    assert(sourceOnly.includes(entry), `source route missing ${entry}`);
    assert(!portable.includes(entry), `source-only route leaked outside projection: ${entry}`);
  }
  for (const entry of [
    'library/DESIGN.md',
    'components/index.md',
    'components/{slug}.json',
    'component.contractLocal',
    'manifest.json',
    'library/runtime/README.md'
  ]) {
    assert(portable.includes(entry), `portable route missing ${entry}`);
  }
  assert.match(portable, /core archive[^\n]*local contracts/i);
  assert.doesNotMatch(portable, /\]\(components\/index\.md\)/);
});

test('descriptive and instructional Markdown have explicit owners', () => {
  const readme = read('README.md');
  const agents = read('AGENTS.md');
  assert.match(readme, /The repository keeps description separate from instruction\./);
  assert.match(readme, /### For people/);
  assert.match(readme, /### For agents and maintainers/);
  assert(
    !/COMPONENT-INVENTORY/.test(readme),
    'README.md must not contain the generated agent catalog'
  );
  assert.match(agents, /Keep `README\.md` descriptive and written for people\./);
  assert.match(
    agents,
    /Keep `library\/DESIGN\.md`, `library\/system\/`, and component Markdown instructional\./
  );
  assert(readme.includes('(docs/industry-review.md)'));
  assert(exists('docs/industry-review.md'));
});

test('agent-facing prose stays shallow and compact', () => {
  for (const file of ['library/DESIGN.md', 'AGENTS.md', 'llms.txt', ...systemFiles]) {
    checkCompactProse(file);
  }
});

test('shell documentation contains all three shell recipes', () => {
  const layouts = read('library/system/layouts.md');
  assert.match(layouts, /## Sidebar shell/);
  assert.match(layouts, /## Top-navigation shell/);
  assert.match(layouts, /## Focused-tool shell/);
  assert(!/\blayouts\//.test(layouts));
});

test('component selection documentation routes agents through registry metadata', () => {
  const guide = read('library/system/components.md');
  assert.match(guide, /source checkout[^\n]*`registry\.json`[^\n]*inventory/i);
  assert.match(guide, /core archive[^\n]*components\/index\.md/i);
  assert.match(guide, /<!-- REGISTRY-FIELDS:START -->/);
  assert.match(guide, /<!-- REGISTRY-FIELDS:END -->/);
  for (const field of [
    'purpose',
    'useWhen',
    'avoidWhen',
    'fallback',
    'nativeBasis',
    'jsMode',
    'files',
    'styleDependencies',
    'behaviorDependencies',
    'assets',
    'stability'
  ]) {
    assert(
      guide.includes(`Use ` + '`' + `${field}` + '`'),
      `library/system/components.md is missing ${field}`
    );
  }
  for (const field of ['contractLocal', 'css', 'component', 'auto']) {
    assert(guide.includes(`\`${field}\``), `components.md is missing packaged ${field}`);
  }
});

test('migrated visual constraints stay in foundations rather than the root router', () => {
  const foundations = 'library/system/foundations.md';
  assertTopics(foundations, 'Color palettes', [
    /CIELAB L\*/,
    /rgb\(\)/,
    /alpha-light/,
    /alpha-dark/,
    /chromatic alpha/,
    /WCAG/,
    /status and destructive/
  ]);
  assertTopics(foundations, 'Surface model', [
    /--background/,
    /--surface-primary/,
    /--surface-control-hover/,
    /--surface-menu-hover/,
    /--surface-content-hover/,
    /--surface-shell-hover/,
    /--surface-hover/,
    /matching status text/,
    /card inside a card/,
    /table in a card/
  ]);
  assertTopics(foundations, 'Borders', [
    /--border-width-025/,
    /--border-width-050/,
    /--border-width-100/,
    /one border for one boundary/i
  ]);
  assertTopics(foundations, 'Geometry', [/square/, /--border-radius-000/, /--border-radius-6400/]);
  assertTopics(foundations, 'Typography', [
    /Google Sans Code/,
    /MONO/,
    /sentence case/,
    /eyebrow or machine label/
  ]);
  assertTopics(foundations, 'Interactive size', [
    /36px/,
    /32px/,
    /40px/,
    /24px/,
    /Button and Avatar/,
    /contract/
  ]);
  assertTopics(foundations, 'Blur', [
    /sticky shell chrome/,
    /modal backdrops/,
    /--blur-400/,
    /--blur-100/,
    /--blur-200/,
    /opaque semantic background/,
    /Do not blur controls/,
    /Do not blur dialogs/
  ]);
  assertTopics(foundations, 'Motion', [
    /--motion-duration-fast/,
    /--motion-duration-spatial/,
    /Dialog/,
    /Alert Dialog/,
    /Command Palette/,
    /Sheet/,
    /Sidebar/,
    /immediate/,
    /prefers-reduced-motion/,
    /View Transitions/,
    /scroll-driven/,
    /Web Animations/,
    /shimmer/,
    /Spinner rotation[^\n]*only continuous animation exception/
  ]);
  assertTopics(foundations, 'Responsive tiers', [
    /60rem/,
    /48rem/,
    /37\.5rem/,
    /90rem/,
    /64rem/,
    /media-query literals/,
    /320px/,
    /200%/
  ]);
  assertTopics(foundations, 'Theme', [
    /light theme/,
    /\.dark/,
    /operating system/,
    /manual choice/,
    /pre-paint/,
    /persisted toggle/,
    /forced colors/
  ]);
  assert.doesNotMatch(read('library/DESIGN.md'), /Spinner rotation/);
});

test('component authoring and native runtime rules retain their narrow owners', () => {
  const components = 'library/system/components.md';
  assertTopics(components, 'Component contract', [
    /native basis/,
    /Web APIs/,
    /supported structure/,
    /keyboard/,
    /focus/,
    /events/,
    /no-JavaScript/,
    /explicit button types/,
    /stable relationship IDs/,
    /inline styles/,
    /unimplemented variant/,
    /same-name/,
    /extra reference files/
  ]);
  assertTopics(components, 'New component gate', [
    /two real tasks/,
    /composition/,
    /stable semantic basis/,
    /one clear responsibility/,
    /keyboard/,
    /fallback/,
    /source-parity/,
    /behavior tests/,
    /proposal/,
    /one shell/
  ]);
  assertTopics(components, 'Enhancement implementation', [
    /HTML and CSS/,
    /framework-neutral/,
    /without a DOM/,
    /idempotent/,
    /inserted after navigation/,
    /enhance/,
    /behavior/,
    /runtime\/enhancer\.js/,
    /polling/,
    /ARIA/,
    /documented events/,
    /native submission/,
    /behavior-specific/,
    /data-init/,
    /exclude another behavior/,
    /listener/,
    /observer/,
    /timer/,
    /object URL/,
    /generated DOM/,
    /createLifecycle/,
    /external-form/,
    /application-owned/,
    /reset after its default action/,
    /canceled resets/,
    /composition events/
  ]);
  assertTopics(components, 'Framework integration', [
    /mewa-ui\/components/,
    /automatic entries/,
    /optional/,
    /mewa-svelte/,
    /peer dependency/,
    /server-rendering/
  ]);
  assertTopics('library/system/patterns.md', 'Composition boundary', [
    /several components/,
    /shared hook/,
    /stable API/,
    /repeated behavior/
  ]);
  assertTopics('library/system/patterns.md', 'Action hierarchy', [
    /one filled primary/,
    /Secondary/,
    /Ghost/,
    /Destructive/,
    /confirmation/,
    /related controls/,
    /different tasks/
  ]);
  assertTopics('library/system/layouts.md', 'Ownership model', [
    /consumer owns routes/i,
    /page-specific shell CSS/,
    /complete shell templates/,
    /skip link first/,
    /one main landmark/,
    /product brand/
  ]);
  assertTopics('library/system/accessibility.md', 'Native semantics', [
    /summary/,
    /Popover API/,
    /progress element/,
    /meter element/,
    /output element/
  ]);
  assertTopics('library/system/accessibility.md', 'No-JavaScript behavior', [
    /native navigation/,
    /native form submission/,
    /native validation/,
    /details disclosures/,
    /native fallback/,
    /dead control/
  ]);
});

test('maintainer generation and compatibility rules do not claim whole-file catalog ownership', () => {
  const agents = read('AGENTS.md');
  for (const owner of [
    'scripts/color-palette.mjs',
    'library/src/base.css',
    'library/src/tokens.css',
    'docs/specimens.json',
    'docs/catalog.mjs',
    'docs/component-model.mjs',
    'docs/model-operations.mjs',
    'registry.schema.json'
  ]) {
    assert(agents.includes(owner), `AGENTS.md is missing ${owner}`);
  }
  assert.match(agents, /TOKEN-REFERENCE/);
  assert.match(agents, /REGISTRY-FIELDS/);
  assert.match(agents, /components\.md[^\n]*authored/);
  assert.doesNotMatch(agents, /Treat `library\/system\/components\.md` as generated output/);
  assert.match(agents, /public registry fields[^\n]*migration decision/);
  assert.match(agents, /trusted native button activation[^\n]*canceling listener/);
  for (const command of [
    'test',
    'package:check',
    'palette:check',
    'catalog:check',
    'lint',
    'format:check',
    'typecheck',
    'test:browser',
    'measure'
  ]) {
    assert(agents.includes(`bun run ${command}`), `AGENTS.md is missing ${command}`);
  }
});

test('dense row guidance names the shared semantic hooks', () => {
  const patterns = read('library/system/patterns.md');
  const shell = read('library/components/application/app-shell/app-shell.md');
  for (const hook of [
    'app-dense-list',
    'app-dense-row',
    'app-dense-leading',
    'app-dense-copy',
    'app-dense-heading',
    'app-dense-actions'
  ]) {
    assert(patterns.includes(`.${hook}`), `patterns.md is missing .${hook}`);
    assert(shell.includes(`.${hook}`), `app-shell.md is missing .${hook}`);
  }
  assert.match(shell, /<ul class="app-dense-list"[\s\S]*<li class="app-dense-row">/);
});

test('foundation token documentation is generated from registry metadata', () => {
  const foundations = read('library/system/foundations.md');
  assert.match(foundations, /<!-- TOKEN-REFERENCE:START -->/);
  assert.match(foundations, /<!-- TOKEN-REFERENCE:END -->/);
  assert.match(foundations, /\| `--background` \| Page canvas background\. \|/);
});

if (failures) process.exitCode = 1;
