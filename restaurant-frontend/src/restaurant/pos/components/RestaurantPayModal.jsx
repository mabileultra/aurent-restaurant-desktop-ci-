import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Banknote, CircleDollarSign, CreditCard, QrCode, Split, Wallet, X } from 'lucide-react';
import { BaseButton } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { PAYMENT_CARD_PROVIDERS } from '../constants/paymentCardProviders';
import {
  buildRestaurantPayPayload,
  deriveRestaurantPay,
} from '../utils/restaurantPayForm';
import RestaurantPayKeypad from './RestaurantPayKeypad';
import '../styles/restaurant-pay-modal.css';

const METHODS = [
  { id: 'CASH', icon: Banknote, labelKey: 'rst.order.payCash' },
  { id: 'CARD', icon: CreditCard, labelKey: 'rst.order.payCard' },
  { id: 'CASHLESS', icon: QrCode, labelKey: 'rst.order.payCashless' },
  { id: 'MIXED', icon: Split, labelKey: 'rst.order.payMixed' },
  { id: 'CREDIT', icon: CircleDollarSign, labelKey: 'rst.order.payCredit' },
  { id: 'ADVANCE', icon: Wallet, labelKey: 'rst.order.payAdvance' },
];

/**
 * Cash / card / mixed payment dialog with card rails (Humo, Uzcard, Payme, Click).
 */
