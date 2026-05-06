import React from 'react';
import { ArrowUp, ArrowDown, Minus, Brain, GitBranch, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function SummaryCards({ summary }) {
  if (!summary) return null;

  return (
    <div className="space-y-3">
      {/* Headline */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
        <p className="text-[10px] text-primary font-mono uppercase tracking-wider mb-1">Primary Signal</p>
        <p className="text-sm font-semibold">{summary.headline}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-2 text-center">
          <ArrowUp className="w-3.5 h-3.5 text-red-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-red-500">{summary.upCount}</p>
          <p className="text-[9px] text-muted-foreground">Upregulated</p>
        </Card>
        <Card className="p-2 text-center">
          <ArrowDown className="w-3.5 h-3.5 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-blue-500">{summary.downCount}</p>
          <p className="text-[9px] text-muted-foreground">Downregulated</p>
        </Card>
        <Card className="p-2 text-center">
          <Minus className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
          <p className="text-lg font-bold text-muted-foreground">{summary.nsCount}</p>
          <p className="text-[9px] text-muted-foreground">Non-significant</p>
        </Card>
      </div>

      {/* Quick insights */}
      <div className="space-y-2">
        {summary.topMechanism && (
          <div className="flex items-start gap-2 text-xs">
            <Brain className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
            <div>
              <span className="font-medium">{summary.topMechanism.name}</span>
              <span className="text-muted-foreground"> — {(summary.topMechanism.confidence * 100).toFixed(0)}% confidence</span>
            </div>
          </div>
        )}
        {summary.topPathway && (
          <div className="flex items-start gap-2 text-xs">
            <GitBranch className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <div>
              <span className="font-medium">{summary.topPathway.name}</span>
              <span className="text-muted-foreground"> {summary.topPathway.direction === 'up' ? '↑' : '↓'} (impact: {summary.topPathway.impact.toFixed(2)})</span>
            </div>
          </div>
        )}
        {summary.topDisorder && (
          <div className="flex items-start gap-2 text-xs">
            <Activity className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
            <div>
              <span className="font-medium">{summary.topDisorder.name}</span>
              <span className="text-muted-foreground"> — {(summary.topDisorder.confidence * 100).toFixed(0)}% match</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
