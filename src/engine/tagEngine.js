import db from "../knowledge/metabolites_full.json";

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

/**
 * Infer complete tag set for a metabolite entry.
 */
export function inferTags(key, meta) {
  const tags = new Set(Array.isArray(meta?.tags) ? meta.tags : []);

  // Pathway-derived tags
  (meta?.pathways || []).forEach((p) => {
    (PATHWAY_TAG_HINTS[p] || []).forEach((t) => tags.add(t));
  });

  // Name-pattern-derived tags
  NAME_TAG_HINTS.forEach(([re, tag]) => {
    if (re.test(key)) tags.add(tag);
  });

  return Array.from(tags);
}
