import { useMemo, useState } from 'react';
import { BaseButton, BaseInput } from '../../../components/ui';
import TouchOptionPickerModal from './TouchOptionPickerModal';
import TouchDatePickerModal from './TouchDatePickerModal';
import '../styles/touch-pickers.css';

const STATUS_FILTERS = ['all', 'PENDING', 'CONFIRMED', 'SEATED', 'CANCELLED', 'NO_SHOW'];

function formatDateLabel(value, locale, emptyLabel) {
  if (!value) return emptyLabel;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Booking filters — in compact/POS mode opens status & dates in touch modals.
 */
export default function BookingFiltersBar({
  filters,
  setFilters,
  resetFilters,
  t,
  touchPickers = false,
}) {
  const [picker, setPicker] = useState(null);
  const locale = t('common.locale', { defaultValue: 'ru-RU' });

  const statusOptions = useMemo(
    () => STATUS_FILTERS.map((status) => ({
      value: status,
      label: status === 'all'
        ? t('rst.admin.filterAll')
        : t(`rst.booking.status_${status}`),
    })),
    [t],
  );

  const statusLabel = statusOptions.find((row) => row.value === filters.status)?.label
    || t('rst.admin.filterAll');

  if (!touchPickers) {
    return (
      <div className="rst-admin-filters">
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{t('common.search')}</span>
          <BaseInput
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder={t('rst.booking.searchPh')}
          />
        </label>
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{t('rst.booking.status')}</span>
          <select
            className="form-select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{t('rst.booking.from')}</span>
          <BaseInput
            type="date"
            value={filters.fromDate}
            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
          />
        </label>
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{t('rst.booking.to')}</span>
          <BaseInput
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
          />
        </label>
        <BaseButton type="button" variant="ghost" className="rst-admin-filters__reset" onClick={resetFilters}>
          {t('rst.admin.filterReset')}
        </BaseButton>
      </div>
    );
  }

  return (
    <>
      <div className="rst-admin-filters">
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{t('common.search')}</span>
          <BaseInput
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder={t('rst.booking.searchPh')}
          />
        </label>

        <div className="rst-admin-field">
          <span className="rst-admin-field__label">{t('rst.booking.status')}</span>
          <button
            type="button"
            className="rst-touch-trigger"
            onClick={() => setPicker('status')}
          >
            <span className="rst-touch-trigger__value">{statusLabel}</span>
            <span className="rst-touch-trigger__chevron" aria-hidden>▾</span>
          </button>
        </div>

        <div className="rst-admin-field">
          <span className="rst-admin-field__label">{t('rst.booking.from')}</span>
          <button
            type="button"
            className="rst-touch-trigger"
            onClick={() => setPicker('from')}
          >
            <span className="rst-touch-trigger__value">
              {formatDateLabel(filters.fromDate, locale, t('rst.touchDate.any'))}
            </span>
            <span className="rst-touch-trigger__chevron" aria-hidden>▾</span>
          </button>
        </div>

        <div className="rst-admin-field">
          <span className="rst-admin-field__label">{t('rst.booking.to')}</span>
          <button
            type="button"
            className="rst-touch-trigger"
            onClick={() => setPicker('to')}
          >
            <span className="rst-touch-trigger__value">
              {formatDateLabel(filters.toDate, locale, t('rst.touchDate.any'))}
            </span>
            <span className="rst-touch-trigger__chevron" aria-hidden>▾</span>
          </button>
        </div>

        <BaseButton type="button" variant="ghost" className="rst-admin-filters__reset" onClick={resetFilters}>
          {t('rst.admin.filterReset')}
        </BaseButton>
      </div>

      <TouchOptionPickerModal
        open={picker === 'status'}
        title={t('rst.booking.status')}
        options={statusOptions}
        value={filters.status}
        onSelect={(status) => setFilters({ ...filters, status })}
        onClose={() => setPicker(null)}
        t={t}
      />
      <TouchDatePickerModal
        open={picker === 'from'}
        title={t('rst.booking.from')}
        value={filters.fromDate}
        onSelect={(fromDate) => setFilters({ ...filters, fromDate })}
        onClose={() => setPicker(null)}
        t={t}
      />
      <TouchDatePickerModal
        open={picker === 'to'}
        title={t('rst.booking.to')}
        value={filters.toDate}
        onSelect={(toDate) => setFilters({ ...filters, toDate })}
        onClose={() => setPicker(null)}
        t={t}
      />
    </>
  );
}
