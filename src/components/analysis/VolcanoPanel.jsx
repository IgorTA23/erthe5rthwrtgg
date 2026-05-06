import React, { useMemo, useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Cell
} from 'recharts';
import { MVG } from '@/lib/engine/mvg';

/* =========================
   HELPERS
========================= */

function safeNumber(v, fallback = 0) {
  return Number.isFinite(v) ? v : fallback;
}

function makeTicks(min, max, step) {
  const out = [];
  for (let v = min; v <= max + 1e-9; v += step) {
    out.push(+v.toFixed(4));
  }
  return out;
}

function getStep(range) {
  if (range <= 1)  return 0.1;
  if (range <= 2)  return 0.2;
  if (range <= 5)  return 0.5;
  if (range <= 10) return 1;
  if (range <= 20) return 2;
  if (range <= 50) return 5;
  return 10;
}

/* =========================
   TOOLTIP
========================= */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="bg-white border rounded-lg shadow px-3 py-2 text-xs">
      <p className="font-semibold">{d.name}</p>
      <p>log₂FC: <span className="font-mono">{d.log2fc.toFixed(3)}</span></p>
      <p>-log₁₀(p): <span className="font-mono">{d.negLogP.toFixed(3)}</span></p>
      <p>p: <span className="font-mono">{d.p.toExponential(2)}</span></p>
    </div>
  );
};

/* =========================
   MAIN
========================= */
export default function VolcanoPanel({ volcanoData }) {

  const [fcThresh, setFcThresh] = useState(1);
  const [pThresh, setPThresh]   = useState(0.05);

  // Compute the true max |log2FC| in the data so slider range is never capped
  const maxAbsFC = useMemo(() => {
    if (!Array.isArray(volcanoData) || !volcanoData.length) return 3;
    const vals = volcanoData.map(d => Math.abs(safeNumber(d?.log2fc))).filter(Number.isFinite);
    return Math.max(...vals, 1);
  }, [volcanoData]);

  const SIG_THRESH = -Math.log10(pThresh);

  const points = useMemo(() => {
    if (!Array.isArray(volcanoData)) return [];

    return volcanoData.map(d => {
      const rawP = safeNumber(d?.p, 1);
      const safeP = rawP <= 0 ? 1e-300 : Math.max(rawP, 1e-300);

      const log2fc = safeNumber(d?.log2fc);
      const negLogP = -Math.log10(safeP);

      return {
        name: d?.rawName || d?.name || 'unknown',
        p: safeP,
        log2fc,
        negLogP
      };
    });
  }, [volcanoData]);

  const { xDomain, yDomain, xTicks, yTicks } = useMemo(() => {
    if (!points.length) {
      return {
        xDomain: [-3, 3],
        yDomain: [0, 5],
        xTicks: [-3, -2, -1, 0, 1, 2, 3],
        yTicks: [0, 1, 2, 3, 4, 5],
      };
    }

    const fcVals = points.map(d => d.log2fc).filter(Number.isFinite);
    const yVals  = points.map(d => d.negLogP).filter(Number.isFinite);

    // True min/max — NO percentile clipping, NO integer rounding, NO cap
    const fcMin = Math.min(...fcVals);
    const fcMax = Math.max(...fcVals);

    // Soft 5% padding on each side
    const fcRange  = Math.max(fcMax - fcMin, 0.5);
    const fcPad    = fcRange * 0.05;
    const xMin     = fcMin - fcPad;
    const xMax     = fcMax + fcPad;

    const maxY  = Math.max(...yVals, 0);
    const yTop  = maxY < 1 ? 1.2 : maxY * 1.08;

    const stepX = getStep(xMax - xMin);
    const stepY = getStep(yTop);

    return {
      xDomain: [xMin, xMax],
      yDomain: [0, yTop],
      xTicks: makeTicks(xMin, xMax, stepX),
      yTicks: makeTicks(0, yTop, stepY),
    };
  }, [points]);

  const pointColor = (d) => {
    const sig = d.negLogP >= SIG_THRESH;

    if (sig && d.log2fc >= fcThresh) return MVG.colors.up;
    if (sig && d.log2fc <= -fcThresh) return MVG.colors.down;

    return '#94a3b8';
  };

  const up = points.filter(d => d.negLogP >= SIG_THRESH && d.log2fc >= fcThresh).length;
  const down = points.filter(d => d.negLogP >= SIG_THRESH && d.log2fc <= -fcThresh).length;

  if (!points.length) return null;

  return (
    <div>

      {/* CONTROLS */}
      <div className="flex gap-6 mb-3 text-[11px] items-center">

        <div>
          <span>p-value: </span>
          <input
            type="range"
            min={0.0001}
            max={0.1}
            step={0.0001}
            value={pThresh}
            onChange={(e) => setPThresh(Number(e.target.value))}
          />
          <span className="ml-2 font-mono">{pThresh.toFixed(4)}</span>
        </div>

        <div>
          <span>log₂FC: </span>
          <input
            type="range"
            min={0}
            max={maxAbsFC}
            step={maxAbsFC > 10 ? 0.5 : 0.1}
            value={fcThresh}
            onChange={(e) => setFcThresh(Number(e.target.value))}
          />
          <span className="ml-2 font-mono">{fcThresh.toFixed(2)}</span>
        </div>

      </div>

      {/* SUMMARY */}
      <div className="flex gap-4 mb-2 text-[11px] text-gray-600">
        <span style={{ color: MVG.colors.up }}>▲ {up} up</span>
        <span style={{ color: MVG.colors.down }}>▼ {down} down</span>
        <span>{points.length - up - down} ns</span>
      </div>

      {/* CHART */}
      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>

          <CartesianGrid stroke="#eef2f7" strokeDasharray="2 2" />

          <XAxis
            type="number"
            dataKey="log2fc"
            domain={xDomain}
            ticks={xTicks}
            tickFormatter={(v) => v.toFixed(1)}
            label={{ value: 'log₂ Fold Change', position: 'bottom', offset: 10 }}
          />

          <YAxis
            type="number"
            dataKey="negLogP"
            domain={yDomain}
            ticks={yTicks}
            tickFormatter={(v) => v.toFixed(1)}
            label={{ value: '-log₁₀(p)', angle: -90, position: 'insideLeft' }}
            allowDataOverflow
          />

          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine y={SIG_THRESH} stroke="#94a3b8" strokeDasharray="3 3" />
          <ReferenceLine x={fcThresh} stroke="#cbd5e1" strokeDasharray="3 3" />
          <ReferenceLine x={-fcThresh} stroke="#cbd5e1" strokeDasharray="3 3" />

          <Scatter data={points}>
            {points.map((d, i) => (
              <Cell
                key={i}
                fill={pointColor(d)}
                fillOpacity={d.negLogP >= SIG_THRESH ? 0.9 : 0.4}
              />
            ))}
          </Scatter>

        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
