import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useCartStore } from '../../../store/cartStore';
import { isPharmacyMarkingCode, normalizePharmacyMarkingCode } from '../utils/pharmacyMarkingCode';
import { preserveMarkingCodeForFiscal } from '../utils/preserveMarkingCodeForFiscal';
import { assessPharmacyMarkLifecycle } from '../utils/pharmacyMarkLifecycle';
import { markingIdentityKeys } from '../utils/pharmacyMarkIdentity';
import { resolveCashierMarkedProduct } from '../utils/resolveCashierMarkedProduct';
import { resolveMarkingVerifyUserMessage } from '../utils/resolveMarkingVerifyUserMessage';

/**
 * Скан / вставка КМ из поля поиска — та же логика, что модалка ASL.
 */
export function usePharmacyMarkingScan({
  storeId,
  aslMarkingEnabled,
  products,
  onProductFound,
}) {
  const { t } = useTranslation();
  const [lastScan, setLastScan] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const pendingRef = useRef(new Set());
  const queueRef = useRef([]);
  const runningRef = useRef(false);

  const processOne = useCallback(async (rawCode, { silent = false } = {}) => {
    const code = normalizePharmacyMarkingCode(rawCode);
    if (!code || !isPharmacyMarkingCode(rawCode)) return;

    const mark = preserveMarkingCodeForFiscal(rawCode);
    const keys = markingIdentityKeys(mark);
    const cartItems = useCartStore.getState().items;

    const before = assessPharmacyMarkLifecycle({
      rawCode: mark,
      cartItems,
      pendingKeys: [...pendingRef.current],
      storeId,
    });

    if (before.status === 'duplicate') {
      if (!silent) toast.error(t('pharmacyCashier.integrations.markingAlreadyCounted'));
      return;
    }
    if (before.status === 'sold') {
      if (!silent) toast.error(t('pharmacyCashier.integrations.markingAlreadySold'));
      return;
    }

    keys.forEach((k) => pendingRef.current.add(k));
    setVerifying(true);

    try {
      const resolved = await resolveCashierMarkedProduct({
        products,
        rawCode: mark,
        storeId,
        aslEnabled: Boolean(aslMarkingEnabled),
      });

      const afterDup = assessPharmacyMarkLifecycle({
        rawCode: mark,
        cartItems: useCartStore.getState().items,
        pendingKeys: [...pendingRef.current].filter((k) => !keys.includes(k)),
        aslResult: resolved.aslResult,
        storeId,
      });

      if (afterDup.status === 'duplicate') {
        if (!silent) toast.error(t('pharmacyCashier.integrations.markingAlreadyCounted'));
        return;
      }

      if (resolved.status === 'sold' || afterDup.status === 'sold') {
        if (!silent) toast.error(t('pharmacyCashier.integrations.markingAlreadySold'));
        setLastScan({ code: mark, result: resolved.aslResult, product: resolved.product });
        return;
      }

      if (resolved.status === 'ok' && resolved.product) {
        const result = onProductFound?.(resolved.product);
        setLastScan({ code: mark, result: resolved.aslResult, product: resolved.product });
        if (result?.status === 'duplicate' && !silent) {
          toast.error(t('pharmacyCashier.integrations.markingAlreadyCounted'));
        }
        return;
      }

      setLastScan({ code: mark, result: resolved.aslResult, product: null });
      if (!silent) {
        toast.error(resolveMarkingVerifyUserMessage({
          aslEnabled: Boolean(aslMarkingEnabled),
          aslResult: resolved.aslResult,
          aslError: resolved.aslError,
          t,
        }));
      }
    } finally {
      keys.forEach((k) => pendingRef.current.delete(k));
      setVerifying(false);
    }
  }, [aslMarkingEnabled, onProductFound, products, storeId, t]);

  const drain = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      while (queueRef.current.length > 0) {
        const job = queueRef.current.shift();
        await processOne(job.rawCode, job.opts);
      }
    } finally {
      runningRef.current = false;
    }
  }, [processOne]);

  const tryHandleMarkingScan = useCallback((rawCode, opts = {}) => {
    const code = normalizePharmacyMarkingCode(rawCode);
    if (!code || !isPharmacyMarkingCode(rawCode)) return false;
    queueRef.current.push({ rawCode, opts });
    void drain();
    return true;
  }, [drain]);

  const clearLastScan = useCallback(() => setLastScan(null), []);

  return {
    lastScan,
    verifying,
    tryHandleMarkingScan,
    clearLastScan,
  };
}
