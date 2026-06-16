import { ArrowLeft } from 'lucide-react';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import PrintReceiptToggle from './payment/PrintReceiptToggle';
import PosPaymentMethodStep from './payment/PosPaymentMethodStep';
import PosPaymentCashStep from './payment/PosPaymentCashStep';
import PosPaymentMixedCashStep from './payment/PosPaymentMixedCashStep';
import PosPaymentMixedCardStep from './payment/PosPaymentMixedCardStep';
import PosPaymentCardTypeStep from './payment/PosPaymentCardTypeStep';
import PosPaymentFlowFooterPrimary from './payment/PosPaymentFlowFooterPrimary';
import PosPayFlowFooter from './payment/PosPayFlowFooter';
import PosPaymentCreditCustomerStep from './payment/PosPaymentCreditCustomerStep';
import PosPaymentAdvanceAmountStep from './payment/PosPaymentAdvanceAmountStep';
import { usePosPaymentFlow } from '../hooks/usePosPaymentFlow';

export default function PosPaymentFlow({
  onClose,
  total,
  onConfirm,
  isPending,
  openOptions = null,
  className = '',
}) {
  const p = usePosPaymentFlow({ onClose, total, onConfirm, isPending, openOptions });

  const printToggle = p.showPrintToggle ? (
    <PrintReceiptToggle
      checked={p.printReceiptEnabled}
      onChange={p.handlePrintReceiptChange}
      t={p.t}
      className="pos-pay-print-toggle--footer"
      disabled={p.isPending}
    />
  ) : null;

  const footerPrimary = p.showFooterPrimary ? (
    <PosPaymentFlowFooterPrimary
      step={p.step}
      isPending={p.isPending}
      cashExceeds={p.cashExceeds}
      cashPaidEnough={p.cashPaidEnough}
      cardRemainder={p.cardRemainder}
      payMethod={p.payMethod}
      t={p.t}
      onSubmitCreditWithCustomer={p.submitCreditWithCustomer}
      onSubmitAdvanceAmount={p.submitAdvanceAmount}
      creditCustomerSelected={Boolean(p.creditCustomer.selectedId)}
      onProceedFromMixedCash={p.proceedFromMixedCash}
      onProceedFromMixedCard={p.proceedFromMixedCard}
      onSubmitCash={p.submitCash}
    />
  ) : null;

  const footerMain =
    footerPrimary || printToggle ? (
      <PosPayFlowFooter primary={footerPrimary} printToggle={p.showPrintToggle ? printToggle : null} />
    ) : null;

  return (
    <section
      className={`pos-pay-panel pos-pay-panel--register-rail is-open is-step-${p.step}${
        className ? ` ${className}` : ''
      }`}
      aria-label={p.t('pos.paymentTitle')}
    >
      <header className="pos-pay-register-rail__head">
        {p.registerBack ? (
          <button
            type="button"
            className="pos-pay-register-rail__back"
            onClick={p.registerBack}
            aria-label={p.t('common.back')}
          >
            <ArrowLeft size={20} strokeWidth={2} aria-hidden />
          </button>
        ) : (
          <span className="pos-pay-register-rail__back pos-pay-register-rail__back--spacer" aria-hidden />
        )}
        <h2 className="pos-pay-register-rail__title">{p.stepTitle}</h2>
        {p.showHeaderAmount ? (
          <span className="pos-pay-register-rail__amount">{fmt(p.headerPayAmount)}</span>
        ) : (
          <span className="pos-pay-register-rail__amount pos-pay-register-rail__amount--spacer" aria-hidden />
        )}
      </header>

      <div className="pos-pay-panel__body">
        {p.step === 'method' || p.step === 'creditCustomer' || p.step === 'advanceAmount' ? (
          <div className="pos-pay-panel__scroll">
            {p.step === 'method' && (
              <PosPaymentMethodStep t={p.t} toPay={p.toPay} handleMethod={p.handleMethod} />
            )}
            {p.step === 'advanceAmount' && (
              <PosPaymentAdvanceAmountStep
                t={p.t}
                toPay={p.checkTotal}
                balance={p.advanceBalance}
                advanceAmount={p.advanceInput}
                setAdvanceAmount={p.setAdvanceInput}
                customerName={p.creditCustomer.selectedName}
              />
            )}
            {p.step === 'creditCustomer' && (
              <div className="pos-pay-panel__step pos-pay-panel__step--credit-customer">
                <PosPaymentCreditCustomerStep
                  t={p.t}
                  hint={
                    p.payMethod === 'advance'
                      ? p.t('pos.advancePayCustomerHint')
                      : p.t('pos.creditCustomerHint')
                  }
                  search={p.creditCustomer.search}
                  setSearch={p.creditCustomer.setSearch}
                  customers={p.creditCustomer.customers}
                  selectedId={p.creditCustomer.selectedId}
                  selectCustomer={p.creditCustomer.selectCustomer}
                  isLoading={p.creditCustomer.isLoading}
                  isFetching={p.creditCustomer.isFetching}
                  isError={p.creditCustomer.isError}
                  showCreate={p.creditCustomer.showCreate}
                  toggleCreate={p.creditCustomer.toggleCreate}
                  createName={p.creditCustomer.createName}
                  setCreateName={p.creditCustomer.setCreateName}
                  createPhone={p.creditCustomer.createPhone}
                  setCreatePhone={p.creditCustomer.setCreatePhone}
                  submitCreate={p.creditCustomer.submitCreate}
                  isCreating={p.creditCustomer.isCreating}
                />
              </div>
            )}
          </div>
        ) : (
          <>
            {p.step === 'mixedCash' && (
              <PosPaymentMixedCashStep
                t={p.t}
                toPay={p.toPay}
                cashPortion={p.cashPortion}
                setCashPortion={p.setCashPortion}
                cardRemainder={p.cardRemainder}
                mixedDistributed={p.mixedDistributed}
                mixedPercent={p.mixedPercent}
                cashExceeds={p.cashExceeds}
                mixedQuickActions={p.mixedQuickActions}
                handleCashPortionChange={p.handleCashPortionChange}
                isPending={p.isPending}
              />
            )}
            {p.step === 'mixedCard' && (
              <PosPaymentMixedCardStep
                t={p.t}
                cashPartNum={p.cashPartNum}
                cardRemainder={p.cardRemainder}
              />
            )}
            {p.step === 'cardType' && (
              <PosPaymentCardTypeStep t={p.t} isPending={p.isPending} submitCard={p.submitCard} />
            )}
            {p.step === 'cash' && (
              <PosPaymentCashStep
                t={p.t}
                toPay={p.toPay}
                tendered={p.tendered}
                setTendered={p.setTendered}
                changeDue={p.changeDue}
                cashPaidEnough={p.cashPaidEnough}
                cashShortfall={p.cashShortfall}
                isPending={p.isPending}
              />
            )}
          </>
        )}
      </div>

      <div className="pos-pay-panel__actions-wrap">
        {footerMain}
        {p.showRegisterBackToCheck ? (
          <button type="button" className="pos-pay-panel__back-check" onClick={p.handleClose}>
            <ArrowLeft size={18} aria-hidden />
            {p.t('pos.backToCheck')}
          </button>
        ) : null}
      </div>
    </section>
  );
}
