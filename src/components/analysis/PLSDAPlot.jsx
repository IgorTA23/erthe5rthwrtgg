/**
 * PLS-DA + VIP MODULE — Score plot with confidence ellipses + enhanced VIP plot.
 */
import React, { useMemo, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Label,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { useAnalysisStore } from '@/lib/store/analysisStore.js';
import {
  MVG,
  groupColorByName,
  rechartsAxisStyle,
  rechartsGridStyle
} from '@/lib/engine/mvg';
import { computeEllipse } from '@/components/analysis/GroupEllipse';
import Panel from '@/components/analysis/Panel';
import ErrorBoundary from '@/components/analysis/ErrorBoundary';
import NormGate from '@/components/analysis/modules/NormGate';

// ── Scatter + ellipse wrapper ─────────────────────────────────────────────────
function ScatterWithEllipses({
  data,
  uniqueGroups,
  groups,
  xDomain,
  yDomain,
  margin,
  CustomTooltip
}) {
  const [size, setSize] = React.useState({ width: 500, height: 300 });

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer
        width="100%"
        height={300}
        onResize={(w, h) => setSize({ width: w, height: h })}
      >
        <ScatterChart margin={margin}>
          <CartesianGrid {...rechartsGridStyle} />
          <XAxis type="number" dataKey="lv1" domain={xDomain} {...rechartsAxisStyle}>
            <Label value="LV1" offset={-10} position="insideBottom" />
          </XAxis>
          <YAxis type="number" dataKey="lv2" domain={yDomain} {...rechartsAxisStyle}>
            <Label value="LV2" angle={-90} position="insideLeft" />
          </YAxis>

          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={0} stroke="#ccc" strokeDasharray="4 2" />
          <ReferenceLine y={0} stroke="#ccc" strokeDasharray="4 2" />

          {uniqueGroups.length > 1 && (
            <EllipseLayer
              groups={groups}
              xDomain={xDomain}
              yDomain={yDomain}
              margin={margin}
              width={size.width}
              height={size.height}
            />
          )}

          <Scatter data={data}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={groupColorByName(entry.group, uniqueGroups)}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Ellipses ───────────────────────────────────────────────────────────────────
function EllipseLayer({ groups, xDomain, yDomain, margin, width, height }) {
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  return (
    <g transform={`translate(${margin.left},${margin.top})`}>
      {Object.entries(groups).map(([name, { points, color }]) => {
        if (points.length < 3) return null;

        const e = computeEllipse(points);
        if (!e) return null;

        const [xMin, xMax] = xDomain;
        const [yMin, yMax] = yDomain;

        const toX = (v) => ((v - xMin) / (xMax - xMin)) * plotW;
        const toY = (v) => plotH - ((v - yMin) / (yMax - yMin)) * plotH;

        const cx = toX(e.cx);
        const cy = toY(e.cy);
        const rx = e.rx * (plotW / (xMax - xMin));
        const ry = e.ry * (plotH / (yMax - yMin));

        return (
          <g key={name}>
            <ellipse
              cx={cx}
              cy={cy}
              rx={Math.max(2, rx)}
              ry={Math.max(2, ry)}
              transform={`rotate(${-e.angle}, ${cx}, ${cy})`}
              fill={color}
              fillOpacity={0.12}
              stroke={color}
              strokeWidth={0.8}
            />
            <text x={cx} y={cy - 10} fontSize={9} textAnchor="middle" fill={color}>
              {name} (n={points.length})
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ── MAIN PLOT ────────────────────────────────────────────────────────────────
function PLSDAScorePlot({ plsdaResult, sampleNames, labels }) {
  const uniqueGroups = [...new Set(labels || [])];

  const data = plsdaResult.scores.map((s, i) => ({
    ...s,
    label: sampleNames?.[i] || `S${i}`,
    group: labels?.[i] || 'all'
  }));

  const pad = (arr) => {
    const mn = Math.min(...arr),
      mx = Math.max(...arr);
    const r = (mx - mn) || 1;
    return [mn - r * 0.18, mx + r * 0.18];
  };

  const xDomain = pad(data.map((d) => d.lv1));
  const yDomain = pad(data.map((d) => d.lv2));

  const groups = useMemo(() => {
    const g = {};
    data.forEach((d) => {
      const color = groupColorByName(d.group, uniqueGroups);
      if (!g[d.group]) g[d.group] = { points: [], color };
      g[d.group].points.push({ x: d.lv1, y: d.lv2 });
    });
    return g;
  }, [data, uniqueGroups]);

 
