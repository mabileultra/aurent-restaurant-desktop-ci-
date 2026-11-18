import React from 'react';
import { BaseSelect } from '../../../components/ui';
import { ProductLookupSelect } from '../../../components/product-lookup';
import { formatQty } from '../../../utils/quantityFormat';
import WarehouseReceiveQtyField from './WarehouseReceiveQtyField';

export const inputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  dark:border-slate-700 dark:bg-slate-800 dark:text-white`;

export const labelCls = 'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400';

export default function WarehouseReceiveFormFields({ form, t }) {
  const {
    productId,
    setProductId,
    quantity,
    setQuantity,
    unitPrice,
    setUnitPrice,
    purchasePrice,
    setPurchasePrice,
    vat,
    setVat,
    marked,
    setMarked,
    storageLocation,
    setStorageLocation,
    storeId,
    setStoreId,
    stores,
    needsStorePick,
    effectiveStoreId,
    lockedProduct,
    selectedProduct,
    unitCode,
    saleType,
    unitConfig,
    currentStock,
    afterStock,
  } = form;

  return (
    <>
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
        {t('stockModule.modal.sharedHint')}
      </p>

      {productId ? (
        <p className="text-xs text-emerald-700 dark:text-emerald-400">
          {t('stockModule.modal.currentStock', {
            qty: formatQty(currentStock, saleType, unitCode),
          })}
          {afterStock != null && (
            <span className="ml-2 text-slate-600 dark:text-slate-400">
              {t('stockModule.modal.afterReceive', {
                qty: formatQty(afterStock, saleType, unitCode),
              })}
            </span>
          )}
        </p>
      ) : null}

      {needsStorePick ? (
        <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-start">
          <BaseSelect
            className="sm:col-span-2"
            label={t('stockReports.colStore')}
            required
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            placeholder={t('stockModal.pickStore')}
            options={[
              { value: '', label: t('stockModal.pickStore') },
              ...stores.map((s) => ({ value: String(s.id), label: s.name })),
            ]}
          />
        </div>
      ) : null}

      <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-start">
        <div className="sm:col-span-2">
          <ProductLookupSelect
            label={t('stockModule.modal.product')}
            required
            value={productId}
            storeId={effectiveStoreId}
            disabled={lockedProduct || (needsStorePick && !effectiveStoreId)}
            placeholder={t('stockModule.modal.productPh')}
            onChange={(e) => setProductId(e.target.value)}
            onProductSelect={(product) => {
              if (product) setProductId(String(product.id));
              else setProductId('');
            }}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('stockModule.modal.productHint')}</p>
        </div>
      </div>

      <WarehouseReceiveQtyField
        quantity={quantity}
        setQuantity={setQuantity}
        selectedProduct={selectedProduct}
        unitCode={unitCode}
        unitConfig={unitConfig}
        t={t}
      />

      <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
        <label className={labelCls}>
          <span className="text-red-600">*</span> {t('stockModule.modal.unitPrice')}
        </label>
        <div className="relative">
          <input
            className={`${inputCls} pr-14`}
            inputMode="decimal"
            placeholder={t('stockModule.modal.unitPricePh')}
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
            {t('stockModule.modal.currency')}
          </span>
        </div>
      </div>

      <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
        <BaseSelect
          className="sm:col-span-2"
          label={t('stockModule.modal.vat')}
          value={vat}
          onChange={(e) => setVat(e.target.value)}
          placeholder={t('stockModule.modal.vatUnset')}
          options={[
            { value: '', label: t('stockModule.modal.vatUnset') },
            { value: '0', label: t('stockModule.modal.vat0') },
            { value: '12', label: t('stockModule.modal.vat12') },
          ]}
        />
      </div>

      <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
        <label className={labelCls}>
          <span className="text-red-600">*</span> {t('stockModule.modal.purchase')}
        </label>
        <div className="relative">
          <input
            className={`${inputCls} pr-14`}
            inputMode="decimal"
            placeholder={t('stockModule.modal.purchasePh')}
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
            {t('stockModule.modal.currency')}
          </span>
        </div>
      </div>

      <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
        <label className={labelCls}>{t('stockModule.modal.location')}</label>
        <input
          className={inputCls}
          value={storageLocation}
          onChange={(e) => setStorageLocation(e.target.value)}
          placeholder={t('stockModule.modal.locationPh')}
        />
      </div>

      <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
        <label className={labelCls}>{t('stockModule.modal.marking')}</label>
        <button
          type="button"
          role="switch"
          aria-checked={marked}
          onClick={() => setMarked((v) => !v)}
          className={`relative h-8 w-14 rounded-full transition-colors ${marked ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${marked ? 'left-7' : 'left-1'}`}
          />
        </button>
      </div>
    </>
  );
}
