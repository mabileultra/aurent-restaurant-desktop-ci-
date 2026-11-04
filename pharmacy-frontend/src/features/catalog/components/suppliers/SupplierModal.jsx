import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatUzPhone } from '../../../../utils/phoneUz';
import { formatSupplierAccount } from '../../../../utils/supplierAccountUz';
import { useSupplierModalForm } from '../../hooks/useSupplierModalForm';

const inputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  dark:border-slate-700 dark:bg-slate-800 dark:text-white`;

const labelCls = 'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400';

export default function SupplierModal({ open, onClose, onCreated, supplier = null }) {
  const { t } = useTranslation();
  const { isEdit, form, setField, submit, pending } = useSupplierModalForm({
    open,
    supplier,
    onClose,
    onCreated,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEdit ? t('suppliersModule.modal.editTitle') : t('suppliersModule.modal.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-4">
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>
              <span className="text-red-600">*</span> {t('suppliersModule.modal.name')}
            </label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
            />
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>
              <span className="text-red-600">*</span> {t('suppliersModule.modal.taxId')}
            </label>
            <input
              className={inputCls}
              value={form.taxId}
              onChange={(e) => setField('taxId', e.target.value)}
            />
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>
              <span className="text-red-600">*</span> {t('suppliersModule.modal.accountNumber')}
            </label>
            <input
              className={`${inputCls} font-mono`}
              value={form.accountNumber}
              onChange={(e) => setField('accountNumber', formatSupplierAccount(e.target.value))}
              placeholder="2020 8000 1234 5678 9012"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>
              <span className="text-red-600">*</span> {t('suppliersModule.modal.phone')}
            </label>
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) => setField('phone', formatUzPhone(e.target.value))}
              placeholder="+998 (__) ___-__-__"
            />
          </div>
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
              disabled={pending}
              className="admin-btn-primary px-4 py-2 text-sm"
            >
              {pending
                ? t('common.processing')
                : isEdit
                  ? t('common.save')
                  : t('suppliersModule.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
