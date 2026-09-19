import { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { pharmacyWarehouseApi } from '../../../api';
import { savePendingImportMarks } from '../utils/pharmacyReceiptPendingMarksStore';
import {
  classifyPharmacyImportMatch,
  defaultImportMatchSelected,
} from '../utils/classifyPharmacyImportMatch';
import { toPharmacyImportConfirmItem } from '../utils/toPharmacyImportConfirmItem';

const ROLE_KEYS = [
  'SKIP', 'NAME', 'MANUFACTURER', 'COUNTRY', 'QTY', 'BATCH', 'EXPIRY',
  'PURCHASE', 'PURCHASE_WITH_VAT', 'VAT_RATE', 'RETAIL', 'BARCODE', 'IKPU', 'UNITS_IN_PACK',
  'MARK_CODES', 'PRESCRIPTION',
];

export function usePharmacyReceiptImport({ receiptId, t, onImported }) {
  const fileRef = useRef(null);
  const [step, setStep] = useState(null);
  const [busy, setBusy] = useState(false);
  const [parse, setParse] = useState(null);
  const [roles, setRoles] = useState({});
  const [useFinalSums, setUseFinalSums] = useState(false);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [matchFilter, setMatchFilter] = useState('all');
  const [invoiceId, setInvoiceId] = useState(null);
  const [invoiceAlreadyImported, setInvoiceAlreadyImported] = useState(false);

  const openFile = () => fileRef.current?.click();

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const { data } = await pharmacyWarehouseApi.importParse(receiptId, file);
      const nextRoles = {};
      const used = new Set();
      (data.columns ?? []).forEach((col) => {
        const suggested = col.suggestedRole;
        if (suggested && suggested !== 'SKIP' && !used.has(suggested)) {
          nextRoles[col.index] = suggested;
          used.add(suggested);
        } else {
          nextRoles[col.index] = 'SKIP';
        }
      });
      setParse(data);
      setRoles(nextRoles);
      setUseFinalSums(false);
      setItems([]);
      setQuery('');
      setMatchFilter('all');
      setInvoiceId(data.uzInvoiceDocumentId || null);
      setInvoiceAlreadyImported(Boolean(data.invoiceAlreadyImported));
      setStep('columns');
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('pharmacyStock.importFailed'));
    } finally {
      setBusy(false);
    }
  };

  const roleMap = () => {
    const map = {};
    Object.entries(roles).forEach(([index, role]) => {
      if (role && role !== 'SKIP') map[role] = Number(index);
    });
    return map;
  };

  const continueMatch = async () => {
    const mapped = roleMap();
    if (mapped.NAME == null) {
      toast.error(t('pharmacyStock.importNeedName'));
      return;
    }
    setBusy(true);
    try {
      const { data } = await pharmacyWarehouseApi.importMatch(receiptId, {
        roles: mapped,
        rows: parse?.rows ?? [],
        useFinalSums,
        uzInvoiceDocumentId: invoiceId || parse?.uzInvoiceDocumentId || undefined,
      });
      setInvoiceId(data.uzInvoiceDocumentId || invoiceId);
      setInvoiceAlreadyImported(Boolean(data.invoiceAlreadyImported));
      setItems((data.items ?? []).map((item) => ({
        ...item,
        selected: defaultImportMatchSelected(item),
      })));
      setMatchFilter('all');
      setStep('match');
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('pharmacyStock.importFailed'));
    } finally {
      setBusy(false);
    }
  };

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const tone = classifyPharmacyImportMatch(item);
      if (matchFilter !== 'all' && tone !== matchFilter) return false;
      if (!q) return true;
      return String(item.excelName || '').toLowerCase().includes(q)
        || String(item.message || '').toLowerCase().includes(q);
    });
  }, [items, query, matchFilter]);

  const setRowsSelected = (rowIndexes, selected) => {
    const ids = new Set(rowIndexes);
    setItems((prev) => prev.map((item) => (
      ids.has(item.rowIndex) && classifyPharmacyImportMatch(item) !== 'duplicate'
        ? { ...item, selected }
        : item
    )));
  };

  const confirm = async () => {
    if (invoiceAlreadyImported) {
      toast.error(t('pharmacyStock.importInvoiceAlreadyImported', { id: invoiceId }));
      return;
    }
    const payload = items.filter((item) => (
      item.selected && item.status !== 'DUPLICATE'
    ));
    if (!payload.length) {
      toast.error(t('pharmacyStock.importMatch.needSelected'));
      return;
    }
    const withQty = payload.filter((item) => Number(item.quantity) > 0);
    if (!withQty.length) {
      toast.error(t('pharmacyStock.importNeedQty'));
      return;
    }
    setBusy(true);
    try {
      const body = withQty.map(toPharmacyImportConfirmItem);
      const chunkSize = 80;
      for (let i = 0; i < body.length; i += chunkSize) {
        const chunk = body.slice(i, i + chunkSize);
        await pharmacyWarehouseApi.importConfirm(receiptId, {
          uzInvoiceDocumentId: invoiceId || undefined,
          items: chunk,
        });
        const savedIds = chunk.map((item) => item.rowIndex);
        setItems((prev) => prev.filter((item) => !savedIds.includes(item.rowIndex)));
      }
      savePendingImportMarks(receiptId, withQty);
      const hasMarks = withQty.some((item) => Array.isArray(item.markCodes) && item.markCodes.length > 0);
      toast.success(
        hasMarks
          ? t('pharmacyStock.importSavedWithMarks', { count: withQty.length })
          : t('pharmacyStock.importSaved', { count: withQty.length }),
      );
      close();
      const fresh = await pharmacyWarehouseApi.getReceipt(receiptId);
      onImported?.(fresh.data, { goToDocument: true, hasImportMarks: hasMarks });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || t('pharmacyStock.importFailed'));
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setStep(null);
    setParse(null);
    setItems([]);
    setQuery('');
    setMatchFilter('all');
    setInvoiceId(null);
    setInvoiceAlreadyImported(false);
  };

  return {
    fileRef,
    openFile,
    onFile,
    step,
    busy,
    parse,
    roles,
    setRole: (index, role) => setRoles((prev) => {
      const next = { ...prev };
      if (role && role !== 'SKIP') {
        Object.keys(next).forEach((key) => {
          if (String(key) !== String(index) && next[key] === role) next[key] = 'SKIP';
        });
      }
      next[index] = role;
      return next;
    }),
    useFinalSums,
    setUseFinalSums,
    continueMatch,
    items: filteredItems,
    matchAllItems: items,
    query,
    setQuery,
    patchItem: (rowIndex, patch) => setItems((prev) => prev.map((item) => (
      item.rowIndex === rowIndex ? { ...item, ...patch } : item
    ))),
    toggleSelected: (rowIndex) => setItems((prev) => prev.map((item) => (
      item.rowIndex === rowIndex && classifyPharmacyImportMatch(item) !== 'duplicate'
        ? { ...item, selected: !item.selected }
        : item
    ))),
    setVisibleSelected: (selected) => setRowsSelected(
      filteredItems.map((item) => item.rowIndex),
      selected,
    ),
    selectFound: () => setItems((prev) => prev.map((item) => {
      const tone = classifyPharmacyImportMatch(item);
      if (tone === 'duplicate') return item;
      return { ...item, selected: tone === 'found' || tone === 'partial' };
    })),
    selectAll: () => setRowsSelected(items.map((item) => item.rowIndex), true),
    clearSelected: () => setRowsSelected(items.map((item) => item.rowIndex), false),
    matchFilter,
    setMatchFilter,
    confirm,
    close,
    roleKeys: ROLE_KEYS,
    invoiceId,
    invoiceAlreadyImported,
  };
}
