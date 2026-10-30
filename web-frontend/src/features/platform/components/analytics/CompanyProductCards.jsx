import React from 'react';
import { fmtMoney, fmtQty } from './analyticsFormat';
import { CompanyAnalyticsPager } from './CompanyAnalyticsTable';
import { usePagedRows } from '../../hooks/usePagedRows';

export default function CompanyProductCards({ t, products, loading }) {
  const pager = usePagedRows(products);
  return (
    <>
      {loading ? <p className="ta-muted">{t('common.loading')}</p> : null}
      {!loading && !products?.length ? <p className="ta-muted">{t('platform.analytics.topProductsEmpty')}</p> : null}
      {!loading && pager.rows.length ? (
        <div className="ca-products">
          {pager.rows.map((product, index) => (
            <article key={`${product.name}-${pager.offset + index}`} className="ca-product">
              <span className="ca-product__rank">{pager.offset + index + 1}</span>
              <div className="ca-product__body">
                <p className="ca-product__name">{product.name}</p>
                <p className="ta-muted">{t('platform.analytics.colQty')}: {fmtQty(product.quantity)}</p>
              </div>
              <p className="ca-product__amount">{fmtMoney(product.amount)}</p>
            </article>
          ))}
        </div>
      ) : null}
      <CompanyAnalyticsPager
        t={t}
        page={pager.page}
        size={pager.size}
        total={pager.total}
        pageSizes={pager.pageSizes}
        onPage={pager.setPage}
        onSize={pager.setSize}
      />
    </>
  );
}

