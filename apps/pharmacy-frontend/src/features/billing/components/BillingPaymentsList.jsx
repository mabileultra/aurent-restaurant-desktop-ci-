export default function BillingPaymentsList({ t, money, formatDateTime, rows, loading, showCompany }) {
  if (loading) {
    return <p className="text-sm text-ink-muted">{t('common.loading')}</p>;
  }
  if (!rows?.length) {
    return <p className="text-sm text-ink-muted">{t('billing.paymentsEmpty')}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="billing-table billing-table--compact text-ink">
        <thead>
          <tr className="border-b border-line">
            {showCompany ? <th className="text-ink-muted">{t('platform.billing.colCompany')}</th> : null}
            <th className="text-ink-muted">{t('billing.paymentsProvider')}</th>
            <th className="text-ink-muted">{t('billing.amountLabel')}</th>
            <th className="text-ink-muted">{t('billing.paymentsStatus')}</th>
            <th className="text-ink-muted">{t('billing.paymentsDate')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-primary-50">
              {showCompany ? <td className="text-ink">{row.companyName || `#${row.companyId}`}</td> : null}
              <td className="text-ink">{t(`billing.providers.${row.provider}`, { defaultValue: row.provider })}</td>
              <td className="ui-tabular font-semibold text-ink">
                {money(row.amount)} {t('billing.currency')}
              </td>
              <td>
                <span className={`billing-badge billing-badge--${row.status === 'PAID' ? 'ACTIVE' : row.status === 'CANCELLED' ? 'BLOCKED' : 'GRACE'}`}>
                  {t(`billing.paymentStatuses.${row.status}`, { defaultValue: row.status })}
                </span>
              </td>
              <td className="ui-tabular text-ink-muted">{formatDateTime(row.paidAt || row.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
