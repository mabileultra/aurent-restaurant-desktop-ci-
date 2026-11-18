import { X } from 'lucide-react';
import { BaseSelect } from '../../../components/ui';
import { useCashRegisterForm } from '../hooks/useCashRegisterForm';
import '../../../styles/cash-registers/form-modal.css';

const inputCls = `cr-form-modal__input`;

export default function CashRegisterFormModal({ open, registerId, onClose, onSaved }) {
  const p = useCashRegisterForm({ open, registerId, onSaved, onClose });

  if (!open) return null;

  return (
    <div className="ui-modal-overlay z-[75]">
      <button type="button" className="fixed inset-0 bg-transparent" aria-label="Close" onClick={onClose} />
      <div
        className="cr-form-modal ui-modal-panel relative max-w-lg max-h-[90vh]"
        role="dialog"
        aria-labelledby="cr-form-title"
      >
        <div className="ui-modal-header">
          <h2 id="cr-form-title" className="text-base font-semibold text-ink">
            {p.isEdit ? p.t('cashRegisters.formEditTitle') : p.t('cashRegisters.formCreateTitle')}
          </h2>
          <button type="button" onClick={onClose} className="ui-icon-btn" aria-label={p.t('common.close')}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={p.onSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="cr-form-modal__body ui-modal-body flex-1 space-y-4 overflow-y-auto">
            {p.loading ? (
              <p className="text-sm text-ink-muted">{p.t('common.loading')}</p>
            ) : (
              <>
                <div>
                  <label className="cr-form-modal__label">* {p.t('cashRegisters.formStore')}</label>
                  <BaseSelect
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
                  <input
                    className={`${inputCls}${p.fiscalCardError ? ' cr-form-modal__input--error' : ''}`}
                    aria-invalid={Boolean(p.fiscalCardError)}
                    {...p.register('fiscalCardId')}
                  />
                  {p.checkingFiscalCard && !p.fiscalCardError ? (
                    <p className="cr-form-modal__hint">{p.t('cashRegisters.fiscalCardChecking')}</p>
                  ) : null}
                  {p.fiscalCardError ? (
                    <p className="cr-form-modal__error" role="alert">
                      {p.fiscalCardError}
                    </p>
                  ) : null}
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

          <div className="ui-modal-footer">
            <button type="button" onClick={onClose} className="cr-form-modal__btn cr-form-modal__btn--ghost">
              {p.t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={p.loading || p.saving || p.checkingFiscalCard || Boolean(p.fiscalCardError)}
              className="cr-form-modal__btn cr-form-modal__btn--primary"
            >
              {p.t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
