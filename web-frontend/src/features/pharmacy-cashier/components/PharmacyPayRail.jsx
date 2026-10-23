import {
  Banknote,
  Check,
  CreditCard,
  Loader,
  Percent,
  RotateCcw,
  ShieldCheck,
  Split,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { parseTenderedInput } from '../../cashier/components/payment/posPaymentConstants';
import PrintReceiptToggle from '../../cashier/components/payment/PrintReceiptToggle';
import MultikassaCashierControls from '../../cashier/components/MultikassaCashierControls';
import FiscalDriveCashierControls from '../../cashier/components/FiscalDriveCashierControls';
import PosRegisterCardProviders from '../../cashier/components/register-pay-rail/PosRegisterCardProviders';
import PharmacyPayQuickCash from './PharmacyPayQuickCash';
import PharmacyPayPatientCards from './PharmacyPayPatientCards';
import { usePharmacyPayKeyboard } from '../hooks/usePharmacyPayKeyboard';
import { usePharmacyPayRail } from '../hooks/usePharmacyPayRail';
import '../styles/pharmacy-pay-rail.css';
import '../styles/pharmacy-pay-patient.css';

const METHOD_META = [
  { id: 'cash', icon: Banknote, labelKey: 'pharmacyCashier.pay.methodCash', kbd: 'F6' },
  { id: 'card', icon: CreditCard, labelKey: 'pharmacyCashier.pay.methodCard', kbd: 'F7' },
  { id: 'mixed', icon: Split, labelKey: 'pharmacyCashier.pay.methodMixed', kbd: 'F8' },
  { id: 'insurance', icon: ShieldCheck, labelKey: 'pharmacyCashier.pay.methodInsurance', kbd: null },
];

/**
 * Панель оплаты аптеки без экранного numpad.
 * Сумма: быстрый ввод купюр + физклавиатура ПК.
 * Смешанная — как в продукте: часть налом → остаток картой.
 */
export default function PharmacyPayRail({
  total,
  onReturn,
  onDiscount,
  onConfirm,
  checkoutDisabled,
  isPending,
}) {
  const { t } = useTranslation();
  const rail = usePharmacyPayRail({
    total,
    checkoutDisabled,
    isPending,
    onConfirm,
  });

  usePharmacyPayKeyboard({
    enabled: !checkoutDisabled,
    method: rail.method,
    setMethod: rail.setMethod,
    setExactAmount: rail.setExactAmount,
    appendCashDigit: rail.appendCashDigit,
    backspaceCash: rail.backspaceCash,
    clearCash: rail.clearCash,
    submitSale: rail.submitSale,
    saleDisabled: rail.saleDisabled,
  });

  const showCashPad = rail.method === 'cash' || rail.method === 'mixed';
  const showCardProviders =
    rail.method === 'card'
    || rail.method === 'mixed'
    || (rail.method === 'cash' && rail.hasPartialCash);
  const pinflRequired = rail.method === 'insurance';

  const receivedDisplay = rail.cashInput
    ? fmt(parseTenderedInput(rail.cashInput))
    : '—';

  return (
    <aside className="pharmacy-pay-rail" aria-label={t('pos.paymentTitle')}>
      <MultikassaCashierControls />
      <FiscalDriveCashierControls />
      <div className="pharmacy-pay-rail__total">
        <span className="pharmacy-pay-rail__total-label">{t('pos.amountToPay')}</span>
        <div className="pharmacy-pay-rail__total-row">
          <strong className="pharmacy-pay-rail__total-value">{fmt(rail.toPay)}</strong>
          <span className="pharmacy-pay-rail__currency">{t('pos.currencyCode')}</span>
        </div>
      </div>

      <div className="pharmacy-pay-rail__methods" role="tablist">
        {METHOD_META.map(({ id, icon: Icon, labelKey, kbd }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={rail.method === id}
            title={kbd ? `${t(labelKey)} [${kbd}]` : t(labelKey)}
            className={`pharmacy-pay-rail__method${rail.method === id ? ' is-active' : ''}`}
            disabled={checkoutDisabled || isPending}
            onClick={() => rail.setMethod(id)}
          >
            <Icon size={18} strokeWidth={2.1} aria-hidden />
            <span className="pharmacy-pay-rail__method-label">{t(labelKey)}</span>
            {kbd ? <span className="pharmacy-pay-rail__method-kbd">{kbd}</span> : null}
          </button>
        ))}
      </div>

      {rail.saleHint && (rail.method !== 'cash' || rail.hasPartialCash) ? (
        <p className="pharmacy-pay-rail__hint">{rail.saleHint}</p>
      ) : null}

      {showCashPad ? (
        <>
          <div className="pharmacy-pay-rail__cash-summary">
            <div className="pharmacy-pay-rail__box">
              <span className="pharmacy-pay-rail__box-label">{t('pos.receivedLabel')}</span>
              <strong className="pharmacy-pay-rail__box-value">{receivedDisplay}</strong>
            </div>
            <div
              className={`pharmacy-pay-rail__box${rail.cashPaidEnough ? ' is-ready' : ''}${
                rail.hasPartialCash ? ' is-remainder' : ''
              }`}
            >
              <span className="pharmacy-pay-rail__box-label">
                {rail.hasPartialCash ? t('pos.cardRemainderRail') : t('pos.change')}
              </span>
              <strong className="pharmacy-pay-rail__box-value">
                {fmt(rail.hasPartialCash ? rail.cardRemainder : rail.changeDue)}
              </strong>
            </div>
          </div>

          <PharmacyPayQuickCash
            value={rail.cashInput}
            onChange={rail.setCashInput}
            exactAmount={rail.toPay}
            onExact={rail.setExactAmount}
            onReset={rail.clearCash}
            quickActions={rail.quickCash}
            disabled={checkoutDisabled || isPending}
            title={t('pharmacyCashier.pay.quickTitle')}
            exactLabel={t('pharmacyCashier.pay.exact')}
            resetLabel={t('pharmacyCashier.pay.reset')}
          />
        </>
      ) : null}

      {rail.method === 'insurance' ? (
        <div className="pharmacy-pay-rail__dmed-note">{t('pharmacyCashier.pay.dmedNote')}</div>
      ) : null}

      {showCardProviders ? (
        <div className="pharmacy-pay-rail__cards">
          <PosRegisterCardProviders
            disabled={checkoutDisabled}
            isPending={isPending}
            cardPayBlocked={rail.cardPayBlocked}
            hasCardRemainder={rail.hasPartialCash}
            onSelectCard={rail.submitCard}
          />
        </div>
      ) : null}

      <PharmacyPayPatientCards
        pinfl={rail.pinfl}
        onPinflChange={rail.setPinfl}
        loyaltyPhone={rail.loyaltyPhone}
        onLoyaltyPhoneChange={rail.setLoyaltyPhone}
        disabled={checkoutDisabled || isPending}
        pinflRequired={pinflRequired}
      />

      <div className="pharmacy-pay-rail__tools">
        <button type="button" className="pharmacy-pay-rail__tool" onClick={onDiscount}>
          <Percent size={16} strokeWidth={2.25} aria-hidden />
          {t('pos.discount')}
        </button>
        <button
          type="button"
          className="pharmacy-pay-rail__tool pharmacy-pay-rail__tool--return"
          onClick={onReturn}
        >
          <RotateCcw size={16} strokeWidth={2.25} aria-hidden />
          {t('pos.return')}
        </button>
      </div>

      <div className="pharmacy-pay-rail__footer">
        <button
          type="button"
          className="pharmacy-pay-rail__sale"
          disabled={rail.saleDisabled}
          onClick={rail.submitSale}
        >
          {isPending ? (
            <Loader size={18} className="pharmacy-pay-rail__spin" aria-hidden />
          ) : (
            <Check size={18} strokeWidth={2.5} aria-hidden />
          )}
          <span className="pharmacy-pay-rail__sale-text">
            {t('pharmacyCashier.pay.saleAction')}
            {' '}
            {fmt(rail.toPay)}
          </span>
          <span className="pharmacy-pay-rail__sale-enter">Enter</span>
        </button>
        <PrintReceiptToggle
          checked={rail.printReceiptEnabled}
          onChange={rail.handlePrintReceiptChange}
          t={t}
          className="pharmacy-pay-rail__print"
          disabled={checkoutDisabled || isPending}
        />
      </div>
    </aside>
  );
}
