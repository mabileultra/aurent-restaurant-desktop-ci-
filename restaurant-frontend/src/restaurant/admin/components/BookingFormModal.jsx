import { BaseButton, BaseInput, BaseSelect } from '../../../components/ui';
import RstOverlay from '../../shared/components/RstOverlay';
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
    <RstOverlay onClose={onClose}>
      <div className="rst-modal__card">
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
          <BaseSelect
            label={t('rst.booking.table')}
            value={form.tableId}
            onChange={(e) => onChange({ ...form, tableId: e.target.value })}
            required
            disabled={tablesLoading}
            placeholder={tablesLoading ? t('common.loading') : t('rst.booking.selectTable')}
            options={[
              {
                value: '',
                label: tablesLoading ? t('common.loading') : t('rst.booking.selectTable'),
              },
              ...tableOptions.map((table) => ({
                value: table.id,
                label: `${table.label} — ${t(`rst.status.${table.status}`, { defaultValue: table.status })}`,
              })),
            ]}
          />

          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{t('rst.booking.clientName')}</span>
            <BaseInput
              value={form.clientName}
              onChange={(e) => onChange({ ...form, clientName: e.target.value })}
              required
            />
          </label>

          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{t('rst.booking.clientPhone')}</span>
            <BaseInput
              value={form.clientPhone}
              onChange={(e) => onChange({ ...form, clientPhone: e.target.value })}
            />
          </label>

          <div className="rst-booking-form__row">
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{t('rst.booking.guestCount')}</span>
              <BaseInput
                type="number"
                min={1}
                value={form.guestCount}
                onChange={(e) => onChange({ ...form, guestCount: e.target.value })}
                required
              />
            </label>
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{t('rst.booking.duration')}</span>
              <BaseInput
                type="number"
                min={30}
                step={15}
                value={form.durationMinutes}
                onChange={(e) => onChange({ ...form, durationMinutes: e.target.value })}
              />
            </label>
          </div>

          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{t('rst.booking.reservedAt')}</span>
            <BaseInput
              type="datetime-local"
              value={form.reservedAt}
              onChange={(e) => onChange({ ...form, reservedAt: e.target.value })}
              required
            />
          </label>

          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{t('rst.booking.notes')}</span>
            <BaseInput
              value={form.notes}
              onChange={(e) => onChange({ ...form, notes: e.target.value })}
            />
          </label>

          <div className="rst-modal__actions">
            <BaseButton type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</BaseButton>
            <BaseButton type="submit" disabled={isPending}>{t('common.save')}</BaseButton>
          </div>
        </form>
      </div>
    </RstOverlay>
  );
}
