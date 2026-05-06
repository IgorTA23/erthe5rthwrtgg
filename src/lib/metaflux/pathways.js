const PATHWAYS = {
  glycolysis: {
    name: "Glycolysis",
    category: "energy",
    interpretation_up: "Increased glycolytic flux — cells rely more on glucose breakdown for energy",
    interpretation_down: "Reduced glucose utilization — possible shift to alternative fuel sources"
  },
  tca_cycle: {
    name: "TCA Cycle",
    category: "energy",
    interpretation_up: "Enhanced mitochondrial oxidative metabolism",
    interpretation_down: "Reduced oxidative metabolism — possible mitochondrial dysfunction"
  },
  ppp: {
    name: "Pentose Phosphate Pathway",
    category: "carbohydrate",
    interpretation_up: "Increased NADPH production and nucleotide synthesis",
    interpretation_down: "Reduced pentose phosphate pathway activity"
  },
  fatty_acid_oxidation: {
    name: "Fatty Acid Oxidation",
    category: "lipid",
    interpretation_up: "Increased lipid utilization for energy",
    interpretation_down: "Impaired fatty acid oxidation — possible lipid accumulation"
  },
  ketogenesis: {
    name: "Ketogenesis",
    category: "lipid",
    interpretation_up: "Active ketone body production — fasting, low insulin, or fat-adapted state",
    interpretation_down: "Reduced ketogenesis — adequate glucose supply or suppressed lipolysis"
  },
  sterol_metabolism: {
    name: "Sterol Metabolism",
    category: "lipid",
    interpretation_up: "Increased cholesterol / sterol synthesis or turnover",
    interpretation_down: "Reduced sterol metabolism"
  },
  phospholipid: {
    name: "Phospholipid Metabolism",
    category: "lipid",
    interpretation_up: "Active membrane remodeling or phospholipid synthesis",
    interpretation_down: "Reduced phospholipid turnover"
  },
  sphingolipid: {
    name: "Sphingolipid Metabolism",
    category: "lipid",
    interpretation_up: "Increased ceramide/sphingolipid signaling — may indicate stress or apoptosis",
    interpretation_down: "Reduced sphingolipid metabolism"
  },
  bile_acid: {
    name: "Bile Acid Metabolism",
    category: "lipid",
    interpretation_up: "Increased bile acid synthesis or enterohepatic cycling",
    interpretation_down: "Reduced bile acid production — possible hepatic or gut microbiome changes"
  },
  scfa_metabolism: {
    name: "Short-Chain Fatty Acid Metabolism",
    category: "lipid",
    interpretation_up: "Increased microbial fermentation products",
    interpretation_down: "Reduced gut microbial SCFA production"
  },
  amino_acid_metabolism: {
    name: "Amino Acid Metabolism",
    category: "amino_acid",
    interpretation_up: "Increased protein turnover or amino acid catabolism",
    interpretation_down: "Reduced amino acid metabolism"
  },
  bcaa_metabolism: {
    name: "BCAA Metabolism",
    category: "amino_acid",
    interpretation_up: "Elevated branched-chain amino acids — associated with insulin resistance",
    interpretation_down: "Increased BCAA catabolism"
  },
  aromatic_aa: {
    name: "Aromatic Amino Acid Metabolism",
    category: "amino_acid",
    interpretation_up: "Elevated aromatic amino acids — possible liver dysfunction",
    interpretation_down: "Reduced aromatic amino acid levels"
  },
  urea_cycle: {
    name: "Urea Cycle",
    category: "amino_acid",
    interpretation_up: "Increased nitrogen disposal — protein catabolism",
    interpretation_down: "Reduced urea cycle activity — possible urea cycle defect"
  },
  one_carbon: {
    name: "One-Carbon Metabolism",
    category: "amino_acid",
    interpretation_up: "Active methylation and folate cycling",
    interpretation_down: "Impaired one-carbon metabolism — possible folate/B12 deficiency"
  },
  kynurenine: {
    name: "Kynurenine Pathway",
    category: "amino_acid",
    interpretation_up: "Increased tryptophan degradation — inflammation or immune activation",
    interpretation_down: "Reduced kynurenine pathway activity"
  },
  energy_metabolism: {
    name: "Energy Metabolism",
    category: "energy",
    interpretation_up: "Active energy production and turnover",
    interpretation_down: "Energy depletion — reduced ATP availability"
  },
  redox: {
    name: "Redox Balance",
    category: "energy",
    interpretation_up: "Altered redox state — increased reducing equivalents",
    interpretation_down: "Oxidative stress or depleted antioxidant capacity"
  },
  etc: {
    name: "Electron Transport Chain",
    category: "energy",
    interpretation_up: "Active mitochondrial electron transport",
    interpretation_down: "Impaired electron transport chain function"
  },
  purine: {
    name: "Purine Metabolism",
    category: "nucleotide",
    interpretation_up: "Increased purine turnover — cell proliferation or tissue damage",
    interpretation_down: "Reduced purine metabolism"
  },
  pyrimidine: {
    name: "Pyrimidine Metabolism",
    category: "nucleotide",
    interpretation_up: "Increased pyrimidine synthesis — cell proliferation",
    interpretation_down: "Reduced pyrimidine metabolism"
  },
  eicosanoid: {
    name: "Eicosanoid Signaling",
    category: "lipid",
    interpretation_up: "Increased inflammatory lipid mediators",
    interpretation_down: "Reduced eicosanoid signaling"
  },
  microbial: {
    name: "Microbial Metabolism",
    category: "other",
    interpretation_up: "Increased gut microbial metabolite production",
    interpretation_down: "Reduced microbial metabolic activity"
  },
  antioxidant: {
    name: "Antioxidant Defense",
    category: "other",
    interpretation_up: "Active antioxidant response",
    interpretation_down: "Depleted antioxidant defenses — oxidative stress"
  },
  vitamin_metabolism: {
    name: "Vitamin Metabolism",
    category: "other",
    interpretation_up: "Elevated vitamin levels",
    interpretation_down: "Possible vitamin deficiency"
  },
};

export default PATHWAYS;
