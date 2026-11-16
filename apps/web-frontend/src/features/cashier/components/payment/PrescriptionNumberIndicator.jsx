import { useTranslation } from 'react-i18next';
import { usePrescriptionCheckoutGate } from '../../hooks/pos/usePrescriptionCheckoutGate';

const BASE_CLS =
  'flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm disabled:opacity-50';
const FILLED_CLS =
  'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300';
/** Amber — только предупреждение: рецептурный препарат без номера рецепта. */
const MISSING_CLS =
  'border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-200';

/**
 * Строка «Электронный рецепт» в колонке оплаты: видна только при рецептурных
 * позициях в чеке, по нажатию открывает правку номера.
 */
export default function PrescriptionNumberIndicator({ disabled = false }) {
  const { t } = useTranslation();
  const gate = usePrescriptionCheckoutGate();

  if (!gate.hasPrescriptionItems) return null;

  return (
    <button
      type="button"
      className={`${BASE_CLS} ${gate.prescriptionNumber ? FILLED_CLS : MISSING_CLS}`}
      disabled={disabled}
      onClick={gate.openEditor}
    >
      <span>{t('fiscalReceipt.prescriptionNumber')}</span>
      <strong className="min-w-0 truncate tabular-nums">
        {gate.prescriptionNumber || t('pos.prescriptionMissing')}
      </strong>
    </button>
  );
}
