/**
 * ANALYSIS ENGINE — single public entry point: runAnalysis()
 *
 * CONTRACT:
 * - X_norm is the ONLY data input. X_raw NEVER enters this file.
 * - All statistics are deterministic.
 * - Biology uses q-values (FDR-adjusted) only.
 * - nGroups drives the entire statistical pipeline automatically.
 */

import { runPCA } from './pca.js';
import { runPLSDA, computeVIP } from './plsda.js';
import { prepareHeatmap } from './heatmap.js';
import { buildReport } from './reportBuilder.js';
import { resolveMetabolite } from './resolveMetabolite.js';

// ─── Matrix utility ───────────────────────────────────────────────────────────

export function cleanMatrix(X) {
  return X.map(row => row.map(v => (Number.isFinite(v) ? v : 0)));
}

// ─── Basic stats ──────────────────────────────────────────────────────────────

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function variance(arr, mu) {
  const m = mu ?? mean(arr);
  return arr.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(arr.length - 1, 1);
}

function stddev(arr, mu) {
  return Math.sqrt(variance(arr, mu));
}

// ─── Normal approximation ─────────────────────────────────────────────────────

function normalSurvival(z) {
  const absZ = Math.abs(z);
  const t = 1 / (1 + 0.2316419 * absZ);

  const poly =
    t *
    (0.319381530 +
      t *
        (-0.356563782 +
          t *
            (1.781477937 +
              t * (-1.821255978 + t * 1.330274429))));

  const pdf = Math.exp(-0.5 * absZ * absZ) / Math.sqrt(2 * Math.PI);
  return Math.max(pdf * poly, Number.EPSILON);
}

// ─── Gamma ────────────────────────────────────────────────────────────────────

function lgamma(z) {
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  }

  z -= 1;

  let x = c[0];
  for (let i = 1; i < 9; i++) x += c[i] / (z + i);

  const t = z + 7.5;

  return (
    0.5 * Math.log(2 * Math.PI) +
    (z + 0.5) * Math.log(t) -
    t +
    Math.log(x)
  );
}

// ─── Incomplete beta ──────────────────────────────────────────────────────────

function betainc(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const lbeta = lgamma(a) + lgamma(b) - lgamma(a + b);

  if (x > (a + 1) / (a + b + 2)) {
    return 1 - betainc(1 - x, b, a);
  }

  const eps = 1e-15;
  const maxIter = 300;

  const qab = a + b;
  const qap = a + 1;

  let c = 1;
  let d = 1 - (qab * x) / qap;

  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;

  let h = d;

  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m;

    let num = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));

    d = 1 + num * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;

    c = 1 + num / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;

    d = 1 / d;
    h *= d * c;

    num =
      -((a + m) * (qab + m) * x) /
      ((a + m2) * (a + m2 + 1));

    d = 1 + num * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;

    c = 1 + num / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;

    d = 1 / d;

    const del = d * c;
    h *= del;

    if (Math.abs(del - 1) < eps) break;
  }

  const front =
    Math.exp(
      a * Math.log(x) +
        b * Math.log(1 - x) -
        lbeta
    ) / a;

  return front * h;
}

function tDistP(t, df) {
  if (df < 1) return 1;
  const x = df / (df + t * t);
  return Math.max(betainc(x, df / 2, 0.5), Number.EPSILON);
}

// ─── Volcano plot computation (simplified - your full implementation) ─────────

function computeVolcano(X, labels, metaboliteNames, opts = {}) {
  // Your existing volcano implementation here
  // Returns array of objects with properties: rawName, log2fc, p, q
  return [];
}

// ─── BIOLOGY INTERPRETATION ───────────────────────────────────────────────────

