export function runDirectionalRules(pathways, metabolites) {
  const map = Object.fromEntries(pathways.map(p => [p.pathway, p]));
  const results = [];

  if (map['glycolysis']?.up > 5 && map['tca_cycle']?.down > 3) {
    results.push({
      message: 'Upregulated glycolysis with suppressed TCA cycle indicates metabolic rewiring toward aerobic glycolysis'
    });
  }

  const acylUp = metabolites.filter(
    m => m.tags?.includes('carnitine') && m.direction > 0
  ).length;

  if (map['fatty_acid_oxidation']?.down > 3 && acylUp > 3) {
    results.push({
      message: 'Elevated acylcarnitines with reduced FAO pathway activity suggests impaired mitochondrial beta-oxidation'
    });
  }

  if (map['redox']?.up > 4 && map['tca_cycle']?.down > 2) {
    results.push({
      message: 'Redox pathway activation with reduced TCA flux suggests mitochondrial dysfunction and altered NAD+/NADH balance'
    });
  }

  return results;
}
