/**
 * BIOLOGY MODULE — Full MetaFlux Insight interpretation embedded in the pipeline.
 * Reads X_norm + metaboliteNames + labels from the global store,
 * runs the MetaFlux engine, and renders the same InterpretationPanel used in the
 * standalone MetaFlux page.
 */
import React, { useMemo } from 'react';
import { useAnalysisStore } from '@/lib/store/analysisStore.js';
import NormGate from '@/components/analysis/modules/NormGate';
import InterpretationPanel from '@/components/metaflux/InterpretationPanel';
import {
  inferMechanisms,
  analyzePathways,
  matchRules,
  matchDisorders,
  generateSummary,
  generateReport,
  normalizeName,
} from '@/lib/metaflux/engine';
import { resolveMetabolite } from '@/lib/engine/resolveMetabolite';

/**
 * Convert X_norm matrix + metaboliteNames into the flat array of metabolite
 * objects the MetaFlux engine expects (same shape as processData output).
 */
function buildMetafluxData(X_norm, metaboliteNames, labels) {
  if (!X_norm || !metaboliteNames) return [];

  const n = X_norm.length;
  const uniqueGroups = labels ? [...new Set(labels)] : [];
  const hasGroups = uniqueGroups.length >= 2;

  const idxA = hasGroups ? X_norm.map((_, i) => i).filter((i) => labels[i] === uniqueGroups[0]) : [];
  const idxB = hasGroups ? X_norm.map((_, i) => i).filter((i) => labels[i] === uniqueGroups[1]) : [];

  const mean = (indices, col) => {
    if (!indices.length) return 0;
    return indices.reduce((s, i) => s + (X_norm[i]?.[col] ?? 0), 0) / indices.length;
  };

  return metaboliteNames.map((name, col) => {
    const allVals = X_norm.map((row) => row[col] ?? 0);
    const avg = allVals.reduce((s, v) => s + v, 0) / n;

    const meanA = hasGroups ? mean(idxA, col) : avg;
    const meanB = hasGroups ? mean(idxB, col) : avg;
    const log2fc = meanB - meanA;
    // Use a simple threshold: |fc| > 0.3 counts as significant
    const direction = Math.abs(log2fc) > 0.3 ? (log2fc > 0 ? 'up' : 'down') : 'ns';

    const meta = resolveMetabolite(name) || null;

    return {
      rawName: name,
      normalizedName: normalizeName(name),
      foldChange: log2fc,
      log2fc,
      pValue: 0.01,        // placeholder — engine needs this for report formatting
      effectiveP: 0.01,
      direction,
      metaboliteClass: meta?.category || 'unknown',
      hmdbClass: meta?.hmdbClass || null,
      pathways: meta?.pathways || [],
      tags: meta?.tags || [],
      knownMetabolite: !!meta,
    };
  });
}

export default function BiologyModule() {
  const X_norm          = useAnalysisStore((s) => s.X_norm);
  const metaboliteNames = useAnalysisStore((s) => s.metaboliteNames);
  const labels          = useAnalysisStore((s) => s.labels);

  const metafluxData = useMemo(
    () => buildMetafluxData(X_norm, metaboliteNames, labels),
    [X_norm, metaboliteNames, labels]
  );

  const interpretation = useMemo(() => {
    if (!metafluxData.length) return null;
    const mechanisms  = inferMechanisms(metafluxData);
    const pathwayHits = analyzePathways(metafluxData);
    const rules       = matchRules(metafluxData);
    const disorders   = matchDisorders(metafluxData);
    const summary     = generateSummary(metafluxData, mechanisms, pathwayHits, disorders);
    const reportText  = generateReport(metafluxData, summary, mechanisms, pathwayHits, rules, disorders);
    return { mechanisms, pathwayHits, rules, disorders, summary, reportText };
  }, [metafluxData]);

  return (
    <NormGate>
      <div className="p-4 h-full flex flex-col" style={{ maxWidth: 640 }}>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">MetaFlux Insight — Biological Interpretation</h2>
        <div className="flex-1 overflow-hidden">
          <InterpretationPanel
            summary={interpretation?.summary}
            mechanisms={interpretation?.mechanisms}
            pathways={interpretation?.pathwayHits}
            rules={interpretation?.rules}
            disorders={interpretation?.disorders}
            reportText={interpretation?.reportText}
          />
        </div>
      </div>
    </NormGate>
  );
}
