import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, PackagePlus } from 'lucide-react';
import { RST_STOCK_FLOW_PATHS } from '../../../../features/stock/stockFlowPaths';
import { DASH_PANEL_PAGE_SIZE } from '../../config/dashboardPanelLimits';
import DashboardPanelPager from './DashboardPanelPager';

function severityOf(row) {
  const qty = Number(row.stockQuantity ?? 0);
  const min = Number(row.lowStockAlert ?? 0);
  if (qty <= 0 || (min > 0 && qty <= min * 0.5)) return 'critical';
  return 'warn';
}

export default function DashboardStockAlerts({ t, rows, loading }) {
  return (
    <section className="rst-dash__panel">
      <div className="rst-dash__panel-head">
        <h2><AlertTriangle size={16} strokeWidth={2.2} aria-hidden />{t('rst.dashboard.stockTitle')}</h2>
        <Link to="/rst/admin/stock/balances">{t('rst.dashboard.openStock')} <ArrowUpRight size={14} aria-hidden /></Link>
      </div>
      {loading ? (
        <div className="rst-empty">{t('common.loading')}</div>
      ) : !rows?.length ? (
        <div className="rst-empty">{t('rst.dashboard.stockEmpty')}</div>
      ) : (
        <DashboardPanelPager items={rows} pageSize={DASH_PANEL_PAGE_SIZE.stockAlerts} t={t}>
          {(pageRows, pager) => (
            <>
              <ul className="rst-dash__stock-list">
                {pageRows.map((row) => {
                  const level = severityOf(row);
                  const id = row.productId || row.id;
                  return (
                    <li key={id} className={`is-${level}`}>
                      <div>
                        <strong>{row.productName || row.name}</strong>
                        <p>
                          {t('rst.dashboard.stockLine', {
                            qty: row.stockQuantity,
                            min: row.lowStockAlert,
                          })}
                        </p>
                      </div>
                      <div className="rst-dash__stock-actions">
                        {level === 'critical' ? (
                          <Link to={RST_STOCK_FLOW_PATHS.receipts}>
                            <PackagePlus size={13} aria-hidden />
                            {t('rst.dashboard.createReceipt')}
                          </Link>
                        ) : (
                          <Link to={RST_STOCK_FLOW_PATHS.balances}>{t('rst.dashboard.openItem')}</Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {pager}
            </>
          )}
        </DashboardPanelPager>
      )}
    </section>
  );
}
