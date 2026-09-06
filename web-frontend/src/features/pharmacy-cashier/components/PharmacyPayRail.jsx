import {
  Banknote,
  Check,
  CreditCard,
  Loader,
  Minus,
  Percent,
  RotateCcw,
  ShieldCheck,
  Split,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import NumericKeypad from '../../cashier/components/NumericKeypad';
import PrintReceiptToggle from '../../cashier/components/payment/PrintReceiptToggle';
import PosRegisterCardProviders from '../../cashier/components/register-pay-rail/PosRegisterCardProviders';
import { usePharmacyPayKeyboard } from '../hooks/usePharmacyPayKeyboard';
import { usePharmacyPayRail } from '../hooks/usePharmacyPayRail';
import '../styles/pharmacy-pay-rail.css';

const METHOD_META = [
  { id: 'cash', icon: Banknote, labelKey: 'pharmacyCashier.pay.methodCash', kbd: 'F6' },
  { id: 'card', icon: CreditCard, labelKey: 'pharmacyCashier.pay.methodCard', kbd: 'F7' },
  { id: 'mixed', icon: Split, labelKey: 'pharmacyCashier.pay.methodMixed', kbd: 'F8' },
  { id: 'insurance', icon: ShieldCheck, labelKey: 'pharmacyCashier.pay.methodInsurance', kbd: null },
];

/**
 * Правая панель оплаты аптеки — UI как на макете.
 * Смешанная логика как в продукте: часть налом + остаток картой.
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
  const showCashSummary = showCashPad;
  const showCardProviders =
    rail.method === 'card'
    || rail.method === 'mixed'
    || (rail.method === 'cash' && rail.hasPartialCash);
  const pinflRequired = rail.method === 'insurance';

  const receivedDisplay = rail.cashInput
    ? fmt(Number(String(rail.cashInput).replace(',', '.')) || 0)
    : '—';

  return (
    <aside className="pharmacy-pay-rail" aria-label={t('pos.paymentTitle')}>
      <div className="pharmacy-pay-rail__total">
        <span className="pharmacy-pay-rail__total-label">{t('pos.amountToPay')}</span>
        <div className="pharmacy-pay-rail__total-row">
          <strong className="pharmacy-pay-rail__total-value">{fmt(rail.toPay)}</strong>
          <span className="pharmacy-pay-rail__currency">{t('pos.currencyCode')}</span>
        </div>
      </div>

      <div className="pharmacy-pay-rail__methods" role="tablist" aria-label={t('pos.paymentTitle')}>
        {METHOD_META.map(({ id, icon: Icon, labelKey, kbd }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={rail.method === id}
            aria-keyshortcuts={kbd || undefined}
            title={kbd ? `${t(labelKey)} [${kbd}]` : t(labelKey)}
            className={`pharmacy-pay-rail__method${rail.method === id ? ' is-active' : ''}`}
            disabled={checkoutDisabled || isPending}
            onClick={() => rail.setMethod(id)}
          >
            <Icon size={18} strokeWidth={2.25} aria-hidden />
            <span>{t(labelKey)}</span>
            {kbd ? <kbd className="pharmacy-pay-rail__method-kbd">{kbd}</kbd> : null}
          </button>
        ))}
      </div>

      {rail.saleHint && (rail.method === 'mixed' || rail.hasPartialCash || rail.method === 'card' || rail.method === 'insurance') ? (
        <p className="pharmacy-pay-rail__hint">{rail.saleHint}</p>
      ) : null}

      {showCashSummary ? (
        <div className="pharmacy-pay-rail__cash-summary">
          <div className="pharmacy-pay-rail__change pharmacy-pay-rail__change--received">
            <span>{t('pos.receivedLabel')}</span>
            <strong>{receivedDisplay}</strong>
            {rail.cashInput ? (
              <button
                type="button"
                className="pharmacy-pay-rail__received-clear"
                aria-label={t('pos.keypadClear')}
                disabled={checkoutDisabled || isPending}
                onClick={rail.clearCash}
              >
                <Minus size={14} strokeWidth={2.5} aria-hidden />
              </button>
            ) : null}
          </div>
          {rail.hasPartialCash ? (
            <div className="pharmacy-pay-rail__change pharmacy-pay-rail__change--remainder">
              <span>{t('pos.cardRemainderRail')}</span>
              <strong>{fmt(rail.cardRemainder)}</strong>
            </div>
          ) : (
            <div className={`pharmacy-pay-rail__change${rail.cashPaidEnough ? ' is-ready' : ''}`}>
              <span>{t('pos.change')}</span>
              <strong>{fmt(rail.changeDue)}</strong>
            </div>
          )}
        </div>
      ) : null}

      {rail.method === 'insurance' ? (
        <div className="pharmacy-pay-rail__dmed-note">
          {t('pharmacyCashier.pay.dmedNote')}
        </div>
      ) : null}

      {showCashPad ? (
        <div className="pharmacy-pay-rail__keypad">
          <NumericKeypad
            value={rail.cashInput}
            onChange={rail.setCashInput}
            exactAmount={rail.toPay}
            quickActions={rail.quickCash}
            hideActionKey
            hideBottomClear
            disabled={checkoutDisabled || isPending}
          />
        </div>
      ) : null}

      {showCardProviders ? (
        <div className={`pharmacy-pay-rail__cards${rail.hasPartialCash ? ' has-remainder' : ''}`}>
          <PosRegisterCardProviders
            disabled={checkoutDisabled}
            isPending={isPending}
            cardPayBlocked={rail.cardPayBlocked}
            hasCardRemainder={rail.hasPartialCash}
            onSelectCard={rail.submitCard}
          />
        </div>
      ) : null}

      <div className={`pharmacy-pay-rail__patient${pinflRequired ? ' is-required' : ''}`}>
        <label className="pharmacy-pay-rail__field">
          <span>
            {t('pharmacyCashier.pay.pinfl')}
            {pinflRequired ? ' *' : ''}
          </span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={14}
            value={rail.pinfl}
            disabled={checkoutDisabled || isPending}
            onChange={(e) => rail.setPinfl(e.target.value.replace(/\D/g, '').slice(0, 14))}
            placeholder={t('pharmacyCashier.pay.pinflPh')}
            autoComplete="off"
          />
        </label>
        <label className="pharmacy-pay-rail__field">
          <span>{t('pharmacyCashier.pay.loyaltyPhone')}</span>
          <input
            type="tel"
            value={rail.loyaltyPhone}
            disabled={checkoutDisabled || isPending}
            onChange={(e) => rail.setLoyaltyPhone(e.target.value)}
            placeholder="+998 __ ___-__-__"
            autoComplete="tel"
          />
        </label>
      </div>

      <div className="pharmacy-pay-rail__tools">
        <button
          type="button"
          className="pharmacy-pay-rail__tool pharmacy-pay-rail__tool--discount"
          onClick={onDiscount}
        >
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
          title={`${t('pharmacyCashier.pay.saleAction')} [Enter]`}
        >
          {isPending ? (
            <Loader size={18} className="pharmacy-pay-rail__spin" aria-hidden />
          ) : (
            <Check size={18} strokeWidth={2.5} aria-hidden />
          )}
          <span className="pharmacy-pay-rail__sale-label">
            {t('pharmacyCashier.pay.saleAction')}
            {' '}
            {fmt(rail.toPay)}
          </span>
          <kbd className="pharmacy-pay-rail__sale-kbd">Enter</kbd>
        </button>
        <PrintReceiptToggle
          checked={rail.printReceiptEnabled}
          onChange={rail.handlePrintReceiptChange}
          t={t}
          className="pos-pay-print-toggle--footer pharmacy-pay-rail__print"
          disabled={checkoutDisabled || isPending}
        />
      </div>
    </aside>
  );
}
