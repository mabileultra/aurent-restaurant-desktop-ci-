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

  return (
    <PosModalPortal open={open} onClose={onClose}>
      <div
        className="pos-pay-modal pos-pay-modal--shift-terminal w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shift-cash-movement-title"
      >
        <header className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isCashIn
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
              }`}
            >
              {isCashIn ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
            </div>
            <div>
              <h2 id="shift-cash-movement-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                {title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
            </div>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="shift-cash-amount"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              {t('pos.cashMovementAmount', { defaultValue: 'Summa (so‘m)' })}
            </label>
            <div className="relative">
              <input
                id="shift-cash-amount"
                type="number"
                min="1"
                step="any"
                autoFocus
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-lg font-semibold text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
              />
              {numericAmount > 0 && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                  {fmtMoney(numericAmount)} so‘m
                </div>
              )}
            </div>

            {/* Quick preset buttons */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAddQuickAmount(preset)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/80 transition-colors"
                >
                  +{fmtMoney(preset)}
                </button>
              ))}
              {amountStr && (
                <button
                  type="button"
                  onClick={() => setAmountStr('')}
                  className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400 transition-colors"
                >
                  {t('common.clear', { defaultValue: 'Tozalash' })}
                </button>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="shift-cash-note"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
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
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              {t('common.cancel', { defaultValue: 'Bekor qilish' })}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || numericAmount <= 0}
              className={`min-h-[44px] inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors ${
                isCashIn
                  ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 dark:disabled:bg-emerald-800'
                  : 'bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 dark:disabled:bg-amber-800'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader size={16} className="animate-spin" />
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
