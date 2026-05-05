/**
 * VOLCANO MODULE — user-driven statistical regime + FDR control.
 * Uses X_stat (no scaling) for valid fold-change computation.
 */
import React from 'react';
import { useAnalysisStore } from '@/lib/store/analysisStore.js';
import Panel from '@/components/analysis/Panel';
import VolcanoPanel from '@/components/analysis/VolcanoPanel';
import StatTestSelector from '@/components/analysis/StatTestSelector';
import ErrorBoundary from '@/components/analysis/ErrorBoundary';
import NormGate from '@/components/analysis/modules/NormGate';

export default function VolcanoModule() {
  const analysis    = useAnalysisStore(s => s.analysis);
  const labels      = useAnalysisStore(s => s.labels);
  const testOpts    = useAnalysisStore(s => s.testOpts);
  const setTestOpts = useAnalysisStore(s => s.setTestOpts);
  const status      = useAnalysisStore(s => s.status);

  const volcanoData = analysis?.volcano ?? [];
  const useQ = testOpts?.fdr && testOpts.fdr !== 'none';

  const upCount   = volcanoData.filter(d => (useQ ? d.q : d.p) < 0.05 && (d.log2fc ?? 0) >  1).length;
  const downCount = volcanoData.filter(d => (useQ ? d.q : d.p) < 0.05 && (d.log2fc ?? 0) < -1).length;

  return (
    <NormGate>
      <div className="p-4 space-y-4">

        {!labels || [...new Set(labels)].length < 2 ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 text-xs">
            Volcano plot requires group labels. Add a Group column to your CSV.
          </div>
        ) : (
          <div className="flex gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-xs text-center">
              <p className="font-bold text-red-600 text-base">{upCount}</p>
              <p className="text-red-500">Up-regulated</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-xs text-center">
              <p className="font-bold text-blue-600 text-base">{downCount}</p>
              <p className="text-blue-500">Down-regulated</p>
            </div>
          </div>
        )}

        {/* Statistical test configuration */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <StatTestSelector opts={testOpts} onChange={setTestOpts} />
          {status === 'COMPUTING' && (
            <div className="flex items-center gap-2 mt-3 text-[11px] text-teal-600">
              <div className="w-3 h-3 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
              Recomputing…
            </div>
          )}
        </div>

        <Panel
          title={`Volcano Plot — log₂FC vs −log₁₀(${useQ ? 'q' : 'p'})`}
          exportId="fig-volcano"
          exportFilename="Volcano_plot"
        >
          <ErrorBoundary>
            <VolcanoPanel volcanoData={volcanoData} testOpts={testOpts} />
          </ErrorBoundary>
        </Panel>

      </div>
    </NormGate>
  );
}
