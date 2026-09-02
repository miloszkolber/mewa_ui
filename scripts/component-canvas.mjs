import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(fs.readFileSync(path.join(root, "registry.json"), "utf8"));
const outputPath = path.join(root, "components.html");
const mode = process.argv[2] || "--check";

function openingTagEnd(source, start) {
  let quote = null;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === ">") return index + 1;
  }
  throw new Error(`Unclosed tag at character ${start}`);
}

function balancedElements(source, tagName, predicate = () => true) {
  const tagPattern = new RegExp(`<\\/?${tagName}\\b`, "gi");
  const matches = [...source.matchAll(tagPattern)];
  const elements = [];

  for (let cursor = 0; cursor < matches.length; cursor += 1) {
    const match = matches[cursor];
    if (source.slice(match.index, match.index + 2) === "</") continue;
    const start = match.index;
    const startTagEnd = openingTagEnd(source, start);
    const startTag = source.slice(start, startTagEnd);
    if (!predicate(startTag)) continue;

    let depth = 1;
    for (let index = cursor + 1; index < matches.length; index += 1) {
      const token = matches[index];
      if (source.slice(token.index, token.index + 2) === "</") depth -= 1;
      else depth += 1;
      if (depth !== 0) continue;

      const end = openingTagEnd(source, token.index);
      elements.push({
        start,
        end,
        innerStart: startTagEnd,
        innerEnd: token.index,
        outer: source.slice(start, end),
        inner: source.slice(startTagEnd, token.index),
      });
      cursor = index;
      break;
    }
  }

  return elements;
}

