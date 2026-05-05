/**
 * APP SHELL — MetaboAnalyst-style layout
 * Left sidebar + top bar + main workspace
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Upload,
  FlaskConical,
  ScatterChart,
  Dna,
  Flame,
  LayoutGrid,
  TrendingUp,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: Upload, label: 'Upload Data', section: 'upload' },
  { icon: FlaskConical, label: 'Normalization', section: 'normalization' },
  { icon: ScatterChart, label: 'PCA Analysis', section: 'pca' },
  { icon: Dna, label: 'PLS-DA + VIP', section: 'plsda' },
  { icon: Flame, label: 'Volcano Plot', section: 'volcano' },
  { icon: LayoutGrid, label: 'Heatmap', section: 'heatmap' },
  { icon: TrendingUp, label: 'Pathway Analysis', section: 'pathway' },
  { icon: Dna, label: 'Interpretation', section: 'biology' },
  { icon: FileText, label: 'Report Export', section: 'report' },
];

function NavItem({ icon: Icon, label, active, collapsed, onClick }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${
        active
          ? 'bg-white/15 text-white font-medium'
          : 'text-white/60 hover:bg-white/10 hover:text-white/90'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {!collapsed && (
        <span className="truncate text-[13px]">{label}</span>
      )}
    </button>
  );
}

export default function AppShell({ children, activeSection, onSectionChange }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      {/* ── Left Sidebar ───────────────────────────────────────────── */}
      <aside
        className="flex flex-col shrink-0 transition-all duration-200"
        style={{
          width: collapsed ? 56 : 220,
          background: '#1e293b',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-3 py-4 border-b border-white/10 shrink-0">
          <div className="w-7 h-7 rounded-md bg-teal-500/20 flex items-center justify-center shrink-0">
            <Dna className="w-4 h-4 text-teal-400" />
          </div>

          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-white text-[13px] font-bold leading-tight truncate">
                MetaFlux
              </p>
              <p className="text-white/40 text-[10px] leading-tight truncate">
                Studio
              </p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.section}
              icon={item.icon}
              label={item.label}
              active={activeSection === item.section}
              collapsed={collapsed}
              onClick={() => onSectionChange(item.section)}
            />
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center justify-center p-3 border-t border-white/10 text-white/40 hover:text-white/80 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>

      {/* ── Main workspace ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc]">
        {children}
      </div>
    </div>
  );
}
