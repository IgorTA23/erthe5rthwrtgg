/**
 * MetaFlux Species Parser
 * Recognizes structured lipid/metabolite names and maps them to canonical classes.
 * Handles acylcarnitines, fatty acids, phospholipids, sphingolipids, and more.
 */

// Named fatty acid chains → carbon length
const CHAIN_NAME_MAP = {
  formyl: 1,
  acetyl: 2,
  propionyl: 3,
  butyryl: 4,
  isobutyryl: 4,
  valeryl: 5,
  isovaleryl: 5,
  hexanoyl: 6,
  caproyl: 6,
  heptanoyl: 7,
  octanoyl: 8,
  caprylyl: 8,
  nonanoyl: 9,
  decanoyl: 10,
  capryl: 10,
  undecanoyl: 11,
  lauroyl: 12,
  dodecanoyl: 12,
  tridecanoyl: 13,
  myristoyl: 14,
  tetradecanoyl: 14,
  pentadecanoyl: 15,
  palmitoyl: 16,
  hexadecanoyl: 16,
  heptadecanoyl: 17,
  stearoyl: 18,
  octadecanoyl: 18,
  oleoyl: 18,
  elaidoyl: 18,
  linoleoyl: 18,
  linolenoyl: 18,
  nonadecanoyl: 19,
  arachidoyl: 20,
  eicosanoyl: 20,
  arachidonoyl: 20,
  gondoyl: 20,
  heneicosanoyl: 21,
  behenoyl: 22,
  docosanoyl: 22,
  erucoyl: 22,
  docosahexaenoyl: 22,
  lignoceroyl: 24,
  tetracosanoyl: 24,
  cerotoyl: 26,
  montanoyl: 28,
  melissoyl: 30,

  // also handle "anoyl" variants from systematic names
  laurate: 12,
  myristate: 14,
  palmitate: 16,
  stearate: 18,
  oleate: 18,
  linoleate: 18,
  arachidonate: 20,
  docosahexaenoate: 22,
};

// Named chain prefixes without "-oyl"
const CHAIN_PREFIX_MAP = {
  laur: 12,
  myrist: 14,
  palmit: 16,
  stear: 18,
  oleyl: 18,
  arachidon: 20,
};

/**
 * Extract chain length from a metabolite name string.
 */
function extractChainLength(key) {
  // C16, C18:1, C20:4 etc.
  const cMatch = key.match(/\bc(\d+)(?:[:\-]\d+)?\b/);
  if (cMatch) return parseInt(cMatch[1]);

  // numeric standalone like "16:0", "18:1"
  const numMatch = key.match(/\b(\d{2}):\d\b/);
  if (numMatch) return parseInt(numMatch[1]);

  // Named chains
  for (const [name, len] of Object.entries(CHAIN_NAME_MAP)) {
    if (key.includes(name)) return len;
  }

  for (const [prefix, len] of Object.entries(CHAIN_PREFIX_MAP)) {
    if (key.includes(prefix)) return len;
  }

  return null;
}

/**
 * Classify chain length into fa tags.
 */
function chainLengthTags(chainLength) {
  if (chainLength === null) return [];

  if (chainLength <= 6) return ["short_chain_fa", "scfa"];
  if (chainLength <= 12) return ["medium_chain_fa", "mcfa"];
  if (chainLength <= 20) return ["long_chain_fa", "lcfa"];

  return ["very_long_chain_fa", "vlcfa"];
}

/**
 * Detect unsaturation level.
 */
function detectUnsaturation(key) {
  // e.g. C18:2, 18:2
  const match = key.match(/[c:](\d+):\s*(\d+)/);
  if (match) {
    const bonds = parseInt(match[2]);

    if (bonds === 0) return "saturated";
    if (bonds === 1) return "mufa";
    return "pufa";
  }

  if (/mono.?unsaturat|oleoy|elaidoy/.test(key)) return "mufa";
  if (/poly.?unsaturat|linole|arachidon|docosahex|eicosapent/.test(key))
    return "pufa";

  return null;
}

// ─── Acylcarnitine ────────────────────────────────────────────────────────────

export function parseAcylcarnitine(key) {
  if (!key.includes("carnitine")) return null;

  // exclude free carnitine
  if (/^(free.?carnitine|l-carnitine|carnitine)$/.test(key.trim()))
    return null;

  const chainLength = extractChainLength(key);
  const hydroxyl = /hydroxy/.test(key);
  const dicarboxyl = /dicarboxyl|adipoyl|suberyl|sebacoy/.test(key);
  const unsaturation = detectUnsaturation(key);

  return {
    type: "acylcarnitine",
    chainLength,
    hydroxyl,
    dicarboxyl,
    unsaturation,
  };
}

// ─── Fatty Acids ──────────────────────────────────────────────────────────────

