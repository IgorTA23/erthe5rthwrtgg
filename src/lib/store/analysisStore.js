/**
 * ANALYSIS PAGE — thin router only.
 * All state lives in Zustand store. Each module is fully self-contained.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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

// ─── CSV export utility ───────────────────────────────────────────────────────

function exportCSV(matrix, rowNames, colNames, filename, precision = 6) {
  if (!matrix?.length || !rowNames?.length || !colNames?.length) {
    console.warn('Cannot export: missing data');
    return false;
  }

  const header = ['Sample', ...colNames].join(',');
  const rows = matrix.map((row, i) =>
    [rowNames[i], ...row.map(v => {
      if (v === null || v === undefined || isNaN(v)) return 'NA';
      return v.toFixed(precision);
    })].join(',')
  );

  const blob = new Blob([[header, ...rows].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });

  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return true;
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

const STATUS_LABEL = {
  IDLE: { text: '○ IDLE', color: '#94a3b8' },
  LOADING_DATA: { text: '◌ LOADING…', color: '#f59e0b' },
  COMPUTING: { text: '◌ COMPUTING…', color: '#f59e0b' },
  READY: { text: '● READY', color: '#10b981' },
};

function TopBar({ onExport, onRefresh, hasData }) {
  const status = useAnalysisStore(s => s.status);
  const analysis = useAnalysisStore(s => s.analysis);
  const error = useAnalysisStore(s => s.error);
  
  const st = STATUS_LABEL[status] || STATUS_LABEL.IDLE;

  const steps = [
    { label: 'Upload', done: !!hasData, key: 'upload' },
    { label: 'Process', done: !!hasData, key: 'process' },
    { label: 'Analysis', done: !!analysis, key: 'analysis' },
  ];

  return (
    <div className="h-12 border-b border-gray-200 flex items-center px-5 bg-white shadow-sm">
      <div className="font-bold text-sm text-slate-800">MetaFlux Insight</div>

      <div className="flex items-center gap-3 ml-6">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-1.5">
            {i > 0 && <div className="w-4 h-px bg-gray-200" />}
            <CheckCircle2 className={`w-3 h-3 ${s.done ? 'text-teal-500' : 'text-gray-300'}`} />
            <span className={`text-[11px] ${s.done ? 'text-gray-700' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {error && (
          <div className="flex items-center gap-1 text-red-500 text-[10px]">
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </div>
        )}
        
        <span className="text-[10px] font-mono" style={{ color: st.color }}>
          {st.text}
        </span>

        {analysis && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 text-[10px]"
            onClick={onRefresh}
            disabled={status === 'COMPUTING'}
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${status === 'COMPUTING' ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}

        {hasData && (
          <Button 
            size="sm" 
            variant="outline" 
            className="h-6 text-[10px]"
            onClick={onExport}
            disabled={status === 'COMPUTING'}
          >
            <Download className="w-3 h-3 mr-1" /> Export
          </Button>
        )}

        <span className="text-[10px] text-gray-400 font-mono uppercase">
          Research Use Only
        </span>
      </div>
    </div>
  );
}

// ─── Loading component ────────────────────────────────────────────────────────

function LoadingSpinner({ message = 'Computing analysis…' }) {
  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto" />
        <p className="text-xs text-gray-500">{message}</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Analysis() {
  const [activeSection, setActiveSection] = useState('upload');
  const [localError, setLocalError] = useState(null);
  const computingRef = useRef(false);

  // Store selectors
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

  // Check if data is available
  const hasData = !!(X_mv && sampleNames && metaboliteNames);
  const isAnalysisTab = ['pca', 'plsda', 'volcano', 'heatmap', 'pathway', 'biology', 'report'].includes(activeSection);
  const isUploadTab = activeSection === 'upload' || activeSection === 'normalization';

  // Compute analysis function
  const computeAnalysis = useCallback(async () => {
    // Prevent concurrent computations
    if (computingRef.current) {
      console.log('[Analysis] Already computing, skipping');
      return;
    }

    if (!hasData) {
      console.log('[Analysis] No data available');
      return;
    }

    computingRef.current = true;
    setStatus('COMPUTING');
    setLocalError(null);

    console.log('[Analysis] Starting computation...');
    const hashAtStart = datasetHash;

    // Small delay to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const result = runAnalysis(X_mv, {
        X_stat,
        labels,
        metaboliteNames,
        sampleNames,
        testOpts,
        prepOpts,
      });

      // Check for error in result
      if (result.error) {
        throw new Error(result.error);
      }

      // Check if data hasn't changed during computation
      if (datasetHash === hashAtStart) {
        console.log('[Analysis] Setting analysis result');
        setAnalysis(result, hashAtStart);
        // Status will be set to READY by setAnalysis
      } else {
        console.log('[Analysis] Data changed during computation, discarding result');
      }
    } catch (err) {
      console.error('[Analysis] Failed:', err);
      setLocalError(err.message || 'Analysis failed');
      setStatus('READY');
      
      toast({
        title: 'Analysis Failed',
        description: err.message || 'An error occurred during analysis',
        variant: 'destructive',
      });
    } finally {
      computingRef.current = false;
    }
  }, [X_mv, X_stat, labels, metaboliteNames, sampleNames, testOpts, prepOpts, datasetHash, setAnalysis, setStatus, hasData]);

  // Trigger analysis when data is ready
  useEffect(() => {
    if (hasData && status === 'COMPUTING' && !computingRef.current) {
      console.log('[Analysis] Data ready, triggering computation');
      computeAnalysis();
    }
  }, [hasData, status, computeAnalysis]);

  // Auto-navigate when analysis is ready
  useEffect(() => {
    if (analysis && status === 'READY' && isUploadTab) {
      // Auto-navigate to first analysis tab
      setActiveSection('pca');
    }
  }, [analysis, status, isUploadTab]);

  // Export handler
  const handleExport = useCallback(() => {
    if (X_mv && sampleNames && metaboliteNames) {
      const success = exportCSV(X_mv, sampleNames, metaboliteNames, `X_norm_${new Date().toISOString().slice(0,19)}.csv`);
      if (success) {
        toast({
          title: 'Export Successful',
          description: 'Normalized data exported to CSV',
        });
      }
    }
  }, [X_mv, sampleNames, metaboliteNames]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    if (hasData) {
      setStatus('COMPUTING');
      toast({
        title: 'Recomputing Analysis',
        description: 'Refreshing all statistical results',
      });
    }
  }, [hasData, setStatus]);

  // Render appropriate content
  const renderModule = () => {
    // Show loading for analysis tabs while computing
    if (isAnalysisTab && status === 'COMPUTING') {
      return <LoadingSpinner message="Computing analysis..." />;
    }

    // Show placeholder for analysis tabs without data
    if (isAnalysisTab && !hasData) {
      return (
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-500">No data available</p>
            <p className="text-xs text-gray-400">Please upload and normalize data first</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setActiveSection('upload')}
            >
              Go to Upload
            </Button>
          </div>
        </div>
      );
    }

    // Render modules
    switch (activeSection) {
      case 'upload':
      case 'normalization':
        return <UploadNormalizeModule />;

      case 'pca':
        return <PCAModule />;

      case 'plsda':
        return <PLSDAVIPModule />;

      case 'volcano':
        return <VolcanoModule />;

      case 'heatmap':
        return <HeatmapModule />;

      case 'pathway':
        return <PathwayModule />;

      case 'biology':
        return <BiologyModule />;

      case 'report':
        return <ReportPanel />;

      default:
        return <UploadNormalizeModule />;
    }
  };

  return (
    <AppShell activeSection={activeSection} onSectionChange={setActiveSection}>
      <TopBar 
        onExport={handleExport} 
        onRefresh={handleRefresh}
        hasData={hasData}
      />
      <div className="flex-1 overflow-y-auto">
        <ErrorBoundary>
          {renderModule()}
        </ErrorBoundary>
      </div>
    </AppShell>
  );
}
