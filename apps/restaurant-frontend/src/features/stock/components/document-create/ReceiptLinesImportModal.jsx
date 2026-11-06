import { Download, Upload } from 'lucide-react';
import { BaseButton, BaseModal } from '../../../../components/ui';
import { useReceiptLinesImport } from '../../hooks/useReceiptLinesImport';
import { fmtMoney } from '../../../../utils/formatMoney';
import '../../styles/receipt-lines-import-modal.css';

export default function ReceiptLinesImportModal({ t, storeId, onClose, onApplyLines }) {
  const imp = useReceiptLinesImport({ t, storeId, onApplyLines, onClose });

  return (
    <BaseModal
      open
      title={t('stockReports.linesImportTitle')}
      onClose={onClose}
      size="lg"
      className="rst-rec-import-modal"
      footer={(
        <>
          <BaseButton type="button" variant="secondary" onClick={onClose} disabled={imp.busy}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton type="button" onClick={imp.runImport} disabled={imp.busy || !imp.canImport}>
            {imp.busy ? t('common.loading') : t('stockReports.linesImportSubmit')}
          </BaseButton>
        </>
      )}
    >
      <p className="rst-coming__text">{t('stockReports.linesImportHint')}</p>

      <div className="rst-rec-import__sources">
        <label className={imp.source === 'CATALOG' ? 'is-active' : undefined}>
          <input
            type="radio"
            name="receipt-import-source"
            checked={imp.source === 'CATALOG'}
            onChange={() => imp.setSource('CATALOG')}
          />
          <span>{t('stockReports.linesImportSourceCatalog')}</span>
        </label>
        <label className={imp.source === 'UZ_INVOICE' ? 'is-active' : undefined}>
          <input
            type="radio"
            name="receipt-import-source"
            checked={imp.source === 'UZ_INVOICE'}
            onChange={() => imp.setSource('UZ_INVOICE')}
          />
          <span>{t('stockReports.linesImportSourceInvoice')}</span>
        </label>
      </div>

      <div className="rst-rec-import__actions">
        {imp.source === 'CATALOG' ? (
          <BaseButton type="button" variant="secondary" onClick={imp.downloadTemplate} disabled={imp.busy}>
            <Download size={16} aria-hidden />
            {t('stockReports.linesImportDownloadTemplate')}
          </BaseButton>
        ) : null}
        <BaseButton type="button" variant="secondary" onClick={imp.pickFile} disabled={imp.busy}>
          <Upload size={16} aria-hidden />
          {t('stockReports.linesImportPickFile')}
        </BaseButton>
        <input
          ref={imp.fileRef}
          type="file"
          className="rst-rec-import__file"
          accept=".xlsx,.xls,.json,.pdf,application/pdf"
          onChange={imp.onFile}
        />
      </div>

      {imp.file ? (
        <p className="rst-rec-import__meta">
          {imp.file.name}
          {imp.preview
            ? ` · ${t('stockReports.linesImportPreviewMeta', {
              newCount: imp.newCount,
              dupCount: imp.dupCount,
            })}`
            : ''}
        </p>
      ) : null}

      {imp.usableRows.length > 0 ? (
        <div className="rst-rec-import__table-wrap">
          <table className="rst-rec-import__table">
            <thead>
              <tr>
                <th>{t('products.colSku')}</th>
                <th>{t('products.colName')}</th>
                <th className="is-num">{t('stockReports.colQty')}</th>
                <th className="is-num">{t('stockReports.purchasePrice')}</th>
                <th className="is-num">{t('stockReports.salePrice')}</th>
                <th>{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {imp.usableRows.slice(0, 40).map((row) => (
                <tr key={row.rowNum}>
                  <td className="is-mono">{row.sku}</td>
                  <td>{row.name}</td>
                  <td className="is-num">{row.quantity ?? 0}</td>
                  <td className="is-num">
                    {fmtMoney(Number(row.costPrice) > 0 ? row.costPrice : row.fileSellingPrice)}
                  </td>
                  <td className="is-num">{fmtMoney(row.fileSellingPrice)}</td>
                  <td>
                    {row.status === 'NEW'
                      ? t('stockReports.linesImportStatusNew')
                      : t('stockReports.linesImportStatusExists')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {imp.usableRows.length > 40 ? (
            <p className="rst-rec-import__more">
              {t('stockReports.linesImportMore', { count: imp.usableRows.length - 40 })}
            </p>
          ) : null}
        </div>
      ) : null}
    </BaseModal>
  );
}
