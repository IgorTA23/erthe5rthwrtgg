/**
 * PREPROCESSING PIPELINE — corrected & production-safe
 *
 * X_stat — ISTD + transform (NO scaling)
 * X_mv   — ISTD + transform + scaling
 */

const EPS = 1e-9;

// ── Deep clone (prevents mutation bugs) ───────────────────────────────────────
function clone(matrix) {
  return matrix.map(r => [...r]);
}

// ── Step 1: Internal Standard normalization ──────────────────────────────────
function applyISTD(matrix, istdIndex) {
  if (istdIndex == null || istdIndex < 0) return clone(matrix);

  return matrix.map(row => {
    const ref = row[istdIndex];

    // Reject bad ISTD instead of masking it
    if (!isFinite(ref) || Math.abs(ref) < EPS) {
      return row.map(() => NaN);
    }

    return row.map(v => (isFinite(v) ? v / ref : NaN));
  });
}

// ── Step 2: Transformation ────────────────────────────────────────────────────
function applyTransform(matrix, mode) {
  // Precompute global shift for log transforms
  let shift = 0;

  if (mode === 'log10' || mode === 'log2') {
    const flat = matrix.flat().filter(v => isFinite(v));
    const minVal = Math.min(...flat);
    if (minVal <= 0) shift = Math.abs(minVal) + EPS;
  }

  return matrix.map(row =>
    row.map(v => {
      if (!isFinite(v)) return NaN;

      switch (mode) {
        case 'log10': return Math.log10(v + shift);
        case 'log2':  return Math.log2(v + shift);

        case 'sqrt':  return v >= 0 ? Math.sqrt(v) : NaN;
        case 'cbrt':  return Math.cbrt(v);

        case 'vst':
        case 'asinh_vst': return Math.asinh(v);

        default: return v;
      }
    })
  );
}

// ── Step 3: Scaling (multivariate only) ──────────────────────────────────────
function applyScaling(matrix, mode) {
  if (mode === 'none' || !mode) return clone(matrix);

  const nCols = matrix[0]?.length || 0;

  const stats = Array.from({ length: nCols }, (_, j) => {
    const vals = matrix.map(r => r[j]).filter(isFinite);

    if (!vals.length) {
      return { mean: 0, std: 1, min: 0, max: 1 };
    }

    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;

    const variance =
      vals.reduce((s, v) => s + (v - mean) ** 2, 0) /
      Math.max(vals.length - 1, 1); // ✅ sample variance

    const std = Math.sqrt(variance);

    const min = Math.min(...vals);
    const max = Math.max(...vals);

    return { mean, std, min, max };
  });

  return matrix.map(row =>
    row.map((v, j) => {
      if (!isFinite(v)) return NaN;

      const { mean, std, min, max } = stats[j];

      switch (mode) {
        case 'mean':
        case 'mean_centering':
          return v - mean;

        case 'auto':
        case 'auto_scaling':
          return (v - mean) / (std || 1);

        case 'pareto':
        case 'pareto_scaling': {
          const sd = std || 1;
          return (v - mean) / Math.sqrt(sd); // ✅ correct Pareto
        }

        case 'range':
        case 'range_scaling':
          return (max - min) > 0 ? (v - min) / (max - min) : 0; // ✅ fixed

        default:
          return v;
      }
    })
  );
}

// ── Clean (preserve NaN — do NOT zero them) ───────────────────────────────────
function clean(matrix) {
  return matrix.map(row =>
    row.map(v => (isFinite(v) ? v : NaN))
  );
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────

export function runPreprocessingPipeline(X_raw, opts = {}) {
  const {
    transform = 'none',
    scale     = 'none',
    useISTD   = false,
    istdIndex = null,
  } = opts;

  // Always work on a copy
  const input = clone(X_raw);

  // Step 1 — ISTD
  const afterISTD = useISTD
    ? applyISTD(input, istdIndex)
    : input;

  // Step 2 — Transform
  const afterTransform = applyTransform(afterISTD, transform);

  // Step 3 — Scaling (MV only)
  const afterScaling = applyScaling(afterTransform, scale);

  return {
    X_stat: clean(afterTransform), // ✅ unscaled
    X_mv:   clean(afterScaling),   // ✅ scaled
  };
}
