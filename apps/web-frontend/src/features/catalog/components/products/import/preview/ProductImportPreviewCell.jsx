import React from 'react';
import { BaseSelect } from '../../../../../../components/ui';
import {
  formatImportMoney,
  inputCls,
} from '../../../../../../utils/productImportUtils';
import { productImportStatusBadge } from '../../../../utils/productImportStatusBadge';
import ProductImportNameCell from '../ProductImportNameCell';
import ProductImportQtyStepper from './ProductImportQtyStepper';
import ProductImportIkpuCell from './ProductImportIkpuCell';
import ProductImportMarkingCell from './ProductImportMarkingCell';
import ProductImportTasnifCell from './ProductImportTasnifCell';

export function formatQty(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return String(n);
}

export default function ProductImportPreviewCell({
  colId,
  t,
  r,
  ed,
  isNew,
  isDup,
  categories = [],
  stores = [],
  tasnif,
  setRowQuantity,
  setRowQuantityValue,
  setRowPrice,
  setRowCategory,
  setRowStore,
  setRowStorageLocation,
  setRowBarcode,
  setRowIkpu,
  setRowMarkedProduct,
}) {
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
            onChange={(e) => setRowBarcode?.(r.rowNum, e.target.value)}
            className={inputCls}
            placeholder="—"
          />
        );
      }
      return <span className="font-mono text-xs">{r.barcode || '—'}</span>;
    case 'ikpu': {
      const ikpuValue = isNew && ed ? (ed.ikpu ?? '') : (r.ikpu ?? '');
      return (
        <ProductImportIkpuCell
          value={ikpuValue}
          editable={Boolean(isNew && ed)}
          onChange={(value) => setRowIkpu?.(r.rowNum, value)}
        />
      );
    }
    case 'marking':
      return (
        <ProductImportMarkingCell
          t={t}
          editable={ed}
          isNew={isNew}
          marked={Boolean(tasnif?.markedProduct)}
          onChange={(value) => setRowMarkedProduct?.(r.rowNum, value)}
        />
      );
    case 'qty':
      if (isNew && ed) {
        return (
          <ProductImportQtyStepper
            value={ed.quantity}
            minusLabel={t('products.import.qtyMinus')}
            plusLabel={t('products.import.qtyPlus')}
            onMinus={() => setRowQuantity?.(r.rowNum, -1)}
            onPlus={() => setRowQuantity?.(r.rowNum, 1)}
            onChange={(raw) => setRowQuantityValue?.(r.rowNum, raw)}
          />
        );
      }
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
            onChange={(e) => setRowStorageLocation?.(r.rowNum, e.target.value)}
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
            onChange={(e) => setRowPrice?.(r.rowNum, e.target.value)}
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
            onChange={(e) => setRowCategory?.(r.rowNum, e.target.value)}
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
            onChange={(e) => setRowStore?.(r.rowNum, e.target.value)}
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
