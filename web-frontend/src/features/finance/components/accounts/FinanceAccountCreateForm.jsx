import { BaseButton, BaseInput, BaseSelect } from '../../../../components/ui';
import FinanceCurrencySelect from '../shared/FinanceCurrencySelect';

export default function FinanceAccountCreateForm({
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
      <FinanceCurrencySelect
        t={t}
        value={form.currency}
        onChange={(e) => setForm({ ...form, currency: e.target.value })}
      />
      <BaseInput
        label={t('finance.accounts.initialBalance')}
        type="number"
        value={form.initialBalance}
        onChange={(e) => setForm({ ...form, initialBalance: e.target.value })}
      />
      <div className="finance-form__actions">
        <BaseButton variant="secondary" onClick={onCancel}>{t('common.cancel')}</BaseButton>
        <BaseButton onClick={onSubmit} disabled={!form.name.trim() || isPending}>{t('common.save')}</BaseButton>
      </div>
    </div>
  );
}
