#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const basePath = path.join(projectRoot, "library/src/base.css");
const startMarker = "    /* COLOR-PALETTE:START */";
const endMarker = "    /* COLOR-PALETTE:END */";

const steps = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000];
const colorSteps = steps.slice(1, -1);
// HCT uses CAM16 hue/chroma and CIELAB L* tone. Per-step chroma envelopes
// preserve each established family while the shared tone curve aligns lightness.
const paletteRecipes = {
  red: {
    hue: 19,
    chroma: [6.5, 14.5, 25.5, 44, 64, 76, 72, 60.5, 47, 36.5, 29]
  },
  amber: {
    hue: 86,
    chroma: [15, 28, 42, 50, 49, 43, 36.5, 29.5, 22, 16.5, 12.5]
  },
  green: {
    hue: 155,
    chroma: [11.5, 17.5, 26, 35.5, 44.5, 48, 44, 37.5, 32, 28, 23.5]
  }
};
const chromaticAlphaRecipes = {
  red: [
    [0, [253, 13, 63], 0],
    [50, [253, 13, 63], 0.09],
    [100, [253, 13, 63], 0.16],
    [200, [253, 13, 63], 0.27],
    [800, [254, 45, 72], 0.36],
    [900, [254, 45, 72], 0.24],
    [950, [254, 45, 72], 0.15],
    [1000, [254, 45, 72], 0]
  ],
  amber: [
    [0, [239, 183, 20], 0],
    [50, [239, 183, 20], 0.21],
    [100, [239, 183, 20], 0.37],
    [200, [221, 169, 17], 0.59],
    [800, [239, 183, 20], 0.22],
    [900, [239, 183, 20], 0.13],
    [950, [239, 183, 20], 0.09],
    [1000, [239, 183, 20], 0]
  ],
  green: [
    [0, [1, 132, 68], 0],
    [50, [1, 132, 68], 0.1],
    [100, [1, 132, 68], 0.19],
    [200, [1, 132, 68], 0.32],
    [800, [9, 132, 69], 0.39],
    [900, [9, 132, 69], 0.25],
    [950, [9, 132, 69], 0.15],
    [1000, [9, 132, 69], 0]
  ]
};
const lightAnchor = "#ffffff";
const darkAnchor = "#0a0a0a";
const retainedLightHalfStep = "#f4f4f4";
const materialColorUtilitiesVersion = "0.4.0";

// The package root currently loads more modules than this recipe needs. Resolve
// the pinned package entry, then load only its HCT and color utilities.
const materialEntry = import.meta.resolve("@material/material-color-utilities");
const materialRoot = new URL("./", materialEntry);
const materialPackage = JSON.parse(fs.readFileSync(new URL("package.json", materialRoot), "utf8"));
if (materialPackage.version !== materialColorUtilitiesVersion) {
  throw new Error(
    `Expected @material/material-color-utilities ${materialColorUtilitiesVersion}, received ${materialPackage.version}`
  );
}
const [{ Hct }, colorUtils, stringUtils] = await Promise.all([
  import(new URL("hct/hct.js", materialRoot)),
  import(new URL("utils/color_utils.js", materialRoot)),
  import(new URL("utils/string_utils.js", materialRoot))
]);
const {
  argbFromLstar,
  blueFromArgb,
  greenFromArgb,
  lstarFromArgb,
  redFromArgb
} = colorUtils;
const { argbFromHex, hexFromArgb } = stringUtils;

function label(step) {
  return String(step).padStart(3, "0");
}

function rgbFromArgb(argb) {
  return [redFromArgb(argb), greenFromArgb(argb), blueFromArgb(argb)];
}

function rgbFromHex(hex) {
  return rgbFromArgb(argbFromHex(hex));
}

function percent(value) {
  if (value <= 0) return "0%";
  if (value >= 1) return "100%";
  return `${Number((value * 100).toFixed(4))}%`;
}

function cssRgb(rgb, opacity) {
  const channels = rgb.join(" ");
  return opacity === undefined ? `rgb(${channels})` : `rgb(${channels} / ${percent(opacity)})`;
}

