// ─── Normalization Engine ─────────────────────────────────────────────────────

export function safeFlatten(matrix) {
  try {
    return matrix.flat().filter(v => Number.isFinite(v));
  } catch {
    return [];
  }
}

export function applyAllNormalizations(X, internalStandardIndex = null) {
  function applyIS(row) {
    if (internalStandardIndex === null) return row;
    const ref = row[internalStandardIndex] || 1;
    return row.map(v => v / ref);
  }

  const base = X.map(row =>
    applyIS(row).map(v => (Number.isFinite(v) ? v : 0))
  );

  return {
    none: base,
    log2: base.map(r => r.map(v => Math.log2(Math.max(v, 0) + 1))),
    log10: base.map(r => r.map(v => Math.log10(Math.max(v, 0) + 1))),
    sqrt: base.map(r => r.map(v => Math.sqrt(Math.max(v, 0)))),
    cbrt: base.map(r => r.map(v => Math.cbrt(v))),
  };
}

export function computeSkewness(values) {
  if (!values.length) return 0;

  const n = values.length;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);

  if (std === 0) return 0;

  const skew = values.reduce(
    (s, v) => s + ((v - mean) / std) ** 3,
    0
  ) / n;

  return skew;
}

export function interpretSkew(skew) {
  if (skew > 1) return 'Highly right-skewed (strong outliers)';
  if (skew > 0.5) return 'Moderate right skew';
  if (skew < -1) return 'Highly left-skewed';
  if (skew < -0.5) return 'Moderate left skew';
  return 'Approximately normal ✓';
}

// Kernel density estimation (Gaussian, ~50 bins)
export function computeDensity(values, bins = 50) {
  if (!values.length) return { x: [], y: [] };

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) return { x: [min], y: [1] };

  const bw =
    (1.06 *
      (values.reduce(
        (s, v, _, a) => s + (v - a.reduce((a, b) => a + b) / a.length) ** 2,
        0
      ) / values.length) ** 0.5) *
      Math.pow(values.length, -0.2) || 0.1;

  const step = (max - min) / bins;

  const xs = Array.from({ length: bins + 1 }, (_, i) => min + i * step);

  const ys = xs.map(xi =>
    values.reduce(
      (s, v) => s + Math.exp(-0.5 * ((xi - v) / bw) ** 2),
      0
    ) /
    (values.length * bw * Math.sqrt(2 * Math.PI))
  );

  return {
    x: xs.map(v => +v.toFixed(4)),
    y: ys.map(v => +v.toFixed(6))
  };
}
