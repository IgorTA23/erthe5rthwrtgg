import db from "../knowledge/metabolites_full.json";

function clean(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/α/g, "alpha")
    .replace(/β/g, "beta")
    .replace(/γ/g, "gamma")
    .replace(/δ/g, "delta")
    .replace(/['"]/g, "")
    .replace(/\s+/g, "-")
    .replace(/_/g, "-")
    .replace(/\(.*?\)/g, "")
    .replace(/ic-acid$/, "ate")
    .replace(/ic$/, "ate")
    .replace(/-p$/, "-phosphate") // creatine-p → creatine-phosphate
    .replace(/^(l|d)-/, "")
    .replace(/-+/g, "-")
    .replace(/-+$/, "");
}

function buildIndex() {
  const index = {};

  Object.entries(db).forEach(([key, meta]) => {
    // canonical key
    index[clean(key)] = key;

    // synonyms
    (meta.synonyms || []).forEach((s) => {
      index[clean(s)] = key;
    });
  });

  // ── Critical manual mappings ───────────────────────────────────────────────

  // TCA intermediates
  index["2-oxoglutarate"] = "alpha-ketoglutarate";
  index["2-oxoglutaric-acid"] = "alpha-ketoglutarate";
  index["2-oxoglutaric"] = "alpha-ketoglutarate";
  index["alpha-ketoglutaric"] = "alpha-ketoglutarate";
  index["ketoglutarate"] = "alpha-ketoglutarate";

  index["oxaloacetate"] = "oxaloacetate";
  index["oxaloacetic-acid"] = "oxaloacetate";
  index["oxalacetate"] = "oxaloacetate";

  index["cis-aconitate"] = "isocitrate";
  index["aconitate"] = "isocitrate";

  index["3-hydroxy-3-methylglutaryl-coa"] =
    "hydroxymethylglutaryl-coa";
  index["hmg-coa"] = "hydroxymethylglutaryl-coa";

  // Glucose / sugars
  index["dextrose"] = "glucose";
  index["blood-glucose"] = "glucose";

  // Lactate
  index["lactic-acid"] = "lactate";

  // Pyruvate
  index["pyruvic-acid"] = "pyruvate";

  // Fatty acids
  index["palmitic-acid"] = "palmitate";
  index["stearic-acid"] = "stearate";
  index["oleic-acid"] = "oleate";
  index["linoleic-acid"] = "linoleate";
  index["arachidonic-acid"] = "arachidonate";
  index["dha"] = "docosahexaenoate";
  index["docosahexaenoic-acid"] = "docosahexaenoate";
  index["epa"] = "eicosapentaenoate";
  index["eicosapentaenoic-acid"] = "eicosapentaenoate";

  // Ketones
  index["3-hydroxybutyric-acid"] = "beta-hydroxybutyrate";
  index["3-hydroxybutyr"] = "beta-hydroxybutyrate";
  index["beta-hydroxybutyric-acid"] = "beta-hydroxybutyrate";
  index["acetoacetic-acid"] = "acetoacetate";

  // Amino acids
  index["aspartic-acid"] = "aspartate";
  index["glutamic-acid"] = "glutamate";
  index["phenylalanine"] = "phenylalanine";
  index["tyrosine"] = "tyrosine";

  // Redox
  index["gsh"] = "glutathione";
  index["reduced-glutathione"] = "glutathione";
  index["gssg"] = "glutathione-disulfide";
  index["oxidized-glutathione"] = "glutathione-disulfide";

  // Nucleotides
  index["adenosine-triphosphate"] = "atp";
  index["adenosine-diphosphate"] = "adp";
  index["adenosine-monophosphate"] = "amp";
  index["uric-acid"] = "uric-acid";

  // Microbial
  index["trimethylamine-n-oxide"] = "trimethylamine-n-oxide";
  index["trimethylamine-oxide"] = "trimethylamine-n-oxide";

  // SAM / methylation
  index["s-adenosyl-methionine"] = "s-adenosylmethionine";
  index["s-adenosyl-l-methionine"] = "s-adenosylmethionine";
  index["sam"] = "s-adenosylmethionine";

  // Creatine / phosphocreatine
  index["creatine-phosphate"] = "phosphocreatine";
  index["phospho-creatine"] = "phosphocreatine";
  index["creatine-p"] = "phosphocreatine";

  return index;
}

export const synonymIndex = buildIndex();
