import React, { useRef, useState } from 'react';
import { Upload, FileText, Beaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

const SAMPLE_CSV = `Sample,Glucose,Lactate,Citrate,Pyruvate,Glutamine,Leucine,Carnitine,BHB,ATP,Ceramide
S1,1.2,2.1,-0.8,0.5,0.3,1.1,-0.4,0.9,-1.2,0.6
S2,1.5,1.8,-1.0,0.4,0.2,1.3,-0.5,1.1,-1.0,0.8
S3,-0.3,-0.2,1.1,-0.4,0.8,-0.6,0.9,-0.3,0.7,-0.4
S4,-0.5,-0.4,1.3,-0.5,1.0,-0.8,1.1,-0.2,0.9,-0.6
S5,0.9,1.5,-0.5,0.3,0.1,0.9,-0.3,0.7,-0.8,0.5
S6,-0.8,0.1,0.9,-0.6,1.2,-1.0,1.3,-0.1,1.1,-0.9
S7,1.1,1.9,-0.7,0.6,0.4,1.2,-0.2,1.0,-1.1,0.7
S8,-0.4,-0.3,1.2,-0.3,0.9,-0.7,1.0,-0.4,0.8,-0.5`;

export default function PCAUpload({ onData }) {
  const [text, setText] = useState('');
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setText(ev.target.result);
      onData(ev.target.result);
    };
    reader.readAsText(file);
  };

  const loadSample = () => {
    setText(SAMPLE_CSV);
    onData(SAMPLE_CSV);
  };

  return (
    <div className="space-y-4">
      <div>
        <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={handleFile} className="hidden" />
        <Button
          variant="outline"
          className="w-full h-16 border-dashed flex flex-col gap-1"
          onClick={() => fileRef.current?.click()}
        >
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Upload CSV (rows=samples, cols=metabolites)</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Separator className="flex-1" />
        <span className="text-[10px] text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <Textarea
        placeholder="Paste your data here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-40 font-mono text-[11px] resize-none"
      />

      <div className="flex gap-2">
        <Button size="sm" className="flex-1 text-xs" disabled={!text.trim()} onClick={() => onData(text)}>
          <Upload className="w-3 h-3 mr-1" /> Run PCA
        </Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={loadSample}>
          <Beaker className="w-3 h-3 mr-1" /> Sample
        </Button>
      </div>

      <p className="text-[9px] text-muted-foreground leading-relaxed border-t pt-3">
        Expected format: first row = header with metabolite names, first column = sample ID, remaining cells = numeric values.
      </p>
    </div>
  );
}
