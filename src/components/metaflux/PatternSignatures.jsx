import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap } from 'lucide-react';

export default function PatternSignatures({ rules }) {
  if (!rules || rules.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-yellow-500" />
        Pattern Signatures
      </h3>

      {rules.map((rule, i) => (
        <div key={i} className="rounded-lg border p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold">{rule.name}</span>
            <Badge variant="outline" className="text-[9px] py-0 font-mono">
              {(rule.confidence * 100).toFixed(0)}%
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">{rule.message}</p>
          <Progress value={rule.confidence * 100} className="h-0.5" />
          <div className="flex items-start gap-1 flex-wrap">
            <span className="text-[9px] text-muted-foreground">Triggered by:</span>
            {rule.triggers.map((t, j) => (
              <Badge key={j} variant="secondary" className="text-[9px] py-0 font-mono">{t}</Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
