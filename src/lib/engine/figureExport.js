/**
 * Export utilities for charts (PNG + PDF)
 */

import { jsPDF } from 'jspdf';

/**
 * Export a recharts chart div as a high-res PNG.
 * Relies on html2canvas (already installed).
 */
export async function exportFigurePNG(elementId, filename = 'figure') {
  const html2canvas = (await import('html2canvas')).default;

  const el = document.getElementById(elementId);
  if (!el) return;

  const canvas = await html2canvas(el, {
    scale: 3,
    backgroundColor: '#ffffff',
    useCORS: true
  });

  const url = canvas.toDataURL('image/png');

  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.png`;
  a.click();
}

/**
 * Export a recharts chart div as a PDF.
 */
export async function exportFigurePDF(elementId, filename = 'figure') {
  const html2canvas = (await import('html2canvas')).default;

  const el = document.getElementById(elementId);
  if (!el) return;

  const canvas = await html2canvas(el, {
    scale: 3,
    backgroundColor: '#ffffff',
    useCORS: true
  });

  const url = canvas.toDataURL('image/png');

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // A4 landscape: 297 x 210 mm, leave 10mm margins
  pdf.addImage(url, 'PNG', 10, 10, 277, 155);

  pdf.save(`${filename}.pdf`);
}
