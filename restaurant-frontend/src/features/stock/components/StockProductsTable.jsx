import TablePagination from '../../../components/shared/TablePagination';
import { MoreVertical } from 'lucide-react';
import { STOCK_PAGE_SIZE_OPTIONS } from '../constants';
import '../styles/stock-products-table.css';

export default function StockProductsTable({
  t,
  rows,
  loading,
  showEmptyHint,
  displayBarcode,
  onOpenRowMenu,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  manage,
}) {
  const colCount = manage ? 7 : 6;

  return (
    <div className="rst-stock-products-table">
      <div className="rst-stock-products-table__scroll">
        <table>
          <thead>
            <tr>
              <th>{t('common.colNo')}</th>
              <th>{t('stockModule.colProduct')}</th>
              <th>{t('stockModule.colCategory')}</th>
              <th className="is-num">{t('stockModule.colQty')}</th>
              <th>{t('stockModule.colBarcode')}</th>
              <th>{t('stockModule.colLocation')}</th>
              {manage ? <th aria-label={t('stockModule.colActions')} /> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colCount} className="is-center">{t('common.loading')}</td>
              </tr>
            ) : null}
            {!loading &&
              rows.map((product, index) => (
                <tr key={product.id}>
                  <td>{page * pageSize + index + 1}</td>
                  <td className="is-strong">{product.name}</td>
                  <td>{product.categoryName ?? '—'}</td>
                  <td className="is-num is-strong">{product.stockQuantity}</td>
                  <td className="is-mono">{displayBarcode(product)}</td>
                  <td>{product.storageLocation?.trim() || '—'}</td>
                  {manage ? (
                    <td className="is-actions">
                      <button
                        type="button"
                        className="rst-stock-products-table__menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRowMenu(product, e.currentTarget.getBoundingClientRect());
                        }}
                      >
                        <MoreVertical size={16} aria-hidden />
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            {!loading && rows.length === 0 && !showEmptyHint ? (
              <tr>
                <td colSpan={colCount} className="is-center">{t('common.noData')}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {showEmptyHint ? (
        <div className="rst-stock-products-table__empty">{t('stockModule.empty')}</div>
      ) : null}

      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={STOCK_PAGE_SIZE_OPTIONS}
      />
    </div>
  );
}
