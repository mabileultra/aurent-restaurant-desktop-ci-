import { fmtMoney } from '../../../utils/formatMoney';

export default function ScalesProductCard({ t, product }) {
  if (!product) {
    return (
      <div className="scales-product-card scales-product-card--empty">
        <p>{t('scales.noProduct')}</p>
      </div>
    );
  }

  return (
    <div className="scales-product-card">
      <p className="scales-product-card__plu">PLU {product.plu}</p>
      <h2 className="scales-product-card__name">{product.name}</h2>
      <dl className="scales-product-card__meta">
        <div>
          <dt>{t('scales.pricePerKg')}</dt>
          <dd>{fmtMoney(product.sellingPrice)}</dd>
        </div>
        <div>
          <dt>SKU</dt>
          <dd>{product.sku || '—'}</dd>
        </div>
        <div>
          <dt>{t('scales.stock')}</dt>
          <dd>{product.stockQuantity ?? '—'}</dd>
        </div>
      </dl>
    </div>
  );
}
