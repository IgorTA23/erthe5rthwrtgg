/**
 * PATHWAY ENRICHMENT MODULE — reads global store
 */
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAnalysisStore } from '@/lib/store/analysisStore.js';
import { computeEnrichment } from '@/lib/engine/enrichment.js';
import { MVG, rechartsAxisStyle, rechartsGridStyle } from '@/lib/engine/mvg';
import Panel from '@/components/analysis/Panel';
import { Badge } from '@/components/ui/badge';
import NormGate from '@/components/analysis/modules/NormGate';

export default function PathwayModule() {
  const analysis = useAnalysisStore((s) => s.analysis);
  const vipList  = analysis?.vip ?? [];

  // Use VIP ≥ 1 as the default selected metabolite set
  const [selectedSet] = useState(() => vipList.filter((v) => v.vip >= 1).map((v) => v.name));
  const [active, setActive] = useState(null);

  const enrichment = useMemo(() => computeEnrichment(selectedSet), [selectedSet.join(',')]);
  const top = enrichment.slice(0, 15);

  return (
    <NormGate>
      <div className="p-4 space-y-4">
        {selectedSet.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 text-xs">
            No discriminant metabolites (VIP ≥ 1) detected. Add group labels and run PLS-DA to populate pathway enrichment.
          </div>
        )}

        <Panel title="Pathway Enrichment — VIP ≥ 1 Metabolites" exportId="fig-pathway" exportFilename="Pathway_enrichment">
          {top.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center">No enriched pathways</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.min(400, top.length * 26 + 40)}>
              <BarChart data={top} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 140 }}
                onClick={(e) => e?.activePayload?.[0] && setActive(e.activePayload[0].payload.pathway)}>
                <CartesianGrid {...rechartsGridStyle} horizontal={false} />
                <XAxis type="number" {...rechartsAxisStyle} label={{ value: 'Feature count', position: 'insideBottom', offset: -8, style: { fontSize: 10 } }} />
                <YAxis type="category" dataKey="label"
                  tick={{ fontSize: 10, fontFamily: MVG.font.family, fill: MVG.font.color }}
                  tickLine={false} axisLine={false} width={135} />
                <Tooltip formatter={(v, n, p) => [v, 'Features']} labelFormatter={(l) => l} contentStyle={{ fontSize: 10 }} />
                <Bar dataKey="count" radius={[0, 3, 3, 0]} style={{ cursor: 'pointer' }}>
                  {top.map((entry, i) => (
                    <Cell key={i}
                      fill={entry.pathway === active ? MVG.colors.up : MVG.colors.groups[0]}
                      fillOpacity={MVG.marker.opacity}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        {selectedSet.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Metabolites used</p>
            <div className="flex flex-wrap gap-1">
              {selectedSet.map((m) => (
                <Badge key={m} variant="secondary" className="text-[9px] h-4">{m}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </NormGate>
  );
}
