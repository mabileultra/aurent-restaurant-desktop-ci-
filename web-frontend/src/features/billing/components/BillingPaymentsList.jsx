export default function BillingPaymentsList({ t, money, formatDateTime, rows, loading, showCompany }) {
  if (loading) {
    return <p className="text-sm text-slate-500">{t('common.loading')}</p>;
  }
  if (!rows?.length) {
    return <p className="text-sm text-slate-500">{t('billing.paymentsEmpty')}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="billing-table billing-table--compact">
        <thead>
          <tr>
            {showCompany ? <th>{t('platform.billing.colCompany')}</th> : null}
            <th>{t('billing.paymentsProvider')}</th>
            <th>{t('billing.amountLabel')}</th>
            <th>{t('billing.paymentsStatus')}</th>
            <th>{t('billing.paymentsDate')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {showCompany ? <td>{row.companyName || `#${row.companyId}`}</td> : null}
              <td>{t(`billing.providers.${row.provider}`, { defaultValue: row.provider })}</td>
              <td>
                {money(row.amount)} {t('billing.currency')}
              </td>
              <td>
                <span className={`billing-badge billing-badge--${row.status === 'PAID' ? 'ACTIVE' : row.status === 'CANCELLED' ? 'BLOCKED' : 'GRACE'}`}>
                  {t(`billing.paymentStatuses.${row.status}`, { defaultValue: row.status })}
                </span>
              </td>
              <td>{formatDateTime(row.paidAt || row.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
