/**
 * Penpot geometry is deliberately explicit and pixel-based. It follows the
 * repository's 4px numeric scale (100 = 4px) and avoids rem conversions at
 * application time.
 */
const padding = (value) => ({ top: value, right: value, bottom: value, left: value });

const container = (type, direction, gap, inset, width, height, vertical = 'hug') => ({
  type,
  direction,
  gap,
  padding: padding(inset),
  sizing: {
    horizontal: 'fixed',
    vertical,
    width,
    height,
  },
});

const preset = (width, height, matrixColumns = 3, type = 'flex', direction = 'column') => ({
  master: {
    width,
    height,
    container: container(type, direction, 16, 16, width, height),
  },
  matrix: {
    columns: matrixColumns,
    columnGap: 24,
    rowGap: 24,
    labelHeight: 20,
    padding: 24,
    container: container('grid', 'row', { row: 24, column: 24 }, 24, width, height, 'hug'),
  },
});

export const layoutPresets = {
  intrinsic: preset(280, 80),
  inline: preset(280, 56, 4, 'flex', 'row'),
  horizontal: preset(440, 112, 3, 'flex', 'row'),
  vertical: preset(360, 224, 3),
  'vertical-connected': preset(440, 256, 2),
  'connected-row': preset(360, 64, 3, 'flex', 'row'),
  'form-field': preset(440, 224, 3),
  form: preset(520, 360, 2),
  layout: preset(720, 360, 2, 'grid', 'row'),
  control: preset(440, 112, 3),
  calendar: preset(392, 396, 2, 'grid', 'row'),
  table: preset(840, 420, 2, 'grid', 'row'),
  data: preset(280, 132, 3),
  media: preset(440, 320, 2),
  navigation: preset(480, 216, 2, 'flex', 'row'),
  overflow: preset(520, 280, 2),
  separator: preset(440, 72, 3, 'flex', 'row'),
  split: preset(680, 300, 2, 'flex', 'row'),
  sortable: preset(520, 256, 2),
  toolbar: preset(320, 72, 3, 'flex', 'row'),
  tree: preset(400, 300, 2),
  typography: preset(620, 520, 2),
  shell: preset(1120, 640, 1, 'grid', 'row'),
  'overlay-centered': preset(560, 400, 2),
  'overlay-edge': preset(640, 480, 2),
  'overlay-corner': preset(420, 160, 2),
  'anchored-overlay': preset(460, 280, 2),
};