export default function RestaurantPayModal({
  open,
  totalDue,
  paying = false,
  onClose,
  onConfirm,
  t,
}) {
  const [method, setMethod] = useState('CASH');
  const [cardType, setCardType] = useState(null);
  const [tendered, setTendered] = useState('');
  const [cashPart, setCashPart] = useState('');
  const [debtPhone, setDebtPhone] = useState('');
  const [debtComment, setDebtComment] = useState('');

  const derived = useMemo(
    () => deriveRestaurantPay(totalDue, { method, tendered, cashPart, cardType, debtPhone }),
    [totalDue, method, tendered, cashPart, cardType, debtPhone],
  );

  if (!open || typeof document === 'undefined') return null;

  const selectMethod = (next) => {
    setMethod(next);
    setTendered('');
    setCashPart('');
    if (next !== 'CARD' && next !== 'MIXED') setCardType(null);
  };

  const submit = () => {
    if (!derived.canSubmit || paying) return;
    onConfirm?.(buildRestaurantPayPayload(derived, method, cardType, {
      phone: debtPhone,
      comment: debtComment,
    }));
  };

  const showCardRails = method === 'CARD' || method === 'MIXED';
  const showDebtFields = method === 'CREDIT' || method === 'ADVANCE';
  const showKeypad = method === 'CASH' || method === 'MIXED' || method === 'ADVANCE';
  const keypadValue = method === 'MIXED' ? cashPart : tendered;
  const setKeypadValue = method === 'MIXED' ? setCashPart : setTendered;
  const keypadExact = method === 'MIXED'
    ? Math.round((derived.due / 2) * 100) / 100
    : derived.due;

  return createPortal(
    <div className="rst-pay-modal" role="presentation">
      <button
        type="button"
        className="rst-pay-modal__backdrop"
        aria-label={t('common.cancel')}
        onClick={onClose}
      />
      <div
        className="rst-pay-modal__dialog"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rst-pay-modal__head">
          <div>
            <strong>{t('rst.order.payTitle')}</strong>
            <span>{t('pos.amountToPay')}: {fmtMoneyCompact(derived.due)}</span>
          </div>
          <button type="button" className="rst-pay-modal__icon-btn" onClick={onClose} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </div>

        <div className="rst-pay-modal__methods" role="tablist">
          {METHODS.map(({ id, icon: Icon, labelKey }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={method === id}
              className={`rst-pay-modal__method${method === id ? ' is-active' : ''}`}
              onClick={() => selectMethod(id)}
              disabled={paying}
            >
              <Icon size={18} />
              {t(labelKey)}
            </button>
          ))}
        </div>

        <div className="rst-pay-modal__body">
          {showCardRails ? (
            <div className="rst-pay-modal__rails">
              <p className="rst-pay-modal__rails-lead">
                {t('pos.cardTypeLead', { defaultValue: 'Выберите способ' })}
              </p>
              <div className="rst-pay-modal__providers" role="group" aria-label={t('rst.order.payCard')}>
                {PAYMENT_CARD_PROVIDERS.map((provider) => {
                  const label = t(provider.labelKey);
                  const active = cardType === provider.cardType;
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      className={`rst-pay-modal__provider rst-pay-modal__provider--${provider.tone}${active ? ' is-active' : ''}`}
                      disabled={paying}
                      title={label}
                      aria-label={label}
                      aria-pressed={active}
                      onClick={() => setCardType(provider.cardType)}
                    >
                      <img src={provider.logoSrc} alt="" draggable={false} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {method === 'CASHLESS' ? (
            <div className="rst-pay-modal__amount-box">
              <span>{t('pos.amountToPay')}</span>
              <strong>{fmtMoneyCompact(derived.due)}</strong>
            </div>
          ) : null}

          {method === 'CASH' ? (
            <>
              <div className="rst-pay-modal__amount-box">
                <span>{t('pos.receivedLabel')}</span>
                <strong>{keypadValue ? fmtMoneyCompact(Number(keypadValue)) : '—'}</strong>
              </div>
              <div className="rst-pay-modal__change">
                <span>{t('receipt.change')}</span>
                <strong>{fmtMoneyCompact(derived.changeGiven)}</strong>
              </div>
            </>
          ) : null}

          {method === 'MIXED' ? (
            <>
              <div className="rst-pay-modal__amount-box">
                <span>{t('pos.mixedCashPart')}</span>
                <strong>{keypadValue ? fmtMoneyCompact(Number(keypadValue)) : '—'}</strong>
              </div>
              <div className="rst-pay-modal__split">
                <div>
                  <span>{t('pos.mixedPaidCash')}</span>
                  <strong>{fmtMoneyCompact(derived.cashAmount)}</strong>
                </div>
                <div>
                  <span>{t('pos.mixedCardRemainder')}</span>
                  <strong>{fmtMoneyCompact(derived.cardAmount)}</strong>
                </div>
              </div>
            </>
          ) : null}

          {showDebtFields ? (
            <div className="rst-pay-modal__debt">
              <label className="rst-pay-modal__field">
                <span>{t('rst.order.debtPhone')}</span>
                <input
                  type="tel"
                  value={debtPhone}
                  onChange={(e) => setDebtPhone(e.target.value)}
                  placeholder="+998 __ ___ __ __"
                  maxLength={32}
                  autoComplete="off"
                  disabled={paying}
                />
              </label>
              <label className="rst-pay-modal__field">
                <span>{t('rst.order.debtComment')}</span>
                <input
                  type="text"
                  value={debtComment}
                  onChange={(e) => setDebtComment(e.target.value)}
                  placeholder={t('rst.order.debtCommentPh')}
                  maxLength={500}
                  autoComplete="off"
                  disabled={paying}
                />
              </label>
            </div>
          ) : null}

          {method === 'CREDIT' ? (
            <div className="rst-pay-modal__amount-box">
              <span>{t('rst.order.creditAmount')}</span>
              <strong>{fmtMoneyCompact(derived.due)}</strong>
            </div>
          ) : null}

          {method === 'ADVANCE' ? (
            <div className="rst-pay-modal__split">
              <div>
                <span>{t('rst.order.advancePaid')}</span>
                <strong>{keypadValue ? fmtMoneyCompact(Number(keypadValue)) : '—'}</strong>
              </div>
              <div>
                <span>{t('rst.order.debtRemaining')}</span>
                <strong>{fmtMoneyCompact(derived.debtRemaining)}</strong>
              </div>
            </div>
          ) : null}

          {showKeypad ? (
            <RestaurantPayKeypad
              value={keypadValue}
              onChange={setKeypadValue}
              exactAmount={keypadExact}
              disabled={paying}
              t={t}
            />
          ) : null}

          {derived.infoKey ? (
            <p className="rst-pay-modal__info">{t(derived.infoKey)}</p>
          ) : null}

          {derived.hintKey ? (
            <p className="rst-pay-modal__error">{t(derived.hintKey)}</p>
          ) : null}
        </div>

        <div className="rst-pay-modal__footer">
          <BaseButton type="button" variant="ghost" onClick={onClose} disabled={paying}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton type="button" onClick={submit} disabled={!derived.canSubmit || paying}>
            {paying ? t('common.loading') : t('rst.order.confirmPayShort')}
          </BaseButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
