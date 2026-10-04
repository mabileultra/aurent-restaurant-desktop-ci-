import { useEffect, useMemo, useState } from 'react';
import { BaseButton } from '../../../../components/ui';
import OrderLines from '../../components/OrderLines';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { formatDigitalTimer } from '../../utils/formatElapsed';
import { resolveRestaurantPayTotal } from '../../utils/restaurantPayAmount';
import { shortWaiterName } from '../../utils/floorPosDerivations';
import '../styles/cashier-order-dock.css';

function useLiveClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function formatOpenedAt(iso) {
  if (!iso) return null;
  const at = new Date(iso);
  if (!Number.isFinite(at.getTime())) return null;
  return at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Right column — current order summary + fast pay / open actions.
 */
export default function CashierOrderDock({
  order,
  loading,
  linesPending = false,
  tableCode,
  hallName = null,
  waiterName = null,
  menuItems = [],
  canRequestBill,
  canPay,
  canSendKitchen,
  billingPending,
  paying,
  sendingKitchen,
  servicePreview = null,
  onOpenFull,
  onSendKitchen,
  onRequestBill,
  onPay,
  onRemove,
  onQty,
  onClear,
  allowKitchenRefuse = false,
  t,
}) {
  const now = useLiveClock();

  const categoryByMenuId = useMemo(() => {
    const map = {};
    for (const item of menuItems || []) {
      if (item?.id != null) map[item.id] = item.category || '';
    }
    return map;
  }, [menuItems]);

  if (loading) {
    return (
      <aside className="rst-cashier-dock">
        <div className="rst-cashier-dock__empty">{t('common.loading')}</div>
      </aside>
    );
  }

  if (!order) {
    return (
      <aside className="rst-cashier-dock">
        <div className="rst-cashier-dock__head">
          <h2>{t('rst.cashier.currentOrder')}</h2>
        </div>
        <div className="rst-cashier-dock__empty">{t('rst.cashier.pickTable')}</div>
      </aside>
    );
  }

  const items = (order.items ?? []).filter((row) => row.itemStatus !== 'CANCELLED');
  const subtotal = Number(order.subtotal) || 0;
  const servicePercent = Number(servicePreview?.percent) || 0;
  const serviceAmount = Number(servicePreview?.amount) || 0;
  const withService = subtotal + serviceAmount;
  const total = resolveRestaurantPayTotal(order, servicePreview);
  const openedClock = formatOpenedAt(order.openedAt);
  const openedTimer = formatDigitalTimer(order.openedAt, now);
  const shortWaiter = shortWaiterName(waiterName);

  return (
    <aside className="rst-cashier-dock">
      <div className="rst-cashier-dock__head">
        <div>
          <h2>{t('rst.cashier.currentOrder')}</h2>
          <p>
            {tableCode
              ? (hallName
                ? t('rst.order.ticketTitle', { code: tableCode, hall: hallName })
                : t('rst.order.ticketTitleNoHall', { code: tableCode }))
              : (order.channel === 'DINE_IN'
                ? t('rst.pos.floor')
                : order.channel === 'DELIVERY'
                  ? t('rst.pos.delivery')
                  : t('rst.pos.takeaway'))}
          </p>
          {shortWaiter ? (
            <p className="rst-cashier-dock__waiter">
              {t('rst.order.waiter')}: {shortWaiter}
            </p>
          ) : null}
          {openedClock ? (
            <p className="rst-cashier-dock__opened">
              {t('rst.cashier.openedAt', { defaultValue: 'Открыт' })}: {openedClock}
              {openedTimer ? ` · ${openedTimer}` : ''}
            </p>
          ) : null}
        </div>
        <BaseButton type="button" variant="ghost" onClick={onClear}>
          {t('common.close')}
        </BaseButton>
      </div>

      <div className="rst-cashier-dock__lines">
        {linesPending && !items.length ? (
          <div className="rst-cashier-dock__empty">{t('common.loading')}</div>
        ) : (
          <OrderLines
            items={items}
            categoryByMenuId={categoryByMenuId}
            allowKitchenRefuse={allowKitchenRefuse}
            onQty={onQty}
            onRemove={onRemove}
            priceMode="total"
            t={t}
          />
        )}
      </div>

      <div className="rst-cashier-dock__total" role="group" aria-label={t('rst.order.total')}>
        <div className="rst-cashier-dock__total-col">
          <span>{t('rst.order.withoutService')}</span>
          <strong>{fmtMoneyCompact(subtotal)}</strong>
        </div>
        <div className="rst-cashier-dock__total-col">
          <span>
            {servicePercent > 0
              ? t('rst.cashier.dockWithServicePercent', { percent: servicePercent })
              : t('rst.cashier.dockWithService')}
          </span>
          <strong>{fmtMoneyCompact(withService)}</strong>
        </div>
        <div className="rst-cashier-dock__total-col rst-cashier-dock__total-col--grand">
          <span>{t('rst.order.total')}</span>
          <strong>{fmtMoneyCompact(total)}</strong>
        </div>
      </div>

      <div className="rst-cashier-dock__actions">
        {canPay ? (
          <BaseButton
            type="button"
            className="rst-cashier-dock__pay"
            disabled={paying}
            onClick={onPay}
          >
            {t('rst.order.pay')}
          </BaseButton>
        ) : null}
        {canRequestBill ? (
          <BaseButton
            type="button"
            className="rst-cashier-dock__bill"
            disabled={billingPending}
            onClick={onRequestBill}
          >
            {t('rst.order.requestBill')}
          </BaseButton>
        ) : null}
        <BaseButton type="button" variant="ghost" onClick={onOpenFull}>
          {t('rst.cashier.openFull')}
        </BaseButton>
        {canSendKitchen ? (
          <BaseButton type="button" disabled={sendingKitchen} onClick={onSendKitchen}>
            {t('rst.order.sendKitchen')}
          </BaseButton>
        ) : null}
      </div>
    </aside>
  );
}
