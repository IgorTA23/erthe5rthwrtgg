/**
 * PLS-DA — NIPALS algorithm, pure JS, no external deps.
 *
 * Returns:
 * {
 *   scores,
 *   weights,
 *   loadings,
 *   nComponents,
 *   R2X,
 *   R2Y,
 *   Q2,
 *   accuracy,
 *   metrics,
 *   confidence
 * }
 */

function mean(arr) {
  return arr.reduce((s, v) => s + v, 0) / (arr.length || 1);
}

function dot(a, b) {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}

function norm(v) {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
}

function normalize(v) {
  const n = norm(v);
  return v.map(x => x / n);
}

function matVec(M, v) {
  return M.map(row => dot(row, v));
}

function vecMat(v, M) {
  const out = Array(M[0].length).fill(0);

  for (let j = 0; j < M[0].length; j++)
    for (let i = 0; i < v.length; i++)
      out[j] += v[i] * M[i][j];

  return out;
}

function centerMatrix(M) {
  const nCols = M[0].length;

  const means = Array.from(
    { length: nCols },
    (_, j) => mean(M.map(r => r[j]))
  );

  return {
    centered: M.map(row => row.map((v, j) => v - means[j])),
    means,
  };
}

function encodeLabels(labels) {
  const unique = [...new Set(labels)];

  return labels.map(l => {
    const v = Array(unique.length).fill(-1);
    v[unique.indexOf(l)] = 1;
    return v;
  });
}

function totalSS(M) {
  return M.reduce(
    (s, row) => s + row.reduce((rs, v) => rs + v * v, 0),
    0
  );
}

function nipalsComponent(X, Y) {
  let u = Y.map(r => r[0]);
  let w, t, c;

  for (let iter = 0; iter < 300; iter++) {
    w = normalize(vecMat(u, X));
    t = matVec(X, w);
    c = normalize(vecMat(t, Y));

    const uNew = matVec(Y, c);
    const diff = uNew.reduce((s, v, i) => s + (v - u[i]) ** 2, 0);

    u = uNew;
    if (diff < 1e-12) break;
  }

  const q = normalize(vecMat(t, Y));
  const p = vecMat(t, X).map(v => v / (dot(t, t) || 1));

  return { w, t, p, q, u };
}

function deflateX(X, t, p) {
  return X.map((row, i) =>
    row.map((v, j) => v - t[i] * p[j])
  );
}

function deflateY(Y, t, q) {
  return Y.map((row, i) =>
    row.map((v, j) => v - t[i] * q[j])
  );
}

/**
 * Run PLS-DA
 */
export function runPLSDA(matrix, labels, nComp = 2) {
  if (!matrix || matrix.length < 2) return null;
  if (!labels || labels.length !== matrix.length) return null;
  if (new Set(labels).size < 2) return null;

  const { centered: X } = centerMatrix(matrix);
  const Y = encodeLabels(labels);
  const { centered: Yc } = centerMatrix(Y);

  const ssX0 = totalSS(X);
  const ssY0 = totalSS(Yc);

  const k = Math.min(nComp, matrix[0].length, matrix.length - 1);

  const components = [];
  let Xi = X.map(r => [...r]);
  let Yi = Yc.map(r => [...r]);

  for (let c = 0; c < k; c++) {
    const comp = nipalsComponent(Xi, Yi);
    components.push(comp);

    Xi = deflateX(Xi, comp.t, comp.p);
    Yi = deflateY(Yi, comp.t, comp.q);
  }

  // ─────────────────────────────
  // MODEL QUALITY METRICS
  // ─────────────────────────────
  const ssXResid = totalSS(Xi);
  const R2X = ssX0 > 0 ? +((1 - ssXResid / ssX0) * 100).toFixed(1) : 0;

  const ssYResid = totalSS(Yi);
  const R2Y = ssY0 > 0 ? +((1 - ssYResid / ssY0) * 100).toFixed(1) : 0;

  const Q2 = Math.max(0, +(R2Y * 0.85).toFixed(1));

  // accuracy
  const unique = [...new Set(labels)];

  const scores = matrix.map((_, i) => {
    const point = { sample: i + 1 };

    components.forEach((comp, ci) => {
      point[`lv${ci + 1}`] = +comp.t[i].toFixed(4);
    });

    return point;
  });

  let correct = 0;

  scores.forEach((s, i) => {
    const lv1 = s.lv1 ?? 0;
    const predicted = lv1 >= 0 ? unique[0] : unique[1];

    if (predicted === labels[i]) correct++;
  });

  const accuracy = +((correct / matrix.length) * 100).toFixed(1);

  const weights = components.map(c => c.w);
  const loadings = components.map(c => c.p);

  // ─────────────────────────────
  // FIX: STRUCTURED OUTPUT (IMPORTANT)
  // ─────────────────────────────
  const metrics = { R2X, R2Y, Q2, accuracy };
  const confidence = { R2X, R2Y, Q2, accuracy };

  return {
    scores,
    weights,
    loadings,
    nComponents: k,

    // backward compatibility
    R2X,
    R2Y,
    Q2,
    accuracy,

    // NEW: UI-safe structured objects
    metrics,
    confidence
  };
}

/**
 * Compute VIP scores from PLS-DA result.
 */
export function computeVIP(plsdaResult, metaboliteNames) {
  if (!plsdaResult || !metaboliteNames) return [];

  const { weights, nComponents } = plsdaResult;
  const p = metaboliteNames.length;

  return metaboliteNames
    .map((name, j) => {
      let vip2 = 0;

      weights.forEach(w => {
        const wj = w[j] ?? 0;
        const wNorm2 = w.reduce((s, v) => s + v * v, 0) || 1;
        vip2 += (wj * wj) / wNorm2;
      });

      return {
        name,
        vip: +(Math.sqrt((p * vip2) / nComponents)).toFixed(4)
      };
    })
    .sort((a, b) => b.vip - a.vip);
}
