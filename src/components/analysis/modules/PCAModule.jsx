/**
 * PCA MODULE — Score plot with 95% confidence ellipses + loadings bar.
 */
import React, { useMemo, useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Label, Cell,
  BarChart, Bar
} from 'recharts';
import { useAnalysisStore } from '@/lib/store/analysisStore.js';
import { MVG, groupColorByName, rechartsAxisStyle, rechartsGridStyle } from '@/lib/engine/mvg';
import { computeEllipse } from '@/components/analysis/GroupEllipse';
import Panel from '@/components/analysis/Panel';
import ErrorBoundary from '@/components/analysis/ErrorBoundary';
import NormGate from '@/components/analysis/modules/NormGate';

// ── Scatter chart with ellipse overlay using a wrapper that tracks size ───────
function ScatterWithEllipses({ data, uniqueGroups, groups, xDomain, yDomain, margin, pcaResult, CustomTooltip }) {
  const [size, setSize] = React.useState({ width: 500, height: 300 });
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height={300} onResize={(w, h) => setSize({ width: w, height: h })}>
        <ScatterChart margin={margin}>
          <CartesianGrid {...rechartsGridStyle} />
          <XAxis type="number" dataKey="pc1" domain={xDomain} {...rechartsAxisStyle}>
            <Label value={`PC1 (${pcaResult.explainedVariance[0]}%)`} offset={-10} position="insideBottom"
              style={{ fontSize: MVG.axis.labelFontSize, fill: MVG.axis.labelColor, fontFamily: MVG.font.family }} />
          </XAxis>
          <YAxis type="number" dataKey="pc2" domain={yDomain} {...rechartsAxisStyle}>
            <Label value={`PC2 (${pcaResult.explainedVariance[1]}%)`} angle={-90} position="insideLeft"
              style={{ fontSize: MVG.axis.labelFontSize, fill: MVG.axis.labelColor, fontFamily: MVG.font.family }} />
          </YAxis>
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={0} stroke={MVG.axis.gridColor} strokeDasharray="4 2" />
          <ReferenceLine y={0} stroke={MVG.axis.gridColor} strokeDasharray="4 2" />
          {uniqueGroups.length > 1 && (
            <EllipseOverlay groups={groups} xDomain={xDomain} yDomain={yDomain}
              margin={margin} width={size.width} height={size.height} />
          )}
          <Scatter data={data}>
            {data.map((entry, i) => (
              <Cell key={i} fill={groupColorByName(entry.group, uniqueGroups)} fillOpacity={MVG.marker.opacity} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Confidence ellipse SVG overlay (rendered as Recharts customized layer) ────
function EllipseOverlay({ groups, xDomain, yDomain, margin, width, height }) {
  const plotW = width  - margin.left - margin.right;
  const plotH = height - margin.top  - margin.bottom;

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

        const cxPx = toX(e.cx);
        const cyPx = toY(e.cy);
        const rxPx = e.rx * (plotW / (xMax - xMin));
        const ryPx = e.ry * (plotH / (yMax - yMin));

        return (
          <g key={name}>
            <ellipse
              cx={cxPx} cy={cyPx}
              rx={Math.max(2, rxPx)} ry={Math.max(2, ryPx)}
              transform={`rotate(${-e.angle}, ${cxPx}, ${cyPx})`}
              fill={color} fillOpacity={0.12}
              stroke={color} strokeOpacity={0.5} strokeWidth={0.7}
            />
            <circle cx={cxPx} cy={cyPx} r={3} fill={color} fillOpacity={0.65} stroke="white" strokeWidth={0.8} />
            <text x={cxPx} y={cyPx - Math.max(4, ryPx) - 5}
              textAnchor="middle" fontSize={8}
              fontFamily="Arial, Helvetica, sans-serif" fill={color} fillOpacity={0.85}>
              {name} (n={points.length})
            </text>
          </g>
        );
      })}
    </g>
  );
}

