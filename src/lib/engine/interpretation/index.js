import { extractTopFromPCA } from "./pcaInterpretation";
import { extractTopFromVIP } from "./plsdaInterpretation";
import { mapToPathways } from "./pathwayMapping";
import { computeDirectionalEnrichment } from "./enrichment";
import { runDirectionalRules } from "./ruleEngine";
import { buildNarrative } from "./narrative";
import { buildVolcanoMap, getDirectionFromVolcano } from "./direction";

export function interpretResults({
  pca,
  plsda,
  volcano,
  metabolitesDB,
  X,
  labels,
  metabolites
}) {
  const volcanoMap = buildVolcanoMap(volcano || []);

  const pcaFeatures = extractTopFromPCA(pca);
  const vipFeatures = plsda
    ? extractTopFromVIP(plsda, X, labels, metabolites)
    : [];

  const combined = [...pcaFeatures, ...vipFeatures].map(f => ({
    ...f,
    direction:
      f.direction ?? getDirectionFromVolcano(volcanoMap, f.name.toLowerCase())
  }));

  const mapped = mapToPathways(combined, metabolitesDB);
  const pathways = computeDirectionalEnrichment(mapped);
  const rules = runDirectionalRules(pathways, mapped);
  const narrative = buildNarrative({ pathways, rules, topMetabolites: combined });

  return { pathways, rules, narrative, topMetabolites: combined };
}
