/**
 * NORMALIZATION & DISTRIBUTION ANALYZER
 * Full local-compute pipeline: sample normalization → transformation → scaling
 * Bell curve visualization (KDE + Gaussian fit) with before/after comparison.
 */

import React, { useMemo, useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import {
  MVG,
  rechartsAxisStyle,
  rechartsGridStyle,
} from '@/lib/engine/mvg';

import { cleanMatrix } from '@/lib/engine/analysisEngine.js';
import {
  computeSkewness,
  safeFlatten,
} from '@/lib/engine/normalizationEngine';

// ─── FAST KDE (FIXED PERFORMANCE VERSION) ─────────────────────────────────────

export function computeDensity(values, bins = 40) {
  if (!values.length) return { x: [], y: [] };

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) return { x: [min], y: [1] };

  const step = (max - min) / bins;
  const xs = Array.from({ length: bins }, (_, i) => min + i * step);

  const n = values.length;
  const mean = values.reduce((s, v) => s + v, 0) / n;

  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;

  const bw =
    1.06 * Math.sqrt(variance || 1e-9) * Math.pow(n, -0.2);

  const inv = 1 / (bw * Math.sqrt(2 * Math.PI));

  const ys = xs.map(xi => {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const z = (xi - values[i]) / bw;
      sum += Math.exp(-0.5 * z * z);
    }
    return (sum / n) * inv;
  });

  return {
    x: xs.map(v => +v.toFixed(4)),
    y: ys.map(v => +v.toFixed(6)),
  };
}

// ─── PIPELINE FUNCTIONS ───────────────────────────────────────────────────────

function applySampleNorm(matrix, mode, istdIndex) {
  if (mode === 'internal_standard' && istdIndex != null) {
    return matrix.map(row => {
      const ref = row[istdIndex] || 1;
      return row.map(v => v / ref);
    });
  }
  return matrix;
}

function applyTransform(matrix, mode) {
  const EPS = 1e-9;

  return matrix.map(row =>
    row.map(v => {
      if (!isFinite(v)) return 0;

      switch (mode) {
        case 'log10': return Math.log10(v + EPS);
        case 'log2': return Math.log2(v + EPS);
        case 'sqrt': return Math.sqrt(Math.max(v, 0));
        case 'cbrt': return Math.cbrt(v);
        case 'asinh_vst': return Math.asinh(v);
        default: return v;
      }
    })
  );
}

function applyScaling(matrix, mode) {
  if (mode === 'none') return matrix;

  const nCols = matrix[0]?.length || 0;

  const stats = Array.from({ length: nCols }, (_, j) => {
    const vals = matrix.map(r => r[j]).filter(isFinite);
    const mean = vals.reduce((s, v) => s + v, 0) / (vals.length || 1);
    const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length || 1);
    const std = Math.sqrt(variance);
    const min = Math.min(...vals);
    const max = Math.max(...vals);

    return { mean, std, min, max };
  });

  return matrix.map(row =>
    row.map((v, j) => {
      const { mean, std, min, max } = stats[j];
      if (!isFinite(v)) return 0;

      switch (mode) {
        case 'mean_centering': return v - mean;
        case 'auto_scaling': return (v - mean) / (std || 1);
        case 'pareto_scaling': return (v - mean) / (Math.sqrt(std || 1));
        case 'range_scaling':
          return (max - min) ? (v - mean) / (max - min) : 0;
        default: return v;
      }
    })
  );
}

function runPipeline(rawMatrix, opts) {
  const base = cleanMatrix(rawMatrix);
  const step1 = applySampleNorm(base, opts.sampleNorm, opts.istdIndex);
  const step2 = applyTransform(step1, opts.transform);
  const final = applyScaling(step2, opts.scaling);

  return { raw: base, final };
}

// ─── STATS ────────────────────────────────────────────────────────────────────

function computeStats(matrix) {
  const vals = safeFlatten(matrix).filter(isFinite);
  if (!vals.length) return null;

  const n = vals.length;
  const mean = vals.reduce((s, v) => s + v, 0) / n;
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);

  const skewness = computeSkewness(vals);

  const zeroRatio = vals.filter(v => v === 0).length / n;

  return {
    mean,
    std,
    skewness,
    zeroRatio,
    n,
  };
}

// ─── SUGGESTION ENGINE ────────────────────────────────────────────────────────

function getSuggestion(stats) {
  if (!stats) return null;

  const { skewness, zeroRatio, n } = stats;

  if (zeroRatio > 0.2 && n > 20) {
    return {
      pipeline: 'asinh / cbrt → pareto',
      reason: 'Zero-heavy data',
    };
  }

  if (skewness > 2 && n > 20) {
    return {
      pipeline: 'log2 → auto scaling',
      reason: 'Strong right skew',
    };
  }

  if (Math.abs(skewness) < 0.5) {
    return {
      pipeline: 'none → mean center',
      reason: 'Near normal distribution',
    };
  }

  return {
    pipeline: 'sqrt → pareto',
    reason: 'Moderate skew',
  };
}

// ─── BELL CURVE ───────────────────────────────────────────────────────────────

function getBellCurveData(matrix, bins = 40) {
  const vals = safeFlatten(matrix).filter(isFinite);
  if (!vals.length) return [];

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  if (min === max) return [];

  const step = (max - min) / bins;

  const hist = Array.from({ length: bins }, (_, i) => ({
    x: min + (i + 0.5) * step,
    count: 0,
  }));

  vals.forEach(v => {
    const idx = Math.min(Math.floor((v - min) / step), bins - 1);
    hist[idx].count++;
  });

  const { x, y } = computeDensity(vals, bins);

  return x.map((xi, i) => ({
    x: +xi.toFixed(3),
    hist: hist[i]?.count ?? 0,
    kde: y[i] ?? 0,
  }));
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function NormalizationViewer({
  rawMatrix,
  options,
}) {
  const [opts] = useState({
    sampleNorm: 'none',
    transform: options?.transform || 'log2',
    scaling: options?.scale || 'pareto_scaling',
    istdIndex: 0,
  });

  const { raw, final } = useMemo(
    () => runPipeline(rawMatrix, opts),
    [rawMatrix, opts]
  );

  const rawStats = useMemo(() => computeStats(raw), [raw]);
  const finalStats = useMemo(() => computeStats(final), [final]);

  const rawBell = useMemo(() => getBellCurveData(raw), [raw]);
  const finalBell = useMemo(() => getBellCurveData(final), [final]);

  const suggestion = useMemo(() => getSuggestion(rawStats), [rawStats]);

  if (!rawMatrix?.length) return null;

  return (
    <div className="space-y-4">

      {suggestion && (
        <div className="p-3 bg-blue-50 border rounded text-xs">
          <b>{suggestion.pipeline}</b>
          <p>{suggestion.reason}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {[rawBell, finalBell].map((data, i) => (
          <ResponsiveContainer key={i} width="100%" height={180}>
            <ComposedChart data={data}>
              <CartesianGrid {...rechartsGridStyle} />
              <XAxis dataKey="x" {...rechartsAxisStyle} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hist" fill="#94a3b8" />
              <Line dataKey="kde" stroke="#3b82f6" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        Skew: {rawStats?.skewness?.toFixed(3)} → {finalStats?.skewness?.toFixed(3)}
      </p>
    </div>
  );
}
