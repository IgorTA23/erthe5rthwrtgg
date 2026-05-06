export function extractTopFromVIP(plsda, X, labels, metabolites, threshold = 1) {
  if (!plsda?.vip || !X || !labels) return [];

  return plsda.vip
    .map((v, i) => {
      const name = metabolites?.[i];
      if (!name) return null;
      return {
        name,
        importance: v || 0,
        direction: getMeanDirection(X, labels, i)
      };
    })
    .filter(x => x && x.importance >= threshold);
}

function getMeanDirection(X, labels, colIndex) {
  const control = [];
  const disease = [];

  X.forEach((row, i) => {
    const val = row?.[colIndex];
    if (!Number.isFinite(val)) return;
    if (labels[i] === 'control') control.push(val);
    else disease.push(val);
  });

  if (!control.length || !disease.length) return 0;

  const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  return mean(disease) > mean(control) ? +1 : -1;
}
