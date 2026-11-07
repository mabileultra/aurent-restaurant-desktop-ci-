import { BaseButton, BaseInput, BaseModal, BaseSelect } from '../../../../components/ui';

export default function FinanceDebtPayModal({
  payModal,
  onClose,
  form,
  setForm,
  applyForm,
  setApplyForm,
  accounts = [],
  onSubmit,
  isPending,
  t,
}) {
  const isAdvance = payModal?.type === 'advance';
  const title = isAdvance
    ? t('finance.debts.applyAdvanceTitle', { name: payModal?.counterpartyName ?? '' })
    : t('finance.debts.payTitle', { name: payModal?.counterpartyName ?? '' });

  const isSubmitDisabled = isPending
    || (isAdvance ? !applyForm.amount : !form.amount || !form.accountId);

  return (
    <BaseModal
      open={Boolean(payModal)}
      onClose={onClose}
      title={title}
      size="lg"
      className="finance-modal finance-modal--wide"
      bodyClassName="finance-modal__body"
    >
      <div className="finance-form">
        <BaseInput
          label={t('finance.common.amount')}
          type="number"
          value={isAdvance ? applyForm.amount : form.amount}
          onChange={(e) => (
            isAdvance
              ? setApplyForm({ ...applyForm, amount: e.target.value })
              : setForm({ ...form, amount: e.target.value })
          )}
        />
        {!isAdvance ? (
          <>
            <BaseSelect
              label={t('finance.common.account')}
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              placeholder={t('common.select')}
              options={[
                { value: '', label: t('common.select') },
                ...accounts.map((a) => ({ value: String(a.id), label: a.name })),
              ]}
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
          </>
        ) : null}
        <BaseInput
          label={t('finance.common.comment')}
          value={isAdvance ? applyForm.comment : form.comment}
          onChange={(e) => (
            isAdvance
              ? setApplyForm({ ...applyForm, comment: e.target.value })
              : setForm({ ...form, comment: e.target.value })
          )}
        />
        <div className="finance-form__actions">
          <BaseButton variant="secondary" onClick={onClose}>{t('common.cancel')}</BaseButton>
          <BaseButton
            onClick={onSubmit}
            disabled={isSubmitDisabled}
          >
            {isAdvance
              ? t('finance.debts.confirmApplyAdvance')
              : t('finance.debts.confirmPay')}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}
