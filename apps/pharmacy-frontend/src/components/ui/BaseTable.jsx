import clsx from 'clsx';

export default function BaseTable({
  children,
  footer,
  isLoading = false,
  isEmpty = false,
  loadingMessage,
  emptyMessage,
  colSpan = 1,
  minWidth,
  className,
  tableClassName,
}) {
  return (
    <div className={clsx('admin-table-shell ui-table-wrap', className)}>
      <div className="overflow-x-auto">
        <table
          className={clsx('ui-table', tableClassName)}
          style={minWidth ? { minWidth } : undefined}
        >
          {isLoading || isEmpty ? (
            <tbody>
              <tr>
                <td colSpan={colSpan} className="px-4 py-10 text-center text-ink-muted">
                  {isLoading ? loadingMessage : emptyMessage}
                </td>
              </tr>
            </tbody>
          ) : (
            children
          )}
        </table>
      </div>
      {footer ? (
        <div className="base-table__footer relative z-20 overflow-visible bg-surface border-t border-line">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
