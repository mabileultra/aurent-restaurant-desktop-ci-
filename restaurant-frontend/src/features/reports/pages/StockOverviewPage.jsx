import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { BaseButton } from '../../../components/ui';
import ReportDateBar from '../components/ReportDateBar';
import ReportStoreSelect from '../components/ReportStoreSelect';
import { useStockDashboardPage } from '../hooks/useStockDashboardPage';
import { buildStockDashboardCards } from '../utils/stockDashboardCards';
import { useStockFlowPaths } from '../../stock/stockFlowPaths';
import { fmtMoney } from '../../../utils/formatMoney';
import { getApiErrorMessage } from '../../../utils/apiError';
import '../styles/stock-overview.css';

function formatUnits(isLoading, isError, units, t) {
  if (isLoading) return '…';
  if (isError) return '—';
  return `${units ?? 0} ${t('stockReports.unitsSuffix')}`;
}

export default function StockOverviewPage({ hideTitle = false } = {}) {
  const { t } = useTranslation();
  const p = useStockDashboardPage();
  const paths = useStockFlowPaths();
  const cards = buildStockDashboardCards(t, p.data, paths);

  return (
    <div className="rst-stock-overview">
      <div className="rst-stock-overview__toolbar">
        {hideTitle ? <div /> : (
          <div>
            <h1 className="rst-coming__title">{t('stockReports.dashboardTitle')}</h1>
            <p className="rst-coming__text mb-0">{t('rst.stock.overviewHint')}</p>
          </div>
        )}
        <BaseButton type="button" variant="secondary" onClick={() => p.refetch()}>
          <RefreshCw size={16} aria-hidden />
          {t('common.refresh', { defaultValue: 'Refresh' })}
        </BaseButton>
      </div>

      <div className="rst-stock-overview__filters">
        <ReportDateBar from={p.from} to={p.to} onFrom={p.setFrom} onTo={p.setTo} />
        <ReportStoreSelect stores={p.stores} value={p.storeId} onChange={p.setStoreId} />
      </div>

      {p.isError ? (
        <div className="rst-notice">
          {getApiErrorMessage(p.error, t('stockReports.loadError'))}
        </div>
      ) : null}

      <div className="rst-stock-overview__kpi">
        {cards.map((card) => {
          const Icon = card.icon;
          const body = (
            <>
              <div className="rst-stock-overview__kpi-label">
                <Icon size={16} aria-hidden />
                {card.label}
              </div>
              <div className="rst-stock-overview__kpi-value">
                {formatUnits(p.isLoading, p.isError, card.units, t)}
              </div>
              {card.money != null && !p.isLoading && !p.isError ? (
                <div className="rst-stock-overview__kpi-sub">
                  {t('rst.stock.kpiCostEstimate', {
                    defaultValue: '~ {{amount}}',
                    amount: fmtMoney(card.money),
                  })}
                </div>
              ) : null}
            </>
          );
          const cls = `rst-stock-overview__kpi-card is-${card.tone}`;
          return card.to ? (
            <Link key={card.key} to={card.to} className={cls}>{body}</Link>
          ) : (
            <div key={card.key} className={cls}>{body}</div>
          );
        })}
      </div>

      <div className="rst-stock-overview__links">
        <Link to={paths.receipts}>{t('rst.nav.stockReceipts')}</Link>
        <Link to={paths.writeOffs}>{t('rst.nav.stockWriteOffs')}</Link>
        <Link to={paths.transfers}>{t('rst.nav.stockTransfers')}</Link>
        <Link to={paths.inventories}>{t('rst.nav.stockInventories')}</Link>
        <Link to={paths.movements}>{t('rst.nav.stockMovements')}</Link>
      </div>
    </div>
  );
}
