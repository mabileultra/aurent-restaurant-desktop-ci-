import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { pharmacyWarehouseApi } from '../../../api';
import { PHARMACY_STOCK_PATHS } from '../pharmacyStockPaths';
import { formatIsoToDisplay } from '../utils/smartExpiryInput';
import { receiptTypeLabel } from '../utils/pharmacyReceiptDisplayMeta';
import '../styles/pharmacy-product-lots.css';

/** Read-only lot list on product card (этап 4 каркас; ops/audit — позже). */
export default function PharmacyProductLotsPanel({ t, productId, storeId }) {
  const navigate = useNavigate();
  const lotsQuery = useQuery({
    queryKey: ['pharmacy-product-lots', productId, storeId],
    queryFn: () => pharmacyWarehouseApi.listLots({ productId, storeId }).then((r) => r.data),
    enabled: Boolean(productId && storeId),
  });

  const lots = Array.isArray(lotsQuery.data) ? lotsQuery.data : [];

  return (
    <section className="pharm-product-lots" aria-label={t('pharmacyStock.productLotsTitle')}>
      <div className="pharm-product-lots__head">
        <h3 className="pharm-product-lots__title">{t('pharmacyStock.productLotsTitle')}</h3>
        <p className="pharm-product-lots__hint">{t('pharmacyStock.productLotsHint')}</p>
      </div>

      {!storeId ? (
        <p className="pharm-product-lots__empty">{t('stockModal.pickStore')}</p>
      ) : lotsQuery.isLoading ? (
        <p className="pharm-product-lots__empty">{t('common.loading')}</p>
      ) : lots.length === 0 ? (
        <p className="pharm-product-lots__empty">{t('pharmacyStock.productLotsEmpty')}</p>
      ) : (
        <ul className="pharm-product-lots__list">
          {lots.map((lot) => (
            <li key={lot.id} className="pharm-product-lots__row">
              <div className="pharm-product-lots__main">
                <span className="pharm-product-lots__batch">
                  {lot.batchNumber || t('pharmacyStock.productLotNoBatch')}
                </span>
                <span className={`pharm-product-lots__badge${lot.receiptType === 'OPENING' ? ' is-opening' : ''}`}>
                  {lot.receiptType
                    ? receiptTypeLabel(lot.receiptType, t)
                    : t('pharmacyStock.productLotSourceUnknown')}
                </span>
              </div>
              <div className="pharm-product-lots__meta">
                <span>
                  {t('pharmacyStock.expiry')}: {formatIsoToDisplay(lot.expiryDate) || '—'}
                </span>
                <span className="pharm-product-lots__qty">
                  {t('stockModule.colQty')}: {lot.quantity ?? 0}
                </span>
              </div>
              {lot.receiptId ? (
                <button
                  type="button"
                  className="pharm-product-lots__link"
                  onClick={() => navigate(PHARMACY_STOCK_PATHS.receipt(lot.receiptId))}
                >
                  <ExternalLink size={14} strokeWidth={2.2} aria-hidden />
                  {lot.receiptNumber || t('pharmacyStock.openSourceReceipt')}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
