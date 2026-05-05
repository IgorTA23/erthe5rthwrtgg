/**
 * UPLOAD + NORMALIZATION MODULE
 *
 * Two-phase workflow:
 *   1. Upload CSV → parse → store raw data
 *   2. Configure pipeline → preview live → APPLY to lock
 *
 * APPLY runs:
 *   X_stat = ISTD + transform (for volcano)
 *   X_mv   = ISTD + transform + scaling (for PCA/PLS-DA)
 */
import React, { useState, useMemo } from 'react';
import { CheckCircle2, RotateCcw, Lock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AnalysisUpload from '@/components/analysis/AnalysisUpload';
import NormalizationPipelinePanel from '@/components/analysis/NormalizationPipelinePanel';
import { useAnalysisStore } from '@/lib/store/analysisStore.js';
import { runPreprocessingPipeline } from '@/lib/engine/preprocessPipeline.js';
import { cleanMatrix } from '@/lib/engine/analysisEngine.js';

function parseInput({ text, hasGroupCol }) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 3) return null;
  const sep = lines[0].includes('\t') ? '\t' : ',';
  const header = lines[0].split(sep).map(h => h.trim().replace(/['"]/g, ''));
  const metStart = hasGroupCol ? 2 : 1;
  const metaboliteNames = header.slice(metStart);
  const sampleNames = [], labels = [], matrix = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map(c => c.trim().replace(/['"]/g, ''));
    if (cols.length < metStart + 1) continue;
    sampleNames.push(cols[0] || `S${i}`);
    if (hasGroupCol) labels.push(cols[1] || 'unknown');
    const row = cols.slice(metStart).map(Number);
    if (row.some(isNaN)) continue;
    matrix.push(row);
  }
  if (matrix.length < 2 || metaboliteNames.length < 2) return null;
  return {
    X_raw: cleanMatrix(matrix),
    sampleNames,
    metaboliteNames,
    labels: hasGroupCol && labels.length ? labels : null,
  };
}

export default function UploadNormalizeModule() {
  const X_raw           = useAnalysisStore(s => s.X_raw);
  const sampleNames     = useAnalysisStore(s => s.sampleNames);
  const metaboliteNames = useAnalysisStore(s => s.metaboliteNames);
  const labels          = useAnalysisStore(s => s.labels);
  const X_mv            = useAnalysisStore(s => s.X_mv);
  const prepOpts        = useAnalysisStore(s => s.prepOpts);
  const pipelineReady   = useAnalysisStore(s => s.pipelineReady);

  const setParsed      = useAnalysisStore(s => s.setParsed);
  const setProcessed   = useAnalysisStore(s => s.setProcessed);
  const setPrepOpts    = useAnalysisStore(s => s.setPrepOpts);
  const reset          = useAnalysisStore(s => s.reset);

  const [error, setError]         = useState(null);
  const [pendingOpts, setPendingOpts] = useState(null); // opts staged but not applied

  // Current opts = pending (if any) or committed
  const displayOpts = pendingOpts || prepOpts;

  const handleData = (inputData) => {
    const parsed = parseInput(inputData);
    if (!parsed) {
      setError('Could not parse. Expected: Sample, [Group], Met1, Met2…');
      return;
    }
    setError(null);
    setParsed(parsed);
    // Auto-apply default pipeline on first upload
    const { X_stat, X_mv } = runPreprocessingPipeline(parsed.X_raw, prepOpts);
    setProcessed({ X_stat, X_mv });
    setPendingOpts(null);
  };

  // Called when user changes opts in the panel — preview only, no commit
  const handleOptsChange = (opts) => {
    setPendingOpts({ ...displayOpts, ...opts });
  };

  // APPLY: commit opts and run full pipeline
  const handleApply = () => {
    const opts = displayOpts;
    setPrepOpts(opts);
    if (X_raw) {
      const { X_stat, X_mv } = runPreprocessingPipeline(X_raw, opts);
      setProcessed({ X_stat, X_mv });
    }
    setPendingOpts(null);
  };

  const hasPending = pendingOpts !== null;

  return (
    <div className="p-6 max-w-3xl space-y-6">

      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-1">Upload &amp; Normalize</h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          Upload your data, configure the preprocessing pipeline, preview the distribution, then click{' '}
          <strong>Apply Pipeline</strong> to lock and recompute all analyses.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {X_raw && (
        <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-lg px-4 py-2.5 text-xs text-teal-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">
            {sampleNames?.length} samples · {metaboliteNames?.length} metabolites
          </span>
          {labels && (
            <span className="text-teal-500">· {[...new Set(labels)].join(' / ')}</span>
          )}
          <button
            onClick={() => { reset(); setPendingOpts(null); }}
            className="ml-auto flex items-center gap-1 text-teal-500 hover:text-teal-700 underline"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      )}

      {/* Step 1 — Upload */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Step 1 — Upload Data
        </h3>
        <AnalysisUpload onData={handleData} />
      </div>

      {/* Step 2 — Pipeline config + preview */}
      {X_raw && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Step 2 — Preprocessing Pipeline
          </h3>

          <div className="text-[10px] text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 leading-relaxed">
            <strong>Pipeline separation:</strong> Transformation is applied before computing fold-change.
            Scaling (z-score, Pareto, etc.) is applied <em>only</em> to the PCA/PLS-DA matrix — never to volcano/fold-change data.
          </div>

          <NormalizationPipelinePanel
            X_raw={X_raw}
            metaboliteNames={metaboliteNames}
            currentOpts={displayOpts}
            onChange={handleOptsChange}
          />


          {/* Apply button */}
          <div className="flex items-center gap-3 pt-2 border-t">
            <Button
              onClick={handleApply}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs flex items-center gap-1.5"
            >
              <Play className="w-3 h-3" />
              Apply Pipeline &amp; Recompute
            </Button>
            {hasPending && (
              <span className="text-[10px] text-amber-600 font-medium">
                ⚠ Unsaved changes — click Apply to recompute
              </span>
            )}
            {!hasPending && pipelineReady && (
              <span className="text-[10px] text-teal-600">
                ✓ Pipeline applied
              </span>
            )}
          </div>
        </div>
      )}

      {pipelineReady && !hasPending && (
        <div className="flex items-center gap-2 bg-teal-600 text-white rounded-lg px-4 py-3 text-xs font-semibold">
          <Lock className="w-4 h-4" />
          Pipeline locked — navigate to any analysis module
        </div>
      )}

    </div>
  );
}
