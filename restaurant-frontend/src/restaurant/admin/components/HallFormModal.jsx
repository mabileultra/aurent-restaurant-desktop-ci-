import { X } from 'lucide-react';
import { BaseButton, BaseInput } from '../../../components/ui';
import '../../shared/styles/rst-modal.css';

export default function HallFormModal({ open, mode, form, onChange, onClose, onSubmit, isPending, t }) {
  if (!open) return null;

  return (
    <div className="rst-modal">
      <div className="rst-modal__card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="rst-modal__title mb-0">
            {mode === 'edit' ? t('rst.admin.editHall') : t('rst.admin.addHall')}
          </h2>
          <button type="button" onClick={onClose} className="btn btn-link p-0">
            <X size={20} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <label className="d-block mb-3">
            <span className="d-block mb-1 small">{t('rst.admin.hallName')}</span>
            <BaseInput value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} required />
          </label>
          <label className="d-block mb-3">
            <span className="d-block mb-1 small">{t('rst.admin.sortOrder')}</span>
            <BaseInput
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => onChange({ ...form, sortOrder: e.target.value })}
              required
            />
          </label>
          <div className="rst-modal__actions">
            <BaseButton type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</BaseButton>
            <BaseButton type="submit" disabled={isPending}>{t('common.save')}</BaseButton>
          </div>
        </form>
      </div>
    </div>
  );
}
