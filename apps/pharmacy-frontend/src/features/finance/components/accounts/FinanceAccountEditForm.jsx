import { BaseButton, BaseInput, BaseSelect } from '../../../../components/ui';

export default function FinanceAccountEditForm({
  t,
  form,
  setForm,
  accountTypes,
  onCancel,
  onSubmit,
  isPending,
}) {
  return (
    <div className="finance-form">
      <BaseInput
        label={t('finance.accounts.name')}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <BaseSelect
        label={t('finance.accounts.type')}
        value={form.type}
        onChange={(e) => setForm({ ...form, type: e.target.value })}
        options={accountTypes.map((type) => ({ value: type, label: type }))}
      />
      <label className="finance-form__label finance-form__label--checkbox">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm({ ...form, active: e.target.checked })}
        />
        {t('common.active')}
      </label>
      <div className="finance-form__actions">
        <BaseButton variant="secondary" onClick={onCancel}>{t('common.cancel')}</BaseButton>
        <BaseButton onClick={onSubmit} disabled={!form.name.trim() || isPending}>{t('common.save')}</BaseButton>
      </div>
    </div>
  );
}
