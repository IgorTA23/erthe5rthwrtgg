import db from "../knowledge/metabolites_full.json";

/**
 * Normalize raw metabolite name → canonical DB key
 */
export function normalizeName(rawName) {
  if (!rawName) return "";

  let key = rawName.toLowerCase().trim();

  // 1. Remove quotes early
  key = key.replace(/['"]/g, "");

  // 2. Normalize separators
  key = key
    .replace(/\s+/g, "-")
    .replace(/_/g, "-");

  // 3. Remove isotope / adduct annotations
  key = key
    .replace(/\[.*?\]/g, "")
    .replace(/\(.*?\)/g, "");

  // 4. Normalize stereochemistry prefixes
  key = key.replace(/^(l|d|r|s|dl|[+-])-/i, "");

  // 5. Clean trailing junk
  key = key
    .replace(/[+\-]+$/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const visited = new Set();

  const resolveAlias = (k) => {
    let current = k;

    while (db[current]?.aliasOf) {
      if (visited.has(current)) break;
      visited.add(current);
      current = db[current].aliasOf;
    }

    return current;
  };

  const tryLookup = (k) => {
    if (db[k]) return resolveAlias(k);
    return null;
  };

  // Direct match
  let hit = tryLookup(key);
  if (hit) return hit;

  // Remove stereo prefix again
  const deStereo = key.replace(/^(l|d|r|s|dl)-/i, "");
  hit = tryLookup(deStereo);
  if (hit) return hit;

  // Collapse hyphens
  const collapsed = key.replace(/-+/g, "-");
  hit = tryLookup(collapsed);
  if (hit) return hit;

  // Ultra-clean fallback
  const ultraClean = key.replace(/[^a-z0-9-]/g, "");
  hit = tryLookup(ultraClean);
  if (hit) return hit;

  return key;
}
