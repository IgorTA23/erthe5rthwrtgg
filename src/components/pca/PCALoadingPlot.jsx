import React, { useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Label, Cell
} from 'recharts';
import { MVG, rechartsAxisStyle, rechartsGridStyle } from '@/lib/engine/mvg';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold mb-1">{d.name}</p>
      <p className="text-muted-foreground">PC1 loading: <span className="text-foreground font-mono">{d.pc1}</span></p>
      <p className="text-muted-foreground">PC2 loading: <span className="text-foreground font-mono">{d.pc2}</span></p>
    </div>
  );
};

function influenceColor(pc1, pc2) {
  const mag = Math.sqrt(pc1 ** 2 + pc2 ** 2);
  if (mag > 0.3) return MVG.colors.up;
  if (mag > 0.15) return MVG.colors.groups[2]; // purple
  return MVG.colors.down;
}

export default function PCALoadingPlot({ loadings, explainedVariance }) {
  const [showTop, setShowTop] = useState(true);

  if (!loadings?.length) return null;

  // sort by influence magnitude, optionally show only top 20
  const sorted = [...loadings].sort(
    (a, b) => Math.sqrt(b.pc1 ** 2 + b.pc2 ** 2) - Math.sqrt(a.pc1 ** 2 + a.pc2 ** 2)
  );
  const data = showTop ? sorted.slice(0, 20) : sorted;

  return (
    <div className="w-full" style={{ fontFamily: MVG.font.family, background: MVG.paper }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: MVG.font.color }}>
          Loading Plot — Metabolite Influence
        </h3>
        {loadings.length > 20 && (
          <button onClick={() => setShowTop((v) => !v)} className="text-[10px] underline underline-offset-2" style={{ color: MVG.colors.groups[0] }}>
            {showTop ? `Show all ${loadings.length}` : 'Show top 20'}
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
          <CartesianGrid {...rechartsGridStyle} />
          <XAxis type="number" dataKey="pc1" {...rechartsAxisStyle}>
            <Label value={`PC1 loading (${explainedVariance?.[0] ?? '?'}%)`} offset={-10} position="insideBottom"
              style={{ fontSize: MVG.axis.labelFontSize, fill: MVG.axis.labelColor, fontFamily: MVG.font.family }} />
          </XAxis>
          <YAxis type="number" dataKey="pc2" {...rechartsAxisStyle}>
            <Label value={`PC2 loading (${explainedVariance?.[1] ?? '?'}%)`} angle={-90} position="insideLeft"
              style={{ fontSize: MVG.axis.labelFontSize, fill: MVG.axis.labelColor, fontFamily: MVG.font.family }} />
          </YAxis>
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={0} stroke={MVG.axis.gridColor} strokeDasharray="4 2" />
          <ReferenceLine y={0} stroke={MVG.axis.gridColor} strokeDasharray="4 2" />
          <Scatter data={data} r={MVG.marker.size - 2}>
            {data.map((entry, i) => (
              <Cell key={i} fill={influenceColor(entry.pc1, entry.pc2)} fillOpacity={MVG.marker.opacity} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      {/* Top influencers table */}
      <div className="mt-4">
        <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-2 tracking-wider">
          Top metabolites by influence
        </p>
        <div className="grid grid-cols-2 gap-1">
          {sorted.slice(0, 8).map((m, i) => (
            <div key={i} className="flex items-center justify-between bg-muted/40 rounded px-2 py-1">
              <span className="text-[11px] font-medium truncate max-w-[120px]">{m.name}</span>
              <span className="text-[10px] font-mono text-muted-foreground ml-2">
                {Math.sqrt(m.pc1 ** 2 + m.pc2 ** 2).toFixed(3)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
