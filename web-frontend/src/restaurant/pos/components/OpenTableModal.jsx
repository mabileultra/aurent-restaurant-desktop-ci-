import { BaseButton, BaseInput } from '../../../components/ui';
import '../../shared/styles/rst-modal.css';

export default function OpenTableModal({ open, table, form, onChange, onClose, onSubmit, isPending, t }) {
  if (!open || !table) return null;

  return (
    <div className="rst-modal" role="dialog" aria-modal="true">
      <div className="rst-modal__card">
        <h2 className="rst-modal__title">{t('rst.floor.tableTitle', { code: table.code })}</h2>
        <p className="rst-modal__text">{t('rst.order.guestsHint')}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <label className="d-block mb-3">
            <span className="d-block mb-1 small">{t('rst.order.guestCount')}</span>
            <BaseInput
              type="number"
              min={1}
              max={99}
              value={form.guestCount}
              onChange={(e) => {
                const guestCount = Number(e.target.value) || 1;
                onChange({
                  ...form,
                  guestCount,
                  adultCount: Math.max(1, guestCount - Number(form.childrenCount || 0)),
                });
              }}
              required
            />
          </label>
          <div className="row g-2 mb-3">
            <label className="col-6">
              <span className="d-block mb-1 small">{t('rst.order.adultCount')}</span>
              <BaseInput
                type="number"
                min={0}
                max={99}
                value={form.adultCount}
                onChange={(e) => onChange({ ...form, adultCount: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="col-6">
              <span className="d-block mb-1 small">{t('rst.order.childrenCount')}</span>
              <BaseInput
                type="number"
                min={0}
                max={99}
                value={form.childrenCount}
                onChange={(e) => onChange({ ...form, childrenCount: Number(e.target.value) || 0 })}
              />
            </label>
          </div>
          <div className="rst-modal__actions">
            <BaseButton type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</BaseButton>
            <BaseButton type="submit" disabled={isPending}>{t('rst.order.open')}</BaseButton>
          </div>
        </form>
      </div>
    </div>
  );
}
