import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image, FileDown, Loader2 } from 'lucide-react';
import { exportFigurePNG, exportFigurePDF } from '@/lib/engine/figureExport.js';

export default function FigureExportButton({ elementId, filename }) {
  const [busy, setBusy] = useState(null); // 'png' | 'pdf' | null
  const [error, setError] = useState(null);

  const run = async (type) => {
    if (!elementId) {
      setError('Missing figure element ID');
      return;
    }

    if (busy) return; // prevent double triggers

    setBusy(type);
    setError(null);

    try {
      if (type === 'png') {
        await exportFigurePNG(elementId, filename);
      } else {
        await exportFigurePDF(elementId, filename);
      }
    } catch (err) {
      console.error('[FigureExport]', err);
      setError(err?.message || 'Export failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[10px] px-2"
          disabled={!!busy}
          onClick={() => run('png')}
        >
          {busy === 'png' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Image className="w-3 h-3 mr-1" />
          )}
          PNG
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[10px] px-2"
          disabled={!!busy}
          onClick={() => run('pdf')}
        >
          {busy === 'pdf' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <FileDown className="w-3 h-3 mr-1" />
          )}
          PDF
        </Button>
      </div>

      {error && (
        <p className="text-[10px] text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
