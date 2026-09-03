import { Trash2 } from 'lucide-react';
import { ProductLookupSelect } from '../../../../components/product-lookup';
import StockDocumentLinesTable from './StockDocumentLinesTable';

export default function StockReceiptLinesEditor({
  t,
  lines,
  storeId,
  onProductPick,
  updateLine,
  addLine,
  removeLine,
}) {
  return (
    <StockDocumentLinesTable
      title={t('stockReports.receiptLines')}
      lineCount={t('stockReports.linesCount', { count: lines.length })}
      addLabel={t('stockReports.addLine')}
      onAddLine={addLine}
      columns={[
        { key: 'no', label: t('common.colNo'), className: 'stock-doc-lines__no' },
        { key: 'product', label: t('stockReports.pickProduct') },
        { key: 'qty', label: t('stockReports.colQty'), className: 'stock-doc-lines__qty' },
        { key: 'buy', label: t('stockReports.purchasePrice'), className: 'stock-doc-lines__price' },
        { key: 'sale', label: t('stockReports.salePrice'), className: 'stock-doc-lines__price' },
        { key: 'act', label: '', className: 'stock-doc-lines__actions' },
      ]}
    >
      {lines.map((line, idx) => (
        <tr key={line.key ?? idx}>
          <td className="stock-doc-lines__no">{idx + 1}</td>
          <td>
            <ProductLookupSelect
              size="sm"
              value={line.productId}
              storeId={storeId}
              disabled={!storeId}
              placeholder={t('stockReports.pickProduct')}
              showStockInList={false}
              onChange={(e) => updateLine(idx, { productId: e.target.value })}
              onProductSelect={(product) => {
                if (product) onProductPick(idx, product);
                else updateLine(idx, { productId: '', purchasePrice: '', unitSellingPrice: '' });
              }}
            />
          </td>
          <td className="stock-doc-lines__qty">
            <input
              type="number"
              min={1}
              className="stock-doc-lines__input"
              placeholder={t('stockReports.colQty')}
              value={line.quantity}
              onChange={(e) => updateLine(idx, { quantity: e.target.value })}
            />
          </td>
          <td className="stock-doc-lines__price">
            <input
              type="number"
              className="stock-doc-lines__input"
              placeholder={t('stockReports.purchasePrice')}
              value={line.purchasePrice}
              onChange={(e) => updateLine(idx, { purchasePrice: e.target.value })}
            />
          </td>
          <td className="stock-doc-lines__price">
            <input
              type="number"
              className="stock-doc-lines__input"
              placeholder={t('stockReports.salePrice')}
              value={line.unitSellingPrice}
              onChange={(e) => updateLine(idx, { unitSellingPrice: e.target.value })}
            />
          </td>
          <td className="stock-doc-lines__actions">
            <button
              type="button"
              onClick={() => removeLine(idx)}
              disabled={lines.length <= 1}
              className="stock-doc-lines__remove"
              aria-label={t('common.delete')}
            >
              <Trash2 size={16} />
            </button>
          </td>
        </tr>
      ))}
    </StockDocumentLinesTable>
  );
}
