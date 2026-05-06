import React, { useMemo, useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, LabelList
} from 'recharts';
import { MVG, rechartsAxisStyle, rechartsGridStyle } from '@/lib/engine/mvg';

/* =========================
   TOOLTIP
========================= */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="bg-card border rounded-lg p-2 shadow-lg text-xs">
      <p className="font-semibold">{d.name}</p>
      <p>log₂FC: <span className="font-mono">{d.x.toFixed(3)}</span></p>
      <p>-log₁₀(p): <span className="font-mono">{d.y.toFixed(2)}</span></p>
      <p>p: <span className="font-mono">{d.p.toExponential(2)}</span></p>
    </div>
  );
};

/* =========================
   MAIN
========================= */
export default function VolcanoPlot({ data, pThreshold = 0.05, fcThreshold = 1 }) {

  const [labelTopN, setLabelTopN] = useState(10);

  const negLogPThreshold = useMemo(
    () => -Math.log10(pThreshold),
    [pThreshold]
  );

  /* =========================
     NORMALIZATION (FIXED)
  ========================= */
  const points = useMemo(() => {
    if (!data?.length) return [];

    return data.map((row) => {
      const p = Math.max(row.effectiveP ?? row.p ?? 1, 1e-300);

      return {
        x: row.log2fc,
        y: Math.min(-Math.log10(p), 50), // 🔥 CAP EXTREME VALUES
        p,
        name: row.rawName ?? row.name ?? 'unknown',
        pathway: row.pathway ?? null
      };
    });
  }, [data]);

  /* =========================
     CLASSIFICATION
  ========================= */
  const { upData, downData, nsData } = useMemo(() => {
    const up = [];
    const down = [];
    const ns = [];

    points.forEach((d) => {
      const sig = d.y >= negLogPThreshold;

      if (sig && d.x >= fcThreshold) up.push(d);
      else if (sig && d.x <= -fcThreshold) down.push(d);
      else ns.push(d);
    });

    return { upData: up, downData: down, nsData: ns };
  }, [points, negLogPThreshold, fcThreshold]);

  /* =========================
     AUTO LABELING
  ========================= */
  const labeled = useMemo(() => {
    return [...points]
      .filter(d => d.y >= negLogPThreshold)
      .sort((a, b) => b.y - a.y)
      .slice(0, labelTopN);
  }, [points, negLogPThreshold, labelTopN]);

  /* =========================
     OVERLAP FILTER
  ========================= */
  const filteredLabels = useMemo(() => {
    const used = [];
    return labeled.filter((d) => {
      const tooClose = used.some(u =>
        Math.abs(u.x - d.x) < 0.3 && Math.abs(u.y - d.y) < 0.3
      );
      if (tooClose) return false;
      used.push(d);
      return true;
    });
  }, [labeled]);

  if (!points.length) return null;

  return (
    <div className="space-y-2" style={{ fontFamily: MVG.font.family }}>

      {/* Controls */}
      <div className="flex gap-4 text-[11px] items-center">
        <span>Labels:</span>
        {[5, 10, 20].map(n => (
          <button
            key={n}
            onClick={() => setLabelTopN(n)}
            className={`px-2 py-0.5 border rounded ${
              labelTopN === n ? 'bg-black text-white' : ''
            }`}
          >
            Top {n}
          </button>
        ))}
      </div>

      {/* SUMMARY */}
      <div className="text-[10px] flex gap-3 text-gray-600">
        <span style={{ color: MVG.colors.up }}>▲ {upData.length} up</span>
        <span style={{ color: MVG.colors.down }}>▼ {downData.length} down</span>
        <span>● {nsData.length} ns</span>
      </div>

      {/* CHART */}
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 25, left: 5 }}>

            <CartesianGrid {...rechartsGridStyle} />

            {/* ✅ FIXED X AXIS */}
            <XAxis
              type="number"
              dataKey="x"
              tickFormatter={(v) => Number(v).toFixed(2)}
              tickCount={6}
              domain={['auto', 'auto']}
              label={{
                value: 'log₂ Fold Change',
                position: 'bottom',
                offset: 10
              }}
              {...rechartsAxisStyle}
            />

            {/* ✅ FIXED Y AXIS */}
            <YAxis
              type="number"
              dataKey="y"
              tickFormatter={(v) => Number(v).toFixed(2)}
              tickCount={6}
              domain={[0, 'auto']}
              label={{
                value: '-log₁₀(p)',
                angle: -90,
                position: 'insideLeft'
              }}
              {...rechartsAxisStyle}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* thresholds */}
            <ReferenceLine y={negLogPThreshold} stroke="#999" strokeDasharray="4 4" />
            <ReferenceLine x={fcThreshold} stroke="#ccc" strokeDasharray="4 4" />
            <ReferenceLine x={-fcThreshold} stroke="#ccc" strokeDasharray="4 4" />

            {/* points */}
            <Scatter data={nsData} fill="#94a3b8" fillOpacity={0.3} />
            <Scatter data={upData} fill={MVG.colors.up} />
            <Scatter data={downData} fill={MVG.colors.down} />

            {/* labels */}
            <Scatter data={filteredLabels} fill="transparent">
              <LabelList
                dataKey="name"
                position="top"
                style={{
                  fontSize: 9,
                  fill: MVG.font.color
                }}
              />
            </Scatter>

          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
