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
        { key: 'no', label: t('common.colNo'), className: 'is-no' },
        { key: 'product', label: t('stockReports.pickProduct') },
        { key: 'sys', label: t('stockReports.colStock'), className: 'is-sys' },
        { key: 'fact', label: t('stockReports.countedQty'), className: 'is-qty' },
        { key: 'act', label: '', className: 'is-act' },
      ]}
    >
      {lines.map((line, idx) => {
        const product = productByLine[idx];
        return (
          <tr key={line.key ?? idx}>
            <td className="is-no">{idx + 1}</td>
            <td>
              <ProductLookupSelect
                source="warehouse"
                size="sm"
                value={line.productId}
                storeId={storeId}
                disabled={!storeId}
                placeholder={t('stockReports.pickProduct')}
                onChange={(e) => updateLine(idx, { productId: e.target.value })}
                onProductSelect={(picked) => {
                  updateLine(idx, { productId: picked?.id ? String(picked.id) : '' });
                  setProductByLine((prev) => {
                    const next = { ...prev };
                    if (picked) next[idx] = picked;
                    else delete next[idx];
                    return next;
                  });
                }}
              />
            </td>
            <td className="is-sys">{product ? product.stockQuantity : '—'}</td>
            <td className="is-qty">
              <input
                type="number"
                min={0}
                placeholder={t('stockReports.countedQty')}
                value={line.countedQuantity}
                onChange={(e) => updateLine(idx, { countedQuantity: e.target.value })}
                className="rst-stock-doc-lines__input"
              />
            </td>
            <td className="is-act">
              <button
                type="button"
                onClick={() => removeLine(idx)}
                disabled={lines.length <= 1}
                className="rst-stock-doc-lines__remove"
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
