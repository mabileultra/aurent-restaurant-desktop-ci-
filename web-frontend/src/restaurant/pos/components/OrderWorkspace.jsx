import { BaseButton } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
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

  return (
    <div className="rst-order">
      <section className="rst-order__catalog">
        <div className="rst-order__head">
          <div>
            <h2 className="rst-coming__title">{t('rst.order.menu')}</h2>
            <p className="rst-order__meta">{billing ? t('rst.order.billingHint') : t('rst.order.addHint')}</p>
          </div>
          <BaseButton type="button" variant="ghost" onClick={onBack}>
            {backLabel || t('rst.order.backToFloor')}
          </BaseButton>
        </div>
        {billing ? (
          <div className="rst-order-empty">{t('rst.order.billingHint')}</div>
        ) : (
          <MenuPicker items={menuItems} onAdd={onAddItem} t={t} />
        )}
      </section>
      <aside className="rst-order__ticket">
        <div className="rst-order__head">
          <div>
            <h2 className="rst-coming__title">{ticketTitle}</h2>
            <p className="rst-order__meta">{ticketMeta}</p>
          </div>
        </div>
        <OrderLines
          items={order.items ?? []}
          onQty={onQty}
          onRemove={onRemove}
          locked={billing}
          t={t}
        />
        <div className="rst-order__total">
          <span>{t('rst.order.total')}</span>
          <span>{fmtMoneyCompact(order.subtotal)}</span>
        </div>
        <div className="rst-order__footer">
          {canSendKitchen ? (
            <BaseButton type="button" onClick={onSendKitchen} disabled={sendingKitchen}>
              {t('rst.order.sendKitchen')}
            </BaseButton>
          ) : null}
          {canRequestBill ? (
            <BaseButton type="button" onClick={onRequestBill} disabled={billingPending}>
              {t('rst.order.requestBill')}
            </BaseButton>
          ) : null}
          {canPay ? (
            <>
              <BaseButton type="button" onClick={() => onPay('CASH')} disabled={paying}>
                {t('rst.order.payCash')}
              </BaseButton>
              <BaseButton type="button" onClick={() => onPay('CARD')} disabled={paying}>
                {t('rst.order.payCard')}
              </BaseButton>
            </>
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
