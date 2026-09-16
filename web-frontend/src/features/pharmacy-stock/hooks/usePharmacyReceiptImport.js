import { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { pharmacyWarehouseApi } from '../../../api';

const ROLE_KEYS = [
  'SKIP', 'NAME', 'MANUFACTURER', 'COUNTRY', 'QTY', 'BATCH', 'EXPIRY',
  'PURCHASE', 'PURCHASE_WITH_VAT', 'VAT_RATE', 'RETAIL', 'BARCODE', 'IKPU', 'UNITS_IN_PACK',
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
      (data.columns ?? []).forEach((col) => {
        if (col.suggestedRole && col.suggestedRole !== 'SKIP') {
          nextRoles[col.index] = col.suggestedRole;
        } else {
          nextRoles[col.index] = 'SKIP';
        }
      });
      setParse(data);
      setRoles(nextRoles);
      setUseFinalSums(false);
      setItems([]);
      setQuery('');
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
      setItems(data.items ?? []);
      setStep('match');
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('pharmacyStock.importFailed'));
    } finally {
      setBusy(false);
    }
  };

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => (
      String(item.excelName || '').toLowerCase().includes(q)
      || String(item.message || '').toLowerCase().includes(q)
    ));
  }, [items, query]);

  const confirm = async () => {
    if (invoiceAlreadyImported) {
      toast.error(t('pharmacyStock.importInvoiceAlreadyImported', { id: invoiceId }));
      return;
    }
    const payload = items.filter((item) => item.status !== 'DUPLICATE');
    if (!payload.length) {
      toast.error(t('pharmacyStock.importNothing'));
      return;
    }
    setBusy(true);
    try {
      const { data } = await pharmacyWarehouseApi.importConfirm(receiptId, {
        uzInvoiceDocumentId: invoiceId || undefined,
        items: payload.map((item) => ({
          rowIndex: item.rowIndex,
          createIfMissing: true,
          excelName: item.excelName,
          manufacturer: item.manufacturer,
          country: item.country,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          vatPercent: item.vatPercent,
          retailPrice: item.retailPrice,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          barcode: item.barcode,
          ikpu: item.ikpu,
          unitsInPack: item.unitsInPack,
        })),
      });
      toast.success(t('pharmacyStock.importSaved', { count: payload.length }));
      close();
      onImported?.(data);
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('pharmacyStock.importFailed'));
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setStep(null);
    setParse(null);
    setItems([]);
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
    setRole: (index, role) => setRoles((prev) => ({ ...prev, [index]: role })),
    useFinalSums,
    setUseFinalSums,
    continueMatch,
    items: filteredItems,
    query,
    setQuery,
    confirm,
    close,
    roleKeys: ROLE_KEYS,
    invoiceId,
    invoiceAlreadyImported,
  };
}
