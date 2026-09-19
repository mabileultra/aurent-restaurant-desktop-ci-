import TablePagination from '../../../components/shared/TablePagination';
import PharmacyReceiptLineBulkBar from './PharmacyReceiptLineBulkBar';
import PharmacyReceiptMassEditBar from './PharmacyReceiptMassEditBar';
import PharmacyReceiptPickPanelHead from './PharmacyReceiptPickPanelHead';
import {
  PharmacyEditCell,
  PharmacySelectAllTh,
  PharmacySelectCell,
} from './PharmacyTableSelect';
import { formatMoney } from '../utils/pharmacyReceiptPricing';
import { PHARM_PAGE_SIZES } from '../utils/pharmacyTablePage';
import '../styles/pharmacy-receipt-pick.css';

export default function PharmacyReceiptPickLinesPanel({
  t,
  docLines,
  linesPage,
  linesSelect,
  revalue,
  mass,
  isDraft,
  deleting,
  onDeleteSelected,
  onEditLine,
}) {
  return (
    <div className="pharmacy-stock__panel flex min-h-0 flex-col">
      <PharmacyReceiptPickPanelHead
        title={t('pharmacyStock.pickAddedTitle')}
        hint={t('pharmacyStock.pickAddedHint')}
        count={docLines.length}
      />
      <PharmacyReceiptLineBulkBar
        t={t}
        selection={linesSelect}
        canRevalue={revalue.canOpen}
        onVat={revalue.openVat}
        onMarkup={revalue.openMarkup}
        deleting={deleting}
        onDelete={onDeleteSelected}
      />
      {isDraft ? <PharmacyReceiptMassEditBar t={t} mass={mass} /> : null}
      <div className="pharmacy-stock__table-wrap min-h-0 flex-1">
        <table className="pharmacy-stock__table">
          <thead>
            <tr>
              <PharmacySelectAllTh t={t} selection={linesSelect} disabled={docLines.length === 0} />
              <th>№</th>
              <th>{t('pharmacyStock.colName')}</th>
              <th>{t('pharmacyStock.colManufacturer')}</th>
              <th>{t('pharmacyStock.colCountry')}</th>
              <th>{t('pharmacyStock.colQty')}</th>
              <th>{t('pharmacyStock.purchasePrice')}</th>
              <th>{t('pharmacyStock.vatRate')}</th>
              <th>{t('pharmacyStock.markupPercent')}</th>
              <th>{t('pharmacyStock.colPurchaseSum')}</th>
              <th>{t('pharmacyStock.colRetailSum')}</th>
              <th>{t('pharmacyStock.batch')}</th>
              <th>{t('pharmacyStock.expiry')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {docLines.length === 0 ? (
              <tr>
                <td colSpan={14}>
                  <div className="pharmacy-stock__empty">{t('pharmacyStock.pickAddedEmpty')}</div>
                </td>
              </tr>
            ) : linesPage.rows.map((line, idx) => {
              const qty = Number(line.quantity) || 0;
              const purchase = Number(line.purchasePriceWithVat ?? line.purchasePrice) || 0;
              const retail = Number(line.retailPrice ?? line.unitSellingPrice) || 0;
              return (
                <tr
                  key={line.id}
                  className={linesSelect.isSelected(line.id) ? 'pharmacy-stock__row--selected' : undefined}
                >
                  <PharmacySelectCell t={t} row={line} selection={linesSelect} />
                  <td>{linesPage.startIndex + idx + 1}</td>
                  <td>{line.productName}</td>
                  <td>{line.manufacturer || '—'}</td>
                  <td>{line.country || '—'}</td>
                  <td>{line.quantity}</td>
                  <td>{formatMoney(line.purchasePrice)}</td>
                  <td>{line.vatPercent ?? '—'}</td>
                  <td>{line.markupPercent ?? '—'}</td>
                  <td>{formatMoney(purchase * qty)}</td>
                  <td>{formatMoney(retail * qty)}</td>
                  <td>{line.batchNumber || '—'}</td>
                  <td>{line.expiryDate || '—'}</td>
                  <PharmacyEditCell t={t} onEdit={() => onEditLine(line)} />
                </tr>
              );
            })}
          </tbody>
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
