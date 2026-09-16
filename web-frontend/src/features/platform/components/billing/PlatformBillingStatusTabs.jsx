export default function PlatformBillingStatusTabs({
  t,
  statusFilters,
  status,
  onStatusChange,
}) {
  return (
    <div className="billing-tabs">
      {statusFilters.map((value) => (
        <button
          key={value || 'all'}
          type="button"
          className={`billing-tab ${status === value ? 'billing-tab--active' : ''}`}
          onClick={() => onStatusChange(value)}
        >
          {value ? t(`platform.billing.statuses.${value}`) : t('platform.billing.filterAll')}
        </button>
      ))}
    </div>
  );
}
