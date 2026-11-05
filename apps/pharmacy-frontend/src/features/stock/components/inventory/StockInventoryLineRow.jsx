import { ProductLookupSelect } from '../../../../components/product-lookup';
import { formatQty } from '../../../../utils/quantityFormat';
import { inventoryLineVariance } from '../../utils/inventoryVariance';
import StockInventoryProductCell from './StockInventoryProductCell';
import StockInventoryQtyStepper from './StockInventoryQtyStepper';
import StockInventoryVarianceBadge from './StockInventoryVarianceBadge';

export default function StockInventoryLineRow({
  t,
  index,
  line,
  storeId,
  canRemove,
  onProduct,
  onFact,
  onClearProduct,
  onRemove,
}) {
  const product = line.product;
  const variance = inventoryLineVariance(line);
  const book = product ? formatQty(product.stockQuantity, product.saleType, product.unitCode) : '—';

  return (
    <tr>
      <td className="stock-inv-lines__no">{index + 1}</td>
      <td>
        <StockInventoryProductCell
          product={product}
          clearLabel={t('stockReports.pickProduct')}
          onClear={product ? onClearProduct : undefined}
          lookup={(
            <ProductLookupSelect
              size="sm"
              value={line.productId}
              storeId={storeId}
              disabled={!storeId}
              placeholder={t('stockReports.inventorySearchPlaceholder')}
              onChange={(e) => onProduct(e.target.value, null)}
              onProductSelect={(picked) => onProduct(picked ? String(picked.id) : '', picked)}
            />
          )}
        />
      </td>
      <td>
        <div className="stock-inv-sku">
          <span>{product?.sku || '—'}</span>
          {product?.barcode ? <span className="stock-inv-sku__barcode">{product.barcode}</span> : null}
        </div>
      </td>
      <td className="stock-inv-book">{book}</td>
      <td>
        <StockInventoryQtyStepper
          value={line.countedQuantity}
          product={product}
          disabled={!product}
          placeholder={t('stockReports.countedQty')}
          onChange={onFact}
        />
      </td>
      <td>
        <StockInventoryVarianceBadge t={t} variance={variance} product={product} />
      </td>
      <td>
        <button
          type="button"
          className="stock-inv-remove"
          disabled={!canRemove}
          onClick={onRemove}
          aria-label={t('common.delete')}
        >
          ×
        </button>
      </td>
    </tr>
  );
}
