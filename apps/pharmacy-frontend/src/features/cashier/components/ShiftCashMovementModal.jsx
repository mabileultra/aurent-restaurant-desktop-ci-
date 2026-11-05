import { useTranslation } from 'react-i18next';
import { ArrowDownLeft, ArrowUpRight, Loader, X } from 'lucide-react';
import PosModalPortal from '../../../components/shared/PosModalPortal';
import { fmtMoney } from '../../../utils/formatMoney';
import { useOnlineActionGuard } from '../../../hooks/useOnlineActionGuard';
import { useShiftCashMovement } from '../hooks/useShiftCashMovement';

const QUICK_AMOUNTS = [10_000, 50_000, 100_000, 500_000];

export default function ShiftCashMovementModal({
  open,
  onClose,
  direction = 'IN',
  shiftId,
  onSuccess,
  variant = 'default',
}) {
  const { t } = useTranslation();
  const { isActionBlocked, blockReason } = useOnlineActionGuard();
  const {
    amountStr,
    setAmountStr,
    note,
    setNote,
    isSubmitting,
    isCashIn,
    numericAmount,
    handleAddQuickAmount,
    handleSubmit,
    handleClose,
  } = useShiftCashMovement({ open, direction, shiftId, onSuccess, onClose, t });

  if (!open) return null;

  const title = isCashIn
    ? t('pos.cashInTitle', { defaultValue: 'Kassaga pul kiritish' })
    : t('pos.cashOutTitle', { defaultValue: 'Kassadan pul yechish (inkassatsiya)' });

  const hint = isCashIn
    ? t('pos.cashInHint', { defaultValue: 'Razmen yoki kassaga naqd pul qo‘shish' })
    : t('pos.cashOutHint', { defaultValue: 'Inkassatsiya yoki xarajat uchun naqd pul olish' });

  const modalClass = [
    'cashier-cash-move-modal',
    isCashIn ? 'cashier-cash-move-modal--in' : 'cashier-cash-move-modal--out',
    variant === 'pharmacy' ? 'pharmacy-modal' : '',
  ].filter(Boolean).join(' ');

  return (
    <PosModalPortal open={open} onClose={handleClose}>
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
            onClick={handleClose}
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
              onClick={handleClose}
              disabled={isSubmitting}
              className="cashier-cash-move-modal__btn cashier-cash-move-modal__btn--ghost"
            >
              {t('common.cancel', { defaultValue: 'Bekor qilish' })}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || numericAmount <= 0 || isActionBlocked}
              title={isActionBlocked ? blockReason : undefined}
              className="cashier-cash-move-modal__btn cashier-cash-move-modal__btn--primary disabled:opacity-50 disabled:cursor-not-allowed"
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
