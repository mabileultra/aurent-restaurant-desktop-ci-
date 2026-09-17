export default function PharmacyReceiptImportMatchTable({ t, imp }) {
  return (
    <div className="pharmacy-stock__import-table-wrap">
      <table className="pharmacy-stock__import-table pharmacy-stock__import-table--match">
        <thead>
          <tr>
            <th className="pharmacy-stock__import-num">№</th>
            <th>{t('pharmacyStock.colName')}</th>
            {COLUMNS.map((col) => (
              <th key={col.key}>{t(col.label)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {imp.items.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length + 2}>
                <div className="pharmacy-stock__empty">{t('pharmacyStock.importNoRows')}</div>
              </td>
            </tr>
          ) : imp.items.map((item) => (
            <MatchRow key={item.rowIndex} t={t} item={item} patchItem={imp.patchItem} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatchRow({ item, patchItem }) {
  const ok = item.status !== 'DUPLICATE';
  const patch = (key, value) => patchItem(item.rowIndex, { [key]: value });
  return (
    <tr className={ok ? undefined : 'pharmacy-stock__import-miss'}>
      <td className="pharmacy-stock__import-num">{item.rowIndex + 1}</td>
      <td className="pharmacy-stock__import-name">{item.excelName}</td>
      {COLUMNS.map((col) => (
        <td key={col.key} className="pharmacy-stock__import-edit">
          <ImportCell item={item} col={col} onPatch={patch} />
        </td>
      ))}
    </tr>
  );
}

function ImportCell({ item, col, onPatch }) {
  if (col.kind === 'date') {
    return (
      <input
        className="pharmacy-stock__import-role pharmacy-stock__import-input"
        type="date"
        value={item[col.key] || ''}
        onChange={(e) => onPatch(col.key, e.target.value || null)}
      />
    );
  }
  if (col.kind === 'text') {
    return (
      <input
        className="pharmacy-stock__import-role pharmacy-stock__import-input"
        value={item[col.key] || ''}
        onChange={(e) => onPatch(col.key, e.target.value)}
      />
    );
  }
  return (
    <input
      className="pharmacy-stock__import-role pharmacy-stock__import-input"
      type="number"
      min="0"
      step={col.step}
      value={item[col.key] ?? ''}
      onChange={(e) => onPatch(col.key, e.target.value === '' ? null : Number(e.target.value))}
    />
  );
}

const COLUMNS = [
  { key: 'quantity', label: 'pharmacyStock.colQty', kind: 'number', step: '0.001' },
  { key: 'purchasePrice', label: 'pharmacyStock.purchasePrice', kind: 'number', step: '0.01' },
  { key: 'vatPercent', label: 'pharmacyStock.vatRate', kind: 'number', step: '0.01' },
  { key: 'retailPrice', label: 'pharmacyStock.importSellingPrice', kind: 'number', step: '0.01' },
  { key: 'barcode', label: 'pharmacyStock.colBarcode', kind: 'text' },
  { key: 'ikpu', label: 'pharmacyStock.colIkpu', kind: 'text' },
  { key: 'unitsInPack', label: 'pharmacyStock.unitsInPack', kind: 'number', step: '1' },
  { key: 'batchNumber', label: 'pharmacyStock.batch', kind: 'text' },
  { key: 'expiryDate', label: 'pharmacyStock.expiry', kind: 'date' },
  { key: 'manufacturer', label: 'pharmacyStock.colManufacturer', kind: 'text' },
  { key: 'country', label: 'pharmacyStock.colCountry', kind: 'text' },
];
