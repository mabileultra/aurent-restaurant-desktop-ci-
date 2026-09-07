import { useEffect, useMemo, useState } from 'react';
import { BaseButton } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { formatDigitalTimer } from '../utils/formatElapsed';
import MenuPicker from './MenuPicker';
import OrderLines from './OrderLines';
import '../styles/order-workspace.css';

function useLiveClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export default function OrderWorkspace({
  order,
  menuItems,
  onBack,
  backLabel,
  hallName,
  waiterName,
  onAddItem,
  onQty,
  onRemove,
  onCancel,
  onSendKitchen,
  onRequestBill,
  onPay,
  onGuestsChange,
  guestsPending,
  canCancel,
  canSendKitchen,
  canRequestBill,
  canPay,
  sendingKitchen,
  billingPending,
  paying,
  printReceiptEnabled = true,
  onPrintReceiptChange,
  commissionPreview,
  waiters = [],
  onAssignWaiter,
  assigningWaiter,
  t,
}) {
  const now = useLiveClock();
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

  const digitalTimer = formatDigitalTimer(order.openedAt, now);
  const clockLabel = new Date(now).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const qtyByMenuId = useMemo(() => {
    const map = {};
    for (const line of order.items ?? []) {
      if (!line.menuItemId || line.itemStatus === 'CANCELLED') continue;
      map[line.menuItemId] = (map[line.menuItemId] || 0) + Number(line.quantity || 0);
    }
    return map;
  }, [order.items]);

  const activeLines = (order.items ?? []).filter((line) => line.itemStatus !== 'CANCELLED');
  const linesCount = activeLines.length;
  const newCount = activeLines.filter((line) => line.itemStatus === 'NEW').length;
  const kitchenCount = activeLines.filter((line) => line.itemStatus !== 'NEW').length;
  const progress = linesCount === 0
    ? 0
    : Math.round((kitchenCount / linesCount) * 100);

  const commissionPercent = order.commissionPercent != null
    ? Number(order.commissionPercent)
    : Number(commissionPreview?.percent ?? 0);
  const commissionAmount = order.commissionAmount != null
    ? Number(order.commissionAmount)
    : Number(commissionPreview?.amount ?? 0);
  const subtotalAmount = Number(order.subtotal ?? 0);
  const payAmount = channel === 'DINE_IN'
    ? Math.round((subtotalAmount + Number(commissionAmount || 0)) * 100) / 100
    : subtotalAmount;
  const resolvedWaiter = waiterName
    || waiters.find((row) => String(row.id) === String(order.waiterUserId))?.name
    || null;

  const bumpGuests = (delta) => {
    if (!onGuestsChange || billing) return;
    const next = Math.max(1, Math.min(99, Number(order.guestCount || 1) + delta));
    if (next === order.guestCount) return;
    onGuestsChange(next);
  };

  return (
    <div className="rst-order">
      <section className="rst-order__catalog">
        <div className="rst-order__context">
          <button type="button" className="rst-order__back" onClick={onBack}>
            ← {backLabel || t('rst.order.backToFloor')}
          </button>
          <div className="rst-order__context-main">
            {channel === 'DINE_IN' ? (
              <h2 className="rst-order__context-title">
                <em>{t('rst.order.tableHeading', { code: order.tableCode })}</em>
                {hallName ? <span> / {hallName}</span> : null}
              </h2>
            ) : (
              <h2 className="rst-order__context-title">
                <em>{t('rst.order.menu')}</em>
              </h2>
            )}
            <span className="rst-order__context-waiter">
              {t('rst.floor.waiter')}: {resolvedWaiter || t('rst.floor.waiterNone')}
            </span>
          </div>
          <div className="rst-order__live">
            <strong>{clockLabel}</strong>
            <span>LIVE</span>
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
            <div className="rst-order__ticket-kicker">
              TICKET #{order.orderNo}
              {channel === 'DINE_IN' ? ` · ${t('rst.order.tableHeading', { code: order.tableCode })}` : ''}
            </div>
            <h2 className="rst-order__title">{ticketTitle}</h2>
            <p className="rst-order__meta">{ticketMeta}</p>
          </div>
          {digitalTimer ? <span className="rst-order__timer">{digitalTimer}</span> : null}
        </div>

        {channel === 'DINE_IN' ? (
          <div className="rst-order__guest-row">
            <div className="rst-order__guest-stepper">
              <button type="button" disabled={billing || guestsPending || order.guestCount <= 1} onClick={() => bumpGuests(-1)}>−</button>
              <span>{t('rst.order.guestsShort', { count: order.guestCount })}</span>
              <button type="button" disabled={billing || guestsPending} onClick={() => bumpGuests(1)}>+</button>
            </div>
            {waiters.length > 0 ? (
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
        ) : null}

        <div className="rst-order__progress" aria-hidden>
          <i style={{ width: `${progress}%` }} />
          {newCount > 0 && kitchenCount > 0 ? (
            <b style={{ width: `${Math.round((newCount / linesCount) * 100)}%`, left: `${progress}%` }} />
          ) : null}
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
            <span>{t('rst.order.subtotal', { count: linesCount })}:</span>
            <strong className="rst-order__total-val">{fmtMoneyCompact(order.subtotal)}</strong>
          </div>
          {channel === 'DINE_IN' ? (
            <div className="rst-order__total-row rst-order__total-row--service">
              <span>
                {t('rst.order.serviceLine', { percent: commissionPercent || 0 })}
                <em className="rst-order__auto">AUTO</em>
              </span>
              <strong className="rst-order__total-val">{fmtMoneyCompact(commissionAmount || 0)}</strong>
            </div>
          ) : null}
          <div className="rst-order__total-row rst-order__total-row--loyalty">
            <span>{t('rst.order.loyalty')}:</span>
            <span className="rst-order__loyalty-val">{t('rst.order.loyaltyZero')}</span>
          </div>
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
                onClick={() => onPay('CARD', payAmount)}
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
              <label className="rst-order__print-toggle" title={t('pos.printReceiptAfterSale')}>
                <input
                  type="checkbox"
                  checked={printReceiptEnabled}
                  onChange={(e) => onPrintReceiptChange?.(e.target.checked)}
                  disabled={paying}
                />
                <span>{t('pos.printReceiptShort')}</span>
              </label>
              <BaseButton type="button" variant="ghost" onClick={() => onPay('CASH', payAmount)} disabled={paying}>
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
