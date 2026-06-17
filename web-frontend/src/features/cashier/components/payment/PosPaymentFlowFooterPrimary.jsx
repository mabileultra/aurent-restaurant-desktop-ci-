import { Loader, Check } from 'lucide-react';

export default function PosPaymentFlowFooterPrimary({
  step,
  isPending,
  cashPaidEnough,
  payMethod,
  t,
  onSubmitCreditWithCustomer,
  onSubmitAdvanceAmount,
  creditCustomerSelected,
  onSubmitCash,
}) {
  if (step === 'creditCustomer') {
    const isAdvancePay = payMethod === 'advance';
    return (
      <button
        type="button"
        className="pos-register-pay-footer__sale"
        disabled={isPending || !creditCustomerSelected}
        onClick={onSubmitCreditWithCustomer}
      >
        {isPending ? <Loader size={20} className="pos-register-pay-footer__spin" /> : <Check size={20} strokeWidth={2.5} />}
        <span>{isAdvancePay ? t('pos.continueAdvancePay') : t('pos.continuePay')}</span>
      </button>
    );
  }
  if (step === 'advanceAmount') {
    return (
      <button
        type="button"
        className="pos-register-pay-footer__sale"
        disabled={isPending}
        onClick={onSubmitAdvanceAmount}
      >
        {isPending ? <Loader size={20} className="pos-register-pay-footer__spin" /> : <Check size={20} strokeWidth={2.5} />}
        <span>{t('pos.continuePay')}</span>
      </button>
    );
  }
  if (step === 'cash') {
    return (
      <button
        type="button"
        className="pos-register-pay-footer__sale"
        disabled={isPending || !cashPaidEnough}
        onClick={onSubmitCash}
      >
        {isPending ? <Loader size={20} className="pos-register-pay-footer__spin" /> : <Check size={20} strokeWidth={2.5} />}
        <span>{t('pos.completeSale')}</span>
      </button>
    );
  }
  return null;
}
