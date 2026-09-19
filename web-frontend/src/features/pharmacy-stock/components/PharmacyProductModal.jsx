import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyWarehouseApi, tasnifApi } from '../../../api';
import { BaseButton, BaseModal } from '../../../components/ui';
import TasnifPackagePickerModal from '../../../components/tasnif/TasnifPackagePickerModal';
import {
  buildPharmacyProductCreatePayload,
  buildPharmacyProductUpdatePayload,
  emptyPharmacyProductForm,
  formFromPharmacyProduct,
  validatePharmacyProductForm,
} from '../utils/buildPharmacyProductPayload';
import { generatePharmacyBarcode } from '../utils/generatePharmacyBarcode';
import { applyMxikFlags } from '../utils/inferPharmacyMxikFlags';
import { usePharmacyMxikPick } from '../hooks/usePharmacyMxikPick';
import { usePharmacyReceiptLineForm } from '../hooks/usePharmacyReceiptLineForm';
import { isRealFiscalPackageCode } from '../../../services/multikassa/resolveFiscalPackageCodes';
import PharmacyReceiptLineFields from './PharmacyReceiptLineFields';
import PharmacyProductAboutFields from './PharmacyProductAboutFields';
import '../styles/pharmacy-stock.css';

/** Модалка «Товар | Новый»: карточка + поля прихода (кол-во / цены / серия / срок). */
export default function PharmacyProductModal({
  open,
  onClose,
  onSaved,
  onDelete,
  storeId = null,
  product = null,
  overlayClassName,
  withReceiptLine = false,
  defaultMarkup = 20,
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyPharmacyProductForm);
  const [loadedProduct, setLoadedProduct] = useState(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const mxik = usePharmacyMxikPick(setForm);

  const isEdit = Boolean(product?.id);
  const includeLine = withReceiptLine && !isEdit;
  const line = usePharmacyReceiptLineForm({
    open: open && includeLine,
    product: null,
    defaultMarkup,
  });

  useEffect(() => {
    if (!open) return;
    setAboutOpen(false);
    if (!product?.id) {
      setForm(emptyPharmacyProductForm());
      mxik.resetMxik('');
      setLoadedProduct(null);
      return;
    }
    setForm(formFromPharmacyProduct(product));
    mxik.resetMxik(product.ikpu || '');
    setLoadedProduct(product);
    pharmacyWarehouseApi.getProduct(product.id)
      .then((res) => {
        const full = res.data;
        setLoadedProduct(full);
        setForm(formFromPharmacyProduct(full));
        mxik.resetMxik(full?.ikpu || '');
      })
      .catch(() => {});
  }, [open, product]);

  useEffect(() => {
    if (!open || !includeLine) return;
    line.syncUnitsInPack(form.unitsInPack);
  }, [open, includeLine, form.unitsInPack]);

  const saveMutation = useMutation({
    mutationFn: async (packageOverride) => {
      const current = packageOverride
        ? { ...form, packageCode: packageOverride.code, packageName: packageOverride.name }
        : form;
      const productErr = validatePharmacyProductForm(current, t);
      if (productErr) throw new Error(productErr);
      let linePayload = null;
      if (includeLine) {
        const lineResult = line.buildPayload(t);
        if (lineResult.error) throw new Error(lineResult.error);
        linePayload = lineResult.payload;
      }
      const prices = linePayload ? {
        costPrice: linePayload.purchasePrice,
        sellingPrice: linePayload.retailPrice,
        taxRate: linePayload.vatPercent,
      } : undefined;
      const flaggedForm = isEdit ? current : await resolveMxikFlagsOnSave(current);
      const body = isEdit
        ? buildPharmacyProductUpdatePayload(flaggedForm, loadedProduct || product)
        : buildPharmacyProductCreatePayload(flaggedForm, { storeId, prices });
      const res = isEdit
        ? await pharmacyWarehouseApi.updateProduct(product.id, body)
        : await pharmacyWarehouseApi.createProduct(body);
      return { product: res.data, linePayload };
    },
    onSuccess: ({ product: saved, linePayload }) => {
      toast.success(isEdit ? t('pharmacyStock.productUpdated') : t('pharmacyStock.productCreated'));
      onSaved?.(saved, linePayload);
      onClose?.();
    },
    onError: (e) => toast.error(
      e.response?.data?.message ?? e.message ?? t('pharmacyStock.saveFailed'),
    ),
  });

  if (!open) return null;

  const patch = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  /** Как в Oson: «Создать» генерирует штрихкод в основное поле (или доп., если основное занято). */
  const createBarcode = () => {
    const code = generatePharmacyBarcode();
    setForm((prev) => {
      if (!String(prev.barcode || '').trim()) {
        return { ...prev, barcode: code };
      }
      return {
        ...prev,
        additionalBarcodes: [...(prev.additionalBarcodes || []), code],
      };
    });
    toast.success(t('pharmacyStock.barcodeGenerated'));
  };

  const handleSave = async () => {
    if (includeLine) {
      const productErr = validatePharmacyProductForm(form, t);
      if (productErr) {
        toast.error(productErr);
        setAboutOpen(true);
        return;
      }
    }
    let packageOverride = null;
    if (String(form.ikpu || '').trim() && !isRealFiscalPackageCode(form.packageCode)) {
      packageOverride = await mxik.choosePackage(form.ikpu);
      if (!packageOverride?.code) {
        toast.error(t('pharmacyStock.packageRequired'));
        setAboutOpen(true);
        return;
      }
    }
    saveMutation.mutate(packageOverride);
  };

  const aboutFields = (
    <PharmacyProductAboutFields
      t={t}
      form={form}
      patch={patch}
      mxikQuery={mxik.mxikQuery}
      setMxikQuery={mxik.setMxikQuery}
      mxikResults={mxik.mxikResults}
      mxikLoading={mxik.mxikLoading}
      onSearchMxik={() => mxik.searchMxik(form.ikpu)}
      onPickMxik={mxik.pickMxik}
      onChoosePackage={mxik.choosePackage}
      onCreateBarcode={createBarcode}
      showActive={isEdit}
    />
  );

  return (
    <>
      <BaseModal
        open={open}
        onClose={onClose}
        title={
          isEdit
            ? t('pharmacyStock.productModalEditTitle')
            : includeLine
              ? t('pharmacyStock.lineModalTitle')
              : t('pharmacyStock.productModalTitle')
        }
        size={includeLine ? 'sm' : 'md'}
        className={`pharmacy-stock ${includeLine ? 'pharm-line-modal' : 'pharm-product-modal'}`}
        bodyClassName={includeLine ? 'pharm-line-modal__body' : 'pharm-product-modal__body'}
        overlayClassName={overlayClassName}
        footerClassName={includeLine ? 'pharm-line-modal__footer-bar' : undefined}
        footer={includeLine ? (
          <>
            <button
              type="button"
              className="pharm-line-btn pharm-line-btn--primary"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? t('common.saving') : t('common.save')}
            </button>
            <button
              type="button"
              className="pharm-line-btn"
              onClick={() => setAboutOpen(true)}
              disabled={saveMutation.isPending}
            >
              {t('pharmacyStock.aboutProduct')}
            </button>
            <button
              type="button"
              className="pharm-line-btn"
              onClick={onClose}
              disabled={saveMutation.isPending}
            >
              {t('common.cancel')}
            </button>
          </>
        ) : isEdit ? (
          <div className="pharm-product-modal__footer pharm-product-modal__footer--edit">
            {onDelete ? (
              <BaseButton
                variant="danger"
                className="pharm-product-modal__btn-danger"
                onClick={onDelete}
                disabled={saveMutation.isPending}
              >
                {t('pharmacyStock.deleteProduct')}
              </BaseButton>
            ) : <span />}
            <BaseButton
              className="pharm-product-modal__btn-primary min-w-[180px]"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? t('common.saving') : t('common.save')}
            </BaseButton>
          </div>
        ) : (
          <div className="pharm-product-modal__footer">
            <BaseButton
              variant="secondary"
              className="pharm-product-modal__btn-outline"
              onClick={onClose}
              disabled={saveMutation.isPending}
            >
              {t('common.cancel')}
            </BaseButton>
            <BaseButton
              className="pharm-product-modal__btn-primary"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? t('common.saving') : t('common.save')}
            </BaseButton>
          </div>
        )}
      >
        {includeLine
          ? <PharmacyReceiptLineFields t={t} line={line} productName={form.name} />
          : aboutFields}
      </BaseModal>
      {includeLine && aboutOpen ? (
        <BaseModal
          open={aboutOpen}
          onClose={() => setAboutOpen(false)}
          title={t('pharmacyStock.productModalEditTitle')}
          size="md"
          overlayClassName="!z-[70]"
          className="pharmacy-stock pharm-product-modal"
          bodyClassName="pharm-product-modal__body"
          footer={(
            <div className="flex w-full justify-center">
              <button
                type="button"
                className="pharm-line-btn pharm-line-btn--primary"
                style={{ minWidth: '11rem' }}
                onClick={() => setAboutOpen(false)}
              >
                {t('common.save')}
              </button>
            </div>
          )}
        >
          {aboutFields}
        </BaseModal>
      ) : null}
      <TasnifPackagePickerModal
        open={Boolean(mxik.packageItem)}
        item={mxik.packageItem}
        lang={mxik.lang}
        onSelect={mxik.handlePackageSelect}
        onClose={mxik.closePackagePicker}
      />
    </>
  );
}

async function resolveMxikFlagsOnSave(form) {
  const ikpu = String(form.ikpu || '').trim();
  if (ikpu.length < 10) return form;
  try {
    const res = await tasnifApi.search({ q: ikpu, lang: 'ru', page: 0, size: 1 });
    const item = (res.data?.items ?? res.data?.content ?? [])[0];
    const code = String(item?.mxik || item?.code || item?.ikpu || '').trim();
    if (!item || (code && code !== ikpu && !code.startsWith(ikpu) && !ikpu.startsWith(code))) {
      return form;
    }
    return applyMxikFlags(form, item);
  } catch {
    return form;
  }
}
