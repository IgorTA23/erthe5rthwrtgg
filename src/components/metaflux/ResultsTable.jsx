import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle, Search } from 'lucide-react';

const directionConfig = {
  up: { icon: ArrowUpCircle, label: 'Up', className: 'text-red-500' },
  down: { icon: ArrowDownCircle, label: 'Down', className: 'text-blue-500' },
  ns: { icon: MinusCircle, label: 'NS', className: 'text-muted-foreground' }
};

export default function ResultsTable({ data, scale }) {
  const [search, setSearch] = useState('');
  const [filterDir, setFilterDir] = useState('all');
  const [filterClass, setFilterClass] = useState('all');

  const classes = useMemo(() => {
    if (!data) return [];
    const s = new Set(data.map(r => r.metaboliteClass).filter(c => c !== 'unknown'));
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter(row => {
      const matchSearch = !search || row.rawName.toLowerCase().includes(search.toLowerCase()) || row.normalizedName.includes(search.toLowerCase());
      const matchDir = filterDir === 'all' || row.direction === filterDir;
      const matchClass = filterClass === 'all' || row.metaboliteClass === filterClass;
      return matchSearch && matchDir && matchClass;
    });
  }, [data, search, filterDir, filterClass]);

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">No data loaded</p>
          <p className="text-xs text-muted-foreground">Upload a CSV or paste your data in the left panel</p>
        </div>
      </div>
    );
  }

  const upCount = data.filter(r => r.direction === 'up').length;
  const downCount = data.filter(r => r.direction === 'down').length;

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* Stats bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="text-[10px] font-mono">
          {data.length} metabolites · {scale} scale
        </Badge>
        <Badge className="bg-red-500/10 text-red-600 border-red-200 text-[10px]">
          ↑ {upCount} up
        </Badge>
        <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 text-[10px]">
          ↓ {downCount} down
        </Badge>
        <Badge variant="secondary" className="text-[10px]">
          — {data.length - upCount - downCount} NS
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search metabolites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
        <Select value={filterDir} onValueChange={setFilterDir}>
          <SelectTrigger className="w-24 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="up">↑ Up</SelectItem>
            <SelectItem value="down">↓ Down</SelectItem>
            <SelectItem value="ns">NS</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classes.map(c => (
              <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-[10px] font-semibold w-8"></TableHead>
              <TableHead className="text-[10px] font-semibold">Metabolite</TableHead>
              <TableHead className="text-[10px] font-semibold text-right">log₂FC</TableHead>
              <TableHead className="text-[10px] font-semibold text-right">p-value</TableHead>
              <TableHead className="text-[10px] font-semibold">Class</TableHead>
              <TableHead className="text-[10px] font-semibold">Pathways</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row, i) => {
              const config = directionConfig[row.direction];
              const Icon = config.icon;
              return (
                <TableRow
                  key={i}
                  className={row.direction === 'ns' ? 'opacity-40' : ''}
                >
                  <TableCell className="py-1.5 px-2">
                    <Icon className={`w-3.5 h-3.5 ${config.className}`} />
                  </TableCell>
                  <TableCell className="py-1.5">
                    <div className="text-xs font-medium">{row.rawName}</div>
                    {row.normalizedName !== row.rawName.toLowerCase() && (
                      <div className="text-[9px] text-muted-foreground font-mono">→ {row.normalizedName}</div>
                    )}
                  </TableCell>
                  <TableCell className={`py-1.5 text-right text-xs font-mono ${row.direction === 'up' ? 'text-red-500' : row.direction === 'down' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                    {row.log2fc > 0 ? '+' : ''}{row.log2fc.toFixed(3)}
                  </TableCell>
                  <TableCell className="py-1.5 text-right text-xs font-mono">
                    {row.effectiveP < 0.001 ? row.effectiveP.toExponential(1) : row.effectiveP.toFixed(4)}
                  </TableCell>
                  <TableCell className="py-1.5">
                    {row.metaboliteClass !== 'unknown' && (
                      <Badge variant="secondary" className="text-[9px] py-0">
                        {row.metaboliteClass.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-1.5">
                    <div className="flex gap-1 flex-wrap">
                      {row.pathways.slice(0, 2).map(p => (
                        <Badge key={p} variant="outline" className="text-[9px] py-0">
                          {p.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {row.pathways.length > 2 && (
                        <Badge variant="outline" className="text-[9px] py-0">+{row.pathways.length - 2}</Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <p className="text-[9px] text-muted-foreground text-center">
        Showing {filtered.length} of {data.length} metabolites
      </p>
    </div>
  );
}
