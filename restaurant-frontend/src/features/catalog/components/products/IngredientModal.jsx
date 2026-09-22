import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { BaseButton, BaseSelect } from '../../../../components/ui';
import { useIngredientModalForm } from '../../hooks/useIngredientModalForm';
import { useIngredientTasnifSearch } from '../../hooks/useIngredientTasnifSearch';
import { useIngredientCatalogSearch } from '../../hooks/useIngredientCatalogSearch';
import IngredientReceiptFields from './IngredientReceiptFields';
import IngredientStockFields from './IngredientStockFields';
import IngredientCatalogSearch from './IngredientCatalogSearch';
import IngredientTasnifSearch from './IngredientTasnifSearch';
import '../../styles/ingredient-modal.css';

export default function IngredientModal({
  open,
  product,
  categories = [],
  selectedStore,
  defaultProductType = 'MATERIAL',
  mode = 'catalog',
  onClose,
  onSaved,
}) {
  const f = useIngredientModalForm({
    open,
    product,
    selectedStore,
    defaultProductType,
    mode,
    onClose,
    onSaved,
  });

  const tasnif = useIngredientTasnifSearch({
    form: f.form,
    patchForm: f.patchForm,
    isEdit: f.isEdit,
  });

  const catalogSearch = useIngredientCatalogSearch({
    enabled: open && !f.isEdit,
    storeId: selectedStore?.id,
  });

  if (!open) return null;

  const title = f.isEdit
    ? f.t('rst.nomenclature.editTitle')
    : f.isReceipt
      ? f.t('rst.nomenclature.addFromReceiptTitle')
      : f.t('rst.nomenclature.addTitle');

  const submit = (e) => {
    e.preventDefault();
    f.validateAndSubmit();
  };

  const applyCatalogProduct = (p) => {
    if (!p) return;
    f.patchForm({
      name: p.name ?? '',
      categoryId: p.categoryId != null ? String(p.categoryId) : '',
      productType: p.productType === 'RETAIL' ? 'RETAIL' : 'MATERIAL',
      costPrice: String(p.costPrice ?? ''),
      sellingPrice: String(p.sellingPrice ?? p.costPrice ?? ''),
      saleType: p.saleType || 'PIECE',
      unitCode: p.unitCode || 'PCS',
      lowStockAlert: String(p.lowStockAlert ?? 10),
      barcode: p.barcode || '',
      ikpu: p.ikpu || '',
      packageCode: p.packageCode || '',
      unitOfMeasure: p.unitOfMeasure || 'pcs',
      sku: p.sku || '',
      stockQuantity: String(p.stockQuantity ?? 0),
      receiptQty: f.form.receiptQty || '1',
    });
    catalogSearch.clear();
    toast.success(f.t('rst.nomenclature.catalogSearchApplied', { name: p.name }));
  };

  return (
    <div className="rst-ingredient-modal">
      <button type="button" className="rst-ingredient-modal__backdrop" aria-label="Close" onClick={onClose} />
      <div
        className={`rst-ingredient-modal__panel${f.isReceipt ? ' is-receipt' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="rst-ingredient-modal__head">
          <h2>{title}</h2>
          <button type="button" className="rst-ingredient-modal__close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <form className="rst-ingredient-modal__form" onSubmit={submit}>
          {!f.isEdit ? (
            <IngredientCatalogSearch
              t={f.t}
              query={catalogSearch.query}
              onQueryChange={catalogSearch.setQuery}
              loading={catalogSearch.loading}
              results={catalogSearch.results}
              canSearch={catalogSearch.canSearch}
              onPick={applyCatalogProduct}
            />
          ) : null}

          <IngredientTasnifSearch
            t={tasnif.t}
            query={tasnif.query}
            onQueryChange={tasnif.setQuery}
            onSearch={tasnif.runSearch}
            loading={tasnif.loading}
            results={tasnif.results}
            error={tasnif.error}
            onPick={tasnif.pickItem}
            packageItem={tasnif.packageItem}
            lang={tasnif.lang}
            onPackageSelect={tasnif.handlePackageSelect}
            onPackageClose={tasnif.handlePackageClose}
          />

          <label className="rst-ingredient-modal__field">
            <span>{f.t('productModal.name')}</span>
            <input value={f.form.name} onChange={(e) => f.set('name', e.target.value)} required />
          </label>

          <div className="rst-ingredient-modal__row">
            <label className="rst-ingredient-modal__field">
              <span>{f.t('productCatalog.ikpu')}</span>
              <input
                value={f.form.ikpu}
                onChange={(e) => f.set('ikpu', e.target.value)}
                placeholder={f.t('productCatalog.ikpuHint')}
              />
            </label>
            <label className="rst-ingredient-modal__field">
              <span>{f.t('productModal.barcode')}</span>
              <input
                value={f.form.barcode}
                onChange={(e) => f.set('barcode', e.target.value)}
              />
            </label>
          </div>

          <BaseSelect
            label={f.t('rst.nomenclature.typeLabel')}
            value={f.form.productType}
            onChange={(e) => f.set('productType', e.target.value)}
            options={[
              { value: 'RETAIL', label: f.t('rst.nomenclature.typeProduct') },
              { value: 'MATERIAL', label: f.t('rst.nomenclature.typeIngredient') },
            ]}
          />

          <BaseSelect
            label={f.t('productModal.category')}
            value={f.form.categoryId}
            onChange={(e) => f.set('categoryId', e.target.value)}
            placeholder={f.t('productModal.noneCategory')}
            options={[
              { value: '', label: f.t('productModal.noneCategory') },
              ...categories.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
          />

          <div className="rst-ingredient-modal__row">
            <BaseSelect
              label={f.t('productCatalog.saleType')}
              value={f.form.saleType}
              onChange={(e) => f.set('saleType', e.target.value)}
              options={[
                { value: 'PIECE', label: f.t('productCatalog.salePiece') },
                { value: 'WEIGHT', label: f.t('productCatalog.saleWeight') },
              ]}
            />
            <BaseSelect
              label={f.t('productCatalog.unitLabel', { defaultValue: f.t('productCatalog.unitRequired') })}
              value={f.form.unitCode}
              onChange={(e) => f.set('unitCode', e.target.value)}
              options={f.unitOptions.length ? f.unitOptions : [{ value: 'PCS', label: 'шт' }]}
            />
          </div>

          {f.isReceipt && !f.isEdit ? (
            <IngredientReceiptFields t={f.t} form={f.form} onChange={f.set} />
          ) : (
            <>
              <div className="rst-ingredient-modal__row">
                <label className="rst-ingredient-modal__field">
                  <span>{f.t('productModal.cost')}</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={f.form.costPrice}
                    onChange={(e) => f.set('costPrice', e.target.value)}
                  />
                </label>
                <label className="rst-ingredient-modal__field">
                  <span>{f.t('products.colPrice')}</span>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={f.form.sellingPrice}
                    onChange={(e) => f.set('sellingPrice', e.target.value)}
                  />
                </label>
              </div>
              <IngredientStockFields
                t={f.t}
                form={f.form}
                onChange={f.set}
                isEdit={f.isEdit}
              />
            </>
          )}

          {f.isEdit ? (
            <label className="rst-ingredient-modal__check">
              <input
                type="checkbox"
                checked={f.form.active}
                onChange={(e) => f.set('active', e.target.checked)}
              />
              <span>{f.t('common.active', { defaultValue: 'Активен' })}</span>
            </label>
          ) : null}

          <div className="rst-ingredient-modal__actions">
            <BaseButton type="button" variant="secondary" onClick={onClose}>
              {f.t('common.cancel')}
            </BaseButton>
            <BaseButton type="submit" disabled={f.mutation.isPending}>
              {f.mutation.isPending
                ? f.t('common.saving')
                : f.isEdit
                  ? f.t('productModal.saveChanges')
                  : f.t('productModal.create')}
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  );
}
