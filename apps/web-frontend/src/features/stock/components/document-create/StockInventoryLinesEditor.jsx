import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ProductLookupSelect } from '../../../../components/product-lookup';
import StockDocumentLinesTable from './StockDocumentLinesTable';

export default function StockInventoryLinesEditor({
  t,
  lines,
  storeId,
  updateLine,
  addLine,
  removeLine,
}) {
  const [productByLine, setProductByLine] = useState({});

  return (
    <StockDocumentLinesTable
      title={t('stockReports.inventoryLines')}
      lineCount={t('stockReports.linesCount', { count: lines.length })}
      addLabel={t('stockReports.addLine')}
      onAddLine={addLine}
      columns={[
        { key: 'no', label: t('common.colNo'), className: 'stock-doc-lines__no' },
        { key: 'product', label: t('stockReports.pickProduct') },
        { key: 'sys', label: t('stockReports.colStock'), className: 'stock-doc-lines__sys' },
        { key: 'fact', label: t('stockReports.countedQty'), className: 'stock-doc-lines__qty' },
        { key: 'act', label: '', className: 'stock-doc-lines__actions' },
      ]}
    >
      {lines.map((line, idx) => {
        const product = productByLine[idx];
        return (
          <tr key={line.key ?? idx}>
            <td className="stock-doc-lines__no">{idx + 1}</td>
            <td>
              <ProductLookupSelect
                size="sm"
                value={line.productId}
                storeId={storeId}
                disabled={!storeId}
                placeholder={t('stockReports.pickProduct')}
                onChange={(e) => updateLine(idx, { productId: e.target.value })}
                onProductSelect={(picked) =>
                  setProductByLine((prev) => {
                    const next = { ...prev };
                    if (picked) next[idx] = picked;
                    else delete next[idx];
                    return next;
                  })
                }
              />
            </td>
            <td className="stock-doc-lines__sys">
              {product ? product.stockQuantity : '—'}
            </td>
            <td className="stock-doc-lines__qty">
              <input
                type="number"
                min={0}
                placeholder={t('stockReports.countedQty')}
                value={line.countedQuantity}
                onChange={(e) => updateLine(idx, { countedQuantity: e.target.value })}
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
        );
      })}
    </StockDocumentLinesTable>
  );
}
