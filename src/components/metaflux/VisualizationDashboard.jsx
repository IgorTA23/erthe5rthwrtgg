import React from 'react';
import { Card } from '@/components/ui/card';
import VolcanoPlot from './VolcanoPlot';
import PathwayBarChart from './PathwayBarChart';

export default function VisualizationDashboard({ data, pathways, options }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Load data to see visualizations</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto space-y-4 pb-4">
      <Card className="p-4">
        <VolcanoPlot
          data={data}
          pThreshold={options?.pThreshold || 0.05}
          fcThreshold={options?.fcThreshold || 0}
        />
      </Card>
      <Card className="p-4">
        <PathwayBarChart pathways={pathways} />
      </Card>
    </div>
  );
}
