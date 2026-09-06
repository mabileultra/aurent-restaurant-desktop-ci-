import { useMemo } from 'react';
import { BaseButton } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { formatElapsed } from '../utils/formatElapsed';
import MenuPicker from './MenuPicker';
import OrderLines from './OrderLines';
import '../styles/order-workspace.css';

export default function OrderWorkspace({
  order,
  menuItems,
  onBack,
  backLabel,
  onAddItem,
  onQty,
  onRemove,
  onCancel,
  onSendKitchen,
  onRequestBill,
  onPay,
  canCancel,
  canSendKitchen,
  canRequestBill,
  canPay,
  sendingKitchen,
  billingPending,
  paying,
  commissionPreview,
  waiters = [],
  onAssignWaiter,
  assigningWaiter,
  t,
}) {
  const billing = order.status === 'BILLING';
  const channel = order.channel || 'DINE_IN';
  const ticketTitle = channel === 'TAKEAWAY'
    ? t('rst.pos.takeawayTicket', { no: order.orderNo })
    : channel === 'DELIVERY'
      ? t('rst.pos.deliveryTicket', { no: order.orderNo })
      : t('rst.order.ticketTitle', { code: order.tableCode, no: order.orderNo });
  const ticketMeta = channel === 'DELIVERY'
    ? [order.clientName, order.clientPhone, order.deliveryAddress].filter(Boolean).join(' · ')
    : channel === 'TAKEAWAY'
      ? (order.clientName
        ? order.clientName
        : t('rst.pos.takeawayMeta'))
      : t('rst.order.ticketMeta', {
        guests: order.guestCount,
        adults: order.adultCount,
        children: order.childrenCount,
      });

  const elapsed = formatElapsed(order.openedAt);
  const qtyByMenuId = useMemo(() => {
    const map = {};
    for (const line of order.items ?? []) {
      if (!line.menuItemId || line.itemStatus === 'CANCELLED') continue;
      map[line.menuItemId] = (map[line.menuItemId] || 0) + Number(line.quantity || 0);
    }
    return map;
  }, [order.items]);

  const linesCount = (order.items ?? []).filter((line) => line.itemStatus !== 'CANCELLED').length;
  const showCommission = channel === 'DINE_IN' && (
    order.commissionPercent != null
    || (commissionPreview && Number(commissionPreview.percent) > 0)
  );
  const commissionPercent = order.commissionPercent != null
    ? Number(order.commissionPercent)
    : Number(commissionPreview?.percent ?? 0);
  const commissionAmount = order.commissionAmount != null
    ? Number(order.commissionAmount)
    : Number(commissionPreview?.amount ?? 0);
  const payAmount = order.subtotal;

  return (
    <div className="rst-order">
      <section className="rst-order__catalog">
        <div className="rst-order__head">
          <div>
            <button type="button" className="rst-order__back" onClick={onBack}>
              ← {backLabel || t('rst.order.backToFloor')}
            </button>
            <h2 className="rst-order__title">
              {channel === 'DINE_IN'
                ? t('rst.order.tableHeading', { code: order.tableCode })
                : t('rst.order.menu')}
            </h2>
            <p className="rst-order__meta">
              {billing ? t('rst.order.billingHint') : ticketMeta}
              {elapsed ? ` · ${elapsed}` : ''}
            </p>
          </div>
        </div>
        {billing ? (
          <div className="rst-order-empty">{t('rst.order.billingHint')}</div>
        ) : (
          <MenuPicker items={menuItems} onAdd={onAddItem} t={t} qtyByMenuId={qtyByMenuId} />
        )}
      </section>

      <aside className="rst-order__ticket">
        <div className="rst-order__ticket-head">
          <div>
            <div className="rst-order__ticket-kicker">TICKET #{order.orderNo}</div>
            <h2 className="rst-order__title">{ticketTitle}</h2>
            <p className="rst-order__meta">{ticketMeta}</p>
            {channel === 'DINE_IN' && waiters.length > 0 ? (
              <label className="rst-order__waiter">
                <span>{t('rst.floor.waiter')}</span>
                <select
                  value={order.waiterUserId || ''}
                  disabled={billing || assigningWaiter}
                  onChange={(e) => {
                    if (!e.target.value || !onAssignWaiter) return;
                    onAssignWaiter(e.target.value);
                  }}
                >
                  <option value="">{t('rst.floor.waiterNone')}</option>
                  {waiters.map((waiter) => (
                    <option key={waiter.id} value={waiter.id}>{waiter.name}</option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          {elapsed ? <span className="rst-order__timer">{elapsed}</span> : null}
        </div>

        <OrderLines
          items={order.items ?? []}
          onQty={onQty}
          onRemove={onRemove}
          locked={billing}
          t={t}
        />

        <div className="rst-order__totals">
          <div className="rst-order__total-row">
            <span>{t('rst.order.subtotal', { count: linesCount })}</span>
            <span>{fmtMoneyCompact(order.subtotal)}</span>
          </div>
          {showCommission ? (
            <div className="rst-order__total-row rst-order__total-row--info">
              <span>
                {t('rst.order.commissionInfo', { percent: commissionPercent })}
                <em className="rst-order__auto">AUTO</em>
              </span>
              <span>{fmtMoneyCompact(commissionAmount)}</span>
            </div>
          ) : null}
          <div className="rst-order__total-row rst-order__total-row--grand">
            <span>{t('rst.order.totalDue')}</span>
            <strong>{fmtMoneyCompact(payAmount)}</strong>
          </div>
        </div>

        <div className="rst-order__footer">
          {canSendKitchen ? (
            <button
              type="button"
              className="rst-order__kds"
              onClick={onSendKitchen}
              disabled={sendingKitchen}
            >
              {t('rst.order.sendKitchenKds')}
            </button>
          ) : null}

          <div className="rst-order__actions">
            <button type="button" className="rst-order__action" disabled title={t('rst.order.soon')}>
              {t('rst.order.split')}
            </button>
            <button type="button" className="rst-order__action" disabled title={t('rst.order.soon')}>
              {t('rst.order.discount')}
            </button>
            <button
              type="button"
              className="rst-order__action"
              onClick={canRequestBill ? onRequestBill : undefined}
              disabled={!canRequestBill || billingPending}
            >
              {t('rst.order.requestBill')}
            </button>
            {canPay ? (
              <button
                type="button"
                className="rst-order__action rst-order__action--pay"
                onClick={() => onPay('CARD')}
                disabled={paying}
              >
                {t('rst.order.pay')}
              </button>
            ) : (
              <button type="button" className="rst-order__action rst-order__action--pay" disabled>
                {t('rst.order.pay')}
              </button>
            )}
          </div>
          {canPay ? (
            <div className="rst-order__pay-extra">
              <BaseButton type="button" variant="ghost" onClick={() => onPay('CASH')} disabled={paying}>
                {t('rst.order.payCash')}
              </BaseButton>
            </div>
          ) : null}

          {canCancel ? (
            <BaseButton type="button" variant="ghost" onClick={onCancel}>
              {t('rst.order.cancel')}
            </BaseButton>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
