import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { productApi } from '../../../api';
import { buildEditableRows, isRowNew } from '../../../utils/productImportUtils';

export function useProductImportExecution({
  mode,
  source,
  defaultCategoryId,
  defaultStoreId,
  defaultStorageLocation,
  supplierId,
  paymentType,
  receiptNotes,
  markupPercent,
  setPreview,
  setEditable,
  setTasnifByRow,
  setTasnifFilter,
  setPage,
  setStep,
  runTasnifVerify,
  onClose,
  t,
}) {
  const [importing, setImporting] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const fileRef = useRef(null);

  const pickFile = () => fileRef.current?.click();

  const previewOptions = () => ({
    defaultStorageLocation: defaultStorageLocation.trim() || undefined,
  });

  const loadPreview = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await productApi.importPreview(fd, source, previewOptions());
    setPreview(data);
    setEditable(buildEditableRows(data?.rows ?? [], markupPercent));
    setTasnifByRow({});
    setTasnifFilter('all');
    setPage(1);
    setStep('preview');
    void runTasnifVerify(data?.rows ?? []);
    return data;
  };

  const refreshPreview = async () => {
    if (!pendingFile) return;
    try {
      await loadPreview(pendingFile);
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('products.import.failed'));
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    try {
      await loadPreview(file);
    } catch (err) {
      const msg =
        err.response?.data?.message
        ?? err.response?.data?.errors?.file
        ?? t('products.import.failed');
      toast.error(msg, { duration: 6000 });
    }
    e.target.value = '';
  };

  const runImport = async ({ rows, editable, canImport }) => {
    if (!pendingFile) return;
    if (canImport && mode === 'AS_RECEIPT' && !defaultStoreId) {
      toast.error(t('products.import.storeRequiredReceipt'));
      return;
    }
    if (canImport && mode === 'AS_RECEIPT' && paymentType === 'CREDIT' && !supplierId) {
      toast.error(t('stockReports.receiptCreditNeedsSupplier'));
      return;
    }
    setImporting(true);
    const fd = new FormData();
    fd.append('file', pendingFile);

    const rowOverrides = rows
      .filter((r) => isRowNew(r) && editable[r.rowNum])
      .map((r) => {
        const ed = editable[r.rowNum];
        const payload = { rowNum: r.rowNum, sellingPrice: Number(ed.importPrice) };
        const catId = ed.categoryId || defaultCategoryId;
        if (catId) payload.categoryId = Number(catId);
        const storeId = ed.storeId || defaultStoreId;
        if (storeId) payload.storeId = Number(storeId);
        const loc = (ed.storageLocation || defaultStorageLocation || '').trim();
        if (loc) payload.storageLocation = loc;
        if (ed.ikpu != null) payload.ikpu = String(ed.ikpu).trim();
        if (ed.barcode != null) payload.barcode = String(ed.barcode).trim();
        if (ed.packageCode) payload.packageCode = String(ed.packageCode).trim();
        if (ed.markedProduct != null) payload.markedProduct = Boolean(ed.markedProduct);
        if (ed.ikpuStatus) payload.ikpuStatus = String(ed.ikpuStatus).trim();
        const qty = Number(ed.quantity);
        if (Number.isFinite(qty) && qty >= 0) payload.quantity = qty;
        return payload;
      });

    const options = {
      strategy: mode,
      source,
      skipDuplicates: true,
      defaultCategoryId: defaultCategoryId ? Number(defaultCategoryId) : null,
      defaultStoreId: defaultStoreId ? Number(defaultStoreId) : null,
      defaultStorageLocation: defaultStorageLocation.trim() || null,
      supplierId: mode === 'AS_RECEIPT' && supplierId ? supplierId : null,
      paymentType: mode === 'AS_RECEIPT' ? paymentType : null,
      receiptNotes: mode === 'AS_RECEIPT' && receiptNotes.trim() ? receiptNotes.trim() : null,
      rows: rowOverrides,
    };

    try {
      const { data } = await productApi.importUpload(fd, options);
      const created = data?.created ?? 0;
      const skipped = data?.skipped ?? 0;
      const errs = Array.isArray(data?.errors) ? data.errors : [];

      if (created > 0) {
        const receiptNo = data?.receiptNumber;
        if (mode === 'AS_RECEIPT' && !receiptNo) {
          toast.error(t('products.import.receiptMissingAfterImport', { created }), { duration: 7000 });
          errs.slice(0, 5).forEach((line) => toast(line, { icon: '⚠️' }));
        } else {
          const msg = receiptNo
            ? t('products.import.receiptDone', { no: receiptNo })
            : skipped > 0
              ? t('products.import.importPartial', { created, skipped })
              : `${t('products.import.done')} · ${t('products.import.created')}: ${created}`;
          toast.success(msg);
          if (errs.length) {
            errs.slice(0, 3).forEach((line) => toast(line, { icon: '⚠️' }));
          }
          onClose();
        }
      } else if (skipped > 0 && errs.length === 0) {
        toast(t('products.import.importOnlySkipped', { skipped }), { icon: 'ℹ️', duration: 5000 });
        try {
          await loadPreview(pendingFile);
        } catch {
          /* preview refresh optional */
        }
      } else {
        toast.error(
          errs[0] ?? data?.message ?? t('products.import.importNothingCreated'),
          { duration: 6000 }
        );
        errs.slice(1, 5).forEach((line) => toast(line, { icon: '⚠️' }));
        if (errs.length > 5) {
          toast(t('products.import.moreErrors', { count: errs.length - 5 }));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('products.import.failed'));
    } finally {
      setImporting(false);
    }
  };

  return {
    importing,
    pendingFile,
    fileRef,
    pickFile,
    loadPreview,
    refreshPreview,
    onFile,
    runImport,
  };
}
