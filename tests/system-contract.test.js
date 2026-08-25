"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
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
  "system/foundations.md",
  "system/components.md",
  "system/patterns.md",
  "system/layouts.md",
  "system/accessibility.md"
];

function proseLines(source) {
  const result = [];
  let fenced = false;

  source.split(/\r?\n/).forEach((line, index) => {
    if (line.startsWith("```")) {
      fenced = !fenced;
      return;
    }
    if (fenced) return;
    if (!line.trim()) return;
    if (/^#{1,3}\s/.test(line)) return;
    if (/^\s*(?:[-*]|\d+\.)\s/.test(line)) return;
    if (line.startsWith("|")) return;
    result.push({ line, number: index + 1 });
  });

  return result;
}

function sentenceWordCount(sentence) {
  const withoutMarkup = sentence
    .replace(/`[^`]+`/g, "term")
    .replace(/\[[^\]]+\]\([^\)]+\)/g, "link");
  return (withoutMarkup.match(/\b[\w'-]+\b/g) || []).length;
}

test("the agent-facing system has one compact file per concern", () => {
  systemFiles.forEach((file) => assert(exists(file), `missing ${file}`));
  const actual = fs.readdirSync(path.join(root, "system")).filter((name) => name.endsWith(".md")).sort();
  assert.deepEqual(actual, systemFiles.map((file) => path.basename(file)).sort());
});

test("DESIGN routes agents through every system file", () => {
  const design = read("DESIGN.md");
  systemFiles.forEach((file) => assert(design.includes(`\`${file}\``), `DESIGN.md does not reference ${file}`));
  assert.match(design, /A component is a reusable control or content region\./);
  assert.match(design, /A pattern is a documented composition of components\./);
  assert.match(design, /A layout is a complete serveable page template\./);
});

test("the component selection guide covers the registry exactly", () => {
  const registry = JSON.parse(read("registry.json"));
  const guide = read("system/components.md");
  const slugs = Array.from(guide.matchAll(/\(\.\.\/components\/([^/]+)\/\1\.md\)/g), (match) => match[1]);
  const registered = registry.components.map((component) => component.slug);

  assert.equal(slugs.length, registry.components.length);
  assert.deepEqual(new Set(slugs), new Set(registered));

  registered.forEach((slug) => {
    const contract = `Contract: [\`components/${slug}/${slug}.md\`](../components/${slug}/${slug}.md).`;
    assert(guide.includes(contract), `${slug}: missing exact contract link`);
  });
});

test("every component selection entry states purpose, use, misuse, behavior, and runtime", () => {
  const guide = read("system/components.md");
  const blocks = guide.split(/^### /m).slice(1);
  assert.equal(blocks.length, 59);

  blocks.forEach((block) => {
    const name = block.split(/\r?\n/, 1)[0];
    assert.match(block, /^.+\n\nPurpose: .+\n/m, `${name}: missing Purpose`);
    assert.match(block, /\nUse .+\n/, `${name}: missing Use`);
    assert.match(block, /\nDo not .+\n/, `${name}: missing misuse rule`);
    assert.match(block, /\nBehavior: .+\n/, `${name}: missing Behavior`);
    assert.match(block, /\nRuntime: (?:None|Optional|Required)\./, `${name}: missing Runtime`);
    assert.match(block, /\nContract: \[`components\//, `${name}: missing Contract`);
  });
});

test("agent-facing prose stays shallow and compact", () => {
  const files = ["DESIGN.md", "AGENTS.md", "llms.txt", "layouts/README.md", ...systemFiles];

  files.forEach((file) => {
    const source = read(file);
    assert(!/^####\s/m.test(source), `${file}: headings must not nest below level three`);

    proseLines(source).forEach(({ line, number }) => {
      line.split(/(?<=[.!?])\s+/).forEach((sentence) => {
        const count = sentenceWordCount(sentence);
        assert(count <= 28, `${file}:${number}: sentence has ${count} words`);
      });
    });
  });
});

test("layout documentation defines two families and three references", () => {
  const files = ["DESIGN.md", "README.md", "llms.txt", "layouts/README.md", "system/layouts.md"];

  files.forEach((file) => {
    const source = read(file);
    assert.match(source, /two (?:layout|shell) families/i, `${file}: missing two-family contract`);
    ["vertical-navbar.html", "horizontal-navbar.html", "app-shell-sidebar.html"].forEach((name) => {
      assert(source.includes(name), `${file}: missing ${name}`);
    });
  });
});

test("the docs do not retain stale layout counts", () => {
  const files = ["DESIGN.md", "README.md", "llms.txt", "layouts/README.md", ...systemFiles];
  const stale = /two (?:complete reusable )?(?:application-shell )?templates/i;
  files.forEach((file) => assert(!stale.test(read(file)), `${file}: stale two-template wording`));
});

test("high-risk component guides expose an explicit selection contract", () => {
  for (const file of [
    "components/button/button.md",
    "components/combobox/combobox.md",
    "components/app-shell/app-shell.md"
  ]) {
    const source = read(file);
    assert.match(source, /^## Purpose\s/m, `${file}: missing Purpose`);
    assert.match(source, /^## Native basis\s/m, `${file}: missing Native basis`);
    assert.match(source, /^## Native Web APIs\s/m, `${file}: missing Native Web APIs`);
    assert.match(source, /^## Behavior\s/m, `${file}: missing Behavior`);
    assert.match(source, /^## Runtime\s/m, `${file}: missing Runtime`);
  }
});

test("Combobox has a labelled searchable input and a submitted value contract", () => {
  const skill = read("components/combobox/combobox.md");
  const script = read("components/combobox/combobox.js");
  const css = read("components/combobox/combobox.css");

  assert.match(skill, /data-combobox-input/);
  assert.match(skill, /aria-label="Search frameworks"/);
  assert.match(skill, /aria-labelledby="framework-label framework-value"/);
  assert(!/style="/.test(skill), "Combobox examples must not carry inline styles");
  assert.match(script, /querySelector\('\[data-combobox-input\]'\)/);
  assert.match(script, /searchInput\.focus\(\)/);
  assert.match(script, /new Event\('input', \{ bubbles: true \}\)/);
  assert.match(script, /new Event\('change', \{ bubbles: true \}\)/);
  assert(!/height:\s*1px/.test(css));
  assert(!/-0\.25rem/.test(css));
});

test("App Shell documentation stays generic", () => {
  const skill = read("components/app-shell/app-shell.md");
  assert(!/bookmarks|\brss\b/i.test(skill));
  assert.match(skill, /Do not duplicate the product brand in a composed sidebar header\./);
  assert.match(skill, /Do not use `Card > Table` nesting\./);
});

if (failures) process.exitCode = 1;
