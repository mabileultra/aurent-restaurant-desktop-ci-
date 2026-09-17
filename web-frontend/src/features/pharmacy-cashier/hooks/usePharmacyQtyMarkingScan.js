import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner';
import { useCartStore } from '../../../store/cartStore';
import { assessQtyMarkingScan } from '../utils/pharmacyQtyMarkingScan';
import { preserveMarkingCodeForFiscal } from '../utils/preserveMarkingCodeForFiscal';

const REPEAT_SILENCE_MS = 400;

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
  const runningRef = useRef(false);
  const seenAtRef = useRef(new Map());
  const [scans, setScans] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const enabled = Boolean(open && product?.markedProduct);

  const reset = useCallback(() => {
    scansRef.current = [];
    queueRef.current = [];
    seenAtRef.current = new Map();
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
    const now = Date.now();
    const preview = assessQtyMarkingScan({
      product,
      rawCode,
      scans: scansRef.current,
      cartItems: useCartStore.getState().items,
      stockPacks,
    });
    if (preview.key) {
      const prev = seenAtRef.current.get(preview.key) || 0;
      seenAtRef.current.set(preview.key, now);
      if (now - prev < REPEAT_SILENCE_MS) return;
    }
    if (preview.status === 'duplicate' || preview.status === 'stock' || preview.status === 'not-marking') {
      reject(preview.status);
      return;
    }

    let aslResult = null;
    if (aslMarkingEnabled) {
      if (!storeId) {
        reject('not-found', t('pharmacyCashier.integrations.markingApiDisabled'));
        return;
      }
      try {
        const { data } = await pharmacyIntegrationApi.verifyMarking({
          storeId,
          code: preserveMarkingCodeForFiscal(rawCode),
        });
        aslResult = data;
      } catch (err) {
        reject('not-found', err.response?.data?.message ?? err.message);
        return;
      }
    }

    const decision = assessQtyMarkingScan({
      product,
      rawCode,
      scans: scansRef.current,
      cartItems: useCartStore.getState().items,
      stockPacks,
      aslResult,
    });
    if (decision.status !== 'accepted') {
      reject(decision.status);
      return;
    }
    const next = [...scansRef.current, decision];
    scansRef.current = next;
    setScans(next);
    setError('');
  }, [aslMarkingEnabled, product, reject, stockPacks, storeId, t]);

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
