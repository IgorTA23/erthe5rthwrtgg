/**
 * PLS-DA + VIP MODULE — Score plot with confidence ellipses + enhanced VIP plot.
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

/* =========================
   SAFE NUMBER HELPER
========================= */
const safe = (v) => (Number.isFinite(v) ? v : 0);

// ── Scatter + ellipse wrapper ─────────────────────────────────────────────────
function ScatterWithEllipses({ data, uniqueGroups, groups, xDomain, yDomain, margin, CustomTooltip }) {
  const [size, setSize] = React.useState({ width: 500, height: 300 });

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={margin}>
          <CartesianGrid {...rechartsGridStyle} />

          <XAxis type="number" dataKey="lv1" domain={xDomain} {...rechartsAxisStyle}>
            <Label value="LV1" offset={-10} position="insideBottom"
              style={{ fontSize: MVG.axis.labelFontSize, fill: MVG.axis.labelColor, fontFamily: MVG.font.family }} />
          </XAxis>

          <YAxis type="number" dataKey="lv2" domain={yDomain} {...rechartsAxisStyle}>
            <Label value="LV2" angle={-90} position="insideLeft"
              style={{ fontSize: MVG.axis.labelFontSize, fill: MVG.axis.labelColor, fontFamily: MVG.font.family }} />
          </YAxis>

          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine x={0} stroke={MVG.axis.gridColor} strokeDasharray="4 2" />
          <ReferenceLine y={0} stroke={MVG.axis.gridColor} strokeDasharray="4 2" />

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
                fillOpacity={MVG.marker.opacity}
              />
            ))}
          </Scatter>

        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── FIXED: Ellipse layer (stable math) ─────────────────────────────────────────
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

        const cxPx = toX(e.cx);
        const cyPx = toY(e.cy);

        const rxPx = e.rx * (plotW / (xMax - xMin));
        const ryPx = e.ry * (plotH / (yMax - yMin));

        return (
          <g key={name}>
            <ellipse
              cx={cxPx}
              cy={cyPx}
              rx={Math.max(2, rxPx)}
              ry={Math.max(2, ryPx)}
              transform={`rotate(${-e.angle}, ${cxPx}, ${cyPx})`}
              fill={color}
              fillOpacity={0.13}
              stroke={color}
              strokeOpacity={0.6}
              strokeWidth={0.7}
              strokeDasharray="4 2"
            />
            <circle cx={cxPx} cy={cyPx} r={3} fill={color} fillOpacity={0.65} stroke="white" strokeWidth={0.8} />
            <text x={cxPx} y={cyPx - Math.max(4, ryPx) - 5}
              textAnchor="middle" fontSize={8}
              fontFamily="Arial, Helvetica, sans-serif"
              fill={color}
              fillOpacity={0.85}>
              {name} (n={points.length})
            </text>
          </g>
        );
      })}
    </g>
  );
}

/* =========================
   SCORE PLOT
========================= */
function PLSDAScorePlot({ plsdaResult, sampleNames, labels }) {

  const uniqueGroups = [...new Set(labels || [])];

  // FIX: safe numeric coercion
  const data = plsdaResult.scores.map((s, i) => ({
    ...s,
    lv1: safe(s.lv1),
    lv2: safe(s.lv2),
    label: sampleNames?.[i] || `S${i}`,
    group: labels?.[i] || 'all',
  }));

  const pad = (arr) => {
    const mn = Math.min(...arr);
    const mx = Math.max(...arr);
    const r = (mx - mn) || 1;
    return [mn - r * 0.18, mx + r * 0.18];
  };

  const xDomain = pad(data.map(d => d.lv1));
  const yDomain = pad(data.map(d => d.lv2));

  // FIX: proper memo dependency
  const groups = useMemo(() => {
    const g = {};
    data.forEach((d) => {
      const color = groupColorByName(d.group, uniqueGroups);
      if (!g[d.group]) g[d.group] = { points: [], color };

      g[d.group].points.push({
        x: d.lv1,
        y: d.lv2,
      });
    });
    return g;
  }, [data, uniqueGroups]);

  const margin = { top: 16, right: 20, bottom: 36, left: 24 };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;

    const d = payload[0].payload;

    return (
      <div className="bg-white border rounded-lg shadow px-3 py-2 text-xs">
        <p className="font-semibold">{d.label}</p>
        <p>LV1: <span className="font-mono">{Number(d.lv1).toFixed(3)}</span></p>
        <p>LV2: <span className="font-mono">{Number(d.lv2).toFixed(3)}</span></p>
        <p>Group: {d.group}</p>
      </div>
    );
  };

  return (
    <>
      <ScatterWithEllipses
        data={data}
        uniqueGroups={uniqueGroups}
        groups={groups}
        xDomain={xDomain}
        yDomain={yDomain}
        margin={margin}
        CustomTooltip={CustomTooltip}
      />
    </>
  );
}

