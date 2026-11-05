import { useTranslation } from 'react-i18next';
import TablePagination from '../../../components/shared/TablePagination';
import PharmacyReceiptLineBulkBar from './PharmacyReceiptLineBulkBar';
import PharmacyReceiptMassEditBar from './PharmacyReceiptMassEditBar';
import PharmacyReceiptLineRowMenu from './PharmacyReceiptLineRowMenu';
import {
  PharmacySelectAllTh,
  PharmacySelectCell,
} from './PharmacyTableSelect';
import { formatMoney } from '../utils/pharmacyReceiptPricing';
import { linePurchaseSum, lineRetailSum } from '../utils/pharmacyReceiptTotals';
import { formatIsoToDisplay } from '../utils/smartExpiryInput';
import { productStubFromReceiptLine } from '../utils/productStubFromReceiptLine';
import { PHARM_PAGE_SIZES } from '../utils/pharmacyTablePage';

/** Таблица строк документа прихода + массовые действия. */
export default function PharmacyReceiptDocumentLinesPanel({
  receipt,
  canEditPrices,
  linesPage,
  linesSelect,
  revalue,
  mass,
  docTotals,
  deletingSelected,
  onAskDeleteSelected,
  onEditLine,
  onAskDeleteLine,
  onAboutProduct,
}) {
  const { t } = useTranslation();
  const lines = receipt?.lines ?? [];

  return (
    <div className="pharmacy-stock__panel flex min-h-0 flex-col">
      <div className="pharmacy-stock__panel-head">
        <span>{t('pharmacyStock.inDocument')}</span>
        <span>{lines.length}</span>
      </div>
      {canEditPrices ? (
        <PharmacyReceiptLineBulkBar
          t={t}
          selection={linesSelect}
          canRevalue={revalue.canOpen}
          onVat={revalue.openVat}
          onMarkup={revalue.openMarkup}
          deleting={deletingSelected}
          onDelete={onAskDeleteSelected}
        />
      ) : null}
      {canEditPrices ? <PharmacyReceiptMassEditBar t={t} mass={mass} /> : null}
      <div className="pharmacy-stock__table-wrap">
        <table className="pharmacy-stock__table">
          <thead>
            <tr>
              <PharmacySelectAllTh t={t} selection={linesSelect} disabled={!canEditPrices || !lines.length} />
              <th>№</th>
              <th>{t('pharmacyStock.colName')}</th>
              <th>{t('pharmacyStock.colManufacturer')}</th>
              <th>{t('pharmacyStock.colCountry')}</th>
              <th>{t('pharmacyStock.colQty')}</th>
              <th>{t('pharmacyStock.unitsInPack')}</th>
              <th>{t('pharmacyStock.purchasePrice')}</th>
              <th>{t('pharmacyStock.vatRate')}</th>
              <th>{t('pharmacyStock.markupPercent')}</th>
              <th>{t('pharmacyStock.retailPrice')}</th>
              <th>{t('pharmacyStock.colLinePurchase')}</th>
              <th>{t('pharmacyStock.colLineRetail')}</th>
              <th>{t('pharmacyStock.batch')}</th>
              <th>{t('pharmacyStock.expiry')}</th>
              <th className="pharmacy-stock__row-actions" />
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={16}>
                  <div className="pharmacy-stock__empty">{t('pharmacyStock.noLines')}</div>
                </td>
              </tr>
            ) : linesPage.rows.map((line, idx) => (
              <tr
                key={line.id}
                className={`${linesSelect.isSelected(line.id) ? 'pharmacy-stock__row--selected' : ''} pharmacy-stock__row--clickable`}
                onClick={() => onEditLine(line)}
              >
                <PharmacySelectCell t={t} row={line} selection={linesSelect} disabled={!canEditPrices} />
                <td>{linesPage.startIndex + idx + 1}</td>
                <td className="font-semibold">{line.productName}</td>
                <td>{line.manufacturer || '—'}</td>
                <td>{line.country || '—'}</td>
                <td>{line.quantity}</td>
                <td>{line.unitsInPack ?? '—'}</td>
                <td>{formatMoney(line.purchasePrice)}</td>
                <td>{line.vatPercent ?? '—'}</td>
                <td>{line.markupPercent ?? '—'}</td>
                <td>{formatMoney(line.retailPrice ?? line.unitSellingPrice)}</td>
                <td>{formatMoney(linePurchaseSum(line))}</td>
                <td>{formatMoney(lineRetailSum(line))}</td>
                <td>{line.batchNumber || '—'}</td>
                <td>{formatIsoToDisplay(line.expiryDate) || '—'}</td>
                <td className="pharmacy-stock__row-actions" onClick={(e) => e.stopPropagation()}>
                  <div className="pharmacy-stock__icon-row">
                    <PharmacyReceiptLineRowMenu
                      t={t}
                      onAboutProduct={() => onAboutProduct(productStubFromReceiptLine(line))}
                      onEdit={() => onEditLine(line)}
                      onDelete={canEditPrices ? () => onAskDeleteLine(line) : undefined}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {lines.length > 0 ? (
            <tfoot>
              <tr className="pharmacy-stock__totals-row">
                <td colSpan={11}>{t('pharmacyStock.invoiceTotal')}</td>
                <td>{formatMoney(docTotals.purchase)}</td>
                <td>{formatMoney(docTotals.retail)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
      <TablePagination
        page={linesPage.page}
        pageSize={linesPage.pageSize}
        total={linesPage.total}
        totalPages={linesPage.totalPages}
        onPageChange={linesPage.setPage}
        onPageSizeChange={linesPage.setPageSize}
        pageSizeOptions={PHARM_PAGE_SIZES}
      />
    </div>
  );
}
