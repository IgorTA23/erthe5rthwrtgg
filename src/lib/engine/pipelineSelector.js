/**
 * Auto-select best preprocessing pipeline based on:
 * - skewness (distribution quality)
 * - variance balance (no dominant features)
 * - PCA quality (PC1 explained variance)
 * - PLS-DA separation (optional, when labels provided)
 */

import { transformData, paretoScale, autoscale, meanCenter } from './preprocess.js';
import { runPCA } from './pca.js';
import { runPLSDA } from './plsda.js';
import { safeFlatten, computeSkewness } from './normalizationEngine.js';

// ─── Candidate pipelines ──────────────────────────────────────────────────────
export const PIPELINES = [
  { name: 'None', transform: 'none', scale: 'none' },
  { name: 'Log2 + Pareto', transform: 'log2', scale: 'pareto' },
  { name: 'Log2 + Auto', transform: 'log2', scale: 'auto' },
  { name: 'Log10 + Pareto', transform: 'log10', scale: 'pareto' },
  { name: 'Sqrt + Pareto', transform: 'sqrt', scale: 'pareto' },
];

// ─── Apply one pipeline ───────────────────────────────────────────────────────
function applyPipeline(X, pipeline) {
  let data = transformData(X, pipeline.transform);

  switch (pipeline.scale) {
    case 'pareto':
      data = paretoScale(data);
      break;
    case 'auto':
      data = autoscale(data);
      break;
    case 'mean':
      data = meanCenter(data);
      break;
    default:
      break;
  }

  return data;
}

// ─── Scoring metrics ──────────────────────────────────────────────────────────
function skewScore(X) {
  return Math.abs(computeSkewness(safeFlatten(X)));
}

function varianceScore(X) {
  if (!X.length || !X[0].length) return 0;

  const cols = X[0].length;

  const variances = Array.from({ length: cols }, (_, j) => {
    const vals = X.map(r => r[j]);
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;

    return vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
  });

  const meanVar = variances.reduce((s, v) => s + v, 0) / variances.length;

  return variances.reduce((s, v) => s + Math.abs(v - meanVar), 0) / variances.length;
}

function pcaScore(X) {
  try {
    const res = runPCA(X, null, 1);
    return (res?.explainedVariance?.[0] ?? 0) / 100;
  } catch {
    return 0;
  }
}

function plsdaScore(X, labels) {
  if (!labels || new Set(labels).size < 2) return null;

  try {
    const res = runPLSDA(X, labels, 1);
    if (!res?.scores?.length) return null;

    const lv1 = res.scores.map(s => s.lv1);
    const mean = lv1.reduce((s, v) => s + v, 0) / lv1.length;

    return lv1.reduce((s, v) => s + (v - mean) ** 2, 0) / lv1.length;
  } catch {
    return null;
  }
}

function totalScore(X, labels) {
  const s = skewScore(X);
  const v = varianceScore(X);
  const p = pcaScore(X);
  const d = plsdaScore(X, labels);

  const skewW = 0.35;
  const varW = 0.25;
  const pcaW = d !== null ? 0.20 : 0.40;
  const plsW = d !== null ? 0.20 : 0;

  // Normalise skew and variance penalties into [0,1] gains
  const skewGain = 1 / (1 + s);
  const varGain = 1 / (1 + v / 100); // variance values can be large
  const plsGain = d !== null ? Math.min(1, d / 10) : 0;

  return skewW * skewGain + varW * varGain + pcaW * p + plsW * plsGain;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function selectBestPipeline(rawMatrix, labels = null) {
  const results = PIPELINES.map(pipeline => {
    const processed = applyPipeline(rawMatrix, pipeline);

    const skew = computeSkewness(safeFlatten(processed));
    const varBal = varianceScore(processed);
    const pcaVar = pcaScore(processed) * 100;
    const score = totalScore(processed, labels);

    return {
      ...pipeline,
      processed,
      score,
      metrics: { skew, varBal, pcaVar }
    };
  });

  return results.sort((a, b) => b.score - a.score);
}

export function explainChoice(result) {
  const lines = [];

  if (Math.abs(result.metrics.skew) < 0.5)
    lines.push('Approximately normal distribution');
  else if (Math.abs(result.metrics.skew) < 1)
    lines.push('Reduced skewness vs raw');
  else
    lines.push('Best skewness among candidates');

  lines.push('Balanced metabolite variance (no dominant features)');
  lines.push(`PC1 explains ${result.metrics.pcaVar.toFixed(1)}% of variance`);

  return lines;
}
