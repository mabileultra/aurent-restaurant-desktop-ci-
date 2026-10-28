import { useEffect, useMemo, useState } from 'react';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { formatDigitalTimer } from '../utils/formatElapsed';
import { resolveRestaurantPayTotal } from '../utils/restaurantPayAmount';
import { shortWaiterName } from '../utils/floorPosDerivations';
import { buildCategoryByMenuId } from '../utils/orderLineCategoryTone';
import MenuCatalogBoard from './MenuCatalogBoard';
import CancelReceiptPreview from './CancelReceiptPreview';
import OrderDiscountModal from './OrderDiscountModal';
import OrderLines from './OrderLines';
import RstConfirmDialog from './RstConfirmDialog';
import '../styles/order-workspace.css';
import '../styles/menu-catalog-board.css';

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
  hideBack = false,
  hallName,
  waiterName,
  onAddItem,
  onComposeFamily,
  onQty,
  onRemove,
  onCancel,
  onSendKitchen,
  onReprintPickup,
  reprintingPickup,
  canReprintPickup,
  onRequestBill,
  onPay,
  onDiscount,
  discountPending,
  onGuestsChange,
  guestsPending,
  canCancel,
  allowKitchenRefuse = false,
  canSendKitchen,
  canRequestBill,
  canPay,
  sendingKitchen,
  billingPending,
  paying,
  servicePreview,
  waiters = [],
  onAssignWaiter,
  assigningWaiter,
  onEditNote,
  onNewCheck,
  /** Waiter floor: compact action row (Send inline). Cashier keeps separate KDS block. */
  footerVariant = 'default',
  /** Cashier: show only line total next to the name. */
  linePriceMode = 'detail',
  t,
}) {
  const now = useLiveClock();
  const [cancelAsk, setCancelAsk] = useState(false);
  const billing = order.status === 'BILLING';
  const channel = order.channel || 'DINE_IN';
  const ticketTitle = channel === 'TAKEAWAY'
    ? t('rst.pos.takeawayTicket', { no: order.orderNo })
    : channel === 'DELIVERY'
      ? t('rst.pos.deliveryTicket', { no: order.orderNo })
      : (hallName
        ? t('rst.order.ticketTitle', { code: order.tableCode, hall: hallName })
        : t('rst.order.ticketTitleNoHall', { code: order.tableCode }));
  const ticketMeta = channel === 'DELIVERY'
    ? [order.clientName, order.clientPhone, order.deliveryAddress].filter(Boolean).join(' · ')
    : channel === 'TAKEAWAY'
      ? (order.clientName
        ? order.clientName
        : t('rst.pos.takeawayMeta'))
      : null;

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

  const categoryByMenuId = useMemo(
    () => buildCategoryByMenuId(menuItems),
    [menuItems],
  );

  const activeLines = (order.items ?? []).filter((line) => (
    line.itemStatus !== 'CANCELLED' && (Number(line.quantity) || 0) > 0
  ));
  const linesCount = activeLines.length;
  const newCount = activeLines.filter((line) => (
    line.itemStatus === 'NEW'
    || (line.sentQuantity != null && (Number(line.quantity) || 0) > (Number(line.sentQuantity) || 0))
  )).length;
  const kitchenCount = activeLines.filter((line) => line.itemStatus !== 'NEW').length;
  const progress = linesCount === 0
    ? 0
    : Math.round((kitchenCount / linesCount) * 100);

  const servicePercent = Number(servicePreview?.percent) || 0;
  const serviceAmount = Number(servicePreview?.amount) || 0;
  const discountAmount = Number(order.discountAmount) || 0;
  const payAmount = resolveRestaurantPayTotal(order, servicePreview);
  const [discountOpen, setDiscountOpen] = useState(false);
  const canEditDiscount = order.status === 'OPEN' || order.status === 'BILLING';
  const resolvedWaiter = shortWaiterName(
    waiterName
    || waiters.find((row) => String(row.id) === String(order.waiterUserId))?.name
    || null,
  );

  const bumpGuests = (delta) => {
    if (!onGuestsChange || billing) return;
    const guestCount = Math.max(1, Math.min(99, Number(order.guestCount || 1) + delta));
    if (guestCount === order.guestCount) return;
    const childrenCount = Math.min(Number(order.childrenCount || 0), guestCount);
    onGuestsChange({ guestCount, childrenCount });
  };

  return (
    <div className="rst-order rst-order--board">
      <div className="rst-order__board-head">
        <div className="rst-order__context">
          {hideBack ? null : (
            <button type="button" className="rst-order__back" onClick={onBack}>
              ← {backLabel || t('rst.order.backToFloor')}
            </button>
          )}
          <div className="rst-order__context-main">
            {channel === 'DINE_IN' ? (
              <h2 className="rst-order__context-title">
                {hallName ? <span>{hallName} / </span> : null}
                <em>{t('rst.order.tableHeading', { code: order.tableCode })}</em>
              </h2>
            ) : (
              <h2 className="rst-order__context-title">
                <em>{t('rst.order.menu')}</em>
              </h2>
            )}
          </div>
          <div className="rst-order__live">
            <strong>{clockLabel}</strong>
            <span>LIVE</span>
          </div>
        </div>
      </div>

      <MenuCatalogBoard
        items={menuItems}
        qtyByMenuId={qtyByMenuId}
        onAdd={onAddItem}
        onComposeFamily={onComposeFamily}
        t={t}
        billingNote={billing ? (
          <p className="rst-order__billing-note">
            {newCount > 0 ? t('rst.order.billingHintUnsent') : t('rst.order.billingHint')}
          </p>
        ) : null}
      />

      <aside className="rst-order__ticket">
        <div className="rst-order__ticket-head">
          <div>
            <div className="rst-order__ticket-kicker">
              TICKET #{order.orderNo}
              {channel === 'DINE_IN' ? ` · ${t('rst.order.tableHeading', { code: order.tableCode })}` : ''}
              {order.pickupNo ? ` · ${t('rst.order.pickupNo', { no: order.pickupNo })}` : ''}
            </div>
            <h2 className="rst-order__title">{ticketTitle}</h2>
            <p className="rst-order__ticket-waiter">
              {t('rst.floor.waiter')}: {resolvedWaiter || t('rst.floor.waiterNone')}
            </p>
            {ticketMeta ? <p className="rst-order__meta">{ticketMeta}</p> : null}
            {order.comment ? (
              <p className="rst-order__comment">{order.comment}</p>
            ) : null}
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
            {onNewCheck ? (
              <button
                type="button"
                className="rst-order__new-check"
                title={t('rst.order.newCheckHint', {
                  defaultValue: 'Отдельный чек за столом. Для дозаказа просто добавьте блюда сюда.',
                })}
                onClick={onNewCheck}
              >
                {t('rst.order.newCheck')}
              </button>
            ) : null}
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
          items={activeLines}
          onQty={onQty}
          onRemove={onRemove}
          onEditNote={onEditNote}
          allowKitchenRefuse={allowKitchenRefuse}
          categoryByMenuId={categoryByMenuId}
          priceMode={linePriceMode}
          t={t}
        />

        <div className="rst-order__totals">
          <div className="rst-order__total-row">
            <span>{t('rst.order.subtotal', { count: linesCount })}:</span>
            <strong className="rst-order__total-val">{fmtMoneyCompact(order.subtotal)}</strong>
          </div>
          {channel === 'DINE_IN' && servicePercent > 0 ? (
            <div className="rst-order__total-row rst-order__total-row--service">
              <span>{t('rst.order.serviceLine', { percent: servicePercent })}</span>
              <strong className="rst-order__total-val">{fmtMoneyCompact(serviceAmount)}</strong>
            </div>
          ) : null}
          {discountAmount > 0 ? (
            <div className="rst-order__total-row">
              <span>{t('rst.order.discount')}:</span>
              <strong className="rst-order__total-val">−{fmtMoneyCompact(discountAmount)}</strong>
            </div>
          ) : null}
          <div className="rst-order__total-row rst-order__total-row--grand">
            <span>{t('rst.order.totalDue')}</span>
            <strong>{fmtMoneyCompact(payAmount)}</strong>
          </div>
        </div>

        <div className={`rst-order__footer${footerVariant === 'waiter' ? ' rst-order__footer--waiter' : ''}`}>
          {footerVariant !== 'waiter' && canSendKitchen ? (
            <button
              type="button"
              className="rst-order__kds"
              onClick={onSendKitchen}
              disabled={sendingKitchen}
            >
              {t('rst.order.sendKitchenKds')}
            </button>
          ) : null}
          {footerVariant !== 'waiter' && canReprintPickup && order.pickupNo ? (
            <button
              type="button"
              className="rst-order__kds"
              onClick={onReprintPickup}
              disabled={reprintingPickup}
            >
              {t('rst.order.reprintPickup')}
            </button>
          ) : null}

          <div className="rst-order__actions">
            {canEditDiscount && onDiscount ? (
              <button
                type="button"
                className="rst-order__action rst-order__action--discount"
                onClick={() => setDiscountOpen(true)}
                disabled={discountPending}
              >
                {t('rst.order.discount')}
              </button>
            ) : null}
            {footerVariant === 'waiter' && canSendKitchen ? (
              <button
                type="button"
                className="rst-order__action rst-order__action--send"
                onClick={onSendKitchen}
                disabled={sendingKitchen}
              >
                {t('rst.order.sendKitchenKds')}
              </button>
            ) : null}
            {canRequestBill ? (
              <button
                type="button"
                className="rst-order__action rst-order__action--bill"
                onClick={onRequestBill}
                disabled={billingPending}
              >
                {t('rst.order.requestBill')}
              </button>
            ) : null}
            {canPay ? (
              <button
                type="button"
                className="rst-order__action rst-order__action--pay"
                onClick={onPay}
                disabled={paying}
              >
                {t('rst.order.pay')}
              </button>
            ) : null}
            {canCancel ? (
              <button
                type="button"
                className="rst-order__action rst-order__action--cancel"
                onClick={() => setCancelAsk(true)}
              >
                {t('rst.order.cancel')}
              </button>
            ) : null}
          </div>
        </div>
      </aside>

      <OrderDiscountModal
        open={discountOpen}
        subtotal={order.subtotal}
        currentDiscount={discountAmount}
        saving={Boolean(discountPending)}
        onClose={() => setDiscountOpen(false)}
        onSubmit={(amount) => {
          onDiscount?.(amount);
          setDiscountOpen(false);
        }}
        t={t}
      />

      <RstConfirmDialog
        open={cancelAsk}
        title={t('rst.order.cancel')}
        size="md"
        confirmLabel={t('common.confirm', { defaultValue: 'Подтвердить' })}
        cancelLabel={t('common.cancel')}
        danger
        onClose={() => setCancelAsk(false)}
        onConfirm={() => onCancel?.()}
      >
        <CancelReceiptPreview
          lines={activeLines}
          total={payAmount}
          hint={t('rst.order.confirmCancel')}
          t={t}
        />
      </RstConfirmDialog>
    </div>
  );
}
