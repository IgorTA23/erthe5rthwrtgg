/**
 * HEATMAP CHART — centered diverging RdBu scale, aggregation mode toggle, adaptive sizing.
 */
import React, { useMemo, useState } from 'react';
import { MVG } from '@/lib/engine/mvg';

// ── Diverging color scale ───────────────────────────────
function divergingColor(v, vmax) {
  const x = v / Math.max(vmax, 0.001);
  const t = Math.max(-1, Math.min(1, x));
  const s = Math.sign(t) * Math.pow(Math.abs(t), 0.75);

  const base = [250, 250, 252];
  const blue = [76, 114, 176];
  const red = [196, 78, 82];

  const mix = (a, b, k) =>
    `rgb(${(a[0] + (b[0] - a[0]) * k) | 0},${(a[1] + (b[1] - a[1]) * k) | 0},${(a[2] + (b[2] - a[2]) * k) | 0})`;

  if (s >= 0) return mix(base, red, s);
  return mix(base, blue, -s);
}

// ── Row-wise z-score ─────────────────────────────────────
function rowZScore(matrix) {
  return matrix.map((row) => {
    const n = row.length;
    const mu = row.reduce((s, v) => s + v, 0) / n;
    const sd = Math.sqrt(
      row.reduce((s, v) => s + (v - mu) ** 2, 0) / Math.max(n - 1, 1)
    );

    return sd === 0 ? row.map(() => 0) : row.map((v) => (v - mu) / sd);
  });
}

// ── Group means ──────────────────────────────────────────
function groupMeans(rawMatrix, sampleNames, labels) {
  if (!labels?.length) return { matrix: rawMatrix, colNames: sampleNames };

  const groups = [...new Set(labels)];

  const matrix = rawMatrix.map((row) =>
    groups.map((g) => {
      let sum = 0,
        count = 0;

      row.forEach((val, i) => {
        if (labels[i] === g) {
          sum += val;
          count++;
        }
      });

      return count ? sum / count : 0;
    })
  );

  return { matrix, colNames: groups };
}

export default function HeatmapChart({ cells, metabolites, samples, labels }) {
  const [mode, setMode] = useState('samples');

  const valueMap = useMemo(() => {
    const map = new Map();
    cells?.forEach((c) => {
      map.set(`${c.metabolite}__${c.sample}`, c.value ?? 0);
    });
    return map;
  }, [cells]);

  const rawMatrix = useMemo(() => {
    if (!cells?.length) return null;

    return metabolites.map((met) =>
      samples.map((s) => valueMap.get(`${met}__${s}`) ?? 0)
    );
  }, [metabolites, samples, valueMap]);

  const { displayMatrix, colNames } = useMemo(() => {
    if (!rawMatrix) return { displayMatrix: [], colNames: [] };

    if (mode === 'groups' && labels?.length) {
      const { matrix, colNames } = groupMeans(rawMatrix, samples, labels);
      return { displayMatrix: rowZScore(matrix), colNames };
    }

    return { displayMatrix: rowZScore(rawMatrix), colNames: samples };
  }, [rawMatrix, mode, labels, samples]);

  const vmax = useMemo(() => {
    if (!displayMatrix.length) return 1;

    const flat = displayMatrix.flat().map(Math.abs).sort((a, b) => a - b);
    const idx = Math.floor(flat.length * 0.95);

    return Math.max(0.1, flat[idx] || 1);
  }, [displayMatrix]);

  if (!cells?.length) return null;

  const numCols = colNames.length;
  const numRows = metabolites.length;

  const gridUnit = Math.max(18, Math.min(26, Math.floor(540 / numCols)));
  const cellW = gridUnit;
  const cellH = Math.max(16, Math.min(22, Math.floor(520 / Math.max(numRows, 10))));

  const labelW = Math.min(
    360,
    Math.max(160, Math.max(...metabolites.map((m) => m.length)) * 6.5)
  );

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `${labelW}px repeat(${numCols}, ${cellW}px)`,
    gridAutoRows: `${cellH}px`,
  };

  return (
    <div style={{ fontFamily: MVG.font.family, display: 'flex' }}>
      <div>
        <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
          <span className="font-medium text-gray-600">Aggregation:</span>

          {[
            { key: 'samples', label: 'Individual samples' },
            { key: 'groups', label: 'Group means', disabled: !labels?.length },
          ].map(({ key, label, disabled }) => (
            <button
              key={key}
              disabled={disabled}
              onClick={() => setMode(key)}
              className={`px-2.5 py-1 rounded border text-[11px] ${
                disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : mode === key
                  ? 'bg-slate-700 text-white border-slate-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-auto">
          <div style={{ display: 'inline-block', minWidth: 'max-content' }}>
            <div style={gridStyle}>
              <div />

              {colNames.map((s) => (
                <div
                  key={s}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    fontSize: 8.5,
                    whiteSpace: 'nowrap',
                    transform: 'rotate(-45deg)',
                    transformOrigin: 'left bottom',
                  }}
                >
                  {s}
                </div>
              ))}

              {metabolites.map((met, ri) => (
                <React.Fragment key={met}>
                  <div
                    style={{
                      fontSize: 8.5,
                      textAlign: 'right',
                      paddingRight: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                    }}
                  >
                    {met}
                  </div>

                  {colNames.map((_, ci) => {
                    const v = displayMatrix[ri]?.[ci] ?? 0;

                    return (
                      <div
                        key={ci}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          title={`${met}: ${v.toFixed(3)}`}
                          style={{
                            width: cellW - 2,
                            height: cellH - 2,
                            borderRadius: 2,
                            backgroundColor: divergingColor(v, vmax),
                          }}
                        />
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginLeft: 14,
          position: 'sticky',
          top: 120,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ fontSize: 10, color: '#666' }}>Z-score</div>

        <div
          style={{
            width: 12,
            height: 180,
            borderRadius: 6,
            background:
              'linear-gradient(to top, rgb(76,114,176), rgb(250,250,252), rgb(196,78,82))',
            border: '1px solid #eee',
          }}
        />

        <div
          style={{
            fontSize: 9,
            color: '#666',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 180,
          }}
        >
          <div>{(-vmax).toFixed(1)}</div>
          <div>0</div>
          <div>{vmax.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
}