function previewElements(source) {
  return balancedElements(source, "div", (tag) => {
    const className = tag.match(/\bclass\s*=\s*(["'])(.*?)\1/is)?.[2] || "";
    return className.split(/\s+/).includes("preview");
  });
}

function prefixRelationships(markup, prefix) {
  const ids = [...markup.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)].map((match) => match[2]);
  const uniqueIds = [...new Set(ids)];
  let result = markup;

  for (const id of uniqueIds) {
    const replacement = `${prefix}-${id}`;
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const relation = "(?:id|for|aria-labelledby|aria-describedby|aria-controls|aria-owns|list|form|headers|popovertarget|data-[a-z0-9-]+-trigger)";
    result = result.replace(
      new RegExp(`(\\b${relation}\\s*=\\s*["'])${escaped}(["'])`, "gi"),
      `$1${replacement}$2`,
    );
    result = result.replace(
      new RegExp(`(\\bhref\\s*=\\s*["']#)${escaped}(["'])`, "gi"),
      `$1${replacement}$2`,
    );
  }

  result = result.replace(/\bname\s*=\s*(["'])(.*?)\1/gi, (_match, quote, name) => (
    `name=${quote}${prefix}-${name}${quote}`
  ));
  return result;
}

function openStaticLayers(markup) {
  return markup
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/(\bsrc\s*=\s*["'])assets\//gi, "$1docs/assets/")
    .replace(/<dialog\b(?![^>]*\bopen\b)/gi, "<dialog open")
    .replace(/\baria-expanded\s*=\s*(["'])false\1/gi, 'aria-expanded="true"')
    .replace(/\bhidden\b/gi, "");
}

function interactionStates(component) {
  const css = fs.readFileSync(path.join(root, component.files.css), "utf8");
  return [
    ["hover", /:hover\b/],
    ["focus", /:focus(?:-visible|-within)?\b/],
    ["active", /:active\b/],
  ].filter(([, pattern]) => pattern.test(css)).map(([state]) => state);
}

function componentMarkup(component, theme) {
  const source = fs.readFileSync(path.join(root, component.docs), "utf8");
  const previews = previewElements(source);
  const previewRanges = previews.map(({ start, end }) => [start, end]);
  const detachedDialogs = balancedElements(source, "dialog").filter(({ start, end }) => (
    !previewRanges.some(([previewStart, previewEnd]) => start >= previewStart && end <= previewEnd)
  ));
  const examples = [
    ...previews.map(({ inner }) => inner),
    ...detachedDialogs.map(({ outer }) => outer),
  ];

  if (examples.length === 0) throw new Error(`No component previews in ${component.docs}`);

  const states = interactionStates(component);
  const tiles = [];
  examples.forEach((example, index) => {
    const prefix = `${theme}-${component.slug}-${index + 1}`;
    const markup = openStaticLayers(prefixRelationships(example, prefix));
    tiles.push(`      <div class="component-state" data-example="${index + 1}">\n${markup.trim()}\n      </div>`);
  });

  const firstExample = examples[0];
  states.forEach((state, index) => {
    const prefix = `${theme}-${component.slug}-${examples.length + index + 1}`;
    const markup = openStaticLayers(prefixRelationships(firstExample, prefix));
    tiles.push(`      <div class="component-state" data-simulate-state="${state}">\n${markup.trim()}\n      </div>`);
  });

  const wide = new Set([
    "app-shell", "carousel", "data-table", "date-picker", "layout", "resizable",
    "scroll-area", "sidebar", "sortable", "table", "timeline", "tree-view",
  ]).has(component.slug);

  return `    <section class="component-grid${wide ? " component-grid-wide" : ""}" data-component="${component.slug}">\n${tiles.join("\n")}\n    </section>`;
}

function styleLinks() {
  const paths = [
    "library/src/base.css",
    "library/src/tokens.css",
    "docs/css/docs-theme.css",
    "docs/css/docs-utilities.css",
    ...registry.components.map((component) => component.files.css),
  ];
  return paths.map((href) => `  <link rel="stylesheet" href="${href}">`).join("\n");
}

function themeCanvas(theme) {
  const sections = registry.components.map((component) => componentMarkup(component, theme)).join("\n");
  return `  <main class="theme-canvas${theme === "dark" ? " dark" : ""}" data-theme="${theme}">\n${sections}\n  </main>`;
}

function render() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>mewa_ui component canvas</title>
${styleLinks()}
  <style>
    html { background: var(--background); }
    body { margin: 0; min-width: 0; background: var(--background); }
    .theme-canvas {
      box-sizing: border-box;
      display: grid;
      gap: var(--space-3200);
      min-height: 100vh;
      padding: var(--space-1600);
      background: var(--background);
      color: var(--text-primary);
    }
    .component-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
      gap: var(--space-800);
      align-items: start;
    }
    .component-grid-wide { grid-template-columns: minmax(0, 1fr); }
    .component-state {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 0;
      min-height: 11rem;
      overflow: hidden;
      padding: var(--space-800);
      background: var(--background);
      color: var(--text-primary);
      container-type: inline-size;
    }
    .component-grid-wide > .component-state { min-height: 18rem; }
    .component-state > * { max-width: 100%; }
    .component-state dialog,
    .component-state [popover] {
      display: block !important;
      position: relative !important;
      inset: auto !important;
      top: auto !important;
      right: auto !important;
      bottom: auto !important;
      left: auto !important;
      width: min(100%, 32rem) !important;
      height: auto !important;
      max-width: 100% !important;
      max-height: none !important;
      margin: var(--space-400) !important;
      opacity: 1 !important;
      transform: none !important;
    }
    .component-state .sheet { min-height: 18rem; }
    .component-state .tooltip { width: max-content !important; }
    .component-state .dropdown-menu-content { min-width: 12rem; }
    .component-state :is(.toast-region, .sidebar-layout, .app-header, .app-toolbar) {
      position: relative;
      inset: auto;
    }
    @media (max-width: 48rem) {
      .theme-canvas { padding: var(--space-800); }
      .component-state { padding: var(--space-400); }
    }
  </style>
</head>
<body>
${themeCanvas("light")}
${themeCanvas("dark")}
  <script>
    (() => {
      document.querySelectorAll('input[id$="-d-indeterminate"]').forEach((input) => {
        input.indeterminate = true;
      });
      const pseudoStates = {
        hover: [":hover"],
        focus: [":focus-visible", ":focus-within", ":focus"],
        active: [":active"],
      };
      const rules = [];
      const splitSelectors = (value) => value.split(",").map((selector) => selector.trim()).filter(Boolean);
      const resolveSelectors = (parents, children) => {
        if (!parents.length) return children;
        return parents.flatMap((parent) => children.map((child) => (
          child.includes("&") ? child.replaceAll("&", parent) : parent + " " + child
        )));
      };
      const visit = (ruleList, parents = []) => {
        for (const rule of ruleList) {
          if (rule.selectorText) {
            const selectors = resolveSelectors(parents, splitSelectors(rule.selectorText));
            for (const [state, pseudos] of Object.entries(pseudoStates)) {
              const matching = selectors.filter((selector) => pseudos.some((pseudo) => selector.includes(pseudo)));
              if (!matching.length) continue;
              const forced = matching.map((selector) => {
                let resolved = selector;
                for (const pseudo of pseudos) resolved = resolved.replaceAll(pseudo, "");
                resolved = resolved.replace(/:has\\(\\s*\\)/g, "");
                return '.component-state[data-simulate-state="' + state + '"] ' + resolved;
              });
              if (rule.style && rule.style.cssText) rules.push(forced.join(",") + " { " + rule.style.cssText + " }");
            }
            if (rule.cssRules) visit(rule.cssRules, selectors);
          } else if (rule.cssRules) {
            visit(rule.cssRules, parents);
          }
        }
      };
      for (const sheet of document.styleSheets) {
        try { visit(sheet.cssRules); } catch (_error) { /* Keep the static canvas usable. */ }
      }
      if (rules.length) {
        const style = document.createElement("style");
        style.dataset.simulatedStates = "";
        style.textContent = "@layer components { " + rules.join("\\n") + " }";
        document.head.append(style);
      }
    })();
  </script>
  <script src="docs/js/site.js" defer></script>
</body>
</html>
`;
}

const expected = render();

if (mode === "--write") {
  fs.writeFileSync(outputPath, expected);
  console.log(`WRITE ${path.relative(root, outputPath)}`);
} else if (mode === "--check") {
  const actual = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : "";
  if (actual !== expected) {
    console.error(`FAIL ${path.relative(root, outputPath)} is not generated from the component docs`);
    process.exitCode = 1;
  } else {
    console.log(`PASS ${path.relative(root, outputPath)}`);
  }
} else {
  throw new Error(`Unknown mode: ${mode}`);
}
