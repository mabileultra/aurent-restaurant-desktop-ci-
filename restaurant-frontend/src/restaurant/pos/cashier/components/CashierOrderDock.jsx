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
  canRequestBill,
  canPay,
  canSendKitchen,
  billingPending,
  paying,
  sendingKitchen,
  commissionPreview = null,
  onOpenFull,
  onSendKitchen,
  onRequestBill,
  onPay,
  onClear,
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
  const total = resolveRestaurantPayTotal(order, commissionPreview);

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
        </div>
        <BaseButton type="button" variant="ghost" onClick={onClear}>
          {t('common.close')}
        </BaseButton>
      </div>

      <div className="rst-cashier-dock__lines">
        <OrderLines items={items} locked t={t} />
      </div>

      <div className="rst-cashier-dock__total">
        <span>{t('rst.order.total')}</span>
        <strong>{fmtMoneyCompact(total)}</strong>
      </div>

      <div className="rst-cashier-dock__actions">
        <BaseButton type="button" variant="ghost" onClick={onOpenFull}>
          {t('rst.cashier.openFull')}
        </BaseButton>
        {canSendKitchen ? (
          <BaseButton type="button" disabled={sendingKitchen} onClick={onSendKitchen}>
            {t('rst.order.sendKitchen')}
          </BaseButton>
        ) : null}
        {canRequestBill ? (
          <BaseButton type="button" disabled={billingPending} onClick={onRequestBill}>
            {t('rst.order.requestBill')}
          </BaseButton>
        ) : null}
        {canPay ? (
          <BaseButton
            type="button"
            disabled={paying}
            onClick={onPay}
          >
            {t('rst.order.pay')}
          </BaseButton>
        ) : null}
      </div>
    </aside>
  );
}
