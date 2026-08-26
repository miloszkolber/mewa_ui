/**
 * Intentional differences between the browser implementation and Penpot.
 * They are explicit so a sync never silently changes the CSS contract.
 */
export const foundationOverrides = {
  'font.weight.550': {
    penpotValue: 500,
    reason: 'Penpot does not support the variable-font 550 weight; 500 is the approved fallback.',
  },
};
