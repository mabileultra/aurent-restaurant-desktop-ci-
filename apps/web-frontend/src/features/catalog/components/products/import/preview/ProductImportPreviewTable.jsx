import React from 'react';
import { PRODUCT_IMPORT_COLUMN_DEFS } from '../../../../utils/productImportColumns';
import ProductImportPreviewTableRow from './ProductImportPreviewTableRow';

export default function ProductImportPreviewTable({
  t,
  rows,
  editable,
  categories,
  stores,
  visibleColumns,
  tasnifByRow,
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
                  data-col={col.id}
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
            {rows.map((r) => (
              <ProductImportPreviewTableRow
                key={r.rowNum}
                row={r}
                cols={cols}
                ed={editable[r.rowNum]}
                tasnif={tasnifByRow?.[r.rowNum]}
                t={t}
                categories={categories}
                stores={stores}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
