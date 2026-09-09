import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'registry.json'), 'utf8'));
const outputPath = path.join(root, 'docs', 'css', 'components.generated.css');
const mode = process.argv[2] || '--check';
const iconDirectory = path.join(root, 'library', 'src', 'icons');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function render() {
  const sections = registry.components.map((component) => {
    const source = fs.readFileSync(path.join(root, component.files.css), 'utf8').trim();
    return `/* ${component.name} — ${component.files.css} */\n${source}`;
  });
  return `/* Generated from registry.json. Run bun run docs:write after component CSS changes. */\n\n${sections.join('\n\n')}\n`;
}

const expected = render();

if (mode === '--write') {
  fs.writeFileSync(outputPath, expected);
  console.log(`WRITE ${path.relative(root, outputPath)}`);
} else if (mode === '--check') {
  const actual = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  if (actual !== expected) {
    console.error(`FAIL ${path.relative(root, outputPath)} is not generated from registry.json`);
    process.exitCode = 1;
  } else {
    console.log(`PASS ${path.relative(root, outputPath)}`);
  }
} else {
  throw new Error(`Unknown mode: ${mode}`);
}

const layoutPath = path.join(root, 'docs/js/layout.js');
const layout = fs.readFileSync(layoutPath, 'utf8');
const groups = new Map();
for (const component of registry.components) {
  if (!groups.has(component.category)) groups.set(component.category, []);
  groups.get(component.category).push({ label: component.name, href: `${component.slug}.html` });
}
const navigation = [...groups].map(([heading, items]) => ({ heading, items }));
const navBlock = `/* CATALOG-NAV:START */\n  var NAV = ${JSON.stringify(navigation)};\n  var BUILT = new Set(NAV.flatMap(section => section.items.map(item => item.href)));\n  /* CATALOG-NAV:END */`;
const nextLayout = layout.replace(
  /\/\* CATALOG-NAV:START \*\/[\s\S]*?\/\* CATALOG-NAV:END \*\//,
  navBlock
);
if (mode === '--write') fs.writeFileSync(layoutPath, nextLayout);
else if (layout !== nextLayout) {
  console.error('FAIL docs navigation differs from registry.json');
  process.exitCode = 1;
}

