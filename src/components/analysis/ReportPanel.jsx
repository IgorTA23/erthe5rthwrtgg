import React, { useState, useMemo } from 'react';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnalysisStore } from '@/lib/store/analysisStore.js';
import { generateReportHTML, exportPDF } from '@/lib/engine/reportBuilder.js';
import NormGate from '@/components/analysis/modules/NormGate';

export default function ReportPanel() {
  const analysis        = useAnalysisStore((s) => s.analysis);
  const sampleNames     = useAnalysisStore((s) => s.sampleNames);
  const metaboliteNames = useAnalysisStore((s) => s.metaboliteNames);
  const labels          = useAnalysisStore((s) => s.labels);

  const reportText = analysis?.report ?? null;

  const handleHTML = () => {
    if (!reportText) return;
    const html = generateReportHTML(reportText);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metaflux_report_${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePDF = () => {
    if (!reportText) return;
    exportPDF(reportText);
  };

  return (
    <NormGate>
      <div className="p-6 max-w-3xl space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Report Export</h2>
          <p className="text-xs text-gray-500">Download the full analysis report as HTML or PDF.</p>
        </div>

        {!reportText ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 text-xs">
            Analysis report not yet available. Run a full analysis first.
          </div>
        ) : (
          <>
            <div className="flex gap-3">
              <Button size="sm" variant="outline" className="text-xs" onClick={handleHTML}>
                <FileText className="w-3 h-3 mr-1" />
                Export HTML
              </Button>
              <Button size="sm" className="text-xs bg-teal-600 hover:bg-teal-700 text-white" onClick={handlePDF}>
                <Download className="w-3 h-3 mr-1" />
                Export PDF
              </Button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <pre className="text-[10px] font-mono text-gray-600 whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
                {reportText}
              </pre>
            </div>
          </>
        )}
      </div>
    </NormGate>
  );
}
