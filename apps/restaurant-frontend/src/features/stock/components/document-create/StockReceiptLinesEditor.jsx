import { useState } from 'react';
import { Download, Plus, Trash2, Upload } from 'lucide-react';
import { ProductLookupSelect } from '../../../../components/product-lookup';
import { BaseButton } from '../../../../components/ui';
import ReportColumnPicker from '../../../reports/components/ReportColumnPicker';
import StockDocumentLinesTable from './StockDocumentLinesTable';
import ReceiptLinesImportModal from './ReceiptLinesImportModal';
import { useDocumentLinesPage } from '../../hooks/useDocumentLinesPage';
import { useReceiptLinesColumns } from '../../hooks/useReceiptLinesColumns';
import { useReceiptLinesSelection } from '../../hooks/useReceiptLinesSelection';
import { downloadReceiptLinesCsv } from '../../utils/receiptLinesCsv';
import '../../styles/receipt-lines-toolbar.css';

export default function StockReceiptLinesEditor({
  t,
  lines,
  storeId,
  onProductPick,
  updateLine,
  addLine,
  removeLine,
  removeSelectedLines,
  replaceLines,
  onCreateProduct,
}) {
  const pager = useDocumentLinesPage(lines);
  const cols = useReceiptLinesColumns();
  const selection = useReceiptLinesSelection(lines);
  const [importOpen, setImportOpen] = useState(false);

  const handleAddLine = () => {
    addLine();
    pager.goToLastPage(lines.length + 1);
  };

  const visibleCols = cols.visibleDefs.map((c) => {
    const map = {
      no: { key: 'no', label: t(c.labelKey), className: 'rst-stock-doc-lines__no' },
      product: { key: 'product', label: t(c.labelKey) },
      qty: { key: 'qty', label: t(c.labelKey), className: 'rst-stock-doc-lines__qty' },
      buy: { key: 'buy', label: t(c.labelKey), className: 'rst-stock-doc-lines__price' },
      sale: { key: 'sale', label: t(c.labelKey), className: 'rst-stock-doc-lines__price' },
    };
    return map[c.id];
  }).filter(Boolean);

  visibleCols.push({ key: 'act', label: '', className: 'rst-stock-doc-lines__actions' });

  return (
    <>
      {selection.selectedKeys.size > 0 ? (
        <div className="rst-rec-lines-bulk">
          <p>
            {t('rst.nomenclature.selectedCount', { count: selection.selectedKeys.size })}
          </p>
          <div className="rst-rec-lines-bulk__actions">
            <BaseButton type="button" variant="ghost" onClick={selection.clear}>
              {t('rst.nomenclature.clearSelection')}
            </BaseButton>
            <BaseButton
              type="button"
              variant="danger"
              onClick={() => {
                removeSelectedLines([...selection.selectedKeys]);
                selection.clear();
              }}
            >
              <Trash2 size={16} aria-hidden />
              {t('rst.nomenclature.bulkDelete', { count: selection.selectedKeys.size })}
            </BaseButton>
          </div>
        </div>
      ) : null}

      <StockDocumentLinesTable
        title={t('stockReports.receiptLines')}
        lineCount={t('stockReports.linesCount', { count: lines.length })}
        addLabel={t('stockReports.addLine')}
        onAddLine={handleAddLine}
        columns={visibleCols}
        selectionHeader={(
          <th className="rst-stock-doc-lines__check">
            <input
              ref={selection.selectAllRef}
              type="checkbox"
              checked={selection.allSelected}
              onChange={selection.toggleAll}
              aria-label={t('rst.nomenclature.selectAll')}
            />
          </th>
        )}
        toolbarExtra={(
          <div className="rst-rec-lines-toolbar">
            <ReportColumnPicker
              t={t}
              columnDefs={cols.columnDefs}
              visible={cols.visible}
              onToggle={cols.toggleColumn}
            />
            <BaseButton type="button" variant="ghost" onClick={() => setImportOpen(true)}>
              <Upload size={16} aria-hidden />
              {t('stockReports.linesImport')}
            </BaseButton>
            <BaseButton
              type="button"
              variant="ghost"
              onClick={() => downloadReceiptLinesCsv(lines)}
            >
              <Download size={16} aria-hidden />
              {t('stockReports.linesExport')}
            </BaseButton>
          </div>
        )}
        pagination={{
          page: pager.page,
          pageSize: pager.pageSize,
          total: pager.total,
          totalPages: pager.totalPages,
          onPageChange: pager.setPage,
          onPageSizeChange: (size) => {
            pager.setPageSize(size);
            pager.setPage(0);
          },
          pageSizeOptions: pager.pageSizeOptions,
        }}
      >
        {pager.pageRows.map((line, i) => {
          const idx = pager.start + i;
          return (
            <tr key={line.key ?? idx} className={selection.selectedKeys.has(line.key) ? 'is-selected' : undefined}>
              <td className="rst-stock-doc-lines__check">
                <input
                  type="checkbox"
                  checked={selection.selectedKeys.has(line.key)}
                  onChange={() => selection.toggle(line.key)}
                  aria-label={t('rst.nomenclature.selectRow')}
                />
              </td>
              {cols.visible.no ? <td className="rst-stock-doc-lines__no">{idx + 1}</td> : null}
              {cols.visible.product ? (
                <td>
                  <div className="rst-stock-receipt-doc__product-cell">
                    <ProductLookupSelect
                      size="sm"
                      source="warehouse"
                      value={line.productId}
                      storeId={storeId}
                      disabled={!storeId}
                      placeholder={t('stockReports.pickProduct')}
                      showStockInList={false}
                      onChange={(e) => updateLine(idx, { productId: e.target.value })}
                      onProductSelect={(product) => {
                        if (product) onProductPick(idx, product);
                        else updateLine(idx, {
                          productId: '',
                          productName: '',
                          sku: '',
                          purchasePrice: '',
                          unitSellingPrice: '',
                        });
                      }}
                    />
                    {onCreateProduct ? (
                      <button
                        type="button"
                        className="rst-stock-receipt-doc__create-btn"
                        disabled={!storeId}
                        onClick={() => onCreateProduct(idx)}
                      >
                        <Plus size={14} aria-hidden />
                        {t('rst.nomenclature.createFromDoc')}
                      </button>
                    ) : null}
                  </div>
                </td>
              ) : null}
              {cols.visible.qty ? (
                <td className="rst-stock-doc-lines__qty">
                  <input
                    type="number"
                    min={0.001}
                    step="any"
                    className="rst-stock-doc-lines__input"
                    value={line.quantity}
                    onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                  />
                </td>
              ) : null}
              {cols.visible.buy ? (
                <td className="rst-stock-doc-lines__price">
                  <input
                    type="number"
                    step="any"
                    className="rst-stock-doc-lines__input"
                    value={line.purchasePrice}
                    onChange={(e) => updateLine(idx, { purchasePrice: e.target.value })}
                  />
                </td>
              ) : null}
              {cols.visible.sale ? (
                <td className="rst-stock-doc-lines__price">
                  <input
                    type="number"
                    step="any"
                    className="rst-stock-doc-lines__input"
                    value={line.unitSellingPrice}
                    onChange={(e) => updateLine(idx, { unitSellingPrice: e.target.value })}
                  />
                </td>
              ) : null}
              <td className="rst-stock-doc-lines__actions">
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

      {importOpen ? (
        <ReceiptLinesImportModal
          t={t}
          storeId={storeId}
          onClose={() => setImportOpen(false)}
          onApplyLines={(next) => {
            replaceLines(next);
            selection.clear();
            setImportOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
