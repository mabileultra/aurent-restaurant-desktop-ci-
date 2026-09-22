import { BaseButton } from '../../../components/ui';
import RstOverlay from '../../shared/components/RstOverlay';
import '../../shared/styles/rst-modal.css';
import '../styles/floor-phase2.css';

export default function OpenTableModal({
  open,
  table,
  form,
  onChange,
  onClose,
  onSubmit,
  isPending,
  waiters = [],
  t,
}) {
  if (!open || !table) return null;

  const setGuests = (next) => {
    const guestCount = Math.min(99, Math.max(1, next));
    const childrenCount = Math.min(Number(form.childrenCount) || 0, guestCount);
    onChange({
      ...form,
      guestCount,
      childrenCount,
      adultCount: Math.max(0, guestCount - childrenCount),
    });
  };

  const setChildren = (next) => {
    const guestCount = Math.max(1, Number(form.guestCount) || 1);
    const childrenCount = Math.min(guestCount, Math.max(0, next));
    onChange({
      ...form,
      childrenCount,
      adultCount: Math.max(0, guestCount - childrenCount),
    });
  };

  return (
    <RstOverlay onClose={onClose}>
      <div className="rst-modal__card">
        <h2 className="rst-modal__title">{t('rst.floor.tableTitle', { code: table.code })}</h2>
        <p className="rst-modal__text">{t('rst.order.guestsHint')}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <span className="d-block mb-1 small">{t('rst.order.guestCount')}</span>
          <div className="rst-guest-stepper">
            <button
              type="button"
              className="rst-guest-stepper__btn"
              onClick={() => setGuests(Number(form.guestCount) - 1)}
              aria-label="-"
            >
              −
            </button>
            <span className="rst-guest-stepper__value">{form.guestCount}</span>
            <button
              type="button"
              className="rst-guest-stepper__btn"
              onClick={() => setGuests(Number(form.guestCount) + 1)}
              aria-label="+"
            >
              +
            </button>
          </div>

          <span className="d-block mb-1 small">{t('rst.order.childrenCount')}</span>
          <div className="rst-guest-stepper">
            <button
              type="button"
              className="rst-guest-stepper__btn"
              onClick={() => setChildren(Number(form.childrenCount || 0) - 1)}
              aria-label="-"
            >
              −
            </button>
            <span className="rst-guest-stepper__value">{form.childrenCount || 0}</span>
            <button
              type="button"
              className="rst-guest-stepper__btn"
              onClick={() => setChildren(Number(form.childrenCount || 0) + 1)}
              aria-label="+"
            >
              +
            </button>
          </div>
          <p className="rst-modal__text">
            {t('rst.order.adultsShort', { count: form.adultCount ?? Math.max(0, (form.guestCount || 0) - (form.childrenCount || 0)) })}
          </p>

          {waiters.length > 0 ? (
            <label className="d-block mb-3">
              <span className="d-block mb-1 small">{t('rst.order.waiter')}</span>
              <select
                className="form-select"
                value={form.waiterUserId || ''}
                onChange={(e) => onChange({ ...form, waiterUserId: e.target.value || '' })}
              >
                <option value="">{t('rst.order.waiterMe')}</option>
                {waiters.map((waiter) => (
                  <option key={waiter.id} value={waiter.id}>{waiter.name}</option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="d-block mb-3">
            <span className="d-block mb-1 small">{t('rst.order.orderComment')}</span>
            <textarea
              className="form-control"
              rows={3}
              maxLength={500}
              value={form.comment || ''}
              onChange={(e) => onChange({ ...form, comment: e.target.value })}
              placeholder={t('rst.order.orderCommentPh')}
            />
          </label>

          <div className="rst-modal__actions">
            <BaseButton type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</BaseButton>
            <BaseButton type="submit" disabled={isPending}>{t('rst.order.create')}</BaseButton>
          </div>
        </form>
      </div>
    </RstOverlay>
  );
}