const lightTone = lstarFromArgb(argbFromHex(lightAnchor));
const darkTone = lstarFromArgb(argbFromHex(darkAnchor));
const retainedHalfStepTone = lstarFromArgb(argbFromHex(retainedLightHalfStep));
const halfStepPosition = 0.05;
const cosineHalfStep = (1 - Math.cos(Math.PI * halfStepPosition)) / 2;
const retainedHalfStepProgress = (lightTone - retainedHalfStepTone) / (lightTone - darkTone);
// Blend a linear ramp with a cosine ease. Solving this coefficient from the
// retained 050 tone makes the curve symmetric while adding density at both ends.
const endpointDensity =
  (retainedHalfStepProgress - halfStepPosition) / (cosineHalfStep - halfStepPosition);

function scaleProgress(position) {
  const cosineProgress = (1 - Math.cos(Math.PI * position)) / 2;
  return (1 - endpointDensity) * position + endpointDensity * cosineProgress;
}

function toneForStep(step) {
  return lightTone + (darkTone - lightTone) * scaleProgress(step / 1000);
}

function createSolids() {
  const solid = { neutral: new Map() };
  for (const step of steps) {
    const hex = step === 0
      ? lightAnchor
      : step === 1000
        ? darkAnchor
        : hexFromArgb(argbFromLstar(toneForStep(step)));
    solid.neutral.set(step, hex);
  }

  for (const [family, recipe] of Object.entries(paletteRecipes)) {
    const familyColors = new Map();
    for (const [index, step] of colorSteps.entries()) {
      const neutralTone = lstarFromArgb(argbFromHex(solid.neutral.get(step)));
      familyColors.set(
        step,
        hexFromArgb(Hct.from(recipe.hue, recipe.chroma[index], neutralTone).toInt())
      );
    }
    solid[family] = familyColors;
  }
  return solid;
}

function neutralOpacity(targetHex, sourceHex, backgroundHex) {
  const target = rgbFromHex(targetHex)[0];
  const source = rgbFromHex(sourceHex)[0];
  const background = rgbFromHex(backgroundHex)[0];
  return (target - background) / (source - background);
}

function renderPaletteBlock() {
  const solid = createSolids();
  const lines = [
    startMarker,
    "    /* Generated by scripts/color-palette.mjs from shared HCT tones as RGB. */",
    "    /* 000 and 1000 are exact reference anchors; 050 and 950 are half steps. */"
  ];

  for (const family of ["neutral", "red", "amber", "green"]) {
    for (const [step, hex] of solid[family]) {
      lines.push(`     --color-${family}-${label(step)}: ${cssRgb(rgbFromHex(hex))};`);
    }
  }

  lines.push("", "    /* White overlays reproduce neutral shades on 1000. */");
  for (const step of steps.slice(1)) {
    const opacity = neutralOpacity(solid.neutral.get(step), lightAnchor, darkAnchor);
    lines.push(`     --color-alpha-light-${label(step)}: ${cssRgb([255, 255, 255], opacity)};`);
  }

  lines.push("", "    /* 1000 overlays reproduce neutral shades on 000. */");
  for (const step of steps.slice(0, -1)) {
    const opacity = neutralOpacity(solid.neutral.get(step), darkAnchor, lightAnchor);
    lines.push(`     --color-alpha-dark-${label(step)}: ${cssRgb([10, 10, 10], opacity)};`);
  }

  lines.push("", "    /* Tuned chromatic alpha ramps retain their saturation and gain transparent endpoints. */");
  for (const [family, recipe] of Object.entries(chromaticAlphaRecipes)) {
    for (const [step, rgb, opacity] of recipe) {
      lines.push(`     --color-alpha-${family}-${label(step)}: ${cssRgb(rgb, opacity)};`);
    }
  }

  lines.push("", endMarker);
  return lines.join("\n");
}

function currentPaletteBlock(source) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start < 0 || end < start) {
    throw new Error(`Missing palette markers in ${path.relative(projectRoot, basePath)}`);
  }
  return source.slice(start, end + endMarker.length);
}

const expected = renderPaletteBlock();
const source = fs.readFileSync(basePath, "utf8");
const actual = currentPaletteBlock(source);
const write = process.argv.includes("--write");
const check = process.argv.includes("--check") || !write;

if (write) {
  fs.writeFileSync(basePath, source.replace(actual, expected));
  console.log(`WROTE ${path.relative(projectRoot, basePath)}`);
}

if (check) {
  if (actual !== expected) {
    console.error(`FAIL ${path.relative(projectRoot, basePath)} is not generated from the HCT palette recipe`);
    process.exitCode = 1;
  } else {
    console.log(`PASS ${path.relative(projectRoot, basePath)}`);
  }
}
