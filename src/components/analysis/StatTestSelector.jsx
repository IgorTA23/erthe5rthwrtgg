/**
 * STAT TEST SELECTOR — volcano statistical regime controls
 */
import React from 'react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const TESTS = [
  { value: 'welch',         label: "Welch's t-test (unequal variance)" },
  { value: 'student',       label: "Student's t-test (equal variance)" },
  { value: 'nonparametric', label: 'Mann–Whitney U (non-parametric)' },
];

const FDR_METHODS = [
  { value: 'bh',    label: 'Benjamini–Hochberg (BH)' },
  { value: 'storey', label: 'Storey q-value' },
  { value: 'none',  label: 'None (raw p-values)' },
];

export default function StatTestSelector({ opts = {}, onChange }) {
  const set = (key, val) => onChange({ ...opts, [key]: val });

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
        Statistical Test Settings
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-[11px]">Test</Label>
          <Select value={opts.test || 'welch'} onValueChange={v => set('test', v)}>
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TESTS.map(t => (
                <SelectItem key={t.value} value={t.value} className="text-[11px]">{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[11px]">FDR Correction</Label>
          <Select value={opts.fdr || 'bh'} onValueChange={v => set('fdr', v)}>
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FDR_METHODS.map(f => (
                <SelectItem key={f.value} value={f.value} className="text-[11px]">{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-[9px] text-gray-400">
        Y-axis uses q-values when FDR correction is enabled, raw p-values otherwise.
      </p>
    </div>
  );
}
