import { BaseButton, BaseInput, BaseModal } from '../../../components/ui';
import '../styles/delivery-order-edit-modal.css';

/** Create restaurant-floor delivery order (rst channel), not retail /orders. */
export default function DeliveryOrderCreateModal({
  open,
  form,
  saving,
  onChange,
  onClose,
  onSubmit,
  t,
}) {
  if (!open) return null;

  const canSubmit = form.clientName.trim() && form.clientPhone.trim() && form.deliveryAddress.trim();

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={t('rst.delivery.addTitle', { defaultValue: 'Новая доставка' })}
    >
      <form
        className="delivery-order-edit-modal"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onSubmit();
        }}
      >
        <label className="delivery-order-edit-modal__field">
          <span className="delivery-order-edit-modal__label">{t('orders.wizard.clientName')}</span>
          <BaseInput
            value={form.clientName}
            onChange={(e) => onChange({ ...form, clientName: e.target.value })}
            required
          />
        </label>

        <label className="delivery-order-edit-modal__field">
          <span className="delivery-order-edit-modal__label">{t('orders.wizard.clientPhone')}</span>
          <BaseInput
            value={form.clientPhone}
            onChange={(e) => onChange({ ...form, clientPhone: e.target.value })}
            required
          />
        </label>

        <label className="delivery-order-edit-modal__field">
          <span className="delivery-order-edit-modal__label">{t('orders.wizard.address')}</span>
          <textarea
            rows={3}
            value={form.deliveryAddress}
            onChange={(e) => onChange({ ...form, deliveryAddress: e.target.value })}
            className="delivery-order-edit-modal__textarea"
            required
          />
        </label>

        <label className="delivery-order-edit-modal__field">
          <span className="delivery-order-edit-modal__label">{t('orders.wizard.comment')}</span>
          <textarea
            rows={2}
            value={form.comment}
            onChange={(e) => onChange({ ...form, comment: e.target.value })}
            className="delivery-order-edit-modal__textarea"
          />
        </label>

        <p className="delivery-order-edit-modal__hint">
          {t('rst.delivery.addHint', {
            defaultValue: 'Заказ откроется в POS доставки. Блюда и оплату добавляйте там.',
          })}
        </p>

        <div className="delivery-order-edit-modal__actions">
          <BaseButton type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</BaseButton>
          <BaseButton type="submit" disabled={!canSubmit || saving}>
            {t('rst.delivery.add', { defaultValue: 'Создать' })}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
}
