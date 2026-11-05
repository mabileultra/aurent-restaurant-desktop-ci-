import { AlertTriangle } from 'lucide-react';
import TablePagination from '../../../components/shared/TablePagination';
import {
  PharmacySelectAllTh,
  PharmacySelectCell,
} from './PharmacyTableSelect';
import PharmacyReceiptLineRowMenu from './PharmacyReceiptLineRowMenu';
import { productAtc } from '../hooks/usePharmacyCatalogOptions';
import { productReceiptOrigin } from '../utils/productReceiptOrigin';
import {
  formatProductUpdatedAt,
  productWasEdited,
} from '../utils/formatPharmacyProductUpdated';
import {
  formatMoney,
  productCountry,
  productDosageForm,
  productManufacturer,
  productUnitsInPack,
} from '../utils/pharmacyReceiptPricing';
import { receiptTypeLabel } from '../utils/pharmacyReceiptDisplayMeta';

export default function PharmacyProductsTable({
  t,
  rows,
  loading,
  page,
  pageSize,
  total,
  totalPages,
  pageSizes,
  selection,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onOpenReceipt,
  onDelete,
}) {
  return (
    <div className="pharmacy-stock__panel flex min-h-0 flex-1 flex-col">
      <div className="pharmacy-stock__table-wrap min-h-0 flex-1">
        <table className="pharmacy-stock__table">
          <thead>
            <tr>
              <PharmacySelectAllTh t={t} selection={selection} disabled={rows.length === 0} />
              <th>№</th>
              <th>{t('pharmacyStock.colName')}</th>
              <th>{t('stockReports.colSupplier')}</th>
              <th>{t('pharmacyStock.colDocNo')}</th>
              <th>{t('pharmacyStock.colDate')}</th>
              <th className="text-right">{t('stockModule.colQty')}</th>
              <th>{t('pharmacyStock.retailPrice')}</th>
              <th>{t('pharmacyStock.colManufacturer')}</th>
              <th>{t('pharmacyStock.colForm')}</th>
              <th>{t('pharmacyStock.productAtc')}</th>
              <th>{t('pharmacyStock.productBarcodes')}</th>
              <th>{t('pharmacyStock.productMxik')}</th>
              <th>{t('pharmacyStock.unitsInPack')}</th>
              <th>{t('pharmacyStock.colCountry')}</th>
              <th>{t('pharmacyStock.colUpdated')}</th>
              <th className="pharmacy-stock__row-actions" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={17}>
                  <div className="pharmacy-stock__empty">{t('common.loading')}</div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={17}>
                  <div className="pharmacy-stock__empty">{t('pharmacyStock.catalogEmpty')}</div>
                </td>
              </tr>
            ) : rows.map((p, idx) => {
              const origin = productReceiptOrigin(p);
              const edited = productWasEdited(p);
              return (
                <tr
                  key={p.id}
                  className={`pharmacy-stock__row--clickable${selection.isSelected(p.id) ? ' pharmacy-stock__row--selected' : ''}${p.active === false ? ' pharmacy-stock__row--inactive' : ''}`}
                  onClick={() => onEdit(p)}
                >
                  <PharmacySelectCell t={t} row={p} selection={selection} />
                  <td>{page * pageSize + idx + 1}</td>
                  <td className="font-semibold">
                    {p.name}
                    {p.active === false ? (
                      <span className="pharmacy-stock__inline-badge">{t('pharmacyStock.productInactive')}</span>
                    ) : null}
                    {edited ? (
                      <span className="pharmacy-stock__inline-badge pharmacy-stock__inline-badge--warn">
                        {t('pharmacyStock.productEditedBadge')}
                      </span>
                    ) : null}
                  </td>
                  <td>
                    {origin.supplierName || '—'}
                    {origin.receiptType === 'OPENING' ? (
                      <span className="pharmacy-stock__inline-badge">
                        {receiptTypeLabel(origin.receiptType, t)}
                      </span>
                    ) : null}
                  </td>
                  <td>{origin.receiptNumber || '—'}</td>
                  <td>{origin.documentDate || '—'}</td>
                  <td className={`text-right font-semibold ${p.lowStock ? 'text-red-600' : ''}`}>
                    {p.stockQuantity ?? 0}
                    {p.lowStock ? <AlertTriangle size={12} className="ml-1 inline" /> : null}
                  </td>
                  <td>{formatMoney(p.sellingPrice)}</td>
                  <td>{productManufacturer(p) || '—'}</td>
                  <td>{productDosageForm(p) || '—'}</td>
                  <td>{productAtc(p) || '—'}</td>
                  <td>{p.barcode || '—'}</td>
                  <td>{p.ikpu || '—'}</td>
                  <td>{productUnitsInPack(p) || 1}</td>
                  <td>{productCountry(p) || '—'}</td>
                  <td title={p.updatedAt || ''}>{formatProductUpdatedAt(p.updatedAt || p.createdAt)}</td>
                  <td className="pharmacy-stock__row-actions" onClick={(e) => e.stopPropagation()}>
                    <div className="pharmacy-stock__icon-row">
                      <PharmacyReceiptLineRowMenu
                        t={t}
                        onAboutProduct={() => onEdit(p)}
                        onOpenReceipt={origin.receiptId ? () => onOpenReceipt?.(p) : undefined}
                        onEdit={() => onEdit(p)}
                        onDelete={p.active !== false ? () => onDelete(p) : undefined}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={pageSizes}
      />
    </div>
  );
}
