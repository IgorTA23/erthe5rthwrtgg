import React, { useState, useMemo, useCallback } from 'react';
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
  Bar,
} from 'recharts';

import { MVG } from '@/lib/engine/mvg';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import ErrorBoundary from '@/components/analysis/ErrorBoundary';
import Panel from '@/components/analysis/Panel';
import VolcanoPanel from '@/components/analysis/VolcanoPanel';
import HeatmapChart from '@/components/analysis/HeatmapChart';
import {
  computeEnrichment,
  isInPathway,
  toggleInSet,
} from '@/lib/engine/enrichment.js';
import { resolveMetabolite } from '@/lib/engine/resolveMetabolite.js';

const PlotPlaceholder = ({ msg }) => (
  <div className="flex items-center justify-center h-32 text-xs text-gray-400">
    {msg}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Shared utils
// ─────────────────────────────────────────────────────────────
const normalize = (x) => (x || '').trim().toLowerCase();

function buildGroupColorMap(labels = []) {
  const groups = [...new Set(labels)];
  const map = {};

  groups.forEach((g, i) => {
    map[g] = MVG.colors.groups[i % MVG.colors.groups.length];
  });

  return map;
}

// ─────────────────────────────────────────────────────────────
// PCA PANEL
// ─────────────────────────────────────────────────────────────
function PCAScorePanel({ pcaResult, sampleNames, labels, groupColorMap }) {
  const explained = pcaResult?.explainedVariance || [];

  const data = useMemo(() => {
    if (!pcaResult?.scores?.length) return [];

    return pcaResult.scores.map((s, i) => ({
      pc1: s.pc1,
      pc2: s.pc2,
      label: sampleNames?.[i] || `S${i + 1}`,
      group: labels?.[i] || 'all',
    }));
  }, [pcaResult, sampleNames, labels]);

  const TooltipC = useCallback(({ active, payload }) => {
    if (!active || !payload?.length) return null;

    const d = payload[0].payload;

    return (
      <div className="bg-white border rounded px-3 py-2 text-xs shadow">
        <p className="font-semibold">{d.label}</p>
        <p>PC1: {d.pc1}</p>
        <p>PC2: {d.pc2}</p>
        <p>Group: {d.group}</p>
      </div>
    );
  }, []);

  if (!data.length) return <PlotPlaceholder msg="No PCA scores" />;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ScatterChart margin={{ top: 8, right: 16, bottom: 28, left: 16 }}>
        <CartesianGrid />
        <XAxis type="number" dataKey="pc1">
          <Label value={`PC1 (${explained?.[0] ?? 0}%)`} position="insideBottom" />
        </XAxis>

        <YAxis type="number" dataKey="pc2">
          <Label value={`PC2 (${explained?.[1] ?? 0}%)`} angle={-90} position="insideLeft" />
        </YAxis>

        <Tooltip content={<TooltipC />} />
        <ReferenceLine x={0} />
        <ReferenceLine y={0} />

        <Scatter data={data}>
          {data.map((d, i) => (
            <Cell key={i} fill={groupColorMap[d.group]} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────
// PLS-DA PANEL
// ─────────────────────────────────────────────────────────────
function PLSDAPanel({ plsdaResult, sampleNames, labels, groupColorMap }) {
  if (!plsdaResult?.scores?.length) return <PlotPlaceholder msg="No PLS-DA" />;

  const data = plsdaResult.scores.map((s, i) => ({
    lv1: s.lv1,
    lv2: s.lv2,
    label: sampleNames?.[i] || `S${i + 1}`,
    group: labels?.[i] || 'all',
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ScatterChart>
        <XAxis type="number" dataKey="lv1" />
        <YAxis type="number" dataKey="lv2" />

        <Scatter data={data}>
          {data.map((d, i) => (
            <Cell key={i} fill={groupColorMap[d.group]} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────
// VIP PANEL
// ─────────────────────────────────────────────────────────────
function VIPPanel({ vipList, selectedSet, setSelectedSet, selectedPathway }) {
  if (!vipList?.length) return <PlotPlaceholder msg="No VIP data" />;

  const data = vipList.slice(0, 15).map((v) => ({
    ...v,
    name: v.name,
    selected: selectedSet.includes(v.name),
    inPathway: selectedPathway ? isInPathway(v.name, selectedPathway) : false,
  }));

  return (
    <BarChart width={300} height={240} data={data} layout="vertical">
      <XAxis type="number" />
      <YAxis dataKey="name" type="category" width={100} />

      <Bar dataKey="vip">
        {data.map((d, i) => (
          <Cell
            key={i}
            fill={d.inPathway ? 'teal' : d.selected ? 'orange' : 'gray'}
          />
        ))}
      </Bar>
    </BarChart>
  );
}

// ─────────────────────────────────────────────────────────────
// ENRICHMENT
// ─────────────────────────────────────────────────────────────
function EnrichmentPanel({ selectedSet, selectedPathway, setSelectedPathway }) {
  const enrichment = useMemo(
    () => computeEnrichment(selectedSet.map(normalize)),
    [selectedSet]
  );

  if (!selectedSet.length) {
    return <PlotPlaceholder msg="Select metabolites" />;
  }

  return (
    <div className="text-xs">
      {enrichment.slice(0, 10).map((p) => (
        <div
          key={p.pathway}
          className="flex justify-between cursor-pointer"
          onClick={() =>
            setSelectedPathway(selectedPathway === p.pathway ? null : p.pathway)
          }
        >
          <span>{p.label}</span>
          <span>{p.count}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// METABOLITE INFO
// ─────────────────────────────────────────────────────────────
function MetaboliteInfo({ name }) {
  const meta = useMemo(() => resolveMetabolite(name), [name]);

  if (!name) return null;

  return (
    <div className="text-xs">
      <p className="font-semibold">{name}</p>
      <p>{meta?.category || 'Unknown'}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────
export default function InteractiveDashboard({
  pcaResult,
  plsdaResult,
  vipList,
  heatmap,
  volcanoData,
  sampleNames,
  labels,
}) {
  const [selectedSet, setSelectedSet] = useState([]);
  const [selectedPathway, setSelectedPathway] = useState(null);
  const [lastSelected, setLastSelected] = useState(null);

  const groupColorMap = useMemo(() => buildGroupColorMap(labels), [labels]);

  const handleSelect = (name) => {
    const n = normalize(name);

    setSelectedSet((prev) => {
      const exists = prev.map(normalize).includes(n);
      return exists
        ? prev.filter((x) => normalize(x) !== n)
        : [...prev, name];
    });

    setLastSelected(name);
  };

  if (!pcaResult) return <PlotPlaceholder msg="No analysis" />;

  return (
    <div className="space-y-4">
      {/* TOP GRID */}
      <div className="grid grid-cols-2 gap-4">
        <Panel title="PCA">
          <ErrorBoundary>
            <PCAScorePanel
              pcaResult={pcaResult}
              sampleNames={sampleNames}
              labels={labels}
              groupColorMap={groupColorMap}
            />
          </ErrorBoundary>
        </Panel>

        <Panel title="PLS-DA">
          <ErrorBoundary>
            <PLSDAPanel
              plsdaResult={plsdaResult}
              sampleNames={sampleNames}
              labels={labels}
              groupColorMap={groupColorMap}
            />
          </ErrorBoundary>
        </Panel>

        <Panel title="VIP">
          <ErrorBoundary>
            <VIPPanel
              vipList={vipList}
              selectedSet={selectedSet}
              setSelectedSet={setSelectedSet}
              selectedPathway={selectedPathway}
            />
          </ErrorBoundary>
        </Panel>

        <Panel title="Volcano">
          <ErrorBoundary>
            <VolcanoPanel volcanoData={volcanoData} />
          </ErrorBoundary>
        </Panel>
      </div>

      {/* BOTTOM */}
      <div className="grid grid-cols-2 gap-4">
        <Panel title="Enrichment">
          <ErrorBoundary>
            <EnrichmentPanel
              selectedSet={selectedSet}
              selectedPathway={selectedPathway}
              setSelectedPathway={setSelectedPathway}
            />
          </ErrorBoundary>
        </Panel>

        <Panel title="Metabolite Info">
          <ErrorBoundary>
            <MetaboliteInfo name={lastSelected} />
          </ErrorBoundary>
        </Panel>
      </div>

      {/* HEATMAP */}
      <Panel title="Heatmap">
        <ErrorBoundary>
          <HeatmapChart {...heatmap} />
        </ErrorBoundary>
      </Panel>
    </div>
  );
}
