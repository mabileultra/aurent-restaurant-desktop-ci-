import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatUzPhone } from '../../../../utils/phoneUz';
import { formatSupplierAccount } from '../../../../utils/supplierAccountUz';
import { useSupplierModalForm } from '../../hooks/useSupplierModalForm';

const inputCls = 'ui-input';

const labelCls = 'ui-label mb-1';

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
    <div className="ui-modal-overlay z-[60]">
      <button type="button" className="fixed inset-0 bg-ink/45" aria-label="Close" onClick={onClose} />
      <div className="ui-modal-panel relative max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="ui-modal-header">
          <h2 className="text-base font-semibold text-ink">
            {isEdit ? t('suppliersModule.modal.editTitle') : t('suppliersModule.modal.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="ui-icon-btn"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-5">
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>
              <span className="text-danger">*</span> {t('suppliersModule.modal.name')}
            </label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
            />
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>
              <span className="text-danger">*</span> {t('suppliersModule.modal.taxId')}
            </label>
            <input
              className={inputCls}
              value={form.taxId}
              onChange={(e) => setField('taxId', e.target.value)}
            />
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>
              <span className="text-danger">*</span> {t('suppliersModule.modal.accountNumber')}
            </label>
            <input
              className={`${inputCls} font-mono ui-tabular`}
              value={form.accountNumber}
              onChange={(e) => setField('accountNumber', formatSupplierAccount(e.target.value))}
              placeholder="2020 8000 1234 5678 9012"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>
              <span className="text-danger">*</span> {t('suppliersModule.modal.phone')}
            </label>
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) => setField('phone', formatUzPhone(e.target.value))}
              placeholder="+998 (__) ___-__-__"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              className="ui-btn-secondary"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={pending}
              className="ui-btn-primary"
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
