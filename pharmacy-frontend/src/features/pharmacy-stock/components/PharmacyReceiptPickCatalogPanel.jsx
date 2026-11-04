import { BaseButton } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import PharmacyReceiptPickPanelHead from './PharmacyReceiptPickPanelHead';
import {
  PharmacyEditCell,
  PharmacySelectAllTh,
  PharmacySelectCell,
  PharmacySelectionBar,
} from './PharmacyTableSelect';
import {
  productCountry,
  productDosageForm,
  productManufacturer,
  productUnitsInPack,
} from '../utils/pharmacyReceiptPricing';
import { PHARM_PAGE_SIZES } from '../utils/pharmacyTablePage';
import '../styles/pharmacy-receipt-pick.css';

export default function PharmacyReceiptPickCatalogPanel({
  t,
  catalog,
  catalogTotal,
  catalogPage,
  catalogPageSize,
  catalogPages,
  loading,
  catalogSelect,
  productDelete,
  onPageChange,
  onPageSizeChange,
  onAddSelected,
  onAbout,
  onSelect,
}) {
  return (
    <div className="pharmacy-stock__panel flex min-h-0 flex-col">
      <PharmacyReceiptPickPanelHead
        title={t('pharmacyStock.pickFromCatalog')}
        hint={t('pharmacyStock.pickFromCatalogHint')}
        count={catalogTotal}
      />
      <PharmacySelectionBar t={t} selection={catalogSelect} flush>
        <BaseButton size="sm" disabled={!catalogSelect.selectedCount} onClick={onAddSelected}>
          {t('pharmacyStock.addSelected')}
        </BaseButton>
        <BaseButton
          size="sm"
          variant="danger"
          disabled={productDelete.deleting}
          onClick={() => productDelete.ask(catalogSelect.selectedRows)}
        >
          {t('pharmacyStock.deleteSelected')}
        </BaseButton>
      </PharmacySelectionBar>
      <div className="pharmacy-receipt-pick__table">
        <table className="pharmacy-stock__table">
          <thead>
            <tr>
              <PharmacySelectAllTh t={t} selection={catalogSelect} disabled={catalog.length === 0} />
              <th>№</th>
              <th>{t('pharmacyStock.colName')}</th>
              <th>{t('pharmacyStock.colManufacturer')}</th>
              <th>{t('pharmacyStock.colCountry')}</th>
              <th>{t('pharmacyStock.colForm')}</th>
              <th>{t('pharmacyStock.unitsInPack')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {catalog.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="pharmacy-stock__empty">
                    {loading ? t('common.loading') : t('pharmacyStock.catalogEmpty')}
                  </div>
                </td>
              </tr>
            ) : catalog.map((product, idx) => (
              <tr
                key={product.id}
                className={catalogSelect.isSelected(product.id) ? 'pharmacy-stock__row--selected' : undefined}
              >
                <PharmacySelectCell t={t} row={product} selection={catalogSelect} />
                <td>{catalogPage * catalogPageSize + idx + 1}</td>
                <td className="font-semibold">{product.name}</td>
                <td>{productManufacturer(product) || '—'}</td>
                <td>{productCountry(product) || '—'}</td>
                <td>{productDosageForm(product) || '—'}</td>
                <td>{productUnitsInPack(product) || 1}</td>
                <PharmacyEditCell
                  t={t}
                  onEdit={() => onAbout(product)}
                  onDelete={() => productDelete.ask(product)}
                >
                  <button
                    type="button"
                    className="pharmacy-receipt-pick__select"
                    onClick={() => onSelect(product)}
                  >
                    {t('pharmacyStock.select')}
                  </button>
                </PharmacyEditCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={catalogPage}
        pageSize={catalogPageSize}
        total={catalogTotal}
        totalPages={catalogPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={PHARM_PAGE_SIZES}
      />
    </div>
  );
}
