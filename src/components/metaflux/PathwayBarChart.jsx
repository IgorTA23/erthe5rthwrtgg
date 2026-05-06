import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border rounded-lg p-2 shadow-lg text-xs">
      <p className="font-semibold">{d.name}</p>
      <p className="text-muted-foreground">Impact: {d.impact > 0 ? '+' : ''}{d.impact.toFixed(3)}</p>
      <p className="text-muted-foreground">{d.up}↑ {d.down}↓</p>
      {d.interpretation && <p className="text-muted-foreground mt-1 max-w-48">{d.interpretation}</p>}
    </div>
  );
};

export default function PathwayBarChart({ pathways }) {
  if (!pathways || pathways.length === 0) return null;

  const chartData = pathways.slice(0, 12).map(p => ({
    ...p,
    shortName: p.name.length > 18 ? p.name.substring(0, 16) + '…' : p.name
  }));

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold">Pathway Enrichment</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, bottom: 5, left: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number"
              domain={[-1, 1]}
              tick={{ fontSize: 9 }}
              label={{ value: 'Impact Score', position: 'bottom', offset: 0, style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }}
            />
            <YAxis
              type="category"
              dataKey="shortName"
              width={120}
              tick={{ fontSize: 9 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={0} stroke="hsl(var(--border))" />
            <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.impact > 0 ? 'hsl(0, 72%, 51%)' : 'hsl(220, 60%, 55%)'}
                  fillOpacity={0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
