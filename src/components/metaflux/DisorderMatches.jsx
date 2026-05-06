import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity } from 'lucide-react';

export default function DisorderMatches({ disorders }) {
  if (!disorders || disorders.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5 text-destructive" />
        Associated Metabolic States
      </h3>

      {disorders.map((d, i) => {
        const pct = (d.confidence * 100).toFixed(0);
        return (
          <div key={i} className="rounded-lg border p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold">{d.name}</span>
              <Badge
                variant="outline"
                className={`text-[9px] py-0 font-mono ${
                  d.confidence > 0.6 ? 'border-destructive/50 text-destructive' :
                  d.confidence > 0.3 ? 'border-amber-500/50 text-amber-600' :
                  ''
                }`}
              >
                {pct}% match
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{d.description}</p>
            <Progress value={d.confidence * 100} className="h-1" />
            <div className="flex flex-wrap gap-1">
              {d.evidence.map((e, j) => (
                <Badge key={j} variant="secondary" className="text-[9px] py-0 font-mono">{e}</Badge>
              ))}
            </div>
          </div>
        );
      })}

      <p className="text-[9px] text-muted-foreground italic">
        ⚠️ Pattern matching only — not a clinical diagnosis
      </p>
    </div>
  );
}
