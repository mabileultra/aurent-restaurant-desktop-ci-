import { BaseSelect, PageSearchField } from '../../../../components/ui';
import ReportDateBar from '../../../../components/shared/ReportDateBar';
import ReportStoreSelect from '../ReportStoreSelect';

export default function ProductSalesReportFilters({
  t,
  from,
  to,
  onFrom,
  onTo,
  search,
  onSearchChange,
  stores,
  storeId,
  onStoreChange,
  categoryId,
  onCategoryChange,
  categories,
}) {
  return (
    <>
      <ReportDateBar from={from} to={to} onFrom={onFrom} onTo={onTo} />
      <div className="flex flex-wrap gap-3">
        <PageSearchField
          className="min-w-[12rem]"
          value={search}
          onChange={onSearchChange}
          placeholder={t('common.search')}
        />
        <ReportStoreSelect stores={stores} value={storeId} onChange={onStoreChange} />
        <BaseSelect
          value={categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-auto min-w-[10rem]"
          placeholder={t('stockReports.allCategories')}
          options={[
            { value: '', label: t('stockReports.allCategories') },
            ...categories.map((c) => ({ value: String(c.id), label: c.name })),
          ]}
        />
      </div>
    </>
  );
}
