import { BaseButton } from '../../../../components/ui';
import OrderLines from '../../components/OrderLines';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { resolveRestaurantPayTotal } from '../../utils/restaurantPayAmount';
import '../styles/cashier-order-dock.css';

/**
 * Right column — current order summary + fast pay / open actions.
 */
export default function CashierOrderDock({
  order,
  loading,
  tableCode,
  waiterName = null,
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
  const total = resolveRestaurantPayTotal(order, servicePreview);

  return (
    <aside className="rst-cashier-dock">
      <div className="rst-cashier-dock__head">
        <div>
          <h2>{t('rst.cashier.currentOrder')}</h2>
          <p>
            {tableCode
              ? t('rst.floor.tableTitle', { code: tableCode })
              : (order.channel === 'DINE_IN'
                ? t('rst.pos.floor')
                : order.channel === 'DELIVERY'
                  ? t('rst.pos.delivery')
                  : t('rst.pos.takeaway'))}
            {' · '}
            №{order.orderNo}
          </p>
          {waiterName ? (
            <p className="rst-cashier-dock__waiter">
              {t('rst.order.waiter')}: {waiterName}
            </p>
          ) : null}
        </div>
        <BaseButton type="button" variant="ghost" onClick={onClear}>
          {t('common.close')}
        </BaseButton>
      </div>

      <div className="rst-cashier-dock__lines">
        <OrderLines
          items={items}
          allowKitchenRefuse={allowKitchenRefuse}
          onQty={onQty}
          onRemove={onRemove}
          t={t}
        />
      </div>

      <div className="rst-cashier-dock__total">
        <span>{t('rst.order.total')}</span>
        <strong>{fmtMoneyCompact(total)}</strong>
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
        <div className="rst-cashier-dock__actions-row">
          <BaseButton type="button" variant="ghost" onClick={onOpenFull}>
            {t('rst.cashier.openFull')}
          </BaseButton>
          {canSendKitchen ? (
            <BaseButton type="button" disabled={sendingKitchen} onClick={onSendKitchen}>
              {t('rst.order.sendKitchen')}
            </BaseButton>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
