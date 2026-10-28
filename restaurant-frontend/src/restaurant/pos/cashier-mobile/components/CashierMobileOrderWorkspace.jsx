import { useEffect, useMemo, useState } from 'react';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { formatDigitalTimer } from '../../utils/formatElapsed';
import { resolveRestaurantPayTotal } from '../../utils/restaurantPayAmount';
import { shortWaiterName } from '../../utils/floorPosDerivations';
import { buildCategoryByMenuId } from '../../utils/orderLineCategoryTone';
import CancelReceiptPreview from '../../components/CancelReceiptPreview';
import MenuPicker from '../../components/MenuPicker';
import OrderDiscountModal from '../../components/OrderDiscountModal';
import OrderLines from '../../components/OrderLines';
import RstConfirmDialog from '../../components/RstConfirmDialog';
import '../../waiter-mobile/styles/waiter-mobile-order.css';
import '../styles/cashier-mobile-order.css';

function useLiveClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/**
 * Phone cashier order — same Menu | Check shell as waiter, plus Pay.
 */
export default function CashierMobileOrderWorkspace({
  order,
  menuItems,
  onBack,
  hallName,
  waiterName,
  onAddItem,
  onComposeFamily,
  onQty,
  onRemove,
  onCancel,
  onSendKitchen,
  onRequestBill,
  onPay,
  onDiscount,
  discountPending,
  onGuestsChange,
  guestsPending,
  canCancel,
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
  t,
}) {
  const now = useLiveClock();
  const [tab, setTab] = useState('menu');
  const [discountOpen, setDiscountOpen] = useState(false);
  const [cancelAsk, setCancelAsk] = useState(false);

  useEffect(() => {
    setTab('menu');
  }, [order.id]);

  const billing = order.status === 'BILLING';
  const channel = order.channel || 'DINE_IN';

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

  const servicePercent = Number(servicePreview?.percent) || 0;
  const serviceAmount = Number(servicePreview?.amount) || 0;
  const discountAmount = Number(order.discountAmount) || 0;
  const payAmount = resolveRestaurantPayTotal(order, servicePreview);
  const canEditDiscount = order.status === 'OPEN' || order.status === 'BILLING';
  const digitalTimer = formatDigitalTimer(order.openedAt, now);
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
    <div className="rst-waiter-order rst-cashier-order">
      <header className="rst-waiter-order__top">
        <button type="button" className="rst-waiter-order__back" onClick={onBack}>
          ← {t('rst.waiter.mobile.backFloor')}
        </button>
        <div className="rst-waiter-order__title">
          <strong>
            {channel === 'DINE_IN'
              ? (hallName
                ? t('rst.order.ticketTitle', { code: order.tableCode || '—', hall: hallName })
                : t('rst.order.ticketTitleNoHall', { code: order.tableCode || '—' }))
              : channel === 'DELIVERY'
                ? t('rst.pos.deliveryTicket', { no: order.orderNo })
                : t('rst.pos.takeawayTicket', { no: order.orderNo })}
          </strong>
          <span>
            #{order.orderNo}
            {digitalTimer ? ` · ${digitalTimer}` : ''}
          </span>
        </div>
        {channel === 'DINE_IN' && onNewCheck ? (
          <button
            type="button"
            className="rst-waiter-order__new-check"
            title={t('rst.order.newCheckHint', {
              defaultValue: 'Отдельный чек за столом. Для дозаказа просто добавьте блюда сюда.',
            })}
            onClick={onNewCheck}
          >
            {t('rst.order.newCheck')}
          </button>
        ) : null}
      </header>

      {channel === 'DINE_IN' ? (
        <div className="rst-waiter-order__meta">
          <div className="rst-waiter-order__guests">
            <button type="button" disabled={billing || guestsPending || order.guestCount <= 1} onClick={() => bumpGuests(-1)}>−</button>
            <span>{t('rst.order.guestsShort', { count: order.guestCount })}</span>
            <button type="button" disabled={billing || guestsPending} onClick={() => bumpGuests(1)}>+</button>
          </div>
          {waiters.length > 0 ? (
            <label className="rst-waiter-order__assign">
              <span className="rst-waiter-order__assign-label">{t('rst.floor.waiter')}</span>
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
          ) : (
            <span className="rst-waiter-order__waiter">
              {resolvedWaiter || t('rst.floor.waiterNone')}
            </span>
          )}
        </div>
      ) : null}

      <div className="rst-waiter-order__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'menu'}
          className={`rst-waiter-order__tab${tab === 'menu' ? ' is-active' : ''}`}
          onClick={() => setTab('menu')}
        >
          {t('rst.order.menu')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'check'}
          className={`rst-waiter-order__tab${tab === 'check' ? ' is-active' : ''}`}
          onClick={() => setTab('check')}
        >
          {t('rst.waiter.mobile.checkTab')}
          {linesCount > 0 ? <em>{linesCount}</em> : null}
          {newCount > 0 ? <i>{newCount}</i> : null}
        </button>
      </div>

      <div className="rst-waiter-order__body">
        {tab === 'menu' ? (
          <MenuPicker
            items={menuItems}
            onAdd={onAddItem}
            onComposeFamily={onComposeFamily}
            t={t}
            qtyByMenuId={qtyByMenuId}
            rankByPunch={false}
          />
        ) : (
          <>
            <OrderLines
              items={activeLines}
              onQty={onQty}
              onRemove={onRemove}
              onEditNote={onEditNote}
              categoryByMenuId={categoryByMenuId}
              priceMode="total"
              t={t}
            />
            <div className="rst-waiter-order__totals">
              <div>
                <span>{t('rst.order.subtotal', { count: linesCount })}</span>
                <strong>{fmtMoneyCompact(order.subtotal)}</strong>
              </div>
              {channel === 'DINE_IN' && servicePercent > 0 ? (
                <div>
                  <span>{t('rst.order.serviceLine', { percent: servicePercent })}</span>
                  <strong>{fmtMoneyCompact(serviceAmount)}</strong>
                </div>
              ) : null}
              {discountAmount > 0 ? (
                <div>
                  <span>{t('rst.order.discount')}</span>
                  <strong>−{fmtMoneyCompact(discountAmount)}</strong>
                </div>
              ) : null}
              <div className="is-grand">
                <span>{t('rst.order.totalDue')}</span>
                <strong>{fmtMoneyCompact(payAmount)}</strong>
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="rst-waiter-order__bar">
        {billing ? (
          <p className="rst-waiter-order__bar-hint">
            {newCount > 0 ? t('rst.order.billingHintUnsent') : t('rst.order.billingHint')}
          </p>
        ) : null}
        <div className="rst-waiter-order__bar-row">
          {tab === 'menu' ? (
            <button
              type="button"
              className="rst-waiter-order__total-chip"
              onClick={() => setTab('check')}
            >
              <span>{t('rst.order.totalDue')}</span>
              <strong>{fmtMoneyCompact(payAmount)}</strong>
            </button>
          ) : null}
          <div className="rst-waiter-order__bar-actions">
            {canEditDiscount && onDiscount ? (
              <button
                type="button"
                className="rst-waiter-order__btn rst-waiter-order__btn--ghost"
                onClick={() => setDiscountOpen(true)}
                disabled={discountPending}
              >
                {t('rst.order.discount')}
              </button>
            ) : null}
            {canSendKitchen ? (
              <button
                type="button"
                className="rst-waiter-order__btn rst-waiter-order__btn--kitchen"
                onClick={onSendKitchen}
                disabled={sendingKitchen}
              >
                {t('rst.order.sendKitchenKds')}
              </button>
            ) : null}
            {canRequestBill ? (
              <button
                type="button"
                className="rst-waiter-order__btn rst-waiter-order__btn--bill"
                onClick={onRequestBill}
                disabled={billingPending}
              >
                {t('rst.order.requestBill')}
              </button>
            ) : null}
            {canPay ? (
              <button
                type="button"
                className="rst-waiter-order__btn rst-cashier-order__btn--pay"
                onClick={onPay}
                disabled={paying}
              >
                {t('rst.order.confirmPayShort', { defaultValue: t('rst.order.pay') })}
              </button>
            ) : null}
            {canCancel ? (
              <button
                type="button"
                className="rst-waiter-order__btn rst-waiter-order__btn--ghost"
                onClick={() => setCancelAsk(true)}
              >
                {t('rst.order.cancel')}
              </button>
            ) : null}
          </div>
        </div>
      </footer>

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
