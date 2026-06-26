import TasnifSearchPanel from '../TasnifSearchPanel';
import ProductCatalogGeneralSection from './ProductCatalogGeneralSection';
import ProductCatalogAccountingSection from './ProductCatalogAccountingSection';
import ProductCatalogStorePricesSection from './ProductCatalogStorePricesSection';
import ProductCatalogBarcodesSection from './ProductCatalogBarcodesSection';
import ProductCatalogDynamicFieldsSection from './ProductCatalogDynamicFieldsSection';
import ProductCatalogFiscalSection from './ProductCatalogFiscalSection';
import ProductCatalogStoreContextSection from './ProductCatalogStoreContextSection';

export default function ProductCatalogModalFormBody({
  form,
  categories,
  stores,
  selectedStore,
  onCreateStoreChange,
}) {
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

      {form.showSection('tasnif') ? (
        <div className="space-y-4">
          <TasnifSearchPanel setValue={form.setValue} getValues={form.getValues} isEdit={form.isEdit} />
          <ProductCatalogFiscalSection
            t={form.t}
            register={form.register}
            errors={form.errors}
          />
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
        showSection={form.showSection}
        configUnits={form.businessConfig?.units}
      />

      <ProductCatalogAccountingSection
        t={form.t}
        register={form.register}
        errors={form.errors}
        showSection={form.showSection}
        priceRules={form.priceRulesConfig}
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

      <ProductCatalogDynamicFieldsSection
        t={form.t}
        register={form.register}
        errors={form.errors}
        fields={form.businessConfig?.fields ?? []}
        displayRules={form.displayRules}
        attributeValues={form.attributeValues}
        loading={form.businessConfigLoading}
      />

      {form.showSection('barcodes') ? (
        <ProductCatalogBarcodesSection
          t={form.t}
          register={form.register}
          errors={form.errors}
          extraBarcodes={form.extraBarcodes}
          setExtraBarcodes={form.setExtraBarcodes}
        />
      ) : null}
    </>
  );
}
