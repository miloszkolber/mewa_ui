import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const componentsDirectory = path.join(repo, 'library', 'components');
const output = path.join(here, 'source-contracts.generated.json');

const sort = (values) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

function fencedHtml(markdown) {
  return [...markdown.matchAll(/```html\s*\n([\s\S]*?)```/gi)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function findValues(source, attribute) {
  const expression = new RegExp(`${attribute}\\s*=\\s*["']([^"']+)["']`, 'gi');
  return sort(
    [...source.matchAll(expression)]
      .flatMap((match) => match[1].split(/\s+/))
      .map((value) => value.trim())
      .filter((value) => value && !value.includes('{')),
  );
}

function collectMarkup(markup) {
  const tags = [];
  const classes = [];
  const attributes = [];
  const dataAxes = {};
  const tagExpression = /<([a-z][\w-]*)([^>]*)>/gi;

  for (const match of markup.matchAll(tagExpression)) {
    tags.push(match[1]);
    const raw = match[2];
    for (const attribute of raw.matchAll(/\s([:\w-]+)(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/g)) {
      attributes.push(attribute[1]);
    }
    for (const className of raw.matchAll(/class\s*=\s*["']([^"']+)["']/gi)) {
      classes.push(...className[1].split(/\s+/));
    }
    for (const dataAttribute of raw.matchAll(/data-([\w-]+)\s*=\s*["']([^"']+)["']/gi)) {
      const axis = dataAttribute[1];
      const value = dataAttribute[2];
      if (value.includes('{')) continue;
      dataAxes[axis] ??= [];
      dataAxes[axis].push(value);
    }
  }

  return {
    tags: sort(tags),
    classes: sort(classes),
    attributes: sort(attributes),
    dataAxes: Object.fromEntries(
      Object.entries(dataAxes)
        .map(([axis, values]) => [axis, sort(values)])
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  };
}

function parseAttributes(raw) {
  const attributes = {};
  for (const match of raw.matchAll(/([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    const [, name, doubleQuoted, singleQuoted, bare] = match;
    if (name === '/') continue;
    attributes[name] = doubleQuoted ?? singleQuoted ?? bare ?? true;
  }
  return attributes;
}

function markupTree(markup) {
  const root = { tag: 'fragment', children: [] };
  const stack = [root];
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'path', 'source', 'track', 'wbr']);
  const tokens = /<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>|[^<]+/g;

  for (const token of markup.matchAll(tokens)) {
    const value = token[0];
    if (value.startsWith('<!--')) continue;
    if (value.startsWith('</')) {
      const tag = value.slice(2, -1).trim().toLowerCase();
      for (let index = stack.length - 1; index > 0; index -= 1) {
        if (stack[index].tag === tag) {
          stack.length = index;
          break;
        }
      }
      continue;
    }
    if (value.startsWith('<')) {
      const match = value.match(/^<([A-Za-z][\w-]*)([\s\S]*?)\/?\s*>$/);
      if (!match) continue;
      const tag = match[1].toLowerCase();
      const node = { tag, attributes: parseAttributes(match[2]), children: [] };
      stack.at(-1).children.push(node);
      if (!voidTags.has(tag) && !value.endsWith('/>')) stack.push(node);
      continue;
    }
    const text = value.replace(/\s+/g, ' ').trim();
    if (text) stack.at(-1).children.push({ text });
  }
  return root.children;
}

function collectCss(css) {
  // Require a selector-like identifier after the dot so decimal values such as
  // `1.08em` never become fictitious CSS classes in the extracted anatomy.
  const classes = [...css.matchAll(/(^|[^\w-])\.([A-Za-z_-][\w-]*)/gm)].map((match) => match[2]);
  const dataAxes = {};
  for (const match of css.matchAll(/data-([\w-]+)\s*=\s*["']([^"']+)["']/gi)) {
    dataAxes[match[1]] ??= [];
    dataAxes[match[1]].push(match[2]);
  }
  const states = [];
  if (/:hover\b/.test(css)) states.push('hover');
  if (/:focus(?:-visible)?\b/.test(css)) states.push('focus');
  if (/\[disabled\]|\[aria-disabled/.test(css)) states.push('disabled');
  if (/\[open\]|\[data-state\s*=\s*["']open/.test(css)) states.push('open');
  if (/\[aria-selected\s*=\s*["']true/.test(css)) states.push('selected');
  if (/\[aria-invalid\s*=\s*["']true|\[data-state\s*=\s*["']invalid/.test(css)) states.push('invalid');

  return {
    classes: sort(classes),
    dataAxes: Object.fromEntries(
      Object.entries(dataAxes)
        .map(([axis, values]) => [axis, sort(values)])
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
    states: sort(states),
  };
}

function mergeAxes(...axes) {
  const merged = {};
  for (const source of axes) {
    for (const [axis, values] of Object.entries(source)) {
      merged[axis] ??= [];
      merged[axis].push(...values);
    }
  }
  return Object.fromEntries(
    Object.entries(merged)
      .map(([axis, values]) => [axis, sort(values)])
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

function headingList(markdown) {
  return [...markdown.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim());
}

async function sourceOrEmpty(file) {
  try {
    return await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return '';
    throw error;
  }
}

const directories = (await readdir(componentsDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));

const components = [];
for (const id of directories) {
  const directory = path.join(componentsDirectory, id);
  const markdown = await sourceOrEmpty(path.join(directory, `${id}.md`));
  const css = await sourceOrEmpty(path.join(directory, `${id}.css`));
  const javascript = await sourceOrEmpty(path.join(directory, `${id}.js`));
  const examples = fencedHtml(markdown);
  const markup = examples.join('\n\n');
  const markupInfo = collectMarkup(markup);
  const cssInfo = collectCss(css);
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? id;
  const hash = createHash('sha256')
    .update(markdown)
    .update('\0')
    .update(css)
    .update('\0')
    .update(javascript)
    .digest('hex');

  components.push({
    id,
    title,
    source: {
      markdown: `library/components/${id}/${id}.md`,
      css: `library/components/${id}/${id}.css`,
      javascript: javascript ? `library/components/${id}/${id}.js` : null,
      hash,
    },
    canonicalMarkup: examples,
    canonicalStructure: examples.map(markupTree),
    anatomy: {
      tags: markupInfo.tags,
      classes: sort([...markupInfo.classes, ...cssInfo.classes]),
      attributes: markupInfo.attributes,
    },
    axes: mergeAxes(markupInfo.dataAxes, cssInfo.dataAxes),
    states: cssInfo.states,
    sections: headingList(markdown),
  });
}

const document = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceRoot: 'library/components',
  components,
};

await mkdir(here, { recursive: true });
await writeFile(output, `${JSON.stringify(document, null, 2)}\n`);
console.log(`Extracted ${components.length} component contracts to ${path.relative(repo, output)}.`);
