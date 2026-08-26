/**
 * Penpot geometry is deliberately explicit and pixel-based. It follows the
 * repository's 4px numeric scale (100 = 4px) and avoids rem conversions at
 * application time.
 */
const preset = (width, height, matrixColumns = 3) => ({
  master: { width, height },
  matrix: {
    columns: matrixColumns,
    columnGap: 24,
    rowGap: 24,
    labelHeight: 20,
    padding: 24,
  },
});

export const layoutPresets = {
  intrinsic: preset(280, 80),
  inline: preset(280, 56, 4),
  horizontal: preset(440, 112, 3),
  vertical: preset(360, 224, 3),
  'vertical-connected': preset(440, 256, 2),
  'connected-row': preset(360, 64, 3),
  'form-field': preset(440, 224, 3),
  form: preset(520, 360, 2),
  layout: preset(720, 360, 2),
  control: preset(440, 112, 3),
  calendar: preset(392, 396, 2),
  table: preset(840, 420, 2),
  data: preset(280, 132, 3),
  media: preset(440, 320, 2),
  navigation: preset(480, 216, 2),
  overflow: preset(520, 280, 2),
  separator: preset(440, 72, 3),
  split: preset(680, 300, 2),
  sortable: preset(520, 256, 2),
  toolbar: preset(320, 72, 3),
  tree: preset(400, 300, 2),
  typography: preset(620, 520, 2),
  shell: preset(1120, 640, 1),
  'overlay-centered': preset(560, 400, 2),
  'overlay-edge': preset(640, 480, 2),
  'overlay-corner': preset(420, 160, 2),
  'anchored-overlay': preset(460, 280, 2),
};
