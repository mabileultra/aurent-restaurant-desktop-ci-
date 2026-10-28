import React from 'react';
import { Filter, MapPin, Search, Wifi } from 'lucide-react';
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

export default function CompanyAnalyticsFilters({
  t,
  draft,
  setDraft,
  regions,
  districts,
  labelGeo,
  onApply,
  onReset,
}) {
  const set = (patch) => setDraft((current) => ({ ...current, ...patch }));

  return (
    <section className="ta-section">
      <div className="ta-section__head">
        <div>
          <h2 className="ta-section__title">
            <Filter size={16} strokeWidth={2.2} aria-hidden className="ta-inline-icon" />
            {t('platform.analytics.companiesFiltersTitle')}
          </h2>
          <p className="ta-section__sub">{t('platform.analytics.companiesFiltersSubtitle')}</p>
        </div>
        <div className="ta-period">
          <button type="button" className="ta-btn" onClick={onReset}>{t('platform.analytics.reset')}</button>
          <button type="button" className="ta-btn ta-btn-primary" onClick={onApply}>{t('platform.analytics.apply')}</button>
        </div>
      </div>
      <div className="ta-filters">
        <Field label={t('geo.region')} icon={MapPin}>
          <PlatformSelect
            value={draft.regionCode}
            onChange={(e) => set({ regionCode: e.target.value, districtCode: '' })}
            placeholder={t('platform.analytics.allRegions')}
            options={(regions ?? []).map((region) => ({
              value: region.code,
              label: labelGeo(region),
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
            options={(districts ?? []).map((district) => ({
              value: district.code,
              label: labelGeo(district),
            }))}
            searchable
            cleanGeo
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
        <Field label={t('platform.analytics.search')} icon={Search} className="ta-field--wide">
          <input
            value={draft.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder={t('platform.analytics.searchPh')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onApply();
            }}
          />
        </Field>
      </div>
    </section>
  );
}
