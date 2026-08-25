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
  const actual = fs.readdirSync(path.join(root, "system"))
    .filter((name) => name.endsWith(".md"))
    .sort();
  assert.deepEqual(actual, systemFiles.map((file) => path.basename(file)).sort());
});

test("DESIGN routes agents through the complete contract", () => {
  const design = read("DESIGN.md");
  systemFiles.forEach((file) => assert(design.includes(`\`${file}\``), `DESIGN.md does not reference ${file}`));
  assert.match(design, /mewa_ui does not ship complete layout templates\./);
  assert.match(design, /The registry owns component selection metadata\./);
  assert.match(design, /Spinner rotation is the only library motion exception\./);
});

test("the compliance prompt is complete and application-focused", () => {
  const prompt = read("PROMPT.md");
  for (const heading of [
    "## Objective",
    "## Visual review",
    "## Component review",
    "## Page and shell review",
    "## Usability review",
    "## Accessibility review",
    "## Technical review",
    "## Responsive review",
    "## Library-gap review",
    "## Implementation rules",
    "## Validation",
    "## Deliverable",
    "## Writing rules"
  ]) {
    assert(prompt.includes(heading), `PROMPT.md is missing ${heading}`);
  }
  assert.match(prompt, /\.opencode\//);
  assert.match(prompt, /Remove cards inside cards\./);
  assert.match(prompt, /Use the sidebar shell/);
  assert.match(prompt, /Do not invent undocumented mewa_ui APIs\./);
});

test("agent-facing prose stays shallow and compact", () => {
  for (const file of ["DESIGN.md", "AGENTS.md", "llms.txt", "PROMPT.md", ...systemFiles]) {
    checkCompactProse(file);
  }
});

test("shell documentation contains all three shell recipes", () => {
  const layouts = read("system/layouts.md");
  assert.match(layouts, /## Sidebar shell/);
  assert.match(layouts, /## Top-navigation shell/);
  assert.match(layouts, /## Focused-tool shell/);
  assert(!/\blayouts\//.test(layouts));
});

test("component selection documentation is generated rather than hand-maintained", () => {
  const guide = read("system/components.md");
  assert.match(guide, /This file is generated from `registry\.json`\./);
  assert.match(guide, /Run `npm run catalog:write`/);
});

test("foundation token documentation is generated from registry metadata", () => {
  const foundations = read("system/foundations.md");
  assert.match(foundations, /<!-- TOKEN-REFERENCE:START -->/);
  assert.match(foundations, /<!-- TOKEN-REFERENCE:END -->/);
  assert.match(foundations, /\| `--background` \| Page canvas background\. \|/);
});

if (failures) process.exitCode = 1;
