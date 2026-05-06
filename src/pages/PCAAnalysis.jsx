import React, { useState, useMemo } from 'react';
import { Dna, AlertCircle, Info, Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import PCAUpload from '@/components/pca/PCAUpload';
import PCAScorePlot from '@/components/pca/PCAScorePlot';
import PCALoadingPlot from '@/components/pca/PCALoadingPlot';
import { runPCA, parsePCAMatrix } from '@/lib/engine/pca';

export default function PCAAnalysis() {
  const [rawText, setRawText] = useState(null);
  const [error, setError] = useState(null);

  const result = useMemo(() => {
    if (!rawText) return null;
    setError(null);
    const parsed = parsePCAMatrix(rawText);
    if (!parsed) {
      setError('Could not parse the data. Ensure rows = samples, cols = metabolites, first row = header, first col = sample ID.');
      return null;
    }
    const pca = runPCA(parsed.matrix, parsed.metaboliteNames, 2);
    if (!pca) {
      setError('PCA failed — need at least 2 samples and 2 metabolites.');
      return null;
    }
    return { ...pca, sampleNames: parsed.sampleNames, nSamples: parsed.matrix.length, nMets: parsed.metaboliteNames.length };
  }, [rawText]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="h-14 border-b bg-card flex items-center px-6 gap-3 shrink-0">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Dna className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight tracking-tight">MetaFlux Insight</h1>
            <p className="text-[10px] text-muted-foreground leading-tight font-mono">PCA Explorer</p>
          </div>
        </Link>
        <Separator orientation="vertical" className="h-6 mx-2" />
        <span className="text-xs text-muted-foreground">Principal Component Analysis</span>
        <div className="ml-auto text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          Research Use Only
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Upload */}
        <div className="w-72 min-w-[260px] max-w-[320px] border-r bg-card/50 p-4 overflow-y-auto hidden lg:block">
          <h2 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            Data Input
          </h2>
          <p className="text-[11px] text-muted-foreground mb-4">Upload a metabolomics matrix for PCA</p>
          <PCAUpload onData={setRawText} />
        </div>

        {/* Main — Results */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mobile upload */}
          <div className="lg:hidden">
            <Card className="p-4">
              <PCAUpload onData={setRawText} />
            </Card>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {!result && !error && (
            <div className="h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-3 max-w-sm">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Info className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium">Upload your metabolomics matrix</p>
                <p className="text-xs text-muted-foreground">
                  Provide a CSV where each row is a sample and each column is a metabolite.
                  PCA will reveal the major axes of variation.
                </p>
                <div className="text-left bg-muted/50 rounded-lg p-3 font-mono text-[10px] text-muted-foreground">
                  Sample,Met1,Met2,Met3<br />
                  S1,1.2,0.5,-0.8<br />
                  S2,-0.4,1.1,0.9<br />
                  ...
                </div>
              </div>
            </div>
          )}

          {result && (
            <>
              {/* Stats bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {result.nSamples} samples · {result.nMets} metabolites
                </Badge>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                  PC1: {result.explainedVariance[0]}% variance
                </Badge>
                <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px]">
                  PC2: {result.explainedVariance[1]}% variance
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  Total captured: {(result.explainedVariance[0] + result.explainedVariance[1]).toFixed(1)}%
                </Badge>
              </div>

              {/* Interpretation hint */}
              <div className="flex items-start gap-2 bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                <span>
                  <strong className="text-foreground">PC1</strong> captures the dominant metabolic shift.
                  Samples clustering together share similar profiles.
                  Outliers may indicate sample issues or distinct phenotypes.
                  Use the loading plot to identify which metabolites drive separation.
                </span>
              </div>

              {/* Plots */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="p-5">
                  <PCAScorePlot
                    scores={result.scores}
                    sampleNames={result.sampleNames}
                    explainedVariance={result.explainedVariance}
                  />
                </Card>
                <Card className="p-5">
                  <PCALoadingPlot
                    loadings={result.loadings}
                    explainedVariance={result.explainedVariance}
                  />
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
