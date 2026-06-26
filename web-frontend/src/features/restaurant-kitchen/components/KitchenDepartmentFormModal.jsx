import { BaseButton, BaseInput, BaseModal } from '../../../components/ui';
import '../styles/kitchen-department-form-modal.css';

export default function KitchenDepartmentFormModal({
  open,
  mode,
  form,
  onChange,
  onClose,
  onSubmit,
  isPending,
  t,
}) {
  if (!open) return null;

  const canSubmit = form.value?.trim() && form.label?.trim();

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? t('restaurantKitchen.editDepartment') : t('restaurantKitchen.addDepartment')}
    >
      <form
        className="kitchen-department-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onSubmit();
        }}
      >
        <label className="kitchen-department-form__field">
          <span className="kitchen-department-form__label">{t('restaurantKitchen.departmentCode')}</span>
          <BaseInput
            value={form.value}
            onChange={(e) => onChange({ ...form, value: e.target.value.toUpperCase() })}
            placeholder="HOT"
            required
            disabled={mode === 'edit'}
          />
          <span className="kitchen-department-form__hint">{t('restaurantKitchen.departmentCodeHint')}</span>
        </label>

        <label className="kitchen-department-form__field">
          <span className="kitchen-department-form__label">{t('restaurantKitchen.departmentName')}</span>
          <BaseInput
            value={form.label}
            onChange={(e) => onChange({ ...form, label: e.target.value })}
            placeholder={t('restaurantKitchen.departmentNamePh')}
            required
          />
        </label>

        <label className="kitchen-department-form__field">
          <span className="kitchen-department-form__label">{t('restaurantKitchen.departmentSort')}</span>
          <BaseInput
            type="number"
            min={1}
            step={10}
            value={form.sortOrder}
            onChange={(e) => onChange({ ...form, sortOrder: e.target.value })}
          />
        </label>

        <div className="kitchen-department-form__actions">
          <BaseButton type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</BaseButton>
          <BaseButton type="submit" disabled={!canSubmit || isPending}>{t('common.save')}</BaseButton>
        </div>
      </form>
    </BaseModal>
  );
}
