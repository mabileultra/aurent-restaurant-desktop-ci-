import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownLeft, ArrowUpRight, Loader, X } from 'lucide-react';
import toast from 'react-hot-toast';
import PosModalPortal from '../../../components/shared/PosModalPortal';
import { cashierShiftApi } from '../../../api/cashierShift.api';
import { fmtMoney } from '../../../utils/formatMoney';

const QUICK_AMOUNTS = [10_000, 50_000, 100_000, 500_000];

export default function ShiftCashMovementModal({
  open,
  onClose,
  direction = 'IN',
  shiftId,
  onSuccess,
}) {
  const { t } = useTranslation();
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const isCashIn = direction === 'IN';
  const title = isCashIn
    ? t('pos.cashInTitle', { defaultValue: 'Kassaga pul kiritish' })
    : t('pos.cashOutTitle', { defaultValue: 'Kassadan pul yechish (inkassatsiya)' });

  const hint = isCashIn
    ? t('pos.cashInHint', { defaultValue: 'Razmen yoki kassaga naqd pul qo‘shish' })
    : t('pos.cashOutHint', { defaultValue: 'Inkassatsiya yoki xarajat uchun naqd pul olish' });

  const numericAmount = Math.max(0, Number(String(amountStr).replace(/\s+/g, '')) || 0);

  const handleAddQuickAmount = (delta) => {
    setAmountStr((prev) => {
      const current = Math.max(0, Number(String(prev).replace(/\s+/g, '')) || 0);
      return String(current + delta);
    });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!shiftId) {
      toast.error(t('pos.shiftRequired', { defaultValue: 'Faol smena topilmadi' }));
      return;
    }

    if (numericAmount <= 0) {
      toast.error(t('pos.cashMovementAmountRequired', { defaultValue: 'Iltimos, summani kiriting' }));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        amount: numericAmount,
        note: note.trim() || undefined,
      };

      if (isCashIn) {
        await cashierShiftApi.cashIn(shiftId, payload);
        toast.success(
          t('pos.cashInSuccess', {
            defaultValue: 'Kassaga {{amount}} so‘m kiritildi',
            amount: fmtMoney(numericAmount),
          })
        );
      } else {
        await cashierShiftApi.cashOut(shiftId, payload);
        toast.success(
          t('pos.cashOutSuccess', {
            defaultValue: 'Kassadan {{amount}} so‘m yechildi',
            amount: fmtMoney(numericAmount),
          })
        );
      }

      onSuccess?.();
      onClose();
      setAmountStr('');
      setNote('');
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      toast.error(message || t('pos.cashMovementFailed', { defaultValue: 'Operatsiyani bajarib bo‘lmadi' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalClass = [
    'cashier-cash-move-modal',
    isCashIn ? 'cashier-cash-move-modal--in' : 'cashier-cash-move-modal--out',
  ].join(' ');

  return (
    <PosModalPortal open={open} onClose={onClose}>
      <div
        className={modalClass}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shift-cash-movement-title"
      >
        <header className="cashier-cash-move-modal__head">
          <div className="cashier-cash-move-modal__head-main">
            <div className="cashier-cash-move-modal__icon" aria-hidden="true">
              {isCashIn ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
            </div>
            <div className="cashier-cash-move-modal__head-text">
              <h2 id="shift-cash-movement-title" className="cashier-cash-move-modal__title">
                {title}
              </h2>
              <p className="cashier-cash-move-modal__hint">{hint}</p>
            </div>
          </div>
          <button
            type="button"
            className="cashier-cash-move-modal__close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="cashier-cash-move-modal__form">
          <div className="cashier-cash-move-modal__field">
            <label htmlFor="shift-cash-amount" className="cashier-cash-move-modal__label">
              {t('pos.cashMovementAmount', { defaultValue: 'Summa (so‘m)' })}
            </label>
            <div className="cashier-cash-move-modal__amount-wrap">
              <input
                id="shift-cash-amount"
                type="number"
                min="1"
                step="any"
                autoFocus
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                className="cashier-cash-move-modal__input"
              />
              {numericAmount > 0 && (
                <div className="cashier-cash-move-modal__amount-hint">
                  {fmtMoney(numericAmount)} so‘m
                </div>
              )}
            </div>

            <div className="cashier-cash-move-modal__presets">
              {QUICK_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAddQuickAmount(preset)}
                  className="cashier-cash-move-modal__preset"
                >
                  +{fmtMoney(preset)}
                </button>
              ))}
              {amountStr ? (
                <button
                  type="button"
                  onClick={() => setAmountStr('')}
                  className="cashier-cash-move-modal__preset cashier-cash-move-modal__preset--clear"
                >
                  {t('common.clear', { defaultValue: 'Tozalash' })}
                </button>
              ) : null}
            </div>
          </div>

          <div className="cashier-cash-move-modal__field">
            <label htmlFor="shift-cash-note" className="cashier-cash-move-modal__label">
              {t('pos.cashMovementNote', { defaultValue: 'Izoh (ixtiyoriy)' })}
            </label>
            <input
              id="shift-cash-note"
              type="text"
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                isCashIn
                  ? t('pos.cashInNotePlaceholder', { defaultValue: 'Masalan: Kassa uchun razmen' })
                  : t('pos.cashOutNotePlaceholder', { defaultValue: 'Masalan: Bankka inkassatsiya' })
              }
              className="cashier-cash-move-modal__input cashier-cash-move-modal__input--note"
            />
          </div>

          <div className="cashier-cash-move-modal__actions">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="cashier-cash-move-modal__btn cashier-cash-move-modal__btn--ghost"
            >
              {t('common.cancel', { defaultValue: 'Bekor qilish' })}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || numericAmount <= 0}
              className="cashier-cash-move-modal__btn cashier-cash-move-modal__btn--primary"
            >
              {isSubmitting ? (
                <>
                  <Loader size={18} className="cashier-cash-move-modal__spin" />
                  <span>{t('common.saving', { defaultValue: 'Saqlanmoqda...' })}</span>
                </>
              ) : (
                <span>
                  {isCashIn
                    ? t('pos.cashInAction', { defaultValue: 'Kiritish' })
                    : t('pos.cashOutAction', { defaultValue: 'Yechish' })}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </PosModalPortal>
  );
}
