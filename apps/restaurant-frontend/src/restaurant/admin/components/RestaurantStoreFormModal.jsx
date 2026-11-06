import RstModal from '../../shared/components/RstModal';
import { BaseInput } from '../../../components/ui';

export default function RestaurantStoreFormModal({
  open,
  mode,
  form,
  typeOptions = [],
  onChange,
  onClose,
  onSubmit,
  isPending,
  t,
}) {
  if (!open || !form) return null;

  return (
    <RstModal
      open={open}
      title={mode === 'edit' ? t('rst.admin.editRestaurant') : t('rst.admin.addRestaurant')}
      onClose={onClose}
      onSubmit={onSubmit}
      isPending={isPending}
      submitLabel={t('common.save')}
      cancelLabel={t('common.cancel')}
      asForm
    >
      <BaseInput
        label={t('stores.colName')}
        required
        value={form.name}
        onChange={(e) => onChange({ ...form, name: e.target.value })}
      />
      <label className="rst-admin-field">
        <span className="rst-admin-field__label">{t('stores.colBusinessType')}</span>
        <select
          className="form-select"
          value={form.businessType}
          onChange={(e) => onChange({ ...form, businessType: e.target.value })}
        >
          {typeOptions.map((opt) => (
            <option key={opt.code} value={opt.code}>{opt.label}</option>
          ))}
        </select>
        <span className="rst-admin-field__hint">{t('rst.admin.storeTypeHint')}</span>
      </label>
      <BaseInput
        label={t('stores.colAddress')}
        value={form.address}
        onChange={(e) => onChange({ ...form, address: e.target.value })}
      />
      <BaseInput
        label={t('stores.colPhone')}
        value={form.phone}
        onChange={(e) => onChange({ ...form, phone: e.target.value })}
      />
      <BaseInput
        label={t('rst.admin.storeCode')}
        value={form.code}
        onChange={(e) => onChange({ ...form, code: e.target.value })}
      />
      <label className="rst-admin-check">
        <input
          type="checkbox"
          checked={form.active !== false}
          onChange={(e) => onChange({ ...form, active: e.target.checked })}
        />
        <span>{t('stores.activeLabel')}</span>
      </label>
    </RstModal>
  );
}
