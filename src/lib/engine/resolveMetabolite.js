/**
 * MetaFlux Metabolite Resolver
 *
 * Resolution order:
 *  1. Direct key lookup in static DB
 *  2. AliasOf chain resolution
 *  3. Stereo-prefix / charge stripping
 *  4. Dynamic species parsing (acylcarnitine, FA, phospholipid, etc.)
 */

import db from "../knowledge/metabolites_full.json";
import { parseSpecies, chainLengthTags } from "./speciesParser";
import { normalizeName as normalizeWithSynonyms } from "./normalize";

// ─── Static DB helpers ────────────────────────────────────────────────────────

function normalizeKey(rawName) {
  return rawName
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/\s+/g, "-")
    .replace(/_/g, "-");
}

function resolveAlias(key, visited = new Set()) {
  if (visited.has(key)) return key; // cycle guard
  visited.add(key);

  const entry = db[key];
  if (!entry) return key;

  if (entry.aliasOf) return resolveAlias(entry.aliasOf, visited);

  return key;
}

function staticLookup(key) {
  if (db[key]) return db[resolveAlias(key)];

  // strip stereo prefix
  const stripped = key.replace(/^(l|d)-/, "");
  if (db[stripped]) return db[resolveAlias(stripped)];

  // strip parentheticals + ionic charges
  const cleaned = key
    .replace(/\(.*?\)/g, "")
    .replace(/[+\-]+$/, "")
    .replace(/-+$/, "")
    .trim();

  if (db[cleaned]) return db[resolveAlias(cleaned)];

  const strippedCleaned = cleaned.replace(/^(l|d)-/, "");
  if (db[strippedCleaned]) return db[resolveAlias(strippedCleaned)];

  return null;
}

// ─── Dynamic resolution from parsed species ───────────────────────────────────

function buildFromParsed(rawName, parsed) {
  switch (parsed.type) {
    case "acylcarnitine": {
      const clTags = chainLengthTags(parsed.chainLength);

      return {
        canonical: rawName,
        category: "Lipid",
        hmdbClass: "Acylcarnitine",
        pathways: ["fatty_acid_oxidation", "carnitine_shuttle"],
        tags: [
          "lipid",
          "carnitine",
          "fa",
          "fa_transport",
          ...clTags,
          parsed.hydroxyl ? "hydroxy_fa" : null,
          parsed.dicarboxyl ? "dicarboxyl_fa" : null,
          parsed.unsaturation === "pufa" ? "pufa" : null,
          parsed.unsaturation === "mufa" ? "mufa" : null,
        ].filter(Boolean),
        _parsed: parsed,
      };
    }

    case "fatty_acid": {
      const clTags = chainLengthTags(parsed.chainLength);

      const tags = ["lipid", "fa", ...clTags];

      if (parsed.hydroxyl) tags.push("hydroxy_fa");
      if (parsed.omega3) tags.push("omega3", "pufa");
      if (parsed.omega6) tags.push("omega6", "pufa");
      if (parsed.unsaturation === "mufa") tags.push("mufa");
      if (
        parsed.unsaturation === "pufa" &&
        !parsed.omega3 &&
        !parsed.omega6
      )
        tags.push("pufa");
      if (parsed.branched) tags.push("branched_fa");

      const paths = ["fatty_acid_oxidation"];
      if (parsed.omega3 || parsed.omega6)
        paths.push("eicosanoid_metabolism");

      return {
        canonical: rawName,
        category: "Lipid",
        hmdbClass: "Fatty acid",
        pathways: paths,
        tags,
        _parsed: parsed,
      };
    }

    case "phospholipid": {
      const tags = [
        "lipid",
        "membrane",
        "phospholipid",
        parsed.headgroup,
      ];

      if (parsed.lyso) tags.push("lyso");

      const paths = ["phospholipid_metabolism"];
      if (parsed.headgroup === "phosphatidylcholine")
        paths.push("methionine_cycle");

      return {
        canonical: rawName,
        category: "Lipid",
        hmdbClass: "Phospholipid",
        pathways: paths,
        tags,
        _parsed: parsed,
      };
    }

    case "sphingolipid": {
      const clTags = chainLengthTags(parsed.chainLength);

      const tags = [
        "lipid",
        "sphingolipid",
        "membrane",
        parsed.subtype,
        ...clTags,
      ];

      if (parsed.hydroxyl) tags.push("hydroxy_fa");

      if (
        ["ceramide", "glucosylceramide", "galactosylceramide"].includes(
          parsed.subtype
        )
      ) {
        tags.push("inflammatory", "apoptosis");
      }

      return {
        canonical: rawName,
        category: "Lipid",
        hmdbClass: "Sphingolipid",
        pathways: ["sphingolipid_metabolism", "phospholipid_metabolism"],
        tags,
        _parsed: parsed,
      };
    }

    case "eicosanoid": {
      const tags = ["lipid", "eicosanoid", "inflammatory", parsed.subtype];

      if (parsed.subtype === "specialized_proresolving") {
        tags.push("anti_inflammatory", "omega3");
      }

      return {
        canonical: rawName,
        category: "Lipid",
        hmdbClass: "Eicosanoid",
        pathways: ["eicosanoid_metabolism"],
        tags,
        _parsed: parsed,
      };
    }

    case "acyl_coa": {
      const clTags = chainLengthTags(parsed.chainLength);

      return {
        canonical: rawName,
        category: "Cofactor",
        hmdbClass: "Acyl-CoA",
        pathways: ["fatty_acid_oxidation", "tca_cycle"],
        tags: ["lipid", "fa", "cofactor", ...clTags],
        _parsed: parsed,
      };
    }

    default:
      return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Resolve a raw metabolite name to its metadata object.
 * Returns null if completely unrecognized.
 */
export function resolveMetabolite(rawName) {
  if (!rawName) return null;

  const key = normalizeKey(rawName);

  // 1. Static DB (raw key)
  const staticHit = staticLookup(key);
  if (staticHit) return staticHit;

  // 2. Synonym-normalized key
  const synKey = normalizeWithSynonyms(rawName);
  if (synKey !== key) {
    const synHit = staticLookup(synKey);
    if (synHit) return synHit;
  }

  // 3. Dynamic species parser
  const parsed = parseSpecies(key);
  if (parsed) return buildFromParsed(rawName, parsed);

  return null;
}

/**
 * Normalize a raw name to its canonical key (for dataMap).
 * Falls back to best-effort key.
 */
export function normalizeName(rawName) {
  if (!rawName) return "";
  // Delegate entirely to the synonym-aware normalizer
  return normalizeWithSynonyms(rawName);
}
