import React, { useState, useMemo, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table2, BarChart3 } from 'lucide-react';
import Header from '@/components/metaflux/Header';
import UploadPanel from '@/components/metaflux/UploadPanel';
import ResultsTable from '@/components/metaflux/ResultsTable';
import InterpretationPanel from '@/components/metaflux/InterpretationPanel';
import VisualizationDashboard from '@/components/metaflux/VisualizationDashboard';
import {
  parseData,
  processData,
  matchRules,
  inferMechanisms,
  analyzePathways,
  matchDisorders,
  generateSummary,
  generateReport
} from '@/lib/metaflux/engine';

export default function MetaFlux() {
  const [processed, setProcessed] = useState(null);
  const [scale, setScale] = useState('log2');
  const [options, setOptions] = useState({});
  const [activeTab, setActiveTab] = useState('results');

  const handleDataSubmit = useCallback((text, opts) => {
    const parsed = parseData(text);
    if (parsed.length === 0) return;
    const { processed: proc, scale: sc } = processData(parsed, opts);
    setProcessed(proc);
    setScale(sc);
    setOptions(opts);
    setActiveTab('results');
  }, []);

  // Compute all analysis results from processed data (memoized)
  const analysis = useMemo(() => {
    if (!processed) return null;
    const mechanisms = inferMechanisms(processed);
    const pathwayHits = analyzePathways(processed);
    const rules = matchRules(processed);
    const disorders = matchDisorders(processed);
    const summary = generateSummary(processed, mechanisms, pathwayHits, disorders);
    const reportText = generateReport(processed, summary, mechanisms, pathwayHits, rules, disorders);
    return { mechanisms, pathwayHits, rules, disorders, summary, reportText };
  }, [processed]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Upload */}
        <div className="w-72 min-w-[260px] max-w-[320px] border-r bg-card/50 p-4 overflow-y-auto hidden lg:block">
          <UploadPanel onDataSubmit={handleDataSubmit} />
        </div>

        {/* Center panel */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
          {/* Mobile upload (shown only on small screens) */}
          <div className="lg:hidden">
            <UploadPanel onDataSubmit={handleDataSubmit} />
          </div>

          {/* Tab switch */}
          <div className="flex items-center justify-between shrink-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-8">
                <TabsTrigger value="results" className="text-xs h-7 gap-1">
                  <Table2 className="w-3 h-3" />
                  Results
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="text-xs h-7 gap-1">
                  <BarChart3 className="w-3 h-3" />
                  Dashboard
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {processed && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {processed.length} metabolites · {scale} scale
              </span>
            )}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'results' ? (
              <ResultsTable data={processed} scale={scale} />
            ) : (
              <VisualizationDashboard
                data={processed}
                pathways={analysis?.pathwayHits}
                options={options}
              />
            )}
          </div>
        </div>

        {/* Right panel — Interpretation */}
        <div className="w-80 min-w-[280px] max-w-[380px] border-l bg-card/50 p-4 overflow-hidden hidden xl:flex xl:flex-col">
          <InterpretationPanel
            summary={analysis?.summary}
            mechanisms={analysis?.mechanisms}
            pathways={analysis?.pathwayHits}
            rules={analysis?.rules}
            disorders={analysis?.disorders}
            reportText={analysis?.reportText}
          />
        </div>
      </div>

      {/* Mobile interpretation (shown as tab on smaller screens) */}
      {analysis && (
        <div className="xl:hidden border-t bg-card/50 p-4 max-h-[40vh] overflow-y-auto">
          <InterpretationPanel
            summary={analysis?.summary}
            mechanisms={analysis?.mechanisms}
            pathways={analysis?.pathwayHits}
            rules={analysis?.rules}
            disorders={analysis?.disorders}
            reportText={analysis?.reportText}
          />
        </div>
      )}
    </div>
  );
}
