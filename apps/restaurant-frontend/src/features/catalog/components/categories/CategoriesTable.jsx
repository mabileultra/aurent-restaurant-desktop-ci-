import { MoreVertical, Tags } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TablePagination, { TABLE_PAGE_SIZE_OPTIONS } from '../../../../components/shared/TablePagination';
import '../../styles/categories-table.css';

export default function CategoriesTable({
  manage,
  isLoading,
  pageRows,
  categories,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onToggleRowMenu,
}) {
  const { t } = useTranslation();
  const colSpan = manage ? 5 : 4;
  const empty = !isLoading && categories.length === 0;

  return (
    <div className="rst-categories-table">
      <div className="rst-categories-table__scroll">
        <table>
          <thead>
            <tr>
              <th>{t('common.colNo')}</th>
              <th>{t('categories.colName')}</th>
              <th>{t('categories.colDescription')}</th>
              <th>{t('categories.colBusinessType')}</th>
              {manage ? <th aria-label={t('categories.actions')} /> : null}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={colSpan} className="is-center">{t('common.loading')}</td>
              </tr>
            ) : null}
            {!isLoading &&
              pageRows.map((row, index) => (
                <tr key={row.id}>
                  <td className="is-muted">{page * pageSize + index + 1}</td>
                  <td className="is-strong">{row.name}</td>
                  <td className="is-desc">{row.description || '—'}</td>
                  <td>
                    <span className="rst-categories-table__badge">
                      {row.businessTypeName ?? t('categories.businessTypeAll')}
                    </span>
                  </td>
                  {manage ? (
                    <td className="is-actions">
                      <button
                        type="button"
                        className="rst-categories-table__more"
                        aria-label={t('categories.actions')}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleRowMenu(row, e.currentTarget.getBoundingClientRect());
                        }}
                      >
                        <MoreVertical size={16} aria-hidden />
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            {empty ? (
              <tr>
                <td colSpan={colSpan} className="is-center">
                  <span className="rst-categories-table__empty">
                    <Tags size={28} aria-hidden />
                    {t('categories.none')}
                  </span>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {!empty ? (
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={TABLE_PAGE_SIZE_OPTIONS}
        />
      ) : null}
    </div>
  );
}
