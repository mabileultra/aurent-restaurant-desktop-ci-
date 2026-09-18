export default function StockInventoryProductCell({ product, lookup, onClear, clearLabel }) {
  if (!product) return lookup;
  const meta = [product.categoryName, product.manufacturer].filter(Boolean).join(' · ');
  return (
    <div className="stock-inv-product">
      <div className="stock-inv-product__name">{product.name}</div>
      {meta ? <div className="stock-inv-product__meta">{meta}</div> : null}
      {onClear ? (
        <button type="button" className="stock-inv-remove" onClick={onClear} aria-label={clearLabel}>
          ×
        </button>
      ) : null}
    </div>
  );
}
