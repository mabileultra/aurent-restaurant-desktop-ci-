import { BaseButton, BaseSelect } from '../../../components/ui';
import RstOverlay from '../../shared/components/RstOverlay';
import '../../shared/styles/rst-modal.css';
import '../styles/floor-phase2.css';

function GuestStepper({ label, value, onDec, onInc }) {
  return (
    <div className="rst-open-table__field">
      <span className="rst-open-table__label">{label}</span>
      <div className="rst-guest-stepper">
        <button type="button" className="rst-guest-stepper__btn" onClick={onDec} aria-label="-">−</button>
        <span className="rst-guest-stepper__value">{value}</span>
        <button type="button" className="rst-guest-stepper__btn" onClick={onInc} aria-label="+">+</button>
      </div>
    </div>
  );
}

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
      <div className="rst-modal__card rst-open-table">
        <h2 className="rst-modal__title">{t('rst.floor.tableTitle', { code: table.code })}</h2>
        <p className="rst-modal__text">{t('rst.order.guestsHint')}</p>
        <form
          className="rst-modal-form rst-open-table__form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <GuestStepper
            label={t('rst.order.guestCount')}
            value={form.guestCount}
            onDec={() => setGuests(Number(form.guestCount) - 1)}
            onInc={() => setGuests(Number(form.guestCount) + 1)}
          />

          <GuestStepper
            label={t('rst.order.childrenCount')}
            value={form.childrenCount || 0}
            onDec={() => setChildren(Number(form.childrenCount || 0) - 1)}
            onInc={() => setChildren(Number(form.childrenCount || 0) + 1)}
          />

          <p className="rst-open-table__adults">
            {t('rst.order.adultsShort', {
              count: form.adultCount ?? Math.max(0, (form.guestCount || 0) - (form.childrenCount || 0)),
            })}
          </p>

          {waiters.length > 0 ? (
            <BaseSelect
              label={t('rst.order.waiter')}
              value={form.waiterUserId || ''}
              onChange={(e) => onChange({ ...form, waiterUserId: e.target.value || '' })}
              options={[
                { value: '', label: t('rst.order.waiterMe') },
                ...waiters.map((waiter) => ({ value: waiter.id, label: waiter.name })),
              ]}
            />
          ) : null}

          <label className="rst-open-table__field">
            <span className="rst-open-table__label">{t('rst.order.orderComment')}</span>
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
