import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const severityConfig = {
  high: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
  moderate: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  low: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' }
};

export default function MechanismPanel({ mechanisms }) {
  if (!mechanisms || mechanisms.length === 0) return null;

  const primary = mechanisms[0];
  const rest = mechanisms.slice(1);

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold flex items-center gap-1.5">
        <Brain className="w-3.5 h-3.5 text-accent" />
        Biological Mechanisms
      </h3>

      {/* Primary mechanism */}
      <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-accent font-mono uppercase tracking-wider">Primary</span>
          <Badge variant="outline" className="text-[9px] py-0 font-mono">
            {(primary.confidence * 100).toFixed(0)}%
          </Badge>
        </div>
        <p className="text-xs font-semibold">{primary.name}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{primary.description}</p>
        <Progress value={primary.confidence * 100} className="h-1" />
        <div className="flex flex-wrap gap-1 pt-1">
          {primary.triggers.map((t, i) => (
            <Badge key={i} variant="secondary" className="text-[9px] py-0 font-mono">{t}</Badge>
          ))}
        </div>
      </div>

      {/* Other mechanisms */}
      {rest.map((mech, i) => {
        const sev = severityConfig[mech.severity] || severityConfig.low;
        const SevIcon = sev.icon;
        return (
          <div key={i} className="rounded-lg border p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <SevIcon className={`w-3 h-3 ${sev.color}`} />
                <span className="text-xs font-medium">{mech.name}</span>
              </div>
              <Badge variant="outline" className="text-[9px] py-0 font-mono">
                {(mech.confidence * 100).toFixed(0)}%
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{mech.description}</p>
            <Progress value={mech.confidence * 100} className="h-0.5" />
            <div className="flex flex-wrap gap-1">
              {mech.triggers.map((t, j) => (
                <Badge key={j} variant="secondary" className="text-[9px] py-0 font-mono">{t}</Badge>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
