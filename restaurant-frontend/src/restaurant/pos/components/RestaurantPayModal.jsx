import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Banknote, CreditCard, Split, X } from 'lucide-react';
import { BaseButton } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import {
  buildRestaurantPayPayload,
  deriveRestaurantPay,
} from '../utils/restaurantPayForm';
import RestaurantPayKeypad from './RestaurantPayKeypad';
import '../styles/restaurant-pay-modal.css';

const METHODS = [
  { id: 'CASH', icon: Banknote, labelKey: 'rst.order.payCash' },
  { id: 'CARD', icon: CreditCard, labelKey: 'rst.order.payCard' },
  { id: 'MIXED', icon: Split, labelKey: 'rst.order.payMixed' },
];

/**
 * Cash / card / mixed payment dialog with change + numeric keypad.
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
  const [tendered, setTendered] = useState('');
  const [cashPart, setCashPart] = useState('');

  const derived = useMemo(
    () => deriveRestaurantPay(totalDue, { method, tendered, cashPart }),
    [totalDue, method, tendered, cashPart],
  );

  if (!open || typeof document === 'undefined') return null;

  const selectMethod = (next) => {
    setMethod(next);
    setTendered('');
    setCashPart('');
  };

  const submit = () => {
    if (!derived.canSubmit || paying) return;
    onConfirm?.(buildRestaurantPayPayload(derived, method));
  };

  const showKeypad = method === 'CASH' || method === 'MIXED';
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

          {method === 'CARD' ? (
            <p className="rst-pay-modal__hint">{t('rst.order.payCardHint')}</p>
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

          {showKeypad ? (
            <RestaurantPayKeypad
              value={keypadValue}
              onChange={setKeypadValue}
              exactAmount={keypadExact}
              disabled={paying}
              t={t}
            />
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
