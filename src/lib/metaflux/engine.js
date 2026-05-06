/**
 * MetaFlux Insight — Main Analysis Engine
 *
 * Pipeline:
 *   Raw CSV
 *   → parseData()
 *   → processData()  (scale detection, log2fc, classification, annotation)
 *   → buildDataMap() (normalizedName → direction)
 *   → buildTagMap() + buildPathwayMap()
 *   → matchRules()
 *   → inferMechanisms()
 *   → analyzePathways()
 *   → matchDisorders()
 *   → generateSummary() + generateReport()
 */

import pathwayDefs from "../knowledge/pathways.json";
import { normalizeName } from "../engine/resolveMetabolite";
import { resolveMetabolite } from "../engine/resolveMetabolite";
import { buildTagMap, buildPathwayMap } from "../engine/tagEngine";
import { matchRules as matchRulesEngine } from "../engine/ruleEngine";

import MECHANISMS from "./mechanisms";
import DISORDERS from "./disorders";

export { normalizeName };

// ─── Scale detection ────────────────────────────────────────────────────────

export function detectScale(rows) {
  const fcs = rows.map((r) => Math.abs(r.foldChange)).filter((v) => !isNaN(v) && isFinite(v));
  if (fcs.length === 0) return "log2";
  return Math.max(...fcs) > 10 ? "linear" : "log2";
}

export function toLog2FC(fc, isLinear) {
  if (!isLinear) return fc;
  if (fc <= 0) return 0;
  return Math.log2(fc);
}

// ─── Classification ──────────────────────────────────────────────────────────

export function classifyMetabolite(log2fc, pvalue, pThreshold = 0.05, fcThreshold = 0) {
  if (pvalue >= pThreshold) return "ns";
  if (Math.abs(log2fc) < fcThreshold) return "ns";
  return log2fc > 0 ? "up" : "down";
}

// ─── Parsing ─────────────────────────────────────────────────────────────────

