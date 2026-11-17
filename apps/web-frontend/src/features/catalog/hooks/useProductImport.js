import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { classifyProductImportTasnif } from '../utils/classifyProductImportTasnif';
import {
  loadProductImportColumnVisibility,
  saveProductImportColumnVisibility,
} from '../utils/productImportColumns';
import {
  PRODUCT_IMPORT_DEFAULT_PAGE_SIZE,
  sliceImportPage,
} from '../utils/productImportPagination';
import { isRowDuplicate, isRowInvalid, isRowNew } from '../../../utils/productImportUtils';
import { useProductImportTasnif } from './useProductImportTasnif';
import { useProductImportRows } from './useProductImportRows';
import { useProductImportExecution } from './useProductImportExecution';

export function useProductImport(onClose) {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState('TO_CATALOG');
  const [source, setSource] = useState('UZ_INVOICE');
  const [step, setStep] = useState('setup');
  const [preview, setPreview] = useState(null);
  const [defaultCategoryId, setDefaultCategoryId] = useState('');
  const [defaultStoreId, setDefaultStoreId] = useState('');
  const [defaultStorageLocation, setDefaultStorageLocation] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [paymentType, setPaymentType] = useState('CASH');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(() => loadProductImportColumnVisibility());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PRODUCT_IMPORT_DEFAULT_PAGE_SIZE);

  const rowsMgr = useProductImportRows({
    preview,
    defaultCategoryId,
    defaultStoreId,
    defaultStorageLocation,
  });

  const tasnif = useProductImportTasnif({
    i18n,
    t,
    setEditable: rowsMgr.setEditable,
    setPage,
  });

  const exec = useProductImportExecution({
    mode,
    source,
    defaultCategoryId,
    defaultStoreId,
    defaultStorageLocation,
    supplierId,
    paymentType,
    receiptNotes,
    markupPercent: rowsMgr.markupPercent,
    setPreview,
    setEditable: rowsMgr.setEditable,
    setTasnifByRow: tasnif.setTasnifByRow,
    setTasnifFilter: tasnif.setTasnifFilter,
    setPage,
    setStep,
    runTasnifVerify: tasnif.runTasnifVerify,
    onClose,
    t,
  });

  const toggleColumn = (id) => {
    setVisibleColumns((prev) => {
      const def = { ...prev, [id]: !prev[id] };
      if (id === 'rowNum') def.rowNum = true;
      if (id === 'ikpu') def.ikpu = true;
      saveProductImportColumnVisibility(def);
      return def;
    });
  };

  const rows = preview?.rows ?? [];
  const filteredRows =
    tasnif.tasnifFilter === 'all'
      ? rows
      : rows.filter((r) => classifyProductImportTasnif(r, tasnif.tasnifByRow[r.rowNum]) === tasnif.tasnifFilter);

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

  return {
    t,
    mode,
    setMode,
    source,
    setSource,
    step,
    setStep,
    preview,
    importing: exec.importing,
    fileRef: exec.fileRef,
    markupInput: rowsMgr.markupInput,
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
    editable: rowsMgr.editable,
    rows: pageSlice.pageRows,
    allRows: rows,
    filteredCount: filteredRows.length,
    canImport,
    allDuplicates,
    visibleColumns,
    toggleColumn,
    tasnifByRow: tasnif.tasnifByRow,
    tasnifFilter: tasnif.tasnifFilter,
    setTasnifFilter: tasnif.setTasnifFilter,
    page: pageSlice.page,
    totalPages: pageSlice.totalPages,
    pageSize,
    pageFrom: pageSlice.from,
    pageTo: pageSlice.to,
    setPage,
    setPageSize: setPageSizeAndReset,
    verifyingTasnif: tasnif.verifyingTasnif,
    verifyProgress: tasnif.verifyProgress,
    runTasnifVerify: () => tasnif.runTasnifVerify(preview?.rows ?? []),
    pickFile: exec.pickFile,
    onFile: exec.onFile,
    onMarkupInputChange: rowsMgr.onMarkupInputChange,
    onMarkupInputBlur: rowsMgr.onMarkupInputBlur,
    applyMarkupPreset: rowsMgr.applyMarkupPreset,
    applyMarkupToAll: rowsMgr.applyMarkupToAll,
    applyDefaultCategoryToAll: rowsMgr.applyDefaultCategoryToAll,
    applyDefaultStoreToAll: rowsMgr.applyDefaultStoreToAll,
    applyDefaultLocationToAll: rowsMgr.applyDefaultLocationToAll,
    refreshPreview: exec.refreshPreview,
    setRowQuantity: rowsMgr.setRowQuantity,
    setRowQuantityValue: rowsMgr.setRowQuantityValue,
    setRowPrice: rowsMgr.setRowPrice,
    setRowCategory: rowsMgr.setRowCategory,
    setRowStore: rowsMgr.setRowStore,
    setRowStorageLocation: rowsMgr.setRowStorageLocation,
    setRowBarcode: rowsMgr.setRowBarcode,
    setRowIkpu: rowsMgr.setRowIkpu,
    setRowMarkedProduct: rowsMgr.setRowMarkedProduct,
    runImport: () => exec.runImport({ rows, editable: rowsMgr.editable, canImport }),
  };
}
