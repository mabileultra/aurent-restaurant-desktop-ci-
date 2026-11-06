export default function BillingPaymentsList({ t, money, formatDateTime, rows, loading, showCompany }) {
  if (loading) {
    return <p className="text-sm text-slate-500">{t('common.loading')}</p>;
  }
  if (!rows?.length) {
    return <p className="text-sm text-slate-500">{t('billing.paymentsEmpty')}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="billing-table billing-table--compact text-slate-800 dark:text-slate-100">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {showCompany ? <th className="text-slate-500 dark:text-slate-400">{t('platform.billing.colCompany')}</th> : null}
            <th className="text-slate-500 dark:text-slate-400">{t('billing.paymentsProvider')}</th>
            <th className="text-slate-500 dark:text-slate-400">{t('billing.amountLabel')}</th>
            <th className="text-slate-500 dark:text-slate-400">{t('billing.paymentsStatus')}</th>
            <th className="text-slate-500 dark:text-slate-400">{t('billing.paymentsDate')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-slate-50 dark:hover:!bg-slate-800">
              {showCompany ? <td className="text-slate-800 dark:text-slate-100">{row.companyName || `#${row.companyId}`}</td> : null}
              <td className="text-slate-800 dark:text-slate-100">{t(`billing.providers.${row.provider}`, { defaultValue: row.provider })}</td>
              <td className="font-semibold text-slate-900 dark:text-white">
                {money(row.amount)} {t('billing.currency')}
              </td>
              <td>
                <span className={`billing-badge billing-badge--${row.status === 'PAID' ? 'ACTIVE' : row.status === 'CANCELLED' ? 'BLOCKED' : 'GRACE'}`}>
                  {t(`billing.paymentStatuses.${row.status}`, { defaultValue: row.status })}
                </span>
              </td>
              <td className="text-slate-600 dark:text-slate-300">{formatDateTime(row.paidAt || row.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
