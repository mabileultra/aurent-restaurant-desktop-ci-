import React from 'react';
import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Forma qoralamasi (draft) tiklanganda ko'rsatiladigan ogohlantirish paneli.
 * Foydalanuvchiga eski ma'lumot to'ldirilganini bildiradi va bitta tugma bilan tozalash imkonini beradi.
 */
export default function FormDraftNotice({ onClear, className = 'mb-3' }) {
  const { t } = useTranslation();

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-200 ${className}`}
      role="status"
    >
      <span className="flex items-center gap-1.5 font-medium">
        <span>{t('common.draftRestoredNotice', { defaultValue: 'Avvalgi kiritilgan ma’lumot tiklandi' })}</span>
      </span>
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 font-semibold text-amber-700 underline hover:text-amber-900 focus:outline-none dark:text-amber-300 dark:hover:text-amber-100"
        >
          <RotateCcw size={12} aria-hidden="true" />
          <span>{t('common.clear', { defaultValue: 'Tozalash' })}</span>
        </button>
      ) : null}
    </div>
  );
}
