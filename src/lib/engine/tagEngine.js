import { resolveMetabolite } from "./resolveMetabolite";

// ─────────────────────────────────────────────────────────────
// PATHWAY → TAG HINTS
// ─────────────────────────────────────────────────────────────

const PATHWAY_TAG_HINTS = {
  glycolysis: ["glycolysis", "energy"],
  gluconeogenesis: ["energy"],
  tca_cycle: ["tca", "mitochondria", "energy"],
  oxidative_phosphorylation: ["energy", "mitochondria"],
  lactate_shuttle: ["anaerobic", "energy"],
  fatty_acid_oxidation: ["lipid", "fa", "beta_oxidation"],
  ketogenesis: ["ketone", "lipid", "energy"],
  lipogenesis: ["lipid", "fa"],
  phospholipid_metabolism: ["lipid", "membrane"],
  sphingolipid_metabolism: ["lipid", "sphingolipid", "membrane"],
  cholesterol_metabolism: ["lipid", "sterol"],
  bile_acid_metabolism: ["bile", "lipid", "liver"],
  carnitine_shuttle: ["carnitine", "fa"],
  eicosanoid_metabolism: ["eicosanoid", "inflammatory", "lipid"],
  redox_balance: ["redox"],
  glutathione_metabolism: ["redox", "antioxidant", "oxidative_stress"],
  energy_metabolism: ["energy"],
  pentose_phosphate_pathway: ["ppp", "redox"],
  purine_metabolism: ["purine"],
  pyrimidine_metabolism: ["pyrimidine"],
  urea_cycle: ["urea", "nitrogen"],
  glutamine_metabolism: ["anaplerotic", "nitrogen_donor"],
  bcaa_metabolism: ["bcaa"],
  aromatic_aa_metabolism: ["aromatic"],
  tryptophan_kynurenine: ["kynurenine", "inflammatory"],
  tyrosine_catecholamine: ["catecholamine"],
  methionine_cycle: ["methylation"],
  butyrate_metabolism: ["scfa", "microbial"],
  niacin_metabolism: ["redox", "cofactor"],
};

// ─────────────────────────────────────────────────────────────
// NAME-BASED TAG HINTS
// ─────────────────────────────────────────────────────────────

const NAME_TAG_HINTS = [
  [/carnitine/, "carnitine"],
  [/cholesterol/, "sterol"],
  [/phosphatidyl|sphingo/, "membrane"],
  [/lactate/, "anaerobic"],
  [/ceramide/, "sphingolipid"],
  [/ketone|butyrate|acetoacetate/, "ketone"],
  [/glutathione/, "antioxidant"],
  [/bile/, "bile"],
  [/kynuren/, "kynurenine"],
  [/tmao|trimethylamine|indoxyl|p-cresol|phenylacetyl/, "uremic"],
  [/bcaa|leucine|isoleucine|valine/, "bcaa"],
  [/eicosanoid|prostaglandin|leukotriene|thromboxane/, "eicosanoid"],
  [/purine|adenosine|guano|hypoxanth|xanth|uric/, "purine"],
  [/pyrimidin|uridine|cytidine|thymidine/, "pyrimidine"],
  [/homocysteine/, "inflammatory"],
];

// ─────────────────────────────────────────────────────────────
// TAG INFERENCE
// ─────────────────────────────────────────────────────────────

function normalizeTag(tag) {
  return (tag || "").toLowerCase().trim();
}

export function inferTags(key, meta) {
  const tags = new Set();

  // base metadata tags
  if (Array.isArray(meta?.tags)) {
    for (const t of meta.tags) {
      tags.add(normalizeTag(t));
    }
  }

  // pathway-derived tags
  if (Array.isArray(meta?.pathways)) {
    for (const p of meta.pathways) {
      const hints = PATHWAY_TAG_HINTS[p] || [];
      for (const t of hints) tags.add(t);
    }
  }

  // regex-based name inference
  for (const [re, tag] of NAME_TAG_HINTS) {
    if (re.test(key)) tags.add(tag);
  }

  return [...tags];
}

// ─────────────────────────────────────────────────────────────
// TAG MAP BUILDER (SAFE)
// ─────────────────────────────────────────────────────────────

export function buildTagMap(dataMap = {}) {
  const tagMap = {};

  for (const [met, dirRaw] of Object.entries(dataMap)) {
    const meta = resolveMetabolite(met);
    if (!meta) continue;

    const dir = dirRaw === "up" || dirRaw === "down" ? dirRaw : null;
    if (!dir) continue;

    const tags = inferTags(met, meta);

    for (const tag of tags) {
      if (!tagMap[tag]) tagMap[tag] = { up: 0, down: 0 };
      tagMap[tag][dir]++;
    }
  }

  return tagMap;
}

// ─────────────────────────────────────────────────────────────
// PATHWAY MAP BUILDER (SAFE)
// ─────────────────────────────────────────────────────────────

export function buildPathwayMap(dataMap = {}) {
  const pwMap = {};

  for (const [met, dirRaw] of Object.entries(dataMap)) {
    const meta = resolveMetabolite(met);
    if (!meta) continue;

    const dir = dirRaw === "up" || dirRaw === "down" ? dirRaw : null;
    if (!dir) continue;

    const pathways = Array.isArray(meta.pathways) ? meta.pathways : [];

    for (const pw of pathways) {
      if (!pwMap[pw]) pwMap[pw] = { up: 0, down: 0 };
      pwMap[pw][dir]++;
    }
  }

  return pwMap;
}
