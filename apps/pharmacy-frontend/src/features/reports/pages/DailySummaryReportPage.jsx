import { useTranslation } from 'react-i18next';
import { reportApi } from '../../../api';
import { PageHeader } from '../../../components/ui';
import { fmtMoney } from '../../../utils/formatMoney';
import ReportExportButton from '../components/ReportExportButton';
import { useDailySummaryReportPage } from '../hooks/useDailySummaryReportPage';

export default function DailySummaryReportPage() {
  const { t } = useTranslation();
  const { date, setDate, data, isPending } = useDailySummaryReportPage();

  const cards = [
    { label: t('stockReports.kpiRevenue'), value: fmtMoney(data?.totalRevenue) },
    { label: t('stockReports.colReceipts'), value: data?.transactionCount ?? '—' },
    { label: t('stockReports.kpiSold'), value: `${data?.itemsSold ?? 0} ${t('stockReports.unitsSuffix')}` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('stockReports.dailySummaryTitle')}
        subtitle={t('stockReports.dailySummarySubtitle')}
        actions={(
          <ReportExportButton
            fetchBlob={() => reportApi.exportDaily({ date })}
            filenamePrefix="daily_summary"
          />
        )}
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="ui-input ui-tabular w-auto"
      />
      {isPending && <p className="text-sm text-ink-muted">{t('common.loading')}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="ui-card-padded">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{c.label}</p>
            <p className="ui-tabular mt-2 text-2xl font-bold text-ink">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
