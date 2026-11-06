import { X } from 'lucide-react';
import { BaseSelect } from '../../../components/ui';
import { useCashRegisterForm } from '../hooks/useCashRegisterForm';
import '../../../styles/cash-registers/form-modal.css';

const inputCls = `cr-form-modal__input`;

export default function CashRegisterFormModal({ open, registerId, onClose, onSaved }) {
  const p = useCashRegisterForm({ open, registerId, onSaved, onClose });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div
        className="cr-form-modal relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        role="dialog"
        aria-labelledby="cr-form-title"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 id="cr-form-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            {p.isEdit ? p.t('cashRegisters.formEditTitle') : p.t('cashRegisters.formCreateTitle')}
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={p.onSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="cr-form-modal__body flex-1 space-y-4 overflow-y-auto p-4">
            {p.loading ? (
              <p className="text-sm text-slate-500">{p.t('common.loading')}</p>
            ) : (
              <>
                <div>
                  <label className="cr-form-modal__label">* {p.t('cashRegisters.formStore')}</label>
                  <BaseSelect
                    className={inputCls}
                    disabled={p.isEdit}
                    {...p.register('storeId')}
                    placeholder={p.t('cashRegisters.formStorePlaceholder')}
                    options={[
                      { value: '', label: p.t('cashRegisters.formStorePlaceholder') },
                      ...p.stores.map((s) => ({ value: String(s.id), label: s.name })),
                    ]}
                  />
                  {p.errors.storeId && <p className="cr-form-modal__error">{p.errors.storeId.message}</p>}
                </div>

                <div>
                  <label className="cr-form-modal__label">{p.t('cashRegisters.formRegisterNo')}</label>
                  <input type="number" min="1" className={inputCls} {...p.register('registerNumber')} />
                  <p className="cr-form-modal__hint">{p.t('cashRegisters.formRegisterNoHint')}</p>
                </div>

                <div>
                  <label className="cr-form-modal__label">{p.t('cashRegisters.colModel')}</label>
                  <input className={inputCls} {...p.register('equipmentModel')} />
                </div>

                <div>
                  <label className="cr-form-modal__label">{p.t('cashRegisters.colSerial')}</label>
                  <input className={inputCls} {...p.register('equipmentSerial')} />
                </div>

                <div>
                  <label className="cr-form-modal__label">{p.t('cashRegisters.colFiscal')}</label>
                  <input className={inputCls} {...p.register('fiscalCardId')} />
                </div>

                <div>
                  <label className="cr-form-modal__label">{p.t('cashRegisters.formDeviceId')}</label>
                  <input className={inputCls} {...p.register('deviceId')} />
                </div>

                <div>
                  <label className="cr-form-modal__label">{p.t('cashRegisters.formWorkstation')}</label>
                  <input className={inputCls} {...p.register('workstationName')} />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
            <button type="button" onClick={onClose} className="cr-form-modal__btn cr-form-modal__btn--ghost">
              {p.t('common.cancel')}
            </button>
            <button type="submit" disabled={p.loading || p.saving} className="cr-form-modal__btn cr-form-modal__btn--primary">
              {p.t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
