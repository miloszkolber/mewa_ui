import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const baseSource = fs.readFileSync(path.join(root, 'library/src/base.css'), 'utf8');
const tokenSource = fs.readFileSync(path.join(root, 'library/src/tokens.css'), 'utf8');

const neutralSteps = [
  '000',
  '050',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  '950',
  '1000'
];
const colorSteps = neutralSteps.slice(1, -1);
const alphaColorSteps = ['000', '050', '100', '200', '800', '900', '950', '1000'];
const colorFamilies = ['red', 'amber', 'green'];
const solidFamilies = ['neutral', ...colorFamilies];

let failures = 0;

async function test(name, callback) {
  try {
    await callback();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}\n  ${error.message}`);
  }
}

function declarations(source) {
  return new Map(
    [...source.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)].map((match) => [match[1], match[2].trim()])
  );
}

function declarationNames(source, pattern) {
  return [...source.matchAll(/^\s*(--[\w-]+):/gm)]
    .map((match) => match[1])
    .filter((name) => pattern.test(name));
}

function scope(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm'));
  assert(match, `missing ${selector} token scope`);
  return declarations(match[1]);
}

function rgbFromHex(hex) {
  assert.match(hex, /^#[0-9a-f]{6}$/i, `invalid hex color ${hex}`);
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

function parseRgb(value) {
  const match = value.match(/^rgb\((\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+)%)?\)$/);
  assert(match, `invalid RGB color ${value}`);
  return {
    rgb: match.slice(1, 4).map(Number),
    opacity: match[4] === undefined ? 1 : Number(match[4]) / 100
  };
}

function linearChannel(channel) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(rgb) {
  return (
    0.2126 * linearChannel(rgb[0]) + 0.7152 * linearChannel(rgb[1]) + 0.0722 * linearChannel(rgb[2])
  );
}

function tone(rgb) {
  const y = relativeLuminance(rgb);
  const epsilon = 216 / 24389;
  const kappa = 24389 / 27;
  return y <= epsilon ? kappa * y : 116 * Math.cbrt(y) - 16;
}

function contrast(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

function composite(source, background, opacity) {
  return source.map((channel, index) => opacity * channel + (1 - opacity) * background[index]);
}

function value(name) {
  const result = baseDeclarations.get(name);
  assert(result, `missing ${name}`);
  return result;
}

function solid(family, step) {
  return parseRgb(value(`--color-${family}-${step}`)).rgb;
}

const baseDeclarations = declarations(baseSource);
const lightTokens = scope(tokenSource, ':root');
const darkTokens = scope(tokenSource, '.dark');

await test('solid palettes expose the exact requested steps and reference anchors', () => {
  const expectedHexes = {
    neutral: [
      '#ffffff',
      '#f4f4f4',
      '#e8e8e8',
      '#cfcfcf',
      '#b3b3b3',
      '#979797',
      '#7a7a7a',
      '#5f5f5f',
      '#464646',
      '#303030',
      '#1d1d1d',
      '#151515',
      '#0a0a0a'
    ],
    red: [
      '#fff1f0',
      '#ffe1e0',
      '#ffbfbe',
      '#ff9695',
      '#f66a6d',
      '#dc414b',
      '#b32a35',
      '#871d26',
      '#5e1419',
      '#3d090d',
      '#2e0709'
    ],
    amber: [
      '#fff3e0',
      '#ffe5b4',
      '#f7c962',
      '#deac2e',
      '#be9011',
      '#9a740c',
      '#785a0a',
      '#594309',
      '#3d2e08',
      '#261c04',
      '#1c1404'
    ],
    green: [
      '#eaf8e9',
      '#d6efd7',
      '#b0d9b7',
      '#85c193',
      '#58a770',
      '#2f8a52',
      '#196d3c',
      '#0e512b',
      '#02381b',
      '#00230e',
      '#001a09'
    ]
  };

  assert.deepEqual(
    declarationNames(baseSource, /^--color-neutral-\d{3,4}$/),
    neutralSteps.map((step) => `--color-neutral-${step}`)
  );

  for (const family of colorFamilies) {
    assert.deepEqual(
      declarationNames(baseSource, new RegExp(`^--color-${family}-\\d{3}$`)),
      colorSteps.map((step) => `--color-${family}-${step}`),
      `${family} solid step inventory drifted`
    );
  }

  for (const family of solidFamilies) {
    const familySteps = family === 'neutral' ? neutralSteps : colorSteps;
    assert.deepEqual(
      familySteps.map((step) => value(`--color-${family}-${step}`)),
      expectedHexes[family].map((hex) => `rgb(${rgbFromHex(hex).join(' ')})`),
      `${family} generated RGB snapshot drifted`
    );
  }
});

await test('authored CSS uses RGB as its only color notation', () => {
  const cssFiles = [
    ...fs
      .readdirSync(path.join(root, 'library'), { recursive: true })
      .filter((file) => file.endsWith('.css'))
      .map((file) => path.join(root, 'library', file)),
    ...fs
      .readdirSync(path.join(root, 'docs/css'), { recursive: true })
      .filter((file) => file.endsWith('.css'))
      .map((file) => path.join(root, 'docs/css', file))
  ];

  for (const file of cssFiles) {
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(
      source,
      /#[\da-f]{3,8}\b|\b(?:oklch|oklab|hsl|hsla|rgba)\(/i,
      `${path.relative(root, file)} mixes color notations`
    );
  }

  for (const [name, color] of baseDeclarations) {
    if (name.startsWith('--color-')) assert.match(color, /^rgb\(/, `${name} must use rgb()`);
  }
  assert.doesNotMatch(
    tokenSource.replace(/--border-transparent:\s*transparent;/g, ''),
    /(?<![\w-])transparent(?![\w-])|color-mix\(in (?!srgb\b)/i,
    'semantic colors must remain in the RGB system outside the explicit transparent border role'
  );
});

await test('the shared L* tone curve is monotonic, symmetric, and dense at both endpoints', () => {
  const neutralTones = neutralSteps.map((step) => tone(solid('neutral', step)));
  neutralTones.slice(1).forEach((current, index) => {
    assert(
      current < neutralTones[index],
      `${neutralSteps[index + 1]} must be darker than ${neutralSteps[index]}`
    );
  });

  const anchorSum = neutralTones[0] + neutralTones.at(-1);
  neutralTones.forEach((current, index) => {
    const mirror = neutralTones.at(-(index + 1));
    assert(
      Math.abs(current + mirror - anchorSum) <= 0.35,
      `${neutralSteps[index]} and ${neutralSteps.at(-(index + 1))} are not symmetric in L*`
    );
  });

  const lightHalfStep = neutralTones[0] - neutralTones[1];
  const darkHalfStep = neutralTones.at(-2) - neutralTones.at(-1);
  assert(
    Math.abs(lightHalfStep - darkHalfStep) <= 0.3,
    '050 and 950 endpoint spacing must feel symmetric'
  );
  assert(
    lightHalfStep < neutralTones[2] - neutralTones[3],
    'the light endpoint must be denser than a full interior step'
  );
  assert(
    darkHalfStep < neutralTones.at(-4) - neutralTones.at(-3),
    'the dark endpoint must be denser than a full interior step'
  );
});

await test('chromatic steps stay aligned to the neutral HCT tones', () => {
  for (const family of colorFamilies) {
    for (const step of colorSteps) {
      assert(
        Math.abs(tone(solid(family, step)) - tone(solid('neutral', step))) <= 0.4,
        `${family}-${step} is not aligned to neutral-${step}`
      );
    }

    const lightDifference = tone(solid('neutral', '000')) - tone(solid(family, '050'));
    const darkDifference = tone(solid(family, '950')) - tone(solid('neutral', '1000'));
    assert(
      Math.abs(lightDifference - darkDifference) <= 0.5,
      `${family} endpoint spacing is not symmetric with the neutral anchors`
    );
  }
});

await test('paired semantic color steps meet the normal-text contrast floor', () => {
  for (const family of solidFamilies) {
    const lightContrast = contrast(solid(family, '600'), solid(family, '050'));
    const darkContrast = contrast(solid(family, '400'), solid(family, '950'));
    assert(
      lightContrast >= 4.5,
      `${family} 600 on 050 has only ${lightContrast.toFixed(2)}:1 contrast`
    );
    assert(
      darkContrast >= 4.5,
      `${family} 400 on 950 has only ${darkContrast.toFixed(2)}:1 contrast`
    );
  }
});

await test('directional neutral alpha ramps cover every available step and reproduce their solids', () => {
  assert.deepEqual(
    declarationNames(baseSource, /^--color-alpha-light-\d{3,4}$/),
    neutralSteps.slice(1).map((step) => `--color-alpha-light-${step}`)
  );
  assert.deepEqual(
    declarationNames(baseSource, /^--color-alpha-dark-\d{3,4}$/),
    neutralSteps.slice(0, -1).map((step) => `--color-alpha-dark-${step}`)
  );
  assert(!baseDeclarations.has('--color-alpha-light-000'), 'alpha-light-000 must be unavailable');
  assert(!baseDeclarations.has('--color-alpha-dark-1000'), 'alpha-dark-1000 must be unavailable');

  for (const step of neutralSteps.slice(1)) {
    const alpha = parseRgb(value(`--color-alpha-light-${step}`));
    assert.deepEqual(alpha.rgb, [255, 255, 255], `alpha-light-${step} must use the 000 source`);
    const result = composite(alpha.rgb, solid('neutral', '1000'), alpha.opacity);
    const target = solid('neutral', step);
    result.forEach((channel, index) => {
      assert(
        Math.abs(channel - target[index]) <= 0.001,
        `alpha-light-${step} does not reproduce neutral-${step}`
      );
    });
  }

  for (const step of neutralSteps.slice(0, -1)) {
    const alpha = parseRgb(value(`--color-alpha-dark-${step}`));
    assert.deepEqual(alpha.rgb, [10, 10, 10], `alpha-dark-${step} must use the 1000 source`);
    const result = composite(alpha.rgb, solid('neutral', '000'), alpha.opacity);
    const target = solid('neutral', step);
    result.forEach((channel, index) => {
      assert(
        Math.abs(channel - target[index]) <= 0.001,
        `alpha-dark-${step} does not reproduce neutral-${step}`
      );
    });
  }
});

await test('chromatic alpha ramps retain their tuned stops and add source-colored transparent endpoints', () => {
  const expected = {
    red: {
      '050': 'rgb(253 13 63 / 9%)',
      100: 'rgb(253 13 63 / 16%)',
      200: 'rgb(253 13 63 / 27%)',
      800: 'rgb(254 45 72 / 36%)',
      900: 'rgb(254 45 72 / 24%)',
      950: 'rgb(254 45 72 / 15%)'
    },
    amber: {
      '050': 'rgb(239 183 20 / 21%)',
      100: 'rgb(239 183 20 / 37%)',
      200: 'rgb(221 169 17 / 59%)',
      800: 'rgb(239 183 20 / 22%)',
      900: 'rgb(239 183 20 / 13%)',
      950: 'rgb(239 183 20 / 9%)'
    },
    green: {
      '050': 'rgb(1 132 68 / 10%)',
      100: 'rgb(1 132 68 / 19%)',
      200: 'rgb(1 132 68 / 32%)',
      800: 'rgb(9 132 69 / 39%)',
      900: 'rgb(9 132 69 / 25%)',
      950: 'rgb(9 132 69 / 15%)'
    }
  };

  for (const family of colorFamilies) {
    assert.deepEqual(
      declarationNames(baseSource, new RegExp(`^--color-alpha-${family}-\\d{3,4}$`)),
      alphaColorSteps.map((step) => `--color-alpha-${family}-${step}`),
      `${family} alpha step inventory drifted`
    );

    for (const [step, expectedValue] of Object.entries(expected[family])) {
      assert.equal(value(`--color-alpha-${family}-${step}`), expectedValue);
    }

    const start = parseRgb(value(`--color-alpha-${family}-000`));
    const first = parseRgb(value(`--color-alpha-${family}-050`));
    const last = parseRgb(value(`--color-alpha-${family}-950`));
    const end = parseRgb(value(`--color-alpha-${family}-1000`));
    assert.equal(start.opacity, 0, `${family}-000 must be transparent`);
    assert.equal(end.opacity, 0, `${family}-1000 must be transparent`);
    assert.deepEqual(
      start.rgb,
      first.rgb,
      `${family}-000 must retain the light alpha source color`
    );
    assert.deepEqual(end.rgb, last.rgb, `${family}-1000 must retain the dark alpha source color`);
    assert(
      start.rgb.some((channel) => channel > 0) && end.rgb.some((channel) => channel > 0),
      `${family} endpoints must not collapse to transparent black`
    );
  }
});

await test('semantic color references resolve without using deprecated neutral alpha aliases', () => {
  const known = new Set([...baseDeclarations.keys(), ...declarations(tokenSource).keys()]);
  for (const match of tokenSource.matchAll(/var\((--[\w-]+)/g)) {
    assert(known.has(match[1]), `unresolved semantic reference ${match[1]}`);
  }
  assert(
    !/var\(--color-alpha-neutral-/.test(tokenSource),
    'semantic roles must use directional neutral alpha tokens'
  );
});

await test('light theme is a first-class semantic token block', () => {
  assert.match(tokenSource, /:root\s*\{\s*color-scheme:\s*light;/);
  assert.match(tokenSource, /\.dark\s*\{\s*color-scheme:\s*dark;/);
  assert.deepEqual(
    [...lightTokens.keys()].sort(),
    [...darkTokens.keys()].sort(),
    'light and dark themes must expose the same semantic token names'
  );
});

await test('semantic roles remain named when mappings share a value', () => {
  const roles = new Set([...lightTokens.keys(), ...darkTokens.keys()]);
  const preservedRoles = [
    '--surface-alpha',
    '--surface-control',
    '--surface-control-hover',
    '--surface-control-disabled',
    '--surface-control-transparent',
    '--surface-button-secondary',
    '--surface-menu-hover',
    '--surface-content-hover',
    '--surface-shell-hover'
  ];

  for (const name of preservedRoles) {
    assert(roles.has(name), `${name} must remain a distinct semantic role`);
  }
});

await test('light and dark semantic surfaces use the full reference endpoints', () => {
  const expectedLight = {
    '--background': 'var(--color-neutral-050)',
    '--surface-primary': 'var(--color-neutral-000)',
    '--surface-secondary': 'var(--color-neutral-050)',
    '--surface-inverted': 'var(--color-neutral-950)',
    '--text-inverted': 'var(--color-neutral-050)',
    '--surface-positive': 'var(--color-alpha-green-100)',
    '--surface-negative': 'var(--color-alpha-red-100)',
    '--surface-caution': 'var(--color-alpha-amber-100)',
    '--overlay-strong': 'var(--color-alpha-dark-400)',
    '--border-interactive-default': 'var(--color-neutral-300)',
    '--border-interactive-inverted': 'var(--color-neutral-950)',
    '--border-positive': 'var(--color-green-500)',
    '--border-negative': 'var(--color-red-500)',
    '--border-caution': 'var(--color-amber-500)'
  };
  const expectedDark = {
    '--background': 'var(--color-neutral-1000)',
    '--surface-primary': 'var(--color-neutral-950)',
    '--surface-secondary': 'var(--color-neutral-950)',
    '--surface-inverted': 'var(--color-neutral-050)',
    '--text-inverted': 'var(--color-neutral-950)',
    '--surface-positive': 'var(--color-alpha-green-900)',
    '--surface-negative': 'var(--color-alpha-red-900)',
    '--surface-caution': 'var(--color-alpha-amber-900)',
    '--overlay-strong': 'var(--color-alpha-dark-600)',
    '--border-interactive-default': 'var(--color-neutral-700)',
    '--border-interactive-inverted': 'var(--color-neutral-050)',
    '--border-positive': 'var(--color-green-500)',
    '--border-negative': 'var(--color-red-500)',
    '--border-caution': 'var(--color-amber-500)'
  };

  for (const [name, expected] of Object.entries(expectedLight)) {
    assert.equal(lightTokens.get(name), expected, `light ${name} mapping drifted`);
  }
  for (const [name, expected] of Object.entries(expectedDark)) {
    assert.equal(darkTokens.get(name), expected, `dark ${name} mapping drifted`);
  }
});

await test('universal semantic areas retain directional light and dark mappings', () => {
  const expectedLight = {
    '--surface-alpha': 'var(--color-alpha-dark-100)',
    '--surface-alpha-inverted': 'var(--color-alpha-light-900)',
    '--surface-control-invalid': 'var(--color-alpha-red-100)',
    '--surface-destructive-hover': 'var(--color-alpha-red-100)',
    '--surface-menu-hover': 'var(--color-alpha-dark-050)',
    '--surface-content-hover': 'var(--color-alpha-dark-050)',
    '--surface-shell-hover': 'var(--color-alpha-dark-050)',
    '--border-invalid-area': 'var(--color-alpha-red-200)',
    '--border-transparent': 'transparent'
  };
  const expectedDark = {
    '--surface-alpha': 'var(--color-alpha-light-900)',
    '--surface-alpha-inverted': 'var(--color-alpha-dark-100)',
    '--surface-control-invalid': 'var(--color-alpha-red-900)',
    '--surface-destructive-hover': 'var(--color-alpha-red-900)',
    '--surface-menu-hover': 'var(--color-alpha-light-950)',
    '--surface-content-hover': 'var(--color-alpha-light-950)',
    '--surface-shell-hover': 'var(--color-alpha-light-950)',
    '--border-invalid-area': 'var(--color-alpha-red-800)',
    '--border-transparent': 'transparent'
  };

  for (const [name, expected] of Object.entries(expectedLight)) {
    assert.equal(lightTokens.get(name), expected, `light ${name} mapping drifted`);
  }
  for (const [name, expected] of Object.entries(expectedDark)) {
    assert.equal(darkTokens.get(name), expected, `dark ${name} mapping drifted`);
  }
});

if (failures) process.exitCode = 1;
