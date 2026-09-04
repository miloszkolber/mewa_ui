import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'registry.json'), 'utf8'));
const outputPath = path.join(root, 'docs', 'css', 'components.generated.css');
const mode = process.argv[2] || '--check';

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
