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
  "library/system/foundations.md",
  "library/system/components.md",
  "library/system/patterns.md",
  "library/system/layouts.md",
  "library/system/accessibility.md"
];

function sentenceWordCount(sentence) {
  return (sentence
    .replace(/`[^`]+`/g, "term")
    .replace(/\[[^\]]+\]\([^)]+\)/g, "link")
    .match(/\b[\w'-]+\b/g) || []).length;
}

function checkCompactProse(filename) {
  const source = read(filename);
  assert(!/^####\s/m.test(source), `${filename}: headings must not nest below level three`);

  let fenced = false;
  source.split(/\r?\n/).forEach((line, index) => {
    if (line.startsWith("```")) {
      fenced = !fenced;
      return;
    }
    if (fenced || !line.trim() || /^#{1,3}\s/.test(line) || line.startsWith("|")) return;
    if (/^\s*(?:[-*]|\d+\.)\s/.test(line)) return;

    line.split(/(?<=[.!?])\s+/).forEach((sentence) => {
      const count = sentenceWordCount(sentence);
      assert(count <= 30, `${filename}:${index + 1}: sentence has ${count} words`);
    });
  });
}

test("the system stays limited to five connected specification files", () => {
  systemFiles.forEach((file) => assert(exists(file), `missing ${file}`));
  const actual = fs.readdirSync(path.join(root, "library", "system"))
    .filter((name) => name.endsWith(".md"))
    .sort();
  assert.deepEqual(actual, systemFiles.map((file) => path.basename(file)).sort());
});

test("DESIGN routes agents through the complete contract", () => {
  const design = read("library/DESIGN.md");
  systemFiles.forEach((file) => assert(design.includes(`\`${file}\``), `library/DESIGN.md does not reference ${file}`));
  assert.match(design, /mewa_ui does not ship complete layout templates\./);
  assert.match(design, /The registry owns component selection metadata\./);
  assert.match(design, /Spinner rotation is the only library motion exception\./);
});

test("the compliance prompt is compact, exploratory, and application-focused", () => {
  const prompt = read("PROMPT.md");
  assert(prompt.split(/\r?\n/).length <= 50, "PROMPT.md must stay short enough to invite repository exploration");
  assert.match(prompt, /Explore the application and the current mewa_ui repository/);
  assert.match(prompt, /Follow repository instructions you discover/);
  assert.match(prompt, /\.opencode\//);
  assert.match(prompt, /Remove cards inside cards/);
  assert.match(prompt, /undocumented library APIs/);
  assert.match(prompt, /what you verified/);
  assert.match(prompt, /Preserve names, facts, numbers, terminology, quotations, constraints/);
});

test("descriptive and instructional Markdown have explicit owners", () => {
  const readme = read("README.md");
  const agents = read("AGENTS.md");
  assert.match(readme, /The repository keeps description separate from instruction\./);
  assert.match(readme, /### For people/);
  assert.match(readme, /### For agents and maintainers/);
  assert(!/COMPONENT-INVENTORY/.test(readme), "README.md must not contain the generated agent catalog");
  assert.match(agents, /Keep `README\.md` descriptive and written for people\./);
  assert.match(agents, /Keep `library\/DESIGN\.md`, `library\/system\/`, and component Markdown instructional\./);
});

test("agent-facing prose stays shallow and compact", () => {
  for (const file of ["library/DESIGN.md", "AGENTS.md", "llms.txt", "PROMPT.md", ...systemFiles]) {
    checkCompactProse(file);
  }
});

test("shell documentation contains all three shell recipes", () => {
  const layouts = read("library/system/layouts.md");
  assert.match(layouts, /## Sidebar shell/);
  assert.match(layouts, /## Top-navigation shell/);
  assert.match(layouts, /## Focused-tool shell/);
  assert(!/\blayouts\//.test(layouts));
});

test("component selection documentation routes agents through registry metadata", () => {
  const guide = read("library/system/components.md");
  assert.match(guide, /Read `registry\.json` for the complete component inventory\./);
  for (const field of ["purpose", "useWhen", "avoidWhen", "fallback", "jsMode", "files", "stability"]) {
    assert(guide.includes(`Use ` + "`" + `${field}` + "`"), `library/system/components.md is missing ${field}`);
  }
});

test("foundation token documentation is generated from registry metadata", () => {
  const foundations = read("library/system/foundations.md");
  assert.match(foundations, /<!-- TOKEN-REFERENCE:START -->/);
  assert.match(foundations, /<!-- TOKEN-REFERENCE:END -->/);
  assert.match(foundations, /\| `--background` \| Page canvas background\. \|/);
});

if (failures) process.exitCode = 1;
