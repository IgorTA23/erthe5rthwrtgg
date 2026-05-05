/**
 * HEATMAP MODULE — standalone, reads analysis from global store
 */
import React from 'react';
import { useAnalysisStore } from '@/lib/store/analysisStore.js';
import Panel from '@/components/analysis/Panel';
import HeatmapChart from '@/components/analysis/HeatmapChart';
import ErrorBoundary from '@/components/analysis/ErrorBoundary';
import NormGate from '@/components/analysis/modules/NormGate';

export default function HeatmapModule() {
  const analysis = useAnalysisStore((s) => s.analysis);
  const labels   = useAnalysisStore((s) => s.labels);
  const heatmap  = analysis?.heatmap;

  return (
    <NormGate>
      <div className="p-4">
        <Panel
          title={`Heatmap — Top ${heatmap?.metabolites?.length ?? 0} Variance Metabolites (z-score)`}
          exportId="fig-heatmap"
          exportFilename="Heatmap"
        >
          <ErrorBoundary>
            {heatmap?.cells?.length ? (
              <HeatmapChart
                cells={heatmap.cells}
                metabolites={heatmap.metabolites}
                samples={heatmap.samples}
                labels={labels}
              />
            ) : (
              <p className="text-xs text-gray-400 py-8 text-center">No heatmap data</p>
            )}
          </ErrorBoundary>
        </Panel>
      </div>
    </NormGate>
  );
}
