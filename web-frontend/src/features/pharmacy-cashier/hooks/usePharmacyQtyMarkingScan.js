import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner';
import { useCartStore } from '../../../store/cartStore';
import { assessQtyMarkingScan } from '../utils/pharmacyQtyMarkingScan';
import { preserveMarkingCodeForFiscal } from '../utils/preserveMarkingCodeForFiscal';

export function usePharmacyQtyMarkingScan({
  open,
  product,
  storeId,
  aslMarkingEnabled,
  stockPacks,
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const scansRef = useRef([]);
  const queueRef = useRef([]);
  const pendingRef = useRef(new Set());
  const runningRef = useRef(false);
  const [scans, setScans] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  // Скан КМ всегда активен в модалке «Добавить в чек» —
  // иначе при markedProduct=false в каталоге панель не появляется.
  const enabled = Boolean(open && product);

  const reset = useCallback(() => {
    scansRef.current = [];
    queueRef.current = [];
    pendingRef.current = new Set();
    setScans([]);
    setError('');
    setVerifying(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      reset();
      return undefined;
    }
    reset();
    return undefined;
  }, [enabled, product?.id, reset]);

  const reject = useCallback((status, detail) => {
    const message = detail || {
      duplicate: t('pharmacyCashier.integrations.markingAlreadyCounted'),
      sold: t('pharmacyCashier.integrations.markingAlreadySold'),
      'not-found': t('pharmacyCashier.integrations.markingNotFound'),
      mismatch: t('pharmacyCashier.markingScan.mismatch'),
      stock: t('pharmacyCashier.qtyExceedsStock'),
      'not-marking': t('pharmacyCashier.markingScan.notACode'),
    }[status];
    if (!message) return;
    setError(message);
    toast.error(message);
  }, [t]);

  const handleOne = useCallback(async (rawCode) => {
    const pendingKeys = [...pendingRef.current];
    // 1) Локальный GTIN без ASL — если совпал, код уже «наш».
    const preview = assessQtyMarkingScan({
      product,
      rawCode,
      scans: scansRef.current,
      cartItems: useCartStore.getState().items,
      stockPacks,
      pendingKeys,
    });

    if (preview.status === 'duplicate' || preview.status === 'stock' || preview.status === 'not-marking') {
      reject(preview.status);
      return;
    }

    // Чужой GTIN уже виден в КМ — ASL не нужен, сразу mismatch.
    if (preview.status === 'mismatch') {
      reject(preview.status);
      return;
    }

    if (preview.key) pendingRef.current.add(preview.key);

    let aslResult = null;
    if (aslMarkingEnabled && storeId) {
      try {
        const { data } = await pharmacyIntegrationApi.verifyMarking({
          storeId,
          code: preserveMarkingCodeForFiscal(rawCode),
        });
        aslResult = data;
      } catch {
        // ASL недоступен: локальный GTIN уже совпал — принимаем.
        aslResult = null;
      }
    }

    const decision = assessQtyMarkingScan({
      product,
      rawCode,
      scans: scansRef.current,
      cartItems: useCartStore.getState().items,
      stockPacks,
      aslResult,
      pendingKeys: [...pendingRef.current].filter((k) => k !== preview.key),
    });

    if (decision.status !== 'accepted') {
      pendingRef.current.delete(preview.key);
      reject(decision.status);
      return;
    }

    const next = [...scansRef.current, decision];
    scansRef.current = next;
    pendingRef.current.delete(decision.key);
    setScans(next);
    setError('');
  }, [aslMarkingEnabled, product, reject, stockPacks, storeId]);

  const drain = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setVerifying(true);
    try {
      while (queueRef.current.length > 0) {
        const raw = queueRef.current.shift();
        await handleOne(raw);
      }
    } finally {
      runningRef.current = false;
      setVerifying(false);
      inputRef.current?.focus();
    }
  }, [handleOne]);

  const enqueue = useCallback((rawCode) => {
    const trimmed = String(rawCode || '').trim();
    if (!trimmed || !enabled) return;
    queueRef.current.push(trimmed);
    if (inputRef.current) inputRef.current.value = '';
    drain();
  }, [drain, enabled]);

  useBarcodeScanner({
    enabled,
    barcodeInputRef: inputRef,
    alwaysCapture: true,
    onScan: enqueue,
  });

  const removeScan = useCallback((key) => {
    const next = scansRef.current.filter((scan) => scan.key !== key);
    scansRef.current = next;
    pendingRef.current.delete(key);
    setScans(next);
    setError('');
    inputRef.current?.focus();
  }, []);

  return {
    scans,
    verifying,
    error,
    inputRef,
    enqueue,
    removeScan,
  };
}
