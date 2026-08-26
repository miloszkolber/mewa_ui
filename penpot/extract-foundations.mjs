import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { foundationOverrides } from './foundation-overrides.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const base = await readFile(path.join(repo, 'library/src/base.css'), 'utf8');
const semantic = await readFile(path.join(repo, 'library/src/tokens.css'), 'utf8');

// Capture only custom-property declarations. The previous expression used literal
// `s*` tokens, which happened to match simple declarations but did not consume
// whitespace and could produce incorrect values when a declaration contained it.
const propertyExpression = /^\s*(--[a-z0-9-]+)\s*:\s*([^;{}]+);/gim;

function properties(source) {
  return [...source.matchAll(propertyExpression)].map((match) => ({
    cssName: match[1],
    value: match[2].trim(),
  }));
}

function selectorBlock(source, selector) {
  const start = source.indexOf(selector);
  if (start === -1) return '';
  const open = source.indexOf('{', start);
  if (open === -1) return '';
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(open + 1, index);
  }
  return '';
}

function penpotName(cssName) {
  return cssName.replace(/^--/, '').replaceAll('-', '.');
}

function pixelValue(value) {
  const rem = value.match(/^(-?\d*\.?\d+)rem$/);
  if (rem) return Number(rem[1]) * 16;
  const px = value.match(/^(-?\d*\.?\d+)px$/);
  if (px) return Number(px[1]);
  return null;
}

function records(source) {
  return properties(source).map(({ cssName, value }) => ({
    cssName,
    penpotName: penpotName(cssName),
    value,
    ...(pixelValue(value) === null ? {} : { px: pixelValue(value) }),
  }));
}

const output = {
  schemaVersion: 1,
  source: {
    base: 'library/src/base.css',
    semantic: 'library/src/tokens.css',
    remBasePx: 16,
  },
  overrides: foundationOverrides,
  sets: {
    'mewa-core': records(selectorBlock(base, ':root')),
    'mewa-light': records(selectorBlock(semantic, ':root')),
    'mewa-dark': records(selectorBlock(semantic, '.dark')),
  },
};

await writeFile(path.join(here, 'foundations.generated.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log('Extracted Penpot foundation references.');
