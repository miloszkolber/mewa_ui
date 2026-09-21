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
// Components live one level below a category directory. Derive paths from the
// registry so the physical grouping can change without editing every test.
const componentFile = (slug, key) => {
  const component = registry.components.find((entry) => entry.slug === slug);
  assert(component, `unknown component ${slug}`);
  return component.files[key];
};
const componentDirectories = () =>
  directories(componentsDir)
    .flatMap((category) => directories(path.join(componentsDir, category)))
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
    documentation: 'docs/preview.html',
    figmaDocumentation: 'docs/figma.html',
    system: 'library/system/'
  });
  assert(!exists('layouts'), 'complete layout templates must not ship in this repository');
});

test('registry selection metadata covers every component', () => {
  assert.equal(registry.components.length, 80);
  const slugs = registry.components.map((component) => component.slug).sort();
  assert.deepEqual(slugs, componentDirectories());

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
    assert.match(
      component.files.skill,
      new RegExp(`^library/components/[a-z-]+/${component.slug}/${component.slug}\\.md$`)
    );
    assert.match(
      component.files.css,
      new RegExp(`^library/components/[a-z-]+/${component.slug}/${component.slug}\\.css$`)
    );
    assert.equal(component.docs, `docs/preview.html#preview-${component.slug}`);
    if (component.jsMode === 'none')
      assert.equal(component.files.js, undefined, `${component.slug}: unexpected module`);
    else
      assert.match(
        component.files.js,
        new RegExp(`^library/components/[a-z-]+/${component.slug}/${component.slug}\\.js$`)
      );
    for (const file of [component.files.skill, component.files.css, component.files.js].filter(
      Boolean
    )) {
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
    const names = files(path.join(root, path.dirname(component.files.css)));
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

test('documentation covers every component with separate playgrounds and inert state matrices', () => {
  const preview = read('docs/preview.html');
  const figma = read('docs/figma.html');
  const specimens = JSON.parse(read('docs/specimens.json'));
  assert(!preview.includes('href="figma.html'), 'playgrounds do not link to the export matrix');
  assert(!figma.includes('href="preview.html'), 'the export matrix does not link to playgrounds');
  assert(!figma.includes('class="docs-sidebar"'), 'the export matrix has no navigation chrome');
  assert(!preview.includes('As authored'));
  assert(!preview.includes('name="example"'));
  assert(preview.includes('name="prop:part-button:0:disabled"'));
  assert(
    !preview.includes('name="prop:part-button:0:data-variant"'),
    'a grouped button does not own its variant'
  );
  assert(!preview.includes('name="instance:part-button"'));
  assert(figma.includes('data-part="part-message-bubble"'));
  assert(
    !figma.includes('data-part="part-button"'),
    'standalone Button matrix owns button states rather than repeating parent cards'
  );
  assert.deepEqual(files(docsDir, '.html'), ['figma.html', 'preview.html']);
  assert.deepEqual(
    specimens.map((c) => c.slug),
    registry.components.map((c) => c.slug)
  );
  for (const page of [preview, figma]) {
    assert(page.includes('data-docs-theme-toggle'));
    assert(!page.includes('preview-theme-panel'), 'only one selected theme is rendered');
    const ids = [...page.matchAll(/\\sid="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(new Set(ids).size, ids.length, 'each state cell needs independent IDs');
    for (const c of registry.components) assert(page.includes(`id="preview-${c.slug}"`));
  }
  // Every component anchor opens either one playground with controls or one
  // static presentation (Typography).
  assert.equal(
    (preview.match(/class="playground-controls"/g) || []).length +
      (preview.match(/class="component-playground component-presentation"/g) || []).length,
    registry.components.length
  );
  assert(
    preview.includes(
      'class="component-playground component-presentation" data-component="typography"'
    )
  );
  assert.equal(
    (figma.match(/class="matrix-specimens" inert/g) || []).length,
    registry.components.length
  );
  assert(
    !figma.includes('playground.generated.js'),
    'component behavior must not run in the matrix'
  );
  const toasts = specimens.find((c) => c.slug === 'toast').specimens;
  assert(toasts.some((s) => s.html.includes('toast-actions')));
  assert(toasts.some((s) => !s.html.includes('toast-actions')));
  assert(toasts.every((s) => s.html.startsWith('<div class="toast"')));
  for (const slug of ['dialog', 'sheet', 'popover', 'tooltip', 'hover-card', 'context-menu']) {
    const entry = specimens.find((c) => c.slug === slug);
    assert(
      entry.specimens.every(
        (s) => !/data-(dialog|sheet|tooltip|hover-card|context-menu)-trigger=/.test(s.html)
      ),
      slug + ': launcher leaked into isolated specimens'
    );
  }
  assert(!read('docs/workbench.css').includes('display: revert !important'));
});

test('single-line input controls and action controls use the 36px token', () => {
  const expectSize900 = (slug, selector) => {
    const source = stripCssComments(read(`${componentFile(slug, 'css')}`));
    assert(source.includes(selector), `${slug}: expected ${selector}`);
  };

  for (const [slug, selector] of [
    ['field', 'min-block-size: var(--size-900)'],
    ['text-field', 'block-size: var(--size-900)'],
    ['select', 'height: var(--size-900)'],
    ['number-field', 'height: var(--size-900)'],
    ['date-field', 'height: var(--size-900)'],
    ['date-range-picker', 'block-size: var(--size-900)'],
    ['time-field', 'min-block-size: var(--size-900)'],
    ['combobox', 'height: var(--size-900)'],
    ['file-input', 'height: var(--size-900)'],
    ['file-upload', 'block-size: var(--size-900)'],
    ['color-picker', 'block-size: var(--size-900)'],
    ['input-otp', 'block-size: var(--size-900)'],
    ['tag-input', 'block-size: var(--size-900)'],
    ['command-palette', 'min-block-size: var(--size-900)'],
    ['data-table', 'height: var(--size-900)'],
    ['pagination', 'height: var(--size-900)'],
    ['date-picker', 'height: var(--size-900)']
  ]) {
    expectSize900(slug, selector);
  }
  assert.match(read(componentFile('select', 'skill')), /36px control height/);
  assert.match(
    read('library/system/foundations.md'),
    /default 36px button and single-line input height/
  );
});

test('Typography covers semantic Markdown document output', () => {
  const typography = stripCssComments(read(componentFile('typography', 'css')));
  const guide = read(componentFile('typography', 'skill'));
  for (const element of [
    'h1:not([class])',
    'h6:not([class])',
    'p:not([class])',
    'ul:not([class])',
    'a:not([class])',
    'strong:not([class])',
    'del:not([class])',
    'code:not([class])',
    'pre:not([class])',
    'blockquote:not([class])',
    'table:not([class])',
    'hr:not([class])',
    'img:not([class])',
    'figure:not([class])',
    'details:not([class])'
  ]) {
    assert(typography.includes(element), `Typography Markdown styles must cover ${element}`);
  }
  assert(guide.includes('Wrap renderer output in `.typography-content`'));
  assert(
    JSON.parse(read('docs/specimens.json'))
      .find((c) => c.slug === 'typography')
      .specimens.some((s) => s.html.includes('class="typography-content"'))
  );
});

test('component documentation anchors resolve in the preview', () => {
  const preview = read('docs/preview.html');
  for (const component of registry.components) {
    assert(preview.includes(`id="preview-${component.slug}"`));
    assert.equal(component.docs, `docs/preview.html#preview-${component.slug}`);
  }
});

test('human documentation stays free of internal and unrelated-library language', () => {
  const discouragedPhrases = [
    'Kernel-aligned',
    'component skill',
    'design-system demo',
    'canonical popover pattern'
  ];

  const source = read('docs/preview.html');
  for (const phrase of discouragedPhrases) {
    assert(
      !source.includes(phrase),
      `docs/preview.html: contains internal-facing phrase ${phrase}`
    );
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
        /^box-shadow\s*:\s*(?:var\(--ring-(?:default|invalid)\)|none)$/i,
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
  const css = (slug) => stripCssComments(read(`${componentFile(slug, 'css')}`));
  const expectMatch = (source, pattern, message) => assert.match(source, pattern, message);

  const button = css('button');
  expectMatch(button, /height:\s*var\(--size-900\)/, 'button: 36px base height');
  expectMatch(button, /padding:\s*0 var\(--space-250\)/, 'button: 10px horizontal padding');
  expectMatch(button, /gap:\s*var\(--space-100\)/, 'button: 4px icon gap');
  expectMatch(button, /line-height:\s*var\(--font-height-tight\)/, 'button: tight text');
  assert.doesNotMatch(button, /data-size/, 'button: one 36px size only');
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
  expectMatch(tabs, /border-color:\s*var\(--border-selected\)/, 'tabs: selected boundary');
  assert.doesNotMatch(tabs, /var\(--shadow-selected\)/, 'tabs: no decorative selected shadow');

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
  assert.doesNotMatch(avatar, /data-size/, 'avatar: one 36px size only');

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
  assert.doesNotMatch(slider, /backdrop-filter:\s*blur/, 'slider: controls must not blur');

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
  assert.match(read(componentFile('radio-group', 'skill')), /conceptual|abstraction/i);
});

test('App Shell provides the shared dense row composition', () => {
  const source = stripCssComments(read(componentFile('app-shell', 'css')));
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
  const source = stripCssComments(read(componentFile('app-shell', 'css')));
  assert.match(
    source,
    /\.app-nav\s*\{\s*flex-basis:\s*100%;[\s\S]*?flex-wrap:\s*nowrap;[\s\S]*?margin-block:\s*0;/,
    'mobile App Shell navigation must not overlap adjacent wrapped header content'
  );
});

test('high-risk native-first runtime contracts do not regress', () => {
  const dialog = read(componentFile('dialog', 'js'));
  assert(
    !/dialog\.focus\(\)/.test(dialog),
    'Dialog must let native showModal and autofocus choose initial focus'
  );
  assert(
    !/setAttribute\(['"]tabindex['"]/.test(dialog),
    'Dialog must not add tabindex to native dialog'
  );

  for (const slug of ['popover', 'tooltip']) {
    const source = read(`${componentFile(slug, 'js')}`);
    assert.match(
      source,
      /delete trigger\.dataset\.mewa\w+Init/,
      `${slug}: missing-target initialization must retry`
    );
  }

  const tabs = read(componentFile('tabs', 'skill'));
  assert.match(tabs, /automatic activation/i, 'Tabs must document automatic activation');
  assert(
    !/manual activation mode/i.test(tabs),
    'Tabs must not document an unsupported manual activation mode'
  );

  for (const slug of ['resizable', 'sortable']) {
    const script = read(`${componentFile(slug, 'js')}`);
    const css = read(`${componentFile(slug, 'css')}`);
    const skill = read(`${componentFile(slug, 'skill')}`);
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

  const carouselCss = read(componentFile('carousel', 'css'));
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
