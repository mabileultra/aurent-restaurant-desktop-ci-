import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWarehouseReceiveForm } from '../hooks/useWarehouseReceiveForm';
import WarehouseReceiveFormFields from './WarehouseReceiveFormFields';

export default function WarehouseReceiveModal({ open, onClose, initialProduct, onSaved }) {
  const { t } = useTranslation();
  const form = useWarehouseReceiveForm({ open, initialProduct, onSaved, onClose, t });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />

      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('stockModule.modal.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={form.submit} className="space-y-4 p-4">
          <WarehouseReceiveFormFields form={form} t={t} />

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={form.mutation.isPending}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 dark:bg-emerald-600"
            >
              {form.mutation.isPending ? t('common.processing') : t('stockModule.modal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