const indexPath = path.join(root, 'docs/index.html');
const index = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mewa UI components</title><link rel="stylesheet" href="../library/src/base.css"><link rel="stylesheet" href="../library/src/tokens.css"></head>
<body><main><h1>Mewa UI components</h1><p>Semantic HTML, CSS, and optional JavaScript. Choose a component to view its examples.</p>
${navigation.map((section) => `<section><h2>${section.heading}</h2><ul>${section.items.map((item) => `<li><a href="${item.href}">${item.label}</a></li>`).join('')}</ul></section>`).join('\n')}
</main></body></html>\n`;
if (mode === '--write') fs.writeFileSync(indexPath, index);
else if (!fs.existsSync(indexPath) || fs.readFileSync(indexPath, 'utf8') !== index) {
  console.error('FAIL docs/index.html is not generated from registry.json');
  process.exitCode = 1;
}

const previewPath = path.join(root, 'docs', 'preview.html');

function extractBalanced(source, start, tag) {
  const tagPattern = new RegExp(`</?${tag}(?=[\\s>])`, 'gi');
  tagPattern.lastIndex = start;
  let depth = 0;
  let tagMatch;
  while ((tagMatch = tagPattern.exec(source))) {
    depth += tagMatch[0][1] === '/' ? -1 : 1;
    if (depth === 0) {
      let end = tagMatch.index + tagMatch[0].length;
      if (source[end] === '>') end += 1;
      return { html: source.slice(start, end), start, end };
    }
  }
  throw new Error(`${previewPath}: unbalanced <${tag}> block`);
}

function extractPreviewBlocks(source) {
  const blocks = [];
  const openPattern = /<div\s[^>]*class="preview"[^>]*>/g;
  let open;
  while ((open = openPattern.exec(source))) {
    const block = extractBalanced(source, open.index, 'div');
    blocks.push(block);
    openPattern.lastIndex = block.end;
  }
  return blocks;
}

function extractOuterDialogs(source, excludeRanges) {
  const dialogs = [];
  const openPattern = /<dialog\b[^>]*>/g;
  let open;
  while ((open = openPattern.exec(source))) {
    if (excludeRanges.some((range) => open.index >= range.start && open.index < range.end))
      continue;
    const block = extractBalanced(source, open.index, 'dialog');
    dialogs.push(block);
    openPattern.lastIndex = block.end;
  }
  return dialogs;
}

function forceDialogOpen(fragment) {
  return fragment.replace(/<dialog\b([^>]*)>/g, (whole, attrs) =>
    /\bopen\b/.test(attrs) ? whole : `<dialog${attrs} open>`
  );
}

function namespacePreviewNames(slug, fragment) {
  return fragment.replace(/<input\b[^>]*>/gi, (tag) =>
    /type="(radio|checkbox)"/i.test(tag)
      ? tag.replace(/\sname="([^"]*)"/i, (whole, name) => ` name="${slug}--${name}"`)
      : tag
  );
}

function namespacePreviewIds(slug, fragment, knownIds = new Set()) {
  const ownIds = new Set(Array.from(fragment.matchAll(/\sid="([^"]+)"/g), (match) => match[1]));
  const ids = new Set([...knownIds, ...ownIds]);
  const prefix = `${slug}--`;
  let output = fragment;
  for (const id of ownIds) output = output.split(`id="${id}"`).join(`id="${prefix}${id}"`);
  output = output.replace(
    /\s(for|aria-labelledby|aria-describedby|aria-controls|aria-owns|aria-details|aria-activedescendant|aria-errormessage|form)="([^"]*)"/g,
    (whole, name, value) =>
      ` ${name}="${value
        .split(/\s+/)
        .map((token) => (ids.has(token) ? `${prefix}${token}` : token))
        .join(' ')}"`
  );
  output = output.replace(/\s(href="#)([^"]*)"/g, (whole, head, id) =>
    ids.has(id) ? ` ${head}${prefix}${id}"` : whole
  );
  output = output.replace(
    /\s(popovertarget|anchor|data-[a-z0-9_-]*trigger)="([^"]*)"/gi,
    (whole, name, value) => (ids.has(value) ? ` ${name}="${prefix}${value}"` : whole)
  );
  output = output.replace(
    /(getElementById\(\s*['"])([^'"]+)(['"]\s*\))/g,
    (whole, head, id, tail) => (ids.has(id) ? `${head}${prefix}${id}${tail}` : whole)
  );
  output = output.replace(
    /(querySelector(All)?\(\s*['"]#)([^'"]+)(['"]\s*\))/g,
    (whole, head, all, id, tail) =>
      ids.has(id) && !/[.\s[#:>+~]/.test(id) ? `${head}${prefix}${id}${tail}` : whole
  );
  return namespacePreviewNames(slug, output);
}

function readTagAttributes(tag) {
  const attributes = new Map();
  for (const match of tag.matchAll(/\s([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    attributes.set(match[1], match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attributes;
}

function serializeTagAttributes(attributes) {
  return [...attributes].map(([name, value]) => ` ${name}="${escapeHtml(value)}"`).join('');
}

function inlinePreviewIcons(fragment) {
  return fragment.replace(/<i\b([^>]*)>\s*<\/i>/gi, (whole, attrs) => {
    const lucideName = attrs.match(/\bdata-lucide="([^"]+)"/i)?.[1];
    if (lucideName) {
      const iconPath = path.join(iconDirectory, `${lucideName}.svg`);
      if (!fs.existsSync(iconPath))
        throw new Error(`${previewPath}: missing local icon ${lucideName}`);
      const source = fs.readFileSync(iconPath, 'utf8').trim();
      const opening = source.match(/^<svg\b[^>]*>/i)?.[0];
      if (!opening) throw new Error(`${iconPath}: expected an SVG root element`);

      const svgAttributes = readTagAttributes(opening);
      for (const [name, value] of readTagAttributes(`<i${attrs}>`)) {
        if (name !== 'data-lucide') svgAttributes.set(name, value);
      }
      svgAttributes.set('data-lucide', lucideName);
      svgAttributes.set('data-icon-loaded', '');
      return source.replace(opening, `<svg${serializeTagAttributes(svgAttributes)}>`);
    }

    const classValue = attrs.match(/\bclass="([^"]*)"/i)?.[1] ?? '';
    const remixClass = classValue
      .split(/\s+/)
      .find((name) => /^ri-[a-z0-9-]+$/.test(name) && name !== 'ri-fw');
    if (!remixClass) return whole;
    const iconName = remixClass.slice('ri-'.length);
    const iconPath = path.join(iconDirectory, `${iconName}.svg`);
    if (!fs.existsSync(iconPath)) throw new Error(`${previewPath}: missing local icon ${iconName}`);
    const source = fs.readFileSync(iconPath, 'utf8').trim();
    const opening = source.match(/^<svg\b[^>]*>/i)?.[0];
    if (!opening) throw new Error(`${iconPath}: expected an SVG root element`);

    const svgAttributes = readTagAttributes(opening);
    for (const [name, value] of readTagAttributes(`<i${attrs}>`)) {
      svgAttributes.set(name, value);
    }
    svgAttributes.set('data-remix-icon-loaded', '');
    return source.replace(opening, `<svg${serializeTagAttributes(svgAttributes)}>`);
  });
}

function exposeHiddenPreviewStates(fragment) {
  return fragment.replace(/<([a-z][\w:-]*)([^>]*)>/gi, (whole, tagName, attrs) => {
    if (!/\shidden(?:\s*=\s*(?:"hidden"|'hidden'|hidden))?(?=\s|\/?$)/i.test(attrs)) return whole;
    if (
      tagName.toLowerCase() === 'input' &&
      /\btype\s*=\s*(?:"hidden"|'hidden'|hidden)/i.test(attrs)
    )
      return whole;

    const visibleAttrs = attrs
      .replace(/\shidden(?:\s*=\s*(?:"hidden"|'hidden'|hidden))?/i, '')
      .replace(/\sdata-preview-hidden-state="[^"]*"/i, '');
    return `<${tagName}${visibleAttrs} data-preview-hidden-state="visible">`;
  });
}

const previewSections = [];
const previewModules = [];
for (const component of registry.components) {
  const source = fs.readFileSync(path.join(root, component.docs), 'utf8');
  // Work from the body only: <head> metadata names elements such as
  // <dialog> inside attribute values without rendering them.
  const bodySource = source.slice(source.indexOf('</head>') + '</head>'.length);
  const blocks = extractPreviewBlocks(bodySource);
  if (blocks.length === 0)
    throw new Error(`${component.docs}: no div.preview block found for the preview page`);
  const dialogs = extractOuterDialogs(bodySource, blocks);
  const rawShown = [...blocks.map((block) => block.html), ...dialogs.map((block) => block.html)];
  const knownIds = new Set(
    rawShown.flatMap((html) => Array.from(html.matchAll(/\sid="([^"]+)"/g), (match) => match[1]))
  );
  const themes = ['light', 'dark'].map((theme) => {
    const shown = rawShown
      .map((html) => forceDialogOpen(html))
      .map((html) => namespacePreviewIds(`${component.slug}--${theme}`, html, knownIds))
      .map(exposeHiddenPreviewStates)
      .map(inlinePreviewIcons);
    const className = theme === 'dark' ? 'preview-theme-panel dark' : 'preview-theme-panel';
    const label = theme[0].toUpperCase() + theme.slice(1);
    return `<div class="${className}" data-preview-theme="${theme}" role="group" aria-label="${label} theme">
      <div class="preview-theme-name" aria-hidden="true">${label}</div>
${shown.join('\n')}
    </div>`;
  });
  previewSections.push(
    `<section aria-labelledby="preview-${component.slug}"><h2 id="preview-${component.slug}">${escapeHtml(component.name)}</h2>
      <div class="preview-theme-grid">
${themes.join('\n')}
      </div>
    </section>`
  );
  for (const match of source.matchAll(/<script\s+type="module"\s+src="([^"]+)"\s*><\/script>/g)) {
    if (!previewModules.includes(match[1])) previewModules.push(match[1]);
  }
}
const preview = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <meta name="description" content="Hidden preview that presents every mewa_ui component on one plain page for Figma export.">
  <title>Component preview — mewa_ui</title>
  <link rel="stylesheet" href="../library/src/base.css">
  <link rel="stylesheet" href="../library/src/tokens.css">
  <link rel="stylesheet" href="css/docs-theme.css">
  <link rel="stylesheet" href="css/docs-utilities.css">
  <link rel="stylesheet" href="css/layout.css">
  <link rel="stylesheet" href="css/components.generated.css">
  <style>
    .preview-page {
      max-width: var(--breakpoint-max-dense);
      margin-inline: auto;
      padding: var(--space-800) var(--space-600) var(--space-3200);
      display: flex;
      flex-direction: column;
      gap: var(--space-1200);
    }
    .preview-page > section {
      display: flex;
      flex-direction: column;
      gap: var(--space-400);
      min-width: 0;
    }
    .preview-theme-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
      gap: var(--space-600);
    }
    .preview-theme-panel {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-400);
      padding: var(--space-400);
      color: var(--text-primary);
      background: var(--background);
      border: var(--border-width-025) solid var(--border-primary);
    }
    .preview-theme-name {
      font-size: var(--font-size-350);
      font-weight: var(--font-weight-525);
      line-height: var(--font-height-tight);
      color: var(--text-secondary);
    }
    .preview-theme-switch {
      display: none;
    }
    .preview-theme-switch button {
      min-height: var(--size-400);
      padding-inline: var(--space-300);
      border: var(--border-width-025) solid var(--border-primary);
      color: var(--text-secondary);
      background: var(--surface-control-transparent);
      font: inherit;
      cursor: pointer;
    }
    .preview-theme-switch button[aria-pressed="true"] {
      color: var(--text-inverted);
      background: var(--surface-control-inverted);
      border-color: var(--border-interactive-inverted);
    }
    .preview-page .preview {
      min-width: 0;
    }
    /* Keep the captured surface deterministic. */
    .preview-page,
    .preview-page * {
      animation: none !important;
      transition: none !important;
      scroll-behavior: auto !important;
    }
    /* Export visual examples for states that are normally hidden by HTML or
       enhancement code. Keep native hidden inputs out of the canvas. */
    .preview-page [hidden]:not(input[type="hidden"]) {
      display: revert !important;
    }
    /* The marker survives runtime enhancement when a component restores the
       hidden attribute for an inactive state. */
    .preview-page [data-preview-hidden-state="visible"] {
      display: revert !important;
    }
    /* Let in-flow overlay states wrap with their triggers on narrow
       screens. This is a no-op wherever content already fits. */
    .preview-page div.preview > div {
      flex-wrap: wrap;
    }
    /* Showcase hidden dialog states statically: dialogs render as
       in-flow panels so every state stays visible without interaction
       and remains exportable. Popovers render as in-flow blocks, except
       inside navigation menus where in-flow panels would stretch the
       horizontal bar: those render at their static position overlaying
       the content below, like an open menu. */
    .preview-page dialog[open] {
      position: static !important;
      inset: auto !important;
      display: block !important;
      width: min(100%, 28rem);
      max-width: 100%;
      max-height: none;
      margin: 0;
      opacity: 1 !important;
      transform: none !important;
    }
    .preview-page [popover] {
      position: static !important;
      inset: auto !important;
      display: block !important;
      max-width: 100%;
      margin: var(--space-300) 0;
      opacity: 1 !important;
      transform: none !important;
    }
    .preview-page nav [popover] {
      position: static !important;
      display: block !important;
    }
    .preview-page dialog.sheet[open] {
      position: relative !important;
      width: min(100%, 24rem);
      height: auto;
    }
    .preview-page dialog.sheet[data-side="bottom"][open] {
      width: 100%;
    }
    body.preview-export > .toast-container {
      position: static !important;
      inset: auto !important;
      width: min(100%, 26rem);
      max-height: none;
      margin: var(--space-600) auto var(--space-1200);
      padding: 0;
      transform: none !important;
      align-items: stretch;
    }
    body.preview-export > .toast-container .toast[popover] {
      position: static !important;
      inset: auto !important;
      margin: 0;
    }
    @media (max-width: 48rem) {
      .preview-page {
        padding-inline: var(--space-400);
      }
      .preview-theme-switch {
        position: sticky;
        top: var(--space-400);
        z-index: 2;
        display: flex;
        align-items: center;
        gap: var(--space-200);
        width: fit-content;
        padding: var(--space-200);
        color: var(--text-secondary);
        background: var(--background);
        border: var(--border-width-025) solid var(--border-primary);
      }
      .preview-theme-switch span {
        padding-inline: var(--space-200);
        font-size: var(--font-size-300);
      }
      .preview-theme-grid {
        grid-template-columns: 1fr;
      }
      .preview-theme-panel[data-preview-theme="dark"] {
        display: none;
      }
      .preview-page[data-preview-theme="dark"] .preview-theme-panel[data-preview-theme="light"] {
        display: none;
      }
      .preview-page[data-preview-theme="dark"] .preview-theme-panel[data-preview-theme="dark"] {
        display: flex;
      }
    }
  </style>
</head>
<body class="preview-export">
  <a class="skip-link docs-skip-link" href="#main-content">Skip to content</a>
  <main class="preview-page" id="main-content" data-export-surface="figma" tabindex="-1">
    <div>
      <h1>Component preview</h1>
      <p>Hidden quality-assurance page. Every component renders in forced light and dark themes for comparison. This page is not linked from the documentation navigation.</p>
    </div>
    <div class="preview-theme-switch" role="group" aria-label="Mobile preview theme">
      <span>Theme</span>
      <button type="button" data-preview-theme-option="light" aria-pressed="true">Light</button>
      <button type="button" data-preview-theme-option="dark" aria-pressed="false">Dark</button>
    </div>

${previewSections.join('\n')}
  </main>

  <!-- Static fallback for importers that do not execute the toast module. -->
  <div id="toast-container" class="toast-container" role="region" aria-label="Notifications" data-position="bottom-right">
    <div class="toast" role="status" aria-live="polite" aria-atomic="true">
      <div class="toast-content">
        <div class="toast-text">
          <p class="toast-title">Event created</p>
          <p class="toast-description">Monday, January 3rd at 6:00pm</p>
        </div>
        <button class="toast-close" type="button" data-toast-close aria-label="Dismiss">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  </div>

  <script src="js/site.js" defer></script>
${previewModules.map((src) => `  <script type="module" src="${src}"></script>`).join('\n')}
  <script>
    // Keep the showcase in place: example links, buttons, and forms
    // must not navigate away from the preview page.
    document.addEventListener('click', (event) => {
      const target = event.target.closest('a[href], [formaction]');
      if (target && !target.closest('.skip-link')) event.preventDefault();
    });
    document.addEventListener('submit', (event) => event.preventDefault());
<    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-preview-theme-option]');
      const page = document.querySelector('.preview-page');
      if (!button || !page) return;
      const theme = button.dataset.previewThemeOption;
      if (theme !== 'light' && theme !== 'dark') return;
      page.dataset.previewTheme = theme;
      document.querySelectorAll('[data-preview-theme-option]').forEach((option) => {
        option.setAttribute('aria-pressed', String(option.dataset.previewThemeOption === theme));
      });
    });
    // Keep a runtime fallback for importers that remove the static toast.
    window.addEventListener('DOMContentLoaded', () => {
      if (!document.querySelector('#toast-container .toast')) {
        window.toast?.show({
          title: 'Event created',
          description: 'Monday, January 3rd at 6:00pm',
          duration: Infinity
        });
      }
      // Enhancement code can restore hidden attributes for inactive panels or
      // paginated rows. The export surface keeps every documented state visible.
      document.querySelectorAll('.preview-page [data-preview-hidden-state="visible"]').forEach((element) => {
        element.removeAttribute('hidden');
      });
    });
  </script>
</body>
</html>
`;
if (mode === '--write') fs.writeFileSync(previewPath, preview);
else if (!fs.existsSync(previewPath) || fs.readFileSync(previewPath, 'utf8') !== preview) {
  console.error('FAIL docs/preview.html is not generated from registry.json');
  process.exitCode = 1;
}
const fallback =
  '<site-nav><noscript><nav aria-label="Documentation"><a href="index.html">All components</a></nav></noscript></site-nav>';
for (const component of registry.components) {
  const filename = path.join(root, component.docs);
  const source = fs.readFileSync(filename, 'utf8');
  if (mode === '--write')
    fs.writeFileSync(filename, source.replace(/<site-nav>[\s\S]*?<\/site-nav>/g, fallback));
  else if (!source.includes(fallback)) {
    console.error(`FAIL ${component.docs}: missing native documentation navigation`);
    process.exitCode = 1;
  }
}
