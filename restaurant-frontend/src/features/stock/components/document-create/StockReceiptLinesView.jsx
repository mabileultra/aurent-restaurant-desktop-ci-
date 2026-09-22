import { fmtMoney } from '../../../../utils/formatMoney';
import StockDocumentLinesTable from './StockDocumentLinesTable';
import { useDocumentLinesPage } from '../../hooks/useDocumentLinesPage';

/** Read-only receipt lines with pagination. */
export default function StockReceiptLinesView({ t, lines = [] }) {
  const pager = useDocumentLinesPage(lines, { resetKey: lines.length });

  return (
    <StockDocumentLinesTable
      title={t('stockReports.receiptLines')}
      lineCount={t('stockReports.linesCount', { count: lines.length })}
      columns={[
        { key: 'no', label: t('common.colNo'), className: 'rst-stock-doc-lines__no' },
        { key: 'product', label: t('stockReports.pickProduct') },
        { key: 'qty', label: t('stockReports.colQty'), className: 'rst-stock-doc-lines__qty' },
        { key: 'buy', label: t('stockReports.purchasePrice'), className: 'rst-stock-doc-lines__price' },
        { key: 'sale', label: t('stockReports.salePrice'), className: 'rst-stock-doc-lines__price' },
        { key: 'sum', label: t('stockReports.colAmount'), className: 'rst-stock-doc-lines__price' },
      ]}
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
          <tr key={line.id ?? idx}>
            <td className="rst-stock-doc-lines__no">{idx + 1}</td>
            <td>
              <strong>{line.productName}</strong>
              {line.sku ? (
                <span className="rst-stock-receipt-doc__sku">{line.sku}</span>
              ) : null}
            </td>
            <td className="rst-stock-doc-lines__qty is-num">{line.quantity}</td>
            <td className="rst-stock-doc-lines__price is-num">{fmtMoney(line.purchasePrice)}</td>
            <td className="rst-stock-doc-lines__price is-num">{fmtMoney(line.unitSellingPrice)}</td>
            <td className="rst-stock-doc-lines__price is-num">{fmtMoney(line.lineCost)}</td>
          </tr>
        );
      })}
    </StockDocumentLinesTable>
  );
}
