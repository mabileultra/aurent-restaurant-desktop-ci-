import '../styles/pharmacy-products-supplier-cards.css';

/**
 * KPI-style supplier filter cards (inventory density).
 * Data must come from pharmacy `/products/supplier-stats`, not grocery `/suppliers`.
 */
export default function PharmacyProductsSupplierCards({
  t,
  stats,
  selectedSupplierId,
  onSelectSupplier,
}) {
  const suppliers = stats?.suppliers ?? [];
  const total = stats?.totalProducts ?? 0;
  const active = stats?.activeProducts ?? 0;
  const allSelected = !selectedSupplierId;

  return (
    <section className="pharm-supplier-cards" aria-label={t('pharmacyStock.supplierCardsLabel')}>
      <button
        type="button"
        className={`pharm-supplier-card${allSelected ? ' is-active' : ''}`}
        onClick={() => onSelectSupplier('')}
      >
        <p className="pharm-supplier-card__label">{t('pharmacyStock.filterAllSuppliers')}</p>
        <p className="pharm-supplier-card__value">{total}</p>
        <p className="pharm-supplier-card__hint">
          {t('pharmacyStock.supplierCardsAllHint', { active })}
        </p>
      </button>

      {suppliers.map((row) => {
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
            <p className="pharm-supplier-card__hint">{t('pharmacyStock.supplierCardsFromReceipts')}</p>
          </button>
        );
      })}
    </section>
  );
}
