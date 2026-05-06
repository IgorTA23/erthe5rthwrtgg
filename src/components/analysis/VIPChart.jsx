import React, { useMemo, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { MVG } from '@/lib/engine/mvg';

const MIN_FC_RANGE = 2.5;

/* =========================
   HELPERS
========================= */

// clean percentile function
function percentile(arr, p) {
  const clean = arr.filter(v => Number.isFinite(v)).sort((a, b) => a - b);
  if (!clean.length) return 0;

  const pos = (clean.length - 1) * p;
  const base = Math.floor(pos);
  const rest = pos - base;

  return clean[base + 1]
    ? clean[base] + rest * (clean[base + 1] - clean[base])
    : clean[base];
}

// generate clean ticks (FULL override)
function makeTicks(min, max, step) {
  const ticks = [];
  for (let v = min; v <= max + 1e-9; v += step) {
    ticks.push(Number(v.toFixed(2)));
  }
  return ticks;
}

// smart step (publication style)
function getStep(range) {
  if (range <= 2) return 0.2;
  if (range <= 5) return 0.5;
  if (range <= 10) return 1;
  if (range <= 20) return 2;
  return 5;
}

/* =========================
   TOOLTIP
========================= */

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const d = payload[0].payload;

  return (
    <div className="bg-white border rounded-lg shadow px-3 py-2 text-xs">
      <p className="font-semibold">{d.name}</p>
      <p>
        log₂FC: <span className="font-mono">{d.log2fc.toFixed(3)}</span>
      </p>
      <p>
        -log₁₀(p): <span className="font-mono">{d.negLogP.toFixed(3)}</span>
      </p>
      <p>
        p: <span className="font-mono">{d.p.toExponential(2)}</span>
      </p>
    </div>
  );
};

export default function VolcanoPanel({ volcanoData }) {
  const [fcThresh, setFcThresh] = useState(1);
  const [pThresh, setPThresh] = useState(0.05);

  const SIG_THRESH = -Math.log10(pThresh);

  /* =========================
     CLEAN DATA
  ========================= */

  const points = useMemo(() => {
    if (!volcanoData || !volcanoData.length) return [];

    return volcanoData.map((d) => {
      let rawP = Number(d.p ?? 1);
      let safeP;

      if (rawP === 0 || !Number.isFinite(rawP)) {
        safeP = 1e-300;
      } else {
        safeP = Math.max(rawP, 1e-300);
      }

      return {
        ...d,
        p: safeP,
        log2fc: Number(d.log2fc.toFixed(4)),
        negLogP: Number((-Math.log10(safeP)).toFixed(4)),
        name: d.rawName ?? d.name ?? 'unknown',
      };
    });
  }, [volcanoData]);

  /* =========================
     DOMAIN + TICKS
  ========================= */

  const { xDomain, yDomain, xTicks, yTicks, actualMaxY } = useMemo(() => {
    if (!points.length) {
      return {
        xDomain: [-3, 3],
        yDomain: [0, 5],
        xTicks: [-3, -2, -1, 0, 1, 2, 3],
        yTicks: [0, 1, 2, 3, 4, 5],
        actualMaxY: 5,
      };
    }

    const fcVals = points.map(d => d.log2fc).filter(v => Number.isFinite(v));
    const yVals = points.map(d => d.negLogP).filter(v => Number.isFinite(v));

    const fcLow = percentile(fcVals, 0.02);
    const fcHigh = percentile(fcVals, 0.98);

    const fcAbs = Math.max(Math.abs(fcLow), Math.abs(fcHigh), MIN_FC_RANGE);

    const xMin = -Math.ceil(fcAbs);
    const xMax = Math.ceil(fcAbs);

    const actualMaxY = Math.max(...yVals);

    let yTop;

    if (actualMaxY <= 1) {
      yTop = 1.2;
    } else if (actualMaxY <= 5) {
      yTop = Math.ceil(actualMaxY * 1.05 * 10) / 10;
    } else {
      yTop = Math.ceil(actualMaxY * 1.1);
    }

    if (yTop < actualMaxY) {
      yTop = actualMaxY + 0.1;
    }

    const stepX = getStep(xMax - xMin);
    const stepY = getStep(yTop);

    const rawYTicks = makeTicks(0, yTop, stepY);

    console.log(`Actual max: ${actualMaxY}, Domain top: ${yTop}`);

    return {
      xDomain: [xMin, xMax],
      yDomain: [0, yTop],
      xTicks: makeTicks(xMin, xMax, stepX),
      yTicks: rawYTicks,
      actualMaxY,
    };
  }, [points]);

  /* =========================
     COLOR LOGIC
  ========================= */

  const pointColor = (d) => {
    const sig = d.negLogP >= SIG_THRESH;

    if (sig && d.log2fc >= fcThresh) return MVG.colors.up;
    if (sig && d.log2fc <= -fcThresh) return MVG.colors.down;

    return '#94a3b8';
  };

  const up = points.filter(
    d => d.negLogP >= SIG_THRESH && d.log2fc >= fcThresh
  ).length;

  const down = points.filter(
    d => d.negLogP >= SIG_THRESH && d.log2fc <= -fcThresh
  ).length;

  if (!points.length) return null;

  return (
    <div>
      {/* CONTROLS */}
      <div className="flex gap-6 mb-3 text-[11px] items-center">
        <div>
          <span>p-value: </span>
          <input
            type="range"
            min={0.0001}
            max={0.1}
            step={0.0001}
            value={pThresh}
            onChange={(e) => setPThresh(Number(e.target.value))}
          />
          <span className="ml-2 font-mono">{pThresh.toFixed(4)}</span>
        </div>

        <div>
          <span>log₂FC: </span>
          <input
            type="range"
            min={0}
            max={3}
            step={0.1}
            value={fcThresh}
            onChange={(e) => setFcThresh(Number(e.target.value))}
          />
          <span className="ml-2 font-mono">{fcThresh.toFixed(2)}</span>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="flex gap-4 mb-2 text-[11px] text-gray-600">
        <span style={{ color: MVG.colors.up }}>▲ {up} up</span>
        <span style={{ color: MVG.colors.down }}>▼ {down} down</span>
        <span>{points.length - up - down} ns</span>
      </div>

      {/* CHART */}
      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
          <CartesianGrid stroke="#eef2f7" strokeDasharray="2 2" />

          <XAxis
            type="number"
            dataKey="log2fc"
            domain={xDomain}
            ticks={xTicks}
            tickFormatter={(v) => v.toFixed(1)}
            label={{
              value: 'log₂ Fold Change',
              position: 'bottom',
              offset: 10
            }}
          />

          <YAxis
            type="number"
            dataKey="negLogP"
            domain={yDomain}
            ticks={yTicks}
            tickFormatter={(v) => v.toFixed(1)}
            label={{
              value: '-log₁₀(p)',
              angle: -90,
              position: 'insideLeft'
            }}
            allowDataOverflow={true}
          />

          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine
            y={SIG_THRESH}
            stroke="#94a3b8"
            strokeDasharray="3 3"
          />
          <ReferenceLine
            x={fcThresh}
            stroke="#cbd5e1"
            strokeDasharray="3 3"
          />
          <ReferenceLine
            x={-fcThresh}
            stroke="#cbd5e1"
            strokeDasharray="3 3"
          />

          <Scatter data={points}>
            {points.map((d, i) => (
              <Cell
                key={i}
                fill={pointColor(d)}
                fillOpacity={d.negLogP >= SIG_THRESH ? 0.9 : 0.4}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
