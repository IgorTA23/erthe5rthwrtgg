import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { MVG } from '@/lib/engine/mvg';
import { selectBestPipeline, explainChoice } from '@/lib/engine/pipelineSelector';

// ─── Metric bar ───────────────────────────────────────────────────────────────
function MetricBar({ label, value, invert = false, max = 1, color }) {
  const pct = Math.min(100, (Math.abs(value) / max) * 100);
  const display = invert ? Math.min(100, (1 - Math.abs(value) / max) * 100) : pct;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${display}%`, background: color || MVG.colors.groups[0] }}
        />
      </div>
      <span className="text-[10px] font-mono w-12 text-right text-muted-foreground">
        {typeof value === 'number' ? value.toFixed(2) : value}
      </span>
    </div>
  );
}

// ─── Pipeline Row ─────────────────────────────────────────────────────────────
function PipelineRow({ result, rank, isBest, isSelected, onSelect }) {
  const skewMax = 3;
  const varMax = 200;

  return (
    <div
      className="rounded-lg border p-3 cursor-pointer transition-all"
      style={{
        borderColor: isBest ? MVG.colors.groups[0] : isSelected ? MVG.colors.groups[1] : undefined,
        background: isBest ? 'hsl(174 60% 97%)' : isSelected ? 'hsl(262 50% 97%)' : 'white',
      }}
      onClick={() => onSelect(result)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-mono">#{rank}</span>
          <span className="text-xs font-semibold" style={{ color: MVG.font.color }}>
            {result.name}
          </span>

          {isBest && (
            <Badge className="text-[9px] h-4 bg-primary/10 text-primary border-primary/20 gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Recommended
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-muted-foreground">
            score {result.score.toFixed(3)}
          </span>
          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-accent" />}
        </div>
      </div>

      <div className="space-y-1">
        <MetricBar label="Skew ↓" value={Math.abs(result.metrics.skew)} invert max={skewMax} color={MVG.colors.down} />
        <MetricBar label="Var bal ↓" value={result.metrics.varBal} invert max={varMax} color={MVG.colors.neutral} />
        <MetricBar label="PC1 var ↑" value={result.metrics.pcaVar} max={100} color={MVG.colors.groups[0]} />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PipelineSelector({ rawMatrix, labels, onApply }) {
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState(null);

  const ranked = useMemo(() => {
    if (!rawMatrix?.length) return [];
    return selectBestPipeline(rawMatrix, labels);
  }, [rawMatrix, labels]);

  const best = ranked[0];
  const displayed = showAll ? ranked : ranked.slice(0, 3);
  if (!ranked.length) return null;

  const current = selected || best;
  const reasons = explainChoice(current);

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
            Auto-Selected Pipeline
          </h3>
          <p className="text-sm font-bold" style={{ color: MVG.font.color }}>
            {current.name}
          </p>
        </div>

        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={() => onApply?.({ transform: current.transform, scale: current.scale })}
        >
          Apply
        </Button>
      </div>

      {/* Why panel */}
      <div className="bg-primary/5 border border-primary/10 rounded-lg px-3 py-2 space-y-1">
        <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1.5">
          Why this pipeline?
        </p>

        {reasons.map((r, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span className="text-[11px] text-muted-foreground">{r}</span>
          </div>
        ))}
      </div>

      {/* Ranked list */}
      <div className="space-y-2">
        {displayed.map((result, i) => (
          <PipelineRow
            key={result.name}
            result={result}
            rank={i + 1}
            isBest={result.name === best.name}
            isSelected={result.name === current.name && result.name !== best.name}
            onSelect={setSelected}
          />
        ))}
      </div>

      {ranked.length > 3 && (
        <button
          className="w-full text-[10px] text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors"
          onClick={() => setShowAll(v => !v)}
        >
          {showAll ? (
            <>
              <ChevronUp className="w-3 h-3" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" /> Show all {ranked.length}
            </>
          )}
        </button>
      )}

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Click any row to preview its reasoning, then press <strong>Apply</strong> to use it in the pipeline.
      </p>
    </Card>
  );
}
