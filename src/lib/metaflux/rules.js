// Pattern-matching rules for metabolic signatures
const RULES = [
  {
    name: "Warburg Effect",
    conditions: [
      { metabolite: "lactate", direction: "up" },
      { metabolite: "glucose", direction: "up" }
    ],
    message: "Pattern suggests increased aerobic glycolysis (Warburg-like metabolism) — characteristic of hypoxia, cancer metabolism, or mitochondrial dysfunction",
    weight: 0.9
  },
  {
    name: "FAO Impairment",
    conditions: [
      { tag: "carnitine", direction: "down" }
    ],
    message: "Reduced acyl-carnitine levels indicate impaired fatty acid oxidation — lipids may accumulate rather than being used for energy",
    weight: 0.85
  },
  {
    name: "Insulin Resistance / BCAA Signature",
    conditions: [
      { metabolite: "leucine", direction: "up" },
      { metabolite: "isoleucine", direction: "up" },
      { metabolite: "valine", direction: "up" }
    ],
    message: "Elevated branched-chain amino acids are a hallmark of insulin resistance and metabolic syndrome",
    weight: 0.88
  },
  {
    name: "Ketotic State",
    conditions: [
      { tag: "ketone", direction: "up" }
    ],
    message: "Active ketogenesis — suggests fasting, carbohydrate restriction, insulin deficiency, or fat-adapted metabolism",
    weight: 0.82
  },
  {
    name: "Energy Stress / ATP Depletion",
    conditions: [
      { metabolite: "atp", direction: "down" },
      { metabolite: "amp", direction: "up" }
    ],
    message: "Low ATP with elevated AMP indicates energy stress — AMPK signaling is likely activated",
    weight: 0.87
  },
  {
    name: "Mitochondrial Suppression",
    conditions: [
      { tag: "tca", direction: "down" },
      { tag: "mitochondria", direction: "down" }
    ],
    message: "Broad downregulation of TCA cycle intermediates suggests mitochondrial dysfunction or reduced oxidative phosphorylation",
    weight: 0.9
  },
  {
    name: "Anaerobic Shift",
    conditions: [
      { tag: "anaerobic", direction: "up" },
      { tag: "glycolysis", direction: "up" }
    ],
    message: "Shift toward anaerobic glycolysis — cells favour fermentation over oxidative metabolism",
    weight: 0.85
  },
  {
    name: "Oxidative Stress",
    conditions: [
      { metabolite: "glutathione disulfide", direction: "up" },
      { metabolite: "glutathione", direction: "down" }
    ],
    message: "Depleted reduced glutathione with elevated oxidized form indicates significant oxidative stress",
    weight: 0.88
  },
  {
    name: "Gut Dysbiosis Signal",
    conditions: [
      { tag: "microbial", direction: "up" }
    ],
    message: "Elevated microbial metabolites suggest altered gut microbiome composition or increased intestinal permeability",
    weight: 0.7
  },
  {
    name: "Sphingolipid / Ceramide Accumulation",
    conditions: [
      { tag: "sphingolipid", direction: "up" }
    ],
    message: "Increased ceramide/sphingolipid levels — associated with insulin resistance, inflammation, and lipotoxicity",
    weight: 0.78
  },
  {
    name: "Urea Cycle Overload",
    conditions: [
      { tag: "urea", direction: "up" }
    ],
    message: "Elevated urea cycle intermediates suggest increased protein catabolism or hepatic nitrogen processing",
    weight: 0.72
  },
  {
    name: "One-Carbon Metabolism Impairment",
    conditions: [
      { metabolite: "homocysteine", direction: "up" }
    ],
    message: "Elevated homocysteine indicates impaired one-carbon metabolism — possible folate or B12 deficiency",
    weight: 0.8
  },
  {
    name: "Purine Degradation Increase",
    conditions: [
      { metabolite: "uric acid", direction: "up" },
      { metabolite: "hypoxanthine", direction: "up" }
    ],
    message: "Increased purine catabolism — may indicate tissue damage, cell turnover, or metabolic stress",
    weight: 0.75
  },
  {
    name: "Inflammatory Lipid Activation",
    conditions: [
      { tag: "inflammatory", direction: "up" },
      { tag: "pufa", direction: "up" }
    ],
    message: "Elevated arachidonic acid and inflammatory lipid mediators suggest active inflammation",
    weight: 0.8
  },
  {
    name: "Hepatic Bile Acid Dysregulation",
    conditions: [
      { tag: "bile", direction: "up" }
    ],
    message: "Altered bile acid profile — may indicate hepatic dysfunction or gut microbiome changes affecting enterohepatic cycling",
    weight: 0.73
  }
];

export default RULES;
