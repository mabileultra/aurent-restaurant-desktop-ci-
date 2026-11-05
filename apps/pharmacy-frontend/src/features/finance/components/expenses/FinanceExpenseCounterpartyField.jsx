import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import SupplierLookupSelect from '../../../../components/supplier-lookup/SupplierLookupSelect';
import { BaseSelect } from '../../../../components/ui';
import '../../../../styles/finance/counterparty-field.css';

export default function FinanceExpenseCounterpartyField({
  t,
  form,
  setForm,
  users,
  isSalaryCategory,
}) {
  return (
    <div className="finance-counterparty-field">
      {isSalaryCategory ? (
        <BaseSelect
          label={t('finance.expenses.employee')}
          value={form.employeeId}
          onChange={(e) => setForm({ ...form, employeeId: e.target.value, supplierId: '' })}
          placeholder={t('common.select')}
          options={[
            { value: '', label: t('common.select') },
            ...(users ?? []).map((u) => ({ value: String(u.id), label: u.fullName })),
          ]}
        />
      ) : (
        <SupplierLookupSelect
          label={t('finance.expenses.counterparty')}
          name="supplierId"
          value={form.supplierId}
          onChange={(e) => setForm({ ...form, supplierId: e.target.value, employeeId: '' })}
          placeholder={t('finance.expenses.counterpartyPlaceholder')}
        />
      )}

      <div className="finance-counterparty-field__actions">
        {isSalaryCategory ? (
          <Link to="/users/list" className="finance-counterparty-field__link" target="_blank" rel="noreferrer">
            <ExternalLink size={14} aria-hidden />
            {t('finance.expenses.openEmployees')}
          </Link>
        ) : (
          <Link to="/stock/suppliers" className="finance-counterparty-field__link" target="_blank" rel="noreferrer">
            <ExternalLink size={14} aria-hidden />
            {t('finance.expenses.addSupplier')}
          </Link>
        )}
      </div>

      <p className="finance-form__hint">{t('finance.expenses.counterpartyHint')}</p>
    </div>
  );
}
