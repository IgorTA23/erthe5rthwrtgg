/**
 * Match rules against the full pipeline state.
 *
 * @param {Object} dataMap    { normalizedName → "up"|"down" }
 * @param {Object} tagMap     { tag → { up: n, down: m } }
 * @param {Object} pathwayMap { pathwayId → { up: n, down: m } }
 * @returns {Array} Sorted rule hits with confidence scores
 */

// SAFE JSON LOADING (fixes import analysis / Vite / ESLint issues)
const rulesData = await import("../knowledge/rules.json").then(m => m.default);

export function matchRules(dataMap, tagMap, pathwayMap) {
  const results = [];

  rulesData.forEach((rule) => {
    let matched = 0;
    const triggers = [];

    rule.conditions.forEach((cond) => {
      // Metabolite-level condition
      if (cond.metabolite) {
        if (dataMap[cond.metabolite] === cond.direction) {
          matched++;
          triggers.push(
            `${cond.metabolite} ${cond.direction === "up" ? "↑" : "↓"}`
          );
        }
        return;
      }

      // Tag-level condition
      if (cond.tag) {
        const count = tagMap[cond.tag]?.[cond.direction] || 0;
        const min = cond.min || 1;

        if (count >= min) {
          matched++;
          triggers.push(
            `${cond.tag} ${cond.direction === "up" ? "↑" : "↓"} (${count})`
          );
        }
        return;
      }

      // Pathway-level condition
      if (cond.pathway) {
        const count = pathwayMap[cond.pathway]?.[cond.direction] || 0;
        const min = cond.min || 1;

        if (count >= min) {
          matched++;
          triggers.push(
            `${cond.pathway} ${cond.direction === "up" ? "↑" : "↓"} (${count})`
          );
        }
      }
    });

    const baseConfidence =
      rule.conditions.length > 0
        ? matched / rule.conditions.length
        : 0;

    const confidence = +(
      baseConfidence * (rule.weight || 1)
    ).toFixed(3);

    if (confidence > 0) {
      results.push({
        name: rule.name,
        message: rule.message,
        confidence,
        triggers,
        matched,
        total: rule.conditions.length,
      });
    }
  });

  return results.sort((a, b) => b.confidence - a.confidence);
}
