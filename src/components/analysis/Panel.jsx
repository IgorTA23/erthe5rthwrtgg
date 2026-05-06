/**
 * PANEL — MetaboAnalyst-style white card with title bar
 */

import React from 'react';
import FigureExportButton from './FigureExportButton';

export default function Panel({
  title,
  children,
  exportId,
  exportFilename,
  fullWidth = false,
  className = ''
}) {
  return (
    <div
      className={className}
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
        gridColumn: fullWidth ? 'span 2' : undefined,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          borderBottom: '1px solid #f1f5f9',
          background: '#f8fafc',
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: 12,
            color: '#374151',
            fontFamily: 'Arial, sans-serif',
            letterSpacing: '0.02em'
          }}
        >
          {title}
        </span>

        {exportId && (
          <FigureExportButton
            elementId={exportId}
            filename={exportFilename || title}
          />
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 14 }} id={exportId}>
        {children}
      </div>
    </div>
  );
}
