import TablePagination, { TABLE_PAGE_SIZE_OPTIONS } from '../../../components/shared/TablePagination';

export default function ReportTableCard({ children, pagination, pageSizeOptions = TABLE_PAGE_SIZE_OPTIONS }) {
  return (
    <div className="admin-table-shell rst-report-table">
      <div className="overflow-x-auto">{children}</div>
      {pagination ? (
        <TablePagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
          pageSizeOptions={pagination.pageSizeOptions ?? pageSizeOptions}
        />
      ) : null}
    </div>
  );
}
