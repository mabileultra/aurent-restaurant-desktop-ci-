import React from 'react';
import {
  Bookmark,
  Building2,
  CalendarRange,
  Download,
  Filter,
  MapPin,
  Percent,
  RotateCcw,
  Search,
  ShieldAlert,
  TrendingUp,
  Wifi,
} from 'lucide-react';
import PlatformDateRangePicker from '../PlatformDateRangePicker';
import PlatformSelect from '../PlatformSelect';

function Field({ label, icon: Icon, children, className = '' }) {
  return (
    <div className={`ta-field ${className}`.trim()}>
      <span className="ta-field__label">
        {Icon ? <Icon size={12} strokeWidth={2.2} aria-hidden /> : null}
        {label}
      </span>
      {children}
    </div>
  );
}

function RangePair({ from, to, onFrom, onTo, fromPh, toPh }) {
  return (
    <div className="ta-range">
      <input type="number" inputMode="decimal" value={from} onChange={(e) => onFrom(e.target.value)} placeholder={fromPh} />
      <span className="ta-muted">—</span>
      <input type="number" inputMode="decimal" value={to} onChange={(e) => onTo(e.target.value)} placeholder={toPh} />
    </div>
  );
}

function DatePair({ from, to, onFrom, onTo, t }) {
  return (
    <PlatformDateRangePicker
      from={from}
      to={to}
      onChange={({ from: f, to: nextTo }) => {
        onFrom(f);
        onTo(nextTo);
      }}
      t={t}
      className="w-full"
    />
  );
}

