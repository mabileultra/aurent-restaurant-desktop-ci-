import { ChefHat, CreditCard, Percent, Trash2 } from 'lucide-react';
import { fmtMoney as fmt } from '../../../utils/formatMoney';

const KITCHEN_STATUS_LABEL = {
  PENDING: 'restaurantCashier.kitchen_PENDING',
  IN_PROGRESS: 'restaurantCashier.kitchen_IN_PROGRESS',
  READY: 'restaurantCashier.kitchen_READY',
  SERVED: 'restaurantCashier.kitchen_SERVED',
};

export default function RestaurantSessionPanel({
  session,
  loading,
  orderDiscount,
  payableTotal,
  onRemoveLine,
  onQtyChange,
  onSendToKitchen,
  sendToKitchenPending,
  onDiscount,
  onPay,
  payDisabled,
  t,
}) {
  const hasUnsentLines = session?.lines?.some((line) => !line.kitchenStatus) ?? false;

  if (!session) {
    return (
      <div className="restaurant-session-panel restaurant-session-panel--empty">
        <p className="restaurant-session-panel__hint">{t('restaurantCashier.selectTableHint')}</p>
      </div>
    );
  }

  return (
    <div className="restaurant-session-panel">
      <header className="restaurant-session-panel__head">
        <div className="restaurant-session-panel__head-main">
          <h2 className="restaurant-session-panel__title">
            {t('restaurantCashier.tableOrder', { code: session.tableCode })}
          </h2>
          <p className="restaurant-session-panel__meta">
            {t('restaurantCashier.guests', { count: session.guestCount })}
            {session.waiterName ? ` · ${session.waiterName}` : ''}
          </p>
        </div>
        <div className="restaurant-session-panel__total">
          <span className="restaurant-session-panel__total-label">{t('pos.total')}</span>
          <strong className="restaurant-session-panel__total-value">
            {fmt(payableTotal ?? session.subtotal)}
          </strong>
          {orderDiscount > 0 ? (
            <span className="restaurant-session-panel__discount">
              {t('restaurantCashier.orderDiscount', { amount: fmt(orderDiscount) })}
            </span>
          ) : null}
        </div>
      </header>

      <div className="restaurant-session-panel__lines">
        {loading && <p className="restaurant-session-panel__loading">{t('common.loading')}</p>}
        {!loading && session.lines.length === 0 && (
          <p className="restaurant-session-panel__empty">{t('restaurantCashier.noLines')}</p>
        )}
        {session.lines.map((line) => (
          <div key={line.id} className="restaurant-session-panel__line">
            <div className="restaurant-session-panel__line-main">
              <span className="restaurant-session-panel__line-name">
                {line.productName}
                {line.kitchenStatus ? (
                  <span
                    className={`restaurant-session-panel__kitchen-badge restaurant-session-panel__kitchen-badge--${String(line.kitchenStatus).toLowerCase()}`}
                  >
                    {t(KITCHEN_STATUS_LABEL[line.kitchenStatus] ?? line.kitchenStatus)}
                  </span>
                ) : null}
              </span>
              <span className="restaurant-session-panel__line-price">{fmt(line.lineTotal)}</span>
            </div>
            <div className="restaurant-session-panel__line-actions">
              <div className="restaurant-session-panel__qty">
                <button
                  type="button"
                  className="restaurant-session-panel__qty-btn"
                  onClick={() => onQtyChange(line, Math.max(0.001, Number(line.quantity) - 1))}
                >
                  −
                </button>
                <span className="restaurant-session-panel__qty-val">{line.quantity}</span>
                <button
                  type="button"
                  className="restaurant-session-panel__qty-btn"
                  onClick={() => onQtyChange(line, Number(line.quantity) + 1)}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className="restaurant-session-panel__remove"
                onClick={() => onRemoveLine(line.id)}
              >
                <Trash2 size={16} strokeWidth={2} aria-hidden />
                <span>{t('common.delete')}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <footer className="restaurant-session-panel__foot">
        <button
          type="button"
          className="restaurant-session-panel__action restaurant-session-panel__action--discount"
          disabled={!session.lines.length}
          onClick={onDiscount}
        >
          <Percent size={18} strokeWidth={2.25} aria-hidden />
          <span>{t('pos.discount')}</span>
        </button>
        <button
          type="button"
          className="restaurant-session-panel__action restaurant-session-panel__action--kitchen"
          disabled={!hasUnsentLines || sendToKitchenPending || !session.lines.length}
          onClick={onSendToKitchen}
        >
          <ChefHat size={18} strokeWidth={2.25} aria-hidden />
          <span>{t('restaurantCashier.sendToKitchen')}</span>
        </button>
        <button
          type="button"
          className="restaurant-session-panel__action restaurant-session-panel__action--pay"
          disabled={payDisabled || !session.lines.length}
          onClick={onPay}
        >
          <CreditCard size={18} strokeWidth={2.25} aria-hidden />
          <span>{t('restaurantCashier.payTable')}</span>
        </button>
      </footer>
    </div>
  );
}
