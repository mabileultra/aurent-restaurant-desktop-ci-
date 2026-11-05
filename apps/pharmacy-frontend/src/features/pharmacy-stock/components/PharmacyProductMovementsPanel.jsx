import { useQuery } from '@tanstack/react-query';
import { pharmacyWarehouseApi } from '../../../api';
import '../styles/pharmacy-product-lots.css';

const TYPE_KEY = {
  ADJUSTMENT: 'pharmacyStock.movementTypeAdjustment',
  RECEIPT: 'pharmacyStock.movementTypeReceipt',
  OPENING: 'pharmacyStock.movementTypeOpening',
  SALE: 'pharmacyStock.movementTypeSale',
  RETURN: 'pharmacyStock.movementTypeReturn',
  TRANSFER: 'pharmacyStock.movementTypeTransfer',
};

/** Журнал движений на карточке товара (этап 6). */
export default function PharmacyProductMovementsPanel({ t, productId, storeId }) {
  const query = useQuery({
    queryKey: ['pharmacy-product-movements', productId, storeId],
    queryFn: () => pharmacyWarehouseApi.listProductMovements(productId, {
      storeId: storeId || undefined,
      limit: 30,
    }).then((r) => r.data),
    enabled: Boolean(productId),
  });

  const rows = Array.isArray(query.data) ? query.data : [];

  return (
    <section className="pharm-product-lots" aria-label={t('pharmacyStock.productMovementsTitle')}>
      <div className="pharm-product-lots__head">
        <h3 className="pharm-product-lots__title">{t('pharmacyStock.productMovementsTitle')}</h3>
        <p className="pharm-product-lots__hint">{t('pharmacyStock.productMovementsHint')}</p>
      </div>
      {query.isLoading ? (
        <p className="pharm-product-lots__empty">{t('common.loading')}</p>
      ) : rows.length === 0 ? (
        <p className="pharm-product-lots__empty">{t('pharmacyStock.productMovementsEmpty')}</p>
      ) : (
        <ul className="pharm-product-lots__list">
          {rows.map((m) => {
            const qty = Number(m.quantity);
            const typeLabel = t(TYPE_KEY[m.movementType] || 'pharmacyStock.productLotSourceUnknown');
            const when = m.createdAt ? new Date(m.createdAt).toLocaleString('ru-RU') : '—';
            return (
              <li key={m.id} className="pharm-product-lots__row">
                <div className="pharm-product-lots__main">
                  <span className="pharm-product-lots__batch">{typeLabel}</span>
                  <span className={`pharm-product-lots__badge${qty < 0 ? '' : ' is-opening'}`}>
                    {qty > 0 ? `+${qty}` : qty}
                  </span>
                </div>
                <div className="pharm-product-lots__meta">
                  <span>{when}</span>
                  {m.notes ? <span>{m.notes}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
