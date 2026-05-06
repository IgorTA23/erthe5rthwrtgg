import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const TRANSFORM_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'log10', label: 'Log₁₀' },
  { value: 'log2', label: 'Log₂' },
  { value: 'sqrt', label: 'Square Root' },
  { value: 'cbrt', label: 'Cube Root' },
  { value: 'vst', label: 'VST (variance stabilizing)' },
];

const SCALE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'mean', label: 'Mean centering' },
  { value: 'auto', label: 'Auto (z-score)' },
  { value: 'pareto', label: 'Pareto (recommended)' },
  { value: 'range', label: 'Range scaling' },
];

export default function PreprocessingPanel({
  options,
  setOptions,
  metaboliteNames = []
}) {
  const set = (key, val) => setOptions({ ...options, [key]: val });

  const useISTD = options.useISTD ?? false;
  const istdColumn = options.istdColumn ?? '';

  return (
    <div className="space-y-3 border-t pt-3">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        Preprocessing
      </p>

      <div className="space-y-1">
        <Label className="text-[11px]">Transformation</Label>
        <Select value={options.transform || 'none'} onValueChange={(v) => set('transform', v)}>
          <SelectTrigger className="h-7 text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRANSFORM_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-[11px]">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-[11px]">Scaling</Label>
        <Select value={options.scale || 'none'} onValueChange={(v) => set('scale', v)}>
          <SelectTrigger className="h-7 text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCALE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-[11px]">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isnorm"
          checked={useISTD}
          onChange={(e) => set('useISTD', e.target.checked)}
          className="w-3.5 h-3.5 cursor-pointer"
        />
        <label htmlFor="isnorm" className="text-[11px] text-muted-foreground cursor-pointer">
          Internal standard normalization
        </label>
      </div>

      {useISTD && (
        <div className="space-y-1 pl-5">
          <Label className="text-[11px]">Internal Standard Column</Label>

          {metaboliteNames.length > 0 ? (
            <Select value={istdColumn} onValueChange={(v) => set('istdColumn', v)}>
              <SelectTrigger className="h-7 text-[11px]">
                <SelectValue placeholder="Select column…" />
              </SelectTrigger>
              <SelectContent>
                {metaboliteNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-[11px]">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <input
              type="text"
              placeholder="e.g. IS or Internal Standard"
              value={istdColumn}
              onChange={(e) => set('istdColumn', e.target.value)}
              className="h-7 w-full border border-input rounded px-2 text-[11px] bg-background"
            />
          )}

          {!istdColumn && (
            <p className="text-[10px] text-amber-600">
              Select the column to use as internal standard
            </p>
          )}
        </div>
      )}
    </div>
  );
}
