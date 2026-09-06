import { Eraser, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '../styles/pharmacy-cart-pane-head.css';

/**
 * Шапка чека аптеки: номер, статус, позиции + Новый чек (hold) / Очистить.
 */
export default function PharmacyCartPaneHead({
  receiptNo,
  itemsCount,
  parkedCount = 0,
  onNewReceipt,
  onClear,
  disabled = false,
}) {
  const { t } = useTranslation();
  const open = itemsCount > 0;

  return (
    <div className="pharmacy-cart-pane-head">
      <div className="pharmacy-cart-pane-head__meta">
        <span className="pharmacy-cart-pane-head__title">
          {t('pharmacyCashier.receiptNo', { n: receiptNo })}
        </span>
        <span
          className={`pharmacy-cart-pane-head__status${open ? ' is-open' : ' is-idle'}`}
        >
          {open ? t('pharmacyCashier.receiptOpen') : t('pharmacyCashier.receiptIdle')}
        </span>
        <span className="pharmacy-cart-pane-head__count">
          {t('pharmacyCashier.receiptItems', { count: itemsCount })}
        </span>
        {parkedCount > 0 ? (
          <span className="pharmacy-cart-pane-head__parked">
            {t('pharmacyCashier.parkedCount', { count: parkedCount })}
          </span>
        ) : null}
      </div>

      <div className="pharmacy-cart-pane-head__actions">
        <button
          type="button"
          className="pharmacy-cart-pane-head__btn pharmacy-cart-pane-head__btn--new"
          disabled={disabled}
          onClick={onNewReceipt}
          title={t('pharmacyCashier.newReceiptHint')}
        >
          <Plus size={14} strokeWidth={2.5} aria-hidden />
          {t('pharmacyCashier.newReceipt')}
        </button>
        <button
          type="button"
          className="pharmacy-cart-pane-head__btn pharmacy-cart-pane-head__btn--clear"
          disabled={disabled || itemsCount === 0}
          onClick={onClear}
          title={`${t('pharmacyCashier.clearReceipt')} [Esc]`}
        >
          <Eraser size={14} strokeWidth={2.25} aria-hidden />
          {t('pharmacyCashier.clearReceipt')}
          <kbd className="pharmacy-cart-pane-head__kbd">Esc</kbd>
        </button>
      </div>
    </div>
  );
}
