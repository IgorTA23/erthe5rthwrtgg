/**
 * NORM GATE — guards all analysis modules.
 * Shows a redirect prompt if X_norm is not ready.
 */
import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnalysisStore } from '@/lib/store/analysisStore.js';

export default function NormGate({ children, onGoUpload }) {
  const X_norm = useAnalysisStore((s) => s.X_mv ?? s.X_norm);

  if (!X_norm) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700">Normalized data required</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Complete the Upload &amp; Normalization step first. Your data will persist globally — no need to re-upload between modules.
          </p>
          {onGoUpload && (
            <Button size="sm" onClick={onGoUpload} className="bg-teal-600 hover:bg-teal-700 text-white">
              Go to Upload
            </Button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
