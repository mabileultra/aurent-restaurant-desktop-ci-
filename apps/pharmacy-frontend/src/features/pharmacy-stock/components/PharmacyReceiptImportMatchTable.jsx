import { classifyPharmacyImportMatch } from '../utils/classifyPharmacyImportMatch';
import '../styles/pharmacy-import-match-table.css';

export default function PharmacyReceiptImportMatchTable({ t, imp }) {
  const visible = imp.items;
  const selectable = visible.filter((item) => classifyPharmacyImportMatch(item) !== 'duplicate');
  const allChecked = selectable.length > 0 && selectable.every((item) => item.selected);
  const colspan = COLUMNS.length + 5;

  return (
    <div className="pharmacy-stock__import-table-wrap">
      <table className="pharmacy-stock__import-table pharmacy-stock__import-table--match pharmacy-import-match-table">
        <thead>
          <tr>
            <th className="pharmacy-stock__import-check">
              <input
                type="checkbox"
                className="pharmacy-stock__checkbox"
                checked={allChecked}
                disabled={!selectable.length}
                onChange={() => imp.setVisibleSelected(!allChecked)}
                aria-label={t('pharmacyStock.selectAll')}
              />
            </th>
            <th className="pharmacy-stock__import-num">№</th>
            <th>{t('pharmacyStock.importMatch.status')}</th>
            <th>{t('pharmacyStock.colName')}</th>
            <th>{t('pharmacyStock.importRole.MARK_CODES')}</th>
            {COLUMNS.map((col) => (
              <th key={col.key}>{t(col.label)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 ? (
            <tr>
              <td colSpan={colspan}>
                <div className="pharmacy-stock__empty">{t('pharmacyStock.importNoRows')}</div>
              </td>
            </tr>
          ) : visible.map((item) => (
            <MatchRow key={item.rowIndex} t={t} item={item} imp={imp} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatchRow({ t, item, imp }) {
  const tone = classifyPharmacyImportMatch(item);
  const locked = tone === 'duplicate';
  const patch = (key, value) => imp.patchItem(item.rowIndex, { [key]: value });
  return (
    <tr className={`is-${tone}`}>
      <td className="pharmacy-stock__import-check">
        <input
          type="checkbox"
          className="pharmacy-stock__checkbox"
          checked={Boolean(item.selected) && !locked}
          disabled={locked}
          onChange={() => imp.toggleSelected(item.rowIndex)}
          aria-label={t('pharmacyStock.selectRow')}
        />
      </td>
      <td className="pharmacy-stock__import-num">{item.rowIndex + 1}</td>
      <td>
        <span className={`pharmacy-import-match__status is-${tone}`}>
          {t(`pharmacyStock.importMatch.${tone}`)}
        </span>
        <p className="pharmacy-import-match__note">{t(`pharmacyStock.importMatch.${tone}Hint`)}</p>
      </td>
      <td className="pharmacy-stock__import-name">{item.excelName}</td>
      <td className="pharmacy-stock__import-marks">
        {Array.isArray(item.markCodes) && item.markCodes.length
          ? item.markCodes.length
          : '—'}
      </td>
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
  { key: 'retailPrice', label: 'pharmacyStock.retailPrice', kind: 'number', step: '0.01' },
  { key: 'barcode', label: 'pharmacyStock.colBarcode', kind: 'text' },
  { key: 'ikpu', label: 'pharmacyStock.colIkpu', kind: 'text' },
  { key: 'unitsInPack', label: 'pharmacyStock.unitsInPack', kind: 'number', step: '1' },
  { key: 'batchNumber', label: 'pharmacyStock.batch', kind: 'text' },
  { key: 'expiryDate', label: 'pharmacyStock.expiry', kind: 'date' },
  { key: 'manufacturer', label: 'pharmacyStock.colManufacturer', kind: 'text' },
  { key: 'country', label: 'pharmacyStock.colCountry', kind: 'text' },
];