function ScorePlot({ pcaResult, sampleNames, labels }) {
  const uniqueGroups = [...new Set(labels || [])];
  const data = pcaResult.scores.map((s, i) => ({
    ...s,
    label: sampleNames?.[i] || `S${i}`,
    group: labels?.[i] || 'all',
  }));

  // Compute dynamic axis domains with 15% padding
  const pc1Vals = data.map((d) => d.pc1);
  const pc2Vals = data.map((d) => d.pc2);
  const pad = (arr) => {
    const mn = Math.min(...arr), mx = Math.max(...arr);
    const r = (mx - mn) || 1;
    return [mn - r * 0.18, mx + r * 0.18];
  };
  const xDomain = pad(pc1Vals);
  const yDomain = pad(pc2Vals);

  // Build group point sets for ellipses
  const groups = useMemo(() => {
    const g = {};
    data.forEach((d) => {
      const color = groupColorByName(d.group, uniqueGroups);
      if (!g[d.group]) g[d.group] = { points: [], color };
      g[d.group].points.push({ x: d.pc1, y: d.pc2 });
    });
    return g;
  }, [data.length]);

  const margin = { top: 16, right: 20, bottom: 36, left: 24 };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border rounded-lg shadow px-3 py-2 text-xs">
        <p className="font-semibold">{d.label}</p>
        <p className="text-gray-500">PC1: <span className="font-mono">{Number(d.pc1).toFixed(3)}</span></p>
        <p className="text-gray-500">PC2: <span className="font-mono">{Number(d.pc2).toFixed(3)}</span></p>
        {d.group !== 'all' && <p className="text-gray-500">Group: {d.group}</p>}
      </div>
    );
  };

  return (
    <>
      {uniqueGroups.length > 1 && (
        <div className="flex gap-3 mb-2 flex-wrap">
          {uniqueGroups.map((g, i) => (
            <div key={g} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: MVG.colors.groups[i % MVG.colors.groups.length] }} />
              <span className="text-[11px] text-gray-600">{g}</span>
            </div>
          ))}
        </div>
      )}
      <ScatterWithEllipses
        data={data} uniqueGroups={uniqueGroups} groups={groups}
        xDomain={xDomain} yDomain={yDomain} margin={margin}
        pcaResult={pcaResult} CustomTooltip={CustomTooltip}
      />
    </>
  );
}

function LoadingsPlot({ loadings, metaboliteNames }) {
  if (!loadings?.length) return null;
  const data = loadings
    .map((l, i) => ({ ...l, name: metaboliteNames?.[i] || `M${i}`, mag: Math.sqrt(l.pc1 ** 2 + l.pc2 ** 2) }))
    .sort((a, b) => b.mag - a.mag)
    .slice(0, 20);

  const maxLabelLen = Math.max(...data.map((d) => d.name.length));
  const leftMargin  = Math.min(200, Math.max(100, maxLabelLen * 6));

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, data.length * 18 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: leftMargin }}>
        <CartesianGrid {...rechartsGridStyle} horizontal={false} />
        <XAxis type="number" {...rechartsAxisStyle} />
        <YAxis type="category" dataKey="name"
          tick={{ fontSize: 9, fontFamily: MVG.font.family, fill: MVG.font.color }}
          tickLine={false} axisLine={false} width={leftMargin - 4} />
        <Tooltip formatter={(v) => [v.toFixed(4), 'PC1 loading']} />
        <Bar dataKey="pc1" radius={[0, 3, 3, 0]}>
          {data.map((d, i) => (
            <Cell key={i}
              fill={d.pc1 >= 0 ? MVG.colors.up : MVG.colors.down}
              fillOpacity={0.75}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function PCAModule() {
  const analysis        = useAnalysisStore((s) => s.analysis);
  const sampleNames     = useAnalysisStore((s) => s.sampleNames);
  const metaboliteNames = useAnalysisStore((s) => s.metaboliteNames);
  const labels          = useAnalysisStore((s) => s.labels);

  return (
    <NormGate>
      <div className="p-4 space-y-4">
        <Panel title="PCA — Score Plot (95% CI)" exportId="fig-pca-scores" exportFilename="PCA_scores">
          <ErrorBoundary>
            {analysis?.pca?.scores?.length ? (
              <ScorePlot pcaResult={analysis.pca} sampleNames={sampleNames} labels={labels} />
            ) : (
              <p className="text-xs text-gray-400 py-8 text-center">Computing…</p>
            )}
          </ErrorBoundary>
        </Panel>

        <Panel title="PCA — Top 20 Loadings (PC1)" exportId="fig-pca-loadings" exportFilename="PCA_loadings">
          <ErrorBoundary>
            {analysis?.pca?.loadings?.length ? (
              <LoadingsPlot loadings={analysis.pca.loadings} metaboliteNames={metaboliteNames} />
            ) : (
              <p className="text-xs text-gray-400 py-8 text-center">No loadings</p>
            )}
          </ErrorBoundary>
        </Panel>

        {analysis?.pca && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-xs space-y-1.5">
            <p className="font-semibold text-gray-700">Explained Variance</p>
            {analysis.pca.explainedVariance.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-gray-500 w-8">PC{i + 1}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-2 rounded-full" style={{ width: `${v}%`, background: MVG.colors.groups[i % MVG.colors.groups.length] }} />
                </div>
                <span className="font-mono text-gray-600">{v}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </NormGate>
  );
}
