import { renderPosCatalogProduct } from './posCatalogRenderProduct';
import { usePosCatalogVirtualWindow } from '../../hooks/pos/usePosCatalogVirtualWindow';

export default function PosCatalogVirtualProducts({
  products,
  viewMode,
  t,
  onAddProduct,
  scrollParentRef,
}) {
  const windowed = usePosCatalogVirtualWindow({
    scrollParentRef,
    itemCount: products.length,
    viewMode,
  });

  const slice = products.slice(windowed.startIndex, windowed.endIndex);
  const isList = viewMode === 'list';
  const listClass = isList ? 'pos-product-list' : 'pos-product-grid';

  return (
    <div className="pos-catalog-virtual" style={{ height: windowed.totalHeight }}>
      <div
        className={`pos-catalog-virtual__window ${listClass}`}
        style={{ transform: `translateY(${windowed.offsetY}px)` }}
      >
        {slice.map((p) => renderPosCatalogProduct(p, { viewMode, t, onAddProduct }))}
      </div>
    </div>
  );
}
