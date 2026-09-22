import StockDocumentAddLineButton from './StockDocumentAddLineButton';
import TablePagination from '../../../../components/shared/TablePagination';

export default function StockDocumentLinesTable({
  title,
  lineCount,
  addLabel,
  onAddLine,
  columns,
  children,
  pagination = null,
  toolbarExtra = null,
  selectionHeader = null,
}) {
  return (
    <section className="rst-stock-doc-lines">
      <div className="rst-stock-doc-lines__head">
        <h2 className="rst-stock-doc-lines__title">
          {title}
          <span className="rst-stock-doc-lines__count">{lineCount}</span>
        </h2>
        <div className="rst-stock-doc-lines__head-actions">
          {toolbarExtra}
          {onAddLine ? (
            <StockDocumentAddLineButton label={addLabel} onClick={onAddLine} />
          ) : null}
        </div>
      </div>
      <div className="rst-stock-doc-lines__scroll">
        <table className="rst-stock-doc-lines__table">
          <thead>
            <tr>
              {selectionHeader}
              {columns.map((col) => (
                <th key={col.key} className={col.className}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {pagination ? (
        <TablePagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
          pageSizeOptions={pagination.pageSizeOptions}
        />
      ) : null}
    </section>
  );
}
