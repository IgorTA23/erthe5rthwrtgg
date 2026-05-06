import React, { useState, useRef } from 'react';
import { Upload, FileText, ClipboardPaste, Beaker, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { SAMPLE_DATA } from '@/lib/metaflux/engine';

export default function UploadPanel({ onDataSubmit }) {
  const [pasteText, setPasteText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [pThreshold, setPThreshold] = useState(0.05);
  const [fcThreshold, setFcThreshold] = useState(0);
  const [useFDR, setUseFDR] = useState(false);
  const [scaleMode, setScaleMode] = useState('auto');
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setPasteText(text);
      submitData(text);
    };
    reader.readAsText(file);
  };

  const submitData = (text) => {
    onDataSubmit(text || pasteText, {
      pThreshold,
      fcThreshold,
      useFDR,
      forceScale: scaleMode === 'auto' ? null : scaleMode
    });
  };

  const loadSample = () => {
    setPasteText(SAMPLE_DATA);
    onDataSubmit(SAMPLE_DATA, {
      pThreshold,
      fcThreshold,
      useFDR,
      forceScale: scaleMode === 'auto' ? null : scaleMode
    });
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" />
          Data Input
        </h2>
        <p className="text-[11px] text-muted-foreground">Upload CSV or paste your metabolomics table</p>
      </div>

      {/* File upload */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          variant="outline"
          className="w-full h-20 border-dashed flex flex-col gap-1"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileText className="w-5 h-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Click to upload CSV</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Separator className="flex-1" />
        <span className="text-[10px] text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      {/* Paste area */}
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1">
          <ClipboardPaste className="w-3 h-3" />
          Paste table
        </Label>
        <Textarea
          placeholder={`Metabolite,Fold Change,p-value\nGlucose,1.8,0.003\nLactate,2.4,0.001`}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          className="h-32 font-mono text-[11px] resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={() => submitData()}
          disabled={!pasteText.trim()}
          className="flex-1 text-xs"
          size="sm"
        >
          Analyze
        </Button>
        <Button
          variant="outline"
          onClick={loadSample}
          size="sm"
          className="text-xs"
        >
          <Beaker className="w-3 h-3 mr-1" />
          Sample
        </Button>
      </div>

      {/* Settings */}
      <div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          <span className="flex items-center gap-1">
            <Settings2 className="w-3 h-3" />
            Analysis Settings
          </span>
          {showSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showSettings && (
          <div className="space-y-4 pt-2 pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* p-value threshold */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-[11px]">p-value threshold</Label>
                <span className="text-[11px] font-mono text-primary">{pThreshold}</span>
              </div>
              <Slider
                value={[pThreshold]}
                onValueChange={([v]) => setPThreshold(v)}
                min={0.001}
                max={0.1}
                step={0.001}
              />
            </div>

            {/* FC threshold */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-[11px]">|log₂FC| threshold</Label>
                <span className="text-[11px] font-mono text-primary">{fcThreshold.toFixed(1)}</span>
              </div>
              <Slider
                value={[fcThreshold]}
                onValueChange={([v]) => setFcThreshold(v)}
                min={0}
                max={3}
                step={0.1}
              />
            </div>

            {/* FDR toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-[11px]">Use FDR correction</Label>
              <Switch checked={useFDR} onCheckedChange={setUseFDR} />
            </div>

            {/* Scale mode */}
            <div className="space-y-1">
              <Label className="text-[11px]">Fold change scale</Label>
              <Select value={scaleMode} onValueChange={setScaleMode}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value="log2">log₂</SelectItem>
                  <SelectItem value="linear">Linear</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-auto pt-4">
        <p className="text-[9px] text-muted-foreground leading-relaxed border-t pt-3">
          ⚠️ This is a computational interpretation tool for research purposes only. It does not constitute a clinical diagnosis.
        </p>
      </div>
    </div>
  );
}
