import { MoreVertical } from 'lucide-react';
import TablePagination from '../../../../components/shared/TablePagination';
import { fmtMoney } from '../../../../utils/formatMoney';
import { nomenclatureTypeLabelKey } from '../../utils/nomenclatureTypes';
import '../../styles/ingredients-table.css';

function cellValue(colId, product, ctx) {
  const { t, page, pageSize, index } = ctx;
  switch (colId) {
    case 'no':
      return page * pageSize + index + 1;
    case 'name':
      return <span className="is-strong">{product.name}</span>;
    case 'sku':
      return product.sku || '—';
    case 'barcode':
      return product.barcode || product.barcodes?.[0] || '—';
    case 'type':
      return t(nomenclatureTypeLabelKey(product.productType));
    case 'category':
      return product.categoryName ?? '—';
    case 'cost':
      return fmtMoney(product.costPrice);
    case 'price':
      return fmtMoney(product.sellingPrice);
    case 'stock':
      return <span className="is-strong">{product.stockQuantity ?? 0}</span>;
    default:
      return '—';
  }
}

export default function IngredientsTable({
  t,
  isLoading,
  rows,
  page,
  pageSize,
  pageSizeOptions,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  manage,
  onOpenRowMenu,
  visibleDefs,
  selection,
}) {
  const showSelect = manage && selection;
  const colSpan = (showSelect ? 1 : 0) + (visibleDefs?.length || 0) + (manage ? 1 : 0);

  return (
    <div className="rst-ingredients-table">
      <div className="rst-ingredients-table__scroll">
        <table>
          <thead>
            <tr>
              {showSelect ? (
                <th className="is-check">
                  <input
                    ref={selection.selectAllRef}
                    type="checkbox"
                    checked={selection.allPageSelected}
                    onChange={selection.toggleSelectAllPage}
                    aria-label={t('rst.nomenclature.selectAll')}
                  />
                </th>
              ) : null}
              {(visibleDefs || []).map((col) => (
                <th key={col.id} className={col.numeric ? 'is-num' : undefined}>
                  {t(col.labelKey)}
                </th>
              ))}
              {manage ? <th aria-label={t('stockModule.colActions')} /> : null}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={colSpan || 1} className="is-center">{t('common.loading')}</td></tr>
            ) : null}
            {!isLoading && rows.length === 0 ? (
              <tr><td colSpan={colSpan || 1} className="is-center">{t('rst.nomenclature.empty')}</td></tr>
            ) : null}
            {!isLoading &&
              rows.map((p, index) => (
                <tr key={p.id} className={selection?.selectedIds.has(p.id) ? 'is-selected' : undefined}>
                  {showSelect ? (
                    <td className="is-check">
                      <input
                        type="checkbox"
                        checked={selection.selectedIds.has(p.id)}
                        onChange={() => selection.toggleSelect(p.id)}
                        aria-label={t('rst.nomenclature.selectRow')}
                      />
                    </td>
                  ) : null}
                  {(visibleDefs || []).map((col) => (
                    <td key={col.id} className={col.numeric ? 'is-num' : undefined}>
                      {cellValue(col.id, p, { t, page, pageSize, index })}
                    </td>
                  ))}
                  {manage ? (
                    <td className="is-actions">
                      <button
                        type="button"
                        className="rst-ingredients-table__menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRowMenu(p, e.currentTarget.getBoundingClientRect());
                        }}
                      >
                        <MoreVertical size={16} aria-hidden />
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
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
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  );
}
