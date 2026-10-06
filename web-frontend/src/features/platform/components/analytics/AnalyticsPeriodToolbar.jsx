import { Download } from 'lucide-react';

const PERIODS = [
  { id: 'today', key: 'today' },
  { id: '7d', key: 'd7' },
  { id: '30d', key: 'd30' },
  { id: 'month', key: 'month' },
  { id: 'year', key: 'year' },
];

export default function AnalyticsPeriodToolbar({
  t,
  period,
  onPeriod,
  periodLabel,
  isLive,
  onExport,
  exporting = false,
}) {
  return (
    <div className="pa-toolbar">
      <div className="pa-periods" role="tablist" aria-label={t('platform.analytics.period')}>
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={period === p.id}
            className={period === p.id ? 'pa-periods__btn is-on' : 'pa-periods__btn'}
            onClick={() => onPeriod(p.id)}
          >
            {t(`platform.analytics.periods.${p.key}`)}
          </button>
        ))}
        {periodLabel ? <span className="pa-periods__range">{periodLabel}</span> : null}
        {isLive ? <span className="pa-live">{t('platform.analytics.live')}</span> : null}
      </div>
      <button
        type="button"
        className="pa-btn pa-btn--outline"
        disabled={!onExport || exporting}
        onClick={onExport}
      >
        <Download size={16} aria-hidden />
        {exporting ? t('platform.analytics.exporting') : t('platform.analytics.export')}
      </button>
    </div>
  );
}
