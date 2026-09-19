import { BaseSelect } from '../../../../../../components/ui';
import { classifyProductImportTasnif } from '../../../../utils/classifyProductImportTasnif';
import { PRODUCT_IMPORT_COLUMN_DEFS } from '../../../../utils/productImportColumns';
import {
  formatImportMoney,
  inputCls,
  isRowDuplicate,
  isRowInvalid,
  isRowNew,
} from '../../../../../../utils/productImportUtils';
import { productImportStatusBadge } from '../../../../utils/productImportStatusBadge';
import ProductImportNameCell from '../ProductImportNameCell';
import ProductImportMarkingCell from './ProductImportMarkingCell';
import ProductImportTasnifCell from './ProductImportTasnifCell';

export default function ProductImportPreviewTable({
  t,
  rows,
  editable,
  categories,
  stores,
  visibleColumns,
  tasnifByRow,
  setRowPrice,
  setRowCategory,
  setRowStore,
  setRowStorageLocation,
  setRowBarcode,
  setRowIkpu,
  setRowMarkedProduct,
}) {
  const cols = PRODUCT_IMPORT_COLUMN_DEFS.filter((c) => visibleColumns[c.id]);

  return (
    <div className="product-import-preview-table">
      <div className="product-import-preview-table__scroll">
        <table>
          <thead>
            <tr>
              {cols.map((col) => (
                <th
                  key={col.id}
                  className={
                    col.id === 'filePrice' || col.id === 'importPrice' || col.id === 'qty'
                      ? 'text-right'
                      : undefined
                  }
                >
                  {t(col.labelKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const ed = editable[r.rowNum];
              const isNew = isRowNew(r);
              const isDup = isRowDuplicate(r);
              const isInv = isRowInvalid(r);
              const tasnif = tasnifByRow?.[r.rowNum];
              const tone = classifyProductImportTasnif(r, tasnif);
              return (
                <tr
                  key={r.rowNum}
                  className={
                    isDup
                      ? 'product-import-row--duplicate is-duplicate'
                      : isInv
                        ? 'is-invalid'
                        : `is-${tone}`
                  }
                >
                  {cols.map((col) => (
                    <td key={col.id} className={cellAlignClass(col.id)}>
                      {renderCell({
                        colId: col.id,
                        t,
                        r,
                        ed,
                        isNew,
                        isDup,
                        categories,
                        stores,
                        tasnif,
                        setRowPrice,
                        setRowCategory,
                        setRowStore,
                        setRowStorageLocation,
                        setRowBarcode,
                        setRowIkpu,
                        setRowMarkedProduct,
                      })}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function cellAlignClass(id) {
  if (id === 'filePrice' || id === 'importPrice' || id === 'qty') return 'text-right';
  return undefined;
}

function renderCell(ctx) {
  const { colId, t, r, ed, isNew, isDup, categories, stores, tasnif } = ctx;

  switch (colId) {
    case 'rowNum':
      return <span className="text-slate-500">{r.rowNum}</span>;
    case 'tasnif':
      return <ProductImportTasnifCell t={t} row={r} tasnif={tasnif} />;
    case 'name':
      return <ProductImportNameCell row={r} />;
    case 'barcode':
      if (isNew && ed) {
        return (
          <input
            type="text"
            value={ed.barcode ?? ''}
            onChange={(e) => ctx.setRowBarcode(r.rowNum, e.target.value)}
            className={inputCls}
            placeholder="—"
          />
        );
      }
      return <span className="font-mono text-xs">{r.barcode || '—'}</span>;
    case 'ikpu':
      if (isNew && ed) {
        return (
          <input
            type="text"
            value={ed.ikpu ?? ''}
            onChange={(e) => ctx.setRowIkpu(r.rowNum, e.target.value)}
            className={inputCls}
            placeholder="—"
          />
        );
      }
      return <span className="font-mono text-xs">{r.ikpu || '—'}</span>;
    case 'marking':
      return (
        <ProductImportMarkingCell
          t={t}
          editable={ed}
          isNew={isNew}
          marked={Boolean(tasnif?.markedProduct)}
          onChange={(value) => ctx.setRowMarkedProduct(r.rowNum, value)}
        />
      );
    case 'qty':
      return formatQty(r.quantity);
    case 'unit':
      return r.unitOfMeasure || '—';
    case 'saleType':
      return r.saleType || r.importSaleType || '—';
    case 'vat':
      return r.taxRatePercent != null ? `${r.taxRatePercent}%` : '—';
    case 'location':
      if (isNew && ed) {
        return (
          <input
            type="text"
            value={ed.storageLocation ?? ''}
            onChange={(e) => ctx.setRowStorageLocation(r.rowNum, e.target.value)}
            placeholder={t('products.import.defaultLocationPh')}
            className={inputCls}
          />
        );
      }
      return <span className="text-slate-500">{r.storageLocation || '—'}</span>;
    case 'filePrice':
      return (
        <>
          {formatImportMoney(r.fileSellingPrice)}
          {isDup && r.existingSellingPrice != null && (
            <div className="text-xs text-amber-600 dark:text-amber-400">
              {t('products.import.inDb')}: {formatImportMoney(r.existingSellingPrice)}
            </div>
          )}
        </>
      );
    case 'importPrice':
      if (isNew && ed) {
        return (
          <input
            type="text"
            className="w-28 rounded border border-slate-300 px-2 py-1 text-right text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            value={ed.importPrice ?? ''}
            onChange={(e) => ctx.setRowPrice(r.rowNum, e.target.value)}
          />
        );
      }
      return '—';
    case 'category':
      if (isNew && ed) {
        return (
          <BaseSelect
            size="sm"
            value={ed.categoryId ?? ''}
            onChange={(e) => ctx.setRowCategory(r.rowNum, e.target.value)}
            placeholder={t('products.import.noCategory')}
            options={[
              { value: '', label: t('products.import.noCategory') },
              ...categories.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
          />
        );
      }
      return '—';
    case 'store':
      if (isNew && ed) {
        return (
          <BaseSelect
            size="sm"
            value={ed.storeId ?? ''}
            onChange={(e) => ctx.setRowStore(r.rowNum, e.target.value)}
            placeholder={t('products.import.noStore')}
            options={[
              { value: '', label: t('products.import.noStore') },
              ...stores.map((s) => ({ value: String(s.id), label: s.name })),
            ]}
          />
        );
      }
      return '—';
    case 'status':
      return (
        <>
          {productImportStatusBadge(r.status, t)}
          {r.message && !isNew && (
            <div
              className={`mt-1 text-xs ${
                isDup ? 'font-medium text-amber-800 dark:text-amber-200' : 'text-slate-500'
              }`}
            >
              {r.message}
            </div>
          )}
        </>
      );
    default:
      return '—';
  }
}

function formatQty(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return String(n);
}
