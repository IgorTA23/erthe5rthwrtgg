import React from 'react';
import { Dna, FlaskConical, ScatterChart, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="h-14 border-b bg-card flex items-center px-6 gap-3 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Dna className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight tracking-tight">MetaFlux Insight</h1>
          <p className="text-[10px] text-muted-foreground leading-tight font-mono">Metabolomics Interpretation Engine</p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Link
          to="/pca"
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ScatterChart className="w-3.5 h-3.5" />
          PCA Explorer
        </Link>
        <Link
          to="/analysis"
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <Layers className="w-3.5 h-3.5" />
          Full Pipeline
        </Link>
        <div className="flex items-center gap-1.5">
          <FlaskConical className="w-4 h-4 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Research Use Only</span>
        </div>
      </div>
    </header>
  );
}
