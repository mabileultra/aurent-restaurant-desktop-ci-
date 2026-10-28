import React from 'react';
import { fmtMoney, fmtQty } from './analyticsFormat';

export default function CompanyProductCards({ t, products, loading }) {
  if (loading) return <p className="ta-muted">{t('common.loading')}</p>;
  if (!products?.length) return <p className="ta-muted">{t('platform.analytics.topProductsEmpty')}</p>;
  return (
    <div className="ca-products">
      {products.map((product, index) => (
        <article key={`${product.name}-${index}`} className="ca-product">
          <span className="ca-product__rank">{index + 1}</span>
          <div className="ca-product__body">
            <p className="ca-product__name">{product.name}</p>
            <p className="ta-muted">{t('platform.analytics.colQty')}: {fmtQty(product.quantity)}</p>
          </div>
          <p className="ca-product__amount">{fmtMoney(product.amount)}</p>
        </article>
      ))}
    </div>
  );
}
