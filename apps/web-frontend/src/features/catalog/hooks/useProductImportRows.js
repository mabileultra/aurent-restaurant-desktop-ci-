import { useState } from 'react';
import { bumpImportQty } from '../../../utils/productImportQty';
import {
  parseMoneyInput,
  parsePercentInput,
} from '../../../utils/productImportUtils';
import {
  applyFieldToAllRows,
  applyMarkupToRows,
} from '../utils/productImportRowBatchHelpers';

export function useProductImportRows({
  preview,
  defaultCategoryId,
  defaultStoreId,
  defaultStorageLocation,
}) {
  const [editable, setEditable] = useState({});
  const [markupPercent, setMarkupPercent] = useState(0);
  const [markupInput, setMarkupInput] = useState('0');

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
    setEditable((prev) => applyMarkupToRows(prev, preview?.rows, percent));
  };

  const applyMarkupToAll = () => {
    setEditable((prev) => applyMarkupToRows(prev, preview?.rows, markupPercent));
  };

  const setRowQuantity = (rowNum, direction) => {
    const row = (preview?.rows ?? []).find((r) => r.rowNum === rowNum);
    setEditable((prev) => ({
      ...prev,
      [rowNum]: {
        ...prev[rowNum],
        quantity: bumpImportQty(prev[rowNum]?.quantity, row, direction),
      },
    }));
  };

  const setRowQuantityValue = (rowNum, raw) => {
    const cleaned = String(raw ?? '').replace(/\s/g, '').replace(',', '.');
    if (cleaned === '' || cleaned === '.') {
      setEditable((prev) => ({
        ...prev,
        [rowNum]: { ...prev[rowNum], quantity: cleaned === '.' ? '0.' : '' },
      }));
      return;
    }
    if (!/^\d*\.?\d*$/.test(cleaned)) return;
    setEditable((prev) => ({
      ...prev,
      [rowNum]: { ...prev[rowNum], quantity: cleaned },
    }));
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
    setEditable((prev) => applyFieldToAllRows(prev, 'categoryId', defaultCategoryId));
  };

  const setRowStore = (rowNum, storeId) => {
    setEditable((prev) => ({
      ...prev,
      [rowNum]: { ...prev[rowNum], storeId },
    }));
  };

  const applyDefaultStoreToAll = () => {
    if (!defaultStoreId) return;
    setEditable((prev) => applyFieldToAllRows(prev, 'storeId', defaultStoreId));
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
    setEditable((prev) => applyFieldToAllRows(prev, 'storageLocation', loc));
  };

  return {
    editable,
    setEditable,
    markupPercent,
    markupInput,
    onMarkupInputChange,
    onMarkupInputBlur,
    applyMarkupPreset,
    applyMarkupToAll,
    setRowQuantity,
    setRowQuantityValue,
    setRowPrice,
    setRowCategory,
    setRowStore,
    setRowStorageLocation,
    setRowBarcode,
    setRowIkpu,
    setRowMarkedProduct,
    applyDefaultCategoryToAll,
    applyDefaultStoreToAll,
    applyDefaultLocationToAll,
  };
}
