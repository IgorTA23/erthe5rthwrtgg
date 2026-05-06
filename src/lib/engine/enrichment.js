/**
 * Dynamic pathway enrichment engine.
 * Computes enrichment scores from a selected set of metabolite names.
 */

import { resolveMetabolite } from './resolveMetabolite.js';
import metaboliteDB from '../knowledge/metabolites_full.json';

/** Build pathway → [metabolite names] map from the full DB */
export function buildPathwayMap() {
  const map = {};

  Object.entries(metaboliteDB).forEach(([name, info]) => {
    (info.pathways || []).forEach((p) => {
      if (!map[p]) map[p] = [];
      if (!map[p].includes(name)) map[p].push(name);
    });
  });

  return map;
}

/** Check if a metabolite name belongs to a given pathway */
export function isInPathway(metaboliteName, pathway) {
  const meta = resolveMetabolite(metaboliteName);
  return meta?.pathways?.includes(pathway) ?? false;
}

/** Compute enrichment from selected metabolite names */
export function computeEnrichment(selectedNames) {
  const pathwayCounts = {};

  selectedNames.forEach((name) => {
    const meta = resolveMetabolite(name);
    if (!meta?.pathways) return;

    meta.pathways.forEach((p) => {
      pathwayCounts[p] = (pathwayCounts[p] || 0) + 1;
    });
  });

  return Object.entries(pathwayCounts)
    .map(([pathway, count]) => ({
      pathway,
      count,
      label: pathway.replace(/_/g, ' ')
    }))
    .sort((a, b) => b.count - a.count);
}

/** Toggle a value in a set array */
export function toggleInSet(arr, val) {
  return arr.includes(val)
    ? arr.filter((v) => v !== val)
    : [...arr, val];
}
