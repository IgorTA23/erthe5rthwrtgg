import React, { useRef, useState } from "react";
import { FileText, Upload, Beaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

const SAMPLE_CSV = `Sample,Group,Glucose,Lactate,Citrate,Pyruvate,Succinate,Fumarate,Malate,Glutamine,Leucine,Isoleucine,Valine,Carnitine,Palmitoylcarnitine,BHB,ATP,Glutathione,Ceramide,TMAO
S1,Disease,1.8,2.4,-1.2,0.7,-0.9,-1.1,-0.8,0.8,1.5,1.3,1.1,-1.6,-0.9,1.9,-1.8,-1.0,1.1,1.3
S2,Disease,2.1,2.7,-1.4,0.9,-1.1,-1.3,-1.0,0.6,1.8,1.5,1.3,-1.9,-1.1,2.1,-2.0,-1.2,1.3,1.5
S3,Disease,1.5,2.0,-0.9,0.5,-0.7,-0.8,-0.6,1.0,1.2,1.0,0.9,-1.3,-0.7,1.6,-1.5,-0.8,0.9,1.1
S4,Control,0.2,-0.3,0.8,-0.1,0.4,0.5,0.3,-0.2,-0.3,-0.2,-0.1,0.5,0.3,-0.4,0.3,0.6,-0.3,-0.2
S5,Control,-0.1,-0.5,1.0,-0.3,0.6,0.7,0.5,-0.4,-0.5,-0.4,-0.3,0.7,0.5,-0.6,0.5,0.8,-0.5,-0.4
S6,Control,0.4,-0.1,0.6,0.1,0.2,0.3,0.1,-0.1,-0.1,-0.1,0.1,0.3,0.1,-0.2,0.1,0.4,-0.1,-0.1`;

export default function AnalysisUpload({ onData }) {
  const [text, setText] = useState("");
  const [hasGroupCol, setHasGroupCol] = useState(true);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setText(ev.target.result);
    };
    reader.readAsText(file);
  };

  const loadSample = () => {
    setText(SAMPLE_CSV);
    setHasGroupCol(true);
  };

  const submit = () => {
    if (!text.trim()) return;
    onData({ text, hasGroupCol });
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.tsv,.txt"
        onChange={handleFile}
        className="hidden"
      />

      <Button
        variant="outline"
        className="w-full h-14 border-dashed flex flex-col gap-1"
        onClick={() => fileRef.current?.click()}
      >
        <FileText className="w-4 h-4 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground">
          Upload CSV / TSV matrix
        </span>
      </Button>

      <div className="flex items-center gap-2">
        <Separator className="flex-1" />
        <span className="text-[10px] text-muted-foreground">or paste</span>
        <Separator className="flex-1" />
      </div>

      <Textarea
        placeholder="Sample,Group,Met1,Met2,..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-36 font-mono text-[10px] resize-none"
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="grp"
          checked={hasGroupCol}
          onChange={(e) => setHasGroupCol(e.target.checked)}
          className="w-3.5 h-3.5"
        />
        <label
          htmlFor="grp"
          className="text-[11px] text-muted-foreground cursor-pointer"
        >
          2nd column contains group labels (for PLS-DA)
        </label>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 text-xs"
          disabled={!text.trim()}
          onClick={submit}
        >
          <Upload className="w-3 h-3 mr-1" />
          Analyze
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={loadSample}
        >
          <Beaker className="w-3 h-3 mr-1" />
          Sample
        </Button>
      </div>

      <div className="border-t pt-3 space-y-1">
        <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
          Expected format
        </p>
        <p className="text-[9px] text-muted-foreground">
          Row 1: headers (Sample, [Group], Met1, Met2…)
        </p>
        <p className="text-[9px] text-muted-foreground">
          Rows 2+: one sample per row, numeric values
        </p>
      </div>
    </div>
  );
}
