import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'registry.json'), 'utf8'));
const outputPath = path.join(root, 'docs', 'css', 'components.generated.css');
const previewPath = path.join(root, 'docs', 'preview.html');
const mode = process.argv[2] || '--check';

function renderStyles() {
  const sections = registry.components.map((component) => {
    const source = fs.readFileSync(path.join(root, component.files.css), 'utf8').trim();
    return `/* ${component.name} — ${component.files.css} */\n${source}`;
  });
  return `/* Generated from registry.json. Run bun run docs:write after component CSS changes. */\n\n${sections.join('\n\n')}\n`;
}

const expected = renderStyles();
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

if (!fs.existsSync(previewPath)) {
  console.error('FAIL docs/preview.html is missing');
  process.exitCode = 1;
} else {
  console.log('PASS docs/preview.html');
}
