import React from 'react';
import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Notice shown when a form draft is restored from storage.
 */
export default function FormDraftNotice({ onClear, className = 'mb-3' }) {
  const { t } = useTranslation();

  return (
    <div
      className={`ui-alert-warning items-center justify-between text-xs ${className}`}
      role="status"
    >
      <span className="flex items-center gap-1.5 font-medium">
        <span>{t('common.draftRestoredNotice', { defaultValue: 'Avvalgi kiritilgan ma’lumot tiklandi' })}</span>
      </span>
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 font-semibold text-warning-text underline hover:opacity-80"
        >
          <RotateCcw size={12} strokeWidth={1.75} aria-hidden="true" />
          <span>{t('common.clear', { defaultValue: 'Tozalash' })}</span>
        </button>
      ) : null}
    </div>
  );
}
