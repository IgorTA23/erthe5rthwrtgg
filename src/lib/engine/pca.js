/**
 * PCA — deterministic, publication-grade.
 * Power iteration + deflation. No external deps.
 *
 * Returns:
 * { scores, loadings, explainedVariance, explainedVarianceRatio, cumulativeVariance, confidence }
 */

function mean(arr) {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function std(arr, mu) {
  const m = mu ?? mean(arr);
  const v = arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(v) || 1;
}

function standardize(matrix) {
  const nFeats = matrix[0].length;

  const colStats = Array.from({ length: nFeats }, (_, j) => {
    const col = matrix.map(r => r[j]);
    const m = mean(col);
    return { m, s: std(col, m) };
  });

  return matrix.map(row =>
    row.map((v, j) => (v - colStats[j].m) / colStats[j].s)
  );
}

function covarianceMatrix(Z) {
  const n = Z.length;
  const p = Z[0].length;

  const C = Array.from({ length: p }, () => Array(p).fill(0));

  for (let i = 0; i < p; i++) {
    for (let j = i; j < p; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) sum += Z[k][i] * Z[k][j];
      C[i][j] = C[j][i] = sum / (n - 1);
    }
  }

  return C;
}

// Deterministic seed for power iteration (avoids randomness)
function initialVector(p, seed = 1) {
  const v = Array.from({ length: p }, (_, i) => Math.cos(i * seed + 1));
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return v.map(x => x / norm);
}

function dominantEigen(C, seed = 1) {
  const p = C.length;
  let v = initialVector(p, seed);

  for (let iter = 0; iter < 300; iter++) {
    const w = Array(p).fill(0);

    for (let i = 0; i < p; i++)
      for (let j = 0; j < p; j++)
        w[i] += C[i][j] * v[j];

    const norm = Math.sqrt(w.reduce((s, x) => s + x * x, 0));
    if (norm < 1e-14) break;

    const vNew = w.map(x => x / norm);
    const diff = vNew.reduce((s, x, i) => s + (x - v[i]) ** 2, 0);

    v = vNew;
    if (diff < 1e-14) break;
  }

  let eigenvalue = 0;
  for (let i = 0; i < p; i++)
    for (let j = 0; j < p; j++)
      eigenvalue += v[i] * C[i][j] * v[j];

  return { vector: v, value: Math.max(eigenvalue, 0) };
}

function deflate(C, vector, value) {
  const p = C.length;

  return C.map((row, i) =>
    row.map((v, j) => v - value * vector[i] * vector[j])
  );
}

function topPCs(C, k) {
  const vectors = [];
  const values = [];

  let Ci = C;

  for (let pc = 0; pc < k; pc++) {
    const { vector, value } = dominantEigen(Ci, pc + 1);
    vectors.push(vector);
    values.push(value);
    Ci = deflate(Ci, vector, value);
  }

  return { vectors, values };
}

/**
 * Run PCA
 * @param {number[][]} matrix rows=samples, cols=metabolites
 * @param {string[]} names metabolite names
 * @param {number} k number of PCs
 */
export function runPCA(matrix, names = [], k = 2) {
  if (!matrix || matrix.length < 2 || !matrix[0]?.length) return null;

  const Z = standardize(matrix);
  const C = covarianceMatrix(Z);

  const nPCs = Math.min(k, C.length, matrix.length - 1);
  const { vectors, values } = topPCs(C, nPCs);

  // Total variance = trace of covariance matrix
  const totalVar =
    C.reduce((s, row, i) => s + Math.max(row[i], 0), 0) || 1;

  const explainedVarianceRatio = values.map(v => Math.max(v, 0) / totalVar);
  const explainedVariance = explainedVarianceRatio.map(r => +(r * 100).toFixed(1));

  const cumulative = [];
  explainedVarianceRatio.reduce((acc, r, i) => {
    cumulative[i] = +(((acc + r) * 100).toFixed(1));
    return acc + r;
  }, 0);

  // Scores: project samples onto PCs
  const scores = Z.map((row, si) => {
    const point = { sample: si + 1 };

    vectors.forEach((vec, pi) => {
      point[`pc${pi + 1}`] = +row
        .reduce((s, v, j) => s + v * vec[j], 0)
        .toFixed(4);
    });

    return point;
  });

  // Loadings: metabolite contributions
  const loadings = names.map((name, j) => {
    const point = { name };

    vectors.forEach((vec, pi) => {
      point[`pc${pi + 1}`] = +vec[j].toFixed(4);
    });

    return point;
  });

  // Confidence: proportion of total variance per PC (for axis labels)
  const confidence = {};
  vectors.forEach((_, pi) => {
    confidence[`pc${pi + 1}`] = explainedVariance[pi];
  });

  return {
    scores,
    loadings,
    explainedVariance,
    explainedVarianceRatio,
    cumulativeVariance: cumulative,
    confidence,
  };
}

/** Parse CSV/TSV into { matrix, sampleNames, metaboliteNames } */
export function parsePCAMatrix(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 3) return null;

  const sep = lines[0].includes('\t') ? '\t' : ',';

  const header = lines[0]
    .split(sep)
    .map(h => h.trim().replace(/['"]/g, ''));

  const metaboliteNames = header.slice(1);

  const sampleNames = [];
  const matrix = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]
      .split(sep)
      .map(c => c.trim().replace(/['"]/g, ''));

    sampleNames.push(cols[0] || `S${i}`);

    const row = cols.slice(1).map(Number);
    if (row.some(isNaN)) continue;

    matrix.push(row);
  }

  if (matrix.length < 2 || metaboliteNames.length < 2) return null;

  return { matrix, sampleNames, metaboliteNames };
}
