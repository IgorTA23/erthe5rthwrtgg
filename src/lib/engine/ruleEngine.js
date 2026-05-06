/**
 * Rule engine for biological interpretation.
 * Evaluates metabolite, tag, and pathway-based conditions.
 */

import rulesData from "../knowledge/rules.json";

export function matchRules(dataMap, tagMap, pathwayMap) {
  const results = [];

  rulesData.forEach((rule) => {
    let matched = 0;
    const triggers = [];

    rule.conditions.forEach((cond) => {
      if (cond.metabolite) {
        if (dataMap[cond.metabolite] === cond.direction) {
          matched++;
          triggers.push(
            `${cond.metabolite} ${cond.direction === "up" ? "↑" : "↓"}`
          );
        }
        return;
      }

      if (cond.tag) {
        const count =
          tagMap[cond.tag]?.[cond.direction] || 0;

        if (count >= (cond.min || 1)) {
          matched++;
          triggers.push(
            `${cond.tag} ${cond.direction === "up" ? "↑" : "↓"} (${count})`
          );
        }
        return;
      }

      if (cond.pathway) {
        const count =
          pathwayMap[cond.pathway]?.[cond.direction] || 0;

        if (count >= (cond.min || 1)) {
          matched++;
          triggers.push(
            `${cond.pathway} ${cond.direction === "up" ? "↑" : "↓"} (${count})`
          );
        }
      }
    });

    const confidence = +(
      (rule.conditions.length > 0
        ? matched / rule.conditions.length
        : 0) * (rule.weight || 1)
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
