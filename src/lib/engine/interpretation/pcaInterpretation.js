export function extractTopFromPCA(pca, topN = 20) {
  if (!pca?.loadings || !pca?.metabolites) return [];

  return pca.loadings
    .map((val, i) => ({
      name: pca.metabolites[i],
      importance: Math.abs(val || 0),
      direction: Math.sign(val || 0)
    }))
    .filter(x => x.name)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, topN);
}
