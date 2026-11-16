import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Check,
  ClipboardList,
  FileText,
  Loader,
  Pause,
  Percent,
  QrCode,
  RotateCcw,
  Split,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { parseTenderedInput } from '../../cashier/components/payment/posPaymentConstants';
import { PAYMENT_PROVIDER_LOGOS } from '../../cashier/constants/paymentProviderLogos';
import PrintReceiptToggle from '../../cashier/components/payment/PrintReceiptToggle';
import PharmacyPayQuickCash from './PharmacyPayQuickCash';
import PharmacyMixedPayModal from './PharmacyMixedPayModal';
import PharmacyCardDetailsModal from './PharmacyCardDetailsModal';
import { usePharmacyPosActions } from '../../../pharmacy/pos/pharmacyPosActions';
import { usePharmacyPayKeyboard } from '../hooks/usePharmacyPayKeyboard';
import { usePharmacyPayRail } from '../hooks/usePharmacyPayRail';
import '../styles/pharmacy-pay-stack.css';

/**
 * Левая tall-stack панель оплаты аптеки (ТЗ §3).
 * Логика CASH/CARD/MIXED/CASHLESS — usePharmacyPayRail.
 */
export default function PharmacyPayStack({
  total,
  onReturn,
  onDiscount,
  onHold,
  onPreviewCheck,
  onParkedList,
  onCashIn,
  onCashOut,
  onConfirm,
  checkoutDisabled,
  isPending,
}) {
  const { t } = useTranslation();
  const actions = usePharmacyPosActions();
  const [mixedOpen, setMixedOpen] = useState(false);
  const [pendingCardType, setPendingCardType] = useState(null);
  const rail = usePharmacyPayRail({
    total,
    checkoutDisabled,
    isPending,
    onConfirm,
  });

  const openMixed = useCallback(() => {
    rail.setMethod('mixed');
    setMixedOpen(true);
  }, [rail.setMethod]);

  const closeMixed = useCallback(() => {
    setMixedOpen(false);
    rail.setMethod('cash');
    rail.clearCash();
  }, [rail.clearCash, rail.setMethod]);

  const openCardModal = useCallback(
    (cardType) => {
      if (checkoutDisabled || isPending) return;
      if (rail.toPay <= 0 || (rail.cardPayBlocked && rail.method !== 'mixed')) {
        rail.submitCard(cardType);
        return;
      }
      setPendingCardType(cardType);
    },
    [checkoutDisabled, isPending, rail.cardPayBlocked, rail.method, rail.submitCard, rail.toPay],
  );

  const handleConfirmCardModal = useCallback(
    (cardType, cardDetails) => {
      setPendingCardType(null);
      rail.submitCard(cardType, cardDetails);
    },
    [rail.submitCard],
  );

  const handleSubmitSale = useCallback(() => {
    if (rail.method === 'cash' && rail.hasPartialCash) {
      openCardModal(rail.cardType);
      return;
    }
    if (rail.method === 'card' || (rail.method === 'mixed' && rail.hasPartialCash)) {
      openCardModal(rail.cardType);
      return;
    }
    rail.submitSale();
  }, [openCardModal, rail.cardType, rail.hasPartialCash, rail.method, rail.submitSale]);

  usePharmacyPayKeyboard({
    enabled: !checkoutDisabled && !mixedOpen && !pendingCardType,
    method: rail.method,
    setMethod: rail.setMethod,
    setExactAmount: rail.setExactAmount,
    appendCashDigit: rail.appendCashDigit,
    backspaceCash: rail.backspaceCash,
    clearCash: rail.clearCash,
    submitSale: handleSubmitSale,
    saleDisabled: rail.saleDisabled,
    onCash: () => rail.setMethod('cash'),
    onHumo: () => openCardModal('HUMO'),
    onUzcard: () => openCardModal('UZCARD'),
    onHold,
    onParkedList,
    onMixed: openMixed,
  });

  useEffect(() => {
    actions?.bindPay({
      mixed: openMixed,
      CLICK: () => openCardModal('CLICK'),
      PAYME: () => openCardModal('PAYME'),
      cashless: () => rail.setMethod('cashless'),
    });
    return () => actions?.bindPay({});
  }, [actions, openCardModal, openMixed, rail.setMethod]);

  const showCashPad = rail.method === 'cash';
  const receivedDisplay = rail.cashInput
    ? fmt(parseTenderedInput(rail.cashInput))
    : '—';
  const busy = checkoutDisabled || isPending;

  return (
    <aside className={`pharmacy-pay-stack${rail.method === 'cashless' ? ' is-cashless' : ''}`} aria-label={t('pos.paymentTitle')}>
      <div className="pharmacy-pay-stack__total pharmacy-pay-stack__aside">
        <span className="pharmacy-pay-stack__total-label">{t('pos.amountToPay')}</span>
        <strong className="pharmacy-pay-stack__total-value">{fmt(rail.toPay)}</strong>
      </div>

      <div className="pharmacy-pay-stack__actions" role="group" aria-label={t('pos.paymentTitle')}>
        <button
          type="button"
          className={`pharmacy-pay-stack__btn${rail.method === 'cash' ? ' is-active' : ''}`}
          disabled={busy}
          title={`${t('pharmacyCashier.pay.methodCash')} [F9]`}
          onClick={() => rail.setMethod('cash')}
        >
          <Banknote size={18} strokeWidth={2.1} aria-hidden />
          <span>{t('pharmacyCashier.pay.methodCash')}</span>
          <kbd>F9</kbd>
        </button>

        <button
          type="button"
          className="pharmacy-pay-stack__btn pharmacy-pay-stack__btn--card"
          disabled={busy || rail.cardPayBlocked}
          title={`${t('pos.cardUzcard')} [F11]`}
          onClick={() => openCardModal('UZCARD')}
        >
          <img src={PAYMENT_PROVIDER_LOGOS.UZCARD} alt="" className="pharmacy-pay-stack__logo" />
          <span>UzCard</span>
          <kbd>F11</kbd>
        </button>

        <button
          type="button"
          className="pharmacy-pay-stack__btn pharmacy-pay-stack__btn--card"
          disabled={busy || rail.cardPayBlocked}
          title={`${t('pos.cardHumo')} [F10]`}
          onClick={() => openCardModal('HUMO')}
        >
          <img src={PAYMENT_PROVIDER_LOGOS.HUMO} alt="" className="pharmacy-pay-stack__logo" />
          <span>HUMO</span>
          <kbd>F10</kbd>
        </button>

        <button
          type="button"
          className="pharmacy-pay-stack__btn pharmacy-pay-stack__btn--card pharmacy-pay-stack__btn--extra"
          disabled={busy || rail.cardPayBlocked}
          title={t('pos.cardClick')}
          onClick={() => openCardModal('CLICK')}
        >
          <img src={PAYMENT_PROVIDER_LOGOS.CLICK} alt="" className="pharmacy-pay-stack__logo" />
          <span>Click</span>
        </button>

        <button
          type="button"
          className={`pharmacy-pay-stack__btn pharmacy-pay-stack__btn--extra${rail.method === 'mixed' ? ' is-active' : ''}`}
          disabled={busy}
          title={`${t('pharmacyCashier.pay.methodMixed')} [F8]`}
          onClick={openMixed}
        >
          <Split size={18} strokeWidth={2.1} aria-hidden />
          <span>{t('pharmacyCashier.pay.methodMixed')}</span>
          <kbd>F8</kbd>
        </button>

        <button
          type="button"
          className={`pharmacy-pay-stack__btn pharmacy-pay-stack__btn--extra${rail.method === 'cashless' ? ' is-active' : ''}`}
          disabled={busy}
          title={`${t('pharmacyCashier.pay.methodCashless')} [F4]`}
          onClick={() => rail.setMethod('cashless')}
        >
          <QrCode size={18} strokeWidth={2.1} aria-hidden />
          <span>{t('pharmacyCashier.pay.methodCashless')}</span>
          <kbd>F4</kbd>
        </button>
      </div>

      {rail.saleHint ? <p className="pharmacy-pay-stack__hint pharmacy-pay-stack__aside">{rail.saleHint}</p> : null}

      {showCashPad ? (
        <div className="pharmacy-pay-stack__cash pharmacy-pay-stack__aside">
          <div className="pharmacy-pay-stack__cash-row">
            <span>{t('pos.receivedLabel')}</span>
            <strong>{receivedDisplay}</strong>
          </div>
          <div className={`pharmacy-pay-stack__cash-row${rail.hasPartialCash ? ' is-remainder' : ''}`}>
            <span>{rail.hasPartialCash ? t('pos.cardRemainderRail') : t('pos.change')}</span>
            <strong>{fmt(rail.hasPartialCash ? rail.cardRemainder : rail.changeDue)}</strong>
          </div>
          <PharmacyPayQuickCash
            value={rail.cashInput}
            onChange={rail.setCashInput}
            exactAmount={rail.toPay}
            onExact={rail.setExactAmount}
            onReset={rail.clearCash}
            quickActions={rail.quickCash}
            disabled={busy}
            title={t('pharmacyCashier.pay.quickTitle')}
            exactLabel={t('pharmacyCashier.pay.exact')}
            resetLabel={t('pharmacyCashier.pay.reset')}
          />
        </div>
      ) : null}

      <PrintReceiptToggle
        checked={rail.printReceiptEnabled}
        onChange={rail.handlePrintReceiptChange}
        t={t}
        className="pharmacy-pay-stack__print"
        disabled={busy}
      />

      <div className="pharmacy-pay-stack__ops" role="group">
        <button type="button" className="pharmacy-pay-stack__btn pharmacy-pay-stack__btn--preview" disabled={busy} onClick={onPreviewCheck}>
          <FileText size={18} strokeWidth={2.1} aria-hidden />
          <span>{t('pharmacyCashier.pay.previewCheck')}</span>
        </button>

        <button
          type="button"
          className="pharmacy-pay-stack__btn pharmacy-pay-stack__btn--sale"
          disabled={rail.saleDisabled}
          title={`${t('pharmacyCashier.pay.saleAction')} [F12]`}
          onClick={handleSubmitSale}
        >
          {isPending ? <Loader size={18} className="pharmacy-pay-stack__spin" aria-hidden /> : <Check size={18} strokeWidth={2.5} aria-hidden />}
          <span>{t('pharmacyCashier.pay.saleAction')}</span>
          <kbd>F12</kbd>
        </button>

        <button type="button" className="pharmacy-pay-stack__btn" disabled={busy} title={`${t('pos.holdReceipt')} [F7]`} onClick={onHold}>
          <Pause size={18} strokeWidth={2.1} aria-hidden />
          <span>{t('pos.holdReceipt', { defaultValue: 'Отложить' })}</span>
          <kbd>F7</kbd>
        </button>

        <button type="button" className="pharmacy-pay-stack__btn" disabled={busy} onClick={onDiscount}>
          <Percent size={18} strokeWidth={2.1} aria-hidden />
          <span>{t('pos.discount')}</span>
        </button>

        <button
          type="button"
          className="pharmacy-pay-stack__btn"
          disabled={busy}
          title={`${t('pharmacyCashier.pay.parkedList')} [F6]`}
          onClick={onParkedList}
        >
          <ClipboardList size={18} strokeWidth={2.1} aria-hidden />
          <span>{t('pharmacyCashier.pay.parkedList')}</span>
          <kbd>F6</kbd>
        </button>

        <button
          type="button"
          className="pharmacy-pay-stack__btn pharmacy-pay-stack__btn--return"
          disabled={busy}
          onClick={onReturn}
        >
          <RotateCcw size={18} strokeWidth={2.1} aria-hidden />
          <span>{t('pos.return')}</span>
        </button>

        {onCashIn ? (
          <button type="button" className="pharmacy-pay-stack__btn" disabled={busy} onClick={onCashIn}>
            <ArrowDownLeft size={18} strokeWidth={2.1} aria-hidden />
            <span>{t('pos.cashIn', { defaultValue: 'Kirim' })}</span>
          </button>
        ) : null}
        {onCashOut ? (
          <button type="button" className="pharmacy-pay-stack__btn" disabled={busy} onClick={onCashOut}>
            <ArrowUpRight size={18} strokeWidth={2.1} aria-hidden />
            <span>{t('pos.cashOut', { defaultValue: 'Chiqim' })}</span>
          </button>
        ) : null}
      </div>

      <PharmacyMixedPayModal
        open={mixedOpen}
        onClose={closeMixed}
        rail={rail}
        busy={busy}
        t={t}
      />

      <PharmacyCardDetailsModal
        open={Boolean(pendingCardType)}
        cardType={pendingCardType}
        amount={rail.hasPartialCash ? rail.cardRemainder : rail.toPay}
        busy={busy}
        onClose={() => setPendingCardType(null)}
        onConfirm={handleConfirmCardModal}
        t={t}
      />
    </aside>
  );
}
