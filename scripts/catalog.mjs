import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(root, "registry.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const mode = process.argv[2] || "--check";

const componentGuidePath = path.join(root, "system", "components.md");
const readmePath = path.join(root, "README.md");
const foundationsPath = path.join(root, "system", "foundations.md");

function categories() {
  return Array.from(new Set(registry.components.map((component) => component.category)));
}

function renderComponentGuide() {
  const lines = [
    "# Components",
    "",
    "Use this file to select a component.",
    "",
    "Read `DESIGN.md` before this file.",
    "",
    "Read the matching component skill before you write markup.",
    "",
    "This file is generated from `registry.json`.",
    "",
    "Run `npm run catalog:write` after selection metadata changes.",
    "",
    "## Selection rules",
    "",
    "Select the native element before a custom component.",
    "",
    "Select the smallest component that completes the task.",
    "",
    "Use one component for one primary responsibility.",
    "",
    "Use a pattern when several components form a repeated task.",
    "",
    "Use a documented shell recipe when the page needs application chrome.",
    "",
    "Do not select a component from its visual appearance alone.",
    "",
    "Do not infer a component API from another library.",
    ""
  ];

  for (const category of categories()) {
    lines.push(`## ${category}`, "");
    for (const component of registry.components.filter((item) => item.category === category)) {
      lines.push(
        `### ${component.name}`,
        "",
        `Purpose: ${component.purpose}`,
        "",
        component.useWhen,
        "",
        component.avoidWhen,
        "",
        `Behavior: ${component.nativeBasis}`,
        "",
        `Fallback: ${component.fallback}`,
        "",
        `Runtime: ${component.jsMode[0].toUpperCase()}${component.jsMode.slice(1)}.`,
        "",
        `Stability: ${component.stability[0].toUpperCase()}${component.stability.slice(1)}.`,
        "",
        `Contract: [\`components/${component.slug}/${component.slug}.md\`](../components/${component.slug}/${component.slug}.md).`,
        ""
      );
    }
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function renderInventory() {
  const lines = [
    "<!-- COMPONENT-INVENTORY:START -->",
    "## Component inventory",
    "",
    "This section is generated from `registry.json`.",
    "",
    "`None` means the component has no module.",
    "",
    "`Optional` means native markup works without the documented enhancement.",
    "",
    "`Required` means the documented interaction needs the module.",
    ""
  ];

  for (const category of categories()) {
    lines.push(
      `### ${category}`,
      "",
      "| Component | Purpose | Runtime | Contract and demo |",
      "| --- | --- | --- | --- |"
    );
    for (const component of registry.components.filter((item) => item.category === category)) {
      const runtime = component.jsMode[0].toUpperCase() + component.jsMode.slice(1);
      lines.push(
        `| ${component.name} | ${component.purpose} | ${runtime} | [\`components/${component.slug}/${component.slug}.md\`](components/${component.slug}/${component.slug}.md) · [\`docs/${component.slug}.html\`](docs/${component.slug}.html) |`
      );
    }
    lines.push("");
  }

  lines.push("<!-- COMPONENT-INVENTORY:END -->");
  return lines.join("\n");
}

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
  const readme = fs.readFileSync(readmePath, "utf8");
  const foundations = fs.readFileSync(foundationsPath, "utf8");
  return new Map([
    [componentGuidePath, renderComponentGuide()],
    [readmePath, replaceSection(readme, "<!-- COMPONENT-INVENTORY:START -->", "<!-- COMPONENT-INVENTORY:END -->", renderInventory())],
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
