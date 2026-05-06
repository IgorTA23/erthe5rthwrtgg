export function computeDirectionalEnrichment(mapped) {
  const scores = {};

  mapped.forEach(m => {
    if (!m.pathways?.length) return;
    m.pathways.forEach(p => {
      if (!scores[p]) scores[p] = { up: 0, down: 0 };
      if (m.direction > 0) scores[p].up += m.importance;
      else if (m.direction < 0) scores[p].down += m.importance;
    });
  });

  return Object.entries(scores)
    .map(([pathway, v]) => ({
      pathway,
      up: v.up,
      down: v.down,
      net: v.up - v.down,
      total: v.up + v.down
    }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}
