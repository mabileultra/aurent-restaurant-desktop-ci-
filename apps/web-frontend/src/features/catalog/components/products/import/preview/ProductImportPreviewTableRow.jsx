import React from 'react';
import { classifyProductImportTasnif } from '../../../../utils/classifyProductImportTasnif';
import {
  isRowDuplicate,
  isRowInvalid,
  isRowNew,
} from '../../../../../../utils/productImportUtils';
import ProductImportPreviewCell from './ProductImportPreviewCell';

export function cellAlignClass(id) {
  if (id === 'filePrice' || id === 'importPrice' || id === 'qty') return 'text-right';
  return undefined;
}

export default function ProductImportPreviewTableRow({
  row,
  cols,
  ed,
  tasnif,
  t,
  categories,
  stores,
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
  const isNew = isRowNew(row);
  const isDup = isRowDuplicate(row);
  const isInv = isRowInvalid(row);
  const tone = classifyProductImportTasnif(row, tasnif);

  return (
    <tr
      className={
        isDup
          ? 'product-import-row--duplicate is-duplicate'
          : isInv
            ? 'is-invalid'
            : `is-${tone}`
      }
    >
      {cols.map((col) => (
        <td key={col.id} data-col={col.id} className={cellAlignClass(col.id)}>
          <ProductImportPreviewCell
            colId={col.id}
            t={t}
            r={row}
            ed={ed}
            isNew={isNew}
            isDup={isDup}
            categories={categories}
            stores={stores}
            tasnif={tasnif}
            setRowQuantity={setRowQuantity}
            setRowQuantityValue={setRowQuantityValue}
            setRowPrice={setRowPrice}
            setRowCategory={setRowCategory}
            setRowStore={setRowStore}
            setRowStorageLocation={setRowStorageLocation}
            setRowBarcode={setRowBarcode}
            setRowIkpu={setRowIkpu}
            setRowMarkedProduct={setRowMarkedProduct}
          />
        </td>
      ))}
    </tr>
  );
}
