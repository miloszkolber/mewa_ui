'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const componentsDir = path.join(root, 'library', 'components');
const docsDir = path.join(root, 'docs');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'registry.json'), 'utf8'));

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const directories = (directory) =>
  fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
const files = (directory, suffix = '') =>
  fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
    .map((entry) => entry.name)
    .sort();

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

function stripCssComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

function stripMarkdownFences(source) {
  return source.replace(/```[\s\S]*?```/g, '');
}

test('registry v3 defines the canonical source roots', () => {
  assert.equal(registry.schemaVersion, 3);
  assert.equal(registry.name, 'mewa_ui');
  assert.deepEqual(registry.canonicalAssets, {
    foundations: ['library/src/base.css', 'library/src/tokens.css'],
    fonts: ['library/src/google-sans-code.woff2'],
    licenses: {
      googleSansCode: 'library/src/licenses/GOOGLE-SANS-CODE-OFL.txt',
      remixIcon: 'library/src/licenses/REMIX-ICON-LICENSE.txt'
    },
    icons: 'library/src/icons/',
    components: 'library/components/',
    runtime: 'library/runtime/',
    documentation: 'docs/',
    system: 'library/system/'
  });
  assert(!exists('layouts'), 'complete layout templates must not ship in this repository');
});

test('registry selection metadata covers every component', () => {
  assert.equal(registry.components.length, 80);
  const slugs = registry.components.map((component) => component.slug).sort();
  assert.deepEqual(slugs, directories(componentsDir));

  for (const component of registry.components) {
    assert.match(component.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    for (const field of [
      'name',
      'category',
      'purpose',
      'useWhen',
      'avoidWhen',
      'fallback',
      'stability',
      'nativeBasis',
      'jsMode',
      'docs'
    ]) {
      assert.equal(typeof component[field], 'string', `${component.slug}: missing ${field}`);
      assert(component[field].trim().length > 0, `${component.slug}: empty ${field}`);
    }
    assert(
      ['none', 'optional', 'required'].includes(component.jsMode),
      `${component.slug}: invalid jsMode`
    );
    assert.equal(
      component.requiresJs,
      component.jsMode === 'required',
      `${component.slug}: requiresJs drift`
    );
    assert.equal(
      component.enhancementJs,
      component.jsMode === 'optional',
      `${component.slug}: enhancementJs drift`
    );
    for (const field of ['styleDependencies', 'behaviorDependencies', 'assets']) {
      assert(Array.isArray(component[field]), `${component.slug}: ${field} must be an array`);
      assert.equal(
        new Set(component[field]).size,
        component[field].length,
        `${component.slug}: duplicate ${field}`
      );
      component[field].forEach((entry) =>
        assert.equal(typeof entry, 'string', `${component.slug}: non-string ${field} entry`)
      );
    }
    if (component.jsMode === 'none')
      assert.deepEqual(
        component.behaviorDependencies,
        [],
        `${component.slug}: behavior dependencies require an auto entry`
      );
    assert.equal(
      component.files.skill,
      `library/components/${component.slug}/${component.slug}.md`
    );
    assert.equal(component.files.css, `library/components/${component.slug}/${component.slug}.css`);
    assert.equal(component.docs, `docs/${component.slug}.html`);
    if (component.jsMode === 'none')
      assert.equal(component.files.js, undefined, `${component.slug}: unexpected module`);
    else
      assert.equal(component.files.js, `library/components/${component.slug}/${component.slug}.js`);
    for (const file of [
      component.files.skill,
      component.files.css,
      component.files.js,
      component.docs
    ].filter(Boolean)) {
      assert(exists(file), `${component.slug}: missing ${file}`);
    }
  }
});

test('component dependency metadata references the catalog without cycles', () => {
  const bySlug = new Map(registry.components.map((component) => [component.slug, component]));

  for (const field of ['styleDependencies', 'behaviorDependencies']) {
    const visit = (component, active = new Set(), complete = new Set()) => {
      if (active.has(component.slug))
        throw new Error(
          `${field}: cycle includes ${Array.from(active).join(' -> ')} -> ${component.slug}`
        );
      if (complete.has(component.slug)) return;
      active.add(component.slug);
      for (const slug of component[field]) {
        assert.notEqual(
          slug,
          component.slug,
          `${component.slug}: ${field} cannot reference itself`
        );
        assert(bySlug.has(slug), `${component.slug}: unknown ${field} entry ${slug}`);
        if (field === 'behaviorDependencies') {
          assert.notEqual(
            bySlug.get(slug).jsMode,
            'none',
            `${component.slug}: ${slug} has no behavior module`
          );
        }
        visit(bySlug.get(slug), active, complete);
      }
      active.delete(component.slug);
      complete.add(component.slug);
    };

    const complete = new Set();
    registry.components.forEach((component) => visit(component, new Set(), complete));
  }
});

test('component folders contain only the contract, stylesheet, and optional module', () => {
  for (const component of registry.components) {
    const names = files(path.join(componentsDir, component.slug));
    const expected = [`${component.slug}.css`, `${component.slug}.md`];
    if (component.files.js) expected.push(`${component.slug}.js`);
    assert.deepEqual(
      names,
      expected.sort(),
      `${component.slug}: component folder contains an extra or missing file`
    );
  }
});

test('component styles reference declared foundation or documented consumer variables', () => {
  const sourceFiles = [
    'library/src/base.css',
    'library/src/tokens.css',
    ...registry.components.map((component) => component.files.css)
  ];
  const declarations = new Set();
  const uses = [];
  const consumerVariables = new Set([
    '--app-shell-header-offset',
    '--app-shell-max',
    '--container-max',
    '--min',
    '--sidebar-width',
    '--sidebar-width-collapsed'
  ]);

  sourceFiles.forEach((file) => {
    const source = read(file);
    for (const match of source.matchAll(/(--[a-z0-9-]+)\s*:/g)) declarations.add(match[1]);
    for (const match of source.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) uses.push([file, match[1]]);
  });

  uses.forEach(([file, variable]) => {
    assert(
      declarations.has(variable) || consumerVariables.has(variable),
      `${file}: ${variable} is not declared by the library or documented as a consumer override`
    );
  });
});

test('docs have exact parity with the registry', () => {
  const docs = files(docsDir, '.html')
    .filter((name) => name !== 'index.html' && name !== 'preview.html')
    .map((name) => name.slice(0, -5))
    .sort();
  const slugs = registry.components.map((component) => component.slug).sort();
  assert.deepEqual(docs, slugs);
});

test('the hidden preview renders forced light and dark component columns', () => {
  const preview = read('docs/preview.html');
  assert(
    preview.includes('<meta name="robots" content="noindex, nofollow">'),
    'docs/preview.html: hidden preview must opt out of search indexing'
  );
  assert(!preview.includes('<iframe'), 'docs/preview.html: frames break Figma export');
  assert(
    !preview.includes('site-header') &&
      !preview.includes('site-nav') &&
      !preview.includes('js/layout.js'),
    'docs/preview.html: preview must use a plain container without docs chrome'
  );
  assert.equal(
    (preview.match(/href="css\/components\.generated\.css"/g) || []).length,
    1,
    'docs/preview.html: duplicate generated component styles'
  );
  assert(
    !/href="\.\.\/library\/components\//.test(preview),
    'docs/preview.html: raw component stylesheet remains'
  );
  assert(
    preview.includes('class="preview-theme-grid"') &&
      preview.includes('data-preview-theme="light"') &&
      preview.includes('data-preview-theme="dark"') &&
      preview.includes('grid-template-columns: repeat(2, minmax(0, 1fr))'),
    'docs/preview.html: forced light and dark columns are required'
  );
  assert(
    preview.includes('data-preview-theme-option="light"') &&
      preview.includes('data-preview-theme-option="dark"') &&
      preview.includes('@media (max-width: 48rem)'),
    'docs/preview.html: mobile theme switch is required'
  );
  const ids = Array.from(preview.matchAll(/\sid="([^"]+)"/g), (match) => match[1]);
  assert.equal(
    new Set(ids).size,
    ids.length,
    'docs/preview.html: duplicate ids break stacked examples'
  );
  let expectedBlocks = 0;
  let expectedDialogs = 0;
  for (const component of registry.components) {
    assert(
      preview.includes(`id="preview-${component.slug}"`),
      `docs/preview.html: missing ${component.slug} section`
    );
    // Count rendered elements only: <head> metadata names elements
    // such as <dialog> inside attribute values without rendering them.
    const bodySource = read(component.docs).split('</head>')[1];
    expectedBlocks += (bodySource.match(/<div\s[^>]*class="preview"/g) || []).length;
    expectedDialogs += (bodySource.match(/<dialog\b/g) || []).length;
  }
  assert.equal(
    (preview.match(/<div\s[^>]*class="preview"/g) || []).length,
    expectedBlocks * 2,
    'docs/preview.html: forced theme preview block count drifts from the component pages'
  );
  assert.equal(
    (preview.match(/<dialog\b/g) || []).length,
    expectedDialogs * 2,
    'docs/preview.html: forced theme dialog count drifts from the component pages'
  );
  assert(
    !/<dialog\b(?![^>]*\bopen\b)[^>]*>/.test(preview),
    'docs/preview.html: every showcased dialog must render open without interaction'
  );
  assert(
    preview.includes('.preview-page dialog[open]') &&
      preview.includes('.preview-page [popover]') &&
      preview.includes('.preview-page nav [popover]') &&
      preview.includes('.preview-page dialog.sheet[open]') &&
      preview.includes('position: relative !important'),
    'docs/preview.html: hidden overlay states must render without interaction'
  );
  assert(
    preview.includes('data-export-surface="figma"') &&
      preview.includes('body class="preview-export"'),
    'docs/preview.html: export surface must be explicitly marked'
  );
  assert(
    preview.includes('.preview-page [hidden]:not(input[type="hidden"])') &&
      preview.includes('display: revert !important') &&
      preview.includes('animation: none !important'),
    'docs/preview.html: hidden states and motion must be export-safe'
  );
  assert(
    !/<i\b[^>]*data-lucide=/.test(preview) &&
      !/<i\b[^>]*\bri-[a-z0-9-]+/.test(preview) &&
      (preview.includes('data-remix-icon-loaded=""') || preview.includes('data-icon-loaded=""')),
    'docs/preview.html: local icons must be inline before import'
  );
  const previewIds = new Set(ids);
  for (const match of preview.matchAll(
    /\s(data-[a-z0-9_-]*trigger|popovertarget|aria-controls)="([^"]+)"/gi
  )) {
    for (const target of match[2].split(/\s+/)) {
      assert(previewIds.has(target), `docs/preview.html: missing target for ${match[1]}=${target}`);
    }
  }
  assert(
    preview.includes('id="toast-container"') && preview.includes('class="toast"'),
    'docs/preview.html: toast state must have a static import fallback'
  );
  assert(
    preview.includes("closest('a[href], [formaction]')") &&
      preview.includes("addEventListener('submit'"),
    'docs/preview.html: showcase links and forms must not navigate away'
  );
  assert(
    preview.includes('window.toast?.show') && preview.includes('duration: Infinity'),
    'docs/preview.html: a persistent demo toast must render on load'
  );
  for (const theme of ['light', 'dark']) {
    for (const id of [`dialog--${theme}--demo-dialog`, `sheet--${theme}--sheet-right`]) {
      assert(
        preview.includes(`id="${id}"`),
        `docs/preview.html: body-level overlay ${id} is missing from the forced theme page`
      );
    }
  }
  const index = read('docs/index.html');
  assert(!index.includes('preview.html'), 'docs/index.html: hidden preview must stay unlinked');
  const layout = read('docs/js/layout.js');
  assert(
    !layout.includes('preview.html'),
    'docs/js/layout.js: hidden preview must stay out of the documentation navigation'
  );
});

