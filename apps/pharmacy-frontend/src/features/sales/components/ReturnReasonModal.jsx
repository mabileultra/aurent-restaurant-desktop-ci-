import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ReturnReasonModal({ open, initialReason, saving, onClose, onSave }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason(initialReason ?? '');
  }, [open, initialReason]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  return (
    <div className="ui-modal-overlay z-[70]">
      <form
        onSubmit={handleSubmit}
        className="ui-modal-panel max-w-md"
      >
        <div className="ui-modal-header">
          <h2 className="text-base font-semibold text-ink">{t('returnsModule.editTitle')}</h2>
          <button type="button" onClick={onClose} className="ui-icon-btn" aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </div>
        <div className="ui-modal-body space-y-4">
          <div>
            <label className="ui-label mb-1">
              {t('returnsModule.colReason')}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
              className="ui-textarea"
              placeholder={t('pos.returnReasonPh')}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="ui-btn-secondary"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving || !reason.trim()}
              className="ui-btn-primary"
            >
              {saving ? t('common.processing') : t('common.save')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
