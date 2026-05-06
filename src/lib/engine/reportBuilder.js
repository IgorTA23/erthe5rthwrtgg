/**
 * reportBuilder.js
 * Merges PCA loadings + VIP scores into top features,
 * maps them to biological context, and builds a text report.
 */

import { resolveMetabolite } from './resolveMetabolite.js';

/**
 * Merge PC1 loading magnitude + VIP into a ranked feature list.
 */
export function mergeTopFeatures(loadings, vipList, topN = 10) {
  const vipMap = {};

  (vipList || []).forEach((v) => {
    vipMap[v.name.toLowerCase()] = v.vip;
  });

  const scored = (loadings || []).map((l) => {
    const pc1Abs = Math.abs(l.pc1 ?? 0);
    const vip = vipMap[l.name.toLowerCase()] ?? 0;

    const composite = pc1Abs * 0.5 + (vip / 3) * 0.5;

    return {
      name: l.name,
      pc1: l.pc1,
      vip,
      composite
    };
  });

  return scored
    .sort((a, b) => b.composite - a.composite)
    .slice(0, topN);
}

/**
 * Map a list of metabolite names to their biological metadata.
 */
export function mapFeaturesToBiology(names) {
  const pathwayCounts = {};
  const tagCounts = {};
  const mapped = [];

  names.forEach((name) => {
    const meta = resolveMetabolite(name);

    if (meta) {
      mapped.push({ name, ...meta });

      (meta.pathways || []).forEach((p) => {
        pathwayCounts[p] = (pathwayCounts[p] || 0) + 1;
      });

      (meta.tags || []).forEach((t) => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    } else {
      mapped.push({
        name,
        category: 'unknown',
        pathways: [],
        tags: []
      });
    }
  });

  const topPathways = Object.entries(pathwayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([p, count]) => ({ pathway: p, count }));

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t, count]) => ({ tag: t, count }));

  return {
    mapped,
    topPathways,
    topTags
  };
}

/**
 * Build a plain-text/markdown report from pipeline results.
 */
export function buildReport({
  parsedMatrix,
  pcaResult,
  plsdaResult,
  vipList,
  biology
}) {
  const { sampleNames, metaboliteNames } = parsedMatrix;
  const date = new Date().toLocaleString();

  let r = `# MetaFlux Insight — Analysis Report\n\n`;
  r += `**Generated:** ${date}\n\n---\n\n`;

  r += `## Dataset\n`;
  r += `- **Samples:** ${sampleNames.length}\n`;
  r += `- **Metabolites:** ${metaboliteNames.length}\n\n`;

  r += `## PCA\n`;
  r += `- PC1 variance explained: **${pcaResult.explainedVariance[0]}%**\n`;
  r += `- PC2 variance explained: **${pcaResult.explainedVariance[1]}%**\n\n`;

  if (plsdaResult && vipList?.length) {
    const topVIP = vipList.slice(0, 5);

    r += `## PLS-DA\n`;
    r += `- Top discriminant metabolites (VIP ≥ 1): **${
      vipList.filter((v) => v.vip >= 1).length
    }**\n`;
    r += `- Top VIP features:\n`;

    topVIP.forEach((v) => {
      r += `- ${v.name}: ${v.vip.toFixed(3)}\n`;
    });

    r += `\n`;
  }

  if (biology?.topFeatures?.length) {
    r += `## Key Features (PC1 + VIP)\n`;

    biology.topFeatures.slice(0, 8).forEach((f) => {
      r += `- **${f.name}** — PC1 loading: ${
        f.pc1?.toFixed(3) ?? 'N/A'
      }, VIP: ${f.vip?.toFixed(3) ?? 'N/A'}\n`;
    });

    r += `\n`;
  }

  if (biology?.topPathways?.length) {
    r += `## Enriched Pathways\n`;

    biology.topPathways.forEach((p) => {
      const label =
        typeof p === 'string'
          ? p
          : p.pathway?.replace(/_/g, ' ');

      const count = p.count ?? '';

      r += `- ${label}${
        count ? ` (${count} feature${count > 1 ? 's' : ''})` : ''
      }\n`;
    });

    r += `\n`;
  }

  if (biology?.topTags?.length) {
    r += `## Biological Tags\n`;

    biology.topTags.forEach((t) => {
      r += `- ${t.tag} (${t.count})\n`;
    });

    r += `\n`;
  }

  if (biology?.rules?.length) {
    r += `## Biological Interpretation\n`;

    biology.rules.forEach((rule) => {
      r += `- ${rule.message}\n`;
    });

    r += `\n`;
  }

  r += `---\n\n⚠️ *Research use only. Not a clinical diagnostic tool.*\n`;

  return r;
}

/**
 * Generate an exportable HTML string from a markdown-like report.
 */
export function generateReportHTML(reportText) {
  const escaped = reportText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const html = escaped
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>MetaFlux Report</title>
<style>
body{font-family:sans-serif;max-width:860px;margin:40px auto;padding:0 20px;line-height:1.6;color:#222;}
h1{color:#0d9488;}
h2{color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:4px;}
ul{padding-left:1.5em;}
li{margin:2px 0;}
strong{color:#111;}
</style>
</head>
<body>${html}</body>
</html>`;
}

/**
 * Trigger a browser download of the HTML report.
 */
export function exportPDF(reportText, filename = 'metaflux-report.html') {
  const html = generateReportHTML(reportText);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
