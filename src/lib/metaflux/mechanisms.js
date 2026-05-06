// High-level biological mechanisms inferred from tag state
const MECHANISMS = [
  {
    name: "Glycolytic Shift",
    conditions: ["anaerobic_up", "glycolysis_up"],
    description: "Cells rely more on glycolysis for energy production, bypassing mitochondrial oxidation. This can occur in hypoxia, rapidly dividing cells, or when mitochondria are impaired.",
    severity: "moderate"
  },
  {
    name: "Mitochondrial Downshift",
    conditions: ["tca_down", "mitochondria_down"],
    description: "Reduced mitochondrial oxidative metabolism suggests organelle dysfunction, reduced substrate supply, or active metabolic reprogramming away from oxidative phosphorylation.",
    severity: "high"
  },
  {
    name: "Redox Imbalance",
    conditions: ["redox_up", "oxidative_stress_up"],
    description: "Disrupted balance between reactive oxygen species and antioxidant defenses. Can damage proteins, lipids, and DNA.",
    severity: "high"
  },
  {
    name: "Lipid Utilization Decline",
    conditions: ["carnitine_down"],
    description: "Reduced fatty acid oxidation capacity — acyl-carnitine shuttle impairment leads to lipid accumulation and reduced energy from fat metabolism.",
    severity: "moderate"
  },
  {
    name: "Active Ketogenesis",
    conditions: ["ketone_up"],
    description: "Hepatic ketone body production is elevated — typically seen in fasting, uncontrolled diabetes, or very-low-carbohydrate intake.",
    severity: "low"
  },
  {
    name: "BCAA Overflow / Impaired Catabolism",
    conditions: ["bcaa_up"],
    description: "Branched-chain amino acid accumulation strongly correlates with insulin resistance and is considered an early biomarker of metabolic syndrome and type 2 diabetes risk.",
    severity: "moderate"
  },
  {
    name: "Anaplerotic Glutamine Utilization",
    conditions: ["anaplerotic_up"],
    description: "Increased glutamine use to replenish TCA cycle intermediates — commonly seen in rapidly proliferating cells or cancer metabolism.",
    severity: "moderate"
  },
  {
    name: "Increased Nucleotide Turnover",
    conditions: ["purine_up"],
    description: "Elevated purine catabolism suggests increased cell death, proliferation, or tissue remodeling.",
    severity: "low"
  },
  {
    name: "Gut Microbiome Metabolic Shift",
    conditions: ["microbial_up", "gut_up"],
    description: "Altered microbial metabolite profile suggests changes in gut microbiome composition, potentially affecting systemic metabolism and inflammation.",
    severity: "moderate"
  },
  {
    name: "Inflammatory Lipid Signaling",
    conditions: ["inflammatory_up"],
    description: "Elevated pro-inflammatory lipid mediators indicate active tissue inflammation and immune cell activation.",
    severity: "moderate"
  },
  {
    name: "Hepatic Stress",
    conditions: ["bile_up", "liver_up"],
    description: "Altered bile acid and liver-associated metabolites suggest hepatic metabolic dysfunction or cholestasis.",
    severity: "high"
  },
  {
    name: "Energy Sensing Activation",
    conditions: ["energy_down"],
    description: "Depleted energy metabolites indicate cellular energy crisis — AMPK-mediated stress responses are likely engaged.",
    severity: "high"
  }
];

export default MECHANISMS;
