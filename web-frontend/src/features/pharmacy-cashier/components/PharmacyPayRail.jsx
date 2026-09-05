import { Banknote, Check, CreditCard, Loader, Percent, RotateCcw, ShieldCheck, Split } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt } from '../../../../utils/formatMoney';
import NumericKeypad from '../../../cashier/components/NumericKeypad';
import PrintReceiptToggle from '../../../cashier/components/payment/PrintReceiptToggle';
import PosRegisterCardProviders from '../../../cashier/components/register-pay-rail/PosRegisterCardProviders';
import { usePharmacyPayRail } from '../../hooks/usePharmacyPayRail';
import '../styles/pharmacy-pay-rail.css';

const METHOD_META = [
  { id: 'cash', icon: Banknote, labelKey: 'pharmacyCashier.pay.methodCash' },
  { id: 'card', icon: CreditCard, labelKey: 'pharmacyCashier.pay.methodCard' },
  { id: 'mixed', icon: Split, labelKey: 'pharmacyCashier.pay.methodMixed' },
  { id: 'insurance', icon: ShieldCheck, labelKey: 'pharmacyCashier.pay.methodInsurance' },
];

/**
 * Правая панель оплаты аптеки (только pharmacy) — не retail PosRegisterPayRail.
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

  const showCashPad = rail.method === 'cash' || rail.method === 'mixed';
  const showCardProviders = rail.method === 'card' || rail.method === 'mixed';
  const showPatient = rail.method === 'insurance' || rail.method === 'cash' || rail.method === 'card' || rail.method === 'mixed';
  const pinflRequired = rail.method === 'insurance';

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
        {METHOD_META.map(({ id, icon: Icon, labelKey }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={rail.method === id}
            className={`pharmacy-pay-rail__method${rail.method === id ? ' is-active' : ''}`}
            disabled={checkoutDisabled || isPending}
            onClick={() => rail.setMethod(id)}
          >
            <Icon size={16} strokeWidth={2.25} aria-hidden />
            <span>{t(labelKey)}</span>
          </button>
        ))}
      </div>

      {rail.saleHint ? (
        <p className="pharmacy-pay-rail__hint">{rail.saleHint}</p>
      ) : null}

      {rail.method === 'mixed' ? (
        <div className="pharmacy-pay-rail__split">
          <label className="pharmacy-pay-rail__field">
            <span>{t('pharmacyCashier.pay.cashPart')}</span>
            <input
              type="text"
              inputMode="decimal"
              value={rail.cashInput}
              disabled={checkoutDisabled || isPending}
              onChange={(e) => rail.setCashInput(e.target.value.replace(/[^\d.,]/g, ''))}
              placeholder="0"
            />
          </label>
          <label className="pharmacy-pay-rail__field">
            <span>{t('pharmacyCashier.pay.cardPart')}</span>
            <input
              type="text"
              inputMode="decimal"
              value={rail.cardInput}
              disabled={checkoutDisabled || isPending}
              onChange={(e) => rail.setCardInput(e.target.value.replace(/[^\d.,]/g, ''))}
              placeholder="0"
            />
          </label>
          {rail.mixedShortfall > 0 ? (
            <div className="pharmacy-pay-rail__change pharmacy-pay-rail__change--warn">
              <span>{t('pharmacyCashier.pay.stillDue')}</span>
              <strong>{fmt(rail.mixedShortfall)}</strong>
            </div>
          ) : (
            <div className={`pharmacy-pay-rail__change${rail.mixedCovered ? ' is-ready' : ''}`}>
              <span>{t('pos.change')}</span>
              <strong>{fmt(rail.changeDue)}</strong>
            </div>
          )}
        </div>
      ) : null}

      {rail.method === 'cash' ? (
        <div className="pharmacy-pay-rail__cash-summary">
          <div className="pharmacy-pay-rail__change">
            <span>{t('pos.receivedLabel')}</span>
            <strong>{rail.cashInput ? fmt(Number(String(rail.cashInput).replace(',', '.')) || 0) : '—'}</strong>
          </div>
          <div className={`pharmacy-pay-rail__change${rail.cashPaidEnough ? ' is-ready' : ''}`}>
            <span>{t('pos.change')}</span>
            <strong>{fmt(rail.changeDue)}</strong>
          </div>
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
        <div className={`pharmacy-pay-rail__cards${rail.selectedCardType ? ' has-selection' : ''}`}>
          <PosRegisterCardProviders
            disabled={checkoutDisabled}
            isPending={isPending}
            cardPayBlocked={false}
            hasCardRemainder={rail.method === 'mixed'}
            onSelectCard={rail.submitCard}
          />
        </div>
      ) : null}

      {showPatient ? (
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
            />
          </label>
        </div>
      ) : null}

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
        >
          {isPending ? (
            <Loader size={18} className="pharmacy-pay-rail__spin" aria-hidden />
          ) : (
            <Check size={18} strokeWidth={2.5} aria-hidden />
          )}
          <span>
            {t('pharmacyCashier.pay.saleAction')}
            <em>{fmt(rail.toPay)}</em>
          </span>
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
