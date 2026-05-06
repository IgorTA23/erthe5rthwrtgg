import React from 'react';
import { Download, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import SummaryCards from './SummaryCards';
import MechanismPanel from './MechanismPanel';
import PathwayDashboard from './PathwayDashboard';
import PatternSignatures from './PatternSignatures';
import DisorderMatches from './DisorderMatches';

export default function InterpretationPanel({ summary, mechanisms, pathways, rules, disorders, reportText }) {
  const handleDownload = () => {
    if (!reportText) return;
    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metaflux_report_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!summary) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <ScrollText className="w-8 h-8 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Insights will appear here</p>
          <p className="text-xs text-muted-foreground">after data is analyzed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between pb-2 shrink-0">
        <h2 className="text-sm font-semibold">Interpretation</h2>
        <Button variant="outline" size="sm" onClick={handleDownload} className="text-[10px] h-7">
          <Download className="w-3 h-3 mr-1" />
          Report
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-5 pr-3 pb-8">
          <SummaryCards summary={summary} />
          <Separator />
          <MechanismPanel mechanisms={mechanisms} />
          <Separator />
          <PathwayDashboard pathways={pathways} />
          <Separator />
          <PatternSignatures rules={rules} />
          <Separator />
          <DisorderMatches disorders={disorders} />
        </div>
      </ScrollArea>
    </div>
  );
}
