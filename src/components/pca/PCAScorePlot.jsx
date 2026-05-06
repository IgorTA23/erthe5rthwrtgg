import React from 'react';
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
      <p className="font-semibold mb-1">{d.label || `Sample ${d.sample}`}</p>
      <p className="text-muted-foreground">PC1: <span className="text-foreground font-mono">{d.pc1}</span></p>
      <p className="text-muted-foreground">PC2: <span className="text-foreground font-mono">{d.pc2}</span></p>
    </div>
  );
};

export default function PCAScorePlot({ scores, sampleNames, explainedVariance }) {
  if (!scores?.length) return null;

  const data = scores.map((s, i) => ({
    ...s,
    label: sampleNames?.[i] || `S${s.sample}`,
  }));

  return (
    <div className="w-full" style={{ fontFamily: MVG.font.family, background: MVG.paper }}>
      <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: MVG.font.color }}>
        Score Plot — Sample Distribution
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
          <CartesianGrid {...rechartsGridStyle} />
          <XAxis type="number" dataKey="pc1" {...rechartsAxisStyle}>
            <Label value={`PC1 (${explainedVariance?.[0] ?? '?'}% variance)`} offset={-10} position="insideBottom"
              style={{ fontSize: MVG.axis.labelFontSize, fill: MVG.axis.labelColor, fontFamily: MVG.font.family }} />
          </XAxis>
          <YAxis type="number" dataKey="pc2" {...rechartsAxisStyle}>
            <Label value={`PC2 (${explainedVariance?.[1] ?? '?'}% variance)`} angle={-90} position="insideLeft"
              style={{ fontSize: MVG.axis.labelFontSize, fill: MVG.axis.labelColor, fontFamily: MVG.font.family }} />
          </YAxis>
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={0} stroke={MVG.axis.gridColor} strokeDasharray="4 2" />
          <ReferenceLine y={0} stroke={MVG.axis.gridColor} strokeDasharray="4 2" />
          <Scatter data={data} r={MVG.marker.size} fillOpacity={MVG.marker.opacity}>
            {data.map((_, i) => (
              <Cell key={i} fill={MVG.colors.groups[0]} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
