export function mapToPathways(features, db) {
  return features.map(f => {
    const key = f.name?.toLowerCase()?.trim();
    const meta = db?.[key];
    return {
      ...f,
      pathways: meta?.pathways || [],
      tags: meta?.tags || []
    };
  });
}
