import React, { useMemo } from 'react';
import { GitBranch, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const SYSTEM_LABELS = {
  energy: 'Energy Metabolism',
  lipid: 'Lipid Metabolism',
  amino_acid: 'Amino Acid Metabolism',
  carbohydrate: 'Carbohydrate Metabolism',
  nucleotide: 'Nucleotide Metabolism',
  other: 'Other'
};

const SYSTEM_ORDER = ['energy', 'lipid', 'amino_acid', 'carbohydrate', 'nucleotide', 'other'];

export default function PathwayDashboard({ pathways }) {
  const grouped = useMemo(() => {
    if (!pathways || pathways.length === 0) return {};
    const groups = {};
    pathways.forEach(p => {
      const cat = p.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    // Sort within each group by |impact| * total
    Object.values(groups).forEach(arr =>
      arr.sort((a, b) => Math.abs(b.impact) * b.total - Math.abs(a.impact) * a.total)
    );
    return groups;
  }, [pathways]);

  if (!pathways || pathways.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold flex items-center gap-1.5">
        <GitBranch className="w-3.5 h-3.5 text-primary" />
        Pathway Impact
      </h3>

      {SYSTEM_ORDER.map(system => {
        const items = grouped[system];
        if (!items || items.length === 0) return null;

        return (
          <div key={system} className="space-y-1.5">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              {SYSTEM_LABELS[system] || system}
            </p>
            {items.map((p, i) => {
              const DirIcon = p.impact > 0 ? ArrowUp : p.impact < 0 ? ArrowDown : Minus;
              const dirColor = p.impact > 0 ? 'text-red-500' : p.impact < 0 ? 'text-blue-500' : 'text-muted-foreground';
              const barColor = p.impact > 0 ? 'bg-red-500' : 'bg-blue-500';
              const absImpact = Math.abs(p.impact);

              return (
                <div key={i} className="rounded-md border bg-card/50 p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <DirIcon className={`w-3 h-3 ${dirColor}`} />
                      <span className="text-[11px] font-medium">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {p.up}↑ {p.down}↓
                      </span>
                      <span className={`text-[10px] font-mono font-semibold ${dirColor}`}>
                        {p.impact > 0 ? '+' : ''}{p.impact.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Bipolar impact bar */}
                  <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-border z-10" />
                    {p.impact > 0 ? (
                      <div
                        className={`absolute inset-y-0 left-1/2 ${barColor} rounded-r-full transition-all duration-500`}
                        style={{ width: `${absImpact * 50}%` }}
                      />
                    ) : (
                      <div
                        className={`absolute inset-y-0 ${barColor} rounded-l-full transition-all duration-500`}
                        style={{ width: `${absImpact * 50}%`, right: '50%' }}
                      />
                    )}
                  </div>

                  {p.interpretation && (
                    <p className="text-[9px] text-muted-foreground leading-relaxed">{p.interpretation}</p>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
