/**
 * CSV export utility for tax analytics tables and reports.
 * Includes UTF-8 BOM for correct Uzbek/Cyrillic character display in Excel.
 */

export function buildCsvContent(headers, rows) {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map((r) => r.map(escapeCell).join(','));

  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}

export function exportToCsv(filename, headers, rows) {
  const content = buildCsvContent(headers, rows);

  if (typeof window === 'undefined' || !window.document?.createElement) {
    return content;
  }

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
