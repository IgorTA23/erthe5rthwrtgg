/**
 * Heatmap preparation — selects top-N metabolites by variance,
 * z-scores each row.
 * Returns { cells, metabolites, samples }
 */

function mean(arr) {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function std(arr, mu) {
  const m = mu ?? mean(arr);
  const v = arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length;
  return Math.sqrt(v) || 1;
}

export function prepareHeatmap(matrix, metaboliteNames, sampleNames, topN = 25) {
  const nSamples = matrix.length;
  const nMets = metaboliteNames.length;

  // Compute variance per metabolite (column)
  const variances = Array(nMets).fill(0).map((_, j) => {
    const col = matrix.map((r) => r[j]);
    const m = mean(col);

    return {
      idx: j,
      variance: col.reduce((s, v) => s + (v - m) ** 2, 0) / col.length
    };
  });

  // Pick top-N by variance
  const topIdx = variances
    .sort((a, b) => b.variance - a.variance)
    .slice(0, topN)
    .map((v) => v.idx)
    .sort((a, b) => a - b); // restore original order for readability

  const selectedNames = topIdx.map((i) => metaboliteNames[i]);

  // Z-score each selected metabolite across samples
  const cells = [];

  topIdx.forEach((metIdx, ri) => {
    const col = matrix.map((r) => r[metIdx]);
    const m = mean(col);
    const s = std(col, m);

    col.forEach((v, si) => {
      cells.push({
        metabolite: selectedNames[ri],
        sample: sampleNames[si] || `S${si + 1}`,
        value: +((v - m) / s).toFixed(3),
      });
    });
  });

  return {
    cells,
    metabolites: selectedNames,
    samples: sampleNames
  };
}
