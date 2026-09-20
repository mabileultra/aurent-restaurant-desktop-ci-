import { X } from 'lucide-react';
import { BaseButton, BaseInput } from '../../../components/ui';
import { MANUAL_TABLE_STATUSES } from '../../pos/utils/tableStatus';
import '../../shared/styles/rst-modal.css';

export default function TableFormModal({ open, mode, form, onChange, onClose, onSubmit, isPending, t }) {
  if (!open) return null;

  return (
    <div className="rst-modal">
      <div className="rst-modal__card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="rst-modal__title mb-0">
            {mode === 'edit' ? t('rst.admin.editTable') : t('rst.admin.addTable')}
          </h2>
          <button type="button" onClick={onClose} className="btn btn-link p-0">
            <X size={20} />
          </button>
        </div>
        <form
          className="row g-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <label className="col-6">
            <span className="d-block mb-1 small">{t('rst.admin.tableCode')}</span>
            <BaseInput value={form.code} onChange={(e) => onChange({ ...form, code: e.target.value })} required />
          </label>
          <label className="col-6">
            <span className="d-block mb-1 small">{t('rst.admin.tableLabel')}</span>
            <BaseInput value={form.label} onChange={(e) => onChange({ ...form, label: e.target.value })} />
          </label>
          <label className="col-6">
            <span className="d-block mb-1 small">{t('rst.admin.seatCount')}</span>
            <BaseInput
              type="number"
              min={1}
              value={form.seatCount}
              onChange={(e) => onChange({ ...form, seatCount: e.target.value })}
              required
            />
          </label>
          <label className="col-6">
            <span className="d-block mb-1 small">{t('rst.admin.status')}</span>
            <select
              className="form-select"
              value={form.status}
              onChange={(e) => onChange({ ...form, status: e.target.value })}
            >
              {MANUAL_TABLE_STATUSES.map((status) => (
                <option key={status} value={status}>{t(`rst.status.${status}`)}</option>
              ))}
            </select>
          </label>
          <div className="col-12 rst-modal__actions">
            <BaseButton type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</BaseButton>
            <BaseButton type="submit" disabled={isPending}>{t('common.save')}</BaseButton>
          </div>
        </form>
      </div>
    </div>
  );
}