/* =========================
   VIP (FIXED p FIELD SAFETY)
========================= */
function VIPPlot({ vipList, volcanoData }) {
  const [topN, setTopN] = useState(20);

  const sigNames = useMemo(() => {
    if (!volcanoData?.length) return new Set();

    return new Set(
      volcanoData
        .filter((d) => {
          const p = d.p ?? d.pval ?? d.effectiveP ?? 1;
          return p < 0.05 && Math.abs(d.log2fc ?? 0) > 0.5;
        })
        .map((d) => d.name)
    );
  }, [volcanoData]);

  const displaySet = useMemo(() => {
    const topSlice = vipList.slice(0, topN);
    const topNames = new Set(topSlice.map(v => v.name));

    const extra = vipList.filter(v =>
      sigNames.has(v.name) && !topNames.has(v.name)
    );

    return [...topSlice, ...extra].sort((a, b) => b.vip - a.vip);
  }, [vipList, topN, sigNames]);

  const leftMargin = Math.min(220, Math.max(120, 10));
  const barH = Math.max(420, displaySet.length * 22 + 40);

  const vipColor = (v, name) => {
    if (v.vip >= 1 && sigNames.has(name)) return MVG.colors.up;
    if (v.vip >= 1) return '#DD8452';
    return MVG.colors.neutral;
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={barH}>
        <BarChart data={displaySet} layout="vertical"
          margin={{ top: 4, right: 48, bottom: 4, left: leftMargin }}>

          <CartesianGrid {...rechartsGridStyle} horizontal={false} />

          <XAxis type="number" />
          <YAxis type="category" dataKey="name" />

          <Bar dataKey="vip">
            {displaySet.map((entry, i) => (
              <Cell key={i} fill={vipColor(entry, entry.name)} />
            ))}
          </Bar>

        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* =========================
   MODULE EXPORT
========================= */
export default function PLSDAVIPModule() {
  const analysis = useAnalysisStore(s => s.analysis);
  const sampleNames = useAnalysisStore(s => s.sampleNames);
  const labels = useAnalysisStore(s => s.labels);

  const plsdaResult = analysis?.plsda;
  const vipList = analysis?.vip ?? [];
  const volcanoData = analysis?.volcano ?? [];

  if (!labels || [...new Set(labels)].length < 2) {
    return (
      <NormGate>
        <div className="p-4 text-sm">Group labels required</div>
      </NormGate>
    );
  }

  return (
    <NormGate>
      <Panel title="PLS-DA + VIP">
        <ErrorBoundary>
          {plsdaResult?.scores?.length && (
            <PLSDAScorePlot
              plsdaResult={plsdaResult}
              sampleNames={sampleNames}
              labels={labels}
            />
          )}

          {vipList.length > 0 && (
            <VIPPlot vipList={vipList} volcanoData={volcanoData} />
          )}
        </ErrorBoundary>
      </Panel>
    </NormGate>
  );
}
