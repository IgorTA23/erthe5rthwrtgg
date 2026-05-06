/**
 * SMART RECOMMENDATION ENGINE
 * Analyzes raw data properties and suggests a single preprocessing combination.
 * Returns null if confidence < 0.50 (no suggestion shown).
 */

function skewness(arr) {
  const n = arr.length;
  if (n < 3) return 0;

  const mean = arr.reduce((s, v) => s + v, 0) / n;

  const sd = Math.sqrt(
    arr.reduce((s, v) => s + (v - mean) ** 2, 0) / n
  );

  if (sd === 0) return 0;

  return arr.reduce((s, v) => s + ((v - mean) / sd) ** 3, 0) / n;
}

function columnSkewness(matrix) {
  if (!matrix?.length) return [];

  const nCols = matrix[0].length;

  return Array.from({ length: nCols }, (_, c) =>
    skewness(matrix.map((row) => row[c]))
  );
}

function zeroInflation(matrix) {
  const flat = matrix.flat();
  return flat.filter((v) => v === 0).length / flat.length;
}

function hasNegatives(matrix) {
  return matrix.flat().some((v) => v < 0);
}

function sampleVarianceSpread(matrix) {
  // Coefficient of variation of per-sample total-ion counts
  const totals = matrix.map((row) =>
    row.reduce((s, v) => s + Math.abs(v), 0)
  );

  const mean =
    totals.reduce((s, v) => s + v, 0) / totals.length;

  if (mean === 0) return 0;

  const sd = Math.sqrt(
    totals.reduce((s, v) => s + (v - mean) ** 2, 0) /
      totals.length
  );

  return sd / mean; // CV
}

/**
 * @param {number[][]} matrix — raw matrix (samples × metabolites)
 * @returns {{
 *   suggested_transformation,
 *   suggested_scaling,
 *   confidence,
 *   reason,
 *   warnings
 * } | null}
 */
export function computeRecommendation(matrix) {
  if (!matrix?.length || !matrix[0]?.length) return null;

  const skews = columnSkewness(matrix);
  const meanSkew =
    skews.reduce((s, v) => s + v, 0) / skews.length;

  const zeroPct = zeroInflation(matrix);
  const negatives = hasNegatives(matrix);
  const cvSamples = sampleVarianceSpread(matrix);

  let transform = 'none';
  let scaling = 'none';
  let confidence = 0;
  let reason = '';
  const warnings = [];

  // ── Transformation ────────────────────────────────────────────────────────
  if (meanSkew > 1) {
    transform = 'log2';
    confidence = Math.min(0.95, 0.75 + (meanSkew - 1) * 0.05);
    reason = 'Right-skewed distribution detected';

    if (negatives) {
      warnings.push(
        'Negative values present — log transform may fail; consider offset or sqrt'
      );

      transform = 'sqrt';
      confidence = Math.max(0.55, confidence - 0.15);
      reason =
        'Right-skewed distribution with negative values — sqrt recommended';
    }
  } else if (zeroPct > 0.30) {
    transform = negatives ? 'sqrt' : 'log2';
    confidence = 0.68;

    reason = `High zero-inflation (${(zeroPct * 100).toFixed(
      0
    )}%) detected`;

    warnings.push(
      'High zero-inflation — log2 applied with caution; consider sqrt as safer fallback'
    );
  } else if (meanSkew >= 0.5 && meanSkew <= 1) {
    transform = 'sqrt';
    confidence = 0.60 + (meanSkew - 0.5) * 0.2;
    reason = 'Mild right skew detected';
  }

  // ── Scaling ───────────────────────────────────────────────────────────────
  if (cvSamples > 0.3) {
    scaling = 'auto'; // z-score
    confidence = Math.min(0.98, confidence + 0.08);
    reason += reason
      ? ' + high inter-sample variance'
      : 'High inter-sample variance detected';
  } else if (cvSamples > 0.1) {
    scaling = 'pareto';
    reason += reason
      ? ' + moderate variance spread'
      : 'Moderate variance spread detected';
  }

  // ── Outlier warning ───────────────────────────────────────────────────────
  const absFlat = matrix.flat().map(Math.abs);
  const sorted = [...absFlat].sort((a, b) => a - b);

  const q75 = sorted[Math.floor(sorted.length * 0.75)];
  const q99 = sorted[Math.floor(sorted.length * 0.99)];

  if (q99 > q75 * 10) {
    warnings.push(
      'Extreme outliers detected — robust scaling (IQR) may be beneficial'
    );
  }

  // ── Near-constant features ────────────────────────────────────────────────
  const nearConstant = skews.filter((_, i) => {
    const col = matrix.map((r) => r[i]);
    const mx = Math.max(...col);
    const mn = Math.min(...col);
    return mx - mn < 1e-8;
  }).length;

  if (nearConstant > 0) {
    warnings.push(
      `${nearConstant} near-constant feature(s) detected — may cause instability`
    );
  }

  // ── Suppress low-confidence ───────────────────────────────────────────────
  if (confidence < 0.50) return null;

  return {
    suggested_transformation: transform,
    suggested_scaling: scaling,
    confidence: Math.round(confidence * 100) / 100,
    reason: reason || 'Data properties analysed',
    warnings,
  };
}
