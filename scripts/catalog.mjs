import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(root, "registry.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const mode = process.argv[2] || "--check";
const foundationsPath = path.join(root, "library", "system", "foundations.md");

function renderTokenReference() {
  const lines = [
    "<!-- TOKEN-REFERENCE:START -->",
    "## Semantic token reference",
    "",
    "This section is generated from `registry.json`.",
    "",
    "| Token | Purpose |",
    "| --- | --- |"
  ];

  for (const token of registry.designTokens.semantic) {
    lines.push(`| \`${token.name}\` | ${token.purpose} |`);
  }

  lines.push("", "<!-- TOKEN-REFERENCE:END -->");
  return lines.join("\n");
}

function replaceSection(source, start, end, replacement) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) {
    throw new Error(`Missing generated section markers: ${start} ... ${end}`);
  }
  const tailIndex = endIndex + end.length;
  return `${source.slice(0, startIndex)}${replacement}${source.slice(tailIndex)}`;
}

function expectedFiles() {
  const foundations = fs.readFileSync(foundationsPath, "utf8");
  return new Map([
    [foundationsPath, replaceSection(foundations, "<!-- TOKEN-REFERENCE:START -->", "<!-- TOKEN-REFERENCE:END -->", renderTokenReference())]
  ]);
}

function write() {
  for (const [filename, expected] of expectedFiles()) {
    fs.writeFileSync(filename, expected);
    console.log(`WRITE ${path.relative(root, filename)}`);
  }
}

function check() {
  let failures = 0;
  for (const [filename, expected] of expectedFiles()) {
    const actual = fs.readFileSync(filename, "utf8");
    if (actual === expected) {
      console.log(`PASS ${path.relative(root, filename)}`);
      continue;
    }
    failures += 1;
    console.error(`FAIL ${path.relative(root, filename)} is not generated from registry.json`);
  }
  if (failures) process.exitCode = 1;
}

if (mode === "--write") write();
else if (mode === "--check") check();
else throw new Error(`Unknown mode: ${mode}`);
