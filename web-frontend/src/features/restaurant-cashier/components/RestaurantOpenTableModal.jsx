import { useState } from 'react';
import BaseModal from '../../../components/ui/BaseModal';
import BaseButton from '../../../components/ui/BaseButton';
import BaseInput from '../../../components/ui/BaseInput';

export default function RestaurantOpenTableModal({
  open,
  table,
  onClose,
  onConfirm,
  isPending,
  t,
}) {
  const [guestCount, setGuestCount] = useState('2');

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const count = Number(guestCount);
    if (!Number.isFinite(count) || count < 1) return;
    onConfirm(count);
  };

  return (
    <BaseModal open={open} onClose={onClose} title={t('restaurantCashier.openTableTitle', { code: table?.code ?? '' })}>
      <form onSubmit={handleSubmit} className="restaurant-open-table-form">
        <BaseInput
          label={t('restaurantCashier.guestCount')}
          type="number"
          min={1}
          max={99}
          value={guestCount}
          onChange={(e) => setGuestCount(e.target.value)}
          required
        />
        <div className="restaurant-open-table-form__actions">
          <BaseButton type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton type="submit" loading={isPending}>
            {t('restaurantCashier.openTable')}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
}
