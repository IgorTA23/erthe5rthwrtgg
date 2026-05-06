import { synonymIndex } from "./synonymIndex";

export function normalizeName(name) {
  if (!name) return "";

  let key = name.toLowerCase().trim();

  // Greek symbols
  key = key.replace(/α/g, "alpha");
  key = key.replace(/β/g, "beta");
  key = key.replace(/γ/g, "gamma");
  key = key.replace(/δ/g, "delta");

  // Formatting
  key = key
    .replace(/['"]/g, "")
    .replace(/\s+/g, "-")
    .replace(/_/g, "-")
    .replace(/\(.*?\)/g, "")
    .replace(/-+$/, "");

  // Acid → conjugate base
  key = key.replace(/ic-acid$/, "ate");
  key = key.replace(/ic$/, "ate");

  // Stereo prefix
  key = key.replace(/^(l|d)-/, "");

  // Synonym index lookup
  if (synonymIndex[key]) return synonymIndex[key];

  // Word-flip fallback: "creatine phosphate" → "phosphate creatine" → tries reversed
  const flipped = tryWordFlip(key, synonymIndex);
  if (flipped) return flipped;

  return key;
}

function tryWordFlip(key, index) {
  const parts = key.split("-");

  if (parts.length === 2) {
    const flipped = `${parts[1]}-${parts[0]}`;
    if (index[flipped]) return index[flipped];
  }

  return null;
}
