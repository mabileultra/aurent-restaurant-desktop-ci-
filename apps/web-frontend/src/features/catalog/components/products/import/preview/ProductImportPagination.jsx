import { PRODUCT_IMPORT_PAGE_SIZES } from '../../../../utils/productImportPagination';
import './product-import-pagination.css';

export default function ProductImportPagination({
  t,
  page,
  totalPages,
  pageSize,
  from,
  to,
  total,
  onPageChange,
  onPageSizeChange,
}) {
  if (!total) return null;

  return (
    <div className="product-import-pagination">
      <div className="product-import-pagination__meta">
        {t('products.import.pageRange', { from, to, total })}
      </div>
      <div className="product-import-pagination__size">
        <span>{t('products.import.pageSize')}</span>
        {PRODUCT_IMPORT_PAGE_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            className={`product-import-pagination__chip${pageSize === size ? ' is-active' : ''}`}
            onClick={() => onPageSizeChange(size)}
          >
            {size}
          </button>
        ))}
      </div>
      <div className="product-import-pagination__nav">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t('products.import.pagePrev')}
        </button>
        <span>
          {t('products.import.pageOf', { page, totalPages })}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t('products.import.pageNext')}
        </button>
      </div>
    </div>
  );
}
