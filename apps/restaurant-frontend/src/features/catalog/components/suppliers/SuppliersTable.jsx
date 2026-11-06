import TablePagination from '../../../../components/shared/TablePagination';
import '../../styles/suppliers-table.css';


export default function SuppliersTable({
  t,
  loading,
  rows,
  fmtDate,
  showEmptyHint,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) {
  return (
    <div className="rst-suppliers-table">
      <div className="rst-suppliers-table__scroll">
        <table>
          <thead>
            <tr>
              <th>{t('common.colNo')}</th>
              <th>{t('suppliersModule.colDate')}</th>
              <th>{t('suppliersModule.colName')}</th>
              <th>{t('suppliersModule.colTax')}</th>
              <th>{t('suppliersModule.colAddress')}</th>
              <th>{t('suppliersModule.colEmail')}</th>
              <th>{t('suppliersModule.colPhone')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="is-center">{t('common.loading')}</td></tr>
            ) : null}
            {!loading &&
              rows.map((row, index) => (
                <tr key={row.id}>
                  <td>{page * pageSize + index + 1}</td>
                  <td>{fmtDate(row.createdAt)}</td>
                  <td className="is-strong">{row.name}</td>
                  <td className="is-mono">{row.taxId}</td>
                  <td>{row.address ?? '—'}</td>
                  <td>{row.email ?? '—'}</td>
                  <td>{row.phone ?? '—'}</td>
                </tr>
              ))}
            {!loading && rows.length === 0 && !showEmptyHint ? (
              <tr><td colSpan={7} className="is-center">{t('common.noData')}</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {showEmptyHint ? (
        <div className="rst-suppliers-table__empty">{t('suppliersModule.empty')}</div>
      ) : null}
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
