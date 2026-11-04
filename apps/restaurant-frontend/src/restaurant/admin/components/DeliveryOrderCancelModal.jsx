import { BaseButton, BaseModal } from '../../../components/ui';
import '../styles/delivery-order-cancel-modal.css';

export default function DeliveryOrderCancelModal({
  order,
  isPending,
  onClose,
  onConfirm,
  t,
}) {
  if (!order) return null;

  return (
    <BaseModal open={!!order} onClose={onClose} title={t('restaurantDelivery.cancelTitle')}>
      <div className="delivery-order-cancel-modal">
        <p className="delivery-order-cancel-modal__text">
          {t('restaurantDelivery.cancelHint', {
            number: order.orderNo != null ? `#${order.orderNo}` : `#${String(order.id).slice(0, 8)}`,
            client: order.clientName || '—',
          })}
        </p>
        <div className="delivery-order-cancel-modal__actions">
          <BaseButton type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton type="button" variant="danger" onClick={onConfirm} disabled={isPending}>
            {t('restaurantDelivery.cancelOrder')}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}
