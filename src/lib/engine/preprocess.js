/**
 * Preprocessing engine for metabolomics matrices.
 * Pipeline: Internal Standard Normalization → Transformation → Scaling
 */

// ─── Internal Standard Normalization ─────────────────────────────────────────
export function internalStandardNormalization(matrix, internalStdIndex) {
  return matrix.map((sample) => {
    const factor = sample[internalStdIndex];
    return sample.map((v) => v / (factor || 1));
  });
}

export function multiInternalStandardNormalization(matrix, indices) {
  return matrix.map((sample) => {
    const avg =
      indices.reduce((sum, i) => sum + sample[i], 0) / indices.length;
    return sample.map((v) => v / (avg || 1));
  });
}

// ─── Transformation ───────────────────────────────────────────────────────────
export function varianceStabilizing(matrix) {
  return matrix.map((row) =>
    row.map((v) => Math.log(v + Math.sqrt(v * v + 1)))
  );
}

export function transformData(matrix, method = 'none') {
  switch (method) {
    case 'log10':
      return matrix.map((r) => r.map((v) => Math.log10(v + 1e-9)));
    case 'log2':
      return matrix.map((r) => r.map((v) => Math.log2(v + 1e-9)));
    case 'sqrt':
      return matrix.map((r) => r.map((v) => Math.sqrt(Math.max(v, 0))));
    case 'cbrt':
      return matrix.map((r) => r.map((v) => Math.cbrt(v)));
    case 'vst':
      return varianceStabilizing(matrix);
    default:
      return matrix;
  }
}

// ─── Scaling ──────────────────────────────────────────────────────────────────
function colStats(matrix) {
  const cols = matrix[0].length;

  const means = Array(cols)
    .fill(0)
    .map((_, j) =>
      matrix.reduce((sum, r) => sum + r[j], 0) / matrix.length
    );

  const stds = Array(cols)
    .fill(0)
    .map((_, j) => {
      const m = means[j];
      return Math.sqrt(
        matrix.reduce((sum, r) => sum + (r[j] - m) ** 2, 0) /
          matrix.length
      );
    });

  return { means, stds };
}

export function meanCenter(matrix) {
  const { means } = colStats(matrix);
  return matrix.map((r) => r.map((v, j) => v - means[j]));
}

export function autoscale(matrix) {
  const { means, stds } = colStats(matrix);
  return matrix.map((r) =>
    r.map((v, j) => (v - means[j]) / (stds[j] || 1))
  );
}

export function paretoScale(matrix) {
  const { means, stds } = colStats(matrix);
  return matrix.map((r) =>
    r.map((v, j) => (v - means[j]) / Math.sqrt(stds[j] || 1))
  );
}

export function rangeScale(matrix) {
  const cols = matrix[0].length;

  const mins = Array(cols)
    .fill(0)
    .map((_, j) => Math.min(...matrix.map((r) => r[j])));

  const maxs = Array(cols)
    .fill(0)
    .map((_, j) => Math.max(...matrix.map((r) => r[j])));

  return matrix.map((r) =>
    r.map(
      (v, j) => (v - mins[j]) / ((maxs[j] - mins[j]) || 1)
    )
  );
}

// ─── Main pipeline ────────────────────────────────────────────────────────────
/**
 * preprocess(matrix, options, metaboliteNames?)
 *
 * options:
 *   transform — 'none'|'log2'|'log10'|'sqrt'|'cbrt'|'vst'
 *   scale — 'none'|'mean'|'auto'|'pareto'|'range'
 *   useISTD — boolean
 *   istdColumn — string name of the ISTD column (matched in metaboliteNames)
 *
 * Legacy: internalStandard.enabled + internalStandard.indices still supported
 */
export function preprocess(matrix, options = {}, metaboliteNames = []) {
  let X = matrix.map((r) => [...r]); // deep copy

  // ── ISTD normalization (new: by column name) ───────────────────────────────
  if (options.useISTD && options.istdColumn && metaboliteNames.length) {
    const istdIdx = metaboliteNames.indexOf(options.istdColumn);

    if (istdIdx >= 0) {
      X = X.map((sample) => {
        const factor = sample[istdIdx];
        if (!factor || factor === 0) return sample;
        return sample.map((v) => v / factor);
      });
    }
  }

  // ── ISTD normalization (legacy: by index array) ────────────────────────────
  if (
    !options.useISTD &&
    options.internalStandard?.enabled &&
    options.internalStandard.indices?.length
  ) {
    X = multiInternalStandardNormalization(
      X,
      options.internalStandard.indices
    );
  }

  X = transformData(X, options.transform || 'none');

  switch (options.scale) {
    case 'mean':
      X = meanCenter(X);
      break;
    case 'auto':
      X = autoscale(X);
      break;
    case 'pareto':
      X = paretoScale(X);
      break;
    case 'range':
      X = rangeScale(X);
      break;
    default:
      break;
  }

  return X;
}
