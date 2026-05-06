/**
 * MVIS Design System — global visual tokens.
 * Single source of truth for all colors, fonts, and sizes.
 *
 * GROUP COLOR SYSTEM:
 * - Deterministic D3-category10-style palette
 * - same label → same color across ALL plots
 * - Use getGroupColor(label, uniqueGroups) everywhere
 */

// ─── Deterministic group palette (publication-grade) ─────────────────────────
const GROUP_PALETTE = [
  '#1f77b4', // blue
  '#ff7f0e', // orange
  '#2ca02c', // green
  '#d62728', // red
  '#9467bd', // purple
  '#8c564b', // brown
  '#e377c2', // pink
  '#17becf', // cyan
];

/**
 * Returns the color for a group given its index in the unique-groups array.
 * Deterministic — same index always returns same color.
 */
export function groupColor(index) {
  return GROUP_PALETTE[Math.abs(index) % GROUP_PALETTE.length];
}

/**
 * Returns the color for a named group.
 * Pass the full ordered uniqueGroups array so the mapping is consistent.
 */
export function groupColorByName(group, uniqueGroups) {
  const i = uniqueGroups.indexOf(group);
  return groupColor(i < 0 ? 0 : i);
}

/**
 * getGroupColor — primary helper for components.
 * Accepts a label and the ordered unique-groups array.
 */
export function getGroupColor(label, uniqueGroups) {
  return groupColorByName(label, uniqueGroups);
}

// ─── Design tokens ────────────────────────────────────────────────────────────
export const MVG = {
  font: {
    family: 'Arial, Helvetica, sans-serif',
    size: 9,
    color: '#222222',
  },

  axis: {
    lineColor: '#222222',
    lineWidth: 0.6,
    gridColor: 'rgba(0,0,0,0.08)',
    gridDash: '3 2',
    tickFontSize: 7.5,
    labelFontSize: 9,
    labelColor: '#222222',
  },

  paper: '#FFFFFF',
  plot: '#FFFFFF',

  marker: {
    size: 6,
    opacity: 0.82,
    strokeWidth: 0.4,
    strokeColor: '#ffffff',
  },

  colors: {
    // Semantic — volcano, fold change
    up: '#C44E52',
    down: '#4C72B0',
    neutral: '#BDBDBD',

    // Group palette (mirrors GROUP_PALETTE above for direct access)
    groups: GROUP_PALETTE,

    // Heatmap
    heatHigh: '#C44E52',
    heatMid: '#FFFFFF',
    heatLow: '#4C72B0',

    significant: '#C44E52',
    muted: '#BDBDBD',
    selected: '#9467bd',
    pathway: '#C44E52',
  },

  axisProps: {
    tick: {
      fontSize: 7.5,
      fontFamily: 'Arial, Helvetica, sans-serif',
      fill: '#222222'
    },
    axisLine: {
      stroke: '#222222',
      strokeWidth: 0.6
    },
    tickLine: false,
  },

  gridProps: {
    strokeDasharray: '3 2',
    stroke: 'rgba(0,0,0,0.08)',
    strokeWidth: 0.3,
  },
};

// ─── Recharts helpers ─────────────────────────────────────────────────────────
export const rechartsAxisStyle = {
  tick: MVG.axisProps.tick,
  axisLine: MVG.axisProps.axisLine,
  tickLine: MVG.axisProps.tickLine,
};

export const rechartsGridStyle = MVG.gridProps;

// ─── Heatmap color scale ──────────────────────────────────────────────────────
export function heatmapColor(v) {
  const t = Math.max(-3, Math.min(3, v)) / 3;

  if (t >= 0) {
    const r = Math.round(196 + (255 - 196) * (1 - t));
    const g = Math.round(78 * (1 - t));
    const b = Math.round(82 * (1 - t));
    return `rgb(${r},${g},${b})`;
  }

  const u = -t;
  return `rgb(${Math.round(255 * (1 - u))},${Math.round(255 * (1 - u))},${Math.round(76 + (176 - 76) * u)})`;
}
