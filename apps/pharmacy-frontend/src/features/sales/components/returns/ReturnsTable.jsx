import { RotateCcw } from 'lucide-react';
import { EmptyState } from '../../../../components/ui';
import TableRowActionsMenu from '../../../../components/shared/TableRowActionsMenu';
import TablePagination from '../../../../components/shared/TablePagination';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../../components/shared/AdminTableNoIdColumns';
import { fmtMoney } from '../../../../utils/formatMoney';

const COL_COUNT = 9;

export default function ReturnsTable({
  t,
  catalogKind = 'grocery',
  rows,
  loading,
  showEmptyHint,
  fmtAt,
  menuOpenId,
  onMenuOpenChange,
  onOpenDetail,
  onEditReason,
  onContinueReturn,
  onCancelReturn,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) {
  return (
    <div className="ui-table-wrap">
      <div className="overflow-x-auto">
        <table className="ui-table">
          <thead>
            <tr>
              <AdminTableNoIdHeaders />
              <th className="ui-th">{t('returnsModule.colDate')}</th>
              <th className="ui-th">{t('returnsModule.colFiscal')}</th>
              <th className="ui-th text-right">{t('returnsModule.colAmount')}</th>
              <th className="ui-th text-right">{t('returnsModule.colPositions')}</th>
              <th className="ui-th">{t('returnsModule.colStore')}</th>
              <th className="ui-th">{t('returnsModule.colReason')}</th>
              <th className="ui-th text-right">{t('returnsModule.colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={COL_COUNT} className="ui-td py-10 text-center text-ink-muted">
                  {t('common.loading')}
                </td>
              </tr>
            ) : showEmptyHint ? (
              <tr>
                <td colSpan={COL_COUNT} className="p-0">
                  <EmptyState icon={RotateCcw} title={t('returnsModule.emptyHint')} />
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id} className="ui-tr">
                  <AdminTableNoIdCells page={page} pageSize={pageSize} index={index} id={row.id} />
                  <td className="ui-td-nowrap">{fmtAt(row.createdAt)}</td>
                  <td className="ui-td-nowrap text-xs text-ink-muted">
                    {row.fiscalModuleId}
                  </td>
                  <td className="ui-td-nowrap text-right font-semibold">
                    {fmtMoney(row.totalAmount)}
                  </td>
                  <td className="ui-td-nowrap text-right text-ink-muted">{row.positionsCount}</td>
                  <td className="ui-td">{row.storeName ?? '—'}</td>
                  <td
                    className="ui-td max-w-[200px] truncate text-ink-muted"
                    title={row.reason || ''}
                  >
                    {row.reason?.trim() ? row.reason : '—'}
                  </td>
                  <td className="ui-td text-right whitespace-nowrap">
                    <TableRowActionsMenu
                      open={menuOpenId === row.id}
                      onOpenChange={(open) => onMenuOpenChange(open ? row.id : null)}
                      actions={[
                        {
                          label: t('returnsModule.viewInfo'),
                          onClick: () => onOpenDetail(row),
                        },
                        ...(catalogKind !== 'pharmacy'
                          ? [
                              {
                                label: t('returnsModule.editReason'),
                                onClick: () => onEditReason(row),
                              },
                            ]
                          : []),
                        ...(row.status === 'REFUNDED'
                          ? [
                              {
                                label: t('returnsModule.returnMore'),
                                onClick: () => onContinueReturn(row),
                              },
                            ]
                          : []),
                        ...(row.status === 'VOIDED' && catalogKind !== 'pharmacy'
                          ? [
                              {
                                label: t('returnsModule.cancelReturn'),
                                danger: true,
                                onClick: () => onCancelReturn(row),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