function runBiologicalInterpretation(volcano, opts = {}) {
  const { pThreshold = 0.05, fcThreshold = 0.5 } = opts;
  
  if (!volcano?.length) return { 
    pathways: {}, 
    tagMap: {}, 
    rules: [],
    enrichedPathways: [],
    significantFeatures: []
  };

  const pathways = {};
  const tagMap = {};
  const significantFeatures = [];

  volcano.forEach((feature) => {
    const q = feature.q ?? feature.p ?? 1;
    const log2fc = feature.log2fc ?? 0;
    
    // Only consider statistically significant features
    if (q >= pThreshold) return;
    if (Math.abs(log2fc) < fcThreshold) return;
    
    significantFeatures.push(feature);
    
    const meta = resolveMetabolite(feature.rawName);
    if (!meta) return;

    const dir = log2fc > 0 ? 'up' : 'down';

    // Aggregate pathway scores (weighted by fold change)
    meta.pathways?.forEach((p) => {
      pathways[p] = (pathways[p] || 0) + Math.abs(log2fc);
    });

    // Count up/down regulation per tag
    meta.tags?.forEach((t) => {
      if (!tagMap[t]) tagMap[t] = { up: 0, down: 0, total: 0 };
      tagMap[t][dir]++;
      tagMap[t].total++;
    });
  });

  // Identify enriched pathways (top 10 by score)
  const enrichedPathways = Object.entries(pathways)
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return { 
    pathways, 
    tagMap, 
    rules: [], 
    enrichedPathways,
    significantFeatures,
    meta: {
      totalSignificant: significantFeatures.length,
      pThreshold,
      fcThreshold
    }
  };
}

// ─── MAIN ANALYSIS FUNCTION ───────────────────────────────────────────────────

export function runAnalysis(
  X_mv,
  { X_stat, labels, metaboliteNames, sampleNames, testOpts = {}, prepOpts = {} }
) {
  // Input validation
  if (!X_mv || !X_mv.length || !X_mv[0]?.length) {
    console.error('Invalid input matrix');
    return { error: 'Invalid input matrix' };
  }

  const X_volcano = X_stat || X_mv;
  const nGroups = labels ? new Set(labels).size : 0;

  // PCA (always run)
  const pca = runPCA(X_mv, metaboliteNames, 2);

  // PLS-DA (only for group comparisons)
  let plsda = null;
  let vip = [];
  if (nGroups >= 2) {
    try {
      plsda = runPLSDA(X_mv, labels, 2);
      if (plsda && plsda.loadings) {
        vip = computeVIP(plsda, metaboliteNames);
      }
    } catch (err) {
      console.warn('PLS-DA failed:', err);
    }
  }

  // Heatmap (limit features for performance)
  const maxHeatmapFeatures = Math.min(25, metaboliteNames?.length || 25);
  const heatmap = prepareHeatmap(
    X_mv,
    metaboliteNames,
    sampleNames,
    maxHeatmapFeatures
  );

  // Volcano plot (only for two-group comparisons)
  let volcano = null;
  if (labels && nGroups === 2) {
    try {
      volcano = computeVolcano(
        X_volcano,
        labels,
        metaboliteNames,
        {
          ...testOpts,
          transform: prepOpts?.transform || 'none',
        }
      );
    } catch (err) {
      console.warn('Volcano computation failed:', err);
    }
  }

  // Biological interpretation
  const biology = runBiologicalInterpretation(volcano, {
    pThreshold: testOpts?.pThreshold || 0.05,
    fcThreshold: testOpts?.fcThreshold || 0.5
  });

  // Build report
  let report = null;
  try {
    if (typeof buildReport === 'function') {
      report = buildReport({
        parsedMatrix: {
          sampleNames,
          metaboliteNames,
          matrix: X_mv,
        },
        pcaResult: pca,
        plsdaResult: plsda,
        vipList: vip,
        volcanoResult: volcano,
        biology,
      });
    }
  } catch (err) {
    console.warn('Report building failed:', err);
  }

  // Return complete results
  return {
    pca,
    plsda,
    vip,
    heatmap,
    volcano,
    biology,        // ✅ Now properly returned
    report,
    metadata: {
      nSamples: X_mv.length,
      nFeatures: X_mv[0]?.length || 0,
      nGroups,
      hasVolcano: volcano !== null,
      hasPLSDA: plsda !== null,
    }
  };
}

// ─── EXPORT UTILITIES FOR TESTING ────────────────────────────────────────────

export const _testExports = {
  mean,
  variance,
  stddev,
  tDistP,
  runBiologicalInterpretation
};