test('every documentation page loads the generated component stylesheet once', () => {
  for (const component of registry.components) {
    const source = read(component.docs);
    assert(
      source.includes('href="css/components.generated.css"'),
      `${component.docs}: missing generated component styles`
    );
    assert.equal(
      (source.match(/href="css\/components\.generated\.css"/g) || []).length,
      1,
      `${component.docs}: duplicate generated component styles`
    );
    assert(
      !/href="\.\.\/library\/components\//.test(source),
      `${component.docs}: raw component stylesheet remains`
    );
  }
});

test('human documentation stays free of internal and unrelated-library language', () => {
  const discouragedPhrases = [
    'Kernel-aligned',
    'component skill',
    'design-system demo',
    'canonical popover pattern'
  ];

  for (const component of registry.components) {
    const source = read(component.docs);
    for (const phrase of discouragedPhrases) {
      assert(
        !source.includes(phrase),
        `${component.docs}: contains internal-facing phrase ${phrase}`
      );
    }
  }
});

test('every component skill states purpose, implementation, accessibility, runtime, and selection guidance', () => {
  for (const component of registry.components) {
    const source = read(component.files.skill);
    const prose = stripMarkdownFences(source);

    assert.match(source, /^#\s+\S/m, `${component.slug}: missing title`);
    assert.match(source, /^## Purpose\s*$/im, `${component.slug}: missing Purpose`);
    assert.match(source, /^## Native basis\s*$/im, `${component.slug}: missing Native basis`);
    assert.match(source, /^## Native Web APIs\s*$/im, `${component.slug}: missing Native Web APIs`);
    assert(
      /^## (?:Structure|Markup|Usage|Examples|Variants|Default|Multi-open structure|One field|Container)\b/im.test(
        source
      ) || /```html\b/i.test(source),
      `${component.slug}: missing structure or HTML example`
    );
    assert(
      /^## (?:Accessibility|ARIA)\b/im.test(source) || /\baccessib(?:le|ility)\b/i.test(prose),
      `${component.slug}: missing accessibility guidance`
    );
    assert.match(source, /^## Runtime\s*$/im, `${component.slug}: missing Runtime`);
    assert(
      !/style\s*=\s*["']/i.test(source),
      `${component.slug}: canonical Markdown examples must not use inline style attributes`
    );
    assert(/\bUse\b/.test(prose), `${component.slug}: missing explicit use guidance`);
    assert(/\bDo not\b/.test(prose), `${component.slug}: missing explicit misuse guidance`);

    if (component.jsMode !== 'none') {
      assert(
        /^## (?:Behavior|Keyboard|Events|Progressive enhancement|No-JavaScript)\b/im.test(source),
        `${component.slug}: enhanced skill must explain interactive behavior or fallback`
      );
    }
  }
});

test('semantic tokens have machine-readable purposes', () => {
  const tokensCss = read('library/src/tokens.css');
  const cssNames = new Set(
    Array.from(
      tokensCss.matchAll(/^\s*(--(?:background|surface|overlay|text|border|chart)-?[\w-]*)\s*:/gm),
      (match) => match[1]
    )
  );
  const metadata = registry.designTokens?.semantic || [];
  const metadataNames = new Set(metadata.map((token) => token.name));

  assert(metadata.length > 0, 'registry designTokens.semantic is required');
  assert.deepEqual(
    metadataNames,
    cssNames,
    'semantic token metadata must match library/src/tokens.css'
  );
  metadata.forEach((token) => {
    assert.equal(typeof token.purpose, 'string');
    assert(token.purpose.length >= 12, `${token.name}: purpose is too terse`);
    assert.equal(token.stability, 'stable');
  });
});

test('component CSS stays square, tokenized, ring-controlled, and motion-controlled', () => {
  for (const component of registry.components) {
    const filename = component.files.css;
    const source = stripCssComments(read(filename));
    assert.match(source, /@layer\s+components/, `${filename}: missing components layer`);
    for (const match of source.matchAll(/\b(?:box-shadow|text-shadow)\s*:\s*([^;{}]+)/gi)) {
      assert.match(
        match[0],
        /^box-shadow\s*:\s*(?:var\(--ring-(?:default|invalid)\)|var\(--shadow-selected\)|none)$/i,
        `${filename}: only shared ring/selection shadows or explicit resets are allowed`
      );
    }
    if (component.slug !== 'spinner') {
      assert(
        !/\banimation(?:-[\w]+)?\s*:/i.test(source),
        `${filename}: continuous animation is forbidden`
      );
      assert(
        !/@keyframes|view-transition|\bscroll-behavior\s*:/i.test(source),
        `${filename}: continuous or scroll motion is forbidden`
      );
      assert(
        !/\btransition\s*:\s*all\b/i.test(source),
        `${filename}: transition: all is forbidden`
      );
      assert(
        !/\btransition-delay\s*:/i.test(source),
        `${filename}: delayed state feedback is forbidden`
      );
      for (const match of source.matchAll(/transition-duration\s*:\s*([^;{}]+)/gi)) {
        assert(
          /^(?:var\(--motion-duration-(?:fast|spatial)\)|0ms)$/i.test(match[1].trim()),
          `${filename}: unsupported transition duration ${match[1].trim()}`
        );
      }
      for (const match of source.matchAll(/transition-timing-function\s*:\s*([^;{}]+)/gi)) {
        assert.equal(
          match[1].trim(),
          'var(--motion-easing-standard)',
          `${filename}: unsupported transition easing`
        );
      }
    }
    assert(
      !/var\(\s*--color-[\w-]+\s*\)/i.test(source),
      `${filename}: palette primitives are forbidden`
    );
    for (const match of source.matchAll(/border-radius\s*:\s*([^;{}]+)/gi)) {
      assert(
        /^(?:0|50%|inherit|var\(--border-radius-6400\)|var\(--border-radius-000\))$/i.test(
          match[1].trim()
        ),
        `${filename}: unsupported radius ${match[1].trim()}`
      );
    }
  }
});

test('selected Figma component contracts are encoded in source', () => {
  const css = (slug) => stripCssComments(read(`library/components/${slug}/${slug}.css`));
  const expectMatch = (source, pattern, message) => assert.match(source, pattern, message);

  const button = css('button');
  expectMatch(button, /height:\s*var\(--size-900\)/, 'button: 36px base height');
  expectMatch(button, /padding:\s*0 var\(--space-250\)/, 'button: 10px horizontal padding');
  expectMatch(button, /gap:\s*var\(--space-100\)/, 'button: 4px icon gap');
  expectMatch(button, /line-height:\s*var\(--font-height-tight\)/, 'button: tight text');
  assert.doesNotMatch(
    button,
    /data-variant="(?:outline|destructive-outline)"/,
    'button: retired variants must not remain'
  );

  const toggle = css('toggle');
  expectMatch(toggle, /height:\s*var\(--size-900\)/, 'toggle: 36px base height');
  expectMatch(toggle, /padding:\s*0 var\(--space-250\)/, 'toggle: 10px horizontal padding');
  expectMatch(toggle, /gap:\s*var\(--space-100\)/, 'toggle: 4px icon gap');

  const tabs = css('tabs');
  expectMatch(tabs, /block-size:\s*var\(--size-900\)/, 'tabs: 36px track');
  expectMatch(tabs, /background:\s*var\(--surface-control\)/, 'tabs: selected control surface');
  expectMatch(tabs, /box-shadow:\s*var\(--shadow-selected\)/, 'tabs: selected shadow');

  const table = css('table');
  expectMatch(table, /padding:\s*0 var\(--space-200\)/, 'table: 8px horizontal padding');
  expectMatch(table, /height:\s*var\(--size-900\)/, 'table: 36px row height');
  expectMatch(table, /background-color:\s*var\(--surface-control-hover\)/, 'table: control hover');

  expectMatch(css('icon'), /\[data-size="xs"\][\s\S]*var\(--size-300\)/, 'icon: 12px size');

  const checkbox = css('checkbox');
  expectMatch(checkbox, /width:\s*var\(--size-400\)/, 'checkbox: 16px width');
  expectMatch(checkbox, /height:\s*var\(--size-400\)/, 'checkbox: 16px height');
  expectMatch(
    checkbox,
    /background-color:\s*var\(--surface-control-inverted\)/,
    'checkbox: invalid checked fill'
  );

  const radio = css('radio-group');
  expectMatch(
    radio,
    /border:\s*var\(--border-width-025\) solid var\(--border-interactive-default\)/
  );
  expectMatch(radio, /background:\s*var\(--surface-control\)/, 'radio card: control fill');
  expectMatch(radio, /box-shadow:\s*var\(--ring-default\)/, 'radio card: default ring');

  const kbd = css('typography');
  expectMatch(kbd, /min-inline-size:\s*var\(--size-500\)/, 'kbd: 20px width');
  expectMatch(kbd, /block-size:\s*var\(--size-500\)/, 'kbd: 20px height');
  expectMatch(kbd, /background:\s*var\(--surface-alpha\)/, 'kbd: alpha surface');
  expectMatch(kbd, /background:\s*var\(--surface-alpha-inverted\)/, 'kbd: inverted surface');
  expectMatch(kbd, /font-variation-settings:\s*var\(--font-text-axis\)/, 'kbd: MONO:0');

  const switchCss = css('switch');
  expectMatch(switchCss, /width:\s*var\(--size-900\)/, 'switch: 36px width');
  expectMatch(switchCss, /height:\s*var\(--size-500\)/, 'switch: 20px height');
  expectMatch(switchCss, /box-shadow:\s*var\(--ring-invalid\)/, 'switch: invalid ring');

  expectMatch(css('spinner'), /\[data-size="xs"\][\s\S]*var\(--size-300\)/, 'spinner: 12px size');
  expectMatch(css('spinner'), /color:\s*var\(--text-primary\)/, 'spinner: primary stroke');

  const avatar = css('avatar');
  expectMatch(avatar, /height:\s*var\(--size-900\)/, 'avatar: 36px base size');
  expectMatch(avatar, /height:\s*var\(--size-200\)/, 'avatar: 8px badge');
  expectMatch(avatar, /color:\s*var\(--text-secondary\)/, 'avatar: secondary fallback');
  expectMatch(avatar, /background-color:\s*var\(--text-positive\)/, 'avatar: positive badge');

  expectMatch(css('tooltip'), /min-block-size:\s*var\(--size-600\)/, 'tooltip: 24px height');
  expectMatch(css('tooltip'), /padding:\s*0 var\(--space-150\)/, 'tooltip: 6px horizontal padding');

  const accordion = css('accordion');
  expectMatch(accordion, /min-block-size:\s*var\(--size-1100\)/, 'accordion: 44px trigger');
  expectMatch(accordion, /padding:\s*0 var\(--space-300\)/, 'accordion: 12px horizontal padding');
  expectMatch(accordion, /gap:\s*var\(--space-200\)/, 'accordion: 8px icon gap');

  expectMatch(css('badge'), /min-block-size:\s*var\(--size-600\)/, 'badge: 24px height');
  expectMatch(css('badge'), /padding:\s*0 var\(--space-150\)/, 'badge: 6px horizontal padding');

  const slider = css('slider');
  expectMatch(slider, /height:\s*var\(--size-100\)/, 'slider: 4px track');
  expectMatch(slider, /height:\s*var\(--size-400\)/, 'slider: 16px thumb');
  expectMatch(
    slider,
    /backdrop-filter:\s*blur\(var\(--blur-400\)\)/,
    'slider: disabled thumb background blur'
  );

  const progress = css('progress');
  expectMatch(progress, /height:\s*var\(--size-150\)/, 'progress: 6px height');
  expectMatch(progress, /background-color:\s*var\(--surface-control\)/, 'progress: control track');
  expectMatch(
    progress,
    /background-color:\s*var\(--surface-control-inverted\)/,
    'progress: inverted value'
  );
  expectMatch(
    progress,
    /background-color:\s*var\(--surface-pointer-disabled\)/,
    'progress: explicit disabled value'
  );

  const tree = css('tree-view');
  for (const variant of [
    'default',
    'first',
    'last',
    'overflowTop',
    'overflowBottom',
    'line',
    'branch',
    'overflow'
  ])
    expectMatch(tree, new RegExp(`data-variant="${variant}"`), `tree indicator: ${variant}`);

  const nav = css('nav');
  expectMatch(nav, /\.nav-search\b/, 'nav: search subprimitive');
  expectMatch(nav, /\.nav-brand\b/, 'nav: brand subprimitive');
  expectMatch(
    nav,
    /data-state="expanded"[\s\S]*var\(--surface-control-hover\)/,
    'nav: expanded state'
  );

  const textarea = css('textarea');
  expectMatch(textarea, /min-height:\s*var\(--size-2000\)/, 'textarea: repository minimum');
  expectMatch(
    textarea,
    /padding:\s*var\(--space-200\) var\(--space-300\)/,
    'textarea: repository padding'
  );
  assert.match(read('library/components/radio-group/radio-group.md'), /conceptual|abstraction/i);
});

test('App Shell provides the shared dense row composition', () => {
  const source = stripCssComments(read('library/components/app-shell/app-shell.css'));
  for (const hook of [
    'app-dense-list',
    'app-dense-row',
    'app-dense-leading',
    'app-dense-copy',
    'app-dense-heading',
    'app-dense-actions'
  ]) {
    assert.match(source, new RegExp(`\\.${hook}\\b`), `missing .${hook}`);
  }
  assert.match(
    source,
    /\.app-dense-row\s*\{[\s\S]*border-block-end:\s*var\(--border-width-025\) dashed var\(--border-muted\)/
  );
  assert.match(source, /\.app-section\s*>\s*:is\([^)]*\.app-dense-list/);
  assert.match(
    source,
    /@media\s*\(max-width:\s*37\.5rem\)[\s\S]*\.app-dense-actions[\s\S]*grid-column:\s*2/
  );
});

test('the base contract provides state and spatial motion with a reduced-motion override', () => {
  const source = stripCssComments(read('library/src/base.css'));
  assert.match(source, /--motion-duration-fast:\s*100ms/);
  assert.match(source, /--motion-duration-spatial:\s*160ms/);
  assert.match(source, /--motion-easing-standard:\s*cubic-bezier\(0\.2, 0, 0, 1\)/);
  assert.match(source, /transition-property:\s*color, background-color, border-color, opacity/);
  assert.match(source, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(source, /transition-duration:\s*0ms/);
});

test('component CSS does not contain consumer-specific selectors', () => {
  const consumerTerms = [
    'bookmark',
    'mewa-bookmarks',
    'rss',
    'hf-ui',
    'media-ui',
    'memes-ui',
    'magpie',
    'moonlight',
    'homelab',
    'dufs',
    'uncanny'
  ];
  for (const component of registry.components) {
    const source = stripCssComments(read(component.files.css)).toLowerCase();
    for (const term of consumerTerms) {
      assert(!source.includes(term), `${component.files.css}: consumer-specific term ${term}`);
    }
  }
});

test('shared CSS rejects raw pixel breakpoints and retired width presets', () => {
  const stylesheets = [
    'library/src/base.css',
    'library/src/tokens.css',
    ...registry.components.map((component) => component.files.css)
  ];
  for (const filename of stylesheets) {
    const source = stripCssComments(read(filename));
    assert(
      !/@media[^{]*\(\s*(?:min|max)-width\s*:\s*\d+(?:\.\d+)?px\s*\)/i.test(source),
      `${filename}: use rem breakpoints`
    );
    assert(
      !/@media[^{]*\(\s*width\s*[<>]=?\s*\d+(?:\.\d+)?px\s*\)/i.test(source),
      `${filename}: use rem breakpoints`
    );
    assert(!/\b78rem\b/.test(source), `${filename}: 78rem is not an approved global canvas`);
    assert(
      !/\b767px\b|\b768px\b/.test(source),
      `${filename}: pixel shell breakpoints are not approved`
    );
  }
});

test('App Shell resets the wrapped mobile navigation margin', () => {
  const source = stripCssComments(read('library/components/app-shell/app-shell.css'));
  assert.match(
    source,
    /\.app-nav\s*\{\s*flex-basis:\s*100%;[\s\S]*?flex-wrap:\s*nowrap;[\s\S]*?margin-block:\s*0;/,
    'mobile App Shell navigation must not overlap adjacent wrapped header content'
  );
});

test('high-risk native-first runtime contracts do not regress', () => {
  const dialog = read('library/components/dialog/dialog.js');
  assert(
    !/dialog\.focus\(\)/.test(dialog),
    'Dialog must let native showModal and autofocus choose initial focus'
  );
  assert(
    !/setAttribute\(['"]tabindex['"]/.test(dialog),
    'Dialog must not add tabindex to native dialog'
  );

  for (const slug of ['popover', 'tooltip']) {
    const source = read(`library/components/${slug}/${slug}.js`);
    assert.match(
      source,
      /delete trigger\.dataset\.mewa\w+Init/,
      `${slug}: missing-target initialization must retry`
    );
  }

  const tabs = read('library/components/tabs/tabs.md');
  assert.match(tabs, /automatic activation/i, 'Tabs must document automatic activation');
  assert(
    !/manual activation mode/i.test(tabs),
    'Tabs must not document an unsupported manual activation mode'
  );

  for (const slug of ['resizable', 'sortable']) {
    const script = read(`library/components/${slug}/${slug}.js`);
    const css = read(`library/components/${slug}/${slug}.css`);
    const skill = read(`library/components/${slug}/${slug}.md`);
    assert.match(
      script,
      /data-(?:resizable|sortable)-(?:decrease|increase)/,
      `${slug}: missing non-drag pointer controls`
    );
    assert.match(
      css,
      new RegExp(
        `\\.${slug === 'resizable' ? 'resizable' : 'sortable'}-step[\\s\\S]*(?:inline-size|width):\\s*var\\(--size-800\\)`
      ),
      `${slug}: pointer controls must use a 32px target`
    );
    assert(
      /Do not (?:rely on dragging|make dragging)/.test(skill),
      `${slug}: skill must prohibit drag-only interaction`
    );
  }

  const carouselCss = read('library/components/carousel/carousel.css');
  assert.match(
    carouselCss,
    /\.carousel-dot[\s\S]*width:\s*var\(--size-600\)/,
    'Carousel direct-slide controls must use a 24px target'
  );
});

test('agent-facing source does not reference the retired layouts directory', () => {
  const filesToCheck = [
    'library/DESIGN.md',
    'README.md',
    'AGENTS.md',
    'llms.txt',
    'library/system/foundations.md',
    'library/system/components.md',
    'library/system/patterns.md',
    'library/system/layouts.md',
    'library/system/accessibility.md',
    'registry.json'
  ];
  for (const filename of filesToCheck) {
    assert(!/\blayouts\//.test(read(filename)), `${filename}: references retired layouts/`);
  }
});

if (failures) process.exitCode = 1;
