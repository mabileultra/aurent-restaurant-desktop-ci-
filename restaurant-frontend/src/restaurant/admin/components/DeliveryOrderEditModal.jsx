import { BaseButton, BaseInput, BaseModal, BaseSelect } from '../../../components/ui';
import '../styles/delivery-order-edit-modal.css';

export default function DeliveryOrderEditModal({
  open,
  form,
  couriers,
  couriersLoading,
  loading,
  saving,
  onChange,
  onClose,
  onSubmit,
  t,
}) {
  if (!open) return null;

  const canSubmit = form.clientName.trim() && form.clientPhone.trim() && form.deliveryAddress.trim();

  return (
    <BaseModal open={open} onClose={onClose} title={t('restaurantDelivery.editTitle')}>
      {loading ? (
        <p className="delivery-order-edit-modal__loading">{t('common.loading')}</p>
      ) : (
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

          <div className="delivery-order-edit-modal__field">
            <BaseSelect
              label={t('orders.wizard.assignCourier')}
              value={form.courierId}
              onChange={(e) => onChange({ ...form, courierId: e.target.value })}
              disabled={couriersLoading}
              placeholder={t('orders.filterDash')}
              options={[
                { value: '', label: t('orders.filterDash') },
                ...couriers.map((c) => ({ value: String(c.id), label: c.fullName })),
              ]}
            />
            {!couriersLoading && couriers.length === 0 ? (
              <p className="delivery-order-edit-modal__hint">{t('orders.noCourierUsers')}</p>
            ) : null}
          </div>

          <div className="delivery-order-edit-modal__actions">
            <BaseButton type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</BaseButton>
            <BaseButton type="submit" disabled={!canSubmit || saving}>{t('common.save')}</BaseButton>
          </div>
        </form>
      )}
    </BaseModal>
  );
}
