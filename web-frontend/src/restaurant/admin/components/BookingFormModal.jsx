import { BaseButton, BaseInput } from '../../../components/ui';
import '../../shared/styles/rst-modal.css';

export default function BookingFormModal({
  open,
  mode,
  form,
  tableOptions,
  tablesLoading,
  onChange,
  onClose,
  onSubmit,
  isPending,
  t,
}) {
  if (!open) return null;

  return (
    <div className="rst-modal" role="dialog" aria-modal="true">
      <div className="rst-modal__card" style={{ width: 'min(480px, 100%)' }}>
        <h2 className="rst-modal__title">
          {mode === 'edit' ? t('rst.booking.editTitle') : t('rst.booking.addTitle')}
        </h2>
        <form
          className="rst-booking-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <label>
            <span>{t('rst.booking.table')}</span>
            <select
              className="form-select"
              value={form.tableId}
              onChange={(e) => onChange({ ...form, tableId: e.target.value })}
              required
              disabled={tablesLoading}
            >
              <option value="">
                {tablesLoading ? t('common.loading') : t('rst.booking.selectTable')}
              </option>
              {tableOptions.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.label} — {t(`rst.status.${table.status}`, { defaultValue: table.status })}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>{t('rst.booking.clientName')}</span>
            <BaseInput value={form.clientName} onChange={(e) => onChange({ ...form, clientName: e.target.value })} required />
          </label>

          <label>
            <span>{t('rst.booking.clientPhone')}</span>
            <BaseInput value={form.clientPhone} onChange={(e) => onChange({ ...form, clientPhone: e.target.value })} />
          </label>

          <div className="rst-booking-form__row">
            <label>
              <span>{t('rst.booking.guestCount')}</span>
              <BaseInput
                type="number"
                min={1}
                value={form.guestCount}
                onChange={(e) => onChange({ ...form, guestCount: e.target.value })}
                required
              />
            </label>
            <label>
              <span>{t('rst.booking.duration')}</span>
              <BaseInput
                type="number"
                min={30}
                step={15}
                value={form.durationMinutes}
                onChange={(e) => onChange({ ...form, durationMinutes: e.target.value })}
              />
            </label>
          </div>

          <label>
            <span>{t('rst.booking.reservedAt')}</span>
            <BaseInput
              type="datetime-local"
              value={form.reservedAt}
              onChange={(e) => onChange({ ...form, reservedAt: e.target.value })}
              required
            />
          </label>

          <label>
            <span>{t('rst.booking.notes')}</span>
            <BaseInput value={form.notes} onChange={(e) => onChange({ ...form, notes: e.target.value })} />
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
