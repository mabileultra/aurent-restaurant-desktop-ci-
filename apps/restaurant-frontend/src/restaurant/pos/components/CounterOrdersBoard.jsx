import { BaseButton, BaseInput } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import '../styles/counter-board.css';

function statusClass(status) {
  if (status === 'BILLING') return 'is-billing';
  return 'is-open';
}

export default function CounterOrdersBoard({
  channel,
  orders,
  loading,
  onOpenNew,
  onSelect,
  t,
}) {
  const isDelivery = channel === 'DELIVERY';

  return (
    <section className="rst-counter">
      <div className="rst-counter__toolbar">
        <div>
          <h2 className="rst-counter__title">
            {isDelivery ? t('rst.pos.deliveryBoard') : t('rst.pos.takeawayBoard')}
          </h2>
          <p className="rst-counter__hint">
            {isDelivery ? t('rst.pos.deliveryHint') : t('rst.pos.takeawayHint')}
          </p>
        </div>
        <BaseButton type="button" onClick={onOpenNew}>
          {isDelivery ? t('rst.pos.newDelivery') : t('rst.pos.newTakeaway')}
        </BaseButton>
      </div>

      {loading ? (
        <div className="rst-notice">{t('common.loading')}</div>
      ) : orders.length === 0 ? (
        <div className="rst-counter__empty">
          <strong>{t('rst.pos.counterEmptyTitle')}</strong>
          <span>{isDelivery ? t('rst.pos.deliveryEmpty') : t('rst.pos.takeawayEmpty')}</span>
        </div>
      ) : (
        <div className="rst-counter__grid">
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              className={`rst-counter__card ${statusClass(order.status)}`}
              onClick={() => onSelect(order.id)}
            >
              <div className="rst-counter__card-top">
                <strong>
                  {isDelivery ? t('rst.pos.deliveryTicket', { no: order.orderNo }) : t('rst.pos.takeawayTicket', { no: order.orderNo })}
                </strong>
                <span className="rst-counter__badge">
                  {order.status === 'BILLING' ? t('rst.pos.statusBilling') : t('rst.pos.statusOpen')}
                </span>
              </div>
              {isDelivery ? (
                <div className="rst-counter__meta">
                  <span>{order.clientName || '—'}</span>
                  <span>{order.clientPhone || '—'}</span>
                  <span>{order.deliveryAddress || '—'}</span>
                </div>
              ) : (
                <div className="rst-counter__meta">
                  <span>{t('rst.pos.linesCount', { count: order.linesCount ?? (order.items?.length ?? 0) })}</span>
                  {order.clientName ? <span>{order.clientName}</span> : null}
                </div>
              )}
              <div className="rst-counter__card-foot">
                <span>{fmtMoneyCompact(order.subtotal)}</span>
                <span>{order.openedAt ? new Date(order.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
