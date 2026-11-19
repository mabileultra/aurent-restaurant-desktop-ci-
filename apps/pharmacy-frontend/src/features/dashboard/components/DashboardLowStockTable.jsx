import { AlertTriangle } from 'lucide-react';
import TablePagination from '../../../components/shared/TablePagination';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import {
  DASHBOARD_LOW_STOCK_PAGE_SIZES,
  useDashboardLowStockTable,
} from '../hooks/useDashboardLowStockTable';

export default function DashboardLowStockTable({ t, lowStock }) {
  const p = useDashboardLowStockTable(lowStock);

  if (!lowStock?.length) return null;

  return (
    <div className="ui-card-padded border-danger/30">
      <h2 className="mb-4 flex items-center gap-2.5 text-base font-semibold text-ink">
        <span className="ui-kpi-icon-warning h-8 w-8" aria-hidden>
          <AlertTriangle size={16} strokeWidth={1.75} />
        </span>
        {t('dashboard.lowStockTitle')}
      </h2>
      <div className="ui-table-wrap shadow-none">
        <table className="ui-table">
          <thead>
            <tr>
              <AdminTableNoIdHeaders />
              <th className="ui-th">{t('dashboard.colProduct')}</th>
              <th className="ui-th">{t('dashboard.colSku')}</th>
              <th className="ui-th text-right">{t('dashboard.colInStock')}</th>
              <th className="ui-th text-right">{t('dashboard.colMinAlert')}</th>
            </tr>
          </thead>
          <tbody>
            {p.rows.map((row, index) => (
              <tr key={row.id} className="ui-tr">
                <AdminTableNoIdCells page={p.page} pageSize={p.pageSize} index={index} id={row.id} />
                <td className="ui-td font-medium">{row.name}</td>
                <td className="ui-td-nowrap text-ink-muted">{row.sku}</td>
                <td className="ui-td-nowrap text-right">
                  <span className="ui-badge-danger">{row.stockQuantity}</span>
                </td>
                <td className="ui-td-nowrap text-right text-ink-muted">{row.lowStockAlert}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={p.page}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
        pageSizeOptions={DASHBOARD_LOW_STOCK_PAGE_SIZES}
        className="mt-3 border-line px-0"
      />
    </div>
  );
}
