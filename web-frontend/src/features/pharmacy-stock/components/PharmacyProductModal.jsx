import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyWarehouseApi, tasnifApi } from '../../../api';
import { BaseButton, BaseModal } from '../../../components/ui';
import {
  buildPharmacyProductCreatePayload,
  buildPharmacyProductUpdatePayload,
  emptyPharmacyProductForm,
  formFromPharmacyProduct,
  validatePharmacyProductForm,
} from '../utils/buildPharmacyProductPayload';
import { generatePharmacyBarcode } from '../utils/generatePharmacyBarcode';
import { applyMxikFlags } from '../utils/inferPharmacyMxikFlags';
import { usePharmacyReceiptLineForm } from '../hooks/usePharmacyReceiptLineForm';
import PharmacyReceiptLineFields from './PharmacyReceiptLineFields';
import PharmacyProductAboutFields from './PharmacyProductAboutFields';
import '../styles/pharmacy-stock.css';

/** Модалка «Товар | Новый»: карточка + поля прихода (кол-во / цены / серия / срок). */
export default function PharmacyProductModal({
  open,
  onClose,
  onSaved,
  storeId = null,
  product = null,
  overlayClassName,
  withReceiptLine = false,
  defaultMarkup = 20,
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyPharmacyProductForm);
  const [mxikQuery, setMxikQuery] = useState('');
  const [mxikResults, setMxikResults] = useState([]);
  const [mxikLoading, setMxikLoading] = useState(false);
  const [loadedProduct, setLoadedProduct] = useState(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  const isEdit = Boolean(product?.id);
  const includeLine = withReceiptLine && !isEdit;
  const line = usePharmacyReceiptLineForm({
    open: open && includeLine,
    product: null,
    defaultMarkup,
  });

  useEffect(() => {
    if (!open) return;
    setMxikResults([]);
    setAboutOpen(false);
    if (!product?.id) {
      setForm(emptyPharmacyProductForm());
      setMxikQuery('');
      setLoadedProduct(null);
      return;
    }
    setForm(formFromPharmacyProduct(product));
    setMxikQuery(product.ikpu || '');
    setLoadedProduct(product);
    pharmacyWarehouseApi.getProduct(product.id)
      .then((res) => {
        const full = res.data;
        setLoadedProduct(full);
        setForm(formFromPharmacyProduct(full));
        setMxikQuery(full?.ikpu || '');
      })
      .catch(() => {});
  }, [open, product]);

  useEffect(() => {
    if (!open || !includeLine) return;
    line.syncUnitsInPack(form.unitsInPack);
  }, [open, includeLine, form.unitsInPack]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const productErr = validatePharmacyProductForm(form, t);
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
      const flaggedForm = isEdit ? form : await resolveMxikFlagsOnSave(form);
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

  const searchMxik = async () => {
    const q = (mxikQuery || form.ikpu || '').trim();
    if (q.length < 2) {
      toast.error(t('pharmacyStock.mxikQueryShort'));
      return;
    }
    setMxikLoading(true);
    try {
      const res = await tasnifApi.search({ q, lang: 'ru', page: 0, size: 15 });
      const list = res.data?.items ?? res.data?.content ?? [];
      setMxikResults(Array.isArray(list) ? list : []);
      if (!list?.length) {
        toast.error(t('pharmacyStock.mxikSearchFailed'));
        return;
      }
      const qNorm = q.replace(/\s/g, '');
      const exact = list.find((item) => {
        const code = String(item?.mxik || item?.code || item?.ikpu || '').replace(/\s/g, '');
        return code && code === qNorm;
      });
      if (exact || list.length === 1) {
        pickMxik(exact || list[0]);
      }
    } catch {
      setMxikResults([]);
      toast.error(t('pharmacyStock.mxikSearchFailed'));
    } finally {
      setMxikLoading(false);
    }
  };

  const pickMxik = (item) => {
    const mxik = item?.mxik || item?.code || item?.ikpu || '';
    const name = item?.name || item?.title || '';
    const barcode = item?.barcode || item?.internalCode || '';
    setForm((prev) => {
      const next = {
        ...prev,
        ikpu: mxik,
        ikpuStatus: 'FOUND',
        name: prev.name.trim() ? prev.name : (name || prev.name),
        barcode: prev.barcode.trim()
          ? prev.barcode
          : (barcode && String(barcode).length >= 8 ? String(barcode) : prev.barcode),
        manufacturer: prev.manufacturer.trim()
          ? prev.manufacturer
          : (item?.manufacturer || item?.brand || prev.manufacturer),
        dosageForm: prev.dosageForm.trim()
          ? prev.dosageForm
          : (item?.packageName || item?.unitName || item?.packages?.[0]?.nameRu || prev.dosageForm),
      };
      return applyMxikFlags(next, item);
    });
    setMxikResults([]);
    setMxikQuery(mxik);
    toast.success(t('pharmacyStock.mxikApplied'));
  };

  const handleSave = () => {
    if (includeLine) {
      const productErr = validatePharmacyProductForm(form, t);
      if (productErr) {
        toast.error(productErr);
        setAboutOpen(true);
        return;
      }
    }
    saveMutation.mutate();
  };

  const aboutFields = (
    <PharmacyProductAboutFields
      t={t}
      form={form}
      patch={patch}
      mxikQuery={mxikQuery}
      setMxikQuery={setMxikQuery}
      mxikResults={mxikResults}
      mxikLoading={mxikLoading}
      onSearchMxik={searchMxik}
      onPickMxik={pickMxik}
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
          <div className="flex w-full justify-center">
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