export function parseFattyAcid(key) {
  const isFa =
    /fatty.?acid|oic.?acid|oate$|enoate$|anoate$/.test(key) ||
    /\bfa\b|\bfa-c\d/.test(key) ||
    (key.match(/\bc\d{2}/) &&
      !key.includes("carnitine") &&
      !key.includes("coa"));

  if (!isFa) return null;

  const chainLength = extractChainLength(key);
  const hydroxyl = /hydroxy/.test(key);
  const unsaturation = detectUnsaturation(key);

  const omega3 =
    /omega.?3|n-3|epa|dha|docosahex|eicosapent|linolenic/.test(key);

  const omega6 =
    /omega.?6|n-6|arachidonic|linoleic/.test(key);

  const branched = /branched|methyl.?branch|iso|anteiso/.test(key);

  return {
    type: "fatty_acid",
    chainLength,
    hydroxyl,
    unsaturation,
    omega3,
    omega6,
    branched,
  };
}

// ─── Phospholipids ────────────────────────────────────────────────────────────

export function parsePhospholipid(key) {
  const pcMatch = key.match(/^(?:lyso)?pc[(\s]/);
  const peMatch = key.match(/^(?:lyso)?pe[(\s]/);
  const piMatch = key.match(/^(?:lyso)?pi[(\s]/);
  const psMatch = key.match(/^(?:lyso)?ps[(\s]/);
  const pgMatch = key.match(/^(?:lyso)?pg[(\s]/);
  const clMatch = /cardiolipin|cl\(/.test(key);

  const lysoPc = key.startsWith("lyso") && key.includes("pc");
  const lysoPe = key.startsWith("lyso") && key.includes("pe");

  if (
    !pcMatch &&
    !peMatch &&
    !piMatch &&
    !psMatch &&
    !pgMatch &&
    !clMatch &&
    !lysoPc &&
    !lysoPe
  )
    return null;

  let headgroup = "phospholipid";
  let lyso = key.startsWith("lyso");

  if (pcMatch || lysoPc) headgroup = "phosphatidylcholine";
  else if (peMatch || lysoPe) headgroup = "phosphatidylethanolamine";
  else if (piMatch) headgroup = "phosphatidylinositol";
  else if (psMatch) headgroup = "phosphatidylserine";
  else if (pgMatch) headgroup = "phosphatidylglycerol";
  else if (clMatch) headgroup = "cardiolipin";

  return {
    type: "phospholipid",
    headgroup,
    lyso,
  };
}

// ─── Sphingolipids ────────────────────────────────────────────────────────────

export function parseSphingoLipid(key) {
  const isSphingo =
    /ceramide|sphingomyelin|sphingosine|sphinganine|glucosylcer|galactosylcer|lactosylcer|ganglioside|cer\(|sm\(/.test(
      key
    );

  if (!isSphingo) return null;

  let subtype = "ceramide";

  if (/sphingomyelin|sm\(/.test(key)) subtype = "sphingomyelin";
  else if (/glucosylcer/.test(key)) subtype = "glucosylceramide";
  else if (/galactosylcer/.test(key)) subtype = "galactosylceramide";
  else if (/lactosylcer/.test(key)) subtype = "lactosylceramide";
  else if (/ganglioside/.test(key)) subtype = "ganglioside";
  else if (/sphingosine/.test(key)) subtype = "sphingosine";

  const chainLength = extractChainLength(key);
  const hydroxyl = /hydroxy/.test(key);

  return {
    type: "sphingolipid",
    subtype,
    chainLength,
    hydroxyl,
  };
}

// ─── Acyl-CoA ────────────────────────────────────────────────────────────────

export function parseAcylCoA(key) {
  if (!key.includes("coa") && !key.includes("coenzyme-a")) return null;
  if (/^coenzyme.?a$|^coa$/.test(key.trim())) return null;

  const chainLength = extractChainLength(key);
  const hydroxyl = /hydroxy/.test(key);

  return {
    type: "acyl_coa",
    chainLength,
    hydroxyl,
  };
}

// ─── Eicosanoids ─────────────────────────────────────────────────────────────

export function parseEicosanoid(key) {
  const isEico =
    /prostaglandin|leukotriene|thromboxane|hete|hpete|lipoxin|resolvin|protectin|maresins|oxylipins?/.test(
      key
    );

  if (!isEico) return null;

  let subtype = "eicosanoid";

  if (/prostaglandin/.test(key)) subtype = "prostaglandin";
  else if (/leukotriene/.test(key)) subtype = "leukotriene";
  else if (/thromboxane/.test(key)) subtype = "thromboxane";
  else if (/hete/.test(key)) subtype = "hete";
  else if (/resolvin|protectin|maresins/.test(key))
    subtype = "specialized_proresolving";

  return {
    type: "eicosanoid",
    subtype,
  };
}

// ─── Master parser ────────────────────────────────────────────────────────────

export function parseSpecies(rawName) {
  const key = rawName
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/\s+/g, " ");

  return (
    parseAcylcarnitine(key) ||
    parsePhospholipid(key) ||
    parseSphingoLipid(key) ||
    parseEicosanoid(key) ||
    parseAcylCoA(key) ||
    parseFattyAcid(key) ||
    null
  );
}

export { extractChainLength, chainLengthTags, detectUnsaturation };
