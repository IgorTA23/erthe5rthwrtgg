// Metabolic disorder profiles for pattern matching
const DISORDERS = [
  {
    name: "Type 2 Diabetes",
    tags_up: ["bcaa", "glycolysis", "ketone"],
    tags_down: ["tca", "energy"],
    metabolites_up: ["glucose", "leucine", "isoleucine", "valine"],
    metabolites_down: [],
    description: "Characterized by insulin resistance, elevated BCAAs, and disrupted glucose homeostasis"
  },
  {
    name: "Obesity / Metabolic Syndrome",
    tags_up: ["bcaa", "sphingolipid", "fatty_acid", "inflammatory"],
    tags_down: ["carnitine"],
    metabolites_up: ["leucine", "ceramide"],
    metabolites_down: ["carnitine"],
    description: "Lipid dysregulation, insulin resistance, and chronic low-grade inflammation"
  },
  {
    name: "Mitochondrial Dysfunction",
    tags_up: ["anaerobic", "glycolysis"],
    tags_down: ["tca", "mitochondria", "energy"],
    metabolites_up: ["lactate"],
    metabolites_down: ["atp", "citrate", "succinate"],
    description: "Impaired oxidative phosphorylation with compensatory glycolytic shift"
  },
  {
    name: "NAFLD / Liver Steatosis",
    tags_up: ["bile", "sphingolipid", "fatty_acid", "liver"],
    tags_down: ["carnitine"],
    metabolites_up: ["ceramide", "cholic acid"],
    metabolites_down: ["carnitine"],
    description: "Hepatic lipid accumulation, altered bile acid metabolism, and lipotoxicity"
  },
  {
    name: "Cancer Metabolic Reprogramming",
    tags_up: ["anaerobic", "glycolysis", "anaplerotic", "purine"],
    tags_down: ["tca"],
    metabolites_up: ["lactate", "glucose", "glutamine"],
    metabolites_down: [],
    description: "Warburg effect with enhanced glycolysis, glutamine addiction, and nucleotide synthesis"
  },
  {
    name: "Oxidative Stress Disorder",
    tags_up: ["oxidative_stress", "redox"],
    tags_down: ["antioxidant"],
    metabolites_up: ["glutathione disulfide", "allantoin"],
    metabolites_down: ["glutathione", "ascorbate"],
    description: "Overwhelmed antioxidant defenses with accumulated oxidative damage markers"
  },
  {
    name: "Gut Dysbiosis",
    tags_up: ["microbial", "gut", "uremic"],
    tags_down: ["scfa"],
    metabolites_up: ["trimethylamine n-oxide", "indoxyl sulfate", "p-cresol sulfate"],
    metabolites_down: ["butyrate"],
    description: "Altered gut microbiome producing elevated uremic toxins with reduced beneficial SCFAs"
  },
  {
    name: "Fasting / Catabolic State",
    tags_up: ["ketone", "urea"],
    tags_down: ["glycolysis"],
    metabolites_up: ["beta-hydroxybutyrate", "acetoacetate"],
    metabolites_down: ["glucose"],
    description: "Active ketogenesis and protein catabolism consistent with extended fasting or caloric restriction"
  }
];

export default DISORDERS;
