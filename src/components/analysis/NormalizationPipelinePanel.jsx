/**
 * NORMALIZATION PIPELINE PANEL
 *
 * - Shows controls for transform + scaling
 * - Live preview: before/after density distributions
 * - Calls onChange(opts) on every change (preview only)
 * - Parent is responsible for calling Apply
 */
import React, { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── KDE helper ────────────────────────────────────────────────────────────────
function kde(vals, bins = 40) {
  if (!vals.length) return [];
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  if (mn === mx) return [{ x: mn, density: 1 }];

  const h = (mx - mn) / bins;
  const bandwidth = 1.06 * stdDev(vals) * Math.pow(vals.length, -0.2) || h;

  return Array.from({ length: bins }, (_, i) => {
    const x = mn + (i + 0.5) * h;
    const density = vals.reduce((s, v) =>
      s + Math.exp(-0.5 * ((x - v) / bandwidth) ** 2), 0
    ) / (vals.length * bandwidth * Math.sqrt(2 * Math.PI));
    return { x: +x.toFixed(3), density: +density.toFixed(5) };
  });
}

function stdDev(arr) {
  const m = arr.reduce((s, v) => s + v, 0) / arr.length;
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function flatten(matrix) {
  return matrix.flat().filter(Number.isFinite);
}

// ── Pipeline (client-side, preview only) ─────────────────────────────────────
const EPS = 1e-9;

function transform(matrix, mode) {
  return matrix.map(row => row.map(v => {
    const s = isFinite(v) ? v : 0;
    switch (mode) {
      case 'log10': return Math.log10(s + EPS);
      case 'log2':  return Math.log2(s + EPS);
      case 'sqrt':  return Math.sqrt(Math.max(s, 0));
      case 'cbrt':  return Math.cbrt(s);
      case 'vst':   return Math.asinh(s);
      default:      return s;
    }
  }));
}

function scale(matrix, mode) {
  if (!mode || mode === 'none') return matrix;
  const nCols = matrix[0]?.length || 0;
  const stats = Array.from({ length: nCols }, (_, j) => {
    const col = matrix.map(r => r[j]).filter(isFinite);
    const mean = col.reduce((s, v) => s + v, 0) / (col.length || 1);
    const variance = col.reduce((s, v) => s + (v - mean) ** 2, 0) / (col.length || 1);
    const std = Math.sqrt(variance);
    return { mean, std, min: Math.min(...col), max: Math.max(...col) };
  });
  return matrix.map(row => row.map((v, j) => {
    if (!isFinite(v)) return 0;
    const { mean, std, min, max } = stats[j];
    switch (mode) {
      case 'mean':   return v - mean;
      case 'auto':   return (v - mean) / (std || 1);
      case 'pareto': return (v - mean) / (Math.sqrt(std) || 1);
      case 'range':  return (max - min) > 0 ? (v - mean) / (max - min) : 0;
      default:       return v;
    }
  }));
}

// ── Options ───────────────────────────────────────────────────────────────────
const TRANSFORMS = [
  { value: 'none',  label: 'None' },
  { value: 'log2',  label: 'Log₂' },
  { value: 'log10', label: 'Log₁₀' },
  { value: 'sqrt',  label: 'Square Root' },
  { value: 'cbrt',  label: 'Cube Root' },
  { value: 'vst',   label: 'VST (asinh)' },
];

const SCALES = [
  { value: 'none',   label: 'None' },
  { value: 'mean',   label: 'Mean centering' },
  { value: 'auto',   label: 'Auto scaling (z-score)' },
  { value: 'pareto', label: 'Pareto scaling' },
  { value: 'range',  label: 'Range scaling' },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function NormalizationPipelinePanel({ X_raw, metaboliteNames, currentOpts, onChange }) {
  const opts = currentOpts || { transform: 'none', scale: 'pareto', useISTD: false, istdIndex: null };

  const set = (key, val) => onChange({ ...opts, [key]: val });

  const nCols = X_raw?.[0]?.length ?? 0;

  // ISTD: apply per-sample normalization for preview
  function applyISTD(matrix, idx) {
    if (idx == null || idx < 0) return matrix;
    return matrix.map(row => {
      const ref = Math.abs(row[idx]) || 1;
      return row.map(v => v / ref);
    });
  }

  // Preview: raw vs after transform+scale
  const previewData = useMemo(() => {
    if (!X_raw?.length) return [];
    const rawVals = flatten(X_raw);

    // Apply ISTD first (if enabled)
    const afterISTD = opts.useISTD && opts.istdIndex != null
      ? applyISTD(X_raw, opts.istdIndex)
      : X_raw;

    // stat preview (ISTD + transform only — no scaling)
    const afterT = transform(afterISTD, opts.transform);
    const statVals = flatten(afterT);

    // mv preview (ISTD + transform + scale)
    const afterS = scale(afterT, opts.scale);
    const mvVals = flatten(afterS);


    const beforeCurve = kde(rawVals.slice(0, 2000));
    const statCurve   = kde(statVals.slice(0, 2000));
    const mvCurve     = kde(mvVals.slice(0, 2000));

    // Merge by index for chart
    const len = Math.max(beforeCurve.length, statCurve.length, mvCurve.length);
    return Array.from({ length: len }, (_, i) => ({
      x: i,
      raw:  beforeCurve[i]?.density ?? 0,
      stat: statCurve[i]?.density ?? 0,
      mv:   mvCurve[i]?.density ?? 0,
    }));
  }, [X_raw, opts.transform, opts.scale, opts.useISTD, opts.istdIndex]);

  return (
    <div className="space-y-5">

      {/* ISTD Control */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="useISTD"
            checked={!!opts.useISTD}
            onChange={e => set('useISTD', e.target.checked)}
            className="w-3.5 h-3.5"
          />
          <label htmlFor="useISTD" className="text-[11px] text-gray-700 font-medium cursor-pointer">
            Internal Standard (ISTD) Normalization
          </label>
        </div>
        {opts.useISTD && nCols > 0 && (
          <div className="ml-5 space-y-1">
            <Label className="text-[11px]">ISTD Column</Label>
            <Select
              value={opts.istdIndex != null ? String(opts.istdIndex) : '0'}
              onValueChange={v => set('istdIndex', Number(v))}
            >
              <SelectTrigger className="h-7 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: nCols }, (_, i) => (
                  <SelectItem key={i} value={String(i)} className="text-[11px]">
                    Col {i + 1}{metaboliteNames?.[i] ? ` — ${metaboliteNames[i]}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[9px] text-gray-400">
              Each sample is divided by this column before transformation.
            </p>
          </div>
        )}
      </div>

      {/* Transform + Scaling */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-[11px]">Transformation</Label>
          <p className="text-[9px] text-gray-400">Applied to ALL pipelines (volcano + PCA)</p>
          <Select value={opts.transform || 'none'} onValueChange={v => set('transform', v)}>
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANSFORMS.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-[11px]">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[11px]">Scaling</Label>
          <p className="text-[9px] text-gray-400">PCA/PLS-DA only — NOT used for volcano</p>
          <Select value={opts.scale || 'none'} onValueChange={v => set('scale', v)}>
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCALES.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-[11px]">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Live distribution preview */}
      {previewData.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Live Distribution Preview
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={previewData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="#f0f4f8" strokeDasharray="2 2" />
              <XAxis dataKey="x" hide />
              <YAxis hide />
              <Tooltip
                formatter={(v, name) => [v.toExponential(2), name]}
                contentStyle={{ fontSize: 10 }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="raw"  stroke="#94a3b8" dot={false} name="Raw" strokeWidth={1.5} />
              <Line type="monotone" dataKey="stat" stroke="#3b82f6" dot={false} name="After transform (volcano)" strokeWidth={1.5} />
              <Line type="monotone" dataKey="mv"   stroke="#10b981" dot={false} name="After scaling (PCA/PLS-DA)" strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[9px] text-gray-400 mt-1">
            Blue line = data used for fold-change &amp; p-values. Green = data used for PCA/PLS-DA.
          </p>
        </div>
      )}
    </div>
  );
}