export default function TaxAnalyticsFiltersPanel({
  t,
  draft,
  setDraft,
  regions,
  districts,
  labelGeo,
  onApply,
  onReset,
  onSave,
  onLoad,
  onExport,
}) {
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <section className="ta-section">
      <div className="ta-section__head">
        <div>
          <h2 className="ta-section__title">
            <Filter size={16} strokeWidth={2.2} aria-hidden className="ta-inline-icon" />
            {t('platform.analytics.filtersTitle')}
          </h2>
          <p className="ta-section__sub">{t('platform.analytics.filtersSubtitle')}</p>
        </div>
      </div>

      <div className="ta-filters ta-filters--dense">
        <Field label={t('geo.region')} icon={MapPin}>
          <PlatformSelect
            value={draft.regionCode}
            onChange={(e) => set({ regionCode: e.target.value, districtCode: '' })}
            placeholder={t('platform.analytics.allRegions')}
            options={regions.map((r) => ({
              value: r.regionCode,
              label: labelGeo(r),
            }))}
            searchable
            cleanGeo
          />
        </Field>

        <Field label={t('geo.district')} icon={MapPin}>
          <PlatformSelect
            value={draft.districtCode}
            disabled={!draft.regionCode}
            onChange={(e) => set({ districtCode: e.target.value })}
            placeholder={t('platform.analytics.allDistricts')}
            options={districts.map((d) => ({
              value: d.code,
              label: labelGeo(d),
            }))}
            searchable
            cleanGeo
          />
        </Field>

        <Field label={t('platform.analytics.enterpriseType')} icon={Building2}>
          <PlatformSelect
            value={draft.enterpriseType}
            onChange={(e) => set({ enterpriseType: e.target.value })}
            placeholder={t('platform.analytics.allTypes')}
            options={[
              { value: 'LEGAL', label: t('platform.analytics.typeLegal') },
              { value: 'IE', label: t('platform.analytics.typeIe') },
            ]}
          />
        </Field>

        <Field label={t('platform.analytics.activitySubtype')} icon={Building2}>
          <PlatformSelect
            value={draft.activitySubtype}
            onChange={(e) => set({ activitySubtype: e.target.value })}
            placeholder={t('platform.analytics.allSubtypes')}
            options={[
              { value: 'RETAIL', label: t('platform.analytics.subtypeRetail') },
              { value: 'PHARMACY', label: t('platform.analytics.subtypePharmacy') },
              { value: 'RESTAURANT', label: t('platform.analytics.subtypeRestaurant') },
            ]}
          />
        </Field>

        <Field label={t('platform.analytics.connectionStatus')} icon={Wifi}>
          <PlatformSelect
            value={draft.connectionStatus}
            onChange={(e) => set({ connectionStatus: e.target.value })}
            placeholder={t('platform.analytics.allStatuses')}
            options={[
              { value: 'CONNECTED', label: t('platform.analytics.statusConnected') },
              { value: 'NOT_CONNECTED', label: t('platform.analytics.statusNotConnected') },
            ]}
          />
        </Field>

        <Field label={t('platform.analytics.activityStatus')} icon={Wifi}>
          <PlatformSelect
            value={draft.activityStatus}
            onChange={(e) => set({ activityStatus: e.target.value })}
            placeholder={t('platform.analytics.allActivity')}
            options={[
              { value: 'ACTIVE', label: t('platform.analytics.activityActive') },
              { value: 'INACTIVE', label: t('platform.analytics.activityInactive') },
            ]}
          />
        </Field>

        <Field label={t('platform.analytics.connectionPeriod')} icon={CalendarRange} className="ta-field--wide">
          <DatePair
            from={draft.connectionFrom}
            to={draft.connectionTo}
            onFrom={(v) => set({ connectionFrom: v })}
            onTo={(v) => set({ connectionTo: v })}
            t={t}
          />
        </Field>

        <Field label={t('platform.analytics.turnoverPeriod')} icon={CalendarRange} className="ta-field--wide">
          <DatePair
            from={draft.turnoverFrom}
            to={draft.turnoverTo}
            onFrom={(v) => set({ turnoverFrom: v })}
            onTo={(v) => set({ turnoverTo: v })}
            t={t}
          />
        </Field>

        <Field label={t('platform.analytics.turnoverRange')} icon={TrendingUp} className="ta-field--wide">
          <RangePair
            from={draft.turnoverMin}
            to={draft.turnoverMax}
            onFrom={(v) => set({ turnoverMin: v })}
            onTo={(v) => set({ turnoverMax: v })}
            fromPh={t('platform.analytics.from')}
            toPh={t('platform.analytics.to')}
          />
        </Field>

        <Field label={t('platform.analytics.fiscalShareRange')} icon={Percent} className="ta-field--wide">
          <RangePair
            from={draft.fiscalShareMin}
            to={draft.fiscalShareMax}
            onFrom={(v) => set({ fiscalShareMin: v })}
            onTo={(v) => set({ fiscalShareMax: v })}
            fromPh={t('platform.analytics.from')}
            toPh={t('platform.analytics.to')}
          />
        </Field>

        <Field label={t('platform.analytics.dynamics')} icon={TrendingUp}>
          <PlatformSelect
            value={draft.dynamics}
            onChange={(e) => set({ dynamics: e.target.value })}
            placeholder={t('platform.analytics.allDynamics')}
            options={[
              { value: 'UP', label: t('platform.analytics.dynamicsUp') },
              { value: 'DOWN', label: t('platform.analytics.dynamicsDown') },
              { value: 'FLAT', label: t('platform.analytics.dynamicsFlat') },
            ]}
          />
        </Field>

        <Field label={t('platform.analytics.hasErrors')} icon={ShieldAlert}>
          <PlatformSelect
            value={draft.hasErrors}
            onChange={(e) => set({ hasErrors: e.target.value })}
            placeholder={t('platform.analytics.allErrors')}
            options={[
              { value: 'YES', label: t('platform.analytics.errorsYes') },
              { value: 'NO', label: t('platform.analytics.errorsNo') },
            ]}
          />
        </Field>

        <Field label={t('platform.analytics.lastActivity')} icon={CalendarRange} className="ta-field--wide">
          <DatePair
            from={draft.lastActivityFrom}
            to={draft.lastActivityTo}
            onFrom={(v) => set({ lastActivityFrom: v })}
            onTo={(v) => set({ lastActivityTo: v })}
            t={t}
          />
        </Field>

        <Field label={t('platform.analytics.search')} icon={Search} className="ta-field--search">
          <div className="ta-search">
            <Search size={14} strokeWidth={2.2} aria-hidden />
            <input
              value={draft.search}
              onChange={(e) => set({ search: e.target.value })}
              placeholder={t('platform.analytics.searchPh')}
            />
          </div>
        </Field>
      </div>

      <div className="ta-filter-actions">
        <div className="ta-period">
          <button type="button" className="ta-btn ta-btn-primary" onClick={onApply}>
            <Filter size={14} aria-hidden />
            {t('platform.analytics.apply')}
          </button>
          <button type="button" className="ta-btn" onClick={onReset}>
            <RotateCcw size={14} aria-hidden />
            {t('platform.analytics.reset')}
          </button>
          <button type="button" className="ta-btn" onClick={onSave}>
            <Bookmark size={14} aria-hidden />
            {t('platform.analytics.saveFilter')}
          </button>
          <button type="button" className="ta-btn" onClick={onLoad}>
            <Bookmark size={14} aria-hidden />
            {t('platform.analytics.loadFilter')}
          </button>
        </div>
        <button type="button" className="ta-btn ta-btn-export" onClick={onExport}>
          <Download size={14} aria-hidden />
          {t('platform.analytics.exportExcel')}
        </button>
      </div>
    </section>
  );
}
