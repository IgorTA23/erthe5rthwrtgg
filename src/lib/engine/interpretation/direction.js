export function buildVolcanoMap(volcanoData) {
  const map = {};
  volcanoData.forEach(d => {
    if (d.name) map[d.name.toLowerCase()] = d;
  });
  return map;
}

export function getDirectionFromVolcano(volcanoMap, name) {
  const entry = volcanoMap[name];
  if (!entry) return 0;
  const fc = entry.log2fc ?? entry.foldChange ?? 0;
  return fc > 0 ? +1 : fc < 0 ? -1 : 0;
}
