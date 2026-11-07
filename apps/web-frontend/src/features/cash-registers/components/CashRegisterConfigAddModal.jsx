import React from 'react';
import { X } from 'lucide-react';
import { useCashRegisterConfigAddModal } from '../hooks/useCashRegisterConfigAddModal';
import CashRegisterConfigStorePicker from './CashRegisterConfigStorePicker';
import CashRegisterConfigCategoryPicker from './CashRegisterConfigCategoryPicker';
import '../../../styles/cash-registers/config.css';

const inputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  dark:border-slate-700 dark:bg-slate-800 dark:text-white`;

export default function CashRegisterConfigAddModal({ open, onClose, onSaved }) {
  const p = useCashRegisterConfigAddModal({ open, onClose, onSaved });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {p.t('cashRegisters.configModalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={p.handleSubmit(p.onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <div className="space-y-4 overflow-y-auto p-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                {p.t('cashRegisters.configNameLabel')}
              </label>
              <input
                {...p.register('name')}
                placeholder={p.t('cashRegisters.configNamePlaceholder')}
                className={inputCls}
              />
              {p.errors.name && (
                <p className="mt-1 text-xs text-red-500">{p.errors.name.message}</p>
              )}
            </div>

            {p.isPending && <p className="text-sm text-slate-500">{p.t('common.loading')}</p>}
            {p.isError && (
              <p className="text-sm text-red-500">{p.t('cashRegisters.configLoadError')}</p>
            )}

            {!p.isPending && !p.isError && (
              <>
                <CashRegisterConfigStorePicker
                  t={p.t}
                  stores={p.stores}
                  storeIds={p.storeIds}
                  toggleStore={p.toggleStore}
                  visibleRegisters={p.visibleRegisters}
                  registerIds={p.registerIds}
                  toggleRegister={p.toggleRegister}
                />
                <CashRegisterConfigCategoryPicker
                  t={p.t}
                  categories={p.categories}
                  categoryIds={p.categoryIds}
                  setCategoryIds={p.setCategoryIds}
                  pickCategoryId={p.pickCategoryId}
                  setPickCategoryId={p.setPickCategoryId}
                  availableCategories={p.availableCategories}
                  selectedCategories={p.selectedCategories}
                  addPickedCategory={p.addPickedCategory}
                  removeCategory={p.removeCategory}
                />
              </>
            )}
          </div>

          <div className="flex gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="admin-btn-secondary flex-1 py-2.5 text-sm cursor-pointer"
            >
              {p.t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={p.isPending}
              className="admin-btn-primary flex-1 py-2.5 text-sm cursor-pointer"
            >
              {p.t('cashRegisters.configModalAdd')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
