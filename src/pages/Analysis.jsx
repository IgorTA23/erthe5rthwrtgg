import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CheckCircle2, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

import AppShell from '@/components/analysis/AppShell';
import ErrorBoundary from '@/components/analysis/ErrorBoundary';

import UploadNormalizeModule from '@/components/analysis/modules/UploadNormalizeModule';
import PCAModule from '@/components/analysis/modules/PCAModule';
import PLSDAVIPModule from '@/components/analysis/modules/PLSDAVIPModule';
import VolcanoModule from '@/components/analysis/modules/VolcanoModule';
import HeatmapModule from '@/components/analysis/modules/HeatmapModule';
import PathwayModule from '@/components/analysis/modules/PathwayModule';
import BiologyModule from '@/components/analysis/modules/BiologyModule';
import ReportPanel from '@/components/analysis/ReportPanel';

import { useAnalysisStore } from '@/lib/store/analysisStore.js';
import { runAnalysis } from '@/lib/engine/analysisEngine.js';

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportCSV(matrix, rowNames, colNames, filename, precision = 6) {
  if (!matrix?.length || !rowNames?.length || !colNames?.length) return false;

  const header = ['Sample', ...colNames].join(',');

  const rows = matrix.map((row, i) =>
    [rowNames[i], ...row.map(v =>
      v === null || v === undefined || isNaN(v) ? 'NA' : Number(v).toFixed(precision)
    )].join(',')
  );

  const blob = new Blob([header + '\n' + rows.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return true;
}

// ─── status ───────────────────────────────────────────────────────────────────

const STATUS_LABEL = {
  IDLE: { text: '○ IDLE', color: '#94a3b8', icon: null },
  LOADING_DATA: { text: '◌ LOADING…', color: '#f59e0b', icon: 'spinner' },
  PREPROCESSING: { text: '◌ NORMALIZING…', color: '#f59e0b', icon: 'spinner' },
  COMPUTING: { text: '◌ COMPUTING…', color: '#f59e0b', icon: 'spinner' },
  READY: { text: '● READY', color: '#10b981', icon: 'check' },
  ERROR: { text: '⚠ ERROR', color: '#ef4444', icon: 'error' },
};

// ─── TopBar ───────────────────────────────────────────────────────────────────

function TopBar({ onExport, onRefresh }) {
  const X_mv = useAnalysisStore(s => s.X_mv);
  const analysis = useAnalysisStore(s => s.analysis);
  const status = useAnalysisStore(s => s.status);
  const error = useAnalysisStore(s => s.error);

  const st = STATUS_LABEL[status] || STATUS_LABEL.IDLE;

  const exportDisabled = !X_mv || status === 'COMPUTING';

  return (
    <div className="h-12 border-b flex items-center px-5 bg-white">
      <div className="font-bold text-sm">MetaFlux Insight</div>

      <div className="ml-auto flex items-center gap-3">
        {error && (
          <div className="flex items-center gap-1 text-red-500 text-[10px]">
            <AlertCircle className="w-3 h-3" />
            {error}
          </div>
        )}

        <span className="text-[10px]" style={{ color: st.color }}>
          {st.text}
        </span>

        {analysis && (
          <Button size="sm" variant="ghost" onClick={onRefresh}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Recompute
          </Button>
        )}

        <Button size="sm" variant="outline" onClick={onExport} disabled={exportDisabled}>
          <Download className="w-3 h-3 mr-1" />
          Export
        </Button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Analysis() {
  const [activeSection, setActiveSection] = useState('upload');

  const X_mv = useAnalysisStore(s => s.X_mv);
  const X_stat = useAnalysisStore(s => s.X_stat);
  const sampleNames = useAnalysisStore(s => s.sampleNames);
  const metaboliteNames = useAnalysisStore(s => s.metaboliteNames);
  const labels = useAnalysisStore(s => s.labels);
  const datasetHash = useAnalysisStore(s => s.datasetHash);
  const status = useAnalysisStore(s => s.status);
  const testOpts = useAnalysisStore(s => s.testOpts);
  const prepOpts = useAnalysisStore(s => s.prepOpts);
  const analysis = useAnalysisStore(s => s.analysis);

  const setAnalysis = useAnalysisStore(s => s.setAnalysis);
  const setStatus = useAnalysisStore(s => s.setStatus);
  const setError = useAnalysisStore(s => s.setError);

  const hasData = !!(X_mv && sampleNames && metaboliteNames);

  // ─── analysis runner ───────────────────────────────────────────────────────

  const computeAnalysis = useCallback(async () => {
    if (!hasData) return;

    setStatus('COMPUTING');
    setError(null);

    const hash = datasetHash;

    try {
      const result = runAnalysis(X_mv, {
        X_stat,
        labels,
        metaboliteNames,
        sampleNames,
        testOpts,
        prepOpts,
      });

      if (hash === datasetHash) {
        setAnalysis(result, hash);
        setStatus('READY');
      }
    } catch (e) {
      setError(e.message || 'Analysis failed');
      setStatus('READY');
    }
  }, [hasData, X_mv, X_stat, labels, metaboliteNames, sampleNames, testOpts, prepOpts, datasetHash]);

  useEffect(() => {
    if (hasData) computeAnalysis();
  }, [datasetHash]);

  // ─── export ────────────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    if (!X_mv) return;

    exportCSV(
      X_mv,
      sampleNames,
      metaboliteNames,
      `X_norm_${Date.now()}.csv`
    );

    toast({ title: 'Exported X_norm' });
  }, [X_mv, sampleNames, metaboliteNames]);

  // ─── refresh ───────────────────────────────────────────────────────────────

  const handleRefresh = useCallback(() => {
    computeAnalysis();
    toast({ title: 'Recomputing...' });
  }, [computeAnalysis]);

  // ─── render ────────────────────────────────────────────────────────────────

  const renderModule = () => {
    if (!hasData && activeSection !== 'upload') {
      return (
        <div className="p-10 text-center text-gray-500">
          Upload data first
        </div>
      );
    }

    switch (activeSection) {
      case 'upload': return <UploadNormalizeModule />;
      case 'pca': return <PCAModule />;
      case 'plsda': return <PLSDAVIPModule />;
      case 'volcano': return <VolcanoModule />;
      case 'heatmap': return <HeatmapModule />;
      case 'pathway': return <PathwayModule />;
      case 'biology': return <BiologyModule />;
      case 'report': return <ReportPanel />;
      default: return <UploadNormalizeModule />;
    }
  };

  return (
    <AppShell activeSection={activeSection} onSectionChange={setActiveSection}>
      <TopBar onExport={handleExport} onRefresh={handleRefresh} />

      <div className="flex-1 overflow-y-auto">
        <ErrorBoundary>
          {renderModule()}
        </ErrorBoundary>
      </div>
    </AppShell>
  );
}
