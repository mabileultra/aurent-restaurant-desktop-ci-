export default function AnalyticsComingSoon({ t, tabKey }) {
  return (
    <div className="pa-coming">
      <h2 className="pa-coming__title">{t(`platform.analytics.tabs.${tabKey}`)}</h2>
      <p className="pa-coming__text">{t('platform.analytics.comingSoon')}</p>
    </div>
  );
}
