import React, { useMemo } from 'react';

/**
 * Stable 2D covariance ellipse computation (95% CI)
 */
export function computeEllipse(points) {
  if (!points || points.length < 3) return null;

  const n = points.length;

  let mx = 0, my = 0;
  for (let i = 0; i < n; i++) {
    mx += points[i].x;
    my += points[i].y;
  }
  mx /= n;
  my /= n;

  let sxx = 0, syy = 0, sxy = 0;

  for (let i = 0; i < n; i++) {
    const dx = points[i].x - mx;
    const dy = points[i].y - my;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }

  sxx /= (n - 1);
  syy /= (n - 1);
  sxy /= (n - 1);

  // Stable eigen decomposition for 2x2 covariance
  const avg = (sxx + syy) / 2;
  const diff = (sxx - syy) / 2;
  const disc = Math.sqrt(diff * diff + sxy * sxy);

  const l1 = avg + disc;
  const l2 = avg - disc;

  if (!isFinite(l1) || !isFinite(l2)) return null;

  // 95% chi-square for 2 DOF
  const scale = Math.sqrt(5.991);

  // Stable angle
  const angle =
    0.5 * Math.atan2(2 * sxy, sxx - syy) * (180 / Math.PI);

  return {
    cx: mx,
    cy: my,
    rx: scale * Math.sqrt(Math.max(l1, 0)),
    ry: scale * Math.sqrt(Math.max(l2, 0)),
    angle
  };
}

/**
 * Data → pixel mapping
 */
function dataToPixel(val, domain, pxMin, pxMax) {
  const [dMin, dMax] = domain;

  if (dMax === dMin) return (pxMin + pxMax) / 2;

  return (
    pxMin +
    ((val - dMin) / (dMax - dMin)) * (pxMax - pxMin)
  );
}

export default function GroupEllipseLayer({
  groups,
  xDomain,
  yDomain,
  chartLeft,
  chartRight,
  chartTop,
  chartBottom,
}) {
  const ellipses = useMemo(() => {
    if (!groups) return [];

    return Object.entries(groups)
      .map(([name, { points, color }]) => {
        const e = computeEllipse(points);
        if (!e) return null;

        const cxPx = dataToPixel(
          e.cx,
          xDomain,
          chartLeft,
          chartRight
        );

        const cyPx = dataToPixel(
          e.cy,
          yDomain,
          chartBottom,
          chartTop
        );

        const xScale =
          (chartRight - chartLeft) /
          (xDomain[1] - xDomain[0]);

        const yScale =
          (chartBottom - chartTop) /
          (yDomain[1] - yDomain[0]);

        return {
          name,
          color,
          cxPx,
          cyPx,
          rxPx: e.rx * xScale,
          ryPx: e.ry * yScale,
          angle: e.angle,
          n: points.length,
        };
      })
      .filter(Boolean);
  }, [
    groups,
    xDomain,
    yDomain,
    chartLeft,
    chartRight,
    chartTop,
    chartBottom,
  ]);

  return (
    <g>
      {ellipses.map(
        ({
          name,
          color,
          cxPx,
          cyPx,
          rxPx,
          ryPx,
          angle,
          n,
        }) => (
          <g key={name}>
            {/* Confidence ellipse */}
            <ellipse
              cx={cxPx}
              cy={cyPx}
              rx={Math.max(2, rxPx)}
              ry={Math.max(2, ryPx)}
              transform={`rotate(${-angle}, ${cxPx}, ${cyPx})`}
              fill={color}
              fillOpacity={0.12}
              stroke={color}
              strokeOpacity={0.6}
              strokeWidth={0.8}
            />

            {/* centroid */}
            <circle
              cx={cxPx}
              cy={cyPx}
              r={3}
              fill={color}
              fillOpacity={0.7}
              stroke="white"
              strokeWidth={0.8}
            />

            {/* label */}
            <text
              x={cxPx}
              y={cyPx - Math.max(2, ryPx) - 6}
              textAnchor="middle"
              fontSize={8}
              fill={color}
              fillOpacity={0.9}
            >
              {name} (n={n})
            </text>
          </g>
        )
      )}
    </g>
  );
}
