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

function Field({ label, icon: Icon, children, className = '' }) {
  return (
    <label className={`ta-field ${className}`.trim()}>
      <span className="ta-field__label">
        {Icon ? <Icon size={12} strokeWidth={2.2} aria-hidden /> : null}
        {label}
      </span>
      {children}
    </label>
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

function DatePair({ from, to, onFrom, onTo }) {
  return (
    <div className="ta-range">
      <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} />
      <span className="ta-muted">—</span>
      <input type="date" value={to} onChange={(e) => onTo(e.target.value)} />
    </div>
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
          <select
            value={draft.regionCode}
            onChange={(e) => set({ regionCode: e.target.value, districtCode: '' })}
          >
            <option value="">{t('platform.analytics.allRegions')}</option>
            {regions.map((r) => (
              <option key={r.regionCode} value={r.regionCode}>{labelGeo(r)}</option>
            ))}
          </select>
        </Field>

        <Field label={t('geo.district')} icon={MapPin}>
          <select
            value={draft.districtCode}
            disabled={!draft.regionCode}
            onChange={(e) => set({ districtCode: e.target.value })}
          >
            <option value="">{t('platform.analytics.allDistricts')}</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>{labelGeo(d)}</option>
            ))}
          </select>
        </Field>

        <Field label={t('platform.analytics.enterpriseType')} icon={Building2}>
          <select value={draft.enterpriseType} onChange={(e) => set({ enterpriseType: e.target.value })}>
            <option value="">{t('platform.analytics.allTypes')}</option>
            <option value="LEGAL">{t('platform.analytics.typeLegal')}</option>
            <option value="IE">{t('platform.analytics.typeIe')}</option>
          </select>
        </Field>

        <Field label={t('platform.analytics.activitySubtype')} icon={Building2}>
          <select value={draft.activitySubtype} onChange={(e) => set({ activitySubtype: e.target.value })}>
            <option value="">{t('platform.analytics.allSubtypes')}</option>
            <option value="RETAIL">{t('platform.analytics.subtypeRetail')}</option>
            <option value="PHARMACY">{t('platform.analytics.subtypePharmacy')}</option>
            <option value="RESTAURANT">{t('platform.analytics.subtypeRestaurant')}</option>
          </select>
        </Field>

        <Field label={t('platform.analytics.connectionStatus')} icon={Wifi}>
          <select value={draft.connectionStatus} onChange={(e) => set({ connectionStatus: e.target.value })}>
            <option value="">{t('platform.analytics.allStatuses')}</option>
            <option value="CONNECTED">{t('platform.analytics.statusConnected')}</option>
            <option value="NOT_CONNECTED">{t('platform.analytics.statusNotConnected')}</option>
          </select>
        </Field>

        <Field label={t('platform.analytics.activityStatus')} icon={Wifi}>
          <select value={draft.activityStatus} onChange={(e) => set({ activityStatus: e.target.value })}>
            <option value="">{t('platform.analytics.allActivity')}</option>
            <option value="ACTIVE">{t('platform.analytics.activityActive')}</option>
            <option value="INACTIVE">{t('platform.analytics.activityInactive')}</option>
          </select>
        </Field>

        <Field label={t('platform.analytics.connectionPeriod')} icon={CalendarRange} className="ta-field--wide">
          <DatePair
            from={draft.connectionFrom}
            to={draft.connectionTo}
            onFrom={(v) => set({ connectionFrom: v })}
            onTo={(v) => set({ connectionTo: v })}
          />
        </Field>

        <Field label={t('platform.analytics.turnoverPeriod')} icon={CalendarRange} className="ta-field--wide">
          <DatePair
            from={draft.turnoverFrom}
            to={draft.turnoverTo}
            onFrom={(v) => set({ turnoverFrom: v })}
            onTo={(v) => set({ turnoverTo: v })}
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
          <select value={draft.dynamics} onChange={(e) => set({ dynamics: e.target.value })}>
            <option value="">{t('platform.analytics.allDynamics')}</option>
            <option value="UP">{t('platform.analytics.dynamicsUp')}</option>
            <option value="DOWN">{t('platform.analytics.dynamicsDown')}</option>
            <option value="FLAT">{t('platform.analytics.dynamicsFlat')}</option>
          </select>
        </Field>

        <Field label={t('platform.analytics.hasErrors')} icon={ShieldAlert}>
          <select value={draft.hasErrors} onChange={(e) => set({ hasErrors: e.target.value })}>
            <option value="">{t('platform.analytics.allErrors')}</option>
            <option value="YES">{t('platform.analytics.errorsYes')}</option>
            <option value="NO">{t('platform.analytics.errorsNo')}</option>
          </select>
        </Field>

        <Field label={t('platform.analytics.lastActivity')} icon={CalendarRange} className="ta-field--wide">
          <DatePair
            from={draft.lastActivityFrom}
            to={draft.lastActivityTo}
            onFrom={(v) => set({ lastActivityFrom: v })}
            onTo={(v) => set({ lastActivityTo: v })}
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
