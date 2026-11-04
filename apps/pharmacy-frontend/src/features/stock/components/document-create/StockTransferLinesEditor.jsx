import { Trash2 } from 'lucide-react';
import { ProductLookupSelect } from '../../../../components/product-lookup';
import StockDocumentLinesTable from './StockDocumentLinesTable';

export default function StockTransferLinesEditor({
  t,
  lines,
  fromStoreId,
  updateLine,
  addLine,
  removeLine,
}) {
  return (
    <StockDocumentLinesTable
      title={t('stockReports.transferLines')}
      lineCount={t('stockReports.linesCount', { count: lines.length })}
      addLabel={t('stockReports.addLine')}
      onAddLine={addLine}
      columns={[
        { key: 'no', label: t('common.colNo'), className: 'stock-doc-lines__no' },
        { key: 'product', label: t('stockReports.pickProduct') },
        { key: 'qty', label: t('stockReports.colQty'), className: 'stock-doc-lines__qty' },
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
              storeId={fromStoreId}
              disabled={!fromStoreId}
              placeholder={t('stockReports.pickProduct')}
              onChange={(e) => updateLine(idx, { productId: e.target.value })}
            />
          </td>
          <td className="stock-doc-lines__qty">
            <input
              type="number"
              min={1}
              value={line.quantity}
              onChange={(e) => updateLine(idx, { quantity: e.target.value })}
              className="stock-doc-lines__input"
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
