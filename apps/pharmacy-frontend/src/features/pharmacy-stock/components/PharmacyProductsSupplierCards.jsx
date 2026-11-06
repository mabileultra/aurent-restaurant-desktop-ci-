import { receiptTypeLabel } from '../utils/pharmacyReceiptDisplayMeta';
import '../styles/pharmacy-products-supplier-cards.css';

/**
 * KPI filter cards on Products.
 * Prefer suppliers from receipts; if none — receipt documents (OPENING cutover).
 */
export default function PharmacyProductsSupplierCards({
  t,
  stats,
  selectedSupplierId,
  selectedReceiptId,
  onSelectSupplier,
  onSelectReceipt,
}) {
  const suppliers = stats?.suppliers ?? [];
  const receipts = stats?.receipts ?? [];
  const total = stats?.totalProducts ?? 0;
  const active = stats?.activeProducts ?? 0;
  const useReceipts = suppliers.length === 0 && receipts.length > 0;
  const allSelected = useReceipts ? !selectedReceiptId : !selectedSupplierId;

  return (
    <section
      className="pharm-supplier-cards"
      aria-label={useReceipts
        ? t('pharmacyStock.receiptCardsLabel')
        : t('pharmacyStock.supplierCardsLabel')}
    >
      <button
        type="button"
        className={`pharm-supplier-card${allSelected ? ' is-active' : ''}`}
        onClick={() => {
          if (useReceipts) onSelectReceipt('');
          else onSelectSupplier('');
        }}
      >
        <p className="pharm-supplier-card__label">
          {useReceipts
            ? t('pharmacyStock.filterAllReceipts')
            : t('pharmacyStock.filterAllSuppliers')}
        </p>
        <p className="pharm-supplier-card__value">{total}</p>
        <p className="pharm-supplier-card__hint">
          {t('pharmacyStock.supplierCardsAllHint', { active })}
        </p>
      </button>

      {useReceipts
        ? receipts.map((row) => {
          const id = String(row.receiptId);
          const selected = selectedReceiptId === id;
          return (
            <button
              key={id}
              type="button"
              className={`pharm-supplier-card${selected ? ' is-active' : ''}`}
              onClick={() => onSelectReceipt(id)}
              title={row.receiptNumber}
            >
              <p className="pharm-supplier-card__label">{row.receiptNumber}</p>
              <p className="pharm-supplier-card__value">{row.productCount}</p>
              <p className="pharm-supplier-card__hint">
                {[receiptTypeLabel(row.receiptType, t), row.status].filter(Boolean).join(' · ')}
              </p>
            </button>
          );
        })
        : suppliers.map((row) => {
          const id = String(row.supplierId);
          const selected = selectedSupplierId === id;
          return (
            <button
              key={id}
              type="button"
              className={`pharm-supplier-card${selected ? ' is-active' : ''}`}
              onClick={() => onSelectSupplier(id)}
              title={row.supplierName}
            >
              <p className="pharm-supplier-card__label">{row.supplierName}</p>
              <p className="pharm-supplier-card__value">{row.productCount}</p>
              <p className="pharm-supplier-card__hint">
                {t('pharmacyStock.supplierCardsFromReceipts')}
              </p>
            </button>
          );
        })}
    </section>
  );
}
