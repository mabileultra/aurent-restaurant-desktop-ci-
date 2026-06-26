import { BaseButton, BaseInput, BaseModal, BaseSelect } from '../../../components/ui';

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
    <BaseModal open={open} onClose={onClose} title={mode === 'edit' ? t('restaurantBooking.editTitle') : t('restaurantBooking.addTitle')}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600 dark:text-slate-300">{t('restaurantBooking.table')}</span>
          <BaseSelect
            value={form.tableId}
            onChange={(e) => onChange({ ...form, tableId: e.target.value })}
            required
            disabled={tablesLoading}
          >
            <option value="">
              {tablesLoading ? t('common.loading') : t('restaurantBooking.selectTable')}
            </option>
            {tableOptions.map((table) => (
              <option key={table.id} value={table.id}>
                {table.label} — {t(`restaurantHall.status_${table.status}`)}
              </option>
            ))}
          </BaseSelect>
          {!tablesLoading && tableOptions.length === 0 ? (
            <p className="mt-1 text-xs text-amber-600">{t('restaurantBooking.noTablesAvailable')}</p>
          ) : null}
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-600 dark:text-slate-300">{t('restaurantBooking.clientName')}</span>
          <BaseInput value={form.clientName} onChange={(e) => onChange({ ...form, clientName: e.target.value })} required />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-600 dark:text-slate-300">{t('restaurantBooking.clientPhone')}</span>
          <BaseInput value={form.clientPhone} onChange={(e) => onChange({ ...form, clientPhone: e.target.value })} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600 dark:text-slate-300">{t('restaurantBooking.guestCount')}</span>
            <BaseInput
              type="number"
              min={1}
              value={form.guestCount}
              onChange={(e) => onChange({ ...form, guestCount: e.target.value })}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600 dark:text-slate-300">{t('restaurantBooking.duration')}</span>
            <BaseInput
              type="number"
              min={30}
              step={15}
              value={form.durationMinutes}
              onChange={(e) => onChange({ ...form, durationMinutes: e.target.value })}
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-600 dark:text-slate-300">{t('restaurantBooking.reservedAt')}</span>
          <BaseInput
            type="datetime-local"
            value={form.reservedAt}
            onChange={(e) => onChange({ ...form, reservedAt: e.target.value })}
            required
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-600 dark:text-slate-300">{t('restaurantBooking.notes')}</span>
          <BaseInput value={form.notes} onChange={(e) => onChange({ ...form, notes: e.target.value })} />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</BaseButton>
          <BaseButton type="submit" disabled={isPending}>{t('common.save')}</BaseButton>
        </div>
      </form>
    </BaseModal>
  );
}
