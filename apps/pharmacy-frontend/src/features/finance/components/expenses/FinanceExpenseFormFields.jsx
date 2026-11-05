import { BaseInput, BaseSelect } from '../../../../components/ui';
import { accountCurrency, formatAccountLabel } from '../../utils/shared/financeCurrencies';
import FinanceCurrencySelect from '../shared/FinanceCurrencySelect';
import FinanceExpenseCounterpartyField from './FinanceExpenseCounterpartyField';

export default function FinanceExpenseFormFields({
  t,
  form,
  setForm,
  accounts,
  categories,
  users,
  isSalaryCategory,
}) {
  return (
    <div className="finance-form">
      <BaseInput
        label={t('finance.common.amount')}
        type="number"
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
      />
      <FinanceCurrencySelect
        t={t}
        value={form.currency}
        onChange={(e) => setForm({ ...form, currency: e.target.value })}
      />
      <p className="finance-form__hint">{t('finance.common.currencyHint')}</p>
      <BaseInput
        label={t('finance.common.date')}
        type="date"
        value={form.transactionDate}
        onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
      />
      <BaseSelect
        label={t('finance.common.account')}
        value={form.accountId}
        onChange={(e) => {
          const accountId = e.target.value;
          setForm({
            ...form,
            accountId,
            currency: accountCurrency(accounts, accountId),
          });
        }}
        placeholder={t('common.select')}
        options={[
          { value: '', label: t('common.select') },
          ...(accounts ?? []).map((a) => ({ value: String(a.id), label: formatAccountLabel(a) })),
        ]}
      />
      <BaseSelect
        label={t('finance.common.category')}
        value={form.expenseCategoryId}
        onChange={(e) => setForm({
          ...form,
          expenseCategoryId: e.target.value,
          supplierId: '',
          employeeId: '',
        })}
        placeholder={t('common.select')}
        options={[
          { value: '', label: t('common.select') },
          ...(categories ?? []).filter((c) => c.active).map((c) => ({ value: String(c.id), label: c.name })),
        ]}
      />
      <FinanceExpenseCounterpartyField
        t={t}
        form={form}
        setForm={setForm}
        users={users}
        isSalaryCategory={isSalaryCategory}
      />
      <BaseSelect
        label={t('finance.common.paymentMethod')}
        value={form.paymentMethod}
        onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
        options={[
          { value: 'CASH', label: t('finance.payment.cash') },
          { value: 'CARD', label: t('finance.payment.card') },
          { value: 'BANK', label: t('finance.payment.bank') },
        ]}
      />
      <BaseInput
        label={t('finance.common.comment')}
        value={form.comment}
        onChange={(e) => setForm({ ...form, comment: e.target.value })}
      />
    </div>
  );
}
