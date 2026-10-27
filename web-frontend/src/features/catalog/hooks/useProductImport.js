import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { productApi } from '../../../api';
import { classifyProductImportTasnif } from '../utils/classifyProductImportTasnif';
import {
  loadProductImportColumnVisibility,
  saveProductImportColumnVisibility,
} from '../utils/productImportColumns';
import {
  PRODUCT_IMPORT_DEFAULT_PAGE_SIZE,
  sliceImportPage,
} from '../utils/productImportPagination';
import { verifyProductImportRowsTasnif } from '../utils/verifyProductImportTasnif';
import {
  applyMarkup,
  buildEditableRows,
  isRowDuplicate,
  isRowInvalid,
  isRowNew,
  parseMoneyInput,
  parsePercentInput,
} from '../../../utils/productImportUtils';

export function useProductImport(onClose) {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState('TO_CATALOG');
  const [source, setSource] = useState('UZ_INVOICE');
  const [step, setStep] = useState('setup');
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [markupPercent, setMarkupPercent] = useState(0);
  const [markupInput, setMarkupInput] = useState('0');
  const [defaultCategoryId, setDefaultCategoryId] = useState('');
  const [defaultStoreId, setDefaultStoreId] = useState('');
  const [defaultStorageLocation, setDefaultStorageLocation] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [paymentType, setPaymentType] = useState('CASH');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [editable, setEditable] = useState({});
  const [visibleColumns, setVisibleColumns] = useState(() => loadProductImportColumnVisibility());
  const [tasnifByRow, setTasnifByRow] = useState({});
  const [tasnifFilter, setTasnifFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PRODUCT_IMPORT_DEFAULT_PAGE_SIZE);
  const [verifyingTasnif, setVerifyingTasnif] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState({ done: 0, total: 0 });
  const fileRef = useRef(null);
  const verifyGenRef = useRef(0);

  const pickFile = () => fileRef.current?.click();

  const previewOptions = () => ({
    defaultStorageLocation: defaultStorageLocation.trim() || undefined,
  });

  const applyTasnifToEditable = useCallback((byRow) => {
    setEditable((prev) => {
      const next = { ...prev };
      Object.entries(byRow || {}).forEach(([rowNumKey, result]) => {
        const rowNum = Number(rowNumKey);
        if (!next[rowNum] || result?.status !== 'found') return;
        const fromTasnif = String(result.barcode || '').trim();
        const existing = String(next[rowNum].barcode || '').trim();
        next[rowNum] = {
          ...next[rowNum],
          ikpu: result.ikpu || next[rowNum].ikpu || '',
          // В фактуре часто нет штрихкода — берём из тасниф, если нашёлся
          barcode: fromTasnif || existing,
          packageCode: result.packageCode || next[rowNum].packageCode || '',
          markedProduct:
            result.markedProduct != null
              ? Boolean(result.markedProduct)
              : (next[rowNum].markedProduct ?? false),
          ikpuStatus: 'FOUND',
        };
      });
      return next;
    });
  }, []);

  const runTasnifVerify = useCallback(
    async (rows) => {
      const list = rows ?? [];
      if (!list.length) {
        setTasnifByRow({});
        return;
      }
      const gen = ++verifyGenRef.current;
      setVerifyingTasnif(true);
      setVerifyProgress({ done: 0, total: list.filter((r) => isRowNew(r)).length });
      try {
        const lang = (i18n.language || 'ru').slice(0, 2);
        const byRow = await verifyProductImportRowsTasnif(list, {
          lang,
          onProgress: (map, done, total) => {
            if (gen !== verifyGenRef.current) return;
            setTasnifByRow(map);
            if (done != null) setVerifyProgress({ done, total });
          },
        });
        if (gen !== verifyGenRef.current) return;
        setTasnifByRow(byRow);
        applyTasnifToEditable(byRow);
      } catch {
        if (gen === verifyGenRef.current) {
          toast.error(t('products.import.tasnif.verifyFailed'));
        }
      } finally {
        if (gen === verifyGenRef.current) setVerifyingTasnif(false);
      }
    },
    [applyTasnifToEditable, i18n.language, t]
  );

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

  const syncMarkupField = (percent) => {
    setMarkupPercent(percent);
    setMarkupInput(String(percent));
  };

  const onMarkupInputChange = (raw) => {
    setMarkupInput(raw);
    const parsed = parsePercentInput(raw);
    if (parsed != null) setMarkupPercent(parsed);
  };

  const onMarkupInputBlur = () => {
    const parsed = parsePercentInput(markupInput);
    if (parsed == null) {
      setMarkupInput(String(markupPercent));
      return;
    }
    syncMarkupField(parsed);
  };

  const applyMarkupPreset = (percent) => {
    syncMarkupField(percent);
    setEditable((prev) => {
      const next = { ...prev };
      (preview?.rows ?? []).forEach((r) => {
        if (!isRowNew(r) || !next[r.rowNum]) return;
        next[r.rowNum] = {
          ...next[r.rowNum],
          importPrice: applyMarkup(r.fileSellingPrice, percent),
        };
      });
      return next;
    });
  };

  const applyMarkupToAll = () => {
    setEditable((prev) => {
      const next = { ...prev };
      (preview?.rows ?? []).forEach((r) => {
        if (!isRowNew(r) || !next[r.rowNum]) return;
        next[r.rowNum] = {
          ...next[r.rowNum],
          importPrice: applyMarkup(r.fileSellingPrice, markupPercent),
        };
      });
      return next;
    });
  };

  const setRowPrice = (rowNum, raw) => {
    const parsed = parseMoneyInput(raw);
    setEditable((prev) => ({
      ...prev,
      [rowNum]: { ...prev[rowNum], importPrice: parsed ?? prev[rowNum]?.importPrice },
    }));
  };

  const setRowCategory = (rowNum, categoryId) => {
    setEditable((prev) => ({
      ...prev,
      [rowNum]: { ...prev[rowNum], categoryId },
    }));
  };

  const applyDefaultCategoryToAll = () => {
    if (!defaultCategoryId) return;
    setEditable((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[key] = { ...next[key], categoryId: defaultCategoryId };
      });
      return next;
    });
  };

  const setRowStore = (rowNum, storeId) => {
    setEditable((prev) => ({
      ...prev,
      [rowNum]: { ...prev[rowNum], storeId },
    }));
  };

  const applyDefaultStoreToAll = () => {
    if (!defaultStoreId) return;
    setEditable((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[key] = { ...next[key], storeId: defaultStoreId };
      });
      return next;
    });
  };

  const setRowStorageLocation = (rowNum, storageLocation) => {
    setEditable((prev) => ({
      ...prev,
      [rowNum]: { ...prev[rowNum], storageLocation },
    }));
  };

  const setRowBarcode = (rowNum, barcode) => {
    setEditable((prev) => ({
      ...prev,
      [rowNum]: { ...prev[rowNum], barcode },
    }));
  };

  const setRowIkpu = (rowNum, ikpu) => {
    setEditable((prev) => ({
      ...prev,
      [rowNum]: { ...prev[rowNum], ikpu },
    }));
  };

  const setRowMarkedProduct = (rowNum, markedProduct) => {
    setEditable((prev) => ({
      ...prev,
      [rowNum]: { ...prev[rowNum], markedProduct: Boolean(markedProduct) },
    }));
  };

  const applyDefaultLocationToAll = () => {
    const loc = defaultStorageLocation.trim();
    if (!loc) return;
    setEditable((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[key] = { ...next[key], storageLocation: loc };
      });
      return next;
    });
  };

  const toggleColumn = (id) => {
    setVisibleColumns((prev) => {
      const def = { ...prev, [id]: !prev[id] };
      if (id === 'rowNum') def.rowNum = true;
      saveProductImportColumnVisibility(def);
      return def;
    });
  };

  const rows = preview?.rows ?? [];
  const filteredRows =
    tasnifFilter === 'all'
      ? rows
      : rows.filter((r) => classifyProductImportTasnif(r, tasnifByRow[r.rowNum]) === tasnifFilter);

  const setTasnifFilterAndResetPage = (next) => {
    setTasnifFilter(next);
    setPage(1);
  };

  const setPageSizeAndReset = (size) => {
    setPageSize(size);
    setPage(1);
  };

  const pageSlice = useMemo(
    () => sliceImportPage(filteredRows, page, pageSize),
    [filteredRows, page, pageSize]
  );

  const canImport = rows.some((r) => isRowNew(r));
  const allDuplicates =
    rows.length > 0 && rows.every((r) => isRowDuplicate(r) || isRowInvalid(r)) && !canImport;

  const runImport = async () => {
    if (!pendingFile) return;
    // Магазин нужен только для прихода; «в каталог» — карточки без остатка.
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
    t,
    mode,
    setMode,
    source,
    setSource,
    step,
    setStep,
    preview,
    importing,
    fileRef,
    markupInput,
    defaultCategoryId,
    setDefaultCategoryId,
    defaultStoreId,
    setDefaultStoreId,
    defaultStorageLocation,
    setDefaultStorageLocation,
    supplierId,
    setSupplierId,
    paymentType,
    setPaymentType,
    receiptNotes,
    setReceiptNotes,
    editable,
    rows: pageSlice.pageRows,
    allRows: rows,
    filteredCount: filteredRows.length,
    canImport,
    allDuplicates,
    visibleColumns,
    toggleColumn,
    tasnifByRow,
    tasnifFilter,
    setTasnifFilter: setTasnifFilterAndResetPage,
    page: pageSlice.page,
    totalPages: pageSlice.totalPages,
    pageSize,
    pageFrom: pageSlice.from,
    pageTo: pageSlice.to,
    setPage,
    setPageSize: setPageSizeAndReset,
    verifyingTasnif,
    verifyProgress,
    runTasnifVerify: () => runTasnifVerify(preview?.rows ?? []),
    pickFile,
    onFile,
    onMarkupInputChange,
    onMarkupInputBlur,
    applyMarkupPreset,
    applyMarkupToAll,
    applyDefaultCategoryToAll,
    applyDefaultStoreToAll,
    applyDefaultLocationToAll,
    refreshPreview,
    setRowPrice,
    setRowCategory,
    setRowStore,
    setRowStorageLocation,
    setRowBarcode,
    setRowIkpu,
    setRowMarkedProduct,
    runImport,
  };
}
