export function buildNarrative({ pathways, rules, topMetabolites }) {
  const topPathways = pathways.slice(0, 5);

  const pathwayText = topPathways
    .map(p => p.net > 0 ? `${p.pathway} ↑` : `${p.pathway} ↓`)
    .join(', ');

  const topMets = topMetabolites
    .slice(0, 5)
    .map(m => m.name)
    .join(', ');

  const ruleText = rules.map(r => r.message).join('. ');

  return `Key metabolic drivers include ${topMets}.\n\nDirectional pathway analysis indicates: ${pathwayText}.\n\n${ruleText}`.trim();
}
