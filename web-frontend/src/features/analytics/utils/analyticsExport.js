/**
 * CSV and Excel SpreadsheetML export utilities for tax analytics reports.
 * Includes UTF-8 BOM for CSV and standard XML Spreadsheet 2003 for native Excel opening.
 */

function escapeXml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

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

export function buildExcelContent(headers, rows) {
  const headerCells = headers
    .map((h) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
    .join('');

  const rowLines = rows
    .map((r) => {
      const cells = r
        .map((val) => {
          const isNum = typeof val === 'number' && !Number.isNaN(val);
          const type = isNum ? 'Number' : 'String';
          const content = isNum ? val : escapeXml(val);
          return `<Cell><Data ss:Type="${type}">${content}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('\n    ');

  return `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Hisobot">
  <Table>
    <Row>${headerCells}</Row>
    ${rowLines}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function exportToExcel(filename, headers, rows) {
  const content = buildExcelContent(headers, rows);

  if (typeof window === 'undefined' || !window.document?.createElement) {
    return content;
  }

  const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.xml') || filename.endsWith('.xls') ? filename : `${filename}.xml`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