export function parseData(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0]
    .split(/[,\t]/)
    .map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

  const metCol = header.findIndex((h) =>
    h.includes("metabolite") || h.includes("compound") || h.includes("name") || h.includes("id")
  );
  const fcCol = header.findIndex((h) =>
    h.includes("fold") || h.includes("fc") || h.includes("log2") || h.includes("ratio")
  );
  const pCol = header.findIndex(
    (h) =>
      (h.includes("p-value") || h.includes("pvalue") || h.includes("p value") || h === "p") &&
      !h.includes("adj") && !h.includes("fdr") && !h.includes("corrected")
  );
  const adjPCol = header.findIndex((h) =>
    h.includes("adj") || h.includes("fdr") || h.includes("corrected") ||
    h.includes("q-value") || h.includes("qvalue")
  );

  if (metCol === -1 || fcCol === -1 || pCol === -1) return [];

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/[,\t]/).map((c) => c.trim().replace(/['"]/g, ""));
    if (cols.length <= Math.max(metCol, fcCol, pCol)) continue;

    const rawName = cols[metCol];
    if (!rawName) continue;

    const fc = parseFloat(cols[fcCol]);
    const p = parseFloat(cols[pCol]);
    const adjP = adjPCol >= 0 ? parseFloat(cols[adjPCol]) : null;

    if (isNaN(fc) || isNaN(p)) continue;

    rows.push({
      rawName,
      normalizedName: normalizeName(rawName),
      foldChange: fc,
      pValue: p,
      adjPValue: isNaN(adjP) ? null : adjP,
    });
  }

  return rows;
}

// ─── Processing ───────────────────────────────────────────────────────────────

export function processData(rows, options = {}) {
  const { pThreshold = 0.05, fcThreshold = 0, useFDR = false, forceScale = null } = options;

  const scale = forceScale || detectScale(rows);
  const isLinear = scale === "linear";

  const processed = rows.map((row) => {
    const log2fc = toLog2FC(row.foldChange, isLinear);
    const effectiveP = useFDR && row.adjPValue != null ? row.adjPValue : row.pValue;
    const direction = classifyMetabolite(log2fc, effectiveP, pThreshold, fcThreshold);
    const meta = resolveMetabolite(row.rawName) || null;

    return {
      ...row,
      log2fc,
      effectiveP,
      direction,
      metaboliteClass: meta?.category || "unknown",
      hmdbClass: meta?.hmdbClass || null,
      pathways: meta?.pathways || [],
      tags: meta?.tags || [],
      knownMetabolite: !!meta,
    };
  });

  return { processed, scale };
}

// ─── Data map helpers ────────────────────────────────────────────────────────

function buildDataMap(processed) {
  const map = {};
  processed.forEach((row) => {
    if (row.direction !== "ns") {
      map[row.normalizedName] = row.direction;
    }
  });
  return map;
}

// ─── Rules (hybrid: metabolite + tag + pathway) ───────────────────────────────

export function matchRules(processed) {
  const dataMap = buildDataMap(processed);
  const tagMap = buildTagMap(dataMap);
  const pathwayMap = buildPathwayMap(dataMap);
  return matchRulesEngine(dataMap, tagMap, pathwayMap);
}

// ─── Mechanisms (tag-based) ──────────────────────────────────────────────────

export function inferMechanisms(processed) {
  const dataMap = buildDataMap(processed);
  const tagMap = buildTagMap(dataMap);

  // Build flat state: "tag_direction" → count
  const flatState = {};
  Object.entries(tagMap).forEach(([tag, counts]) => {
    if (counts.up > 0) flatState[`${tag}_up`] = counts.up;
    if (counts.down > 0) flatState[`${tag}_down`] = counts.down;
  });

  return MECHANISMS.map((mech) => {
    let matched = 0;
    const triggers = [];

    mech.conditions.forEach((cond) => {
      const parts = cond.split(":");
      const key = parts[0];
      const minCount = parts.length > 1 ? parseInt(parts[1]) : 1;

      if (flatState[key] && flatState[key] >= minCount) {
        matched++;
        const lastUnderscore = key.lastIndexOf("_");
        const tag = key.substring(0, lastUnderscore);
        const dir = key.substring(lastUnderscore + 1);
        triggers.push(`${tag} ${dir === "up" ? "↑" : "↓"} (${flatState[key]})`);
      }
    });

    const confidence = mech.conditions.length > 0 ? matched / mech.conditions.length : 0;
    return {
      name: mech.name,
      description: mech.description,
      severity: mech.severity,
      confidence,
      triggers,
      matched,
      total: mech.conditions.length,
    };
  })
  .filter((m) => m.confidence > 0)
  .sort((a, b) => b.confidence - a.confidence);
}

// ─── Pathway analysis ─────────────────────────────────────────────────────────

export function analyzePathways(processed) {
  const counts = {};

  processed.forEach((row) => {
    if (row.direction === "ns") return;
    row.pathways.forEach((pw) => {
      if (!counts[pw]) counts[pw] = { up: 0, down: 0, total: 0 };
      counts[pw][row.direction]++;
      counts[pw].total++;
    });
  });

  return Object.entries(counts)
    .map(([pw, c]) => {
      const info = pathwayDefs[pw];
      const impact = c.total > 0 ? (c.up - c.down) / c.total : 0;
      const direction = impact > 0 ? "up" : impact < 0 ? "down" : "mixed";

      return {
        pathway: pw,
        name: info?.name || pw.replace(/_/g, " "),
        category: info?.category || "other",
        impact,
        direction,
        up: c.up,
        down: c.down,
        total: c.total,
        interpretation:
          direction === "up"
            ? info?.interpretation_up
            : direction === "down"
            ? info?.interpretation_down
            : null,
      };
    })
    .sort((a, b) => Math.abs(b.impact) * b.total - Math.abs(a.impact) * a.total);
}

// ─── Disorder matching ────────────────────────────────────────────────────────

export function matchDisorders(processed) {
  const dataMap = buildDataMap(processed);
  const tagMap = buildTagMap(dataMap);

  return DISORDERS.map((disorder) => {
    let score = 0;
    let maxScore = 0;
    const evidence = [];

    disorder.tags_up.forEach((tag) => {
      maxScore++;
      if (tagMap[tag]?.up > 0) { score++; evidence.push(`${tag} ↑`); }
    });
    disorder.tags_down.forEach((tag) => {
      maxScore++;
      if (tagMap[tag]?.down > 0) { score++; evidence.push(`${tag} ↓`); }
    });
    disorder.metabolites_up.forEach((met) => {
      maxScore += 1.5;
      if (dataMap[normalizeName(met)] === "up") { score += 1.5; evidence.push(`${met} ↑`); }
    });
    disorder.metabolites_down.forEach((met) => {
      maxScore += 1.5;
      if (dataMap[normalizeName(met)] === "down") { score += 1.5; evidence.push(`${met} ↓`); }
    });

    const confidence = maxScore > 0 ? score / maxScore : 0;
    return { name: disorder.name, description: disorder.description, confidence, evidence, score, maxScore };
  })
  .filter((d) => d.confidence > 0)
  .sort((a, b) => b.confidence - a.confidence);
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export function generateSummary(processed, mechanisms, pathwayHits, disorders) {
  const upCount = processed.filter((r) => r.direction === "up").length;
  const downCount = processed.filter((r) => r.direction === "down").length;
  const nsCount = processed.filter((r) => r.direction === "ns").length;
  const knownCount = processed.filter((r) => r.knownMetabolite).length;

  const topMechanism = mechanisms[0] || null;
  const topPathway = pathwayHits[0] || null;
  const topDisorder = disorders[0] || null;

  let headline = topMechanism?.name
    || (upCount > downCount ? "Predominantly upregulated metabolic profile"
      : downCount > upCount ? "Predominantly downregulated metabolic profile"
      : "Mixed metabolic profile");

  return { headline, upCount, downCount, nsCount, total: processed.length, knownCount, topMechanism, topPathway, topDisorder };
}

// ─── Report ───────────────────────────────────────────────────────────────────

export function generateReport(processed, summary, mechanisms, pathwayHits, rules, disorders) {
  const sigUp = processed.filter((r) => r.direction === "up").sort((a, b) => a.effectiveP - b.effectiveP);
  const sigDown = processed.filter((r) => r.direction === "down").sort((a, b) => a.effectiveP - b.effectiveP);

  let r = `# MetaFlux Insight — Analysis Report\n\n`;
  r += `**Generated:** ${new Date().toLocaleString()}\n\n---\n\n`;
  r += `## Summary\n\n`;
  r += `- **Total metabolites:** ${summary.total}\n`;
  r += `- **Significantly upregulated:** ${summary.upCount}\n`;
  r += `- **Significantly downregulated:** ${summary.downCount}\n`;
  r += `- **Non-significant:** ${summary.nsCount}\n`;
  r += `- **Mapped to knowledge base:** ${summary.knownCount} / ${summary.total}\n`;
  r += `- **Primary signal:** ${summary.headline}\n\n`;

  r += `## Most Significantly Altered Metabolites\n\n### Upregulated (Top 10)\n\n`;
  r += `| Metabolite | log₂FC | p-value | Class | Pathways |\n|---|---|---|---|---|\n`;
  sigUp.slice(0, 10).forEach((row) => {
    r += `| ${row.rawName} | ${row.log2fc.toFixed(3)} | ${row.effectiveP.toExponential(2)} | ${row.metaboliteClass} | ${row.pathways.join(", ") || "—"} |\n`;
  });

  r += `\n### Downregulated (Top 10)\n\n`;
  r += `| Metabolite | log₂FC | p-value | Class | Pathways |\n|---|---|---|---|---|\n`;
  sigDown.slice(0, 10).forEach((row) => {
    r += `| ${row.rawName} | ${row.log2fc.toFixed(3)} | ${row.effectiveP.toExponential(2)} | ${row.metaboliteClass} | ${row.pathways.join(", ") || "—"} |\n`;
  });

  if (mechanisms.length > 0) {
    r += `\n## Biological Mechanisms\n\n`;
    mechanisms.forEach((m) => {
      r += `### ${m.name} (${(m.confidence * 100).toFixed(0)}%)\n${m.description}\n- Evidence: ${m.triggers.join(", ")}\n\n`;
    });
  }

  if (pathwayHits.length > 0) {
    r += `## Pathway Disruptions\n\n`;
    pathwayHits.forEach((p) => {
      r += `- **${p.name}** ${p.direction === "up" ? "↑" : "↓"} (impact: ${p.impact.toFixed(2)}) — ${p.interpretation || "N/A"}\n`;
    });
    r += `\n`;
  }

  if (rules.length > 0) {
    r += `## Detected Pattern Signatures\n\n`;
    rules.forEach((rule) => {
      r += `- **${rule.name}** (${(rule.confidence * 100).toFixed(0)}%) — ${rule.message}\n`;
      r += `  - Triggered by: ${rule.triggers.join(", ")}\n`;
    });
    r += `\n`;
  }

  if (disorders.length > 0) {
    r += `## Associated Metabolic States\n\n`;
    disorders.forEach((d) => {
      r += `- **${d.name}** (${(d.confidence * 100).toFixed(0)}%) — ${d.description}\n`;
      r += `  - Evidence: ${d.evidence.join(", ")}\n`;
    });
    r += `\n`;
  }

  r += `---\n\n⚠️ **Disclaimer:** Computational interpretation for research use only. Not a clinical diagnosis.\n`;
  return r;
}

// ─── Sample data ──────────────────────────────────────────────────────────────

export const SAMPLE_DATA = `Metabolite,Fold Change,p-value
Glucose,1.8,0.003
Lactate,2.4,0.001
Pyruvate,0.7,0.12
Citrate,-1.2,0.008
Succinate,-0.9,0.04
Fumarate,-1.1,0.02
Malate,-0.8,0.06
Alpha-ketoglutarate,-1.0,0.03
Leucine,1.5,0.004
Isoleucine,1.3,0.01
Valine,1.1,0.02
Carnitine,-1.6,0.002
Acetylcarnitine,-1.3,0.009
Palmitoylcarnitine,-0.9,0.05
Beta-hydroxybutyrate,1.9,0.005
Acetoacetate,1.4,0.02
ATP,-1.8,0.001
ADP,0.5,0.15
AMP,1.2,0.01
Glutamine,0.8,0.04
Glutamate,0.6,0.09
Alanine,0.4,0.22
Serine,-0.3,0.35
Ceramide,1.1,0.03
Sphingomyelin,0.7,0.08
Cholesterol,0.5,0.14
Trimethylamine N-oxide,1.3,0.02
Uric acid,0.9,0.04
Glutathione,-1.0,0.03
Glutathione disulfide,1.2,0.02`;
