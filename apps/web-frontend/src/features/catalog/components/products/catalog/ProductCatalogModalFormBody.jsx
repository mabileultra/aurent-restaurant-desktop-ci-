import TasnifSearchPanel from '../TasnifSearchPanel';
import ProductCatalogGeneralSection from './ProductCatalogGeneralSection';
import ProductCatalogAccountingSection from './ProductCatalogAccountingSection';
import ProductCatalogStorePricesSection from './ProductCatalogStorePricesSection';
import ProductCatalogBarcodesSection from './ProductCatalogBarcodesSection';
import ProductCatalogDynamicFieldsSection from './ProductCatalogDynamicFieldsSection';
import ProductCatalogFiscalSection from './ProductCatalogFiscalSection';
import ProductCatalogStoreContextSection from './ProductCatalogStoreContextSection';

const FISCAL_SECTIONS = [
  'fiscalExternalId',
  'fiscalIkpu',
  'fiscalUnitMeasure',
  'fiscalPackageCode',
];

export default function ProductCatalogModalFormBody({
  form,
  categories,
  stores,
  selectedStore,
  onCreateStoreChange,
}) {
  const showTasnifSearch = form.showSection('tasnifSearch');
  const showAnyFiscal = FISCAL_SECTIONS.some((key) => form.showSection(key));
  const showBarcodeBlock = form.showSection('barcodes')
    || form.showSection('pluField')
    || form.showSection('extraBarcodes');

  return (
    <>
      {!form.isEdit && selectedStore && onCreateStoreChange ? (
        <ProductCatalogStoreContextSection
          t={form.t}
          stores={stores}
          selectedStore={selectedStore}
          onStoreChange={onCreateStoreChange}
        />
      ) : null}

      {showTasnifSearch || showAnyFiscal ? (
        <div className="space-y-4">
          {showTasnifSearch ? (
            <TasnifSearchPanel setValue={form.setValue} getValues={form.getValues} isEdit={form.isEdit} />
          ) : null}
          {showAnyFiscal ? (
            <ProductCatalogFiscalSection
              t={form.t}
              register={form.register}
              errors={form.errors}
              showSection={form.showSection}
            />
          ) : null}
        </div>
      ) : null}

      <ProductCatalogGeneralSection
        t={form.t}
        register={form.register}
        errors={form.errors}
        categories={categories}
        isEdit={form.isEdit}
        saleTypeWatch={form.saleTypeWatch}
        productTypeWatch={form.productTypeWatch}
        unitCodeWatch={form.unitCodeWatch}
        ownerTypeWatch={form.ownerTypeWatch}
        taxRateWatch={form.taxRateWatch}
        categoryId={form.categoryId}
        setValue={form.setValue}
        showSection={form.showSection}
        configUnits={form.businessConfig?.units}
      />

      <ProductCatalogAccountingSection
        t={form.t}
        register={form.register}
        errors={form.errors}
        showSection={form.showSection}
        priceRules={form.priceRulesConfig}
        storePricesEnabled={form.showSection('storePrices')}
      />

      {form.showSection('storePrices') ? (
        <ProductCatalogStorePricesSection
          t={form.t}
          stores={stores}
          storeRows={form.storeRows}
          setStoreRows={form.setStoreRows}
          getValues={form.getValues}
          sellingPriceWatch={form.sellingPriceWatch}
        />
      ) : null}

      {form.showSection('dynamicFields') ? (
        <ProductCatalogDynamicFieldsSection
          t={form.t}
          register={form.register}
          errors={form.errors}
          fields={form.businessConfig?.fields ?? []}
          displayRules={form.displayRules}
          attributeValues={form.attributeValues}
          loading={form.businessConfigLoading}
        />
      ) : null}

      {showBarcodeBlock ? (
        <ProductCatalogBarcodesSection
          t={form.t}
          register={form.register}
          errors={form.errors}
          extraBarcodes={form.extraBarcodes}
          setExtraBarcodes={form.setExtraBarcodes}
          saleTypeWatch={form.saleTypeWatch}
          showSection={form.showSection}
        />
      ) : null}
    </>
  );
}
